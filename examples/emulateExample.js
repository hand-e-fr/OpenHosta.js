import { emulate, setHostaSignature, printLastPrompt, printLastDecoding } from "../dist/index.js";

// Example 1: Emulate a simple function
function addNumbers(a, b) {
  // This function will be emulated by the LLM
  return a + b;
}

setHostaSignature(addNumbers, {
  doc: "Add two numbers together and return the sum.",
  args: [
    { name: "a", type: "number" },
    { name: "b", type: "number" }
  ],
  type: "number"
});

async function simpleEmulate() {
  console.log("=== Simple Emulate Example ===");
  try {
    const result = await emulate({
      fn: addNumbers,
      args: { a: 15, b: 27 }
    });
    console.log("Result:", result);
    console.log("Type:", typeof result);
  } catch (error) {
    console.error("Error:", error.message);
    console.log("(Make sure OPENAI_API_KEY is set in your environment)");
  }
}

// Example 2: Emulate with array return type
function generatePrimes(count) {
  return [];
}

setHostaSignature(generatePrimes, {
  doc: "Generate a list of the first N prime numbers.",
  args: [{ name: "count", type: "number" }],
  type: {
    kind: "array",
    items: "number"
  }
});

async function emulateWithArray() {
  console.log("\n=== Emulate with Array Return ===");
  try {
    const result = await emulate({
      fn: generatePrimes,
      args: { count: 5 }
    });
    console.log("Result:", result);
    console.log("Is Array:", Array.isArray(result));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 3: Emulate with complex object return
function analyzeText(text) {
  return {};
}

setHostaSignature(analyzeText, {
  doc: "Analyze text and return sentiment, word count, and key topics.",
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

async function emulateWithObject() {
  console.log("\n=== Emulate with Object Return ===");
  try {
    const result = await emulate({
      fn: analyzeText,
      args: { text: "OpenHosta is a powerful meta-prompting framework for TypeScript and Python." }
    });
    console.log("Result:");
    console.dir(result, { depth: null });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 4: Inspect the last prompt and decoding
function translateText(text, targetLanguage) {
  return "";
}

setHostaSignature(translateText, {
  doc: "Translate text to the specified target language.",
  args: [
    { name: "text", type: "string" },
    { name: "targetLanguage", type: "string" }
  ],
  type: "string"
});

async function emulateWithInspection() {
  console.log("\n=== Emulate with Inspection ===");
  try {
    const result = await emulate({
      fn: translateText,
      args: {
        text: "Hello, world!",
        targetLanguage: "French"
      }
    });
    console.log("Translation:", result);

    console.log("\n--- Last Prompt ---");
    printLastPrompt(translateText);

    console.log("\n--- Last Decoding ---");
    printLastDecoding(translateText);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 5: Force return type override
function guessNumber() {
  return 0;
}

setHostaSignature(guessNumber, {
  doc: "Guess a random number between 1 and 100",
  args: [],
  type: "string" // Originally string, but we'll override
});

async function emulateWithTypeOverride() {
  console.log("\n=== Emulate with Type Override ===");
  try {
    const result = await emulate({
      fn: guessNumber,
      args: {},
      forceReturnType: "number" // Override to number
    });
    console.log("Result:", result);
    console.log("Type:", typeof result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run all examples
(async () => {
  await simpleEmulate();
  await emulateWithArray();
  await emulateWithObject();
  await emulateWithInspection();
  await emulateWithTypeOverride();
})();
