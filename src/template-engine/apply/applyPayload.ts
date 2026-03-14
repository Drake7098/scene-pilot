/**
 * Apply TemplatePayload to project.
 */

import type { Project } from "../../model";
import type { Scene } from "../../model";
import type { TemplatePayload, TemplateSceneSnapshot } from "../types/templatePayload";
import type { TemplateIndex } from "../types/templateIndex";
import type { ApplyTemplateMode } from "../types/filter";
import { loadTemplatePayloadById } from "../payload/templateLoader";
import { ensureUniqueSceneIds } from "../../lib/templateStore";
import { applyCameraLanguage } from "../../content/cameraLanguageLayers";

export type ApplyTemplateResult = {
  success: boolean;
  appliedProject?: Project;
  appliedScene?: Scene;
  toastMessages: string[];
  blockReason?: string;
};

const DEFAULT_CAMERA = { shot: "", movement: "", keyframes: [] };
const DEFAULT_LIGHTING = { time: "", key_dir: "", mood: "" };

function applyModeFilter(
  raw: Scene,
  snapshot: TemplateSceneSnapshot,
  mode: ApplyTemplateMode
): Scene {
  if (mode === "full_workflow") return raw;

  const base: Scene = {
    id: raw.id,
    name: raw.name,
    duration_s: raw.duration_s,
    camera: DEFAULT_CAMERA,
    lighting: DEFAULT_LIGHTING,
    layers: raw.layers ?? [],
    notes: ""
  };

  if (mode === "layout_only") return { ...raw, ...base };

  if (mode === "layout_plus_style") {
    const notes = snapshot.cameraLanguage
      ? applyCameraLanguage(raw.notes ?? "", snapshot.cameraLanguage)
      : raw.notes ?? "";
    return {
      ...raw,
      ...base,
      camera: {
        shot: raw.camera?.shot ?? "",
        movement: raw.camera?.movement ?? "",
        keyframes: raw.camera?.keyframes ?? []
      },
      lighting: {
        time: raw.lighting?.time ?? "",
        key_dir: raw.lighting?.key_dir ?? "",
        mood: raw.lighting?.mood ?? ""
      },
      notes
    };
  }

  return raw;
}

export async function applyTemplateFromIndex(
  index: TemplateIndex,
  currentProject: Project,
  appendScene: boolean,
  applyMode: ApplyTemplateMode = "layout_only"
): Promise<ApplyTemplateResult> {
  const payload = await loadTemplatePayloadById(index.id);
  if (!payload) {
    return { success: false, toastMessages: ["Template not found"], blockReason: "template_not_found" };
  }
  return applyPayloadToProject(payload, currentProject, appendScene, applyMode);
}

export function applyPayloadToProject(
  payload: TemplatePayload,
  currentProject: Project,
  appendScene: boolean,
  applyMode: ApplyTemplateMode = "layout_only"
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
    .map((s) => {
      const raw = s.raw as Scene | null | undefined;
      if (!raw) return null;
      const filtered = applyModeFilter(raw, s, applyMode);
      return filtered;
    })
    .filter((s): s is Scene => Boolean(s));

  if (rawScenes.length === 0) {
    return {
      success: false,
      toastMessages: ["No scene data in template"],
      blockReason: "no_scene"
    };
  }

  const existingScenes = currentProject.scenes ?? [];
  const acc: Scene[] = [];
  for (const raw of rawScenes) {
    const soFar = appendScene ? [...existingScenes, ...acc] : acc;
    acc.push(ensureUniqueSceneIds(raw, soFar));
  }

  const nextScenes = appendScene ? [...existingScenes, ...acc] : acc;
  const withIndex = nextScenes.map((s, i) => ({ ...s, index: i + 1 }));

  const projectDefaults = payload.projectDefaults ?? {};
  const nextProject: Project = {
    ...currentProject,
    project: {
      ...currentProject.project,
      mediaType: projectDefaults.mediaType ?? currentProject.project?.mediaType,
      shotPlan: projectDefaults.storyPlan === "continuous" ? "continuous" : currentProject.project?.shotPlan
    },
    scenes: withIndex,
    ...(payload.continuity ? { continuity: payload.continuity } : {})
  };

  return {
    success: true,
    appliedProject: nextProject,
    toastMessages: []
  };
}
