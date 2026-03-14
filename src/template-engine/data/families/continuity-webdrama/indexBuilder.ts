/**
 * Build TemplateIndex[] for 100 webdrama continuity templates.
 */

import type { TemplateIndex } from "../../../types/templateIndex";
import type { TemplateDomain } from "../../../types/templateTypes";
import {
  WEBDRAMA_FAMILIES,
  WEBDRAMA_VARIANTS,
  WEBDRAMA_VARIANT_LABELS
} from "./families";

function continuityCost(variant: string): number {
  if (variant === "starter") return 0;
  return 5;
}

export function buildWebdramaIndex(): TemplateIndex[] {
  const out: TemplateIndex[] = [];
  for (const family of WEBDRAMA_FAMILIES) {
    for (const variant of WEBDRAMA_VARIANTS) {
      const id = `tpl600_webdrama_${family.id}_${variant}`;
      const vLabels = WEBDRAMA_VARIANT_LABELS[variant];
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
        domain: "webdrama_continuity" as TemplateDomain,
        descriptionEn: `Web drama continuity template: ${family.nameEn}, ${vLabels.en} variant.`,
        descriptionZh: `网剧连续模板：${family.nameZh}，${vLabels.zh}变体。`,
        tags: ["webdrama", "网剧", "continuity", family.id, variant, "video"],
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
