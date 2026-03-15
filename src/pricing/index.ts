/**
 * Template auto-pricing: capability extraction, complexity scoring, bucket resolution.
 * No schema/engine changes. Use for template index enrichment and audit.
 */

export type {
  TemplateAccessTier,
  TemplateCreditPrice,
  TemplatePricingBucket,
  TemplatePricingResult,
  TemplatePricingInput,
  SceneLikeForPricing
} from "./templatePricingTypes";

export { scoreTemplate } from "./templateComplexityScorer";
export type { TemplateScoreResult, SceneScoreResult } from "./templateComplexityScorer";

export {
  resolveTemplatePricing,
  CAPABILITY_LABELS,
  formatPricingBucketForDisplay
} from "./templatePricingResolver";

export { resolveCapabilityTags, CAPABILITY_TAG_DICTIONARY } from "./templateCapabilityTags";

export { payloadToPricingInput, sceneToPricingInput } from "./templatePricingInput";

export { explainPricing, explainPricingShort } from "./templatePricingDebug";

export {
  getTemplatePricingForTemplate,
  clearTemplatePricingCache
} from "./templatePricingFromTemplate";
