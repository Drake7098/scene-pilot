export type LocalProvider = "comfyui" | "drawthings";

export type LocalProbeState = "idle" | "checking" | "ready" | "fail" | "handoff";

export type LocalProviderStatus = {
  provider: LocalProvider;
  state: LocalProbeState;
  baseUrl?: string;
  checkpoint?: string;
  error?: string;
  detail?: string;
};

export type LocalImageResult = {
  provider: LocalProvider;
  prompt: string;
  seed: number;
  imageUrl: string;
  width: number;
  height: number;
  baseUrl?: string;
  promptId?: string;
};

export type LocalVideoResult = {
  provider: "comfyui";
  prompt: string;
  seed: number;
  videoUrl: string;
  posterUrl?: string;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  baseUrl?: string;
  promptId?: string;
};

export type DrawThingsQueueTask = {
  id: string;
  title: string;
  prompt: string;
  resolution: string;
  seed: number;
};

export type DrawThingsQueuePack = {
  tool: "drawthings";
  generatedAt: string;
  tasks: DrawThingsQueueTask[];
  queueJson: string;
  tasksCsv: string;
  readme: string;
};

const COMFY_DEFAULT_BASE_URLS = ["http://127.0.0.1:8188", "http://127.0.0.1:8000"];
const DRAW_DEFAULT_BASE_URLS = ["http://127.0.0.1:7860", "http://localhost:7860"];
const DEFAULT_DRAW_NEGATIVE = "blurry, low quality, malformed hands, text artifacts, extra limbs";
const DEFAULT_COMFY_NEGATIVE = "blurry, low quality, malformed hands, text artifacts, extra limbs";

type BasicWorkflow = Record<string, { inputs: Record<string, any>; class_type: string }>;

