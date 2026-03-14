/**
 * Core template types for the template-workspace feature module.
 * Aligns with FIELD_KEYS and future rules engine.
 */

export type TemplateVariant =
  | "free_starter"
  | "basic_wide"
  | "basic_medium"
  | "basic_close"
  | "vertical_9_16"
  | "horizontal_16_9"
  | "social_fast"
  | "cinematic"
  | "multi_object"
  | "advanced_motion";

export type TemplateCategory =
  | "product"
  | "dialogue"
  | "ad"
  | "short_video"
  | "social"
  | "camera_move"
  | "composition"
  | "continuous"
  | "cover_poster";

export type TemplateStoryPlan = "single" | "continuous" | "multi_cam" | "edited";

export type TemplateMediaType = "image" | "video";

export type TemplateRatio = "16:9" | "9:16" | "1:1";

/** Template domain for filtering: base 400, webdrama 100, anime 100 */
export type TemplateDomain = "base" | "webdrama_continuity" | "anime_continuity";

/** Webdrama continuity variants (20 families × 5) */
export type ContinuityVariantWebdrama =
  | "starter"
  | "close_emotion"
  | "multi_angle"
  | "high_tension"
  | "advanced_continuity";

/** Anime continuity variants (20 families × 5) */
export type ContinuityVariantAnime =
  | "starter"
  | "vertical_short"
  | "battle_motion"
  | "cinematic_anime"
  | "advanced_continuity";
