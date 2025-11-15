import {
  OneTurnConversationPipeline,
  OpenAICompatibleModel,
  setHostaSignature,
  getHostaInspection
} from "../dist/index.js";

// Example 1: Direct pipeline push/pull with a simple function
async function simplePipelineFlow() {
  console.log("=== Simple Pipeline Push/Pull ===");

  // Create a model
  const model = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  });

  // Create a pipeline
  const pipeline = new OneTurnConversationPipeline({
    modelList: [model]
  });

  // Define and annotate a function
  function calculateArea(width, height) {
    return width * height;
  }

  setHostaSignature(calculateArea, {
    doc: "Calculate the area of a rectangle given its width and height.",
    args: [
      { name: "width", type: "number" },
      { name: "height", type: "number" }
    ],
    type: "number"
  });

  try {
    // Get inspection
    const inspection = getHostaInspection(calculateArea, {
      args: { width: 12, height: 8 }
    });

    // PUSH: Generate messages for the LLM
    const messages = pipeline.push(inspection);
    console.log("\n--- Generated Messages ---");
    console.log("System:", messages[0]?.content?.[0]?.text?.substring(0, 200) + "...");
    console.log("\nUser:", messages[1]?.content?.[0]?.text?.substring(0, 200) + "...");

    // Call the model
    console.log("\n--- Calling Model ---");
    const response = await model.apiCall(messages, pipeline.llm_args);
    console.log("Response received");

    // PULL: Extract and type the response
    const result = pipeline.pull(inspection, response);
    console.log("\n--- Result ---");
    console.log("Area:", result);
    console.log("Type:", typeof result);

    // Inspect logs
    console.log("\n--- Inspection Logs ---");
    console.log("Rational:", inspection.logs.rational || "(none)");
    console.log("Answer:", inspection.logs.answer);
  } catch (error) {
    console.error("Error:", error.message);
    console.log("(Make sure OPENAI_API_KEY is set in your environment)");
  }
}

// Example 2: Pipeline with custom meta-prompts
async function pipelineWithCustomPrompts() {
  console.log("\n\n=== Pipeline with Custom Meta-Prompts ===");

  const model = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    apiParameters: {
      temperature: 0.3
    }
  });

  const pipeline = new OneTurnConversationPipeline({
    modelList: [model]
  });

  // Modify pipeline settings
  pipeline.llm_args = {
    temperature: 0.7,
    max_tokens: 150
  };

  function summarizeArticle(article, maxWords) {
    return "";
  }

  setHostaSignature(summarizeArticle, {
    doc: "Summarize the article in the specified number of words.",
    args: [
      { name: "article", type: "string" },
      { name: "maxWords", type: "number" }
    ],
    type: "string"
  });

  try {
    const inspection = getHostaInspection(summarizeArticle, {
      args: {
        article: "Artificial intelligence is transforming industries...",
        maxWords: 20
      }
    });

    const messages = pipeline.push(inspection);
    const response = await model.apiCall(messages, pipeline.llm_args);
    const result = pipeline.pull(inspection, response);

    console.log("Summary:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 3: Pipeline with array return type and JSON mode
async function pipelineWithArrayReturn() {
  console.log("\n\n=== Pipeline with Array Return (JSON Mode) ===");

  const model = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  });

  const pipeline = new OneTurnConversationPipeline({
    modelList: [model]
  });

  function listCapitals(continent) {
    return [];
  }

  setHostaSignature(listCapitals, {
    doc: "List 5 capital cities from the given continent.",
    args: [{ name: "continent", type: "string" }],
    type: {
      kind: "array",
      items: "string"
    }
  });

  try {
    const inspection = getHostaInspection(listCapitals, {
      args: { continent: "Europe" }
    });

    const messages = pipeline.push(inspection);
    const response = await model.apiCall(messages, {
      ...pipeline.llm_args,
      force_json_output: true
    });
    const result = pipeline.pull(inspection, response);

    console.log("Capitals:");
    if (Array.isArray(result)) {
      result.forEach((city, i) => console.log(`  ${i + 1}. ${city}`));
    } else {
      console.log(result);
    }

    console.log("\n--- Response String ---");
    console.log(inspection.logs.response_string);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 4: Pipeline with complex object return
async function pipelineWithObjectReturn() {
  console.log("\n\n=== Pipeline with Object Return ===");

  const model = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  });

  const pipeline = new OneTurnConversationPipeline({
    modelList: [model]
  });

  function analyzeCode(code, language) {
    return {};
  }

  setHostaSignature(analyzeCode, {
    doc: "Analyze code and return complexity score, line count, and suggestions.",
    args: [
      { name: "code", type: "string" },
      { name: "language", type: "string" }
    ],
    type: {
      kind: "object",
      properties: {
        complexity: "string",
        line_count: "number",
        suggestions: { kind: "array", items: "string" }
      }
    }
  });

  try {
    const inspection = getHostaInspection(analyzeCode, {
      args: {
        code: "function add(a, b) { return a + b; }",
        language: "JavaScript"
      }
    });

    const messages = pipeline.push(inspection);
    const response = await model.apiCall(messages, {
      ...pipeline.llm_args,
      force_json_output: true
    });
    const result = pipeline.pull(inspection, response);

    console.log("Analysis:");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 5: Accessing pipeline decoding logs
async function pipelineWithDecodingInspection() {
  console.log("\n\n=== Pipeline with Decoding Inspection ===");

  const model = new OpenAICompatibleModel({
    modelName: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY
  });

  const pipeline = new OneTurnConversationPipeline({
    modelList: [model]
  });

  function isPrime(n) {
    return false;
  }

  setHostaSignature(isPrime, {
    doc: "Check if the given number is prime. Return true or false.",
    args: [{ name: "n", type: "number" }],
    type: "boolean"
  });

  try {
    const inspection = getHostaInspection(isPrime, {
      args: { n: 17 }
    });

    const messages = pipeline.push(inspection);
    const response = await model.apiCall(messages, pipeline.llm_args);
    const result = pipeline.pull(inspection, response);

    console.log("Is 17 prime?", result);

    console.log("\n--- Decoding Logs ---");
    pipeline.print_last_decoding(inspection);

    console.log("\n--- Model Prompt ---");
    model.print_last_prompt(inspection);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run all examples
(async () => {
  await simplePipelineFlow();
  await pipelineWithCustomPrompts();
  await pipelineWithArrayReturn();
  await pipelineWithObjectReturn();
  await pipelineWithDecodingInspection();
})();
