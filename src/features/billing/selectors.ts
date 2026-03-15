/**
 * Billing selectors - derived state for UI.
 */

import type { Project } from "../../model";
import type { TemplateIndex } from "../../template-engine/types/templateIndex";
import { getTemplateCost, hasTemplateBeenChargedInProject } from "./templateBillingService";

export type TemplateBillingStatus =
  | "free"
  | "already_charged"
  | "can_apply"
  | "insufficient";

export function getTemplateBillingStatus(
  project: Project | null | undefined,
  template: TemplateIndex,
  userCredits: number
): TemplateBillingStatus {
  const cost = getTemplateCost(template);
  if (cost <= 0) return "free";
  if (hasTemplateBeenChargedInProject(project, template.id)) return "already_charged";
  if (userCredits >= cost) return "can_apply";
  return "insufficient";
}
