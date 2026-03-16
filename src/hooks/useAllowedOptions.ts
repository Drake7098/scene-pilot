/**
 * Hook: allowed options with enabled/reason per value.
 *
 * 替换原来的 stub，真正连接 sceneFieldRules 引擎。
 * 对 proMotions / imageProEffects 字段走专用 option-level rules；
 * 其他字段默认全部开启（但字段本身可能被 useFieldState 整体禁用）。
 *
 * 用法：
 *   const options = useAllowedOptions(
 *     FIELD_KEYS.SCENE_PRO_MOTIONS,
 *     allProMotionIds,
 *     scene,
 *     project,
 *     lang
 *   );
 */

import { useMemo } from "react";
import type { Project, Scene } from "../model";
import type { Lang } from "../i18n";
import type { FieldKey } from "../rules/fieldKeys";
import { FIELD_KEYS } from "../rules/fieldKeys";
import {
  buildProMotionOptionRules,
  buildImageProEffectOptionRules,
} from "../rules/sceneFieldRules";

export function useAllowedOptions<T extends string>(
  fieldKey: FieldKey,
  allOptions: T[],
  scene?: Scene | null,
  project?: Project | null,
  lang?: Lang
): Array<{ value: T; enabled: boolean; reason?: string }> {
  return useMemo(() => {
    if (!scene) {
      return allOptions.map((value) => ({ value, enabled: true }));
    }

    // proMotions：选项内部有互斥（与当前 shot/movement 组合相关）
    if (fieldKey === FIELD_KEYS.SCENE_PRO_MOTIONS) {
      const rules = buildProMotionOptionRules(scene, allOptions as string[]);
      return rules.map((r) => ({
        value: r.value as T,
        enabled: r.enabled,
        reason: lang === "zh" ? r.reasonZh : r.reasonEn,
      }));
    }

    // imageProEffects：效果之间有互斥
    if (fieldKey === FIELD_KEYS.SCENE_IMAGE_PRO_EFFECTS) {
      const rules = buildImageProEffectOptionRules(scene, allOptions as string[]);
      return rules.map((r) => ({
        value: r.value as T,
        enabled: r.enabled,
        reason: lang === "zh" ? r.reasonZh : r.reasonEn,
      }));
    }

    // 其他字段：所有选项默认可用
    return allOptions.map((value) => ({ value, enabled: true }));
  }, [
    fieldKey,
    allOptions.join(","),
    scene?.notes,
    scene?.camera?.shot,
    scene?.camera?.movement,
    scene?.config?.mediaMode,
    lang,
  ]);
}
