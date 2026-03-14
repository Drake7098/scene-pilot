/**
 * Editor reducer actions.
 */

import type { ProjectConfig, SceneConfig, ObjectConfig, ExportConfig } from "../model/configSchema";
import type { RulePatch } from "../rules/ruleTypes";

export type EditorAction =
  | { type: "project/updateField"; field: keyof ProjectConfig; value: unknown }
  | { type: "scene/updateField"; sceneId: string; field: keyof SceneConfig; value: unknown }
  | { type: "scene/updateMulti"; sceneId: string; patch: Partial<SceneConfig> }
  | { type: "object/updateField"; sceneId: string; objectId: string; field: keyof ObjectConfig; value: unknown }
  | { type: "object/updateKeyframe"; sceneId: string; objectId: string; key: "t0" | "t1"; value: unknown }
  | { type: "export/updateField"; field: keyof ExportConfig; value: unknown }
  | { type: "scene/add"; payload?: Partial<SceneConfig> }
  | { type: "scene/remove"; sceneId: string }
  | { type: "scene/select"; sceneId: string | null }
  | { type: "object/select"; objectId: string | null }
  | { type: "template/apply"; payload: { mode: "full" | "partial"; templateId: string } }
  | { type: "rules/applyPatches"; patches: RulePatch[]; warnings?: string[] }
  | { type: "ui/pushToast"; payload: { type: "info" | "warning" | "success"; message: string } }
  | { type: "ui/openUpgradeModal"; payload: { reason?: string; feature?: string } }
  | { type: "ui/closeUpgradeModal" };
