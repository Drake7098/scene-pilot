import path from "node:path";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { loadLocalAbEnv } from "../config/local-env.js";
import { buildStructuredPrompt, readJsonl, readJsonFiles, stripThinkBlocks, type LocalImageCase, type StructuredPromptVariant } from "../llm/shared.js";

type PromptMode = "plain" | "structured";
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

async function resolveComfyBaseUrl(candidates: string[]): Promise<string> {
  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}/system_stats`);
      if (response.ok) return baseUrl;
    } catch {
      // try next
    }
  }
  throw new Error(`ComfyUI is unreachable. checked=${candidates.join(", ")}`);
}

async function resolveCheckpoint(baseUrl: string, preferred: string): Promise<string> {
  if (preferred && preferred !== "replace_me.safetensors") {
    try {
      const response = await fetch(`${baseUrl}/models/checkpoints`);
      if (response.ok) {
        const checkpoints = await response.json() as string[];
        if (Array.isArray(checkpoints) && checkpoints.includes(preferred)) return preferred;
      }
    } catch {
      // Fall back to the explicit checkpoint when the list endpoint is unavailable.
    }
    return preferred;
  }

  const response = await fetch(`${baseUrl}/models/checkpoints`);
  if (!response.ok) throw new Error(`Cannot load checkpoints from ComfyUI: ${response.status} ${await response.text()}`);
  const checkpoints = await response.json() as string[];
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
    throw new Error("No ComfyUI checkpoints found. Put at least one .safetensors in ComfyUI/models/checkpoints.");
  }
  return checkpoints[0];
}

function injectWorkflow(baseWorkflow: Record<string, any>, params: {
  prompt: string;
  seed: number;
  resolution: string;
  prefix: string;
  checkpoint: string;
  steps?: number;
  cfg?: number;
  widthOverride?: number;
  heightOverride?: number;
}): Record<string, any> {
  const workflow = JSON.parse(JSON.stringify(baseWorkflow));
  workflow["4"].inputs.ckpt_name = params.checkpoint;
  workflow["6"].inputs.text = params.prompt;
  workflow["3"].inputs.seed = params.seed;
  if (params.steps && params.steps > 0) workflow["3"].inputs.steps = params.steps;
  if (params.cfg && params.cfg > 0) workflow["3"].inputs.cfg = params.cfg;
  workflow["9"].inputs.filename_prefix = `local-ab/${params.prefix}`;
  const match = params.resolution.match(/(\d+)x(\d+)/i);
  if (match) {
    workflow["5"].inputs.width = params.widthOverride && params.widthOverride > 0 ? params.widthOverride : Number(match[1]);
    workflow["5"].inputs.height = params.heightOverride && params.heightOverride > 0 ? params.heightOverride : Number(match[2]);
  }
  return workflow;
}

async function findExistingImages(outputDir: string, prefix: string): Promise<string[]> {
  const dirPath = path.join(outputDir, "local-ab");
  try {
    const files = await readdir(dirPath);
    return files
      .filter((file) => file.startsWith(`${prefix}_`))
      .filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map((file) => path.join(dirPath, file));
  } catch {
    return [];
  }
}

async function submitWorkflow(baseUrl: string, workflow: Record<string, any>): Promise<string> {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });
  if (!response.ok) throw new Error(`ComfyUI submit failed: ${response.status} ${await response.text()}`);
  const payload = await response.json() as { prompt_id: string };
  return payload.prompt_id;
}

async function waitHistory(baseUrl: string, promptId: string, maxWaitSec: number): Promise<Record<string, any>> {
  const maxAttempts = Math.max(1, Math.floor(maxWaitSec / 2));
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(`${baseUrl}/history/${promptId}`);
    if (!response.ok) throw new Error(`ComfyUI history failed: ${response.status} ${await response.text()}`);
    const payload = await response.json() as Record<string, any>;
    const history = payload[promptId] as Record<string, any> | undefined;
    if (history) {
      const status = history.status?.status_str;
      const completed = Boolean(history.status?.completed);
      if (completed || status === "error") return history;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Timed out waiting for ComfyUI prompt ${promptId}`);
}

