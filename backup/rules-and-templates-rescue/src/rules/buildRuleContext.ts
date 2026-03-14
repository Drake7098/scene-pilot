/**
 * Build RuleContext from EditorState.
 */

import type { EditorScene } from "../state/editorTypes";
import type { EditorState } from "../state/editorTypes";
import type { RuleContext } from "./ruleTypes";
import type { SceneConfig } from "../model/configSchema";

/** Normalize SceneConfig to EditorScene (add objects if missing). Safe for legacy callers passing SceneConfig. */
export function toEditorScene(s: SceneConfig | EditorScene | null): EditorScene | null {
  if (!s) return null;
  const withObjects = s as EditorScene;
  return "objects" in s && Array.isArray(withObjects.objects)
    ? withObjects
    : { ...s, objects: [] };
}

export function buildRuleContext(state: EditorState): RuleContext {
  const scene =
    state.scenes.find((s) => s.id === state.selectedSceneId) ?? null;
  const sceneIndex = state.selectedSceneId
    ? state.scenes.findIndex((s) => s.id === state.selectedSceneId)
    : -1;
  const selectedObject =
    scene?.objects.find((o) => o.id === state.selectedObjectId) ?? null;

  return {
    project: state.project,
    scene,
    sceneCount: state.scenes.length,
    selectedObject,
    exportConfig: state.exportConfig,
    allScenes: state.scenes,
    sceneIndex,
  };
}
