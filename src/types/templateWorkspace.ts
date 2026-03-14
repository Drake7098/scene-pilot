/**
 * Unified template type for Template Workspace (400-template system).
 */

import type { Scene } from "../model";

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

export type UnifiedTemplate = {
  id: string;
  name: string;
  /** Chinese display name. Fallback to name if absent. */
  nameZh?: string;
  family: string;
  familyZh?: string;
  variant: TemplateVariant;
  category: TemplateCategory;
  description: string;
  /** Chinese description. Fallback to description if absent. */
  descriptionZh?: string;
  tags: string[];
  mediaType: "image" | "video";
  storyPlan: "single" | "continuous" | "multi_cam" | "edited";
  ratio: "16:9" | "9:16" | "1:1";
  isFree: boolean;
  cost: number;
  popularity: number;
  isFeatured: boolean;
  preview?: string;
  sceneDefaults?: Record<string, unknown>;
  objects?: unknown[];
  exportDefaults?: Record<string, unknown>;
  /** Built Scene for applyTemplateSnapshot compatibility */
  scene: Scene;
};
