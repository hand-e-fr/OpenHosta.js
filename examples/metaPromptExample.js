import { MetaPrompt, EMULATE_META_PROMPT } from "../dist/index.js";

// Basic prompt
const greetingPrompt = new MetaPrompt(`\
    You are a helpful assistant.

    Greet {{ user_name }} in a friendly tone.
`);

const renderedGreeting = greetingPrompt.render({ user_name: "OpenHosta" });
console.log("=== Greeting Prompt ===");
console.log(renderedGreeting);
console.log();

// Reuse the shared EMULATE_META_PROMPT template with some arguments
const emulateOutput = EMULATE_META_PROMPT.render({
  function_return_as_python_type: "List[int]",
  function_name: "predict_numbers",
  function_args: "seed: int",
  function_return_type_name: "list[int]",
  function_doc: "Return a realistic looking sequence of numbers",
  function_return_as_json_schema: JSON.stringify({
    type: "array",
    items: { type: "integer" }
  }),
  use_json_mode: true,
  allow_thinking: false,
  examples_database: "- predict_numbers(42) -> [40, 41, 42]"
});

console.log("=== EMULATE_META_PROMPT ===");
console.log(emulateOutput);
