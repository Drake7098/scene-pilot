import type { CheckoutResult } from "../types/billing";
import { BILLING_LIVE_BLOCKED, BILLING_MODE } from "../config/billingFlags";

declare global {
  interface Window {
    Paddle?: {
      Environment?: {
        set: (env: "sandbox" | "production") => void;
      };
      Initialize: (input: { token: string }) => void;
      Checkout: {
        open: (input: Record<string, unknown>) => void;
      };
    };
    __SCENEPILOT_LAST_PADDLE_CHECKOUT__?: Record<string, unknown>;
  }
}

const PADDLE_JS_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";

let paddleReady: Promise<boolean> | null = null;

function paddleToken() {
  return (import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined)?.trim() || "";
}

function paddleEnv() {
  if (BILLING_LIVE_BLOCKED) return "sandbox";
  return BILLING_MODE === "live" ? "production" : "sandbox";
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Paddle) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Paddle)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = PADDLE_JS_URL;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Paddle));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export async function initializePaddleClient() {
  const token = paddleToken();
  if (!token && typeof window !== "undefined" && window.Paddle) return true;
  if (!token) return false;
  if (!paddleReady) {
    paddleReady = loadScript().then((ok) => {
      if (!ok || !window.Paddle) return false;
      if (window.Paddle.Environment?.set) {
        window.Paddle.Environment.set(paddleEnv());
      }
      window.Paddle.Initialize({ token });
      return true;
    });
  }
  return paddleReady;
}

export function canUsePaddleClient() {
  if (BILLING_LIVE_BLOCKED) return false;
  return Boolean(paddleToken() || (typeof window !== "undefined" && window.Paddle));
}

export async function openPaddleCheckout(result: CheckoutResult) {
  const ready = await initializePaddleClient();
  if (!ready || !window.Paddle) return false;
  const payload: Record<string, unknown> = {
    items: result.items,
    customer: result.customer,
    customData: result.customData,
    successUrl: result.successUrl,
    cancelUrl: result.cancelUrl
  };
  window.__SCENEPILOT_LAST_PADDLE_CHECKOUT__ = payload;
  window.Paddle.Checkout.open(payload);
  return true;
}
