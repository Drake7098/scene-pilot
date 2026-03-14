/**
 * Export rules (range, target compatibility).
 */

import { FIELD_KEYS } from "../fieldKeys";
import { targetSupportsMedia } from "../capabilities";
import type { RuleContext, RuleEngineResult } from "../ruleTypes";

export function applyExportRules(ctx: RuleContext): RuleEngineResult {
  const result: RuleEngineResult = {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };

  const { project, sceneCount } = ctx;
  const isImage = project.mediaType === "image";
  const isSingle = project.storyPlan === "single";
  const allowContinuous =
    !isImage && sceneCount > 1 && !isSingle;

  if (!allowContinuous && ctx.exportConfig.range === "continuous_sequence") {
    result.patches.push({
      path: "exportConfig.range",
      value: "current_scene",
      reason: "当前条件不支持连续序列导出",
    });
    result.warnings.push("已自动切换为当前分镜导出");
  }

  const targetOk = targetSupportsMedia(ctx.exportConfig.target, project.mediaType);
  if (!targetOk) {
    result.patches.push({
      path: "exportConfig.target",
      value: "universal",
      reason: "当前目标不支持当前媒体类型",
    });
    result.warnings.push(
      `当前导出目标不支持${isImage ? "图片" : "视频"}：已切回 Universal`
    );
  }

  result.optionStates[FIELD_KEYS.EXPORT_RANGE] = [
    { value: "current_scene" as const, enabled: true },
    {
      value: "continuous_sequence" as const,
      enabled: allowContinuous,
      reason: allowContinuous ? undefined : "仅视频多分镜可用",
    },
  ];

  const allTargets = ["universal", "fal", "midjourney", "runway", "jimeng", "pika", "luma", "krea", "keling", "vidu", "hailuo", "wanx"] as const;
  result.optionStates[FIELD_KEYS.EXPORT_TARGET] = allTargets.map((t) => ({
    value: t,
    enabled: targetSupportsMedia(t, project.mediaType),
    reason: targetSupportsMedia(t, project.mediaType) ? undefined : `当前目标不支持${isImage ? "图片" : "视频"}`,
  }));

  return result;
}
