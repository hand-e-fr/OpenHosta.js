# OpenHosta.js Porting Tracker

## Snapshot (v0.1)
| Python module (OpenHosta/src/OpenHosta) | JS parity | Notes |
| --- | --- | --- |
| core/meta_prompt.py | ✅ Implemented in `src/OpenHosta/core/metaPrompt.ts` using nunjucks | Provides `MetaPrompt`, `EMULATE_META_PROMPT`, `USER_CALL_META_PROMPT` equivalents |
| core/logger.py | ✅ Implemented in `src/OpenHosta/core/logger.ts` | Adds `printLastPrompt`, `printLastDecoding` with `hosta_inspection` contract |
| core/config.py | 🟡 Partial in `src/OpenHosta/core/config.ts` | Default model/pipeline wiring + `.env` loader done; depends on placeholder model/pipeline behavior |
| core/type_converter.py | 🟡 Partial in `src/OpenHosta/core/typeConverter.ts` | Runtime `TypeDescriptor` DSL + JSON schema serialization present; JS lacks Python's dataclass/Pydantic/enum reflection and uses manual descriptors |
| core/analizer.py | 🟡 Partial in `src/OpenHosta/core/analyzer.ts` | `setHostaSignature`, `hostaAnalyze`, and encoding helpers exist; no frame-introspection, args only update when callers pass `HostaAnalyzeOptions` |
| core/inspection.py | 🔄 Missing | Frame walking, `get_hosta_inspection`, and closure-aware cache are not yet ported—JS currently has no way to derive metadata at call time |
| core/pydantic_proxy.py | 🔄 Missing | Needs strategy for reconstructing Pydantic/Zod models and exporting definitions when templates ask for them |
| models/OpenAICompatible.py | 🟡 Skeleton in `src/OpenHosta/models/OpenAICompatibleModel.ts` | Holds model metadata/API params; API calls & inspection logs still TODO |
| models/base_model.py | 🔄 Missing | Need async executor pooling, capability flags, `api_call`/`get_response_content` contracts |
| pipelines/simple_pipeline.py | 🟡 Skeleton in `src/OpenHosta/pipelines/simplePipeline.ts` | Structure + prompt references exist; `push/pull` logic not yet ported |
| exec/ask.py | 🔄 Missing | JS has no direct `ask()` helper for single-shot prompts or image attachments |
| exec/emulate.py | 🔄 Missing | Function emulation loop (inspection → pipeline → model) needs port plus retry/rate-limit handling |
| exec/closure.py | 🔄 Missing | Closure factory and type guessing hooks absent; dependent on inspection + pipeline parity |
| asynchrone/__init__.py | 🔄 Missing | Async façade (`ask/emulate/closure/test`) not exposed in JS package |
| semantics/operators.py | 🔄 Missing | `test`/`test_async` wrappers around closures still to build |
| utils/errors.py | 🔄 Missing | Custom exception hierarchy (`RequestError`, `RateLimitError`, etc.) not mirrored in JS |
| utils/import_handler.py | 🔄 Missing | Capability probes (`is_pydantic_available`, `is_torch_available`) need JS equivalents |

