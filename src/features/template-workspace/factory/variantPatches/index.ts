/**
 * Variant patch registry.
 * Patches applied on top of family base to produce full payload.
 */

import type { TemplateVariant } from "../../model/templateTypes";
import type { TemplatePayload } from "../../model/templatePayload";

export type VariantPatchKey = string; // "familyId:variant"

function makeKey(familyId: string, variant: TemplateVariant): VariantPatchKey {
  return `${familyId}:${variant}`;
}

/** Partial payload to merge over family base. */
export type VariantPatch = Partial<TemplatePayload>;

const variantPatches = new Map<VariantPatchKey, VariantPatch>();

export function registerVariantPatch(
  familyId: string,
  variant: TemplateVariant,
  patch: VariantPatch
): void {
  variantPatches.set(makeKey(familyId, variant), patch);
}

export function getVariantPatch(
  familyId: string,
  variant: TemplateVariant
): VariantPatch | undefined {
  return variantPatches.get(makeKey(familyId, variant));
}
