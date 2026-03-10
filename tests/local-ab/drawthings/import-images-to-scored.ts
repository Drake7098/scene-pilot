import path from "node:path";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { loadLocalAbEnv } from "../config/local-env.js";
import { findDrawThingsImages, resolveDrawThingsImageCandidates } from "./shared.js";
import { readJsonl, type LocalImageCase } from "../llm/shared.js";

type Parsed = {
  caseId: string;
  promptMode: "plain" | "structured";
  seed: number;
};

function parseName(filename: string): Parsed | null {
  const m = filename.match(/^(.+)__(plain|structured)__seed(\d+)\.(png|jpg|jpeg|webp)$/i);
  if (!m) return null;
  return {
    caseId: m[1],
    promptMode: m[2].toLowerCase() as "plain" | "structured",
    seed: Number(m[3])
  };
}

async function main(): Promise<void> {
  const env = loadLocalAbEnv();
  const rootDir = process.cwd();
  const srcDir = process.env.DRAWTHINGS_IMAGE_DIR ?? "";
  const outDir = path.join(rootDir, "tests/local-ab/outputs/scored");
  const normalizedImageDir = path.join(rootDir, "tests/local-ab/outputs/raw/drawthings/images");
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const titleMap = new Map(cases.map((item) => [item.id, item.title]));

  await mkdir(outDir, { recursive: true });
  await mkdir(normalizedImageDir, { recursive: true });

  const candidates = srcDir
    ? [srcDir]
    : await resolveDrawThingsImageCandidates(rootDir);
  const found = await findDrawThingsImages(candidates);
  if (!found.files.length) {
    // eslint-disable-next-line no-console
    console.log(`drawthings image files not found. checked=${candidates.join(", ")}`);
    return;
  }

  for (const hit of found.files) {
    const parsed = parseName(hit.filename);
    if (!parsed) continue;
    const copiedPath = path.join(normalizedImageDir, hit.filename);
    await copyFile(hit.absPath, copiedPath).catch(() => {});
    const scorePath = path.join(outDir, `drawthings__${parsed.caseId}__${parsed.promptMode}__seed${parsed.seed}.json`);
    await writeFile(scorePath, JSON.stringify({
      caseId: parsed.caseId,
      title: titleMap.get(parsed.caseId) ?? parsed.caseId,
      tool: "drawthings",
      promptMode: parsed.promptMode,
      modelName: env.drawThingsModelName,
      seed: parsed.seed,
      imagePath: copiedPath,
      completionScore: 0,
      compositionScore: 0,
      semanticMatchScore: 0,
      usabilityScore: 0,
      isUsable: false,
      notes: "Fill scores manually."
    }, null, 2), "utf8");
  }
  // eslint-disable-next-line no-console
  console.log(`drawthings scored templates updated from images: ${found.sourceDir}`);
  // eslint-disable-next-line no-console
  console.log(`drawthings normalized image dir: ${normalizedImageDir}`);
}

void main();
