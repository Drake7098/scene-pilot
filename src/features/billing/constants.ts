/**
 * Billing constants - template costs, generation cost ranges (reserved).
 */

/** Free template = 0 credits */
export const TEMPLATE_COST_FREE = 0;

/** Standard template = 3 credits */
export const TEMPLATE_COST_STANDARD = 3;

/** Premium/advanced/continuous template = 5 credits */
export const TEMPLATE_COST_PREMIUM = 5;

/** Generation cost ranges (reserved; not used for real billing yet). */
export const GENERATION_COST_RANGES = {
  image_basic: { min: 1, max: 3 },
  image_advanced: { min: 3, max: 8 },
  video_basic: { min: 8, max: 20 },
  video_advanced: { min: 20, max: 50 },
} as const;
