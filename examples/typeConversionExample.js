import {
  typeReturnedData,
  describeTypeAsSchema,
  niceTypeName
} from "../dist/index.js";

const descriptor = {
  kind: "array",
  items: {
    kind: "object",
    properties: {
      name: "string",
      score: "number",
      tags: { kind: "array", items: "string" }
    },
    additionalProperties: false
  }
};

const rawResponse = `[
  {"name": "task_a", "score": 0.42, "tags": ["baseline"]},
  {"name": "task_b", "score": 0.91, "tags": ["critical", "json"]}
]`;

const typed = typeReturnedData(rawResponse, descriptor);
console.log("=== Parsed Values ===");
console.dir(typed, { depth: null });

console.log("\n=== Descriptor Summary ===");
console.log("Type:", niceTypeName(descriptor));
console.log("Schema:", JSON.stringify(describeTypeAsSchema(descriptor), null, 2));

const unionDescriptor = {
  kind: "union",
  anyOf: ["null", "string", { kind: "array", items: "integer" }]
};

console.log("\n=== Union Examples ===");
for (const sample of ["null", '"hello"', "[1, 2, 3]"]) {
  console.log(sample, "->", typeReturnedData(sample, unionDescriptor));
}
