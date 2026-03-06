import type { Lang } from "../i18n";
import type { MediaType } from "../model";

export function defaultProjectName(lang: Lang): string {
  return lang === "zh" ? "未命名项目" : "Untitled Project";
}

export function defaultImageSceneName(lang: Lang): string {
  return lang === "zh" ? "主画面" : "Main Frame";
}

export function defaultVideoSceneName(lang: Lang, index: number): string {
  const no = Math.max(1, Math.round(index || 1));
  return lang === "zh" ? `分镜 ${no}` : `Scene ${no}`;
}

export function defaultSceneName(lang: Lang, mediaType: MediaType, index: number): string {
  return mediaType === "image" ? defaultImageSceneName(lang) : defaultVideoSceneName(lang, index);
}

export function defaultObjectName(lang: Lang, index: number): string {
  const no = Math.max(1, Math.round(index || 1));
  return lang === "zh" ? `主体${no}` : `Subject ${no}`;
}

export function safeExportName(input: string): string {
  return (input ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);
}
