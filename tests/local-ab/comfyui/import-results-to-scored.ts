import path from "node:path";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { readJsonl, type LocalImageCase } from "../llm/shared.js";

type RawComfyRun = {
  caseId: string;
  title: string;
  promptMode: "plain" | "structured";
  seed: number;
  savedFiles?: string[];
  comfyUiCheckpoint?: string;
  history?: Record<string, any>;
};

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const rawDir = path.join(rootDir, "tests/local-ab/outputs/raw/comfyui");
  const outDir = path.join(rootDir, "tests/local-ab/outputs/scored");
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const titleMap = new Map(cases.map((item) => [item.id, item.title]));

  await mkdir(outDir, { recursive: true });
  let files: string[] = [];
  try {
    files = await readdir(rawDir);
  } catch {
    // eslint-disable-next-line no-console
    console.log(`comfy raw dir not found: ${rawDir}`);
    return;
  }

  const runFiles = files
    .filter((file) => file.endsWith(".json"))
    .filter((file) => !file.startsWith("__"))
    .sort((a, b) => a.localeCompare(b));
  let count = 0;
  for (const file of runFiles) {
    const raw = JSON.parse(await readFile(path.join(rawDir, file), "utf8")) as RawComfyRun;
    if (!raw.caseId || !raw.promptMode || !raw.seed) continue;
    const firstSaved = raw.savedFiles?.[0] ?? "";
    const scorePath = path.join(outDir, `comfyui__${raw.caseId}__${raw.promptMode}__seed${raw.seed}.json`);
    await writeFile(scorePath, JSON.stringify({
      caseId: raw.caseId,
      title: titleMap.get(raw.caseId) ?? raw.title ?? raw.caseId,
      tool: "comfyui",
      promptMode: raw.promptMode,
      modelName: raw.comfyUiCheckpoint ?? "unknown",
      seed: raw.seed,
      imagePath: firstSaved,
      completionScore: 0,
      compositionScore: 0,
      semanticMatchScore: 0,
      usabilityScore: 0,
      isUsable: false,
      notes: "Fill scores manually."
    }, null, 2), "utf8");
    count += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`comfy scored templates updated: ${count}`);
}

void main();
