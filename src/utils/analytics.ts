import type { Lang } from "../i18n";

type Props = Record<string, any>;

const LS_DEVICE = "spx_device_id";
const LS_QUEUE = "spx_event_queue_v1";
const LS_OPTIN = "spx_telemetry_on"; // "1" = on, else off
const LS_SESSION = "spx_session_id";

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
  } catch {}
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
  } catch {}
}

function apiBase(): string {
  // 你把 Worker 绑定到域名后，最好同域：/api/collect
  // 如果你先用 workers.dev 的 URL，可把它写成完整 URL
  return "";
}

function endpoint(path: string): string {
  const base = apiBase();
  return base ? `${base}${path}` : path;
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
      const r = await fetch(endpoint("/api/collect"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(it),
        keepalive: true
      });
      if (!r.ok) throw new Error(`collect_failed_${r.status}`);
    }

    // 成功就从队列移除
    const rest = q.slice(batch.length);
    saveQueue(rest);
  } catch {
    // 不清队列，等下次 flush
  }
}

export async function sendFeedback(message: string, meta: Props = {}, lang?: Lang) {
  if (!getOptIn()) return false;

  const { device_id, session_id } = getTelemetryIds();
  const payload = {
    ts: Date.now(),
    device_id,
    session_id,
    message,
    meta: { ...meta, lang: lang || "" }
  };

  try {
    const r = await fetch(endpoint("/api/feedback"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function installGlobalErrorHooks(lang?: Lang) {
  if (!getOptIn()) return;

  window.addEventListener("error", (e) => {
    track(
      "error",
      {
        kind: "error",
        message: String((e as any)?.message || ""),
        filename: String((e as any)?.filename || ""),
        lineno: Number((e as any)?.lineno || 0),
        colno: Number((e as any)?.colno || 0)
      },
      lang
    );
  });

  window.addEventListener("unhandledrejection", (e) => {
    track(
      "error",
      {
        kind: "unhandledrejection",
        reason: String((e as any)?.reason || "")
      },
      lang
    );
  });
}