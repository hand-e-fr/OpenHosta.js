# OpenHosta.js Porting Tracker

## Snapshot (v0.1)
| Python module (OpenHosta/src/OpenHosta) | JS parity | Notes |
| --- | --- | --- |
| core/meta_prompt.py | ✅ Implemented in `src/OpenHosta/core/metaPrompt.ts` using nunjucks | Provides `MetaPrompt`, `EMULATE_META_PROMPT`, `USER_CALL_META_PROMPT` equivalents |
| core/logger.py | ✅ Implemented in `src/OpenHosta/core/logger.ts` | Adds `printLastPrompt`, `printLastDecoding` with `hosta_inspection` contract |
| core/* (analizer, config, inspection, pydantic_proxy, type_converter) | 🔄 Not started | Need translation strategies (nunjucks inspection, config loader, runtime type checks) |
| asynchrone, exec, models, pipelines, semantics, utils | 🔄 Not started | Require deeper analysis of concurrency primitives, data models, pipeline orchestration |

## Key Differences & Limitations (MetaPrompt v0.1)
- **Templating engine:** The Python version relies on Jinja2; the JS port uses Nunjucks (official Jinja2 port). Feature parity is high but not perfect—filters/extensions implemented only on the client must be re-created via custom Nunjucks environment configuration. Any advanced Jinja behaviors (async filters, sandboxing) may need bespoke adapters.
- **Rendering signature:** Python exposes both `*args` and `**kwargs` when calling `Template.render`. In JS we can only accept a single context object (`Record<string, unknown>`). Callers that relied on positional argument unpacking will need to pass a single dictionary.
- **Whitespace handling:** We emulate `textwrap.dedent` and the double-blank-line cleanup performed in Python. Edge cases where Python preserved leading/trailing blank lines may still differ slightly; tests should be added once more prompts are ported.
- **Environment overrides:** Python forwards `*args/**kargs` to `jinja2.Template`. The JS port instead accepts an optional `env` (a `nunjucks.Environment`). Additional template-level toggles must be provided via that environment instance until we see concrete use cases.
- **Inspection hooks:** Python functions receive rich objects via attributes. The TS helpers (`printLastPrompt`, `printLastDecoding`) rely on duck typing and will log fallback messages when the expected methods are missing; stricter typings may emerge once models/pipelines are ported.

## Action Plan
1. **Stabilize MetaPrompt API**
   - Flesh out unit tests comparing Python & TS outputs for representative prompts (JSON mode, conditionals, whitespace).
   - Decide whether to expose helpers for registering filters/tests so higher layers can stay declarative.
2. **Port core helpers next (v0.2)**
   - `core/logger` → wrap `console` with structured logging & log levels mirroring Python's logger configuration.
   - `core/config`, `core/type_converter`, `core/pydantic_proxy` → map Pydantic-based validation to Zod or TypeBox so higher layers keep schema-driven ergonomics.
   - `core/analizer` & `core/inspection` → evaluate feasibility in Node environments (file system, AST parsing) and replace Python-only introspection with TypeScript equivalents.
3. **Model & pipeline layers (v0.3+)**
   - Translate Pydantic models under `models/` and `semantics/` to shared TS interfaces.
   - Recreate pipeline execution (under `pipelines/` & `exec/`) using async iterators/promises while matching hook points and error handling semantics.
4. **Ecosystem alignment**
   - Document any Python-only behaviors we cannot reproduce in JS (e.g., dynamic import hooks, reliance on `inspect` module).
   - Provide migration recipes so the same team can share prompts/config across both stacks (e.g., storing prompts in `.j2` files consumable by both engines).

Maintaining this table for every milestone will help the Python and JS implementations evolve together without divergence.
