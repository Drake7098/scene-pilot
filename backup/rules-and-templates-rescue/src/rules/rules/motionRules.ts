/**
 * Motion rules (static clears proMotions, close_up disables orbit/crane).
 */

import { FIELD_KEYS } from "../fieldKeys";
import type { RuleContext, RuleEngineResult } from "../ruleTypes";

export function applyMotionRules(ctx: RuleContext): RuleEngineResult {
  const result: RuleEngineResult = {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };

  const { project, scene } = ctx;
  const isImage = project.mediaType === "image";

  if (!scene) return result;

  const classicMotion = (scene.classicMotion ?? "static").toString().toLowerCase();
  const isStaticMotion = classicMotion === "static" || classicMotion === "locked_static";

  if (isStaticMotion && scene.proMotions && scene.proMotions.length > 0) {
    result.patches.push({
      path: ctx.sceneIndex >= 0 ? `scenes[${ctx.sceneIndex}].proMotions` : "scene.proMotions",
      value: [],
      reason: "静态镜头自动清空高级运镜",
    });
    result.warnings.push("当前为静态镜头：高级运镜已自动清空");
  }

  if (isImage || isStaticMotion) {
    result.fieldStates[FIELD_KEYS.SCENE_PRO_MOTIONS] = {
      visible: true,
      enabled: false,
      reason: isImage ? "图片模式不支持视频运镜" : "静态镜头下不可用",
    };
  } else {
    result.fieldStates[FIELD_KEYS.SCENE_PRO_MOTIONS] = { visible: true, enabled: true };
  }

  return result;
}
