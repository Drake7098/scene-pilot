/**
 * Family base registry.
 * Each family has a base structure (projectDefaults + base scene).
 * Loaded on demand - see templateLoader.
 */

import type { TemplatePayload } from "../../model/templatePayload";

export type FamilyBaseId = string;

/** Map familyId -> base payload (minimal structure for factory merge). */
const familyBases = new Map<FamilyBaseId, TemplatePayload>();

export function registerFamilyBase(familyId: FamilyBaseId, base: TemplatePayload): void {
  familyBases.set(familyId, base);
}

export function getFamilyBase(familyId: FamilyBaseId): TemplatePayload | undefined {
  return familyBases.get(familyId);
}

export function hasFamilyBase(familyId: FamilyBaseId): boolean {
  return familyBases.has(familyId);
}
