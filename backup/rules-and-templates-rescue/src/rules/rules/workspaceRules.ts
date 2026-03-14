/**
 * Workspace mode rules (quick vs pro).
 */

import { FIELD_KEYS } from "../fieldKeys";
import type { RuleContext, RuleEngineResult } from "../ruleTypes";

export function applyWorkspaceRules(ctx: RuleContext): RuleEngineResult {
  const result: RuleEngineResult = {
    fieldStates: {},
    optionStates: {},
    patches: [],
    warnings: [],
  };

  const isQuick = ctx.project.workspaceMode === "quick";

  if (isQuick) {
    result.fieldStates[FIELD_KEYS.SCENE_PRO_MOTIONS] = {
      visible: false,
      enabled: false,
      reason: "Quick 模式已简化",
    };
  }

  return result;
}
