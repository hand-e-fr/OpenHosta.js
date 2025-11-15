/**
 * SIMPLEST EMULATE EXAMPLE - Closest to Python syntax
 *
 * This is the most straightforward way to use emulate in TypeScript,
 * matching the Python API as closely as possible.
 */

import { emulate, setHostaSignature, type HostaInspectableFunction } from "../dist/index.js";

// Define the function signature
// Note: In TypeScript, we need to cast to HostaInspectableFunction or use unknown[] params
const translate = ((..._args: unknown[]): unknown => {
  return ""; // Placeholder - will be emulated by LLM
}) as HostaInspectableFunction;

// Annotate the function for OpenHosta
setHostaSignature(translate, {
  doc: 'Translates text into the specified language.',
  args: [
    { name: "text", type: "string" },
    { name: "language", type: "string" }
  ],
  type: "string"
});

// Call emulate directly - most similar to Python
const result = await emulate({
  fn: translate,
  args: { text: "Hello World!", language: "French" }
});

console.log(result);
// Expected output: Bonjour le monde !
