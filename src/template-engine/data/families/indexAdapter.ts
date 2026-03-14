/**
 * Build TemplateIndex[] from templateLibrary400.
 */

import type { TemplateIndex } from "../../types/templateIndex";
import type { TemplateVariant, TemplateCategory } from "../../types/templateTypes";
import { getTemplateLibrary400 } from "../../../data/templateLibrary400";

function parseFamilyAndVariantFromId(id: string): { familyId: string; variant: string } | null {
  const match = id.match(/^tpl400_(.+)_([a-z0-9_]+)$/);
  if (!match) return null;
  return { familyId: match[1], variant: match[2] };
}

export function buildTemplateIndexFrom400(): TemplateIndex[] {
  const items = getTemplateLibrary400();
  return items.map((t: import("../../../types/templateWorkspace").UnifiedTemplate) => {
    const parsed = parseFamilyAndVariantFromId(t.id);
    const familyId = parsed?.familyId ?? t.family;
    return {
      id: t.id,
      familyId,
      familyNameEn: t.family,
      familyNameZh: t.familyZh ?? t.family,
      variantId: t.variant,
      nameZh: t.nameZh ?? t.name,
      nameEn: t.name,
      category: t.category as TemplateCategory,
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
      variant: (parsed?.variant ?? t.variant) as TemplateVariant
    };
  });
}
