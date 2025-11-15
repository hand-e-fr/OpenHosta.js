/**
 * PYTHON-STYLE EXAMPLE - Using the Hosta Transformer
 *
 * This example demonstrates the Python-like syntax enabled by the transformer.
 * Compare this to simpleEmulateExample.ts to see the difference!
 *
 * BUILD WITH TRANSFORMER:
 *   npm run build:transformer
 *   node examples/pythonStyleExample.js
 */

import { emulate } from "../dist/index.js";

// ============================================================================
// Example 1: Simple Translation (Like Python!)
// ============================================================================

/**
 * Translates text into the specified language.
 */
function translate(text: string, language: string): string {
  return emulate();  // ✨ That's it! No manual setup needed!
}

// ============================================================================
// Example 2: Complex Return Types
// ============================================================================

/**
 * Analyzes the sentiment of text and returns detailed metrics.
 */
function analyzeSentiment(text: string): {
  sentiment: string;
  score: number;
  confidence: number;
} {
  return emulate();
}

// ============================================================================
// Example 3: Multiple Parameters
// ============================================================================

/**
 * Generates a summary of the given text with specified constraints.
 */
function summarize(
  text: string,
  maxLength: number,
  style: 'formal' | 'casual'
): string {
  return emulate();
}

// ============================================================================
// Example 4: No Parameters
// ============================================================================

/**
 * Generates a random motivational quote.
 */
function getMotivationalQuote(): string {
  return emulate();
}

// ============================================================================
// Example 5: Array Return Type
// ============================================================================

/**
 * Generates a list of creative project names based on the description.
 */
function generateProjectNames(description: string, count: number): string[] {
  return emulate();
}

// ============================================================================
// RUN EXAMPLES
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log("PYTHON-STYLE OPENHOSTA EXAMPLES");
  console.log("=".repeat(70));
  console.log("");

  try {
    // Example 1: Translation
    console.log("📝 Example 1: Translation");
    console.log("-".repeat(70));
    const translation = await translate("Hello World!", "French");
    console.log(`Input: "Hello World!" → French`);
    console.log(`Output: "${translation}"`);
    console.log("");

    // Example 2: Sentiment Analysis
    console.log("😊 Example 2: Sentiment Analysis");
    console.log("-".repeat(70));
    const sentiment = await analyzeSentiment(
      "I absolutely love using OpenHosta! It makes AI integration so simple."
    );
    console.log("Input: 'I absolutely love using OpenHosta! It makes AI integration so simple.'");
    console.log("Output:", sentiment);
    console.log("");

    // Example 3: Summarization
    console.log("📄 Example 3: Text Summarization");
    console.log("-".repeat(70));
    const summary = await summarize(
      "OpenHosta is a powerful meta-prompting framework that allows developers to use Large Language Models to emulate function behavior based on their signatures and documentation. It supports both Python and TypeScript, making it versatile for different ecosystems.",
      50,
      'casual'
    );
    console.log("Input: [Long text...]");
    console.log(`Output (casual, max 50 chars): "${summary}"`);
    console.log("");

    // Example 4: No Parameters
    console.log("💪 Example 4: Random Quote");
    console.log("-".repeat(70));
    const quote = await getMotivationalQuote();
    console.log(`Quote: "${quote}"`);
    console.log("");

    // Example 5: Array Return
    console.log("🎨 Example 5: Project Name Generator");
    console.log("-".repeat(70));
    const names = await generateProjectNames(
      "A web app for managing personal finances with AI-powered insights",
      5
    );
    console.log("Input: 'A web app for managing personal finances...'");
    console.log("Generated names:");
    names.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
    console.log("");

    console.log("=".repeat(70));
    console.log("✅ All examples completed successfully!");
    console.log("=".repeat(70));

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Make sure:");
    console.log("   1. You built with the transformer: npm run build:transformer");
    console.log("   2. OPENAI_API_KEY is set in your environment");
    console.log("   3. You have an active internet connection");
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
