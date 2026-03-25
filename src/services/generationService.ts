/**
 * generationService.ts
 * Unified generation API layer — fal (image/video), Runway (video), local (ComfyUI/DrawThings)
 *
 * Three paths:
 *   hosted  → uses platform keys from env (VITE_FAL_API_KEY / VITE_RUNWAY_API_KEY)
 *   byo     → uses user's own key stored in ApiCredentialState
 *   local   → routes to ComfyUI or DrawThings on localhost
 */

import type { ApiCredentialState } from "../types/account";

// ── Types ──────────────────────────────────────────────────────────────────

export type GenerationInput = {
  prompt: string;
  resolution: string;        // e.g. "1024x576"
  mediaMode: "image" | "video";
  seed?: number;
  durationSeconds?: number;  // video only
  negativePrompt?: string;
  qualityTier?: "standard" | "hd" | "video" | "video_hq";
};

export type GenerationResult = {
  kind: "image" | "video";
  url: string;              // object URL or remote URL
  posterUrl?: string;       // video thumbnail
  ownedUrls: string[];      // blob: URLs that need revoking on cleanup
  provider: string;         // "fal" | "runway" | "comfyui" | "drawthings"
  model?: string;
  durationSeconds?: number;
};

export type HostedGenerationConfig = {
  falApiKey: string;        // from VITE_FAL_API_KEY
  runwayApiKey: string;     // from VITE_RUNWAY_API_KEY
  defaultImageModel?: string;
  defaultVideoModel?: string;
};

// ── Platform config (from env) ─────────────────────────────────────────────

export function getHostedConfig(): HostedGenerationConfig {
  return {
    falApiKey:           (import.meta.env.VITE_FAL_API_KEY   as string | undefined)?.trim() ?? "",
    runwayApiKey:        (import.meta.env.VITE_RUNWAY_API_KEY as string | undefined)?.trim() ?? "",
    defaultImageModel:   (import.meta.env.VITE_FAL_IMAGE_MODEL as string | undefined)?.trim() || "fal-ai/flux/dev",
    defaultVideoModel:   (import.meta.env.VITE_RUNWAY_VIDEO_MODEL as string | undefined)?.trim() || "gen3a_turbo",
  };
}

export function isHostedConfigured(): boolean {
  const cfg = getHostedConfig();
  return Boolean(cfg.falApiKey || cfg.runwayApiKey);
}

// ── fal.run API ────────────────────────────────────────────────────────────

type FalImageResult = {
  images?: Array<{ url: string; width?: number; height?: number }>;
  image?: { url: string };
};

type FalVideoResult = {
  video?: { url: string };
  videos?: Array<{ url: string }>;
};

async function falGenerate<T>(
  apiKey: string,
  model: string,
  input: Record<string, unknown>,
  baseUrl = "https://queue.fal.run"
): Promise<T> {
  // Submit
  const submitRes = await fetch(`${baseUrl}/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Key ${apiKey}`,
    },
    body: JSON.stringify({ input }),
  });
  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => submitRes.statusText);
    throw new Error(`fal submit failed (${submitRes.status}): ${text}`);
  }
  const submitted = await submitRes.json() as { request_id?: string; status?: string; images?: unknown; video?: unknown };

  // If response is already the result (sync mode)
  if (submitted.images || submitted.video) return submitted as T;

  const requestId = submitted.request_id;
  if (!requestId) throw new Error("fal did not return a request_id");

  // Poll for result
  const pollUrl = `${baseUrl}/${model}/requests/${requestId}`;
  const maxWait = 180_000;
  const started = Date.now();
  while (Date.now() - started < maxWait) {
    await new Promise(r => setTimeout(r, 2500));
    const pollRes = await fetch(`${pollUrl}/status`, {
      headers: { "Authorization": `Key ${apiKey}` },
    });
    if (!pollRes.ok) continue;
    const status = await pollRes.json() as { status?: string };
    if (status.status === "COMPLETED") {
      const resultRes = await fetch(pollUrl, {
        headers: { "Authorization": `Key ${apiKey}` },
      });
      if (!resultRes.ok) throw new Error(`fal result fetch failed (${resultRes.status})`);
      return resultRes.json() as Promise<T>;
    }
    if (status.status === "FAILED") throw new Error("fal generation failed");
  }
  throw new Error("fal generation timed out");
}

