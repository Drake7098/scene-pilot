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

  // free_starter 变体强制 F0，不走 resolver
  if (templateId.includes("free_starter")) {
    const freeResult: TemplatePricingResult = {
      accessTier: "free",
      creditPrice: 0,
      pricingBucket: "F0",
      score: scoreResult.score,
      capabilityTags: [],
      debugReasons: ["free_starter variant: forced F0"],
      capabilitySummary: scoreResult.capabilitySummary
    };
    pricingCache.set(templateId, freeResult);
    return freeResult;
  }

  const raw = resolveTemplatePricing(scoreResult);
  // Guard: if creditPrice <= 0, force free tier for UI even if bucket/accessTier drifted.
  const result: TemplatePricingResult =
    raw.creditPrice <= 0
      ? { ...raw, accessTier: "free", creditPrice: 0 as const }
      : raw;
  pricingCache.set(templateId, result);
  return result;
}

/** Clear cache (e.g. when template index changes). */
export function clearTemplatePricingCache(): void {
  pricingCache.clear();
}
