export interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface Message {
  role: string;
  content: MessageContent[];
}

export type ModelResponse = Record<string, any>;

export enum ModelCapabilities {
  TEXT2TEXT = "TEXT2TEXT",
  TEXT2JSON = "TEXT2JSON",
  TEXT2IMAGE = "TEXT2IMAGE",
  IMAGE2TEXT = "IMAGE2TEXT",
  IMAGE2IMAGE = "IMAGE2IMAGE",
  THINK = "THINK",
  JSON_OUTPUT = "JSON_OUTPUT"
}

export interface ModelInit {
  maxAsyncCalls?: number;
  additionnalHeaders?: Record<string, string>;
  apiParameters?: Record<string, unknown>;
}

export abstract class Model {
  capabilities: Set<ModelCapabilities> = new Set();
  max_async_calls: number;
  additionnal_headers: Record<string, string>;
  api_parameters: Record<string, unknown>;
  preferred_image_format?: string;
  protected _used_tokens = 0;
  protected _nb_requests = 0;

  protected constructor({ maxAsyncCalls = 7, additionnalHeaders = {}, apiParameters = {} }: ModelInit = {}) {
    this.max_async_calls = maxAsyncCalls;
    this.additionnal_headers = { ...additionnalHeaders };
    this.api_parameters = { ...apiParameters };
  }

  abstract apiCall(messages: Message[], llmArgs?: Record<string, unknown>): Promise<ModelResponse>;

  async apiCallAsync(messages: Message[], llmArgs?: Record<string, unknown>): Promise<ModelResponse> {
    return this.apiCall(messages, llmArgs);
  }

  abstract getResponseContent(response: ModelResponse): string;

  getThinkingAndDataSections(
    response: string,
    reasoningTags: [string, string] = ["<think>", "</think>"]
  ): { thinking: string; answer: string } {
    const [startTag, endTag] = reasoningTags;
    let thinking = "";
    let answer = response.trim();

    const startIdx = response.indexOf(startTag);
    const endIdx = response.indexOf(endTag);

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      thinking = response.slice(startIdx + startTag.length, endIdx).trim();
      answer = response.slice(endIdx + endTag.length).trim();
    }

    return { thinking, answer };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  print_last_prompt(_inspection: unknown): void {
    // Optional override in subclasses.
  }

  get used_tokens(): number {
    return this._used_tokens;
  }

  get nb_requests(): number {
    return this._nb_requests;
  }
}
