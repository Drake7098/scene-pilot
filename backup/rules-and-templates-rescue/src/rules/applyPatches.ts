/**
 * Apply rule patches to EditorState.
 *
 * This is the canonical patch application entry for the rules engine.
 * Input: EditorState, patches from runRuleEngine.
 * Output: Updated EditorState.
 *
 * Do not add Project/Scene-specific logic here. For the legacy Project path,
 * use applyPatchesToModel (see applyRules.ts).
 *
 * Next phase: When migrating to EditorState as main state, all patches flow here.
 */

import type { EditorState } from "../state/editorTypes";
import type { RulePatch } from "./ruleTypes";

type ParsedPath =
  | { type: "project"; field: string }
  | { type: "exportConfig"; field: string }
  | { type: "scene"; sceneIdx: number; field: string }
  | { type: "object"; sceneIdx: number; objIdx: number; field: string };

function parsePath(path: string): ParsedPath | null {
  const objMatch = path.match(/^scenes\[(\d+)\]\.objects\[(\d+)\]\.(.+)$/);
  if (objMatch) {
    return {
      type: "object",
      sceneIdx: parseInt(objMatch[1], 10),
      objIdx: parseInt(objMatch[2], 10),
      field: objMatch[3],
    };
  }
  const sceneMatch = path.match(/^scenes\[(\d+)\]\.(.+)$/);
  if (sceneMatch) {
    return {
      type: "scene",
      sceneIdx: parseInt(sceneMatch[1], 10),
      field: sceneMatch[2],
    };
  }
  if (path.startsWith("project.")) {
    return { type: "project", field: path.slice(8) };
  }
  if (path.startsWith("exportConfig.")) {
    return { type: "exportConfig", field: path.slice(13) };
  }
  return null;
}

export function applyRulePatches(state: EditorState, patches: RulePatch[]): EditorState {
  let next = state;

  for (const patch of patches) {
    const parsed = parsePath(patch.path);
    if (!parsed) continue;

    if (parsed.type === "project") {
      next = {
        ...next,
        project: { ...next.project, [parsed.field]: patch.value as never },
      };
      continue;
    }

    if (parsed.type === "exportConfig") {
      next = {
        ...next,
        exportConfig: { ...next.exportConfig, [parsed.field]: patch.value as never },
      };
      continue;
    }

    if (parsed.type === "scene" && parsed.sceneIdx >= 0 && parsed.sceneIdx < next.scenes.length) {
      const scene = next.scenes[parsed.sceneIdx];
      const updatedScene = { ...scene, [parsed.field]: patch.value as never };
      const scenes = [...next.scenes];
      scenes[parsed.sceneIdx] = updatedScene;
      next = { ...next, scenes };
      continue;
    }

    if (
      parsed.type === "object" &&
      parsed.sceneIdx >= 0 &&
      parsed.sceneIdx < next.scenes.length
    ) {
      const scene = next.scenes[parsed.sceneIdx];
      const objects = scene.objects ?? [];
      if (parsed.objIdx >= 0 && parsed.objIdx < objects.length) {
        const obj = objects[parsed.objIdx];
        const updated = { ...obj, [parsed.field]: patch.value as never };
        const nextObjects = [...objects];
        nextObjects[parsed.objIdx] = updated;
        const scenes = [...next.scenes];
        scenes[parsed.sceneIdx] = { ...scene, objects: nextObjects };
        next = { ...next, scenes };
      }
      continue;
    }
  }

  return next;
}
