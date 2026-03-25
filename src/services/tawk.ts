/**
 * Tawk.to Live Chat 客服脚本接入
 * 最小化实现：动态加载脚本
 */

const TAWK_SRC = String(import.meta.env.VITE_TAWK_SRC || "").trim();

let initialized = false;
let scriptElement: HTMLScriptElement | null = null;

export function initTawk(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!TAWK_SRC) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Tawk] SRC not configured, skipping initialization");
    }
    return;
  }

  // 防止重复注入
  const existingScript = document.querySelector(`script[src="${TAWK_SRC}"]`);
  if (existingScript) {
    initialized = true;
    return;
  }

  // 创建 script 元素
  scriptElement = document.createElement("script");
  scriptElement.src = TAWK_SRC;
  scriptElement.async = true;
  scriptElement.charset = "UTF-8";
  scriptElement.setAttribute("crossorigin", "*");

  // 加载完成回调
  scriptElement.onload = () => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[Tawk] Script loaded");
    }
  };

  // 加载失败回调
  scriptElement.onerror = () => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[Tawk] Script failed to load");
    }
  };

  // 添加到 document
  document.head.appendChild(scriptElement);
  initialized = true;

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[Tawk] Initialized");
  }
}

export function isTawkInitialized(): boolean {
  return initialized;
}

export function destroyTawk(): void {
  if (scriptElement && scriptElement.parentNode) {
    scriptElement.parentNode.removeChild(scriptElement);
    scriptElement = null;
  }
  initialized = false;
}
