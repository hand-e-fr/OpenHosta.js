import { config } from "../core/config.js";
import type { Message, Model } from "../models/baseModel.js";
import { isBinaryLike, binaryToDataUrl } from "../utils/image.js";

export interface AskOptions {
  system?: string | null;
  model?: Model;
  forceJsonOutput?: boolean;
  forceLlmArgs?: Record<string, unknown>;
}

export async function ask(
  userMessage: string,
  namedArgs: Record<string, unknown> = {},
  options: AskOptions = {}
): Promise<string | undefined> {
  const model = options.model ?? config.DefaultModel;
  const messages: Message[] = [];

  if (options.system !== null) {
    messages.push({
      role: "system",
      content: [
        {
          type: "text",
          text: options.system ?? "You are a helpful assistant."
        }
      ]
    });
  }

  const userMessageContent: Message["content"] = [
    {
      type: "text",
      text: userMessage
    }
  ];

  for (const [key, value] of Object.entries(namedArgs)) {
    if (isBinaryLike(value)) {
      userMessageContent.push({
        type: "image_url",
        image_url: {
          url: binaryToDataUrl(value, model.preferred_image_format ?? "png")
        }
      });
    } else {
      if (messages.length === 0) {
        messages.push({
          role: "system",
          content: [{ type: "text", text: "" }]
        });
      }
      const systemText = messages[0].content[0].text ?? "";
      messages[0].content[0].text = `${systemText}\n${key}:\n${String(value)}\n`;
    }
  }

  messages.push({ role: "user", content: userMessageContent });

  const llmArgs = {
    ...(options.forceLlmArgs ?? {}),
    force_json_output: options.forceJsonOutput ?? false
  };

  const response = await model.apiCall(messages, llmArgs);
  return response.choices?.[0]?.message?.content;
}

export const askAsync = ask;
