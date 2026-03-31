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
import { getApiAuthHeaders, getCurrentUser } from "./authService";

// ── Types ──────────────────────────────────────────────────────────────────

export type GenerationInput = {
  prompt: string;
  resolution: string;        // e.g. "1024x576"
  mediaMode: "image" | "video";
  seed?: number;
  durationSeconds?: number;  // video only
  negativePrompt?: string;
  qualityTier?: "standard" | "hd" | "video" | "video_hq";
  creditsCost?: number;
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

type SupportedByoProvider = "fal" | "runway" | "replicate" | "stability" | "custom_api";

type QueueSubmitResponse = {
  ok: boolean;
  taskId?: string;
  status?: string;
  queuePosition?: number;
  queuedAhead?: number;
  error?: string;
  need?: number;
  have?: number;
};

type QueueStatusResponse = {
  ok: boolean;
  status?: "queued" | "running" | "done" | "failed" | string;
  queuePosition?: number;
  queuedAhead?: number;
  output?: unknown;
  raw?: unknown;
  error?: string;
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

type ReplicatePrediction = {
  id?: string;
  status?: string;
  output?: unknown;
  error?: string | null;
  urls?: { get?: string };
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
  baseUrl = "https://api.runwayml.com"
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

async function replicateGenerate(
  apiKey: string,
  input: GenerationInput,
  model: string,
  baseUrl = "https://api.replicate.com"
): Promise<GenerationResult> {
  if (input.mediaMode !== "image") throw new Error("replicate_image_only");
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const modelPath = model.replace(/^https?:\/\/[^/]+\//i, "").replace(/^\/+/, "");
  const modelParts = modelPath.split(":");
  const modelRef = modelParts[0] ?? "";
  const modelVersion = modelParts[1] ?? "";
  const pathParts = modelRef.split("/").filter(Boolean);
  if (pathParts.length < 2) throw new Error("replicate_model_invalid");
  const [owner, name] = pathParts;
  const endpoint = `${normalizedBase}/v1/models/${owner}/${name}/predictions`;
  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Prefer": "wait=20"
    },
    body: JSON.stringify({
      ...(modelVersion ? { version: modelVersion } : {}),
      input: {
        prompt: input.prompt,
        ...(input.negativePrompt ? { negative_prompt: input.negativePrompt } : {}),
        ...(input.seed != null ? { seed: input.seed } : {}),
        ...(input.resolution ? { aspect_ratio: resolutionToAspectRatio(input.resolution) } : {}),
        ...(input.qualityTier === "hd" ? { output_quality: 100 } : {})
      }
    })
  });
  const submitJson = await safeJson(submitRes) as ReplicatePrediction | null;
  if (!submitRes.ok || !submitJson) {
    const text = submitJson?.error || (await submitRes.text().catch(() => submitRes.statusText));
    throw new Error(`Replicate submit failed (${submitRes.status}): ${text}`);
  }
  if (isReplicateTerminalSuccess(submitJson.status) && submitJson.output) {
    const url = extractReplicateOutputUrl(submitJson.output);
    if (!url) throw new Error("replicate_missing_output_url");
    return {
      kind: "image",
      url,
      ownedUrls: [],
      provider: "replicate",
      model
    };
  }

  const pollUrl = submitJson.urls?.get || (submitJson.id ? `${normalizedBase}/v1/predictions/${submitJson.id}` : "");
  if (!pollUrl) throw new Error("replicate_missing_prediction_url");
  const started = Date.now();
  const maxWait = 180_000;
  while (Date.now() - started < maxWait) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const pollRes = await fetch(pollUrl, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });
    const pollJson = await safeJson(pollRes) as ReplicatePrediction | null;
    if (!pollRes.ok || !pollJson) continue;
    if (isReplicateTerminalFailure(pollJson.status)) {
      throw new Error(`Replicate generation failed: ${pollJson.error || pollJson.status || "unknown"}`);
    }
    if (isReplicateTerminalSuccess(pollJson.status) && pollJson.output) {
      const url = extractReplicateOutputUrl(pollJson.output);
      if (!url) throw new Error("replicate_missing_output_url");
      return {
        kind: "image",
        url,
        ownedUrls: [],
        provider: "replicate",
        model
      };
    }
  }
  throw new Error("Replicate generation timed out");
}

