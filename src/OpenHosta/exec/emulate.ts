import type { HostaInspectableFunction } from "../core/analyzer.js";
import { getHostaInspection } from "../core/inspection.js";
import type { TypeDescriptor } from "../core/typeConverter.js";
import { config } from "../core/config.js";
import type { OneTurnConversationPipeline } from "../pipelines/simplePipeline.js";

export interface EmulateOptions {
  fn: HostaInspectableFunction;
  args?: Record<string, unknown>;
  pipeline?: OneTurnConversationPipeline;
  forceReturnType?: TypeDescriptor;
  forceLlmArgs?: Record<string, unknown>;
  doc?: string;
  name?: string;
}

export async function emulate({
  fn,
  args,
  pipeline = config.DefaultPipeline,
  forceReturnType,
  forceLlmArgs = {},
  doc,
  name
}: EmulateOptions): Promise<unknown> {
  const inspection = getHostaInspection(fn, {
    args,
    doc,
    name,
    type: forceReturnType
  });

  inspection.analyse.type = inspection.analyse.type ?? forceReturnType ?? "string";

  const messages = pipeline.push(inspection);
  const model = inspection.model;
  if (!model) {
    throw new Error("Pipeline did not attach a model to the inspection.");
  }

  const responseDict = await model.apiCall(messages, {
    ...pipeline.llm_args,
    ...forceLlmArgs
  });

  return pipeline.pull(inspection, responseDict);
}

export const emulateAsync = emulate;
