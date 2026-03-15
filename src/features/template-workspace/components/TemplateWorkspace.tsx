/**
 * Template Workspace - standalone feature module.
 * View: market (全部模板) | my_templates (我的模板). My: owned | created.
 */

import React, { useCallback, useMemo } from "react";
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
import { TemplateFamilyList } from "./TemplateFamilyList";
import { TemplateGridContainer } from "./TemplateGridContainer";
import { TemplateWorkspaceDetail } from "./TemplateWorkspaceDetail";

import { editorTheme } from "../../../theme/editorTheme";

const colors = editorTheme.colors;

export type TemplateWorkspaceProps = {
  lang: Lang;
  state: TemplateWorkspaceState;
  onStateChange: (s: TemplateWorkspaceState) => void;
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
  const { indexList, filtered, selectedTemplate: selectedMarketTemplate, stats } = useTemplateWorkspace(state);
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
    if (state.templateWorkspaceView === "market") return filtered;
    if (state.myTemplateSection === "owned") return ownedFiltered;
    return createdList;
  }, [state.templateWorkspaceView, state.myTemplateSection, filtered, ownedFiltered, createdList]);
  const pricingMap = useTemplatePricingMap(
    displayList.filter((i): i is TemplateIndex => !isUserPrivateTemplate(i)).map((i) => i.id)
  );
  const selectedTemplate = useMemo((): TemplateIndex | UserPrivateTemplate | null => {
    const id = state.selectedTemplateId;
    if (!id) return null;
    if (state.templateWorkspaceView === "my_templates" && state.myTemplateSection === "created") {
      return createdList.find((t) => t.id === id) ?? null;
    }
    return indexList.find((t) => t.id === id) ?? null;
  }, [state.selectedTemplateId, state.templateWorkspaceView, state.myTemplateSection, indexList, createdList]);

  const update = useCallback(
    (patch: Partial<TemplateWorkspaceState>) => {
      onStateChange({ ...state, ...patch });
    },
    [state, onStateChange]
  );

  const handleUse = useCallback(
    (template?: TemplateIndex | UserPrivateTemplate) => {
      const target = template ?? selectedTemplate;
      if (target) {
        if (!isUserPrivateTemplate(target)) addToRecent(target.id);
        onUseTemplate(target, state.applyMode);
        onClose();
      }
    },
    [selectedTemplate, state.applyMode, onUseTemplate, onClose]
  );

  return (
    <div style={styles.wrap}>
      <TemplateWorkspaceHeader
        lang={lang}
        templateWorkspaceView={state.templateWorkspaceView}
        onTemplateWorkspaceViewChange={(v) => update({ templateWorkspaceView: v })}
        myTemplateSection={state.myTemplateSection}
        onMyTemplateSectionChange={(s) => update({ myTemplateSection: s })}
        searchQuery={state.searchQuery}
        onSearchChange={(q) => update({ searchQuery: q })}
        filters={state.filters}
        onFiltersChange={(f) => update({ filters: f })}
        onClose={onClose}
        totalCount={stats.total}
        freeCount={stats.free}
        ownedCount={ownedFiltered.length}
        createdCount={createdList.length}
      />
      <div style={styles.body}>
        <TemplateFamilyList
          lang={lang}
          items={state.templateWorkspaceView === "market" ? indexList : []}
          selectedFamilyId={state.selectedFamilyId}
          onSelectFamily={(id) => update({ selectedFamilyId: id })}
        />
        <TemplateGridContainer
          lang={lang}
          items={displayList}
          view={state.view}
          onViewChange={(v) => update({ view: v })}
          selectedId={state.selectedTemplateId}
          onSelect={(id) => update({ selectedTemplateId: id })}
          onUse={(item) => handleUse(item)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          pricingMap={pricingMap}
          isTemplateOwned={isTemplateOwned}
        />
        <TemplateWorkspaceDetail
          lang={lang}
          template={selectedTemplate}
          applyMode={state.applyMode}
          onApplyModeChange={(m) => update({ applyMode: m })}
          onUse={() => handleUse()}
          isFavorite={selectedTemplate && !isUserPrivateTemplate(selectedTemplate) ? isFavorite(selectedTemplate.id) : false}
          onToggleFavorite={toggleFavorite}
          project={project}
          userCredits={userCredits}
          isTemplateOwned={isTemplateOwned}
          relatedTemplates={
            state.templateWorkspaceView === "market" &&
            selectedTemplate &&
            !isUserPrivateTemplate(selectedTemplate)
              ? indexList.filter(
                  (t) => t.familyId === (selectedTemplate as TemplateIndex).familyId && t.id !== selectedTemplate.id
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
