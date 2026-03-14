/**
 * Editor reducer: raw reduce + sanitize flow.
 *
 * Flow: reduceRaw -> shouldSanitize? -> buildRuleContext -> runRuleEngine ->
 *       applyRulePatches -> push warnings (deduped) -> return.
 *
 * Used when EditorState is the main state. Currently the App uses Project;
 * the Project path uses useSanitizedUpdate + applyPatchesToModel for sanitize.
 * This reducer is the canonical path for future EditorState migration.
 *
 * TODO: template/apply requires Project bridge (applyTemplateSnapshot); defer.
 * TODO: full SceneSidebar migration to useFieldState/useAllowedOptions.
 */

import type { EditorState, EditorScene } from "./editorTypes";
import type { EditorAction } from "./editorActions";
import { buildRuleContext } from "../rules/buildRuleContext";
import { runRuleEngine } from "../rules/engine";
import { applyRulePatches } from "../rules/applyPatches";

function pushToast(state: EditorState, type: "info" | "warning" | "success", message: string): EditorState {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...state,
    ui: {
      ...state.ui,
      toasts: [...state.ui.toasts, { id, type, message }],
    },
  };
}

function reduceRaw(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "project/updateField":
      return {
        ...state,
        project: { ...state.project, [action.field]: action.value as never },
      };

    case "scene/updateField": {
      const scenes = state.scenes.map((s) =>
        s.id === action.sceneId ? { ...s, [action.field]: action.value as never } : s
      );
      return { ...state, scenes };
    }

    case "scene/updateMulti": {
      const scenes = state.scenes.map((s) =>
        s.id === action.sceneId ? { ...s, ...action.patch } : s
      );
      return { ...state, scenes };
    }

    case "object/updateField": {
      const scenes = state.scenes.map((s) => {
        if (s.id !== action.sceneId) return s;
        const objects = (s.objects ?? []).map((o) =>
          o.id === action.objectId ? { ...o, [action.field]: action.value as never } : o
        );
        return { ...s, objects };
      });
      return { ...state, scenes };
    }

    case "object/updateKeyframe": {
      const scenes = state.scenes.map((s) => {
        if (s.id !== action.sceneId) return s;
        const objects = (s.objects ?? []).map((o) =>
          o.id === action.objectId ? { ...o, [action.key]: action.value as never } : o
        );
        return { ...s, objects };
      });
      return { ...state, scenes };
    }

    case "export/updateField":
      return {
        ...state,
        exportConfig: { ...state.exportConfig, [action.field]: action.value as never },
      };

    case "scene/select":
      return { ...state, selectedSceneId: action.sceneId };

    case "object/select":
      return { ...state, selectedObjectId: action.objectId };

    case "rules/applyPatches": {
      let next = applyRulePatches(state, action.patches);
      if (action.warnings?.length) {
        for (const msg of action.warnings) {
          next = pushToast(next, "info", msg);
        }
      }
      return next;
    }

    case "ui/pushToast":
      return pushToast(state, action.payload.type, action.payload.message);

    case "ui/openUpgradeModal":
      return {
        ...state,
        ui: {
          ...state.ui,
          upgradeModal: { open: true, ...action.payload },
        },
      };

    case "ui/closeUpgradeModal":
      return {
        ...state,
        ui: {
          ...state.ui,
          upgradeModal: undefined,
        },
      };

    case "scene/add": {
      if (state.project.storyPlan === "single" && state.scenes.length >= 1) return state;
      const existingIds = new Set(state.scenes.map((s) => s.id));
      let id = `s${state.scenes.length + 1}`;
      while (existingIds.has(id)) id = `s${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const base: EditorScene = {
        id,
        name: `Scene ${state.scenes.length + 1}`,
        duration: 6,
        sceneChangeMode: "same_place",
        cameraMoveMode: "switch_only",
        jumpCutMode: "allow",
        classicShot: "medium",
        classicMotion: "static",
        objects: [],
      };
      const nextScene = { ...base, ...action.payload } as EditorScene;
      return {
        ...state,
        scenes: [...state.scenes, nextScene],
        selectedSceneId: nextScene.id,
        project: { ...state.project, sceneCount: state.scenes.length + 1 },
      };
    }

    case "scene/remove": {
      const idx = state.scenes.findIndex((s) => s.id === action.sceneId);
      if (idx < 0) return state;
      const nextScenes = state.scenes.filter((s) => s.id !== action.sceneId);
      let nextSelected = state.selectedSceneId;
      if (state.selectedSceneId === action.sceneId) {
        nextSelected = nextScenes[idx - 1]?.id ?? nextScenes[0]?.id ?? null;
      }
      return {
        ...state,
        scenes: nextScenes,
        selectedSceneId: nextSelected,
        selectedObjectId: nextSelected === state.selectedSceneId ? state.selectedObjectId : null,
        project: { ...state.project, sceneCount: Math.max(1, nextScenes.length) },
      };
    }

    case "template/apply":
      // TODO: requires Project/Scene bridge; applyTemplateSnapshot works on Project model.
      // Defer to next phase when EditorState is main state.
      return state;

    default:
      return state;
  }
}

function shouldSanitize(action: EditorAction): boolean {
  switch (action.type) {
    case "project/updateField":
    case "scene/updateField":
    case "scene/updateMulti":
    case "object/updateKeyframe":
    case "object/updateField":
    case "export/updateField":
    case "scene/add":
    case "scene/remove":
    case "template/apply":
      return true;
    default:
      return false;
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const next = reduceRaw(state, action);

  if (!shouldSanitize(action)) return next;

  const ctx = buildRuleContext(next);
  const result = runRuleEngine(ctx);

  if (result.patches.length === 0 && result.warnings.length === 0) return next;

  let finalState = applyRulePatches(next, result.patches);

  if (result.warnings.length > 0) {
    const seen = new Set<string>();
    const unique = result.warnings.filter((m) => {
      if (seen.has(m)) return false;
      seen.add(m);
      return true;
    });
    const msg = unique[0];
    if (msg) finalState = pushToast(finalState, "info", msg);
  }

  return finalState;
}
