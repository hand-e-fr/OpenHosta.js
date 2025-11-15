import { MetaPrompt, EMULATE_META_PROMPT, USER_CALL_META_PROMPT } from "../core/metaPrompt.js";
import type { HostaInspection } from "../core/inspection.js";
import { encodeFunction } from "../core/analyzer.js";
import { typeReturnedData } from "../core/typeConverter.js";
import {
  Model,
  ModelCapabilities,
  type Message,
  type MessageContent
} from "../models/baseModel.js";
import { isBinaryLike, binaryToDataUrl } from "../utils/image.js";

type MetaDialogEntry = {
  role: "system" | "user";
  metaPrompt: MetaPrompt;
  images?: string[];
};

function ensureLogs(inspection: HostaInspection): void {
  inspection.logs = inspection.logs ?? {};
}

function requireModel(inspection: HostaInspection): Model {
  if (!inspection.model) {
    throw new Error("Pipeline requires a model to be attached to the inspection.");
  }
  return inspection.model;
}

export abstract class Pipeline {
  model_list: Model[] = [];
  llm_args: Record<string, unknown> = {};

  abstract push(inspection: HostaInspection): Message[];
  abstract pull(inspection: HostaInspection, response: any): unknown;

  print_last_decoding(inspection: HostaInspection): void {
    const logs = inspection.logs ?? {};
    if ("rational" in logs) {
      console.log("[THINKING]");
      console.log(logs.rational);
    }
    if ("answer" in logs) {
      console.log("[ANSWER]");
      console.log(logs.answer);
    }
    if ("response_string" in logs) {
      console.log("[RESPONSE STRING]");
      console.log(logs.response_string);
    }
    if ("response_data" in logs) {
      console.log("[RESPONSE DATA]");
      console.log(logs.response_data);
    }
  }
}

interface OneTurnConversationPipelineInit {
  modelList: Model[];
  emulateMetaPrompt?: MetaPrompt;
  userCallMetaPrompt?: MetaPrompt;
}

export class OneTurnConversationPipeline extends Pipeline {
  emulate_meta_prompt: MetaPrompt;
  user_call_meta_prompt: MetaPrompt;
  image_size_limit = 1600;

  constructor({ modelList, emulateMetaPrompt, userCallMetaPrompt }: OneTurnConversationPipelineInit) {
    super();
    if (!modelList || modelList.length === 0) {
      throw new Error("You shall provide at least one model.");
    }

    this.model_list = modelList;
    this.emulate_meta_prompt = emulateMetaPrompt ? emulateMetaPrompt.copy() : EMULATE_META_PROMPT.copy();
    this.user_call_meta_prompt = userCallMetaPrompt ? userCallMetaPrompt.copy() : USER_CALL_META_PROMPT.copy();
  }

  private push_detect_missing_types(inspection: HostaInspection): HostaInspection {
    const analyse = inspection.analyse;
    if (!analyse.type) {
      analyse.type = "string";
    }
    for (const arg of analyse.args) {
      if (!arg.type) {
        arg.type = "string";
      }
    }
    return inspection;
  }

  private push_choose_model(): Model {
    return this.model_list[0];
  }

  private push_encode_inspected_data(
    inspection: HostaInspection,
    modelCapabilities: Set<ModelCapabilities>
  ): Record<string, unknown> {
    return encodeFunction(inspection.analyse, modelCapabilities);
  }

  private push_select_meta_prompts(inspection: HostaInspection): MetaDialogEntry[] {
    const images: string[] = [];

    for (const arg of inspection.analyse.args) {
      if (isBinaryLike(arg.value)) {
        images.push(binaryToDataUrl(arg.value, inspection.model?.preferred_image_format ?? "png"));
      }
    }

    return [
      { role: "system", metaPrompt: this.emulate_meta_prompt },
      { role: "user", metaPrompt: this.user_call_meta_prompt, images }
    ];
  }

  push(inspection: HostaInspection): Message[] {
    ensureLogs(inspection);
    this.push_detect_missing_types(inspection);
    const model = this.push_choose_model();
    inspection.model = model;
    inspection.pipeline = this;

    const metaMessages = this.push_select_meta_prompts(inspection);
    const encodedData = this.push_encode_inspected_data(inspection, model.capabilities);
    inspection.prompt_data = encodedData;

    const messages: Message[] = metaMessages.map(({ role, metaPrompt, images }) => {
      const content: MessageContent[] = [
        {
          type: "text",
          text: metaPrompt.render(encodedData)
        }
      ];
      if (images?.length) {
        for (const image of images) {
          content.push({
            type: "image_url",
            image_url: { url: image }
          });
        }
      }
      return { role, content };
    });

    inspection.logs.llm_api_messages_sent = messages;
    return messages;
  }

  private pull_extract_messages(inspection: HostaInspection, responseDict: any): string {
    inspection.logs.llm_api_response = responseDict;
    return requireModel(inspection).getResponseContent(responseDict) ?? "";
  }

  private pull_extract_data_section(inspection: HostaInspection, rawResponse: string): string {
    const { thinking, answer } = requireModel(inspection).getThinkingAndDataSections(rawResponse) ?? {
      thinking: "",
      answer: rawResponse
    };

    inspection.logs.rational += thinking;
    inspection.logs.answer += answer;

    let response = answer.trim();
    if (response.endsWith("```")) {
      const lines = response.split("\n");
      const fencePositions = lines.reduce<number[]>((acc: number[], line: string, idx: number) => {
        if (line.startsWith("```")) {
          acc.push(idx);
        }
        return acc;
      }, []);
      if (fencePositions.length >= 2) {
        const startFence = fencePositions[fencePositions.length - 2];
        const endFence = fencePositions[fencePositions.length - 1];
        const chunk = lines.slice(startFence + 1, endFence);
        response = chunk.join("\n");
      }
    }

    inspection.logs.clean_answer += response;
    return response;
  }

  private pull_type_data_section(inspection: HostaInspection, response: string): unknown {
    return typeReturnedData(response, inspection.analyse.type);
  }

  pull(inspection: HostaInspection, responseDict: any): unknown {
    ensureLogs(inspection);
    inspection.logs.rational = "";
    inspection.logs.answer = "";
    inspection.logs.clean_answer = "";

    const raw = this.pull_extract_messages(inspection, responseDict);

    if (
      responseDict?.choices?.[0]?.message &&
      "reasoning" in responseDict.choices[0].message &&
      typeof responseDict.choices[0].message.reasoning === "string"
    ) {
      inspection.logs.rational += responseDict.choices[0].message.reasoning;
    }

    const responseString = this.pull_extract_data_section(inspection, raw);
    inspection.logs.response_string = responseString;

    const responseData = this.pull_type_data_section(inspection, responseString);
    inspection.logs.response_data = responseData;

    return responseData;
  }
}