async function runFalImage(
  apiKey: string,
  input: GenerationInput,
  model?: string
): Promise<GenerationResult> {
  const [w, h] = parseResolution(input.resolution);
  const m = model || "fal-ai/flux/dev";
  const result = await falGenerate<FalImageResult>(apiKey, m, {
    prompt: input.prompt,
    image_size: { width: w, height: h },
    num_inference_steps: input.qualityTier === "hd" ? 28 : 20,
    seed: input.seed ?? randomSeed(),
    enable_safety_checker: false,
  });
  const url = result.images?.[0]?.url ?? result.image?.url ?? "";
  if (!url) throw new Error("fal returned no image URL");
  return {
    kind: "image",
    url,
    ownedUrls: [],
    provider: "fal",
    model: m,
  };
}

async function runFalVideo(
  apiKey: string,
  input: GenerationInput,
  model?: string
): Promise<GenerationResult> {
  const [w, h] = parseResolution(input.resolution);
  const m = model || "fal-ai/wan-t2v";
  const result = await falGenerate<FalVideoResult>(apiKey, m, {
    prompt: input.prompt,
    negative_prompt: input.negativePrompt || DEFAULT_NEGATIVE,
    num_frames: Math.min(81, Math.max(17, Math.round((input.durationSeconds ?? 5) * 12))),
    width: w,
    height: h,
    seed: input.seed ?? randomSeed(),
  });
  const url = result.video?.url ?? result.videos?.[0]?.url ?? "";
  if (!url) throw new Error("fal returned no video URL");
  return {
    kind: "video",
    url,
    ownedUrls: [],
    provider: "fal",
    model: m,
    durationSeconds: input.durationSeconds,
  };
}

// ── Runway API ─────────────────────────────────────────────────────────────

type RunwayTaskResult = {
  id?: string;
  status?: string;
  output?: string[];
  failure?: string;
  failureCode?: string;
};

