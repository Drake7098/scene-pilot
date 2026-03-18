/**
 * Filter types for template workspace UI.
 */

import type { TemplateIndustry } from "./templateTypes";

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
  /** User-facing industry filter (replaces domain in UI) */
  industry: "all" | TemplateIndustry;
};

export type ApplyTemplateMode = "layout_only" | "layout_plus_style" | "full_workflow";
