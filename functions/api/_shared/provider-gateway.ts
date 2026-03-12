export type ProviderId = "fal" | "runway";
export type ProviderMode = "platform" | "personal";
export type ProviderMediaType = "image" | "video";

export type ProviderSubmitBody = {
  userId?: string;
  provider?: ProviderId;
  mode?: ProviderMode;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  prompt?: string;
  mediaType?: ProviderMediaType;
  ratio?: string;
  promptImage?: string;
  duration?: number;
  webhookUrl?: string;
};

export type ProviderGatewayResult = {
  ok: boolean;
  provider: ProviderId;
  mode: ProviderMode;
  mediaType: ProviderMediaType;
  taskId?: string;
  status?: string;
  output?: unknown;
  raw?: unknown;
  error?: string;
};

const RUNWAY_VERSION = "2024-11-06";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveProviderMode(input: ProviderSubmitBody): ProviderMode {
  return input.mode === "personal" ? "personal" : "platform";
}

function resolveProvider(input: ProviderSubmitBody): ProviderId {
  return input.provider === "runway" ? "runway" : "fal";
}

function resolveApiKey(env: any, provider: ProviderId, mode: ProviderMode, body: ProviderSubmitBody) {
  if (mode === "personal") return body.apiKey?.trim() || "";
  if (provider === "fal") return String(env?.FAL_KEY || "").trim();
  return String(env?.RUNWAY_API_KEY || "").trim();
}

function resolveBaseUrl(provider: ProviderId, body: ProviderSubmitBody) {
  if (isNonEmptyString(body.baseUrl)) return body.baseUrl.trim().replace(/\/+$/, "");
  return provider === "fal" ? "https://queue.fal.run" : "https://api.dev.runwayml.com";
}

