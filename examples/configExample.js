import fs from "node:fs";
import path from "node:path";

import { config, reloadDotenv } from "../dist/index.js";

const envPath = path.join(process.cwd(), "examples", ".env");

const envContent = [
  'OPENHOSTA_DEFAULT_MODEL_API_KEY="demo-key"',
  'OPENHOSTA_DEFAULT_MODEL_BASE_URL="https://demo.api"',
  'OPENHOSTA_DEFAULT_MODEL_NAME="gpt-demo"',
  "OPENHOSTA_DEFAULT_MODEL_TEMPERATURE=0.25",
  "OPENHOSTA_DEFAULT_MODEL_TOP_P=0.8",
  "OPENHOSTA_DEFAULT_MODEL_MAX_TOKENS=512",
  "OPENHOSTA_DEFAULT_MODEL_SEED=7"
].join("\n");

fs.writeFileSync(envPath, envContent);

try {
  console.log("Reloading dotenv from", envPath);
  reloadDotenv(true, envPath);

  console.log("\n=== Default Model ===");
  console.log("name:", config.DefaultModel.model_name);
  console.log("base_url:", config.DefaultModel.base_url);
  console.log("api_key:", config.DefaultModel.api_key);

  console.log("\n=== Pipeline API parameters ===");
  console.dir(config.DefaultPipeline.model_list[0].api_parameters, { depth: null });
} finally {
  fs.unlinkSync(envPath);
}
