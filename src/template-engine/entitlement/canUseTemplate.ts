/**
 * Template entitlement - can user use this template without paying?
 */

import type { TemplateIndex } from "../types/templateIndex";
import type { UserState } from "../../types/account";
import { canUseUnlimitedTemplates } from "../../utils/entitlement";
import { resolveTemplateCost } from "../billing/resolveCost";

export function canUseTemplate(
  template: TemplateIndex,
  user: UserState | null,
  userCredits: number
): boolean {
  if (canUseUnlimitedTemplates(user)) return true;
  const cost = resolveTemplateCost(template);
  return cost <= 0 || userCredits >= cost;
}
