# OpenHosta.js Porting Tracker

## Snapshot (v0.1)
| Python module (OpenHosta/src/OpenHosta) | JS parity | Notes |
| --- | --- | --- |
| core/meta_prompt.py | ✅ Implemented in `src/OpenHosta/core/metaPrompt.ts` using nunjucks | Provides `MetaPrompt`, `EMULATE_META_PROMPT`, `USER_CALL_META_PROMPT` equivalents |
| core/logger.py | ✅ Implemented in `src/OpenHosta/core/logger.ts` | Adds `printLastPrompt`, `printLastDecoding` with `hosta_inspection` contract |
| core/config.py | 🟡 Partial in `src/OpenHosta/core/config.ts` | Default model/pipeline wiring + `.env` loader done; depends on placeholder model/pipeline behavior |
| core/type_converter.py | 🟡 Partial in `src/OpenHosta/core/typeConverter.ts` | Flexible `TypeDescriptor` runtime schema + conversion helpers; lacks Python's automatic `inspect` integration |
| core/analizer.py | 🟡 Partial in `src/OpenHosta/core/analyzer.ts` | `setHostaSignature`, `hostaAnalyze`, and encoding helpers exist; automatic AST/introspection TBD |
| models/OpenAICompatible.py | 🟡 Skeleton in `src/OpenHosta/models/OpenAICompatibleModel.ts` | Holds model metadata/API params; API calls & inspection logs still TODO |
| pipelines/simple_pipeline.py | 🟡 Skeleton in `src/OpenHosta/pipelines/simplePipeline.ts` | Structure + prompt references exist; `push/pull` logic not yet ported |
| core/* (analizer, inspection, pydantic_proxy) | 🔄 Not started | Need translation strategies (Jinja inspection, runtime validation) |
| asynchrone, exec, models (others), semantics, utils | 🔄 Not started | Require deeper analysis of concurrency primitives, pipeline orchestration |

## Key Differences & Limitations (v0.1)
- **Templating engine:** The Python version relies on Jinja2; the JS port uses Nunjucks (official Jinja2 port). Feature parity is high but not perfect—filters/extensions implemented only on the client must be re-created via custom Nunjucks environment configuration. Any advanced Jinja behaviors (async filters, sandboxing) may need bespoke adapters.
- **Rendering signature:** Python exposes both `*args` and `**kwargs` when calling `Template.render`. In JS we can only accept a single context object (`Record<string, unknown>`). Callers that relied on positional argument unpacking will need to pass a single dictionary.
- **Whitespace handling:** We emulate `textwrap.dedent` and the double-blank-line cleanup performed in Python. Edge cases where Python preserved leading/trailing blank lines may still differ slightly; tests should be added once more prompts are ported.
- **Environment overrides:** Python forwards `*args/**kargs` to `jinja2.Template`. The JS port instead accepts an optional `env` (a `nunjucks.Environment`). Additional template-level toggles must be provided via that environment instance until we see concrete use cases.
- **Inspection hooks:** Python functions receive rich objects via attributes. The TS helpers (`printLastPrompt`, `printLastDecoding`) rely on duck typing and will log fallback messages when the expected methods are missing; stricter typings may emerge once models/pipelines are ported.
- **Core config & defaults:** `.env` discovery matches Python, but the default pipeline/model are placeholders. They accept metadata and API parameters yet do not execute remote calls; the structure is in place so the rest of the system can attach behavior later.
- **Type conversion & analysis:** Python relies on actual runtime types (`typing`, enums, dataclasses, pydantic). JS exposes a `TypeDescriptor` DSL and `setHostaSignature` so callers can describe shapes manually until AST-based inspection is ported. Automatic extraction of annotations/docstrings still to come.
- **Pipeline execution:** `OneTurnConversationPipeline` currently throws for `push/pull`. The scaffolding ensures config references remain consistent while we translate the full encode/analyse flow.

## Action Plan
1. **Stabilize MetaPrompt API**
   - Flesh out unit tests comparing Python & TS outputs for representative prompts (JSON mode, conditionals, whitespace).
   - Decide whether to expose helpers for registering filters/tests so higher layers can stay declarative.
2. **Type conversion integration**
   - Finish `core/analizer` & port `core/inspection` so signatures/descriptors can be inferred automatically (without manual `setHostaSignature`).
   - Wire `OneTurnConversationPipeline.pull` to consume descriptors and feed `typeReturnedData`, ensuring parity with Python’s `type_returned_data`.
3. **Core helper completion**
   - Implement `core/pydantic_proxy` equivalents (probably via Zod/TypeBox) so pipelines can validate structured responses.
   - Extend `core/config` to allow registering custom filters/tests and to hot-swap models/pipelines just like Python.
4. **Model & pipeline layers (v0.3+)**
   - Flesh out `OpenAICompatibleModel` with real HTTP calls + inspection logging, then implement `Pipeline.push/pull`.
   - Translate remaining pipeline utilities under `exec/` so JS can run end-to-end prompt executions and emulate.
5. **Ecosystem alignment**
   - Document any Python-only behaviors we cannot reproduce in JS (e.g., dynamic import hooks, reliance on `inspect` module).
   - Provide migration recipes so the same team can share prompts/config across both stacks (prompt storage, shared `.env` formats, etc.).

Maintaining this table for every milestone will help the Python and JS implementations evolve together without divergence.
