/**
 * Story plan rules (single / multi_cam / continuous / edited).
 */

import { FIELD_KEYS } from "../fieldKeys";
import type { RuleContext, RuleEngineResult } from "../ruleTypes";

export function applyStoryPlanRules(ctx: RuleContext): RuleEngineResult {
  const result: RuleEngineResult = {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };

  const { project, sceneCount } = ctx;
  const isSingle = project.storyPlan === "single";
  const isContinuous = project.storyPlan === "continuous";
  const isEdited = project.storyPlan === "edit";

  if (isSingle) {
    if (project.sceneCount !== 1) {
      result.patches.push({
        path: "project.sceneCount",
        value: 1,
        reason: "单镜计划仅支持 1 个分镜",
      });
    }
    result.fieldStates[FIELD_KEYS.SCENE_ENTRY_DIRECTION] = {
      visible: false,
      enabled: false,
      reason: "仅视频连续分镜可用",
    };
    result.fieldStates[FIELD_KEYS.SCENE_EXIT_DIRECTION] = {
      visible: false,
      enabled: false,
      reason: "仅视频连续分镜可用",
    };
    result.fieldStates[FIELD_KEYS.SCENE_OBJECT_INHERITANCE] = {
      visible: false,
      enabled: false,
      reason: "仅视频连续分镜可用",
    };
    result.fieldStates[FIELD_KEYS.SCENE_JUMP_CUT_MODE] = {
      visible: false,
      enabled: false,
    };
  }

  const showEntryExit = project.mediaType === "video" && sceneCount > 1 && isContinuous;
  if (showEntryExit) {
    result.fieldStates[FIELD_KEYS.SCENE_ENTRY_DIRECTION] = { visible: true, enabled: true };
    result.fieldStates[FIELD_KEYS.SCENE_EXIT_DIRECTION] = { visible: true, enabled: true };
  }

  const showObjectInheritance =
    project.mediaType === "video" && sceneCount > 1 && (isContinuous || isEdited);
  if (showObjectInheritance) {
    result.fieldStates[FIELD_KEYS.SCENE_OBJECT_INHERITANCE] = { visible: true, enabled: true };
  }

  return result;
}