function privateIpV4(host: string) {
  const parts = host.split(".").map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => !Number.isInteger(item) || item < 0 || item > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function disallowedHost(host: string) {
  const normalized = host.toLowerCase().trim();
  if (!normalized) return true;
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;
  if (normalized.endsWith(".local")) return true;
  if (normalized.includes(":")) return true;
  if (privateIpV4(normalized)) return true;
  return false;
}

function parseHostAllowlist(env: any, provider: ProviderId) {
  const raw = String(
    provider === "fal"
      ? (env?.FAL_BASE_URL_ALLOWLIST || "queue.fal.run,fal.run")
      : (env?.RUNWAY_BASE_URL_ALLOWLIST || "api.dev.runwayml.com")
  ).trim();
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function hostMatchesAllowlist(host: string, allowlist: string[]) {
  const normalized = host.toLowerCase();
  return allowlist.some((allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`));
}

function resolveSafeBaseUrl(env: any, provider: ProviderId, mode: ProviderMode, body: ProviderSubmitBody) {
  const fallback = provider === "fal" ? "https://queue.fal.run" : "https://api.dev.runwayml.com";
  const candidate = mode === "platform" ? fallback : resolveBaseUrl(provider, body);
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false as const, error: "invalid_base_url" };
  }
  if (parsed.protocol !== "https:") return { ok: false as const, error: "https_required" };
  if (disallowedHost(parsed.hostname)) return { ok: false as const, error: "disallowed_base_host" };
  const allowlist = parseHostAllowlist(env, provider);
  if (!hostMatchesAllowlist(parsed.hostname, allowlist)) return { ok: false as const, error: "base_host_not_allowlisted" };
  return { ok: true as const, baseUrl: `${parsed.protocol}//${parsed.host}` };
}

export function availableProviders(env: any) {
  return {
    fal: {
      provider: "fal" as const,
      platformConfigured: isNonEmptyString(env?.FAL_KEY),
      defaultBaseUrl: "https://queue.fal.run",
      recommendedModels: ["fal-ai/flux/dev", "fal-ai/flux/schnell", "fal-ai/longcat-video/distilled/text-to-video/480p"]
    },
    runway: {
      provider: "runway" as const,
      platformConfigured: isNonEmptyString(env?.RUNWAY_API_KEY),
      defaultBaseUrl: "https://api.dev.runwayml.com",
      recommendedModels: ["gen4_image_turbo", "gen4_turbo", "veo3.1"]
    }
  };
}

export async function submitGeneration(env: any, body: ProviderSubmitBody): Promise<ProviderGatewayResult> {
  const provider = resolveProvider(body);
  const mode = resolveProviderMode(body);
  const mediaType = body.mediaType === "video" ? "video" : "image";
  const safeBase = resolveSafeBaseUrl(env, provider, mode, body);
  if (!safeBase.ok) return { ok: false, provider, mode, mediaType, error: safeBase.error };
  const apiKey = resolveApiKey(env, provider, mode, body);
  if (!apiKey) {
    return { ok: false, provider, mode, mediaType, error: "provider_not_configured" };
  }
  if (!isNonEmptyString(body.prompt)) {
    return { ok: false, provider, mode, mediaType, error: "missing_prompt" };
  }
  return provider === "fal"
    ? submitFal(body, apiKey, mode, mediaType, safeBase.baseUrl)
    : submitRunway(body, apiKey, mode, mediaType, safeBase.baseUrl);
}

export async function getGenerationStatus(env: any, body: ProviderSubmitBody & { taskId?: string }) {
  const provider = resolveProvider(body);
  const mode = resolveProviderMode(body);
  const mediaType = body.mediaType === "video" ? "video" : "image";
  const safeBase = resolveSafeBaseUrl(env, provider, mode, body);
  if (!safeBase.ok) return { ok: false, provider, mode, mediaType, error: safeBase.error } as ProviderGatewayResult;
  const apiKey = resolveApiKey(env, provider, mode, body);
  if (!apiKey) {
    return { ok: false, provider, mode, mediaType, error: "provider_not_configured" } as ProviderGatewayResult;
  }
  if (!isNonEmptyString(body.taskId)) {
    return { ok: false, provider, mode, mediaType, error: "missing_task_id" } as ProviderGatewayResult;
  }
  return provider === "fal"
    ? fetchFalStatus(body, apiKey, mode, mediaType, safeBase.baseUrl)
    : fetchRunwayStatus(body, apiKey, mode, mediaType, safeBase.baseUrl);
}

async function submitFal(body: ProviderSubmitBody, apiKey: string, mode: ProviderMode, mediaType: ProviderMediaType, baseUrl: string): Promise<ProviderGatewayResult> {
  const model = isNonEmptyString(body.model)
    ? body.model.trim()
    : mediaType === "video"
      ? "fal-ai/longcat-video/distilled/text-to-video/480p"
      : "fal-ai/flux/dev";
  const url = `${baseUrl}/${model}${isNonEmptyString(body.webhookUrl) ? `?fal_webhook=${encodeURIComponent(body.webhookUrl.trim())}` : ""}`;
  const payload: Record<string, unknown> = { prompt: body.prompt?.trim() };
  if (isNonEmptyString(body.promptImage)) payload.image_url = body.promptImage.trim();
  if (isNonEmptyString(body.ratio)) payload.image_size = body.ratio.trim();
  if (typeof body.duration === "number" && Number.isFinite(body.duration)) payload.duration = body.duration;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const raw = await safeJson(res);
  if (!res.ok) {
    return { ok: false, provider: "fal", mode, mediaType, error: String(raw?.error || raw?.detail || `fal_submit_${res.status}`), raw };
  }
  return {
    ok: true,
    provider: "fal",
    mode,
    mediaType,
    taskId: String(raw?.request_id || raw?.requestId || ""),
    status: String(raw?.status || "queued"),
    raw
  };
}

async function fetchFalStatus(body: ProviderSubmitBody & { taskId?: string }, apiKey: string, mode: ProviderMode, mediaType: ProviderMediaType, baseUrl: string): Promise<ProviderGatewayResult> {
  const model = isNonEmptyString(body.model)
    ? body.model.trim()
    : mediaType === "video"
      ? "fal-ai/longcat-video/distilled/text-to-video/480p"
      : "fal-ai/flux/dev";
  const url = `${baseUrl}/${model}/requests/${body.taskId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Key ${apiKey}`
    }
  });
  const raw = await safeJson(res);
  if (!res.ok) {
    return { ok: false, provider: "fal", mode, mediaType, taskId: body.taskId, error: String(raw?.error || raw?.detail || `fal_status_${res.status}`), raw };
  }
  return {
    ok: true,
    provider: "fal",
    mode,
    mediaType,
    taskId: String(body.taskId || ""),
    status: String(raw?.status || "completed"),
    output: raw,
    raw
  };
}

async function submitRunway(body: ProviderSubmitBody, apiKey: string, mode: ProviderMode, mediaType: ProviderMediaType, baseUrl: string): Promise<ProviderGatewayResult> {
  const model = isNonEmptyString(body.model)
    ? body.model.trim()
    : mediaType === "video"
      ? "gen4_turbo"
      : "gen4_image_turbo";
  const endpoint = mediaType === "video"
    ? (isNonEmptyString(body.promptImage) ? "/v1/image_to_video" : "/v1/text_to_video")
    : "/v1/text_to_image";
  const payload: Record<string, unknown> = { model };
  if (mediaType === "video") {
    if (isNonEmptyString(body.promptImage)) payload.promptImage = body.promptImage.trim();
    else payload.promptText = body.prompt?.trim();
    payload.ratio = isNonEmptyString(body.ratio) ? body.ratio.trim() : "1280:720";
    if (typeof body.duration === "number" && Number.isFinite(body.duration)) payload.duration = body.duration;
  } else {
    payload.promptText = body.prompt?.trim();
    payload.ratio = isNonEmptyString(body.ratio) ? body.ratio.trim() : "1024:1024";
  }
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_VERSION
    },
    body: JSON.stringify(payload)
  });
  const raw = await safeJson(res);
  if (!res.ok) {
    return { ok: false, provider: "runway", mode, mediaType, error: String(raw?.error || raw?.message || `runway_submit_${res.status}`), raw };
  }
  return {
    ok: true,
    provider: "runway",
    mode,
    mediaType,
    taskId: String(raw?.id || ""),
    status: "submitted",
    raw
  };
}

async function fetchRunwayStatus(body: ProviderSubmitBody & { taskId?: string }, apiKey: string, mode: ProviderMode, mediaType: ProviderMediaType, baseUrl: string): Promise<ProviderGatewayResult> {
  const res = await fetch(`${baseUrl}/v1/tasks/${body.taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": RUNWAY_VERSION
    }
  });
  const raw = await safeJson(res);
  if (!res.ok) {
    return { ok: false, provider: "runway", mode, mediaType, taskId: body.taskId, error: String(raw?.error || raw?.message || `runway_status_${res.status}`), raw };
  }
  return {
    ok: true,
    provider: "runway",
    mode,
    mediaType,
    taskId: String(body.taskId || ""),
    status: String(raw?.status || ""),
    output: raw?.output,
    raw
  };
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
