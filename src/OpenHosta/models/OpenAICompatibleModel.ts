export interface OpenAICompatibleModelInit {
  modelName?: string;
  baseUrl?: string;
  apiKey?: string;
  apiParameters?: Record<string, unknown>;
  additionalHeaders?: Record<string, string>;
}

export class OpenAICompatibleModel {
  model_name: string;
  base_url: string;
  api_key?: string;
  api_parameters: Record<string, unknown>;
  additionnal_headers: Record<string, string>;
  preferred_image_format?: string;
  hosta_inspection?: Record<string, unknown>;

  constructor({
    modelName = "gpt-4o",
    baseUrl = "https://api.openai.com/v1",
    apiKey,
    apiParameters = {},
    additionalHeaders = {}
  }: OpenAICompatibleModelInit = {}) {
    this.model_name = modelName;
    this.base_url = baseUrl;
    this.api_key = apiKey;
    this.api_parameters = { ...apiParameters };
    this.additionnal_headers = { ...additionalHeaders };
  }

  print_last_prompt(): void {
    console.log("[OpenHosta.js] print_last_prompt is not yet implemented for OpenAICompatibleModel.");
  }
}
