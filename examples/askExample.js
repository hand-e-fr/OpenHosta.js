import { ask, OpenAICompatibleModel } from "../dist/index.js";

// Example 1: Simple text question with default model
async function simpleAsk() {
  console.log("=== Simple Ask Example ===");
  try {
    const answer = await ask("What is 2 + 2?");
    console.log("Answer:", answer);
  } catch (error) {
    console.error("Error:", error.message);
    console.log("(Make sure OPENAI_API_KEY is set in your environment)");
  }
}

// Example 2: Ask with custom system prompt
async function askWithSystemPrompt() {
  console.log("\n=== Ask with Custom System Prompt ===");
  try {
    const answer = await ask("Explain gravity", {}, {
      system: "You are a physics teacher. Explain concepts in simple terms for high school students."
    });
    console.log("Answer:", answer);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 3: Ask with custom model and force JSON output
async function askWithCustomModel() {
  console.log("\n=== Ask with Custom Model (JSON mode) ===");

  const customModel = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    apiParameters: {
      temperature: 0.7,
      max_tokens: 200
    }
  });

  try {
    const answer = await ask(
      "List 3 programming languages and their primary use cases. Return as JSON.",
      {},
      {
        model: customModel,
        forceJsonOutput: true
      }
    );
    console.log("JSON Answer:", answer);
    if (answer) {
      try {
        // Remove markdown code blocks if present
        let cleanJson = answer;
        if (answer.includes("```json")) {
          cleanJson = answer.replace(/```json\n?/g, "").replace(/```/g, "").trim();
        } else if (answer.includes("```")) {
          cleanJson = answer.replace(/```\n?/g, "").trim();
        }
        const parsed = JSON.parse(cleanJson);
        console.log("Parsed:", parsed);
      } catch (e) {
        console.log("(Could not parse as JSON)");
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 4: Ask with named arguments (context injection)
async function askWithNamedArgs() {
  console.log("\n=== Ask with Named Arguments ===");
  try {
    const answer = await ask(
      "Summarize this code snippet and suggest improvements",
      {
        code: `
function calc(x, y) {
  return x + y;
}
        `,
        language: "JavaScript"
      }
    );
    console.log("Answer:", answer);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run all examples
(async () => {
  await simpleAsk();
  await askWithSystemPrompt();
  await askWithCustomModel();
  await askWithNamedArgs();
})();
