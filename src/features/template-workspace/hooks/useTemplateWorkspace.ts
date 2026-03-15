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
  const filtered = useMemo(() => {
    let list = filterTemplateIndex(
      indexList,
      state.scope,
      state.selectedCategory,
      state.filters,
      state.searchQuery
    );
    if (state.selectedFamilyId) {
      list = list.filter((t) => t.familyId === state.selectedFamilyId);
    }
    return list;
  }, [
    indexList,
    state.scope,
    state.selectedCategory,
    state.selectedFamilyId,
    state.filters,
    state.searchQuery
  ]);
  const selectedTemplate = useMemo(
    () =>
      state.selectedTemplateId
        ? indexList.find((t) => t.id === state.selectedTemplateId) ?? null
        : null,
    [indexList, state.selectedTemplateId]
  );

  return {
    indexList,
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
