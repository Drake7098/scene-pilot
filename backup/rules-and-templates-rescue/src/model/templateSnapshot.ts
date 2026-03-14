/**
 * Template full snapshot model.
 * Templates store complete config, not just Scene.
 */

import type {
  ProjectConfig,
  SceneConfig,
  ObjectConfig,
  ExportConfig,
  MediaType,
  StoryPlan,
  WorkspaceMode,
} from "./configSchema";

export type TemplateScope =
  | "scene_only"
  | "scene_plus_style"
  | "full_workflow";

export type TemplateCategory =
  | "product"
  | "dialogue"
  | "short_video"
  | "social"
  | "ad"
  | "camera_move"
  | "custom";

export type TemplateSnapshot = {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  tags?: string[];
  isBuiltin: boolean;
  isProOnly?: boolean;

  scope: TemplateScope;

  projectDefaults?: Partial<ProjectConfig>;
  sceneDefaults: Partial<SceneConfig>;
  objects: ObjectConfig[];
  exportDefaults?: Partial<ExportConfig>;

  compatibility?: {
    mediaTypes?: MediaType[];
    storyPlans?: StoryPlan[];
    workspaceModes?: WorkspaceMode[];
  };

  createdAt?: number;
  updatedAt?: number;
};
