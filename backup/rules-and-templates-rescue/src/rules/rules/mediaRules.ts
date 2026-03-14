/**
 * Media type rules (image vs video).
 */

import { FIELD_KEYS } from "../fieldKeys";
import type { RuleContext, RuleEngineResult } from "../ruleTypes";

export function applyMediaRules(ctx: RuleContext): RuleEngineResult {
  const result: RuleEngineResult = {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };

  const { project, scene, selectedObject, exportConfig } = ctx;
  const isImage = project.mediaType === "image";

  if (!scene) return result;

  if (isImage) {
    result.fieldStates[FIELD_KEYS.SCENE_DURATION] = {
      visible: false,
      enabled: false,
      reason: "图片模式不使用分镜时长",
    };
    result.fieldStates[FIELD_KEYS.SCENE_CAMERA_MOVE_MODE] = {
      visible: false,
      enabled: false,
      reason: "图片模式不支持连续运镜",
    };
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
    result.fieldStates[FIELD_KEYS.SCENE_IMAGE_PRO_EFFECTS] = {
      visible: true,
      enabled: true,
    };
    result.fieldStates[FIELD_KEYS.OBJECT_T1] = {
      visible: false,
      enabled: false,
      reason: "图片模式仅支持起点构图",
    };

    const scenePath =
      ctx.sceneIndex >= 0 ? `scenes[${ctx.sceneIndex}]` : "scene";
    const classicMotion = (scene.classicMotion ?? "static").toString().toLowerCase();
    if (classicMotion && classicMotion !== "static") {
      result.patches.push({
        path: `${scenePath}.classicMotion`,
        value: "static",
        reason: "图片模式下运镜已改为 static",
      });
      result.warnings.push("已切换为图片模式：运镜已自动改为静态。");
    }

    if (scene.proMotions && scene.proMotions.length > 0) {
      result.patches.push({
        path: `${scenePath}.proMotions`,
        value: [],
        reason: "图片模式不支持 Pro 运镜",
      });
    }

    if (exportConfig.range === "continuous_sequence") {
      result.patches.push({
        path: "exportConfig.range",
        value: "current_scene",
        reason: "图片模式不能导出连续序列",
      });
    }

    if (selectedObject?.t1 && scene.objects) {
      const objIdx = scene.objects.findIndex((o: { id: string }) => o.id === selectedObject.id);
      if (objIdx >= 0 && ctx.sceneIndex >= 0) {
        result.patches.push({
          path: `scenes[${ctx.sceneIndex}].objects[${objIdx}].t1`,
          value: null,
          reason: "图片模式忽略终点关键帧",
        });
      }
    }
  } else {
    result.fieldStates[FIELD_KEYS.SCENE_DURATION] = { visible: true, enabled: true };
    result.fieldStates[FIELD_KEYS.OBJECT_T1] = { visible: true, enabled: true };
  }

  return result;
}
