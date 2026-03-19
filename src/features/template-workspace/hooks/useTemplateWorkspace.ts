/**
 * Main template workspace hook - index, filtered list, selection.
 */

import { useMemo, useCallback } from "react";
import { getTemplateIndex } from "../data/templateIndexData";
import { filterTemplateIndex } from "../services/templateSearchService";
import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";

export function useTemplateWorkspace(state: TemplateWorkspaceState) {
  const indexList = useMemo(() => getTemplateIndex(), []);
  const filteredBeforeFamily = useMemo(() => {
    return filterTemplateIndex(
      indexList,
      state.scope,
      state.selectedIntentId,
      state.selectedCategory,
      state.filters,
      state.searchQuery
    );
  }, [indexList, state.scope, state.selectedIntentId, state.selectedCategory, state.filters, state.searchQuery]);
  const filtered = useMemo(() => {
    if (state.selectedFamilyId) {
      return filteredBeforeFamily.filter((t) => t.familyId === state.selectedFamilyId);
    }
    return filteredBeforeFamily;
  }, [filteredBeforeFamily, state.selectedFamilyId]);
  const selectedTemplate = useMemo(
    () =>
      state.selectedTemplateId
        ? indexList.find((t) => t.id === state.selectedTemplateId) ?? null
        : null,
    [indexList, state.selectedTemplateId]
  );

  return {
    indexList,
    filteredBeforeFamily,
    filtered,
    selectedTemplate,
    stats: useMemo(
      () => ({
        total: indexList.length,
        free: indexList.filter((t) => t.isFree).length
      }),
      [indexList]
    )
  };
}
