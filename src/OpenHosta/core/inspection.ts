import type { HostaAnalysis, HostaInspectableFunction, HostaAnalyzeOptions } from "./analyzer.js";
import { hostaAnalyze, hostaAnalyzeUpdate } from "./analyzer.js";
import type { TypeDescriptor } from "./typeConverter.js";
import { FrameError } from "../utils/errors.js";
import type { Model } from "../models/baseModel.js";
import type { Pipeline } from "../pipelines/simplePipeline.js";

const HOSTA_INSPECTION_SYMBOL = Symbol.for("openhosta.inspection");

export interface HostaInspection {
  function?: HostaInspectableFunction;
  analyse: HostaAnalysis;
  logs: Record<string, any>;
  counters: Record<string, number>;
  prompt_data: Record<string, unknown>;
  pipe: unknown;
  model?: Model & {
    model_name?: string;
    base_url?: string;
    print_last_prompt?: (inspection: HostaInspection) => void;
  };
  pipeline?: Pipeline & {
    print_last_decoding?: (inspection: HostaInspection) => void;
  };
}

export interface EnsureInspectionOptions extends HostaAnalyzeOptions {
  args?: Record<string, unknown>;
  doc?: string;
  name?: string;
  type?: TypeDescriptor;
}

function enrichAnalysis(
  analyse: HostaAnalysis,
  overrides: Pick<EnsureInspectionOptions, "doc" | "name" | "type">
): HostaAnalysis {
  const next: HostaAnalysis = {
    ...analyse,
    doc: overrides.doc ?? analyse.doc,
    name: overrides.name ?? analyse.name,
    type: overrides.type ?? analyse.type
  };
  return next;
}

export function getHostaInspection(
  functionPointer: HostaInspectableFunction,
  options: EnsureInspectionOptions = {}
): HostaInspection {
  if (typeof functionPointer !== "function") {
    throw new FrameError("Expected a callable when requesting a Hosta inspection.");
  }

  let inspection = (functionPointer as any)[HOSTA_INSPECTION_SYMBOL] as HostaInspection | undefined;

  if (!inspection) {
    const analyse = enrichAnalysis(hostaAnalyze(functionPointer, options), options);
    inspection = {
      function: functionPointer,
      analyse,
      logs: {},
      counters: {},
      prompt_data: {},
      pipe: null
    };
    (functionPointer as any)[HOSTA_INSPECTION_SYMBOL] = inspection;
    (functionPointer as any).hosta_inspection = inspection;
  } else {
    if (options.args) {
      inspection.analyse = hostaAnalyzeUpdate(options.args, inspection);
    }
    inspection.analyse = enrichAnalysis(inspection.analyse, options);
  }

  return inspection;
}

export function setHostaInspection(functionPointer: HostaInspectableFunction, inspection: HostaInspection): void {
  (functionPointer as any)[HOSTA_INSPECTION_SYMBOL] = inspection;
  (functionPointer as any).hosta_inspection = inspection;
}

export function getLastInspection(target: HostaInspectableFunction): HostaInspection | undefined {
  return (target as any)[HOSTA_INSPECTION_SYMBOL];
}
