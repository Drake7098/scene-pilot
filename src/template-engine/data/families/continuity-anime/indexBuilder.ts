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

const HIGH_INTENT_ANIME_FAMILY_IDS = new Set([
  "daily_dialogue_anime",
  "protagonist_entrance_anime",
  "skill_release_anime",
  "battle_standoff_anime"
]);

function continuityCost(variant: string): number {
  if (variant === "starter") return 0;
  return 5;
}

export function buildAnimeIndex(): TemplateIndex[] {
  const out: TemplateIndex[] = [];
  for (const family of ANIME_FAMILIES) {
    if (!HIGH_INTENT_ANIME_FAMILY_IDS.has(family.id)) continue;
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
