import type { HostaInspectableFunction } from "../core/analyzer.js";
import { getHostaInspection } from "../core/inspection.js";
import type { TypeDescriptor } from "../core/typeConverter.js";
import { config } from "../core/config.js";
import type { OneTurnConversationPipeline } from "../pipelines/simplePipeline.js";

export interface ClosureOptions {
  pipeline?: OneTurnConversationPipeline;
  forceReturnType?: TypeDescriptor;
  forceLlmArgs?: Record<string, unknown>;
}

function inferTypeDescriptor(value: unknown): TypeDescriptor {
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") {
    return valueType === "number" ? "number" : (valueType as "string" | "boolean");
  }
  if (Array.isArray(value)) {
    return { kind: "array", items: "any" };
  }
  if (value && typeof value === "object") {
    return { kind: "object" };
  }
  return "any";
}

export function closure(queryString: string, options: ClosureOptions = {}) {
  const pipeline = options.pipeline ?? config.DefaultPipeline;

  const inner = async (args: Record<string, unknown> = {}): Promise<unknown> => {
    const inspection = getHostaInspection(inner as HostaInspectableFunction, {
      args,
      doc: queryString,
      type: options.forceReturnType
    });

    inspection.analyse.doc = queryString;
    inspection.analyse.name = "lambda_function";
    inspection.analyse.args = Object.entries(args).map(([name, value]) => ({
      name,
      type: inferTypeDescriptor(value),
      value
    }));

    inspection.analyse.type = inspection.analyse.type ?? options.forceReturnType ?? "string";

    const messages = pipeline.push(inspection);
    const model = inspection.model;
    if (!model) {
      throw new Error("Pipeline did not attach a model to the inspection.");
    }

    const responseDict = await model.apiCall(messages, {
      ...pipeline.llm_args,
      ...(options.forceLlmArgs ?? {})
    });

    return pipeline.pull(inspection, responseDict);
  };

  return inner;
}

export const closureAsync = closure;
