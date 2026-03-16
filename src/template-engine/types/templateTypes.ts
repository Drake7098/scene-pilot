/**
 * Core template types.
 */

export type TemplateVariant =
  | "free_starter"
  | "vertical_9_16"
  | "horizontal_16_9"
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

export type TemplateDomain = "base" | "webdrama_continuity" | "anime_continuity";

export type ContinuityVariantWebdrama =
  | "starter"
  | "close_emotion"
  | "multi_angle"
  | "high_tension"
  | "advanced_continuity";

export type ContinuityVariantAnime =
  | "starter"
  | "vertical_short"
  | "battle_motion"
  | "cinematic_anime"
  | "advanced_continuity";
