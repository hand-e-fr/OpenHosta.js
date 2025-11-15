import { printLastPrompt, printLastDecoding } from "../dist/index.js";

function buildFakeInspection() {
  return {
    logs: {
      llm_api_messages_sent: [
        { role: "system", content: [{ type: "text", text: "System prompt text" }] },
        { role: "user", content: [{ type: "text", text: "User question content" }] }
      ],
      rational: "Reasoning tokens ...",
      answer: "Final answer",
      response_string: '{"answer": "Final answer"}',
      response_data: { answer: "Final answer" }
    }
  };
}

const fakeFunction = () => {};
fakeFunction.hosta_inspection = {
  ...buildFakeInspection(),
  model: {
    model_name: "demo-model",
    base_url: "https://demo.llm",
    print_last_prompt: (inspection) => {
      console.log("[MODEL] Last prompt log");
      console.dir(inspection.logs.llm_api_messages_sent, { depth: null });
    }
  },
  pipeline: {
    print_last_decoding: (inspection) => {
      console.log("[PIPELINE] Decoding log");
      console.log(inspection.logs.rational);
      console.log(inspection.logs.answer);
    }
  }
};

console.log("=== printLastPrompt ===");
printLastPrompt(fakeFunction);

console.log("\n=== printLastDecoding ===");
printLastDecoding(fakeFunction);
