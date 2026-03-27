import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";

function safeSlug(input: string): string {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return "template";
  return raw
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64) || "template";
}

export function buildTemplateSlug(template: TemplateIndex): string {
  const name = (template.nameEn || template.nameZh || template.id || "template").trim();
  const base = safeSlug(name);
  return `${base}-${template.id}`;
}

export function buildTemplatePath(template: TemplateIndex): string {
  return `/template/${buildTemplateSlug(template)}`;
}

export function findTemplateBySlug(items: TemplateIndex[], slug: string): TemplateIndex | null {
  const normalized = (slug || "").trim().toLowerCase();
  if (!normalized) return null;

  const byExact = items.find((item) => buildTemplateSlug(item).toLowerCase() === normalized);
  if (byExact) return byExact;

  const suffixHit = normalized.match(/-([a-z0-9_]+)$/i)?.[1];
  if (suffixHit) {
    const byId = items.find((item) => String(item.id).toLowerCase() === suffixHit.toLowerCase());
    if (byId) return byId;
  }

  return items.find((item) => safeSlug(item.nameEn || item.nameZh || item.id).toLowerCase() === normalized) ?? null;
}

export function buildTemplateShareText(template: TemplateIndex, lang: Lang): string {
  if (lang === "zh") {
    return `这个模板适合做 ${template.nameZh || template.nameEn}，替换主体和参考图就能直接使用。`;
  }
  return `This template is great for ${template.nameEn || template.nameZh}. Replace subject and reference image, then use directly.`;
}

export async function shareTemplateLink(template: TemplateIndex, lang: Lang): Promise<"shared" | "copied" | "none"> {
  if (typeof window === "undefined") return "none";
  const url = `${window.location.origin}${buildTemplatePath(template)}`;
  const title = lang === "zh" ? template.nameZh : template.nameEn;
  const text = buildTemplateShareText(template, lang);

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      // fallthrough to copy
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "none";
  }
}

export async function copyTemplateLink(template: TemplateIndex): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const url = `${window.location.origin}${buildTemplatePath(template)}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
