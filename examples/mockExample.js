import {
  OneTurnConversationPipeline,
  Model,
  ModelCapabilities,
  setHostaSignature,
  getHostaInspection
} from "../dist/index.js";

// Mock Model that doesn't make real API calls
class MockModel extends Model {
  constructor() {
    super({
      apiParameters: { temperature: 0.7, max_tokens: 100 }
    });
    this.model_name = "mock-model";
    this.capabilities = new Set([
      ModelCapabilities.TEXT2TEXT,
      ModelCapabilities.JSON_OUTPUT
    ]);
  }

  async apiCall(messages, llmArgs) {
    console.log("\n[MockModel] Received messages:");
    messages.forEach((msg, i) => {
      console.log(`  [${i}] ${msg.role}:`, msg.content[0]?.text?.substring(0, 100) + "...");
    });
    console.log("\n[MockModel] LLM Args:", llmArgs);

    // Update counters like OpenAICompatibleModel
    this._nb_requests += 1;

    // Return a mock response based on the function being emulated
    const response = {
      choices: [
        {
          message: {
            content: "42",
            role: "assistant"
          }
        }
      ],
      usage: {
        total_tokens: 150
      }
    };

    // Update token counter
    if (response.usage?.total_tokens) {
      this._used_tokens += response.usage.total_tokens;
    }

    return response;
  }

  getResponseContent(response) {
    return response.choices?.[0]?.message?.content ?? "";
  }
}

// Example 1: Test pipeline push/pull without API calls
async function testPipelinePushPull() {
  console.log("=== Mock Pipeline Test ===");

  const mockModel = new MockModel();
  const pipeline = new OneTurnConversationPipeline({
    modelList: [mockModel]
  });

  function addNumbers(a, b) {
    return a + b;
  }

  setHostaSignature(addNumbers, {
    doc: "Add two numbers together.",
    args: [
      { name: "a", type: "number" },
      { name: "b", type: "number" }
    ],
    type: "number"
  });

  const inspection = getHostaInspection(addNumbers, {
    args: { a: 10, b: 32 }
  });

  // PUSH: Generate messages
  console.log("\n--- PUSH Phase ---");
  const messages = pipeline.push(inspection);
  console.log(`Generated ${messages.length} messages`);
  console.log("Prompt data keys:", Object.keys(inspection.prompt_data || {}));

  // Mock API call
  const response = await mockModel.apiCall(messages, pipeline.llm_args);

  // PULL: Extract result
  console.log("\n--- PULL Phase ---");
  const result = pipeline.pull(inspection, response);
  console.log("Result:", result);
  console.log("Type:", typeof result);

  console.log("\n--- Inspection Logs ---");
  console.log("Response string:", inspection.logs.response_string);
  console.log("Response data:", inspection.logs.response_data);
}

// Example 2: Test with array return type
async function testArrayReturn() {
  console.log("\n\n=== Mock Array Return Test ===");

  class MockArrayModel extends MockModel {
    async apiCall(messages, llmArgs) {
      console.log("\n[MockModel] Received messages:");
      messages.forEach((msg, i) => {
        console.log(`  [${i}] ${msg.role}:`, msg.content[0]?.text?.substring(0, 100) + "...");
      });
      console.log("\n[MockModel] LLM Args:", llmArgs);

      this._nb_requests += 1;

      const response = {
        choices: [
          {
            message: {
              content: '[2, 3, 5, 7, 11]',
              role: "assistant"
            }
          }
        ],
        usage: { total_tokens: 100 }
      };

      if (response.usage?.total_tokens) {
        this._used_tokens += response.usage.total_tokens;
      }

      return response;
    }
  }

  const mockModel = new MockArrayModel();
  const pipeline = new OneTurnConversationPipeline({
    modelList: [mockModel]
  });

  function generatePrimes(count) {
    return [];
  }

  setHostaSignature(generatePrimes, {
    doc: "Generate the first N prime numbers.",
    args: [{ name: "count", type: "number" }],
    type: {
      kind: "array",
      items: "number"
    }
  });

  const inspection = getHostaInspection(generatePrimes, {
    args: { count: 5 }
  });

  const messages = pipeline.push(inspection);
  const response = await mockModel.apiCall(messages, pipeline.llm_args);
  const result = pipeline.pull(inspection, response);

  console.log("Result:", result);
  console.log("Is Array:", Array.isArray(result));
  console.log("Length:", result?.length);
}

// Example 3: Test with object return type
async function testObjectReturn() {
  console.log("\n\n=== Mock Object Return Test ===");

  class MockObjectModel extends MockModel {
    async apiCall(messages, llmArgs) {
      console.log("\n[MockModel] Received messages:");
      messages.forEach((msg, i) => {
        console.log(`  [${i}] ${msg.role}:`, msg.content[0]?.text?.substring(0, 100) + "...");
      });
      console.log("\n[MockModel] LLM Args:", llmArgs);

      this._nb_requests += 1;

      const response = {
        choices: [
          {
            message: {
              content: '{"sentiment": "positive", "word_count": 10, "topics": ["programming", "framework"]}',
              role: "assistant"
            }
          }
        ],
        usage: { total_tokens: 120 }
      };

      if (response.usage?.total_tokens) {
        this._used_tokens += response.usage.total_tokens;
      }

      return response;
    }
  }

  const mockModel = new MockObjectModel();
  const pipeline = new OneTurnConversationPipeline({
    modelList: [mockModel]
  });

  function analyzeText(text) {
    return {};
  }

  setHostaSignature(analyzeText, {
    doc: "Analyze text sentiment and extract topics.",
    args: [{ name: "text", type: "string" }],
    type: {
      kind: "object",
      properties: {
        sentiment: "string",
        word_count: "number",
        topics: { kind: "array", items: "string" }
      }
    }
  });

  const inspection = getHostaInspection(analyzeText, {
    args: { text: "OpenHosta is an amazing meta-prompting framework!" }
  });

  const messages = pipeline.push(inspection);
  const response = await mockModel.apiCall(messages, pipeline.llm_args);
  const result = pipeline.pull(inspection, response);

  console.log("Result:");
  console.dir(result, { depth: null });
}

// Example 4: Test token counting
async function testTokenCounting() {
  console.log("\n\n=== Mock Token Counting Test ===");

  const mockModel = new MockModel();
  console.log("Initial tokens used:", mockModel.used_tokens);
  console.log("Initial requests:", mockModel.nb_requests);

  const pipeline = new OneTurnConversationPipeline({
    modelList: [mockModel]
  });

  function dummy() {
    return "";
  }

  setHostaSignature(dummy, {
    doc: "Test function",
    args: [],
    type: "string"
  });

  // Make 3 calls
  for (let i = 0; i < 3; i++) {
    const inspection = getHostaInspection(dummy, { args: {} });
    const messages = pipeline.push(inspection);
    const response = await mockModel.apiCall(messages, pipeline.llm_args);
    pipeline.pull(inspection, response);
  }

  console.log("Final tokens used:", mockModel.used_tokens);
  console.log("Final requests:", mockModel.nb_requests);
}

// Run all examples
(async () => {
  await testPipelinePushPull();
  await testArrayReturn();
  await testObjectReturn();
  await testTokenCounting();

  console.log("\n\n✅ All mock tests completed successfully!");
  console.log("These examples demonstrate the pipeline flow without requiring an API key.");
})();
