/**
 * Hook: field visibility/enabled state.
 * Minimal implementation: always returns visible/enabled when rule engine is not available.
 */

import { useMemo } from "react";
import type { FieldKey } from "../rules/fieldKeys";

const defaultState = { visible: true, enabled: true };

export function useFieldState(
  _fieldKey: FieldKey
): { visible: boolean; enabled: boolean; reason?: string; required?: boolean } {
  return useMemo(() => defaultState, []);
}
