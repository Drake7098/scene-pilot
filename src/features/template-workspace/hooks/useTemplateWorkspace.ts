/**
 * Main template workspace hook - index, filtered list, selection.
 */

import { useMemo } from "react";
import { getTemplateIndex } from "../data/templateIndexData";
import { filterTemplateIndex } from "../services/templateSearchService";
import { getTemplatesForSubTask } from "../model/templateIntent";
import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";

export function useTemplateWorkspace(state: TemplateWorkspaceState) {
  const indexList = useMemo(() => getTemplateIndex(), []);
  const intentFiltered = useMemo(() => {
    return filterTemplateIndex(
      indexList,
      state.scope,
      state.selectedIntentId,
      null,
      state.selectedCategory,
      state.filters,
      state.searchQuery
    );
  }, [indexList, state.scope, state.selectedIntentId, state.selectedCategory, state.filters, state.searchQuery]);
  const filteredBeforeFamily = useMemo(() => {
    if (state.selectedIntentId && state.selectedSubTaskId) {
      const subTaskItems = getTemplatesForSubTask(intentFiltered, state.selectedIntentId, state.selectedSubTaskId);
      const ids = new Set(subTaskItems.map((item) => item.id));
      return intentFiltered.filter((item) => ids.has(item.id));
    }
    return intentFiltered;
  }, [intentFiltered, state.selectedIntentId, state.selectedSubTaskId]);
  const filtered = useMemo(() => {
    if (state.selectedFamilyId) {
      return filteredBeforeFamily.filter((t) => t.familyId === state.selectedFamilyId);
    }
    return filteredBeforeFamily;
  }, [filteredBeforeFamily, state.selectedFamilyId]);
  const displayList = useMemo(() => filtered, [filtered]);
  const selectedTemplate = useMemo(
    () =>
      state.selectedTemplateId
        ? indexList.find((t) => t.id === state.selectedTemplateId) ?? null
        : null,
    [indexList, state.selectedTemplateId]
  );

  return {
    indexList,
    intentFiltered,
    filteredBeforeFamily,
    filtered,
    displayList,
    selectedTemplate,
    canToggleExpanded: false,
    isDefaultLimited: false,
    hiddenCount: 0,
    stats: useMemo(
      () => ({
        total: indexList.length,
        free: indexList.filter((t) => t.isFree).length
      }),
      [indexList]
    )
  };
}
