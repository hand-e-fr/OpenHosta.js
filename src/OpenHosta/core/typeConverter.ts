import JSON5 from "json5";

export type PrimitiveDescriptor = "any" | "string" | "number" | "integer" | "boolean" | "null";

export interface ArrayDescriptor {
  kind: "array";
  items?: TypeDescriptor;
}

export interface TupleDescriptor {
  kind: "tuple";
  items: TypeDescriptor[];
  rest?: TypeDescriptor;
}

export interface DictDescriptor {
  kind: "dict";
  value: TypeDescriptor;
}

export interface ObjectDescriptor {
  kind: "object";
  properties?: Record<string, TypeDescriptor>;
  additionalProperties?: boolean | TypeDescriptor;
}

export interface EnumDescriptor {
  kind: "enum";
  values: Array<string | number>;
}

export interface UnionDescriptor {
  kind: "union";
  anyOf: TypeDescriptor[];
}

export interface LiteralDescriptor {
  kind: "literal";
  value: unknown;
}

export interface CustomDescriptor {
  kind: "custom";
  parse: (raw: string) => unknown;
  describe?: () => unknown;
}

export interface ClassDescriptor<T = unknown> {
  kind: "class";
  ctor: new (...args: any[]) => T;
  fromJSON?: (value: unknown) => T;
}

export type TypeDescriptor =
  | PrimitiveDescriptor
  | ArrayDescriptor
  | TupleDescriptor
  | DictDescriptor
  | ObjectDescriptor
  | EnumDescriptor
  | UnionDescriptor
  | LiteralDescriptor
  | CustomDescriptor
  | ClassDescriptor;

export type JsonSchema = Record<string, unknown>;

function looseParse(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }
  try {
    return JSON5.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function ensureArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

function ensureObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new TypeError("Expected an object when converting LLM response.");
}

function coercePrimitive(raw: string, descriptor: PrimitiveDescriptor): unknown {
  const trimmed = raw.trim();
  switch (descriptor) {
    case "any":
      return looseParse(trimmed);
    case "string":
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return trimmed.slice(1, -1);
      }
      return trimmed;
    case "number":
    case "integer": {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        throw new TypeError(`Expected ${descriptor}, got ${trimmed}`);
      }
      return descriptor === "integer" ? Math.trunc(parsed) : parsed;
    }
    case "boolean":
      if (/^(true|false)$/i.test(trimmed)) {
        return trimmed.toLowerCase() === "true";
      }
      throw new TypeError(`Expected boolean, got ${trimmed}`);
    case "null":
      if (trimmed === "null" || trimmed === "None") {
        return null;
      }
      throw new TypeError(`Expected null, got ${trimmed}`);
    default:
      return trimmed;
  }
}

export function typeReturnedData(raw: string, descriptor: TypeDescriptor = "any"): unknown {
  if (typeof descriptor === "string") {
    return coercePrimitive(raw, descriptor);
  }

  if (descriptor.kind === "custom") {
    return descriptor.parse(raw);
  }

  if (descriptor.kind === "class") {
    const parsed = looseParse(raw);
    if (descriptor.fromJSON) {
      return descriptor.fromJSON(parsed);
    }
    return new descriptor.ctor(parsed);
  }

  if (descriptor.kind === "literal") {
    const parsed = looseParse(raw);
    if (parsed !== descriptor.value) {
      throw new TypeError(`Expected literal ${descriptor.value}, got ${parsed}`);
    }
    return descriptor.value;
  }

  if (descriptor.kind === "enum") {
    const parsed = coercePrimitive(raw, "string") as string;
    if (!descriptor.values.includes(parsed)) {
      throw new TypeError(
        `Expected one of ${descriptor.values.join(", ")}, got ${String(parsed)}`
      );
    }
    return parsed;
  }

  if (descriptor.kind === "array") {
    const parsed = looseParse(raw);
    const arrayValue = ensureArray(parsed);
    if (!descriptor.items) {
      return arrayValue;
    }
    return arrayValue.map((item) =>
      typeReturnedData(JSON.stringify(item), descriptor.items as TypeDescriptor)
    );
  }

  if (descriptor.kind === "tuple") {
    const parsed = ensureArray(looseParse(raw));
    const { items, rest } = descriptor;
    if (!rest && parsed.length !== items.length) {
      throw new TypeError(`Expected tuple of length ${items.length}, got ${parsed.length}`);
    }
    return parsed.map((item, index) => {
      const expected = items[index] ?? rest;
      if (!expected) {
        throw new TypeError("Tuple descriptor missing element descriptor.");
      }
      return typeReturnedData(JSON.stringify(item), expected);
    });
  }

  if (descriptor.kind === "dict") {
    const parsed = looseParse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new TypeError("Expected dict-like value.");
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
        k,
        typeReturnedData(JSON.stringify(v), descriptor.value)
      ])
    );
  }

  if (descriptor.kind === "object") {
    const parsed = ensureObject(looseParse(raw));
    const { properties, additionalProperties } = descriptor;
    const result: Record<string, unknown> = {};
    if (properties) {
      for (const [key, propDesc] of Object.entries(properties)) {
        if (key in parsed) {
          result[key] = typeReturnedData(JSON.stringify(parsed[key]), propDesc);
        }
      }
    }
    if (additionalProperties) {
      const additional =
        typeof additionalProperties === "boolean" ? undefined : additionalProperties;
      for (const [key, value] of Object.entries(parsed)) {
        if (!properties || !(key in properties)) {
          result[key] = additional
            ? typeReturnedData(JSON.stringify(value), additional)
            : value;
        }
      }
    }
    return result;
  }

  if (descriptor.kind === "union") {
    const errors: Error[] = [];
    for (const option of descriptor.anyOf) {
      try {
        return typeReturnedData(raw, option);
      } catch (error) {
        errors.push(error as Error);
      }
    }
    throw new TypeError(`Cannot convert value. Tried ${descriptor.anyOf.length} options. ${errors.map((e) => e.message).join(" | ")}`);
  }

  return looseParse(raw);
}

