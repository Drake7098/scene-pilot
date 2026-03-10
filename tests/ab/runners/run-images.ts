import path from "node:path";
import { IMAGE_ENDPOINTS } from "../config/endpoints.js";
import { readJsonlCases, runTaskMatrix } from "./shared.js";

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const cases = await readJsonlCases(path.join(rootDir, "tests/ab/cases/image-cases.jsonl"));
  await runTaskMatrix({
    rootDir,
    taskType: "image",
    cases,
    endpoints: IMAGE_ENDPOINTS
  });
}

void main();
