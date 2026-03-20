/**
 * Template Workspace - standalone feature module.
 * View: market (全部模板) | my_templates (我的模板). My: owned | created.
 */

import React, { useCallback, useEffect, useMemo } from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";
import type { ApplyTemplateMode } from "../model/templateFilter";
import { useTemplateWorkspace } from "../hooks/useTemplateWorkspace";
import { useTemplateFavorites } from "../hooks/useTemplateFavorites";
import { useTemplatePricingMap } from "../hooks/useTemplatePricingMap";
import { addToRecent } from "../../../data/templateWorkspaceData";
import { getUserPrivateTemplates } from "../../../lib/userTemplatesStore";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { isUserPrivateTemplate } from "./TemplateCard";
import { TemplateWorkspaceHeader } from "./TemplateWorkspaceHeader";
import { TemplateGridContainer } from "./TemplateGridContainer";
import { TemplateWorkspaceDetail } from "./TemplateWorkspaceDetail";
import { getIntentMeta, getSubTaskMeta } from "../model/templateIntent";

import { editorTheme } from "../../../theme/editorTheme";

const colors = editorTheme.colors;

export type TemplateWorkspaceProps = {
  lang: Lang;
  state: TemplateWorkspaceState;
  onStateChange: React.Dispatch<React.SetStateAction<TemplateWorkspaceState>>;
  onClose: () => void;
  onUseTemplate: (index: TemplateIndex | UserPrivateTemplate, applyMode: ApplyTemplateMode) => void;
  project?: import("../../../model").Project | null;
  userCredits?: number;
  /** For owned badge and no repeat charge. */
  userId?: string | null;
  isTemplateOwned?: (templateId: string) => boolean;
  /** Increment to refresh "我创建的" list (e.g. after save as template). */
  templatesRefresh?: number;
};

