/**
 * Template search hook - search query and handlers.
 */

import { useCallback } from "react";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";

export function useTemplateSearch(
  state: TemplateWorkspaceState,
  onStateChange: (s: TemplateWorkspaceState) => void
) {
  const setSearchQuery = useCallback(
    (q: string) => onStateChange({ ...state, searchQuery: q }),
    [state, onStateChange]
  );

  return { searchQuery: state.searchQuery, setSearchQuery };
}
