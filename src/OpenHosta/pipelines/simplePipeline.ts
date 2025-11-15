import { MetaPrompt, EMULATE_META_PROMPT, USER_CALL_META_PROMPT } from "../core/metaPrompt.js";
import { OpenAICompatibleModel } from "../models/OpenAICompatibleModel.js";
import type { HostaInspection } from "../core/logger.js";

export abstract class Pipeline {
  model_list: OpenAICompatibleModel[] = [];
  llm_args: Record<string, unknown> = {};

  abstract push(inspection: HostaInspection): unknown;
  abstract pull(inspection: HostaInspection, response: unknown): unknown;

  print_last_decoding(inspection: HostaInspection): void {
    const logs = (inspection as Record<string, any>)?.logs ?? {};
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
  modelList: OpenAICompatibleModel[];
  emulateMetaPrompt?: MetaPrompt;
  userCallMetaPrompt?: MetaPrompt;
}

export class OneTurnConversationPipeline extends Pipeline {
  emulate_meta_prompt: MetaPrompt;
  user_call_meta_prompt: MetaPrompt;

  constructor({ modelList, emulateMetaPrompt, userCallMetaPrompt }: OneTurnConversationPipelineInit) {
    super();
    if (!modelList || modelList.length === 0) {
      throw new Error("You shall provide at least one model.");
    }

    this.model_list = modelList;
    this.emulate_meta_prompt = emulateMetaPrompt ? emulateMetaPrompt.copy() : EMULATE_META_PROMPT.copy();
    this.user_call_meta_prompt = userCallMetaPrompt ? userCallMetaPrompt.copy() : USER_CALL_META_PROMPT.copy();
  }

  push(): never {
    throw new Error("push() is not implemented yet in the JS port.");
  }

  pull(): never {
    throw new Error("pull() is not implemented yet in the JS port.");
  }
}