export function describeTypeAsSchema(descriptor: TypeDescriptor): JsonSchema {
  if (typeof descriptor === "string") {
    switch (descriptor) {
      case "any":
        return {};
      case "string":
        return { type: "string" };
      case "number":
        return { type: "number" };
      case "integer":
        return { type: "integer" };
      case "boolean":
        return { type: "boolean" };
      case "null":
        return { type: "null" };
      default:
        return { type: "string" };
    }
  }

  switch (descriptor.kind) {
    case "array":
      return { type: "array", items: descriptor.items ? describeTypeAsSchema(descriptor.items) : {} };
    case "tuple":
      return {
        type: "array",
        prefixItems: descriptor.items.map((item) => describeTypeAsSchema(item)),
        items: descriptor.rest ? describeTypeAsSchema(descriptor.rest) : false
      };
    case "dict":
      return {
        type: "object",
        additionalProperties: describeTypeAsSchema(descriptor.value)
      };
    case "object": {
      const schema: JsonSchema = { type: "object" };
      if (descriptor.properties) {
        schema.properties = Object.fromEntries(
          Object.entries(descriptor.properties).map(([k, v]) => [
            k,
            describeTypeAsSchema(v)
          ])
        );
      }
      if (descriptor.additionalProperties !== undefined) {
        schema.additionalProperties =
          typeof descriptor.additionalProperties === "boolean"
            ? descriptor.additionalProperties
            : describeTypeAsSchema(descriptor.additionalProperties);
      }
      return schema;
    }
    case "enum":
      return { enum: descriptor.values };
    case "union":
      return { anyOf: descriptor.anyOf.map((option) => describeTypeAsSchema(option)) };
    case "literal":
      return { const: descriptor.value };
    case "class":
      return { type: "object", title: descriptor.ctor.name };
    case "custom":
      return { description: "custom type" };
    default:
      return {};
  }
}

export function niceTypeName(descriptor: TypeDescriptor): string {
  if (typeof descriptor === "string") {
    return descriptor;
  }
  switch (descriptor.kind) {
    case "array":
      return `Array<${descriptor.items ? niceTypeName(descriptor.items) : "unknown"}>`;
    case "tuple":
      return `[${descriptor.items.map(niceTypeName).join(", ")}]`;
    case "dict":
      return `{ [key: string]: ${niceTypeName(descriptor.value)} }`;
    case "object":
      if (!descriptor.properties) {
        return "object";
      }
      return `{ ${Object.entries(descriptor.properties)
        .map(([k, v]) => `${k}: ${niceTypeName(v)}`)
        .join("; ")} }`;
    case "enum":
      return `Enum<${descriptor.values.join("|")}>`;
    case "union":
      return descriptor.anyOf.map(niceTypeName).join(" | ");
    case "literal":
      return JSON.stringify(descriptor.value);
    case "class":
      return descriptor.ctor.name;
    case "custom":
      return "custom";
    default:
      return "unknown";
  }
}
