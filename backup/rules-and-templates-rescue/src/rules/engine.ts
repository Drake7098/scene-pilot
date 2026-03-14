/**
 * Rule engine: compose rules and produce fieldStates, optionStates, patches, warnings.
 *
 * Input: RuleContext (project, scene, exportConfig, ...).
 * Output: RuleEngineResult (fieldStates, optionStates, patches, warnings).
 *
 * Used by: editorReducer (EditorState path), sanitizeConfigByRules (Project compat),
 * useRuleEngine (both EditorState and Project input).
 */

import { toEditorScene } from "./buildRuleContext";
import type { RuleContext, RuleEngineResult, FieldState } from "./ruleTypes";
import type { SceneConfig } from "../model/configSchema";
import { applyMediaRules } from "./rules/mediaRules";
import { applyStoryPlanRules } from "./rules/storyPlanRules";
import { applyMotionRules } from "./rules/motionRules";
import { applyWorkspaceRules } from "./rules/workspaceRules";
import { applyExportRules } from "./rules/exportRules";

function createEmptyRuleResult(): RuleEngineResult {
  return {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };
}

function mergeFieldStates(
  a: Partial<Record<string, FieldState>>,
  b: Partial<Record<string, FieldState>>
): Partial<Record<string, FieldState>> {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    const vb = b[k];
    if (!vb) continue;
    const va = out[k];
    if (!va) {
      out[k] = vb;
    } else {
      out[k] = {
        visible: va.visible && vb.visible,
        enabled: va.enabled && vb.enabled,
        reason: vb.reason ?? va.reason,
        required: va.required ?? vb.required,
      };
    }
  }
  return out;
}

function mergeRuleResults(a: RuleEngineResult, b: RuleEngineResult): RuleEngineResult {
  return {
    fieldStates: mergeFieldStates(a.fieldStates, b.fieldStates),
    optionStates: { ...a.optionStates, ...b.optionStates },
    patches: [...a.patches, ...b.patches],
    warnings: [...a.warnings, ...b.warnings],
  };
}

function dedupePatches(patches: RuleEngineResult["patches"]): RuleEngineResult["patches"] {
  const seen = new Set<string>();
  return patches.filter((p) => {
    const key = `${p.path}:${JSON.stringify(p.value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function runRuleEngine(ctx: RuleContext): RuleEngineResult {
  let result = createEmptyRuleResult();

  result = mergeRuleResults(result, applyMediaRules(ctx));
  result = mergeRuleResults(result, applyStoryPlanRules(ctx));
  result = mergeRuleResults(result, applyMotionRules(ctx));
  result = mergeRuleResults(result, applyWorkspaceRules(ctx));
  result = mergeRuleResults(result, applyExportRules(ctx));

  result.patches = dedupePatches(result.patches);

  return result;
}

const DEFAULT_EXPORT_CONFIG = {
  range: "current_scene" as const,
  method: "quick_copy" as const,
  target: "universal" as const,
};

/** Legacy: compat with sanitizeConfigByRules that returns RuleResult */
export function sanitizeConfigByRules(ctx: {
  project: RuleContext["project"];
  scene: SceneConfig | RuleContext["scene"] | null;
  selectedObject?: RuleContext["selectedObject"];
  exportConfig?: RuleContext["exportConfig"] | null;
}): { fieldStates: Record<string, { visible: boolean; enabled: boolean; reason?: string }>; patches: Array<{ path: string; value: unknown; reason: string }>; warnings: string[] } {
  const editorScene = toEditorScene(ctx.scene);
  const fullCtx: RuleContext = {
    ...ctx,
    scene: editorScene,
    selectedObject: ctx.selectedObject ?? null,
    exportConfig: ctx.exportConfig ?? DEFAULT_EXPORT_CONFIG,
    sceneCount: 0,
    allScenes: editorScene ? [editorScene] : [],
    sceneIndex: editorScene ? 0 : -1,
  };
  const r = runRuleEngine(fullCtx);
  return {
    fieldStates: r.fieldStates as Record<string, { visible: boolean; enabled: boolean; reason?: string }>,
    patches: r.patches,
    warnings: r.warnings,
  };
}
