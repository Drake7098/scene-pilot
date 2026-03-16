/**
 * Hook: field visibility/enabled state.
 *
 * 替换原来的 stub，真正连接 sceneFieldRules 引擎。
 *
 * 用法：
 *   const { enabled, visible, reasonZh } = useFieldState(
 *     FIELD_KEYS.SCENE_DIRECTOR_STYLE_PACK,
 *     scene,
 *     project,
 *     lang
 *   );
 */

import { useMemo } from "react";
import type { Project, Scene } from "../model";
import type { Lang } from "../i18n";
import type { FieldKey } from "../rules/fieldKeys";
import { buildSceneFieldRules } from "../rules/sceneFieldRules";

const DEFAULT = { visible: true, enabled: true };

export function useFieldState(
  fieldKey: FieldKey,
  scene?: Scene | null,
  project?: Project | null,
  lang?: Lang
): { visible: boolean; enabled: boolean; reason?: string } {
  return useMemo(() => {
    if (!scene) return DEFAULT;

    const map = buildSceneFieldRules(scene, project ?? null);
    const result = map.get(fieldKey);
    if (!result) return DEFAULT;

    const reason =
      lang === "zh" ? result.reasonZh : result.reasonEn;

    return {
      visible: result.visible,
      enabled: result.enabled,
      reason,
    };
  }, [
    fieldKey,
    // 只 depend on 影响规则的字段，避免每次 scene 引用变化都重算
    scene?.notes,
    scene?.config?.mediaMode,
    project?.project?.shotPlan,
    project?.meta?.currentTemplate?.applyMode,
    lang,
  ]);
}
