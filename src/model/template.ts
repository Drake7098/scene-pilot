import type { Scene } from "../model";

export type TemplateCategory =
  | "product"
  | "dialogue"
  | "short_video"
  | "ad"
  | "camera_move"
  | "social"
  | "custom";

export type SceneTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  isBuiltin: boolean;
  isProOnly?: boolean;
  cover?: string;
  tags?: string[];
  scene: Scene;
  createdAt?: number;
  updatedAt?: number;
};
