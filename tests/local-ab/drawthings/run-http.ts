import path from "node:path";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { loadLocalAbEnv } from "../config/local-env.js";
import { readJsonFiles, readJsonl, stripThinkBlocks, type LocalImageCase } from "../llm/shared.js";

type PromptMode = "plain" | "structured";
type PromptRecord = {
  caseId: string;
  title: string;
  baselinePrompt: string;
  structuredPrompt: string;
  structuredPromptCompact?: string;
};
type SummaryRow = {
  caseId: string;
  mode: PromptMode;
  seed: number;
  ok: boolean;
  elapsedMs: number;
  imagePath: string;
  imageBytes: number;
  promptChars: number;
  error: string;
};

const DEFAULT_BASE_URLS = ["http://127.0.0.1:7860", "http://localhost:7860"];
const DEFAULT_NEGATIVE = "blurry, low quality, malformed hands, text artifacts, extra limbs";

function parseSeeds(): number[] {
  const raw = (process.env.LOCAL_AB_SEEDS ?? "101,202").trim();
  const seeds = raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  return seeds.length ? [...new Set(seeds)] : [101, 202];
}

function parseResolution(input: string): { width: number; height: number } {
  const match = input.match(/(\d+)x(\d+)/i);
  if (!match) return { width: 1024, height: 1024 };
  return { width: Number(match[1]), height: Number(match[2]) };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function summarizeRows(rows: SummaryRow[], mode: PromptMode) {
  const picked = rows.filter((row) => row.mode === mode);
  const okRows = picked.filter((row) => row.ok);
  return {
    total: picked.length,
    success: okRows.length,
    successRate: picked.length ? Number((okRows.length / picked.length).toFixed(3)) : 0,
    avgElapsedMs: Math.round(average(okRows.map((row) => row.elapsedMs))),
    avgImageKB: Number((average(okRows.map((row) => row.imageBytes / 1024))).toFixed(1)),
    avgPromptChars: Math.round(average(picked.map((row) => row.promptChars)))
  };
}

async function sizeOf(filePath: string): Promise<number> {
  if (!filePath) return 0;
  const info = await stat(filePath).catch(() => null);
  return info?.size ?? 0;
}

async function resolveBaseUrl(baseUrls: string[]): Promise<string> {
  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}/sdapi/v1/options`);
      if (response.ok) return baseUrl;
    } catch {
      // try next
    }
  }
  throw new Error(`Draw Things HTTP is unreachable. checked=${baseUrls.join(", ")}`);
}

function decodeBase64(data: string): Uint8Array {
  const clean = data.includes(",") ? data.split(",").pop() ?? data : data;
  return Uint8Array.from(Buffer.from(clean, "base64"));
}

async function requestTxt2Img(params: {
  baseUrl: string;
  prompt: string;
  seed: number;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  negativePrompt: string;
}): Promise<string> {
  const response = await fetch(`${params.baseUrl}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      seed: params.seed,
      steps: params.steps,
      guidance_scale: params.guidanceScale,
      width: params.width,
      height: params.height,
      batch_count: 1
    })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const payload = await response.json() as { images?: string[] };
  const first = Array.isArray(payload.images) ? payload.images[0] : "";
  if (!first) throw new Error("Draw Things returned no images");
  return first;
}

