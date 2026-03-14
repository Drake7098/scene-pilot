/**
 * Editor domain state types.
 * Used by reducer and rule context.
 */

import type {
  ProjectConfig,
  SceneConfig,
  ObjectConfig,
  ExportConfig,
} from "../model/configSchema";

export type PlanId = "free" | "pro" | "pro_gen" | "pro_plus";

export type EditorScene = SceneConfig & {
  objects: ObjectConfig[];
};

export type EditorState = {
  project: ProjectConfig;
  scenes: EditorScene[];
  selectedSceneId: string | null;
  selectedObjectId: string | null;
  exportConfig: ExportConfig;

  account: {
    plan: PlanId;
    credits: number;
  };

  ui: {
    toasts: Array<{
      id: string;
      type: "info" | "warning" | "success";
      message: string;
    }>;
    upgradeModal?: {
      open: boolean;
      reason?: string;
      feature?: string;
    };
  };
};
