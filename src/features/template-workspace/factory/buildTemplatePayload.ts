/**
 * Build full TemplatePayload from family base + variant patch.
 * Factory-style: base + patch => full payload.
 */

import type { TemplateVariant } from "../model/templateTypes";
import type { TemplatePayload, TemplateSceneSnapshot } from "../model/templatePayload";
import { getFamilyBase } from "./familyBases";
import { getVariantPatch } from "./variantPatches";
import { buildPayloadFromUnifiedTemplate } from "./unifiedAdapter";

/** Deep merge (shallow for arrays - patch replaces). */
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

/**
 * Build full payload from familyId + variant.
 * Uses family base + variant patch when available; else falls back to unified adapter.
 */
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

  return buildPayloadFromUnifiedTemplate(familyId, variant);
}

/** Sync version when payload is already available (e.g. from cache). */
export function buildTemplatePayloadSync(
  familyId: string,
  variant: TemplateVariant
): TemplatePayload | null {
  const base = getFamilyBase(familyId);
  const patch = getVariantPatch(familyId, variant);
  if (base) {
    return patch ? deepMerge(base, patch) : { ...base };
  }
  return null;
}
