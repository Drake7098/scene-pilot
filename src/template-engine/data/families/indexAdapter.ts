/**
 * Build TemplateIndex[] from templateLibrary400.
 * Maps category → industry for user-facing filtering.
 */

import type { TemplateIndex } from "../../types/templateIndex";
import type { TemplateVariant, TemplateCategory, TemplateIndustry } from "../../types/templateTypes";
import { getTemplateLibrary400 } from "../../../data/templateLibrary400";

const KNOWN_VARIANTS = [
  "free_starter",
  "vertical_9_16",
  "horizontal_16_9",
  "cinematic",
  "multi_object",
  "advanced_motion",
  // continuity 系列
  "starter",
  "basic",
  "basic_wide",
  "basic_medium",
  "basic_close",
  "vertical",
  "advanced",
];

function parseFamilyAndVariantFromId(id: string): { familyId: string; variant: string } | null {
  const prefix = "tpl400_";
  if (!id.startsWith(prefix)) return null;
  const rest = id.slice(prefix.length);

  // 按长度降序匹配，避免 "basic" 误匹配 "basic_wide" 的情况
  const sorted = [...KNOWN_VARIANTS].sort((a, b) => b.length - a.length);
  for (const variant of sorted) {
    if (rest.endsWith(`_${variant}`)) {
      return {
        familyId: rest.slice(0, rest.length - variant.length - 1),
        variant
      };
    }
  }

  // 兜底
  const match = rest.match(/^(.+)_([a-z0-9]+)$/);
  if (!match) return null;
  return { familyId: match[1], variant: match[2] };
}

/**
 * Infer industry from category for base templates.
 * These are best-effort mappings; templates can override explicitly.
 */
function inferIndustry(category: TemplateCategory): TemplateIndustry | undefined {
  const map: Partial<Record<TemplateCategory, TemplateIndustry>> = {
    ad:           "ad",
    product:      "ecommerce",
    social:       "social",
    short_video:  "social",
    cover_poster: "social",
    continuous:   "drama",
    dialogue:     "drama",
    composition:  undefined,
    camera_move:  undefined,
  };
  return map[category];
}

export function buildTemplateIndexFrom400(): TemplateIndex[] {
  const items = getTemplateLibrary400();
  return items.map((t: import("../../../types/templateWorkspace").UnifiedTemplate) => {
    const parsed = parseFamilyAndVariantFromId(t.id);
    const familyId = parsed?.familyId ?? t.family;
    const category = t.category as TemplateCategory;
    return {
      id: t.id,
      familyId,
      familyNameEn: t.family,
      familyNameZh: t.familyZh ?? t.family,
      variantId: t.variant,
      nameZh: t.nameZh ?? t.name,
      nameEn: t.name,
      category,
      descriptionZh: t.descriptionZh,
      descriptionEn: t.description,
      tags: t.tags ?? [],
      mediaType: t.mediaType,
      storyPlan: t.storyPlan,
      ratio: t.ratio,
      isFree: t.isFree,
      cost: t.cost ?? 0,
      featured: t.isFeatured ?? false,
      preview: t.preview,
      domain: "base" as const,
      industry: inferIndustry(category),
      variant: (parsed?.variant ?? t.variant) as TemplateVariant
    };
  });
}
