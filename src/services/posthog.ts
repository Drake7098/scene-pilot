/**
 * PostHog 前端 Product Analytics 接入
 * 最小化实现：基础埋点 + autocapture
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
    
    // 基础配置
    autocapture: true, // 自动捕获点击、表单提交等
    capture_pageview: true, // 自动捕获页面浏览
    
    // 不开启 Replay
    disable_session_recording: true,
    
    // Person profiles 稳妥设置
    person_profiles: "identified_only", // 仅对已识别用户创建 profile
    
    // 开发环境配置
    loaded: (posthogInstance) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[PostHog] Loaded");
        // 开发环境可选：禁用上报
        // posthogInstance.opt_out_capturing();
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

export function isPostHogInitialized(): boolean {
  return initialized;
}
