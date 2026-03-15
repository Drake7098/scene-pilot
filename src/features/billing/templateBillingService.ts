/**
 * Template billing service - per-use charges, no permanent unlock.
 * Same template in same project = no repeat charge.
 */

import type { Project } from "../../model";
import type { TemplateIndex } from "../../template-engine";
import type { AppliedTemplateCharge } from "./types";
import { appendTransaction } from "./billingStorage";
import { getWalletState, reserveCredits, finalizeReservedCredits } from "../../services/creditService";

/** Get template cost from metadata. Never compute in UI. */
export function getTemplateCost(template: TemplateIndex): number {
  return template.isFree ? 0 : template.cost;
}

/** Check if template has already been charged in this project. */
export function hasTemplateBeenChargedInProject(
  project: Project | null | undefined,
  templateId: string
): boolean {
  if (!project?.meta) return false;
  const billing = project.meta.billing;
  if (billing?.appliedTemplateCharges?.length) {
    return billing.appliedTemplateCharges.some((c) => c.templateId === templateId);
  }
  // Migration: fallback to legacy appliedTemplateIds
  const legacy = project.meta.appliedTemplateIds;
  return Array.isArray(legacy) && legacy.includes(templateId);
}

/** Check if user can afford template. */
export async function canAffordTemplate(
  userId: string,
  template: TemplateIndex
): Promise<{ canAfford: boolean; have: number; need: number }> {
  const cost = getTemplateCost(template);
  if (cost <= 0) return { canAfford: true, have: 0, need: 0 };
  const wallet = await getWalletState(userId);
  const have = wallet.creditsBalance;
  return {
    canAfford: have >= cost,
    have,
    need: cost,
  };
}

/** Record template charge in project meta. Caller must persist project. */
export function recordTemplateCharge(
  project: Project,
  template: TemplateIndex,
  cost: number
): Project {
  const charged: AppliedTemplateCharge = {
    templateId: template.id,
    familyId: template.familyId,
    variantId: template.variantId,
    cost,
    chargedAt: new Date().toISOString(),
    chargeType: "template_apply",
  };
  const existing = project.meta?.billing?.appliedTemplateCharges ?? [];
  const nextBilling = {
    ...project.meta?.billing,
    appliedTemplateCharges: [...existing, charged],
    generationCharges: project.meta?.billing?.generationCharges ?? [],
  };
  const nextMeta = {
    ...project.meta,
    billing: nextBilling,
    appliedTemplateIds: [...(project.meta?.appliedTemplateIds ?? []), template.id],
  };
  return { ...project, meta: nextMeta };
}

/**
 * Reserve credits, apply template charge, finalize. Returns updated project.
 * When creditAmount is provided (e.g. from pricing resolver), use it instead of template cost.
 */
export async function applyTemplateCharge(
  userId: string,
  project: Project,
  template: TemplateIndex,
  creditAmount?: number
): Promise<{ project: Project; success: boolean }> {
  const cost = creditAmount !== undefined ? creditAmount : getTemplateCost(template);
  if (cost <= 0) {
    return { project, success: true };
  }
  if (hasTemplateBeenChargedInProject(project, template.id)) {
    return { project, success: true };
  }
  const wallet = await getWalletState(userId);
  if (wallet.creditsBalance < cost) {
    return { project, success: false };
  }
  const entry = await reserveCredits(userId, cost, `template_${template.id}`);
  const nextProject = recordTemplateCharge(project, template, cost);
  await finalizeReservedCredits(userId, entry.id);
  appendTransaction({
    type: "template_apply",
    creditsDelta: -cost,
    templateId: template.id,
    note: `Template ${template.id}`,
  });
  return { project: nextProject, success: true };
}

/** Refund template charge (reserved). Not implemented. */
export function refundTemplateCharge(
  _userId: string,
  _project: Project,
  _templateId: string
): Promise<{ success: boolean }> {
  return Promise.resolve({ success: false });
}
