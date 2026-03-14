/**
 * Template filter types for workspace UI.
 */

export type TemplateWorkspaceScope =
  | "recommended"
  | "all"
  | "free"
  | "favorites"
  | "recent"
  | "mine";

export type TemplateWorkspaceFilters = {
  mediaType: "all" | "image" | "video";
  storyPlan: "all" | "single" | "continuous" | "multi_cam" | "edited";
  ratio: "all" | "16:9" | "9:16" | "1:1";
  pricing: "all" | "free" | "paid";
  /** base | webdrama_continuity | anime_continuity | all */
  domain: "all" | "base" | "webdrama_continuity" | "anime_continuity";
};

export type ApplyTemplateMode = "layout_only" | "layout_plus_style" | "full_workflow";
