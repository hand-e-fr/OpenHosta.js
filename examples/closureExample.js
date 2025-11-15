import { closure } from "../dist/index.js";

// Example 1: Simple closure for text generation
async function simpleClosure() {
  console.log("=== Simple Closure Example ===");

  const generateGreeting = closure("Generate a friendly greeting for the given name");

  try {
    const result1 = await generateGreeting({ name: "Alice" });
    console.log("Greeting for Alice:", result1);

    const result2 = await generateGreeting({ name: "Bob" });
    console.log("Greeting for Bob:", result2);
  } catch (error) {
    console.error("Error:", error.message);
    console.log("(Make sure OPENAI_API_KEY is set in your environment)");
  }
}

// Example 2: Closure with typed return
async function closureWithTypedReturn() {
  console.log("\n=== Closure with Typed Return (Array) ===");

  const listIngredients = closure(
    "List the main ingredients needed for the given recipe",
    {
      forceReturnType: {
        kind: "array",
        items: "string"
      }
    }
  );

  try {
    const ingredients = await listIngredients({ recipe: "chocolate chip cookies" });
    console.log("Ingredients:");
    if (Array.isArray(ingredients)) {
      ingredients.forEach((ingredient, i) => {
        console.log(`  ${i + 1}. ${ingredient}`);
      });
    } else {
      console.log(ingredients);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 3: Closure for mathematical operations
async function closureForMath() {
  console.log("\n=== Closure for Math Operations ===");

  const computeFactorial = closure("Compute the factorial of the given number", {
    forceReturnType: "number"
  });

  try {
    const result = await computeFactorial({ n: 5 });
    console.log("Factorial of 5:", result);
    console.log("Type:", typeof result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 4: Closure with complex object return
async function closureWithObjectReturn() {
  console.log("\n=== Closure with Object Return ===");

  const analyzeMovie = closure(
    "Analyze the given movie title and return its genre, year, and a brief summary",
    {
      forceReturnType: {
        kind: "object",
        properties: {
          genre: "string",
          year: "number",
          summary: "string",
          rating: "number"
        }
      }
    }
  );

  try {
    const analysis = await analyzeMovie({ title: "The Matrix" });
    console.log("Movie Analysis:");
    console.dir(analysis, { depth: null });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 5: Reusable closure called multiple times
async function reusableClosure() {
  console.log("\n=== Reusable Closure (Multiple Calls) ===");

  const summarizeText = closure("Summarize the given text in one sentence", {
    forceReturnType: "string"
  });

  const texts = [
    "TypeScript is a strongly typed programming language that builds on JavaScript.",
    "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris.",
    "Photosynthesis is the process by which plants use sunlight to synthesize nutrients."
  ];

  try {
    for (const text of texts) {
      const summary = await summarizeText({ text });
      console.log(`\nOriginal: ${text}`);
      console.log(`Summary: ${summary}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example 6: Closure with JSON output
async function closureWithJsonMode() {
  console.log("\n=== Closure with Custom LLM Args (JSON Mode) ===");

  const extractData = closure("Extract structured data from the given text", {
    forceReturnType: {
      kind: "object",
      properties: {
        name: "string",
        age: "number",
        city: "string"
      }
    },
    forceLlmArgs: {
      temperature: 0.1,
      force_json_output: true
    }
  });

  try {
    const data = await extractData({
      text: "John is 30 years old and lives in New York City."
    });
    console.log("Extracted Data:");
    console.dir(data, { depth: null });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run all examples
(async () => {
  await simpleClosure();
  await closureWithTypedReturn();
  await closureForMath();
  await closureWithObjectReturn();
  await reusableClosure();
  await closureWithJsonMode();
})();
