# Python vs JavaScript/TypeScript - Emulate Comparison

## Key Difference: Frame Introspection

**Python** can introspect the call stack to automatically capture function arguments at runtime. **JavaScript/TypeScript** cannot do this, so we must explicitly pass the function and its arguments to `emulate()`.

---

## Example: Translate Function

### Python (Original)

```python
from OpenHosta import emulate

def translate(text: str, language: str) -> str:
    """
    This function translates the text in the "text" parameter into the
    language specified in the "language" parameter.
    """
    return emulate()  # ✨ Python auto-captures text & language from stack

result = translate("Hello World!", "French")
print(result)
# Bonjour le monde !
```

**How it works in Python:**
- `emulate()` called inside `translate` inspects the call stack
- Automatically extracts `text="Hello World!"` and `language="French"`
- Uses function annotations (`str`, docstring) for type information

---

### TypeScript Version

See: `examples/simpleEmulateExample.ts`

```typescript
import { emulate, setHostaSignature, type HostaInspectableFunction } from "../dist/index.js";

// TypeScript requires (...args: unknown[]) => unknown signature
const translate = ((..._args: unknown[]): unknown => {
  return "";
}) as HostaInspectableFunction;

setHostaSignature(translate, {
  doc: 'Translates text into the specified language.',
  args: [
    { name: "text", type: "string" },
    { name: "language", type: "string" }
  ],
  type: "string"
});

const result = await emulate({
  fn: translate,
  args: { text: "Hello World!", language: "French" }
});

console.log(result);
// Bonjour le monde !
```

**Why different from Python:**
- ❌ No frame introspection → must pass `fn` and `args` explicitly
- ❌ No native type hints → must call `setHostaSignature()` manually
- ⚠️ Must cast function to `HostaInspectableFunction` type
- ✅ Same meta-prompting behavior once annotations are set

**Run with:** `npx tsx examples/simpleEmulateExample.ts`

---

### JavaScript Alternative (from other examples)

For JavaScript usage without TypeScript, see the comprehensive examples:
- `examples/emulateExample.js` - Full emulate examples with various types
- `examples/askExample.js` - Simpler API for direct LLM queries
- `examples/closureExample.js` - Reusable LLM-backed functions

---

## Summary

| Feature | Python | JavaScript | TypeScript |
|---------|--------|------------|------------|
| **Auto-capture args** | ✅ Yes (frame introspection) | ❌ No | ❌ No |
| **Type annotations** | ✅ Native (`str`, `: int`) | ❌ Manual (`setHostaSignature`) | ⚠️ Manual (`setHostaSignature`) |
| **Explicit fn/args** | ❌ Not needed | ✅ Required | ✅ Required |
| **Type safety** | Runtime only | None | ✅ Compile-time |
| **Ergonomics** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ (with wrappers) |

---

## Running the Examples

```bash
# Build first
npm run build

# TypeScript version (requires tsx)
npx tsx examples/simpleEmulateExample.ts

# JavaScript examples (with real API calls)
npm run example:emulate
npm run example:ask
npm run example:closure

# Without API key (mock testing)
npm run example:mock
```

---

## Future: Decorator Support?

We could add experimental decorator support to make TypeScript closer to Python:

```typescript
@emulatable({ type: "string" })
function translate(
  @arg("string") text: string,
  @arg("string") language: string
): string {
  return emulate(); // Could work with Babel/TypeScript transformer
}
```

But this would require:
- Babel plugin or TypeScript transformer
- Still can't get runtime argument *values* without Proxy magic
- Added complexity vs explicit `emulate({ fn, args })`
