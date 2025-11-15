import type { HostaInspection } from "./inspection.js";

type AnyRecord = Record<string, unknown>;

export type HostaInspectable = {
  hosta_inspection?: HostaInspection;
};

function extractInspection(target: unknown): HostaInspection | undefined {
  if (
    target &&
    (typeof target === "function" || typeof target === "object") &&
    "hosta_inspection" in (target as AnyRecord)
  ) {
    const inspection = (target as HostaInspectable).hosta_inspection;
    if (inspection && typeof inspection === "object") {
      return inspection;
    }
  }
  return undefined;
}

function printNoPromptMessage(): void {
  console.log("No prompt found for this function.");
}

export function printLastPrompt(target: unknown): void {
  const inspection = extractInspection(target);
  const model = inspection?.model;

  if (!inspection || !model) {
    printNoPromptMessage();
    return;
  }

  const modelName = model.model_name ?? "unknown";
  const baseUrl = model.base_url ?? "unknown";

  console.log(
    [
      "Model",
      "-----------------",
      `name=${modelName}`,
      `base_url=${baseUrl}`,
      ""
    ].join("\n")
  );

  if (typeof model.print_last_prompt === "function") {
    model.print_last_prompt(inspection);
  } else {
    console.log("Model does not expose print_last_prompt().");
  }
}

export function printLastDecoding(target: unknown): void {
  const inspection = extractInspection(target);
  const pipeline = inspection?.pipeline;

  if (!inspection || !pipeline) {
    printNoPromptMessage();
    return;
  }

  if (typeof pipeline.print_last_decoding === "function") {
    pipeline.print_last_decoding(inspection);
  } else {
    console.log("Pipeline does not expose print_last_decoding().");
  }
}
