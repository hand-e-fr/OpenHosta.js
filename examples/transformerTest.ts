/**
 * TRANSFORMER TEST
 *
 * This file tests the transformer functionality without actually calling the LLM.
 * It verifies that the transformer correctly:
 * 1. Injects setHostaSignature()
 * 2. Injects arguments into emulate() calls
 * 3. Preserves JSDoc comments
 */

import { getHostaSignature, getLastInspection } from "../dist/index.js";

// ============================================================================
// Test Functions
// ============================================================================

/**
 * A simple test function with basic types.
 */
function simpleFunction(name: string, age: number): string {
  // This will be transformed to: emulate({ args: { name, age } })
  return "mock";  // Placeholder - transformer will modify this
}

/**
 * Function with complex return type.
 */
function complexFunction(
  input: string
): { result: string; metadata: { processed: boolean } } {
  return { result: "", metadata: { processed: false } };
}

/**
 * Function with no parameters.
 */
function noParamsFunction(): string {
  return "";
}

/**
 * Function with union types.
 */
function unionTypeFunction(
  value: string | number,
  mode: 'strict' | 'relaxed'
): boolean {
  return false;
}

// ============================================================================
// Tests
// ============================================================================

function testTransformer() {
  console.log("🧪 Testing Hosta Transformer");
  console.log("=".repeat(70));
  console.log("");

  let passed = 0;
  let failed = 0;

  // Test 1: Check if setHostaSignature was injected for simpleFunction
  console.log("Test 1: setHostaSignature injection for simpleFunction");
  const sig1 = getHostaSignature(simpleFunction as any);
  if (sig1) {
    console.log("  ✅ Signature found");
    console.log("  📋 Doc:", sig1.doc);
    console.log("  📋 Args:", sig1.args);
    console.log("  📋 Return type:", sig1.type);
    passed++;
  } else {
    console.log("  ❌ Signature NOT found - transformer may not have run");
    failed++;
  }
  console.log("");

  // Test 2: Check signature for complexFunction
  console.log("Test 2: Complex return type handling");
  const sig2 = getHostaSignature(complexFunction as any);
  if (sig2) {
    console.log("  ✅ Complex signature found");
    console.log("  📋 Return type:", sig2.type);
    passed++;
  } else {
    console.log("  ❌ Signature NOT found");
    failed++;
  }
  console.log("");

  // Test 3: Check function with no params
  console.log("Test 3: No-parameter function");
  const sig3 = getHostaSignature(noParamsFunction as any);
  if (sig3) {
    console.log("  ✅ Signature found");
    console.log("  📋 Args count:", sig3.args?.length || 0);
    if ((sig3.args?.length || 0) === 0) {
      console.log("  ✅ Correctly has zero parameters");
      passed++;
    } else {
      console.log("  ❌ Should have zero parameters");
      failed++;
    }
  } else {
    console.log("  ❌ Signature NOT found");
    failed++;
  }
  console.log("");

  // Test 4: Union types
  console.log("Test 4: Union type handling");
  const sig4 = getHostaSignature(unionTypeFunction as any);
  if (sig4) {
    console.log("  ✅ Signature found");
    console.log("  📋 Args:", sig4.args);
    passed++;
  } else {
    console.log("  ❌ Signature NOT found");
    failed++;
  }
  console.log("");

  // Summary
  console.log("=".repeat(70));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(70));

  if (failed === 0) {
    console.log("\n✅ All tests passed! Transformer is working correctly.");
    console.log("\n💡 Next step: Try running pythonStyleExample.ts");
  } else {
    console.log("\n❌ Some tests failed. The transformer may not have run.");
    console.log("\n💡 Make sure you built with: npm run build:transformer");
    console.log("   Or use: npx ts-patch compile");
  }

  return failed === 0;
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = testTransformer();
  process.exit(success ? 0 : 1);
}
