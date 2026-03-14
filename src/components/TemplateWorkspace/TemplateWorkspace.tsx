import React, { useMemo, useState, useCallback } from "react";
import type { Lang } from "../../i18n";
import {
  getTemplateWorkspaceItems,
  filterTemplates,
  addToRecent,
  toggleFavorite,
  isFavorite,
  getTemplateStats,
  type TemplateWorkspaceScope,
  type TemplateWorkspaceFilters,
  type ApplyTemplateMode,
  type TemplateWorkspaceItem
} from "../../data/templateWorkspaceData";
import { TemplateWorkspaceTopBar } from "./TemplateWorkspaceTopBar";
import { TemplateWorkspaceNav } from "./TemplateWorkspaceNav";
import { TemplateWorkspaceGrid } from "./TemplateWorkspaceGrid";
import { TemplateWorkspaceDetail } from "./TemplateWorkspaceDetail";

const colors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46"
};

export type TemplateWorkspaceState = {
  view: "grid" | "list";
  scope: TemplateWorkspaceScope;
  selectedCategory: string | null;
  selectedTemplateId: string | null;
  searchQuery: string;
  filters: TemplateWorkspaceFilters;
  applyMode: ApplyTemplateMode;
};

type Props = {
  lang: Lang;
  state: TemplateWorkspaceState;
  onStateChange: (s: TemplateWorkspaceState) => void;
  onClose: () => void;
  onUseTemplate: (item: TemplateWorkspaceItem, applyMode: ApplyTemplateMode) => void;
};

export function TemplateWorkspace({
  lang,
  state,
  onStateChange,
  onClose,
  onUseTemplate
}: Props) {
  const items = useMemo(() => getTemplateWorkspaceItems(), []);
  const stats = useMemo(() => getTemplateStats(), []);
  const filtered = useMemo(
    () =>
      filterTemplates(
        items,
        state.scope,
        state.selectedCategory,
        state.filters,
        state.searchQuery
      ),
    [items, state.scope, state.selectedCategory, state.filters, state.searchQuery]
  );
  const selectedTemplate = useMemo(
    () => (state.selectedTemplateId ? items.find((t) => t.id === state.selectedTemplateId) ?? null : null),
    [items, state.selectedTemplateId]
  );

  const update = (patch: Partial<TemplateWorkspaceState>) => {
    onStateChange({ ...state, ...patch });
  };

  const [favVersion, setFavVersion] = useState(0);
  const handleToggleFavorite = useCallback((templateId: string) => {
    toggleFavorite(templateId);
    setFavVersion((v) => v + 1);
  }, []);

  const handleUse = (template?: TemplateWorkspaceItem) => {
    const target = template ?? selectedTemplate;
    if (target) {
      addToRecent(target.id);
      onUseTemplate(target, state.applyMode);
      onClose();
    }
  };

  return (
    <div style={styles.wrap}>
      <TemplateWorkspaceTopBar
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
        <TemplateWorkspaceNav
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
          onToggleFavorite={handleToggleFavorite}
        />
        <TemplateWorkspaceDetail
          lang={lang}
          template={selectedTemplate}
          applyMode={state.applyMode}
          onApplyModeChange={(m) => update({ applyMode: m })}
          onUse={() => handleUse()}
          isFavorite={selectedTemplate ? isFavorite(selectedTemplate.id) : false}
          onToggleFavorite={handleToggleFavorite}
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
