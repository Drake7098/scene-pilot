/**
 * Resolve template pricing from template id (load payload → score → resolve).
 * Single entry for UI: resolveTemplatePricing(template) via this async loader.
 * No schema/engine changes.
 */

import type { TemplatePricingResult } from "./templatePricingTypes";
import { loadTemplatePayloadById } from "../template-engine/payload/templateLoader";
import { payloadToPricingInput } from "./templatePricingInput";
import { scoreTemplate } from "./templateComplexityScorer";
import { resolveTemplatePricing } from "./templatePricingResolver";

const pricingCache = new Map<string, TemplatePricingResult>();

/**
 * Get pricing for a template by id. Caches result. Use for cards, detail, UseTemplate.
 */
export async function getTemplatePricingForTemplate(
  templateId: string
): Promise<TemplatePricingResult> {
  const cached = pricingCache.get(templateId);
  if (cached) return cached;

  const payload = await loadTemplatePayloadById(templateId);
  if (!payload) {
    const fallback: TemplatePricingResult = {
      accessTier: "free",
      creditPrice: 0,
      pricingBucket: "F0",
      score: 0,
      capabilityTags: [],
      debugReasons: ["no payload"],
      capabilitySummary: []
    };
    pricingCache.set(templateId, fallback);
    return fallback;
  }

  const input = payloadToPricingInput(payload);
  const scoreResult = scoreTemplate(input);
  const result = resolveTemplatePricing(scoreResult);
  pricingCache.set(templateId, result);
  return result;
}

/** Clear cache (e.g. when template index changes). */
export function clearTemplatePricingCache(): void {
  pricingCache.clear();
}
