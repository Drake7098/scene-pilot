import path from "node:path";
import { VIDEO_ENDPOINTS } from "../config/endpoints.js";
import { readJsonlCases, runTaskMatrix } from "./shared.js";

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const cases = await readJsonlCases(path.join(rootDir, "tests/ab/cases/video-cases.jsonl"));
  await runTaskMatrix({
    rootDir,
    taskType: "video",
    cases,
    endpoints: VIDEO_ENDPOINTS
  });
}

void main();