async function stabilityGenerate(
  apiKey: string,
  input: GenerationInput,
  model: string,
  baseUrl = "https://api.stability.ai"
): Promise<GenerationResult> {
  if (input.mediaMode !== "image") throw new Error("stability_image_only");
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  // v2beta endpoint — v1 is deprecated and returns 404
  const response = await fetch(`${normalizedBase}/v2beta/stable-image/generate/ultra`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "image/*",
    },
    body: (() => {
      const fd = new FormData();
      fd.append("prompt", input.prompt);
      if (input.negativePrompt) fd.append("negative_prompt", input.negativePrompt);
      fd.append("aspect_ratio", resolutionToAspectRatio(input.resolution));
      fd.append("output_format", "png");
      if (input.seed != null) fd.append("seed", String(input.seed));
      return fd;
    })(),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Stability submit failed (${response.status}): ${text}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return {
    kind: "image",
    url: objectUrl,
    ownedUrls: [objectUrl],
    provider: "stability",
    model,
  };
}

async function customApiGenerate(
  apiKey: string,
  input: GenerationInput,
  model: string,
  baseUrl?: string
): Promise<GenerationResult> {
  const endpoint = (baseUrl || "").trim().replace(/\/+$/, "");
  if (!endpoint) throw new Error("custom_api_base_url_missing");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-ScenePilotix-Provider": "custom_api"
    },
    body: JSON.stringify({
      prompt: input.prompt,
      mediaMode: input.mediaMode,
      resolution: input.resolution,
      negativePrompt: input.negativePrompt || "",
      seed: input.seed ?? null,
      durationSeconds: input.durationSeconds ?? null,
      model: model || ""
    })
  });
  const data = await safeJson(response) as { kind?: "image" | "video"; url?: string; posterUrl?: string; error?: string; message?: string } | null;
  if (!response.ok || !data) {
    const text = data?.error || data?.message || (await response.text().catch(() => response.statusText));
    throw new Error(`custom_api_request_failed: ${text}`);
  }
  if (!data.url || !data.kind) throw new Error("custom_api_invalid_response");
  if (data.kind !== input.mediaMode) throw new Error("custom_api_invalid_response");
  return {
    kind: data.kind,
    url: data.url,
    posterUrl: data.posterUrl,
    ownedUrls: [],
    provider: "custom_api",
    model: model || undefined,
    durationSeconds: input.durationSeconds
  };
}

// ── Main exported entry points ─────────────────────────────────────────────

/**
 * Platform-hosted generation (uses your fal/runway keys from env)
 */
export async function generateHosted(input: GenerationInput): Promise<GenerationResult> {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("missing_user_id");

  const provider: "fal" | "runway" = input.mediaMode === "video" ? "runway" : "fal";
  const submitBody = {
    userId: user.id,
    provider,
    mode: "platform",
    prompt: input.prompt,
    mediaType: input.mediaMode,
    ratio: resolutionToRatio(input.resolution),
    duration: input.durationSeconds,
    creditsCost: input.creditsCost
  };

  const authHeaders = await getApiAuthHeaders(user.id);
  const submitRes = await fetch("/api/generation/submit", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders },
    body: JSON.stringify(submitBody)
  });
  const submitJson = await safeJson(submitRes) as QueueSubmitResponse | null;
  if (!submitRes.ok || !submitJson?.ok || !submitJson.taskId) {
    const err = submitJson?.error || `submit_${submitRes.status}`;
    throw new Error(err);
  }

  notifyQueueStatus({
    phase: submitJson.status || "queued",
    queuePosition: submitJson.queuePosition,
    queuedAhead: submitJson.queuedAhead
  });

  const maxWait = 300_000;
  const started = Date.now();
  while (Date.now() - started < maxWait) {
    // Nudge worker tick on each poll. Unauthorized is ignored.
    fetch("/api/generation/worker", { method: "POST" }).catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const statusRes = await fetch("/api/generation/status", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({
        userId: user.id,
        provider,
        mode: "platform",
        mediaType: input.mediaMode,
        taskId: submitJson.taskId
      })
    });
    const statusJson = await safeJson(statusRes) as QueueStatusResponse | null;
    if (!statusJson) continue;

    notifyQueueStatus({
      phase: statusJson.status || "queued",
      queuePosition: statusJson.queuePosition,
      queuedAhead: statusJson.queuedAhead
    });

    if (statusJson.status === "failed") {
      throw new Error(statusJson.error || "generation_failed");
    }
    if (statusJson.status === "done") {
      const resolved = parseQueuedOutput(input.mediaMode, statusJson.output);
      notifyQueueStatus({ phase: "done" });
      return resolved;
    }
  }
  throw new Error("generation_queue_timeout");
}