async function main(): Promise<void> {
  const env = loadLocalAbEnv();
  const rootDir = process.cwd();
  const outputSubdir = (process.env.LOCAL_AB_OUTPUT_SUBDIR ?? "drawthings-http").trim();
  const outputDir = path.join(rootDir, "tests/local-ab/outputs/raw", outputSubdir);
  const imageDir = path.join(outputDir, "images");
  const caseLimit = Number(process.env.LOCAL_AB_CASE_LIMIT ?? "30");
  const seeds = parseSeeds();
  const steps = Number(process.env.DRAWTHINGS_STEPS ?? "6");
  const guidanceScale = Number(process.env.DRAWTHINGS_GUIDANCE ?? "3.5");
  const widthOverride = Number(process.env.DRAWTHINGS_WIDTH ?? "0");
  const heightOverride = Number(process.env.DRAWTHINGS_HEIGHT ?? "0");
  const negativePrompt = process.env.DRAWTHINGS_NEGATIVE_PROMPT ?? DEFAULT_NEGATIVE;
  const structuredVariant = (process.env.LOCAL_AB_STRUCTURED_VARIANT ?? "full").trim() === "compact" ? "compact" : "full";
  const baseUrl = await resolveBaseUrl(DEFAULT_BASE_URLS);
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const prompts = await readJsonFiles<PromptRecord>(path.join(rootDir, "tests/local-ab/outputs/raw/prompts"));
  const promptMap = new Map(prompts.map((item) => [item.caseId, item]));
  const rows: SummaryRow[] = [];

  await mkdir(imageDir, { recursive: true });
  await writeFile(path.join(outputDir, "__run-meta.json"), JSON.stringify({
    drawThingsBaseUrl: baseUrl,
    modelName: env.drawThingsModelName,
    structuredVariant,
    seeds,
    steps,
    guidanceScale,
    createdAt: new Date().toISOString()
  }, null, 2), "utf8");

  for (const caseItem of cases.slice(0, Math.min(caseLimit, cases.length))) {
    const promptRecord = promptMap.get(caseItem.id);
    if (!promptRecord) continue;
    for (const mode of ["plain", "structured"] as const) {
      const prompt = stripThinkBlocks(mode === "plain"
        ? promptRecord.baselinePrompt
        : structuredVariant === "compact"
          ? (promptRecord.structuredPromptCompact ?? promptRecord.structuredPrompt)
          : promptRecord.structuredPrompt);
      for (const seed of seeds) {
        const { width, height } = parseResolution(caseItem.resolution);
        const startedAt = Date.now();
        const filename = `${caseItem.id}__${mode}__seed${seed}.png`;
        const filePath = path.join(imageDir, filename);
        try {
          const base64 = await requestTxt2Img({
            baseUrl,
            prompt,
            seed,
            width: widthOverride > 0 ? widthOverride : width,
            height: heightOverride > 0 ? heightOverride : height,
            steps,
            guidanceScale,
            negativePrompt
          });
          const bytes = decodeBase64(base64);
          await writeFile(filePath, bytes);
          rows.push({
            caseId: caseItem.id,
            mode,
            seed,
            ok: true,
            elapsedMs: Date.now() - startedAt,
            imagePath: filePath,
            imageBytes: await sizeOf(filePath),
            promptChars: prompt.length,
            error: ""
          });
        } catch (error) {
          rows.push({
            caseId: caseItem.id,
            mode,
            seed,
            ok: false,
            elapsedMs: Date.now() - startedAt,
            imagePath: "",
            imageBytes: 0,
            promptChars: prompt.length,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }

  const plain = summarizeRows(rows, "plain");
  const structured = summarizeRows(rows, "structured");
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: `${Math.min(caseLimit, cases.length)} cases x 2 modes x ${seeds.length} seed${seeds.length > 1 ? "s" : ""} = ${rows.length} images`,
    engine: "Draw Things HTTP 7860",
    params: {
      seeds,
      width: widthOverride > 0 ? widthOverride : "case resolution",
      height: heightOverride > 0 ? heightOverride : "case resolution",
      steps,
      guidanceScale,
      model: env.drawThingsModelName,
      structuredVariant
    },
    plain,
    structured,
    delta: {
      successRate_structured_minus_plain: Number((structured.successRate - plain.successRate).toFixed(3)),
      avgElapsedMs_structured_minus_plain: structured.avgElapsedMs - plain.avgElapsedMs,
      avgImageKB_structured_minus_plain: Number((structured.avgImageKB - plain.avgImageKB).toFixed(1))
    },
    rows
  };
  const markdown = [
    `# ${summary.engine} Live AB`,
    "",
    `- scope: ${summary.scope}`,
    `- generatedAt: ${summary.generatedAt}`,
    "",
    "## Summary",
    `- plain: success ${plain.success}/${plain.total}, rate=${plain.successRate}, avgElapsedMs=${plain.avgElapsedMs}, avgImageKB=${plain.avgImageKB}, avgPromptChars=${plain.avgPromptChars}`,
    `- structured: success ${structured.success}/${structured.total}, rate=${structured.successRate}, avgElapsedMs=${structured.avgElapsedMs}, avgImageKB=${structured.avgImageKB}, avgPromptChars=${structured.avgPromptChars}`,
    `- delta(structured-plain): successRate=${summary.delta.successRate_structured_minus_plain}, avgElapsedMs=${summary.delta.avgElapsedMs_structured_minus_plain}, avgImageKB=${summary.delta.avgImageKB_structured_minus_plain}`
  ].join("\n");
  await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  await writeFile(path.join(outputDir, "summary.md"), `${markdown}\n`, "utf8");
}

void main();
