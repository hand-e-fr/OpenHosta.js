/**
 * Simple Emulate Example - Configuration in code (no .env file)
 */

import {
  emulate,
  setHostaSignature,
  config,
  OpenAICompatibleModel,
  type HostaInspectableFunction
} from "../dist/index.js";

// Configure model in code (no .env needed)
config.DefaultModel = new OpenAICompatibleModel({
  modelName: "gpt-4o-mini",
  baseUrl: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY, // From environment or hardcode
  apiParameters: {
    temperature: 0.7,
    max_tokens: 100
  }
});

// Define the function
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

// Call emulate
const result = await emulate({
  fn: translate,
  args: { text: "Hello World!", language: "French" }
});

console.log(result);
