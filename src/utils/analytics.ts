import type { Lang } from "../i18n";
import { trackEvent as trackPostHogEvent } from "../services/posthog";
import { captureException } from "../services/sentry";

type Props = Record<string, any>;

const LS_DEVICE = "spx_device_id";
const LS_QUEUE = "spx_event_queue_v1";
const LS_OPTIN = "spx_telemetry_on"; // "1" = on, else off
const LS_SESSION = "spx_session_id";
const LS_API_BASE = "spx_telemetry_api_base";
let globalErrorHooksInstalled = false;

function randId(prefix: string) {
  // 简单够用：时间 + 随机
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateDeviceId(): string {
  try {
    const v = localStorage.getItem(LS_DEVICE);
    if (v) return v;
    const id = randId("d");
    localStorage.setItem(LS_DEVICE, id);
    return id;
  } catch {
    return randId("d");
  }
}

function getOrCreateSessionId(): string {
  try {
    const v = localStorage.getItem(LS_SESSION);
    if (v) return v;
    const id = randId("s");
    localStorage.setItem(LS_SESSION, id);
    return id;
  } catch {
    return randId("s");
  }
}

function getOptIn(): boolean {
  try {
    return localStorage.getItem(LS_OPTIN) === "1";
  } catch {
    return false;
  }
}

export function setTelemetryOptIn(on: boolean) {
  try {
    localStorage.setItem(LS_OPTIN, on ? "1" : "0");
  } catch {
    // Ignore storage write errors.
  }
}

export function isTelemetryOn(): boolean {
  return getOptIn();
}

function loadQueue(): any[] {
  try {
    const raw = localStorage.getItem(LS_QUEUE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveQueue(q: any[]) {
  try {
    localStorage.setItem(LS_QUEUE, JSON.stringify(q.slice(-500))); // 限制长度
  } catch {
    // Ignore storage write errors.
  }
}

function normalizeBase(base: string): string {
  const s = (base || "").trim();
  if (!s) return "";
  return s.replace(/\/+$/, "");
}

function readApiBaseOverride(): string {
  try {
    return normalizeBase(localStorage.getItem(LS_API_BASE) || "");
  } catch {
    return "";
  }
}

export function setTelemetryApiBase(base: string) {
  try {
    const s = normalizeBase(base);
    if (!s) localStorage.removeItem(LS_API_BASE);
    else localStorage.setItem(LS_API_BASE, s);
  } catch {
    // Ignore storage write errors.
  }
}

function apiBases(): string[] {
  const fromOverride = readApiBaseOverride();
  const fromEnv = normalizeBase(String((import.meta as any).env?.VITE_TELEMETRY_BASE_URL || ""));
  const sameOrigin = "";

  // 优先级：
  // 1) 本地 override
  // 2) 构建环境变量
  // 3) 同源
  const seq = [fromOverride, fromEnv, sameOrigin];
  const out: string[] = [];
  for (const b of seq) {
    if (out.includes(b)) continue;
    out.push(b);
  }
  return out;
}

function endpoint(base: string, path: string): string {
  return base ? `${base}${path}` : path;
}

async function postWithFallback(path: string, payload: unknown): Promise<boolean> {
  // 在本地开发环境中跳过 API 调用，避免 404 错误
  if (import.meta.env?.DEV) {
    console.log('Analytics API call skipped in dev mode:', path, payload);
    return true;
  }
  
  const bases = apiBases();
  for (const base of bases) {
    try {
      const r = await fetch(endpoint(base, path), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (r.ok) return true;
    } catch {
      // Try next base.
    }
  }
  return false;
}

export function getTelemetryIds() {
  const device_id = getOrCreateDeviceId();
  const session_id = getOrCreateSessionId();
  return { device_id, session_id };
}

export function newSession() {
  try {
    const id = randId("s");
    localStorage.setItem(LS_SESSION, id);
    return id;
  } catch {
    return randId("s");
  }
}

export function track(event: string, props: Props = {}, lang?: Lang) {
  if (!getOptIn()) return;

  const { device_id, session_id } = getTelemetryIds();
  const ts = Date.now();

  const item = {
    ts,
    device_id,
    session_id,
    event,
    props,
    lang: lang || ""
  };

  const q = loadQueue();
  q.push(item);
  saveQueue(q);

  trackPostHogEvent(event, {
    ...props,
    lang: lang || "",
    device_id,
    session_id,
    ts,
  });

  // 轻量：有网就尝试发一次（失败继续留队列）
  void flush();
}

export async function flush() {
  if (!getOptIn()) return;

  const q = loadQueue();
  if (!q.length) return;

  // 一次最多发 30 条
  const batch = q.slice(0, 30);

  try {
    // 逐条上报：简单可靠，失败也容易处理（早期别追求批量复杂度）
    for (const it of batch) {
      const ok = await postWithFallback("/api/collect", it);
      if (!ok) throw new Error("collect_failed");
    }

    // 成功就从队列移除
    const rest = q.slice(batch.length);
    saveQueue(rest);
  } catch {
    // 不清队列，等下次 flush
  }
}

export async function sendFeedback(message: string, meta: Props = {}, lang?: Lang) {
  const { device_id, session_id } = getTelemetryIds();
  const payload = {
    ts: Date.now(),
    device_id,
    session_id,
    message,
    meta: { ...meta, lang: lang || "", telemetry_opt_in: getOptIn() }
  };

  try {
    return await postWithFallback("/api/feedback", payload);
  } catch {
    return false;
  }
}

export function installGlobalErrorHooks(lang?: Lang) {
  if (globalErrorHooksInstalled) return;
  globalErrorHooksInstalled = true;

  window.addEventListener("error", (e) => {
    const meta = {
      kind: "error",
      message: String((e as any)?.message || ""),
      filename: String((e as any)?.filename || ""),
      lineno: Number((e as any)?.lineno || 0),
      colno: Number((e as any)?.colno || 0)
    };
    captureException(new Error(meta.message || "window_error"), meta);
    if (!getOptIn()) return;
    track(
      "error",
      meta,
      lang
    );
  });

  window.addEventListener("unhandledrejection", (e) => {
    const meta = {
      kind: "unhandledrejection",
      reason: String((e as any)?.reason || "")
    };
    captureException(new Error(meta.reason || "unhandled_promise_rejection"), meta);
    if (!getOptIn()) return;
    track(
      "error",
      meta,
      lang
    );
  });
}
