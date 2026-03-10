import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { loadLocalAbEnv } from "../config/local-env.js";
import { readJsonl, readJsonFiles, stripThinkBlocks, type LocalImageCase } from "../llm/shared.js";
import { getDrawThingsAppDownloadsDir } from "./shared.js";

type PromptRow = {
  caseId: string;
  title: string;
  baselinePrompt: string;
  structuredPrompt: string;
  structuredPromptCompact?: string;
  resolution: string;
};

async function main(): Promise<void> {
  const env = loadLocalAbEnv();
  const rootDir = process.cwd();
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const structuredVariant = (process.env.LOCAL_AB_STRUCTURED_VARIANT ?? "full").trim() === "compact" ? "compact" : "full";
  const prompts = await readJsonFiles<{
    caseId: string;
    title: string;
    baselinePrompt: string;
    structuredPrompt: string;
    structuredPromptCompact?: string;
  }>(path.join(rootDir, "tests/local-ab/outputs/raw/prompts"));
  const promptMap = new Map(prompts.map((item) => [item.caseId, item]));

  const queue: PromptRow[] = [];
  for (const caseItem of cases) {
    const row = promptMap.get(caseItem.id);
    if (!row) continue;
    queue.push({
      caseId: caseItem.id,
      title: caseItem.title,
      baselinePrompt: stripThinkBlocks(row.baselinePrompt),
      structuredPrompt: stripThinkBlocks(structuredVariant === "compact" ? (row.structuredPromptCompact ?? row.structuredPrompt) : row.structuredPrompt),
      structuredPromptCompact: row.structuredPromptCompact ? stripThinkBlocks(row.structuredPromptCompact) : undefined,
      resolution: caseItem.resolution
    });
  }

  const outDir = path.join(rootDir, "tests/local-ab/outputs/raw/drawthings");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "queue.json");
  const payload = {
    tool: "drawthings",
    model: env.drawThingsModelName,
    structuredVariant,
    seeds: [101, 202],
    generatedAt: new Date().toISOString(),
    notes: "Keep sampler/steps/cfg/negative prompt fixed for plain vs structured in each case.",
    tasks: queue
  };
  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

  const runPackDir = path.join(outDir, "run-pack");
  const promptsDir = path.join(runPackDir, "prompts");
  await mkdir(promptsDir, { recursive: true });
  const csvLines = ["caseId,promptMode,seed,resolution,outputFilename,promptFile"];
  for (const task of queue) {
    const plainFile = `${task.caseId}__plain.txt`;
    const structuredFile = `${task.caseId}__structured.txt`;
    await writeFile(path.join(promptsDir, plainFile), task.baselinePrompt, "utf8");
    await writeFile(path.join(promptsDir, structuredFile), task.structuredPrompt, "utf8");
    for (const seed of [101, 202]) {
      csvLines.push(`${task.caseId},plain,${seed},${task.resolution},${task.caseId}__plain__seed${seed}.png,${plainFile}`);
      csvLines.push(`${task.caseId},structured,${seed},${task.resolution},${task.caseId}__structured__seed${seed}.png,${structuredFile}`);
    }
  }
  await writeFile(path.join(runPackDir, "tasks.csv"), csvLines.join("\n"), "utf8");
  await writeFile(path.join(runPackDir, "README.txt"), [
    "ScenePilotix Draw Things run pack",
    "",
    "1) Keep model/sampler/steps/cfg/negative prompt fixed.",
    "2) Use tasks.csv to run paired plain/structured prompts by same seed.",
    "3) Save images using outputFilename in tasks.csv.",
    "4) Put generated images under tests/local-ab/outputs/raw/drawthings/images or Draw Things Downloads."
  ].join("\n"), "utf8");

  const appDownloads = getDrawThingsAppDownloadsDir();
  let appDropReady = true;
  try {
    await mkdir(appDownloads, { recursive: true });
    await writeFile(path.join(appDownloads, "scenepilotix_drawthings_queue.json"), JSON.stringify(payload, null, 2), "utf8");
    await writeFile(path.join(appDownloads, "scenepilotix_drawthings_tasks.csv"), csvLines.join("\n"), "utf8");
  } catch {
    appDropReady = false;
  }
  // eslint-disable-next-line no-console
  console.log(`drawthings queue written: ${outPath}`);
  // eslint-disable-next-line no-console
  console.log(`drawthings run pack: ${runPackDir}`);
  // eslint-disable-next-line no-console
  console.log(`drawthings app drop path: ${appDownloads} (${appDropReady ? "ok" : "skipped"})`);
}

void main();
