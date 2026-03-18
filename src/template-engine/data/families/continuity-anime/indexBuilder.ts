/**
 * Build TemplateIndex[] for 100 anime continuity templates.
 */

import type { TemplateIndex } from "../../../types/templateIndex";
import type { TemplateDomain } from "../../../types/templateTypes";
import {
  ANIME_FAMILIES,
  ANIME_VARIANTS,
  ANIME_VARIANT_LABELS
} from "./families";

function continuityCost(variant: string): number {
  if (variant === "starter") return 0;
  return 5;
}

export function buildAnimeIndex(): TemplateIndex[] {
  const out: TemplateIndex[] = [];
  for (const family of ANIME_FAMILIES) {
    for (const variant of ANIME_VARIANTS) {
      const id = `tpl600_anime_${family.id}_${variant}`;
      const vLabels = ANIME_VARIANT_LABELS[variant];
      const isFree = variant === "starter";
      out.push({
        id,
        familyId: family.id,
        familyNameEn: family.nameEn,
        familyNameZh: family.nameZh,
        variantId: variant,
        nameEn: `${family.nameEn} / ${vLabels.en}`,
        nameZh: `${family.nameZh}｜${vLabels.zh}`,
        category: "continuous",
        domain: "anime_continuity" as TemplateDomain,
        industry: "anime",
        descriptionEn: `Anime continuity template: ${family.nameEn}, ${vLabels.en} variant.`,
        descriptionZh: `动漫连续模板：${family.nameZh}，${vLabels.zh}变体。`,
        tags: ["anime", "动漫", "continuity", family.id, variant, "video"],
        mediaType: "video",
        storyPlan: "continuous",
        ratio: "16:9",
        isFree,
        cost: continuityCost(variant),
        featured: isFree
      });
    }
  }
  return out;
}
