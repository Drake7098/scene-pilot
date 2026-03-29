/**
 * PostHog 前端 Product Analytics 接入
 * 早期运营最小化：仅保留显式漏斗事件，不启用自动捕获或录屏
 */

import posthog from "posthog-js";

const POSTHOG_KEY = String(import.meta.env.VITE_POSTHOG_KEY || "").trim();
const POSTHOG_HOST = String(import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com").trim();

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (!POSTHOG_KEY) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[PostHog] Key not configured, skipping initialization");
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    opt_out_capturing_by_default: true,

    // 早期运营只保留核心漏斗与页面访问，避免噪音
    autocapture: false,
    capture_pageview: true,

    // 不开启 Replay / 性能采样
    disable_session_recording: true,
    person_profiles: "identified_only",

    loaded: (posthogInstance) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[PostHog] Loaded");
      }
    },
  });

  initialized = true;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[PostHog] Initialized");
  }
}

export function getPostHog() {
  return initialized ? posthog : null;
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!initialized || !POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

export function resetUser(): void {
  if (!initialized || !POSTHOG_KEY) return;
  posthog.reset();
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (!initialized || !POSTHOG_KEY) return;
  posthog.capture(eventName, properties);
}

export function setPostHogEnabled(enabled: boolean): void {
  if (!initialized || !POSTHOG_KEY) return;
  if (enabled) posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
}

export function isPostHogInitialized(): boolean {
  return initialized;
}