export function TemplateWorkspace({
  lang,
  state,
  onStateChange,
  onClose,
  onUseTemplate,
  project = null,
  userCredits = 0,
  userId = null,
  isTemplateOwned,
  templatesRefresh = 0
}: TemplateWorkspaceProps) {
  const { indexList, displayList: limitedMarketList, canToggleExpanded, hiddenCount, stats } = useTemplateWorkspace(state);
  const { toggleFavorite, isFavorite } = useTemplateFavorites();
  const createdList = useMemo(
    () => getUserPrivateTemplates(userId ?? ""),
    [userId, templatesRefresh]
  );
  const ownedFiltered = useMemo(
    () =>
      indexList.filter(
        (t) => t.isFree || (isTemplateOwned?.(t.id) ?? false)
      ),
    [indexList, isTemplateOwned]
  );
  const displayList = useMemo(() => {
    if (state.templateWorkspaceView === "market") return limitedMarketList;
    if (state.myTemplateSection === "owned") return ownedFiltered;
    return createdList;
  }, [state.templateWorkspaceView, state.myTemplateSection, limitedMarketList, ownedFiltered, createdList]);
  const pricingMap = useTemplatePricingMap(
    displayList.filter((i): i is TemplateIndex => !isUserPrivateTemplate(i)).map((i) => i.id)
  );
  const selectedDetailTemplate = useMemo((): TemplateIndex | UserPrivateTemplate | null => {
    const id = state.selectedTemplateId;
    if (!id) return null;
    if (state.templateWorkspaceView === "my_templates" && state.myTemplateSection === "created") {
      return createdList.find((t) => t.id === id) ?? null;
    }
    return indexList.find((t) => t.id === id) ?? null;
  }, [state.selectedTemplateId, state.templateWorkspaceView, state.myTemplateSection, indexList, createdList]);
  const update = useCallback(
    (patch: Partial<TemplateWorkspaceState>) => {
      onStateChange((prev) => ({ ...prev, ...patch }));
    },
    [onStateChange]
  );

  const handleUse = useCallback(
    (template?: TemplateIndex | UserPrivateTemplate) => {
      const target = template ?? selectedDetailTemplate;
      if (target) {
        if (!isUserPrivateTemplate(target)) addToRecent(target.id);
        onUseTemplate(target, state.applyMode);
        onClose();
      }
    },
    [selectedDetailTemplate, state.applyMode, onUseTemplate, onClose]
  );
  const currentSubTaskMeta = useMemo(
    () =>
      state.selectedIntentId && state.selectedSubTaskId
        ? getSubTaskMeta(state.selectedIntentId, state.selectedSubTaskId)
        : undefined,
    [state.selectedIntentId, state.selectedSubTaskId]
  );

  useEffect(() => {
    if (displayList.length === 0) return;
    const hasSelected = state.selectedTemplateId && displayList.some((item) => item.id === state.selectedTemplateId);
    if (!hasSelected) {
      onStateChange((prev) => ({ ...prev, selectedTemplateId: displayList[0]?.id ?? null }));
    }
  }, [displayList, state, onStateChange]);

  return (
    <div style={styles.wrap}>
      <TemplateWorkspaceHeader
        lang={lang}
        templateWorkspaceView={state.templateWorkspaceView}
        onPrimaryTabChange={(tab) => {
          if (tab === "mine") {
            update({
              templateWorkspaceView: "my_templates",
              myTemplateSection: "owned",
              selectedTemplateId: null,
              selectedFamilyId: null,
              selectedIntentId: null,
              selectedSubTaskId: null,
              selectedCategory: null,
              searchQuery: "",
              filters: { mediaType: "all", storyPlan: "all", ratio: "all", pricing: "all", industry: "all" }
            });
            return;
          }
          if (tab === "all") {
            update({
              templateWorkspaceView: "market",
              selectedTemplateId: null,
              selectedFamilyId: null,
              selectedIntentId: null,
              selectedSubTaskId: null,
              selectedCategory: null,
              scope: "all",
              searchQuery: "",
              filters: { mediaType: "all", storyPlan: "all", ratio: "all", pricing: "all", industry: "all" },
              showAllTemplatesInSubTask: false
            });
            return;
          }
          if (tab === "daily") {
            const nextDailyIntent =
              state.selectedIntentId && state.selectedIntentId !== "pro_workflows"
                ? state.selectedIntentId
                : "sell_product";
            update({
              templateWorkspaceView: "market",
              selectedTemplateId: null,
              selectedFamilyId: null,
              selectedIntentId: nextDailyIntent,
              selectedSubTaskId: null,
              selectedCategory: null,
              scope: "all",
              searchQuery: "",
              filters: { mediaType: "all", storyPlan: "all", ratio: "all", pricing: "all", industry: "all" },
              showAllTemplatesInSubTask: false
            });
            return;
          }
          const firstProSubTask = getIntentMeta("pro_workflows")?.subTasks[0]?.id ?? null;
          update({
            templateWorkspaceView: "market",
            selectedTemplateId: null,
            selectedFamilyId: null,
            selectedIntentId: "pro_workflows",
            selectedSubTaskId: state.selectedIntentId === "pro_workflows" ? state.selectedSubTaskId : firstProSubTask,
            selectedCategory: null,
            scope: "all",
            searchQuery: "",
            filters: { mediaType: "all", storyPlan: "all", ratio: "all", pricing: "all", industry: "all" },
            showAllTemplatesInSubTask: false
          });
        }}
        myTemplateSection={state.myTemplateSection}
        onMyTemplateSectionChange={(s) => update({ myTemplateSection: s, selectedTemplateId: null })}
        selectedIntentId={state.selectedIntentId}
        selectedSubTaskId={state.selectedSubTaskId}
        onIntentChange={(intentId) => update({
          templateWorkspaceView: "market",
          selectedIntentId: intentId,
          selectedSubTaskId: null,
          scope: "all",
          selectedCategory: null,
          selectedFamilyId: null,
          selectedTemplateId: null,
          searchQuery: "",
          showAllTemplatesInSubTask: false,
          filters: { ...state.filters, mediaType: "all", storyPlan: "all", ratio: "all", pricing: "all", industry: "all" }
        })}
        onSubTaskChange={(subTaskId) => update({ selectedSubTaskId: subTaskId, selectedTemplateId: null, selectedFamilyId: null, showAllTemplatesInSubTask: false })}
        onFamilyChange={(familyId) => update({ selectedFamilyId: familyId, selectedTemplateId: null, showAllTemplatesInSubTask: false })}
        searchQuery={state.searchQuery}
        onSearchChange={(q) => update({ searchQuery: q, selectedTemplateId: null, selectedFamilyId: null, showAllTemplatesInSubTask: false })}
        view={state.view}
        onViewChange={(v) => update({ view: v })}
        filters={state.filters}
        onFiltersChange={(f) => update({ filters: f, selectedTemplateId: null, selectedFamilyId: null, showAllTemplatesInSubTask: false })}
        onClose={onClose}
        visibleCount={displayList.length}
        totalCount={stats.total}
        freeCount={stats.free}
        ownedCount={ownedFiltered.length}
        createdCount={createdList.length}
      />
      <div style={styles.body}>
        <TemplateGridContainer
          lang={lang}
          items={displayList}
          view={state.view}
          selectedId={state.selectedTemplateId}
          onSelect={(id) => update({ selectedTemplateId: id })}
          onUse={(item) => handleUse(item)}
          clickToUse={false}
          showSelectedState={true}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          canToggleExpanded={state.templateWorkspaceView === "market" && canToggleExpanded}
          expanded={state.showAllTemplatesInSubTask}
          hiddenCount={hiddenCount}
          onToggleExpanded={() => update({ showAllTemplatesInSubTask: !state.showAllTemplatesInSubTask })}
          pricingMap={pricingMap}
          isTemplateOwned={isTemplateOwned}
          sceneHintsZh={currentSubTaskMeta?.sceneHintsZh}
          sceneHintsEn={currentSubTaskMeta?.sceneHintsEn}
        />
        <TemplateWorkspaceDetail
          lang={lang}
          template={selectedDetailTemplate}
          applyMode={state.applyMode}
          onApplyModeChange={(m) => update({ applyMode: m })}
          onUse={() => handleUse()}
          isFavorite={selectedDetailTemplate && !isUserPrivateTemplate(selectedDetailTemplate) ? isFavorite(selectedDetailTemplate.id) : false}
          onToggleFavorite={toggleFavorite}
          project={project}
          userCredits={userCredits}
          isTemplateOwned={isTemplateOwned}
          relatedTemplates={
            selectedDetailTemplate &&
            !isUserPrivateTemplate(selectedDetailTemplate)
              ? indexList.filter(
                  (t) => t.familyId === (selectedDetailTemplate as TemplateIndex).familyId && t.id !== selectedDetailTemplate.id
                ).slice(0, 4)
              : []
          }
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    background: colors.bg,
    overflow: "hidden"
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex"
  }
};
