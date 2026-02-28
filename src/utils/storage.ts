import type { Lang } from "../i18n";
import type { Project } from "../model";

const KEY_PROJECT = "scenepilot_project";
const KEY_LANG = "scenepilot_lang";

/**
 * Language
 */
export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY_LANG);
    if (saved === "zh" || saved === "en") return saved;

    const nav = (navigator.language || "").toLowerCase();
    return nav.startsWith("zh") ? "zh" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(KEY_LANG, lang);
  } catch {
    // ignore
  }
}

/**
 * Project
 */
export function loadProject(): Project | null {
  try {
    const raw = localStorage.getItem(KEY_PROJECT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray((parsed as any).scenes)) return null;
    return parsed as Project;
  } catch {
    return null;
  }
}

export function saveProject(project: Project) {
  try {
    localStorage.setItem(KEY_PROJECT, JSON.stringify(project));
  } catch {
    // ignore
  }
}