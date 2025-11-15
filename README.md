# OpenHosta.js
A lightweight library integrating LLM natively into JavaScript

## Example

Examples live in `examples/` and run via npm scripts (each re-builds before execution):

- `npm run example:meta-prompt` – Renders the base `MetaPrompt` and the shared `EMULATE_META_PROMPT`.
- `npm run example:config` – Creates a temporary `.env` file, calls `reloadDotenv`, and prints the resulting default model/pipeline configuration.
- `npm run example:type-conversion` – Demonstrates `typeReturnedData`, `describeTypeAsSchema`, and unions with the new `TypeDescriptor` DSL.
- `npm run example:logger` – Builds a synthetic `hosta_inspection` payload to show `printLastPrompt` and `printLastDecoding` output.

## Configuration

`src/OpenHosta/core/config.ts` mirrors the Python singleton: `config.DefaultModel` and `config.DefaultPipeline` stay live references so any mutations propagate everywhere. Environment variables can be loaded from `.env` files via:

```ts
import { reloadDotenv, config } from "openhosta.js";

reloadDotenv(); // walks up the filesystem to find .env like the Python version
console.log(config.DefaultModel.model_name);
```

The default `OpenAICompatibleModel` and `OneTurnConversationPipeline` implementations are scaffolding for now—they keep metadata in sync but will gain the full API/push/pull logic as the port advances.
If no `.env` is found, the loader logs the same warning/error guidance as the Python package so teams remember to configure credentials.

## Type conversion

`src/OpenHosta/core/typeConverter.ts` introduces a `TypeDescriptor` runtime DSL so we can express the expected return type without relying on Python's `typing` module. The `typeReturnedData` helper accepts the raw LLM string plus a descriptor and performs best-effort parsing (JSON/JSON5, enums, arrays, objects, tuples, unions, or custom parsers). Example:

```ts
import { typeReturnedData } from "openhosta.js";

const descriptor = { kind: "array", items: "number" } as const;
const values = typeReturnedData("[1, 2, 3]", descriptor);
console.log(values); // [1, 2, 3]
```

When analyzers/pipelines are ported they'll produce descriptors automatically; until then, descriptors can be constructed manually for experiments.

## Next steps

Short-term focus areas pulled from `PORTING_STATUS.md`:
- Port the analyzer/inspection layers so they can emit `TypeDescriptor` metadata automatically.
- Implement `OneTurnConversationPipeline.push/pull` and flesh out `OpenAICompatibleModel` with real HTTP calls plus inspection logging.
- Introduce a Pydantic-like validation layer (Zod/TypeBox) to keep schema-driven ergonomics when converting model outputs.
- Add alignment tests/examples to ensure Python and JS pipelines stay behaviorally identical.
