import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";

import { OneTurnConversationPipeline } from "../pipelines/simplePipeline.js";
import { OpenAICompatibleModel } from "../models/OpenAICompatibleModel.js";

export class Config {
  private defaultModel: OpenAICompatibleModel;
  private defaultPipeline: OneTurnConversationPipeline;

  constructor() {
    this.defaultModel = new OpenAICompatibleModel({
      modelName: "gpt-4o",
      baseUrl: "https://api.openai.com/v1"
    });

    this.defaultPipeline = new OneTurnConversationPipeline({
      modelList: [this.defaultModel]
    });
  }

  get DefaultModel(): OpenAICompatibleModel {
    return this.defaultModel;
  }

  set DefaultModel(model: OpenAICompatibleModel) {
    if (!(model instanceof OpenAICompatibleModel)) {
      throw new Error("DefaultModel must be an instance of OpenAICompatibleModel");
    }
    Object.assign(this.defaultModel, model);
  }

  get DefaultPipeline(): OneTurnConversationPipeline {
    return this.defaultPipeline;
  }

  set DefaultPipeline(pipeline: OneTurnConversationPipeline) {
    if (!(pipeline instanceof OneTurnConversationPipeline)) {
      throw new Error("DefaultPipeline must be an instance of OneTurnConversationPipeline");
    }

    this.defaultPipeline.model_list = pipeline.model_list;
    this.defaultPipeline.llm_args = pipeline.llm_args;
    this.defaultPipeline.user_call_meta_prompt = pipeline.user_call_meta_prompt;
    this.defaultPipeline.emulate_meta_prompt = pipeline.emulate_meta_prompt;
  }
}

export const config = new Config();

function recursiveFindDotenv(start: string): string | null {
  const candidate = path.join(start, ".env");
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  const parent = path.dirname(start);
  if (parent === start) {
    return null;
  }
  return recursiveFindDotenv(parent);
}

function warnMissingEnvFile(searchPath: string, foundPath: string | null, verbose = false): boolean {
  // Only show warnings if OPENHOSTA_VERBOSE=true or verbose flag is set
  const shouldWarn = verbose || process.env.OPENHOSTA_VERBOSE === "true";

  if (foundPath === null) {
    if (shouldWarn) {
      console.error(`[OpenHosta/CONFIG_WARNING] .env file not found at ${searchPath} or in any parent directory.`);
      console.error(
        `[OpenHosta/CONFIG_ERROR] .env file not found. It is a good practice to store your credentials in a .env file.\n` +
          `Example .env file:\n` +
          `------------------\n` +
          `OPENHOSTA_DEFAULT_MODEL_API_KEY="your_api_key"\n` +
          `OPENHOSTA_DEFAULT_MODEL_BASE_URL="https://api.openai.com/v1"\n` +
          `OPENHOSTA_DEFAULT_MODEL_NAME="gpt-5"\n` +
          `OPENHOSTA_DEFAULT_MODEL_TEMPERATURE=0.7\n` +
          `OPENHOSTA_DEFAULT_MODEL_TOP_P=0.9\n` +
          `OPENHOSTA_DEFAULT_MODEL_MAX_TOKENS=2048\n` +
          `OPENHOSTA_DEFAULT_MODEL_SEED=42\n` +
          `------------------`
      );
    }
    return false;
  }
  if (shouldWarn) {
    console.error(
      `[OpenHosta/CONFIG_WARNING] .env file not found at ${searchPath}. Using ${foundPath} instead.`
    );
  }
  return true;
}

export function reloadDotenv(override = true, dotenvPath = "./.env", verbose = false): boolean {
  const absolutePath = path.resolve(dotenvPath);
  const foundPath = recursiveFindDotenv(path.dirname(absolutePath));

  let finalPath = absolutePath;

  if (absolutePath !== foundPath) {
    if (!warnMissingEnvFile(absolutePath, foundPath, verbose)) {
      return false;
    }
    if (foundPath) {
      finalPath = foundPath;
    }
  }

  const result = dotenvConfig({ path: finalPath, override });
  if (result.error) {
    if (verbose || process.env.OPENHOSTA_VERBOSE === "true") {
      console.error(`[OpenHosta/CONFIG_ERROR] Failed to load .env file at ${finalPath}.`);
    }
    return false;
  }

  const defaultModel = config.DefaultModel;
  defaultModel.api_key = process.env.OPENHOSTA_DEFAULT_MODEL_API_KEY ?? defaultModel.api_key;
  defaultModel.base_url = process.env.OPENHOSTA_DEFAULT_MODEL_BASE_URL ?? defaultModel.base_url;
  defaultModel.model_name = process.env.OPENHOSTA_DEFAULT_MODEL_NAME ?? defaultModel.model_name;

  const pipelineModel = config.DefaultPipeline.model_list[0];
  const temperature = process.env.OPENHOSTA_DEFAULT_MODEL_TEMPERATURE;
  const topP = process.env.OPENHOSTA_DEFAULT_MODEL_TOP_P;
  const maxTokens = process.env.OPENHOSTA_DEFAULT_MODEL_MAX_TOKENS;
  const seed = process.env.OPENHOSTA_DEFAULT_MODEL_SEED;

  if (temperature !== undefined) {
    pipelineModel.api_parameters = {
      ...pipelineModel.api_parameters,
      temperature: Number(temperature)
    };
  }
  if (topP !== undefined) {
    pipelineModel.api_parameters = {
      ...pipelineModel.api_parameters,
      top_p: Number(topP)
    };
  }
  if (maxTokens !== undefined) {
    pipelineModel.api_parameters = {
      ...pipelineModel.api_parameters,
      max_tokens: Number(maxTokens)
    };
  }
  if (seed !== undefined) {
    pipelineModel.api_parameters = {
      ...pipelineModel.api_parameters,
      seed: Number(seed)
    };
  }

  return true;
}

reloadDotenv(false);
