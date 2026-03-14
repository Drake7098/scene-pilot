/**
 * Family base registry.
 */

import type { TemplatePayload } from "../types/templatePayload";

const familyBases = new Map<string, TemplatePayload>();

export function registerFamilyBase(familyId: string, base: TemplatePayload): void {
  familyBases.set(familyId, base);
}

export function getFamilyBase(familyId: string): TemplatePayload | undefined {
  return familyBases.get(familyId);
}
