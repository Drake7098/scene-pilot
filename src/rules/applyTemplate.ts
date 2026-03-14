/**
 * Apply template to current project.
 * Minimal implementation: clone scene from SceneTemplate and update project.
 */

import type { Project, Scene } from "../model";
import type { SceneTemplate } from "../model/template";
import { cloneSceneFromTemplate } from "../lib/templateStore";

export type TemplateCompatibility = "full" | "partial" | "blocked";

export type ApplyTemplateResult = {
  success: boolean;
  compatibility: TemplateCompatibility;
  appliedProject?: Project;
  appliedScene?: Scene;
  toastMessages: string[];
  blockReason?: string;
};

export function applyTemplateSnapshot(
  template: SceneTemplate,
  currentProject: Project,
  sceneIdx: number,
  _workspaceMode: "quick" | "pro",
  _options?: { partialOnly?: boolean }
): ApplyTemplateResult {
  const scenes = currentProject.scenes ?? [];
  const sceneIdExists = (id: string) => scenes.some((s) => s.id === id);
  const layerIdExists = (id: string) =>
    scenes.some((s) => (s.layers ?? []).some((l) => l.id === id));

  const clonedScene = cloneSceneFromTemplate(template, sceneIdExists, layerIdExists);

  const nextScenes = [...scenes];
  nextScenes[sceneIdx] = clonedScene;
  const nextProject: Project = {
    ...currentProject,
    scenes: nextScenes.map((s, i) => ({ ...s, index: i + 1 })),
  };

  return {
    success: true,
    compatibility: "full",
    appliedProject: nextProject,
    appliedScene: clonedScene,
    toastMessages: [],
  };
}
