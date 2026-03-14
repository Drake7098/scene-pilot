/**
 * Template credits service - cost check, reserve, finalize.
 * Delegates to creditService; provides template-specific interface.
 */

import type { TemplateIndex } from "../model/templateIndex";

export type TemplateCreditsCheck = {
  canUse: boolean;
  cost: number;
  have: number;
  needMore: number;
};

export function checkTemplateCredits(
  template: TemplateIndex,
  userCredits: number
): TemplateCreditsCheck {
  const cost = template.isFree ? 0 : template.cost;
  const canUse = template.isFree || userCredits >= cost;
  return {
    canUse,
    cost,
    have: userCredits,
    needMore: Math.max(0, cost - userCredits)
  };
}

/**
 * Reserve credits before applying template.
 * Caller must use creditService.reserveCredits / finalizeReservedCredits.
 * This module does not hold creditService - App injects it.
 */
export function getTemplateCost(template: TemplateIndex): number {
  return template.isFree ? 0 : template.cost;
}