async function runwayGenerate(
  apiKey: string,
  input: GenerationInput,
  model = "gen3a_turbo",
  baseUrl = "https://api.dev.runwayml.com"
): Promise<GenerationResult> {
  const submitRes = await fetch(`${baseUrl}/v1/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      promptText: input.prompt,
      model,
      duration: Math.min(10, Math.max(5, input.durationSeconds ?? 5)),
      ratio: resolutionToRatio(input.resolution),
      seed: input.seed ?? randomSeed(),
    }),
  });
  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => submitRes.statusText);
    throw new Error(`Runway submit failed (${submitRes.status}): ${text}`);
  }
  const task = await submitRes.json() as RunwayTaskResult;
  const taskId = task.id;
  if (!taskId) throw new Error("Runway did not return a task id");

  // Poll
  const maxWait = 240_000;
  const started = Date.now();
  while (Date.now() - started < maxWait) {
    await new Promise(r => setTimeout(r, 3000));
    const pollRes = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Runway-Version": "2024-11-06",
      },
    });
    if (!pollRes.ok) continue;
    const result = await pollRes.json() as RunwayTaskResult;
    if (result.status === "SUCCEEDED") {
      const url = result.output?.[0] ?? "";
      if (!url) throw new Error("Runway returned no output URL");
      return {
        kind: "video",
        url,
        ownedUrls: [],
        provider: "runway",
        model,
        durationSeconds: input.durationSeconds,
      };
    }
    if (result.status === "FAILED") {
      throw new Error(`Runway generation failed: ${result.failureCode ?? result.failure ?? "unknown"}`);
    }
  }
  throw new Error("Runway generation timed out");
}

// ── Main exported entry points ─────────────────────────────────────────────

/**
 * Platform-hosted generation (uses your fal/runway keys from env)
 */
export async function generateHosted(input: GenerationInput): Promise<GenerationResult> {
  const cfg = getHostedConfig();
  if (input.mediaMode === "image") {
    if (!cfg.falApiKey) throw new Error("hosted_fal_not_configured");
    return runFalImage(cfg.falApiKey, input, cfg.defaultImageModel);
  }
  // video: prefer runway if configured, fallback to fal
  if (cfg.runwayApiKey) {
    return runwayGenerate(cfg.runwayApiKey, input, cfg.defaultVideoModel);
  }
  if (cfg.falApiKey) {
    return runFalVideo(cfg.falApiKey, input);
  }
  throw new Error("hosted_not_configured");
}

/**
 * BYO (user's own API key) generation
 */
export async function generateByo(
  input: GenerationInput,
  credentials: ApiCredentialState
): Promise<GenerationResult> {
  const provider = credentials.defaultProvider;
  const config = credentials[provider];
  if (!config?.enabled) throw new Error("byo_provider_not_enabled");
  const apiKey = config.mode === "personal" ? config.apiKey?.trim() : "";
  if (!apiKey) throw new Error("byo_api_key_missing");

  const baseUrl = config.baseUrl?.trim() || undefined;

  if (provider === "fal") {
    if (input.mediaMode === "image") {
      return runFalImage(apiKey, input, config.preferredModel || undefined);
    }
    return runFalVideo(apiKey, input, config.preferredModel || undefined);
  }

  if (provider === "runway") {
    if (input.mediaMode === "image") {
      // Runway is video-only — fall through to fal if fal is also configured
      const falConfig = credentials.fal;
      if (falConfig?.enabled && falConfig.mode === "personal" && falConfig.apiKey?.trim()) {
        return runFalImage(falConfig.apiKey.trim(), input, falConfig.preferredModel || undefined);
      }
      throw new Error("runway_image_not_supported");
    }
    return runwayGenerate(apiKey, input, config.preferredModel || "gen3a_turbo", baseUrl);
  }

  throw new Error(`byo_unknown_provider_${provider}`);
}

/**
 * Local generation (ComfyUI or DrawThings)
 * Note: actual local calls stay in localGeneration.ts — this is the router
 */
export type LocalGenerationRoute = "comfyui_image" | "comfyui_video" | "drawthings_image";

export function resolveLocalRoute(
  input: GenerationInput,
  comfyReady: boolean,
  drawReady: boolean
): LocalGenerationRoute | null {
  if (input.mediaMode === "video") {
    return comfyReady ? "comfyui_video" : null;
  }
  if (comfyReady) return "comfyui_image";
  if (drawReady) return "drawthings_image";
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseResolution(r: string): [number, number] {
  const m = r.match(/(\d+)\s*x\s*(\d+)/i);
  if (!m) return [1024, 576];
  return [Number(m[1]), Number(m[2])];
}

function resolutionToRatio(r: string): string {
  const [w, h] = parseResolution(r);
  const ratio = w / h;
  if (ratio > 1.6) return "1280:720";
  if (ratio < 0.7) return "720:1280";
  return "1024:1024";
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

const DEFAULT_NEGATIVE =
  "blurry, low quality, watermark, text, logo, nsfw, extra limbs, deformed hands";

// ── Error code → user-friendly message ────────────────────────────────────

export function generationErrorMessage(error: unknown, lang: "zh" | "en"): string {
  const msg = error instanceof Error ? error.message : String(error);
  const zh = lang === "zh";

  if (msg.includes("hosted_not_configured") || msg.includes("hosted_fal_not_configured")) {
    return zh ? "平台生成服务未配置，请联系管理员" : "Hosted generation not configured — contact the admin";
  }
  if (msg.includes("byo_api_key_missing")) {
    return zh ? "未填写 API Key，请在「账户 → AI Providers」中配置" : "No API key set — go to Account → AI Providers";
  }
  if (msg.includes("byo_provider_not_enabled")) {
    return zh ? "该 Provider 未启用，请在「账户 → AI Providers」中开启" : "Provider not enabled — go to Account → AI Providers";
  }
  if (msg.includes("runway_image_not_supported")) {
    return zh ? "Runway 不支持图片生成，请同时配置 fal" : "Runway doesn't support image generation — also configure fal";
  }
  if (msg.includes("insufficient_credits") || msg.includes("not enough credits")) {
    return zh ? "积分不足，请充值后重试" : "Not enough credits — please top up";
  }
  if (msg.includes("timed out")) {
    return zh ? "生成超时，请稍后重试" : "Generation timed out — please try again";
  }
  if (msg.includes("fal submit failed") || msg.includes("Runway submit failed")) {
    return zh ? `API 请求失败：${msg}` : `API request failed: ${msg}`;
  }
  return zh ? `生成失败：${msg}` : `Generation failed: ${msg}`;
}
