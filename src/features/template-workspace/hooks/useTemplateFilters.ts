/**
 * Template filters hook - filter state and handlers.
 */

import { useCallback } from "react";
import type { TemplateWorkspaceFilters } from "../model/templateFilter";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";

export function useTemplateFilters(
  state: TemplateWorkspaceState,
  onStateChange: (s: TemplateWorkspaceState) => void
) {
  const update = useCallback(
    (patch: Partial<TemplateWorkspaceState>) => {
      onStateChange({ ...state, ...patch });
    },
    [state, onStateChange]
  );

  const setFilters = useCallback(
    (f: TemplateWorkspaceFilters) => update({ filters: f }),
    [update]
  );

  return { filters: state.filters, setFilters, update };
}
