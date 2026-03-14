/**
 * Template Workspace - standalone feature module.
 * Manages its own search, category, detail, view. Covers Stage + Props when open.
 */

import React, { useCallback } from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateWorkspaceState } from "../state/templateWorkspaceState";
import type { ApplyTemplateMode } from "../model/templateFilter";
import { useTemplateWorkspace } from "../hooks/useTemplateWorkspace";
import { useTemplateFavorites } from "../hooks/useTemplateFavorites";
import { addToRecent } from "../../../data/templateWorkspaceData";
import { TemplateWorkspaceHeader } from "./TemplateWorkspaceHeader";
import { TemplateWorkspaceSidebar } from "./TemplateWorkspaceSidebar";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import { TemplateWorkspaceDetail } from "./TemplateWorkspaceDetail";

const colors = {
  bg: "#1f2125",
  border: "#3a3f46"
};

export type TemplateWorkspaceProps = {
  lang: Lang;
  state: TemplateWorkspaceState;
  onStateChange: (s: TemplateWorkspaceState) => void;
  onClose: () => void;
  onUseTemplate: (index: TemplateIndex, applyMode: ApplyTemplateMode) => void;
};

export function TemplateWorkspace({
  lang,
  state,
  onStateChange,
  onClose,
  onUseTemplate
}: TemplateWorkspaceProps) {
  const { filtered, selectedTemplate, stats } = useTemplateWorkspace(state);
  const { toggleFavorite, isFavorite } = useTemplateFavorites();

  const update = useCallback(
    (patch: Partial<TemplateWorkspaceState>) => {
      onStateChange({ ...state, ...patch });
    },
    [state, onStateChange]
  );

  const handleUse = useCallback(
    (template?: TemplateIndex) => {
      const target = template ?? selectedTemplate;
      if (target) {
        addToRecent(target.id);
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
        searchQuery={state.searchQuery}
        onSearchChange={(q) => update({ searchQuery: q })}
        filters={state.filters}
        onFiltersChange={(f) => update({ filters: f })}
        onClose={onClose}
        totalCount={stats.total}
        freeCount={stats.free}
      />
      <div style={styles.body}>
        <TemplateWorkspaceSidebar
          lang={lang}
          scope={state.scope}
          category={state.selectedCategory}
          onScopeChange={(s) => update({ scope: s, selectedCategory: null })}
          onCategoryChange={(c) => update({ selectedCategory: c, scope: "all" })}
        />
        <TemplateWorkspaceGrid
          lang={lang}
          items={filtered}
          view={state.view}
          onViewChange={(v) => update({ view: v })}
          selectedId={state.selectedTemplateId}
          onSelect={(id) => update({ selectedTemplateId: id })}
          onUse={(item) => handleUse(item)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
        <TemplateWorkspaceDetail
          lang={lang}
          template={selectedTemplate}
          applyMode={state.applyMode}
          onApplyModeChange={(m) => update({ applyMode: m })}
          onUse={() => handleUse()}
          isFavorite={selectedTemplate ? isFavorite(selectedTemplate.id) : false}
          onToggleFavorite={toggleFavorite}
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
