# Examples

Run from the repo root (`OpenHosta.js`). Each npm script rebuilds before executing the example.

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
