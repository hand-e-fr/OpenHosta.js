import {
  Model,
  ModelCapabilities,
  type Message,
  type ModelInit,
  type ModelResponse
} from "./baseModel.js";
import { ApiKeyError, RateLimitError, RequestError } from "../utils/errors.js";
import type { HostaInspection } from "../core/inspection.js";

export interface OpenAICompatibleModelInit extends ModelInit {
  modelName?: string;
  baseUrl?: string;
  apiKey?: string;
  chatCompletionPath?: string;
  timeoutMs?: number;
  capabilities?: Set<ModelCapabilities>;
}

export class OpenAICompatibleModel extends Model {
  model_name: string;
  base_url: string;
  chat_completion_url: string;
  api_key?: string;
  timeout: number;
  reasoning_start_and_stop_tags: [string, string] = ["<think>", "</think>"];

  constructor({
    modelName = "gpt-4o",
    baseUrl = "https://api.openai.com/v1",
    apiKey,
    apiParameters,
    additionnalHeaders,
    maxAsyncCalls,
    chatCompletionPath = "/chat/completions",
    timeoutMs = 60_000,
    capabilities
  }: OpenAICompatibleModelInit = {}) {
    super({ apiParameters, additionnalHeaders, maxAsyncCalls });
    this.model_name = modelName;
    this.base_url = baseUrl;
    this.chat_completion_url = baseUrl.endsWith(chatCompletionPath) ? "" : chatCompletionPath;
    this.api_key = apiKey;
    this.timeout = timeoutMs;
    this.capabilities = capabilities ?? new Set([ModelCapabilities.TEXT2TEXT]);
    this.preferred_image_format = "png";
  }

  private resolveHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.additionnal_headers
    };

    const apiKey = this.api_key ?? process.env.OPENAI_API_KEY;
    if (!apiKey && this.base_url.includes("api.openai.com/v1")) {
      throw new ApiKeyError("[model.apiCall] Empty API key.");
    }

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    return headers;
  }

  async apiCall(messages: Message[], llmArgs: Record<string, unknown> = {}): Promise<ModelResponse> {
    const headers = this.resolveHeaders();

    const fullUrl = `${this.base_url}${this.chat_completion_url}`;
    const payload: Record<string, unknown> = {
      model: this.model_name,
      messages,
      ...this.api_parameters
    };

    const args = { ...llmArgs };
    if (args.force_json_output && !this.capabilities.has(ModelCapabilities.JSON_OUTPUT)) {
      delete args.force_json_output;
    }

    for (const [key, value] of Object.entries(args)) {
      if (key === "force_json_output" && value) {
        payload.response_format = { type: "json_object" };
      } else {
        payload[key] = value;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    let response: Response;
    try {
      response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      const text = await response.text();
      throw new RateLimitError(`[Model.apiCall] Rate limit exceeded (HTTP 429). ${text}`);
    }
    if (response.status === 401) {
      const text = await response.text();
      throw new ApiKeyError(`[Model.apiCall] Unauthorized (HTTP 401). ${text}`);
    }
    if (!response.ok) {
      const text = await response.text();
      throw new RequestError(
        `[Model.apiCall] Request failed with status code ${response.status}:\n${text}\n`
      );
    }

    this._nb_requests += 1;
    const data = (await response.json()) as ModelResponse;
    if (data.usage?.total_tokens) {
      this._used_tokens += Number(data.usage.total_tokens);
    }

    return data;
  }

  getResponseContent(response: ModelResponse): string {
    const choice = response.choices?.[0]?.message;
    if (!choice) {
      return "";
    }
    if (typeof choice.content === "string") {
      return choice.content;
    }
    if (Array.isArray(choice.content)) {
      return choice.content
        .map((fragment: { type?: string; text?: string }) =>
          fragment.type === "text" ? fragment.text ?? "" : ""
        )
        .join("\n")
        .trim();
    }
    return String(choice.content ?? "");
  }

  print_last_prompt(inspection: HostaInspection): void {
    const logs = inspection.logs ?? {};
    const messages = logs.llm_api_messages_sent;
    if (Array.isArray(messages) && messages.length > 0) {
      console.log("\nSystem prompt:\n-----------------");
      console.log(messages[0]?.content?.[0]?.text ?? "");
    }
    if (Array.isArray(messages) && messages.length > 1) {
      console.log("\nUser prompt:\n-----------------");
      console.log(messages[1]?.content?.[0]?.text ?? "");
    }
    if (logs.rational) {
      console.log("\nRational:\n-----------------");
      console.log(logs.rational);
    }
    if (logs.llm_api_response?.choices?.[0]?.message?.content) {
      console.log("\nLLM response:\n-----------------");
      console.log(logs.llm_api_response.choices[0].message.content);
    }
  }
}
