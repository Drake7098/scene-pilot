/**
 * Hook: allowed options with enabled/reason per value from rules engine.
 *
 * Input: fieldKey, allOptions, optional ruleResult (defaults to RuleResultContext).
 * Output: [{ value, enabled, reason? }].
 *
 * Requires RuleResultProvider when using Project-based flow (Pro workspace).
 */

import { useMemo } from "react";
import type { RuleEngineResult } from "../rules/ruleTypes";
import type { FieldKey } from "../rules/fieldKeys";
import { useRuleResult } from "../contexts/RuleResultContext";

export function useAllowedOptions<T extends string>(
  fieldKey: FieldKey,
  allOptions: T[],
  ruleResult?: RuleEngineResult | null
): Array<{ value: T; enabled: boolean; reason?: string }> {
  const fromContext = useRuleResult();
  const result = ruleResult ?? fromContext;
  return useMemo(() => {
    if (!result) {
      return allOptions.map((value) => ({ value, enabled: true }));
    }
    const optionStates = result.optionStates[fieldKey] ?? [];
    const map = new Map(optionStates.map((o) => [o.value, o]));
    return allOptions.map((value) => {
      const hit = map.get(value);
      return {
        value,
        enabled: hit?.enabled ?? true,
        reason: hit?.reason,
      };
    });
  }, [fieldKey, allOptions.join(","), result]);
}
