/**
 * Hook: field visibility/enabled state from rules engine.
 *
 * Input: fieldKey, optional ruleResult (defaults to RuleResultContext).
 * Output: { visible, enabled, reason?, required? }.
 *
 * Requires RuleResultProvider when using Project-based flow (Pro workspace).
 */

import { useMemo } from "react";
import type { RuleEngineResult } from "../rules/ruleTypes";
import type { FieldKey } from "../rules/fieldKeys";
import { useRuleResult } from "../contexts/RuleResultContext";

const defaultState = { visible: true, enabled: true };

export function useFieldState(
  fieldKey: FieldKey,
  ruleResult?: RuleEngineResult | null
): { visible: boolean; enabled: boolean; reason?: string; required?: boolean } {
  const fromContext = useRuleResult();
  const result = ruleResult ?? fromContext;
  return useMemo(() => {
    if (!result) return defaultState;
    return result.fieldStates[fieldKey] ?? defaultState;
  }, [fieldKey, result]);
}
