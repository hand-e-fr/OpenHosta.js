# Examples

Run from the repo root (`OpenHosta.js`). Each npm script rebuilds before executing the example.

## Core Infrastructure Examples

- `metaPromptExample.js` → `npm run example:meta-prompt`
  Instantiates `MetaPrompt`, renders a custom greeting, and prints `EMULATE_META_PROMPT`.
- `configExample.js` → `npm run example:config`
  Generates a temporary `.env`, calls `reloadDotenv`, and inspects `config.DefaultModel` / pipeline parameters.
- `typeConversionExample.js` → `npm run example:type-conversion`
  Demonstrates the `TypeDescriptor` DSL plus `typeReturnedData`, schema rendering, and union parsing.
- `loggerExample.js` → `npm run example:logger`
  Builds a mock `hosta_inspection` payload to showcase `printLastPrompt` and `printLastDecoding`.
- `analyzerExample.js` → `npm run example:analyzer`
  Shows `setHostaSignature`, `hostaAnalyze`, `encodeFunction`, and response coercion.
- `mockExample.js` → `npm run example:mock`
  Complete pipeline testing with a mock model (no API key required). Demonstrates push/pull flow, type conversion, and token counting without external API calls.

## Execution Examples (Require API Key)

These examples require a valid `OPENAI_API_KEY` environment variable to make real LLM calls.

- `askExample.js` → `npm run example:ask`
  Simple LLM queries using the `ask()` function with various options: custom system prompts, JSON mode, and named arguments for context injection.
- `emulateExample.js` → `npm run example:emulate`
  Function emulation using `emulate()` to have LLMs execute annotated functions with typed inputs/outputs, including arrays, objects, and inspection logging.
- `closureExample.js` → `npm run example:closure`
  Closure factories via `closure()` that create reusable LLM-backed functions with type inference and custom return types.
- `pipelineExample.js` → `npm run example:pipeline`
  Direct pipeline usage demonstrating the push/pull flow: encoding function metadata, calling the model, and decoding typed responses with full inspection logs.

## Python vs JavaScript Comparison

- `PYTHON_VS_JS.md`
  Detailed comparison of Python vs JavaScript/TypeScript emulate syntax, explaining why JavaScript requires explicit `fn` and `args` parameters (no frame introspection).
- `simpleEmulateExample.ts` → `npx tsx examples/simpleEmulateExample.ts`
  TypeScript example showing the closest equivalent to Python's `emulate()` pattern (requires `tsx`).
