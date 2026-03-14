/**
 * Variant patch registry.
 */

import type { TemplatePayload } from "../types/templatePayload";
import type { TemplateVariant } from "../types/templateTypes";

const variantPatches = new Map<string, Partial<TemplatePayload>>();

function makeKey(familyId: string, variant: TemplateVariant): string {
  return `${familyId}:${variant}`;
}

export function registerVariantPatch(
  familyId: string,
  variant: TemplateVariant,
  patch: Partial<TemplatePayload>
): void {
  variantPatches.set(makeKey(familyId, variant), patch);
}

export function getVariantPatch(
  familyId: string,
  variant: TemplateVariant
): Partial<TemplatePayload> | undefined {
  return variantPatches.get(makeKey(familyId, variant));
}
