# OpenHosta.js Porting Tracker

## Snapshot (v0.1)
| Python module (OpenHosta/src/OpenHosta) | JS parity | Notes |
| --- | --- | --- |
| core/meta_prompt.py | ✅ Implemented in `src/OpenHosta/core/metaPrompt.ts` using nunjucks | Provides `MetaPrompt`, `EMULATE_META_PROMPT`, `USER_CALL_META_PROMPT` equivalents |
| core/logger.py | ✅ Implemented in `src/OpenHosta/core/logger.ts` | Adds `printLastPrompt`, `printLastDecoding` with `hosta_inspection` contract |
| core/config.py | 🟡 Partial in `src/OpenHosta/core/config.ts` | Default model/pipeline wiring + `.env` loader done; depends on placeholder model/pipeline behavior |
| core/type_converter.py | 🟡 Partial in `src/OpenHosta/core/typeConverter.ts` | Runtime `TypeDescriptor` DSL + JSON schema serialization present; JS lacks Python's dataclass/Pydantic/enum reflection and uses manual descriptors |
| core/analizer.py | 🟡 Partial in `src/OpenHosta/core/analyzer.ts` | `setHostaSignature`, `hostaAnalyze`, and encoding helpers exist; no frame-introspection, args only update when callers pass `HostaAnalyzeOptions` |
| core/inspection.py | 🟡 Partial in `src/OpenHosta/core/inspection.ts` | Symbol-based cache + manual `getHostaInspection` implemented; still relies on user-provided args since JS lacks frame introspection |
| core/pydantic_proxy.py | 🔄 Missing | Needs strategy for reconstructing Pydantic/Zod models and exporting definitions when templates ask for them |
| models/OpenAICompatible.py | 🟡 Partial in `src/OpenHosta/models/OpenAICompatibleModel.ts` | Fetch-based API client, headers, and logging done; still needs streaming + richer response helpers |
| models/base_model.py | 🟡 Partial in `src/OpenHosta/models/baseModel.ts` | Capability enums + abstract API contract done; executor pooling & token accounting TBD |
| pipelines/simple_pipeline.py | 🟡 Partial in `src/OpenHosta/pipelines/simplePipeline.ts` | Push/pull flow implemented (encode, prompt build, decoding); still missing image resizing + advanced routing |
| exec/ask.py | 🟡 Partial in `src/OpenHosta/exec/ask.ts` | Supports basic multimodal prompts but only async usage and simple arg handling |
| exec/emulate.py | 🟡 Partial in `src/OpenHosta/exec/emulate.ts` | End-to-end emulate loop works when callers pass `fn` + args manually; no automatic frame capture |
| exec/closure.py | 🟡 Partial in `src/OpenHosta/exec/closure.ts` | Closure factory returns async callable keyed by dict args; type guessing still stubbed |
| asynchrone/__init__.py | ✅ Implemented in `src/OpenHosta/asynchrone/index.ts` | Re-exports async helpers for parity |
| semantics/operators.py | 🟡 Partial in `src/OpenHosta/semantics/operators.ts` | `test`/`test_async` wrap closures but only expose async semantics |
| utils/errors.py | ✅ Implemented in `src/OpenHosta/utils/errors.ts` | Brings over OpenHosta error hierarchy for consistent throwing/logging |
| utils/import_handler.py | ✅ Implemented in `src/OpenHosta/utils/importHandler.ts` | Adds Node-side package availability probes (mirrors Python capability flags) |

