/**
 * Hook: allowed options with enabled/reason per value.
 * Minimal implementation: all options enabled when rule engine is not available.
 */

import { useMemo } from "react";
import type { FieldKey } from "../rules/fieldKeys";

export function useAllowedOptions<T extends string>(
  _fieldKey: FieldKey,
  allOptions: T[]
): Array<{ value: T; enabled: boolean; reason?: string }> {
  return useMemo(
    () => allOptions.map((value) => ({ value, enabled: true })),
    [allOptions.join(",")]
  );
}
