/**
 * Apply template snapshot to current project.
 * Handles compatibility, partial apply, and auto-sanitize.
 */

import type { Project, Scene, Layer } from "../model";
import type { TemplateSnapshot } from "../model/templateSnapshot";
import type { SceneTemplate } from "../model/template";
import { resolveSceneConfig } from "../model";
import { cloneSceneFromTemplate } from "../lib/templateStore";
import { applyProMotionSelection, getProCameraPreset } from "../content/proCameraPresets";
import { sanitizeConfigByRules } from "./engine";
import { projectToProjectConfig, sceneToSceneConfig, layerToObjectConfig } from "./configBridge";

export type TemplateCompatibility = "full" | "partial" | "blocked";

export type ApplyTemplateResult = {
  success: boolean;
  compatibility: TemplateCompatibility;
  appliedProject?: Project;
  appliedScene?: Scene;
  toastMessages: string[];
  blockReason?: string;
};

function sceneTemplateToSnapshot(tpl: SceneTemplate): TemplateSnapshot {
  const s = tpl.scene;
  const config = resolveSceneConfig(s);
  const objects = (s.layers ?? []).map((l) => layerToObjectConfig(l));
  return {
    id: tpl.id,
    name: tpl.name,
    category: tpl.category,
    description: tpl.description,
    tags: tpl.tags,
    isBuiltin: tpl.isBuiltin,
    isProOnly: tpl.isProOnly,
    scope: "scene_only",
    sceneDefaults: {
      classicShot: (s.camera?.shot ?? "medium") as any,
      classicMotion: (s.camera?.movement ?? "static") as any,
      duration: s.duration_s,
      backgroundPrompt: (s.notes ?? "").split("\n").find((x) => x.toLowerCase().startsWith("bg:"))?.slice(3)?.trim(),
    },
    objects,
    compatibility: {
      mediaTypes: [config.mediaMode],
      storyPlans: ["single", "multicam", "continuous", "edit"],
      workspaceModes: ["quick", "pro"],
    },
  };
}

export function applyTemplateSnapshot(
  template: TemplateSnapshot | SceneTemplate,
  currentProject: Project,
  sceneIdx: number,
  workspaceMode: "quick" | "pro",
  options?: { partialOnly?: boolean }
): ApplyTemplateResult {
  const snapshot: TemplateSnapshot =
    "scene" in template ? sceneTemplateToSnapshot(template as SceneTemplate) : (template as TemplateSnapshot);

  const projectMedia = currentProject.project?.mediaType ?? "video";
  const templateMedia = snapshot.compatibility?.mediaTypes?.[0] ?? snapshot.sceneDefaults?.classicMotion ? "video" : "image";
  const scenes = currentProject.scenes ?? [];
  const currentScene = scenes[sceneIdx];

  // Block when strongly incompatible
  const mediaMismatch = templateMedia !== projectMedia && snapshot.scope === "full_workflow" && !options?.partialOnly;
  if (mediaMismatch) {
    return {
      success: false,
      compatibility: "blocked",
      toastMessages: [],
      blockReason:
        projectMedia === "image"
          ? "该模板基于视频设计，当前为图片模式。可切换为视频后使用，或仅应用对象布局。"
          : "该模板基于图片设计，当前为视频模式。可切换为图片后使用，或仅应用对象布局。",
    };
  }

  // Partial apply: clone scene (objects + layout) only
  const partialApply = options?.partialOnly || mediaMismatch;
  const sceneIdExists = (id: string) => scenes.some((s) => s.id === id);
  const layerIdExists = (id: string) =>
    scenes.some((s) => (s.layers ?? []).some((l) => l.id === id));

  const clonedScene =
    "scene" in template
      ? cloneSceneFromTemplate(template as SceneTemplate, sceneIdExists, layerIdExists)
      : buildSceneFromSnapshot(snapshot, sceneIdExists, layerIdExists);

  const nextScenes = [...scenes];
  nextScenes[sceneIdx] = clonedScene;
  const nextProject: Project = {
    ...currentProject,
    scenes: nextScenes.map((s, i) => ({ ...s, index: i + 1 })),
  };

  // Run sanitize
  const projectConfig = projectToProjectConfig(nextProject, workspaceMode);
  const sceneConfig = sceneToSceneConfig(clonedScene);
  const result = sanitizeConfigByRules({
    project: projectConfig,
    scene: { ...sceneConfig, objects: [] },
    selectedObject: null,
    exportConfig: undefined,
  });

  let finalScene = clonedScene;
  if (result.patches.length > 0) {
    for (const p of result.patches) {
      if (p.path === "scene.proMotions" && Array.isArray(p.value)) {
        const arr = p.value as string[];
        const basicId = arr.find((id) => getProCameraPreset(id)?.tier === "basic") ?? null;
        const proPlusIds = arr.filter((id) => getProCameraPreset(id)?.tier === "pro_plus");
        finalScene = {
          ...finalScene,
          notes: applyProMotionSelection(finalScene.notes ?? "", { basicId, proPlusIds }),
        };
      }
    }
  }

  const toastMessages: string[] = [];
  if (partialApply || projectMedia !== templateMedia) {
    toastMessages.push("已按当前模式自动适配模板");
  }
  toastMessages.push(...result.warnings);

  return {
    success: true,
    compatibility: partialApply ? "partial" : "full",
    appliedProject: { ...nextProject, scenes: nextScenes.map((s, i) => (i === sceneIdx ? finalScene : s)) },
    appliedScene: finalScene,
    toastMessages,
  };
}

function buildSceneFromSnapshot(
  snapshot: TemplateSnapshot,
  sceneIdExists: (id: string) => boolean,
  layerIdExists: (id: string) => boolean
): Scene {
  const def = snapshot.sceneDefaults;
  const layers = snapshot.objects.map((obj, i) => {
    const nextId = `layer${i + 1}`;
    const k0 = obj.t0;
    const k1 = obj.t1 ?? obj.t0;
    return {
      id: nextId,
      type: obj.type ?? "",
      shape: "rect" as const,
      look: obj.appearance ?? "",
      z: obj.zOrder ?? 10 + i,
      color: obj.color ?? "#b7c3ff",
      opacity: obj.opacity ?? 1,
      kf: [
        { t: 0 as const, x: k0.x, y: k0.y, w: k0.w, h: k0.h, rot: k0.rot },
        { t: 1 as const, x: k1.x, y: k1.y, w: k1.w, h: k1.h, rot: k1.rot },
      ],
      notes: obj.notes ?? "",
      externalPrompt: obj.objectPrompt ?? "",
      referenceLinks: "",
      localRefs: [],
      referencePolicy: "optional" as const,
    } as Layer;
  });

  const shot = def?.classicShot ?? "medium";
  const movement = def?.classicMotion ?? "static";

  return {
    id: `s_${Date.now()}`,
    name: snapshot.name,
    index: 1,
    duration_s: def?.duration ?? 6,
    transitionType: "cut",
    camera: {
      shot,
      movement,
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 },
      ],
    },
    lighting: { time: "", key_dir: "", mood: def?.lightingSetup ?? "" },
    layers,
    config: { mediaMode: "video", compiler: "v2" },
    notes: def?.backgroundPrompt ? `bg: ${def.backgroundPrompt}` : "",
  } as Scene;
}
