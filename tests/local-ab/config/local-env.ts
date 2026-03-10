import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type LocalAbEnv = {
  rootDir: string;
  localLlmApiUrl: string;
  localLlmUiUrl: string;
  localLlmModel: string;
  comfyUiBaseUrl: string;
  comfyUiBaseUrls: string[];
  comfyUiOutputDir: string;
  comfyUiCheckpoint: string;
  drawThingsModelName: string;
};

function loadDotEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function loadLocalAbEnv(rootDir = process.cwd()): LocalAbEnv {
  const candidates = [
    path.join(rootDir, ".env.local"),
    path.join(rootDir, ".env"),
    path.join(rootDir, "tests/local-ab/.env.local"),
    path.join(rootDir, "tests/local-ab/.env")
  ];
  for (const file of candidates) loadDotEnvFile(file);

  const comfyUiBaseUrl = process.env.COMFYUI_BASE_URL ?? "http://127.0.0.1:8188";
  const comfyUiBaseUrls = (process.env.COMFYUI_BASE_URLS ?? `${comfyUiBaseUrl},http://127.0.0.1:8000,http://127.0.0.1:8188`)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    rootDir,
    localLlmApiUrl: process.env.LOCAL_LLM_API_URL ?? "http://127.0.0.1:11434",
    localLlmUiUrl: process.env.LOCAL_LLM_UI_URL ?? "http://127.0.0.1:49535",
    localLlmModel: process.env.LOCAL_LLM_MODEL ?? "qwen2.5:7b-instruct",
    comfyUiBaseUrl,
    comfyUiBaseUrls,
    comfyUiOutputDir: process.env.COMFYUI_OUTPUT_DIR ?? "",
    comfyUiCheckpoint: process.env.COMFYUI_CHECKPOINT ?? "replace_me.safetensors",
    drawThingsModelName: process.env.DRAWTHINGS_MODEL_NAME ?? "FLUX.1-schnell"
  };
}
