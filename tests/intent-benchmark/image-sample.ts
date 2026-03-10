import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { briefToIntentPlanWithMode } from "../../src/utils/briefParser.js";
import type { BenchmarkCase } from "./types.js";

type EngineState =
  | { engine: "drawthings"; baseUrl: string }
  | { engine: "comfyui"; baseUrl: string; checkpoint: string }
  | { engine: "none" };

const DEFAULT_COMFY_CHECKPOINT = process.env.INTENT_COMFY_CHECKPOINT || "v1-5-pruned-emaonly-fp16.safetensors";

function parseResolution(ratio: "1:1" | "16:9" | "9:16") {
  if (ratio === "16:9") return { width: 448, height: 256 };
  if (ratio === "9:16") return { width: 256, height: 448 };
  return { width: 320, height: 320 };
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function readDataset(path: string): BenchmarkCase[] {
  return readFileSync(path, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BenchmarkCase);
}

async function probeDrawThings(): Promise<EngineState> {
  const bases = ["http://127.0.0.1:7860", "http://localhost:7860"];
  for (const baseUrl of bases) {
    try {
      execFileSync("curl", ["-sS", "-m", "4", `${baseUrl}/sdapi/v1/options`], { stdio: "pipe" });
      return { engine: "drawthings", baseUrl };
    } catch {
      // ignore
    }
  }
  return { engine: "none" };
}

async function probeComfyUi(): Promise<EngineState> {
  const bases = ["http://127.0.0.1:8188", "http://127.0.0.1:8000"];
  for (const baseUrl of bases) {
    try {
      execFileSync("curl", ["-sS", "-m", "4", `${baseUrl}/system_stats`], { stdio: "pipe" });
      return { engine: "comfyui", baseUrl, checkpoint: DEFAULT_COMFY_CHECKPOINT };
    } catch {
      // ignore
    }
  }
  return { engine: "none" };
}

async function selectEngine(): Promise<EngineState> {
  const force = (process.env.INTENT_FORCE_ENGINE || "").toLowerCase().trim();
  if (force === "drawthings") return await probeDrawThings();
  if (force === "comfyui") return await probeComfyUi();
  const draw = await probeDrawThings();
  if (draw.engine === "drawthings") return draw;
  const comfy = await probeComfyUi();
  if (comfy.engine === "comfyui") return comfy;
  return { engine: "none" };
}

function planToPrompt(brief: string, mode: "baseline" | "round3", lang: "zh" | "en") {
  const plan = briefToIntentPlanWithMode(brief, lang, mode);
  const subjectText = plan.subjects.map((s) => s.label).slice(0, 3).join(", ");
  const parts = [
    `subject: ${subjectText}`,
    `goal: ${plan.goal}`,
    `framing: ${plan.camera.framing ?? "center"}`,
    `background density: ${plan.scene.backgroundDensity ?? "normal"}`,
    `location: ${plan.scene.location ?? "generic scene"}`,
    `style: ${plan.style.genre ?? "cinematic"}`,
    `lighting: ${plan.style.lighting ?? "soft"}`
  ];
  const prompt = `${brief}. ${parts.join(". ")}.`;
  return { plan, prompt };
}

function b64ToBuffer(raw: string) {
  const base64 = raw.includes(",") ? raw.split(",").pop() ?? raw : raw;
  return Buffer.from(base64, "base64");
}

async function drawThingsTxt2Img(baseUrl: string, prompt: string, seed: number, ratio: "1:1" | "16:9" | "9:16") {
  const { width, height } = parseResolution(ratio);
  const payload = JSON.stringify({
    prompt,
    negative_prompt: "blurry, low quality, malformed hands, text artifacts",
    width,
    height,
    steps: 4,
    cfg_scale: 3.5,
    sampler_name: "Euler a",
    seed
  });
  const raw = execFileSync("curl", [
    "-sS",
    "-m",
    "180",
    "-H",
    "content-type: application/json",
    "-d",
    payload,
    `${baseUrl}/sdapi/v1/txt2img`
  ], { encoding: "utf-8" });
  const data = JSON.parse(raw) as { images?: string[] };
  if (!data.images?.length) throw new Error("drawthings no image");
  return b64ToBuffer(data.images[0]);
}

async function comfyTxt2Img(baseUrl: string, checkpoint: string, prompt: string, seed: number, ratio: "1:1" | "16:9" | "9:16") {
  const { width, height } = parseResolution(ratio);
  const workflow: Record<string, any> = {
    "3": {
      inputs: {
        seed,
        steps: 6,
        cfg: 3.5,
        sampler_name: "euler",
        scheduler: "normal",
        denoise: 1,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0]
      },
      class_type: "KSampler"
    },
    "4": {
      inputs: { ckpt_name: checkpoint },
      class_type: "CheckpointLoaderSimple"
    },
    "5": {
      inputs: { width, height, batch_size: 1 },
      class_type: "EmptyLatentImage"
    },
    "6": {
      inputs: { text: prompt, clip: ["4", 1] },
      class_type: "CLIPTextEncode"
    },
    "7": {
      inputs: { text: "blurry, low quality, malformed hands, text artifacts", clip: ["4", 1] },
      class_type: "CLIPTextEncode"
    },
    "8": {
      inputs: { samples: ["3", 0], vae: ["4", 2] },
      class_type: "VAEDecode"
    },
    "9": {
      inputs: { filename_prefix: "intent-benchmark", images: ["8", 0] },
      class_type: "SaveImage"
    }
  };
  const promptRaw = execFileSync("curl", [
    "-sS",
    "-m",
    "30",
    "-H",
    "content-type: application/json",
    "-d",
    JSON.stringify({ prompt: workflow }),
    `${baseUrl}/prompt`
  ], { encoding: "utf-8" });
  const promptData = JSON.parse(promptRaw) as { prompt_id?: string };
  const promptId = promptData.prompt_id;
  if (!promptId) throw new Error("comfy no prompt id");

  const started = Date.now();
  while (Date.now() - started < 120_000) {
    let historyData: Record<string, any> = {};
    try {
      const historyRaw = execFileSync("curl", ["-sS", "-m", "6", `${baseUrl}/history/${promptId}`], { encoding: "utf-8" });
      historyData = JSON.parse(historyRaw) as Record<string, any>;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    const history = historyData[promptId];
    const outputs = history?.outputs ?? {};
    const item = Object.values(outputs).find((out: any) => Array.isArray(out?.images) && out.images.length > 0) as any;
    if (item?.images?.length) {
      const file = item.images[0];
      const params = new URLSearchParams({
        filename: String(file.filename),
        subfolder: String(file.subfolder ?? ""),
        type: String(file.type ?? "output")
      });
      return execFileSync("curl", ["-sS", "-m", "30", `${baseUrl}/view?${params.toString()}`], { encoding: "buffer" });
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("comfy timeout");
}

function pickSamples(dataset: BenchmarkCase[], count: number): BenchmarkCase[] {
  const buckets = [
    (item: BenchmarkCase) => item.expected.subjectCount === 1 && item.expected.goal === "poster",
    (item: BenchmarkCase) => item.expected.goal === "ad",
    (item: BenchmarkCase) => item.expected.goal === "scene",
    (item: BenchmarkCase) => item.expected.subjectCount === 2,
    (item: BenchmarkCase) => item.split === "noise",
    (item: BenchmarkCase) => item.split === "adversarial"
  ];
  const picked: BenchmarkCase[] = [];
  const used = new Set<string>();
  let round = 0;
  while (picked.length < count && round < 50) {
    for (const bucket of buckets) {
      const candidate = dataset.find((item) => !used.has(item.id) && bucket(item));
      if (!candidate) continue;
      picked.push(candidate);
      used.add(candidate.id);
      if (picked.length >= count) break;
    }
    round += 1;
  }
  if (picked.length < count) {
    for (const item of dataset) {
      if (used.has(item.id)) continue;
      picked.push(item);
      used.add(item.id);
      if (picked.length >= count) break;
    }
  }
  return picked.slice(0, count);
}

async function main() {
  const sampleCount = Number(process.env.INTENT_SAMPLE_COUNT ?? "30");
  const compareBaseline = process.env.INTENT_COMPARE_BASELINE === "1";
  const datasetPath = resolve(process.cwd(), "artifacts/intent-benchmark/dataset.jsonl");
  const outputDir = resolve(process.cwd(), "artifacts/intent-benchmark/image-samples");
  ensureDir(outputDir);
  ensureDir(resolve(outputDir, "baseline"));
  ensureDir(resolve(outputDir, "round3"));
  const dataset = readDataset(datasetPath);
  const samples = pickSamples(dataset, sampleCount);
  const engine = await selectEngine();
  const comfyFallback = engine.engine === "drawthings" ? await probeComfyUi() : engine;
  const rows: Array<Record<string, string | number>> = [];

  for (let i = 0; i < samples.length; i += 1) {
    const item = samples[i];
    const base = planToPrompt(item.brief, "baseline", item.lang);
    const latest = planToPrompt(item.brief, "round3", item.lang);
    const seed = 3000 + i;
    let baselinePath = "";
    let latestPath = "";
    let note = "";

    try {
      if (engine.engine === "drawthings") {
        const latestBuffer = await drawThingsTxt2Img(engine.baseUrl, latest.prompt, seed, item.expected.ratio);
        latestPath = resolve(outputDir, "round3", `${item.id}.png`);
        writeFileSync(latestPath, latestBuffer);
        if (compareBaseline) {
          const baseBuffer = await drawThingsTxt2Img(engine.baseUrl, base.prompt, seed, item.expected.ratio);
          baselinePath = resolve(outputDir, "baseline", `${item.id}.png`);
          writeFileSync(baselinePath, baseBuffer);
        }
      } else if (engine.engine === "comfyui") {
        const latestBuffer = await comfyTxt2Img(engine.baseUrl, engine.checkpoint, latest.prompt, seed, item.expected.ratio);
        latestPath = resolve(outputDir, "round3", `${item.id}.png`);
        writeFileSync(latestPath, latestBuffer);
        if (compareBaseline) {
          const baseBuffer = await comfyTxt2Img(engine.baseUrl, engine.checkpoint, base.prompt, seed, item.expected.ratio);
          baselinePath = resolve(outputDir, "baseline", `${item.id}.png`);
          writeFileSync(baselinePath, baseBuffer);
        }
      } else {
        note = "no_local_engine";
      }
    } catch (error) {
      if (comfyFallback.engine === "comfyui") {
        try {
          const fallbackBuffer = await comfyTxt2Img(comfyFallback.baseUrl, comfyFallback.checkpoint, latest.prompt, seed, item.expected.ratio);
          latestPath = resolve(outputDir, "round3", `${item.id}.png`);
          writeFileSync(latestPath, fallbackBuffer);
          note = "fallback_to_comfyui";
        } catch (fallbackError) {
          note = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        }
      } else {
        note = error instanceof Error ? error.message : String(error);
      }
    }

    rows.push({
      id: item.id,
      split: item.split,
      brief: item.brief,
      engine: engine.engine,
      baselinePrompt: base.prompt,
      round3Prompt: latest.prompt,
      baselineImage: baselinePath,
      round3Image: latestPath,
      note
    });
    console.log(`${i + 1}/${samples.length} ${item.id} ${note ? `fail=${note}` : "ok"}`);
  }

  writeFileSync(resolve(outputDir, "index.json"), JSON.stringify(rows, null, 2), "utf-8");
  const md = [
    "# Image Samples",
    "",
    `- sampleCount: ${sampleCount}`,
    `- engine: ${engine.engine}`,
    "",
    "## Rows",
    ...rows.map((row) => `- ${row.id} | split=${row.split} | baseline=${row.baselineImage || "NA"} | round3=${row.round3Image || "NA"} | note=${row.note || "ok"}`)
  ];
  writeFileSync(resolve(outputDir, "report.md"), `${md.join("\n")}\n`, "utf-8");
  console.log(`image sample report: ${resolve(outputDir, "report.md")}`);
}

main();
