/**
 * Virtualized template grid - reserved for 1000+ scaling.
 * Phase 1: delegates to same render as TemplateWorkspaceGrid (passthrough).
 * Phase 2: integrate react-window / react-virtualized for viewport-based slice.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";
import { TemplateCard, isUserPrivateTemplate } from "./TemplateCard";
import { useVirtualizedTemplateGrid } from "../hooks/useVirtualizedTemplateGrid";
import { PRO_TYPO } from "../../../uiTokens";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";

const colors = TEMPLATE_WORKSPACE_UI.colors;

type Props = {
  lang: Lang;
  items: (TemplateIndex | UserPrivateTemplate)[];
  view: "grid" | "list";
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex | UserPrivateTemplate) => void;
  clickToUse?: boolean;
  showSelectedState?: boolean;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  canToggleExpanded?: boolean;
  expanded?: boolean;
  hiddenCount?: number;
  onToggleExpanded?: () => void;
  pricingMap?: Record<string, TemplatePricingResult | null>;
  isTemplateOwned?: (templateId: string) => boolean;
  sceneHintsZh?: string[];
  sceneHintsEn?: string[];
};

export function TemplateWorkspaceGridVirtual({
  lang,
  items,
  view,
  selectedId,
  onSelect,
  onUse,
  clickToUse = false,
  showSelectedState = true,
  isFavorite,
  onToggleFavorite,
  canToggleExpanded = false,
  expanded = false,
  hiddenCount = 0,
  onToggleExpanded,
  pricingMap = {},
  isTemplateOwned,
  sceneHintsZh,
  sceneHintsEn
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const blurButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.requestAnimationFrame(() => {
      event.currentTarget.blur();
    });
  };
  const preventMouseFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const { visibleItems, containerRef } = useVirtualizedTemplateGrid({ items });

  return (
    <div style={styles.wrap} ref={containerRef}>
      <style>{`
        .template-grid-virtual-toolbar-btn {
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .template-grid-virtual-toolbar-btn:hover {
          background: ${colors.buttonHover} !important;
          border-color: ${colors.buttonBorder} !important;
          color: ${colors.text} !important;
        }
        .template-grid-virtual-toolbar-btn--active:hover {
          background: ${colors.buttonHover} !important;
          border-color: ${colors.buttonBorder} !important;
          color: ${colors.accent} !important;
        }
        .template-grid-virtual-toolbar-btn:focus,
        .template-grid-virtual-toolbar-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <div style={styles.toolbar}>
        {canToggleExpanded ? (
          <button type="button" className="template-grid-virtual-toolbar-btn" style={styles.expandBtn} onClick={onToggleExpanded} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {expanded ? t("收起默认推荐", "Collapse") : t(`展开更多 (${hiddenCount})`, `Show More (${hiddenCount})`)}
          </button>
        ) : null}
      </div>
      <div style={view === "grid" ? styles.grid : styles.list}>
        {visibleItems.length === 0 ? (
          <div style={styles.empty}>{t("暂无模板", "No templates")}</div>
        ) : (
          visibleItems.map((item) => (
            <TemplateCard
              key={item.id}
              lang={lang}
              item={item}
              view={view}
              selected={selectedId === item.id}
              showSelectedState={showSelectedState}
              onSelect={() => onSelect(item.id)}
              onUse={onUse ? () => onUse(item) : undefined}
              clickToUse={clickToUse}
              isFavorite={isFavorite?.(item.id)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
              pricing={pricingMap[item.id] ?? null}
              owned={isUserPrivateTemplate(item) || (isTemplateOwned?.(item.id) ?? false)}
              sceneHintsZh={sceneHintsZh}
              sceneHintsEn={sceneHintsEn}
            />
          ))
        )}
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
    overflow: "hidden"
  },
  toolbar: {
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  expandBtn: {
    minHeight: 36,
    padding: "6px 10px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.textMuted,
    cursor: "pointer",
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    fontWeight: 600,
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent"
  },
  grid: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily
  }
};
