import {
  setHostaSignature,
  hostaAnalyze,
  encodeFunction,
  typeReturnedData
} from "../dist/index.js";

const descriptor = {
  kind: "array",
  items: "number"
};

function computeScores(items) {
  return items.map((x) => x * 2);
}

setHostaSignature(computeScores, {
  doc: "Double every number in the list.",
  args: [{ name: "items", type: descriptor }],
  type: descriptor
});

const callArgs = { items: [1, 2, 3] };
const analysis = hostaAnalyze(computeScores, { args: callArgs });
const payload = encodeFunction(analysis);

console.log("=== Analysis ===");
console.dir(analysis, { depth: null });

console.log("\n=== Encoded ===");
console.dir(payload, { depth: null });

console.log("\n=== Simulated response conversion ===");
const rawResponse = "[2, 4, 6]";
console.log(typeReturnedData(rawResponse, descriptor));
