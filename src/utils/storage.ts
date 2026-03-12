import type { Lang } from "../i18n";
import type { Project } from "../model";

const KEY_PROJECT = "scenepilot_project";
const KEY_LANG = "scenepilot_lang";

function detectSystemLang(): Lang {
  try {
    if (typeof navigator === "undefined") return "en";
    const primary = typeof navigator.language === "string" ? navigator.language : "";
    const list = Array.isArray(navigator.languages) ? navigator.languages : [];
    const tags = [primary, ...list]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);
    const hasZh = tags.some((tag) => tag.startsWith("zh"));
    return hasZh ? "zh" : "en";
  } catch {
    return "en";
  }
}

/**
 * Language
 */
export function loadLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY_LANG);
    if (saved === "zh" || saved === "en") return saved;
    return detectSystemLang();
  } catch {
    return detectSystemLang();
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
