/**
 * Hook to get rule engine result from state.
 *
 * Supports: EditorState (source: "editor") and Project (source: "project").
 * Output: RuleEngineResult for useFieldState / useAllowedOptions.
 *
 * Project path: used by Pro workspace; wrap children in RuleResultProvider.
 */

import { useMemo } from "react";
import { buildRuleContext, toEditorScene } from "../rules/buildRuleContext";
import { runRuleEngine } from "../rules/engine";
import type { EditorState } from "../state/editorTypes";
import type { RuleEngineResult } from "../rules/ruleTypes";
import {
  projectToProjectConfig,
  sceneToSceneConfig,
  layerToObjectConfig,
} from "../rules/configBridge";
import type { Project, Scene } from "../model";

export type RuleEngineInput =
  | { source: "editor"; state: EditorState }
  | {
      source: "project";
      project: Project;
      scene: Scene | null;
      sceneIdx: number;
      selectedLayerId: string | null;
      exportConfig: { range: string; target: string };
      workspaceMode: "quick" | "pro";
    };

export function useRuleEngine(input: RuleEngineInput | null): RuleEngineResult {
  return useMemo(() => {
    if (!input) {
      return { fieldStates: {}, optionStates: {}, patches: [], warnings: [] };
    }

    if (input.source === "editor") {
      const ctx = buildRuleContext(input.state);
      return runRuleEngine(ctx);
    }

    const { project, scene, sceneIdx, selectedLayerId, exportConfig, workspaceMode } = input;
    const projectConfig = projectToProjectConfig(project, workspaceMode);
    const sceneConfig = scene ? sceneToSceneConfig(scene) : null;
    const objects = (scene?.layers ?? []).map(layerToObjectConfig);
    const editorScene = sceneConfig ? toEditorScene({ ...sceneConfig, objects }) : null;
    const selectedObject =
      scene && selectedLayerId
        ? (scene.layers ?? []).find((l) => l.id === selectedLayerId)
        : null;

    const ctx = {
      project: projectConfig,
      scene: editorScene,
      sceneCount: (project.scenes ?? []).length,
      selectedObject: selectedObject ? layerToObjectConfig(selectedObject) : null,
      exportConfig: {
        range: (exportConfig.range as "current_scene" | "continuous_sequence") ?? "current_scene",
        method: "quick_copy" as const,
        target: exportConfig.target ?? "universal",
      },
      allScenes: editorScene ? [editorScene] : [],
      sceneIndex: sceneIdx,
    };

    return runRuleEngine(ctx);
  }, [input]);
}
