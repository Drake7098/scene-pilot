/**
 * Template apply service - bridges TemplatePayload to Pro project.
 * Integrates with applyTemplateSnapshot, unifiedTemplateToSceneTemplate.
 */

import type { Project } from "../../../model";
import type { TemplatePayload } from "../model/templatePayload";
import type { TemplateIndex } from "../model/templateIndex";
import { applyTemplateSnapshot } from "../../../rules/applyTemplate";
import { unifiedTemplateToSceneTemplate } from "../../../utils/unifiedTemplateToSceneTemplate";
import { getTemplateLibrary400 } from "../../../data/templateLibrary400";

export type ApplyTemplateResult = {
  success: boolean;
  appliedProject?: Project;
  appliedScene?: import("../../../model").Scene;
  toastMessages: string[];
  blockReason?: string;
};

/**
 * Apply template from index - handles both base (400) and continuity (200).
 */
export async function applyTemplateFromIndex(
  index: TemplateIndex,
  currentProject: Project,
  appendScene: boolean
): Promise<ApplyTemplateResult> {
  const domain = index.domain ?? "base";
  if (domain === "webdrama_continuity" || domain === "anime_continuity") {
    const { loadTemplatePayloadById } = await import("./templateLoader");
    const payload = await loadTemplatePayloadById(index.id);
    if (!payload) {
      return { success: false, toastMessages: ["Template not found"], blockReason: "template_not_found" };
    }
    return applyPayloadToProject(payload, currentProject, appendScene);
  }
  return applyTemplateToProject(index, currentProject, appendScene);
}

/**
 * Apply template to current project (base 400 only).
 * For 400-template system: converts via UnifiedTemplate -> SceneTemplate -> applyTemplateSnapshot.
 */
export function applyTemplateToProject(
  index: TemplateIndex,
  currentProject: Project,
  appendScene: boolean,
  _applyMode?: "layout_only" | "layout_plus_style" | "full_workflow"
): ApplyTemplateResult {
  const items = getTemplateLibrary400();
  const variant = index.variant ?? index.variantId;
  const unified = items.find(
    (t: { id: string }) => t.id === index.id || t.id === `tpl400_${index.familyId}_${variant}`
  );
  if (!unified) {
    return {
      success: false,
      toastMessages: ["Template not found"],
      blockReason: "template_not_found"
    };
  }

  const sceneTemplate = unifiedTemplateToSceneTemplate(unified);
  const sceneIdx = appendScene ? (currentProject.scenes?.length ?? 0) : 0;
  const result = applyTemplateSnapshot(
    sceneTemplate,
    currentProject,
    Math.min(sceneIdx, (currentProject.scenes?.length ?? 1) - 1),
    "pro"
  );

  if (!result.success) {
    return {
      success: false,
      toastMessages: result.toastMessages ?? [],
      blockReason: result.blockReason
    };
  }

  if (result.appliedProject) {
    return {
      success: true,
      appliedProject: result.appliedProject,
      toastMessages: result.toastMessages ?? []
    };
  }

  if (result.appliedScene && appendScene) {
    const scenes = currentProject.scenes ?? [];
    const nextScenes = [...scenes, result.appliedScene].map((s, i) => ({
      ...s,
      index: i + 1
    }));
    return {
      success: true,
      appliedProject: {
        ...currentProject,
        scenes: nextScenes
      },
      toastMessages: result.toastMessages ?? []
    };
  }

  return {
    success: false,
    toastMessages: result.toastMessages ?? [],
    blockReason: "apply_failed"
  };
}

/**
 * Apply from raw TemplatePayload.
 * Supports multi-scene continuity: appends all scenes from payload.
 */
export function applyPayloadToProject(
  payload: TemplatePayload,
  currentProject: Project,
  appendScene: boolean
): ApplyTemplateResult {
  const scenes = payload.scenes ?? [];
  if (scenes.length === 0) {
    return {
      success: false,
      toastMessages: ["No scene data in template"],
      blockReason: "no_scene"
    };
  }

  const rawScenes = scenes
    .map((s) => s.raw as import("../../../model").Scene)
    .filter(Boolean);

  if (rawScenes.length === 0) {
    return {
      success: false,
      toastMessages: ["No scene data in template"],
      blockReason: "no_scene"
    };
  }

  const existingScenes = currentProject.scenes ?? [];
  const nextScenes = appendScene
    ? [...existingScenes, ...rawScenes]
    : rawScenes;
  const withIndex = nextScenes.map((s, i) => ({ ...s, index: i + 1 }));

  const projectDefaults = payload.projectDefaults ?? {};
  const nextProject: Project = {
    ...currentProject,
    project: {
      ...currentProject.project,
      mediaType: projectDefaults.mediaType ?? currentProject.project?.mediaType,
      shotPlan: projectDefaults.storyPlan === "continuous" ? "continuous" : currentProject.project?.shotPlan
    },
    scenes: withIndex
  };

  return {
    success: true,
    appliedProject: nextProject,
    toastMessages: []
  };
}