## Key Differences & Limitations (v0.1)
- **Templating engine:** The Python version relies on Jinja2; the JS port uses Nunjucks (official Jinja2 port). Feature parity is high but not perfect—filters/extensions implemented only on the client must be re-created via custom Nunjucks environment configuration. Any advanced Jinja behaviors (async filters, sandboxing) may need bespoke adapters.
- **Rendering signature:** Python exposes both `*args` and `**kwargs` when calling `Template.render`. In JS we can only accept a single context object (`Record<string, unknown>`). Callers that relied on positional argument unpacking will need to pass a single dictionary.
- **Whitespace handling:** We emulate `textwrap.dedent` and the double-blank-line cleanup performed in Python. Edge cases where Python preserved leading/trailing blank lines may still differ slightly; tests should be added once more prompts are ported.
- **Environment overrides:** Python forwards `*args/**kargs` to `jinja2.Template`. The JS port instead accepts an optional `env` (a `nunjucks.Environment`). Additional template-level toggles must be provided via that environment instance until we see concrete use cases.
- **Inspection hooks:** Python functions receive rich objects via attributes. The TS helpers (`printLastPrompt`, `printLastDecoding`) rely on duck typing and will log fallback messages when the expected methods are missing; stricter typings may emerge once models/pipelines are ported.
- **Core config & defaults:** `.env` discovery matches Python, but the default pipeline/model are placeholders. They accept metadata and API parameters yet do not execute remote calls; the structure is in place so the rest of the system can attach behavior later.
- **Type conversion & analysis:** Python relies on actual runtime types (`typing`, enums, dataclasses, pydantic). JS exposes a `TypeDescriptor` DSL and `setHostaSignature` so callers can describe shapes manually until AST-based inspection is ported. Automatic extraction of annotations/docstrings still to come.
- **Pipeline execution:** `OneTurnConversationPipeline` currently throws for `push/pull`. The scaffolding ensures config references remain consistent while we translate the full encode/analyse flow.
- **Inspection lifecycle:** Python's `core/inspection.py` stores per-function `hosta_inspection`, refreshes frames, and powers `emulate/closure/test`. None of that exists in TS, so `core/analyzer` cannot gather live args without manual metadata.
- **Model surface & errors:** The JS `OpenAICompatibleModel` lacks HTTP transport, rate-limit retries, and `ModelCapabilities` setup from `models/base_model.py`, so higher layers cannot make real API calls or log consumption/errors like Python's `RequestError`/`RateLimitError`.
- **Execution helpers:** Python exposes synchronous/async `ask`, `emulate`, `closure`, and semantic operators (wrapping pipelines, auto image serialization, and return-type enforcement). JS currently has no equivalent entry points, making it impossible to exercise the pipeline even once.
- **Utility glue:** Availability flags (`utils/import_handler.py`) and structured exceptions are missing, so future modules (pydantic proxy, PIL detection, etc.) cannot share a common capability registry or error contract.

## Action Plan
1. **Stabilize MetaPrompt API**
   - Flesh out unit tests comparing Python & TS outputs for representative prompts (JSON mode, conditionals, whitespace).
   - Decide whether to expose helpers for registering filters/tests so higher layers can stay declarative.
2. **Inspection & analyzer integration**
   - Port `core/inspection.py` (frame walking, `get_hosta_inspection`, `get_last_frame`) and connect it with the existing TS analyzer helpers.
   - Mirror `utils.errors.py` so inspection failures raise deterministic error types that match Python’s behaviour.
3. **Pipeline & execution surface**
   - Complete `OneTurnConversationPipeline.push/pull`, including encode/decode, PIL image resizing, and logging.
   - Implement `exec/emulate`, `exec/closure`, `exec/ask`, plus `asynchrone` and `semantics` wrappers so the library exposes the same high-level API as Python.
4. **Model & validation layer**
   - Port `models/base_model.py` contracts (async executor, capability flags, `get_response_content`, `get_thinking_and_data_sections`).
   - Finish `OpenAICompatibleModel` with real HTTP calls, retries, and response parsing; build a TS equivalent of `core/pydantic_proxy.py` (likely via Zod) so schemas can still be emitted.
5. **Type conversion automation**
   - Extend `core/typeConverter.ts` so enums, dataclasses, and descriptor metadata can be derived automatically once inspection runs.
   - Revisit how `.env` overrides register filters/tests on the pipeline, mirroring Python’s dynamic config updates.
6. **Ecosystem alignment**
   - Document any Python-only behaviors we cannot reproduce in JS (dynamic imports, `inspect` limitations) and keep migration recipes for prompts/config files in sync across both stacks.

Maintaining this table for every milestone will help the Python and JS implementations evolve together without divergence.