function readHistoryError(history: Record<string, any>): string | null {
  const status = history.status?.status_str;
  if (status !== "error") return null;
  const messages = history.status?.messages;
  if (!Array.isArray(messages)) return "ComfyUI execution error";
  for (const message of messages) {
    if (!Array.isArray(message)) continue;
    if (message[0] !== "execution_error") continue;
    const details = message[1] as { exception_message?: string; node_type?: string };
    return `${details?.node_type ?? "unknown node"}: ${details?.exception_message ?? "execution_error"}`;
  }
  return "ComfyUI execution error";
}

function parseSeeds(): number[] {
  const raw = (process.env.LOCAL_AB_SEEDS ?? "101,202").trim();
  const seeds = raw
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
  return seeds.length ? [...new Set(seeds)] : [101, 202];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

async function sizeOf(filePath: string): Promise<number> {
  if (!filePath) return 0;
  const info = await stat(filePath).catch(() => null);
  return info?.size ?? 0;
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

async function main(): Promise<void> {
  const env = loadLocalAbEnv();
  const rootDir = process.cwd();
  const maxWaitSec = Number(process.env.COMFYUI_MAX_WAIT_SEC ?? "900");
  const stepsOverride = Number(process.env.COMFYUI_STEPS ?? "0");
  const cfgOverride = Number(process.env.COMFYUI_CFG ?? "0");
  const widthOverride = Number(process.env.COMFYUI_WIDTH ?? "0");
  const heightOverride = Number(process.env.COMFYUI_HEIGHT ?? "0");
  const seeds = parseSeeds();
  const outputSubdir = (process.env.LOCAL_AB_OUTPUT_SUBDIR ?? "comfyui").trim();
  const structuredVariant: StructuredPromptVariant = (process.env.LOCAL_AB_STRUCTURED_VARIANT ?? "full").trim() === "compact" ? "compact" : "full";
  const cases = await readJsonl<LocalImageCase>(path.join(rootDir, "tests/local-ab/cases/image-cases.jsonl"));
  const baselines = await readJsonFiles<{ caseId: string; baselinePrompt: string }>(
    path.join(rootDir, "tests/local-ab/outputs/raw/llm"),
    { suffix: ".baseline.json" }
  );
  const baselineMap = new Map(baselines.map((item) => [item.caseId, item.baselinePrompt]));
  const workflow = JSON.parse(await readFile(path.join(rootDir, "tests/local-ab/comfyui/workflow-basic-image.json"), "utf8")) as Record<string, any>;

  const outputDir = path.join(rootDir, "tests/local-ab/outputs/raw", outputSubdir);
  await mkdir(outputDir, { recursive: true });
  const baseUrl = await resolveComfyBaseUrl(env.comfyUiBaseUrls);
  const checkpoint = await resolveCheckpoint(baseUrl, env.comfyUiCheckpoint);
  const summaryRows: SummaryRow[] = [];
  await writeFile(path.join(outputDir, "__run-meta.json"), JSON.stringify({
    comfyUiBaseUrl: baseUrl,
    comfyUiCheckpoint: checkpoint,
    structuredVariant,
    seeds,
    createdAt: new Date().toISOString()
  }, null, 2), "utf8");

  const caseLimit = Number(process.env.LOCAL_AB_CASE_LIMIT ?? "30");
  for (const caseItem of cases.slice(0, caseLimit)) {
    for (const promptMode of ["plain", "structured"] as const) {
      const prompt = promptMode === "plain"
        ? stripThinkBlocks(baselineMap.get(caseItem.id) ?? caseItem.user_input)
        : buildStructuredPrompt(caseItem.structured_project, {
            platformId: caseItem.platform_id ?? "universal",
            scope: caseItem.structured_export_scope ?? "current_scene",
            lang: "zh",
            variant: structuredVariant
          });
      for (const seed of seeds) {
        const prefix = `${caseItem.id}__${promptMode}__seed${seed}`;
        const startedAt = Date.now();
        const injected = injectWorkflow(workflow, {
          prompt,
          seed,
          resolution: caseItem.resolution,
          prefix,
          checkpoint,
          steps: stepsOverride,
          cfg: cfgOverride,
          widthOverride,
          heightOverride
        });
        const promptId = await submitWorkflow(baseUrl, injected);
        const history = await waitHistory(baseUrl, promptId, maxWaitSec);
        const historyError = readHistoryError(history);
        if (historyError) {
          summaryRows.push({
            caseId: caseItem.id,
            mode: promptMode,
            seed,
            ok: false,
            elapsedMs: Date.now() - startedAt,
            imagePath: "",
            imageBytes: 0,
            promptChars: prompt.length,
            error: historyError
          });
          throw new Error(`ComfyUI failed for ${prefix}: ${historyError}`);
        }
        const savedFiles: string[] = [];
        const outputs = history.outputs ?? {};
        for (const nodeId of Object.keys(outputs)) {
          const images = outputs[nodeId]?.images ?? [];
          for (const image of images) {
            const filename = image.filename as string;
            const subfolder = image.subfolder as string;
            if (env.comfyUiOutputDir && filename) {
              savedFiles.push(path.join(env.comfyUiOutputDir, subfolder ?? "", filename));
            }
          }
        }
        if (!Object.keys(outputs).length && history.status?.status_str === "success" && env.comfyUiOutputDir) {
          const fallbackFiles = await findExistingImages(env.comfyUiOutputDir, prefix);
          savedFiles.push(...fallbackFiles);
        }
        if (!Object.keys(outputs).length && savedFiles.length === 0) {
          summaryRows.push({
            caseId: caseItem.id,
            mode: promptMode,
            seed,
            ok: false,
            elapsedMs: Date.now() - startedAt,
            imagePath: "",
            imageBytes: 0,
            promptChars: prompt.length,
            error: `ComfyUI returned no outputs for ${prefix}.`
          });
          throw new Error(`ComfyUI returned no outputs for ${prefix}.`);
        }
        const imagePath = savedFiles[0] ?? "";
        const imageBytes = await sizeOf(imagePath);
        summaryRows.push({
          caseId: caseItem.id,
          mode: promptMode,
          seed,
          ok: true,
          elapsedMs: Date.now() - startedAt,
          imagePath,
          imageBytes,
          promptChars: prompt.length,
          error: ""
        });
        await writeFile(path.join(outputDir, `${prefix}.json`), JSON.stringify({
          caseId: caseItem.id,
          title: caseItem.title,
          promptMode,
          promptSource: promptMode === "structured"
            ? `ScenePilotix product export pipeline (runPromptPipeline:${structuredVariant})`
            : "Drake-DS local LLM baseline",
          seed,
          prompt,
          promptId,
          savedFiles,
          createdAt: new Date().toISOString(),
          comfyUiBaseUrl: baseUrl,
          comfyUiCheckpoint: checkpoint,
          history
        }, null, 2), "utf8");
      }
    }
  }

  const plain = summarizeRows(summaryRows, "plain");
  const structured = summarizeRows(summaryRows, "structured");
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: `${Math.min(caseLimit, cases.length)} cases x 2 modes x ${seeds.length} seed${seeds.length > 1 ? "s" : ""} = ${summaryRows.length} images`,
    engine: "ComfyUI",
    params: {
      seeds,
      width: widthOverride > 0 ? widthOverride : "case resolution",
      height: heightOverride > 0 ? heightOverride : "case resolution",
      steps: stepsOverride > 0 ? stepsOverride : workflow["3"]?.inputs?.steps,
      cfg: cfgOverride > 0 ? cfgOverride : workflow["3"]?.inputs?.cfg,
      checkpoint,
      structuredVariant
    },
    plain,
    structured,
    delta: {
      successRate_structured_minus_plain: Number((structured.successRate - plain.successRate).toFixed(3)),
      avgElapsedMs_structured_minus_plain: structured.avgElapsedMs - plain.avgElapsedMs,
      avgImageKB_structured_minus_plain: Number((structured.avgImageKB - plain.avgImageKB).toFixed(1))
    },
    rows: summaryRows
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

void main().catch(async (error) => {
  const rootDir = process.cwd();
  const outputDir = path.join(rootDir, "tests/local-ab/outputs/raw/comfyui");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "__run-error.json"), JSON.stringify({
    error: String(error),
    stack: error instanceof Error ? error.stack : undefined,
    createdAt: new Date().toISOString()
  }, null, 2), "utf8");
  throw error;
});
