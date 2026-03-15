/**
 * Prompt Batch Test v1 - Re-check prompts in artifacts
 * npm run prompt-batch:check
 */

import path from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { loadConfig } from "./config";
import { checkPrompt } from "./check-prompts";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const promptsDir = path.join(cfg.artifactsDir, "prompts");
  let ok = 0;
  let warn = 0;
  let fail = 0;

  try {
    const files = await readdir(promptsDir);
    const txtFiles = files.filter((f) => f.endsWith(".txt"));
    if (txtFiles.length === 0) {
      console.log("No prompt files found. Run: npm run prompt-batch 50");
      process.exit(0);
      return;
    }

    for (const f of txtFiles) {
      const fp = path.join(promptsDir, f);
      const prompt = await readFile(fp, "utf8");
      const { result } = checkPrompt(prompt);
      if (result === "ok") ok++;
      else if (result === "warn") warn++;
      else fail++;
      console.log(`${f} -> ${result}`);
    }

    console.log("\n--- Check Summary ---");
    console.log("ok:", ok, "warn:", warn, "fail:", fail);
    process.exit(fail > 0 ? 1 : 0);
  } catch (e) {
    console.error("Error:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