const BASIC_COMFY_WORKFLOW: BasicWorkflow = {
  "3": {
    inputs: {
      seed: 101,
      steps: 24,
      cfg: 6.5,
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
    inputs: {
      ckpt_name: "replace_me.safetensors"
    },
    class_type: "CheckpointLoaderSimple"
  },
  "5": {
    inputs: {
      width: 1024,
      height: 1024,
      batch_size: 1
    },
    class_type: "EmptyLatentImage"
  },
  "6": {
    inputs: {
      text: "__PROMPT__",
      clip: ["4", 1]
    },
    class_type: "CLIPTextEncode"
  },
  "7": {
    inputs: {
      text: DEFAULT_COMFY_NEGATIVE,
      clip: ["4", 1]
    },
    class_type: "CLIPTextEncode"
  },
  "8": {
    inputs: {
      samples: ["3", 0],
      vae: ["4", 2]
    },
    class_type: "VAEDecode"
  },
  "9": {
    inputs: {
      filename_prefix: "scenepilotix/local",
      images: ["8", 0]
    },
    class_type: "SaveImage"
  }
};

const WAN_VIDEO_WORKFLOW: BasicWorkflow = {
  "3": {
    inputs: {
      seed: 101,
      steps: 12,
      cfg: 4,
      sampler_name: "uni_pc",
      scheduler: "simple",
      denoise: 1,
      model: ["48", 0],
      positive: ["6", 0],
      negative: ["7", 0],
      latent_image: ["55", 0]
    },
    class_type: "KSampler"
  },
  "6": {
    inputs: {
      text: "__PROMPT__",
      clip: ["38", 0]
    },
    class_type: "CLIPTextEncode"
  },
  "7": {
    inputs: {
      text: "overexposed, static, blurry detail, subtitle, watermark, low quality, ugly, deformed hands, deformed face, fused fingers, frozen frame, chaotic background, too many people, walking backwards",
      clip: ["38", 0]
    },
    class_type: "CLIPTextEncode"
  },
  "8": {
    inputs: {
      samples: ["3", 0],
      vae: ["39", 0]
    },
    class_type: "VAEDecode"
  },
  "37": {
    inputs: {
      unet_name: "wan2.2_ti2v_5B_fp16.safetensors",
      weight_dtype: "default"
    },
    class_type: "UNETLoader"
  },
  "38": {
    inputs: {
      clip_name: "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
      type: "wan",
      device: "default"
    },
    class_type: "CLIPLoader"
  },
  "39": {
    inputs: {
      vae_name: "wan2.2_vae.safetensors"
    },
    class_type: "VAELoader"
  },
  "48": {
    inputs: {
      model: ["37", 0],
      shift: 8
    },
    class_type: "ModelSamplingSD3"
  },
  "55": {
    inputs: {
      vae: ["39", 0],
      width: 512,
      height: 288,
      length: 73,
      batch_size: 1,
      start_image: ["56", 0]
    },
    class_type: "Wan22ImageToVideoLatent"
  },
  "56": {
    inputs: {
      image: "__UPLOAD__"
    },
    class_type: "LoadImage"
  },
  "57": {
    inputs: {
      images: ["8", 0],
      fps: 12
    },
    class_type: "CreateVideo"
  },
  "58": {
    inputs: {
      video: ["57", 0],
      filename_prefix: "video/scenepilotix",
      format: "mp4",
      codec: "auto"
    },
    class_type: "SaveVideo"
  }
};

function parseResolution(input: string): { width: number; height: number } {
  const hit = input.match(/(\d+)\s*x\s*(\d+)/i);
  if (!hit) return { width: 1024, height: 1024 };
  return {
    width: Math.max(256, Number(hit[1])),
    height: Math.max(256, Number(hit[2]))
  };
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function b64ToObjectUrl(base64: string, mime = "image/png"): string {
  const clean = base64.includes(",") ? base64.split(",").pop() ?? base64 : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

function uniqueBaseUrls(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function shouldUseDevProxy(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const port = window.location.port;
  return (host === "localhost" || host === "127.0.0.1") && port === "5173";
}

function withComfyProxyPath(path: string): string {
  return shouldUseDevProxy() ? `/__localgen/comfy${path}` : path;
}

function withDrawProxyPath(path: string): string {
  return shouldUseDevProxy() ? `/__localgen/draw${path}` : path;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return await response.json() as T;
}

function comfyEndpoint(baseUrl: string, path: string): string {
  return baseUrl.startsWith("/__localgen/comfy") ? withComfyProxyPath(path) : `${baseUrl}${path}`;
}

async function waitForComfyHistory(baseUrl: string, promptId: string, maxWaitMs: number): Promise<Record<string, any>> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    const historyPayload = await fetchJson<Record<string, any>>(comfyEndpoint(baseUrl, `/history/${promptId}`));
    const history = historyPayload[promptId];
    if (!history) {
      await new Promise((resolve) => window.setTimeout(resolve, 1600));
      continue;
    }
    const state = String(history.status?.status_str ?? "");
    if (state === "error") {
      throw new Error("ComfyUI execution error");
    }
    if (history.status?.completed || state === "success") {
      return history;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1600));
  }
  throw new Error("Timed out waiting for ComfyUI");
}

function assetEntryToViewUrl(baseUrl: string, file: Record<string, any>): string {
  const params = new URLSearchParams();
  if (file.filename) params.set("filename", String(file.filename));
  if (file.subfolder) params.set("subfolder", String(file.subfolder));
  params.set("type", String(file.type ?? "output"));
  return `${comfyEndpoint(baseUrl, "/view")}?${params.toString()}`;
}

async function fetchBlobObjectUrl(url: string): Promise<{ objectUrl: string; mime: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  return {
    objectUrl: URL.createObjectURL(blob),
    mime: blob.type
  };
}

async function uploadComfyInputImage(baseUrl: string, imageUrl: string, filename: string): Promise<string> {
  const blobResponse = await fetch(imageUrl);
  if (!blobResponse.ok) {
    throw new Error("Unable to load anchor image for upload");
  }
  const blob = await blobResponse.blob();
  const form = new FormData();
  form.append("image", new File([blob], filename, { type: blob.type || "image/png" }), filename);
  const payload = await fetchJson<{ name?: string }>(comfyEndpoint(baseUrl, "/upload/image"), {
    method: "POST",
    body: form
  });
  if (!payload.name) {
    throw new Error("ComfyUI did not return an uploaded image name");
  }
  return payload.name;
}

async function listComfyModelNames(baseUrl: string, category: string): Promise<string[]> {
  try {
    const payload = await fetchJson<any>(comfyEndpoint(baseUrl, `/models/${category}`));
    return Array.isArray(payload) ? payload.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export async function probeComfyUi(candidates = COMFY_DEFAULT_BASE_URLS, preferredCheckpoint = ""): Promise<LocalProviderStatus> {
  if (shouldUseDevProxy()) {
    try {
      const stats = await fetch(withComfyProxyPath("/system_stats"));
      if (stats.ok) {
        const checkpoints = await fetchJson<string[]>(withComfyProxyPath("/models/checkpoints"));
        const checkpoint = Array.isArray(checkpoints) && checkpoints.length > 0
          ? (preferredCheckpoint && checkpoints.includes(preferredCheckpoint) ? preferredCheckpoint : checkpoints[0])
          : "";
        return {
          provider: "comfyui",
          state: "ready",
          baseUrl: "/__localgen/comfy",
          checkpoint,
          detail: checkpoint ? `checkpoint=${checkpoint}` : undefined
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { provider: "comfyui", state: "fail", baseUrl: "/__localgen/comfy", error: message };
    }
  }
  for (const baseUrl of uniqueBaseUrls(candidates)) {
    try {
      const stats = await fetch(`${baseUrl}/system_stats`);
      if (!stats.ok) continue;
      const checkpoints = await fetchJson<string[]>(`${baseUrl}/models/checkpoints`);
      const checkpoint = Array.isArray(checkpoints) && checkpoints.length > 0
        ? (preferredCheckpoint && checkpoints.includes(preferredCheckpoint) ? preferredCheckpoint : checkpoints[0])
        : "";
      return {
        provider: "comfyui",
        state: "ready",
        baseUrl,
        checkpoint,
        detail: checkpoint ? `checkpoint=${checkpoint}` : undefined
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (baseUrl === uniqueBaseUrls(candidates).slice(-1)[0]) {
        return { provider: "comfyui", state: "fail", baseUrl, error: message };
      }
    }
  }
  return { provider: "comfyui", state: "fail", error: "ComfyUI not reachable" };
}

export async function probeDrawThings(candidates = DRAW_DEFAULT_BASE_URLS): Promise<LocalProviderStatus> {
  if (shouldUseDevProxy()) {
    try {
      const response = await fetch(withDrawProxyPath("/"));
      if (response.ok) {
        return {
          provider: "drawthings",
          state: "ready",
          baseUrl: "/__localgen/draw",
          detail: "HTTP API server reachable"
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        provider: "drawthings",
        state: "handoff",
        baseUrl: "/__localgen/draw",
        error: message,
        detail: "HTTP API unavailable, queue handoff will be used"
      };
    }
  }
  for (const baseUrl of uniqueBaseUrls(candidates)) {
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) continue;
      return {
        provider: "drawthings",
        state: "ready",
        baseUrl,
        detail: "HTTP API server reachable"
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (baseUrl === uniqueBaseUrls(candidates).slice(-1)[0]) {
        return {
          provider: "drawthings",
          state: "handoff",
          baseUrl,
          error: message,
          detail: "HTTP API unavailable, queue handoff will be used"
        };
      }
    }
  }
  return {
    provider: "drawthings",
    state: "handoff",
    detail: "HTTP API unavailable, queue handoff will be used"
  };
}

export async function runComfyUiImage(args: {
  prompt: string;
  resolution: string;
  seed?: number;
  baseUrls?: string[];
  preferredCheckpoint?: string;
  negativePrompt?: string;
  steps?: number;
  cfg?: number;
  prefix?: string;
  maxWaitMs?: number;
}): Promise<LocalImageResult> {
  const status = await probeComfyUi(args.baseUrls, args.preferredCheckpoint);
  if (status.state !== "ready" || !status.baseUrl) {
    throw new Error(status.error ?? "ComfyUI unavailable");
  }
  const seed = typeof args.seed === "number" ? args.seed : -1;
  const prefix = args.prefix ?? `scenepilotix_${Date.now()}_${Math.abs(seed)}`;
  const workflow = deepClone(BASIC_COMFY_WORKFLOW);
  const { width, height } = parseResolution(args.resolution);
  workflow["4"].inputs.ckpt_name = status.checkpoint || "replace_me.safetensors";
  workflow["6"].inputs.text = args.prompt;
  workflow["7"].inputs.text = args.negativePrompt || DEFAULT_COMFY_NEGATIVE;
  workflow["3"].inputs.seed = seed;
  if (typeof args.steps === "number" && args.steps > 0) workflow["3"].inputs.steps = args.steps;
  if (typeof args.cfg === "number" && args.cfg > 0) workflow["3"].inputs.cfg = args.cfg;
  workflow["5"].inputs.width = width;
  workflow["5"].inputs.height = height;
  workflow["9"].inputs.filename_prefix = `scenepilotix/${prefix}`;

  const submit = await fetchJson<{ prompt_id: string }>(comfyEndpoint(status.baseUrl, "/prompt"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });
  const promptId = submit.prompt_id;
  const maxWaitMs = args.maxWaitMs ?? 120_000;
  const history = await waitForComfyHistory(status.baseUrl, promptId, maxWaitMs);
  const outputs = history.outputs ?? {};
  for (const nodeId of Object.keys(outputs)) {
    const images = outputs[nodeId]?.images;
    if (!Array.isArray(images) || images.length === 0) continue;
    const first = images[0];
    const blobUrl = assetEntryToViewUrl(status.baseUrl, first);
    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) continue;
    const blob = await blobResponse.blob();
    return {
      provider: "comfyui",
      prompt: args.prompt,
      seed,
      imageUrl: URL.createObjectURL(blob),
      width,
      height,
      baseUrl: status.baseUrl,
      promptId
    };
  }
  throw new Error("ComfyUI returned no images");
}

export async function runComfyUiVideoPreview(args: {
  prompt: string;
  anchorImageUrl: string;
  resolution: string;
  seed?: number;
  baseUrls?: string[];
  negativePrompt?: string;
  steps?: number;
  cfg?: number;
  fps?: number;
  frameCount?: number;
  prefix?: string;
  maxWaitMs?: number;
}): Promise<LocalVideoResult> {
  const status = await probeComfyUi(args.baseUrls);
  if (status.state !== "ready" || !status.baseUrl) {
    throw new Error(status.error ?? "ComfyUI unavailable");
  }
  const [diffusionModels, textEncoders, vaeModels] = await Promise.all([
    listComfyModelNames(status.baseUrl, "diffusion_models"),
    listComfyModelNames(status.baseUrl, "text_encoders"),
    listComfyModelNames(status.baseUrl, "vae")
  ]);
  if (!diffusionModels.includes("wan2.2_ti2v_5B_fp16.safetensors")) {
    throw new Error("Wan 2.2 diffusion model is missing");
  }
  if (!textEncoders.includes("umt5_xxl_fp8_e4m3fn_scaled.safetensors")) {
    throw new Error("Wan text encoder is missing");
  }
  if (!vaeModels.includes("wan2.2_vae.safetensors")) {
    throw new Error("Wan 2.2 VAE is missing");
  }

  const workflow = deepClone(WAN_VIDEO_WORKFLOW);
  const { width, height } = parseResolution(args.resolution);
  const seed = typeof args.seed === "number" ? args.seed : -1;
  const frameCount = Math.max(21, args.frameCount ?? 73);
  const fps = Math.max(8, args.fps ?? 12);
  const prefix = args.prefix ?? `scenepilotix_video_${Date.now()}_${Math.abs(seed)}`;
  const uploadName = await uploadComfyInputImage(status.baseUrl, args.anchorImageUrl, `${prefix}_anchor.png`);

  workflow["56"].inputs.image = uploadName;
  workflow["55"].inputs.width = width;
  workflow["55"].inputs.height = height;
  workflow["55"].inputs.length = frameCount;
  workflow["6"].inputs.text = args.prompt;
  workflow["7"].inputs.text = args.negativePrompt || WAN_VIDEO_WORKFLOW["7"].inputs.text;
  workflow["3"].inputs.seed = seed;
  if (typeof args.steps === "number" && args.steps > 0) workflow["3"].inputs.steps = args.steps;
  if (typeof args.cfg === "number" && args.cfg > 0) workflow["3"].inputs.cfg = args.cfg;
  workflow["57"].inputs.fps = fps;
  workflow["58"].inputs.filename_prefix = `video/${prefix}`;

  const submit = await fetchJson<{ prompt_id: string }>(comfyEndpoint(status.baseUrl, "/prompt"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow })
  });
  const promptId = submit.prompt_id;
  const history = await waitForComfyHistory(status.baseUrl, promptId, args.maxWaitMs ?? 300_000);
  const outputs = history.outputs ?? {};
  for (const nodeId of Object.keys(outputs)) {
    for (const assetKey of ["videos", "gifs"]) {
      const items = outputs[nodeId]?.[assetKey];
      if (!Array.isArray(items) || items.length === 0) continue;
      const first = items[0];
      const fetched = await fetchBlobObjectUrl(assetEntryToViewUrl(status.baseUrl, first));
      return {
        provider: "comfyui",
        prompt: args.prompt,
        seed,
        videoUrl: fetched.objectUrl,
        posterUrl: args.anchorImageUrl,
        width,
        height,
        fps,
        frameCount,
        baseUrl: status.baseUrl,
        promptId
      };
    }
  }
  throw new Error("ComfyUI returned no video assets");
}

export async function runDrawThingsTxt2Img(args: {
  prompt: string;
  resolution: string;
  seed?: number;
  baseUrls?: string[];
  negativePrompt?: string;
  steps?: number;
  guidanceScale?: number;
}): Promise<LocalImageResult> {
  const status = await probeDrawThings(args.baseUrls);
  if (status.state !== "ready" || !status.baseUrl) {
    throw new Error(status.error ?? "Draw Things HTTP API unavailable");
  }
  const { width, height } = parseResolution(args.resolution);
  const seed = typeof args.seed === "number" ? args.seed : -1;
  const payload = {
    prompt: args.prompt,
    negative_prompt: args.negativePrompt || DEFAULT_DRAW_NEGATIVE,
    seed,
    steps: args.steps ?? 20,
    guidance_scale: args.guidanceScale ?? 4,
    width,
    height,
    batch_count: 1
  };
  const txt2imgUrl = status.baseUrl.startsWith("/__localgen/draw")
    ? withDrawProxyPath("/sdapi/v1/txt2img")
    : `${status.baseUrl}/sdapi/v1/txt2img`;
  const response = await fetchJson<{ images?: string[] }>(txt2imgUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const first = Array.isArray(response.images) ? response.images[0] : "";
  if (!first) throw new Error("Draw Things returned no images");
  return {
    provider: "drawthings",
    prompt: args.prompt,
    seed,
    imageUrl: b64ToObjectUrl(first),
    width,
    height,
    baseUrl: status.baseUrl
  };
}

export function buildDrawThingsQueuePack(tasks: DrawThingsQueueTask[]): DrawThingsQueuePack {
  const generatedAt = new Date().toISOString();
  const queueJson = JSON.stringify({
    tool: "drawthings",
    generatedAt,
    seeds: [...new Set(tasks.map((task) => task.seed))],
    tasks
  }, null, 2);
  const csvHeader = "id,title,seed,resolution,outputFilename,prompt";
  const csvRows = tasks.map((task) =>
    [
      csvEscape(task.id),
      csvEscape(task.title),
      String(task.seed),
      csvEscape(task.resolution),
      csvEscape(`${task.id}__seed${task.seed}.png`),
      csvEscape(task.prompt)
    ].join(","));
  const tasksCsv = [csvHeader, ...csvRows].join("\n");
  const readme = [
    "ScenePilotix Draw Things local handoff",
    "",
    "1) Enable Draw Things API Server if you want direct HTTP generation.",
    "2) If HTTP is unavailable, use this CSV / JSON pack for manual batch execution.",
    "3) This pack is tuned for low-resolution structure checks first, not final quality.",
    "4) Keep model / sampler / steps fixed across variants when comparing structure results."
  ].join("\n");
  return {
    tool: "drawthings",
    generatedAt,
    tasks,
    queueJson,
    tasksCsv,
    readme
  };
}

function csvEscape(value: string): string {
  const safe = String(value ?? "");
  return `"${safe.replace(/"/g, "\"\"")}"`;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function defaultComfyUiBaseUrls(): string[] {
  return [...COMFY_DEFAULT_BASE_URLS];
}

export function defaultDrawThingsBaseUrls(): string[] {
  return [...DRAW_DEFAULT_BASE_URLS];
}
