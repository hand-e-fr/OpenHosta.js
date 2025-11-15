import { closure, closureAsync } from "../exec/closure.js";

export async function test(
  testString = "return False",
  args: Record<string, unknown> = {}
): Promise<boolean> {
  const fn = closure(testString, { forceReturnType: "boolean" });
  const result = await fn(args);
  return Boolean(result);
}

export const test_async = async (
  testString = "return False",
  args: Record<string, unknown> = {}
): Promise<boolean> => {
  const fn = closureAsync(testString, { forceReturnType: "boolean" });
  const result = await fn(args);
  return Boolean(result);
};
