/**
 * Template auto-pricing types.
 * No schema/engine changes; used by capability extractor, scorer, and resolver.
 */

/** Access tier for display and gating. */
export type TemplateAccessTier = "free" | "credits" | "pro_credits";

/** Credit price: 0 = free, 1–3 = paid. */
export type TemplateCreditPrice = 0 | 1 | 2 | 3;

/** Pricing bucket: F0 free, C1/C2 credits-only, P2/P3 Pro + credits. */
export type TemplatePricingBucket = "F0" | "C1" | "C2" | "P2" | "P3";

/** Result of template pricing resolution. */
export type TemplatePricingResult = {
  accessTier: TemplateAccessTier;
  creditPrice: TemplateCreditPrice;
  pricingBucket: TemplatePricingBucket;
  score: number;
  /** Display tags for template card (2–4 tags). */
  capabilityTags: string[];
  /** Reasons explaining score and bucket (for debug/audit). */
  debugReasons: string[];
  /** Raw capability keys from scorer (internal/debug). */
  capabilitySummary: string[];
};

/** Minimal scene-like input for scoring (from Scene or TemplateSceneSnapshot). */
export type SceneLikeForPricing = {
  camera?: { shot?: string; movement?: string };
  lighting?: { time?: string; key_dir?: string; mood?: string };
  transitionType?: string;
  entryDir?: string;
  exitDir?: string;
  inheritFromPrevious?: boolean;
  notes?: string;
  config?: {
    compiler?: string;
    sceneTier?: string;
    v2Mode?: string;
    stability?: string;
  };
};

/** Input for complexity scorer: one or more scenes + optional project context. */
export type TemplatePricingInput = {
  scenes: SceneLikeForPricing[];
  /** From projectDefaults.storyPlan or continuity; used for multi-scene / continuous bonus. */
  storyPlan?: "single" | "continuous" | "multi_cam" | "edited";
  /** Explicit continuous shot plan (e.g. from payload). */
  projectShotPlan?: "single" | "multicam" | "continuous" | "edit";
};