## Key Differences & Limitations (v0.1)
- **Templating engine:** The Python version relies on Jinja2; the JS port uses Nunjucks (official Jinja2 port). Feature parity is high but not perfect—filters/extensions implemented only on the client must be re-created via custom Nunjucks environment configuration. Any advanced Jinja behaviors (async filters, sandboxing) may need bespoke adapters.
- **Rendering signature:** Python exposes both `*args` and `**kwargs` when calling `Template.render`. In JS we can only accept a single context object (`Record<string, unknown>`). Callers that relied on positional argument unpacking will need to pass a single dictionary.
- **Whitespace handling:** We emulate `textwrap.dedent` and the double-blank-line cleanup performed in Python. Edge cases where Python preserved leading/trailing blank lines may still differ slightly; tests should be added once more prompts are ported.
- **Environment overrides:** Python forwards `*args/**kargs` to `jinja2.Template`. The JS port instead accepts an optional `env` (a `nunjucks.Environment`). Additional template-level toggles must be provided via that environment instance until we see concrete use cases.
- **Inspection hooks:** Python functions receive rich objects via attributes. The TS helpers (`printLastPrompt`, `printLastDecoding`) rely on duck typing and will log fallback messages when the expected methods are missing; stricter typings may emerge once models/pipelines are ported.
- **Core config & defaults:** `.env` discovery matches Python, but the default pipeline/model are placeholders. They accept metadata and API parameters yet do not execute remote calls; the structure is in place so the rest of the system can attach behavior later.
- **Type conversion & analysis:** Python relies on actual runtime types (`typing`, enums, dataclasses, pydantic). JS exposes a `TypeDescriptor` DSL and `setHostaSignature` so callers can describe shapes manually until AST-based inspection is ported. Automatic extraction of annotations/docstrings still to come.
- **Pipeline execution:** `OneTurnConversationPipeline` now builds prompts and decodes responses, but lacks automatic image resizing, multi-model routing, and richer logging utilities present in Python.
- **Inspection lifecycle:** JS cannot discover caller frames, so inspections only refresh when callers pass `args` explicitly; decorators still need to synthesize docstrings/annotations manually.
- **Model surface & errors:** The OpenAI-compatible client issues real HTTP requests but still lacks streaming, retry/backoff controls, and token accounting hooks built into the Python base model.
- **Execution helpers:** `ask`, `emulate`, `closure`, and `test` exist but are promise-based only; callers must provide target functions and argument dictionaries explicitly instead of relying on implicit stack inspection.
- **Call-site metadata:** Because JS cannot walk frames like Python, callers must pass the target function plus an args dictionary into `emulate`/`closure`; automatic capture of locals and annotations remains future work.

## Action Plan
1. **Stabilize MetaPrompt API**
   - Flesh out unit tests comparing Python & TS outputs for representative prompts (JSON mode, conditionals, whitespace).
   - Decide whether to expose helpers for registering filters/tests so higher layers can stay declarative.
2. **Inspection & analyzer integration**
   - Prototype decorators or Babel plugins that can capture argument names/values automatically, easing the burden on `emulate` callers.
   - Add helpers to translate TS interfaces/enums into `TypeDescriptor`s so manual descriptors are optional.
3. **Pipeline & execution surface**
   - Add optional image resizing/compression plus multi-model selection policies and richer logging hooks.
   - Offer synchronous-looking wrappers (or codemods) so existing Python tutorials map cleanly to JS without pervasive `async/await`.
4. **Model & validation layer**
   - Implement retry/backoff, streaming, and token accounting on `Model`, then extend `OpenAICompatibleModel` to consume them.
   - Build a TS analogue of `core/pydantic_proxy.py` (likely powered by Zod/TypeBox) so type definitions and JSON Schemas can be generated at runtime.
5. **Type conversion automation**
   - Extend `core/typeConverter.ts` so enums, dataclasses, and descriptor metadata can be derived automatically once inspection runs.
   - Revisit how `.env` overrides register filters/tests on the pipeline, mirroring Python’s dynamic config updates.
6. **Ecosystem alignment**
   - Document any Python-only behaviors we cannot reproduce in JS (dynamic imports, `inspect` limitations) and keep migration recipes for prompts/config files in sync across both stacks.

### Immediate Next Steps
1. Prototype decorators/Babel plugins that capture argument values automatically so `emulate`/`closure` can infer signatures without manual dictionaries.
2. Add image resizing + retry/backoff handling inside `OneTurnConversationPipeline` and `OpenAICompatibleModel`, ensuring parity with Python’s PIL + rate-limit behavior.

Maintaining this table for every milestone will help the Python and JS implementations evolve together without divergence.
