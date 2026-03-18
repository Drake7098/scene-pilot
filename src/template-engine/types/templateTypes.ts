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

/** Internal technical domain - for engine routing */
export type TemplateDomain = "base" | "webdrama_continuity" | "anime_continuity";

/**
 * Industry/scene classification - for UI filtering.
 * Reflects real-world user roles and content types.
 */
export type TemplateIndustry =
  | "drama"       // 电视剧/网剧
  | "anime"       // 动漫
  | "ad"          // 广告/品牌
  | "ecommerce"   // 电商
  | "shortfilm"   // 短片/MV
  | "documentary" // 纪录片
  | "social"      // 社交/自媒体
  | "game";       // 游戏

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