/**
 * BYO (user's own API key) generation
 */
export async function generateByo(
  input: GenerationInput,
  credentials: ApiCredentialState,
  providerOverride?: SupportedByoProvider
): Promise<GenerationResult> {
  const provider = (providerOverride ?? credentials.defaultProvider) as SupportedByoProvider;
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

  if (provider === "replicate") {
    return replicateGenerate(apiKey, input, config.preferredModel || "black-forest-labs/flux-1.1-pro", baseUrl);
  }

  if (provider === "stability") {
    return stabilityGenerate(apiKey, input, config.preferredModel || "stable-diffusion-xl-1024-v1-0", baseUrl);
  }

  if (provider === "custom_api") {
    return customApiGenerate(apiKey, input, config.preferredModel || "", baseUrl);
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

function resolutionToAspectRatio(r: string): string {
  const [w, h] = parseResolution(r);
  const gcd = greatestCommonDivisor(w, h);
  return `${Math.max(1, Math.round(w / gcd))}:${Math.max(1, Math.round(h / gcd))}`;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

function greatestCommonDivisor(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function toStringSafe(value: unknown) {
  return typeof value === "string" ? value : "";
}

function extractImageUrl(output: any): string {
  return (
    toStringSafe(output?.images?.[0]?.url) ||
    toStringSafe(output?.image?.url) ||
    toStringSafe(output?.output?.images?.[0]?.url) ||
    toStringSafe(output?.output?.image?.url) ||
    toStringSafe(output?.raw?.images?.[0]?.url) ||
    toStringSafe(output?.raw?.image?.url)
  );
}

function extractVideoUrl(output: any): string {
  return (
    toStringSafe(output?.video?.url) ||
    toStringSafe(output?.videos?.[0]?.url) ||
    toStringSafe(output?.output?.[0]) ||
    toStringSafe(output?.output?.video?.url) ||
    toStringSafe(output?.output?.videos?.[0]?.url) ||
    toStringSafe(output?.raw?.video?.url) ||
    toStringSafe(output?.raw?.videos?.[0]?.url)
  );
}

function extractReplicateOutputUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const nested = extractReplicateOutputUrl(item);
      if (nested) return nested;
    }
    return "";
  }
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    return (
      toStringSafe(obj.url) ||
      toStringSafe(obj.image) ||
      toStringSafe(obj.output) ||
      extractReplicateOutputUrl(obj[0 as unknown as keyof typeof obj])
    );
  }
  return "";
}

function isReplicateTerminalSuccess(status: string | undefined): boolean {
  return status === "succeeded" || status === "successful";
}

function isReplicateTerminalFailure(status: string | undefined): boolean {
  return status === "failed" || status === "canceled" || status === "cancelled";
}

function base64ImageToObjectUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "image/png" });
  return URL.createObjectURL(blob);
}

function parseQueuedOutput(
  mediaMode: "image" | "video",
  output: unknown
): GenerationResult {
  if (mediaMode === "image") {
    const url = extractImageUrl(output);
    if (!url) throw new Error("generation_missing_image_url");
    return {
      kind: "image",
      url,
      ownedUrls: [],
      provider: "hosted-queue"
    };
  }
  const url = extractVideoUrl(output);
  if (!url) throw new Error("generation_missing_video_url");
  return {
    kind: "video",
    url,
    ownedUrls: [],
    provider: "hosted-queue"
  };
}

function notifyQueueStatus(payload: {
  phase: string;
  queuePosition?: number;
  queuedAhead?: number;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("spx:gen-queue-status", { detail: payload }));
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
  if (msg.includes("replicate_image_only")) {
    return zh ? "Replicate 当前仅支持图片生成" : "Replicate currently supports image generation only";
  }
  if (msg.includes("stability_image_only")) {
    return zh ? "Stability 当前仅支持图片生成" : "Stability currently supports image generation only";
  }
  if (msg.includes("custom_api_invalid_response")) {
    return zh ? "Custom API 返回格式无效，请检查响应结构" : "Custom API returned an invalid response format";
  }
  if (msg.includes("custom_api_request_failed")) {
    return zh ? "Custom API 请求失败，请检查地址、鉴权和服务状态" : "Custom API request failed — check the URL, auth, and service status";
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
