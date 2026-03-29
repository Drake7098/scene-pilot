/**
 * Sentry 前端错误监控接入
 * 最小化实现：仅初始化 + 基础错误捕获
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = String(import.meta.env.VITE_SENTRY_DSN || "").trim();

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Sentry] DSN not configured, skipping initialization");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || "production",
    release: import.meta.env.VITE_APP_VERSION || undefined,

    // 基础采样配置（极简）
    tracesSampleRate: 0.0, // 暂不开启 Performance
    replaysSessionSampleRate: 0.0, // 暂不开启 Replay
    replaysOnErrorSampleRate: 0.0,

    // 只上报生产环境错误
    beforeSend(event) {
      if (import.meta.env.DEV) {
        // 开发环境打印但不实际上报
        // eslint-disable-next-line no-console
        console.log("[Sentry] Event captured (dev mode, not sent):", event);
        return null;
      }
      return event;
    },
  });

  initialized = true;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Sentry] Initialized");
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized || !SENTRY_DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function setSentryUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!initialized || !SENTRY_DSN) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, username: user.username });
  } else {
    Sentry.setUser(null);
  }
}

export function setSentryTags(tags: Record<string, string | null | undefined>): void {
  if (!initialized || !SENTRY_DSN) return;
  Object.entries(tags).forEach(([key, value]) => {
    if (value == null || value === "") return;
    Sentry.setTag(key, String(value));
  });
}

export function isSentryInitialized(): boolean {
  return initialized;
}
