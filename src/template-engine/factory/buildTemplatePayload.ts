/**
 * Build full TemplatePayload from family base + variant patch.
 */

import type { TemplateVariant } from "../types/templateTypes";
import type { TemplatePayload } from "../types/templatePayload";
import { getFamilyBase } from "../registry/familyBases";
import { getVariantPatch } from "../registry/variantPatches";

function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out = { ...base } as T;
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[k];
    if (pv === undefined) continue;
    const bv = base[k];
    if (
      bv !== null &&
      bv !== undefined &&
      typeof bv === "object" &&
      !Array.isArray(bv) &&
      pv !== null &&
      typeof pv === "object" &&
      !Array.isArray(pv)
    ) {
      (out as Record<string, unknown>)[k as string] = deepMerge(
        bv as Record<string, unknown>,
        pv as Record<string, unknown>
      );
    } else {
      (out as Record<string, unknown>)[k as string] = pv;
    }
  }
  return out;
}

export async function buildTemplatePayload(
  familyId: string,
  variant: TemplateVariant
): Promise<TemplatePayload> {
  const base = getFamilyBase(familyId);
  const patch = getVariantPatch(familyId, variant);

  if (base) {
    const merged = patch ? deepMerge(base, patch) : { ...base };
    return Promise.resolve(merged);
  }

  const { buildPayloadFromUnifiedTemplate } = await import("./unifiedAdapter");
  return buildPayloadFromUnifiedTemplate(familyId, variant);
}
