import type { TypeDescriptor } from "./typeConverter.js";
import {
  BASIC_TYPE_SET,
  describeTypeAsPython,
  describeTypeAsSchema,
  niceTypeName,
  stringifyValue
} from "./typeConverter.js";

const HOSTA_SIGNATURE = Symbol.for("openhosta.signature");

export interface HostaArgument {
  name: string;
  type?: TypeDescriptor;
  value?: unknown;
}

export interface HostaAnalysis {
  name: string;
  args: HostaArgument[];
  type?: TypeDescriptor;
  doc?: string;
}

export type HostaInspectableFunction = ((...args: unknown[]) => unknown) & {
  [HOSTA_SIGNATURE]?: Partial<HostaAnalysis>;
  hostaSignature?: Partial<HostaAnalysis>;
};

export interface HostaAnalyzeOptions {
  args?: Record<string, unknown>;
  signatureOverride?: Partial<HostaAnalysis>;
}

function cloneArgs(args: HostaArgument[] = []): HostaArgument[] {
  return args.map((arg) => ({ ...arg }));
}

export function setHostaSignature(fn: HostaInspectableFunction, signature: Partial<HostaAnalysis>) {
  fn[HOSTA_SIGNATURE] = signature;
  return fn;
}

export function getHostaSignature(fn: HostaInspectableFunction): Partial<HostaAnalysis> | undefined {
  return fn[HOSTA_SIGNATURE] ?? fn.hostaSignature;
}

export function hostaAnalyze(
  functionPointer: HostaInspectableFunction,
  options: HostaAnalyzeOptions = {}
): HostaAnalysis {
  const meta = {
    ...(getHostaSignature(functionPointer) ?? {}),
    ...(options.signatureOverride ?? {})
  };

  const args = cloneArgs(meta.args ?? []);
  if (options.args) {
    for (const [name, value] of Object.entries(options.args)) {
      const argRef = args.find((arg) => arg.name === name);
      if (argRef) {
        argRef.value = value;
      } else {
        args.push({ name, value });
      }
    }
  }

  return {
    name: meta.name ?? functionPointer.name ?? "anonymous",
    doc: meta.doc,
    type: meta.type,
    args
  };
}

export function hostaAnalyzeUpdate(
  args: Record<string, unknown>,
  inspection: { analyse: HostaAnalysis }
): HostaAnalysis {
  const analyse = inspection.analyse;
  const updatedArgs = analyse.args.map((arg) => ({
    ...arg,
    value: Object.prototype.hasOwnProperty.call(args, arg.name) ? args[arg.name] : arg.value
  }));

  return {
    name: analyse.name,
    doc: analyse.doc,
    type: analyse.type,
    args: updatedArgs
  };
}

export interface EncodeResult {
  [key: string]: unknown;
}

export function encodeFunction(
  analyse: HostaAnalysis,
  _capabilities: unknown = undefined
): Record<string, unknown> {
  return {
    ...encodeFunctionDocumentation(analyse),
    ...encodeFunctionParameterTypes(analyse),
    ...encodeFunctionParameterValues(analyse),
    ...encodeFunctionParameterNames(analyse),
    ...encodeFunctionReturnType(analyse),
    ...encodeFunctionReturnTypeDefinition(analyse)
  };
}

export function encodeFunctionDocumentation(analyse: HostaAnalysis) {
  return {
    function_name: analyse.name,
    function_doc: analyse.doc ?? ""
  };
}

export function encodeFunctionParameterTypes(analyse: HostaAnalysis) {
  const jsonDefinitions: Record<string, unknown> = {};
  const pythonDefinitions: Record<string, string> = {};

  for (const arg of analyse.args) {
    if (!arg.type) {
      continue;
    }
    const typeName = niceTypeName(arg.type);
    if (typeof arg.type === "string" && BASIC_TYPE_SET.has(arg.type)) {
      continue;
    }
    const pythonDoc = describeTypeAsPython(arg.type);
    if (pythonDoc) {
      pythonDefinitions[typeName] = pythonDoc;
    }
    const schemaDoc = describeTypeAsSchema(arg.type);
    if (schemaDoc) {
      jsonDefinitions[typeName] = schemaDoc;
    }
  }

  return {
    python_type_definition_dict: Object.entries(pythonDefinitions)
      .map(([k, v]) => `\`\`\`python\n# definition of type ${k}:\n${v}\n\`\`\``)
      .join("\n"),
    json_schema_type_definition_dict: Object.entries(jsonDefinitions)
      .map(([k, v]) => `# JSON Schema of type ${k}:\n\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``)
      .join("\n\n")
  };
}

export function encodeFunctionParameterValues(analyse: HostaAnalysis) {
  const variableDefinitions: string[] = [];
  const callArguments: string[] = [];

  for (const arg of analyse.args) {
    const repr = stringifyValue(arg.value);
    if (repr.length > 20) {
      variableDefinitions.push(`${arg.name} = ${repr}`);
      callArguments.push(arg.name);
    } else if (arg.value !== undefined) {
      callArguments.push(`${arg.name} = ${repr}`);
    } else {
      callArguments.push(arg.name);
    }
  }

  return {
    variables_initialization: variableDefinitions.join("\n\n"),
    function_call_arguments: callArguments.join(", ")
  };
}

export function encodeFunctionParameterNames(analyse: HostaAnalysis) {
  const inlineArgs = analyse.args.map((arg) => {
    const typeName = arg.type ? niceTypeName(arg.type) : undefined;
    return typeName ? `${arg.name}: ${typeName}` : arg.name;
  });

  return {
    function_args: inlineArgs.join(", "),
    function_inline_variable_declaration: ""
  };
}

export function encodeFunctionReturnType(analyse: HostaAnalysis) {
  return {
    function_return_type: analyse.type,
    function_return_type_name: analyse.type ? niceTypeName(analyse.type) : ""
  };
}

export function encodeFunctionReturnTypeDefinition(analyse: HostaAnalysis) {
  return {
    function_return_as_python_type: describeTypeAsPython(analyse.type),
    function_return_as_json_schema: analyse.type
      ? JSON.stringify(describeTypeAsSchema(analyse.type), null, 2)
      : undefined
  };
}
