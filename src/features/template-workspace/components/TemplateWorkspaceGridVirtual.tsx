/**
 * Virtualized template grid - reserved for 1000+ scaling.
 * Phase 1: delegates to same render as TemplateWorkspaceGrid (passthrough).
 * Phase 2: integrate react-window / react-virtualized for viewport-based slice.
 */

import React from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";
import { TemplateCard, isUserPrivateTemplate } from "./TemplateCard";
import { useVirtualizedTemplateGrid } from "../hooks/useVirtualizedTemplateGrid";
import { PRO_TYPO } from "../../../uiTokens";

const colors = {
  bg: "#1f2125",
  border: "#3a3f46",
  hover: "#343942",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

type Props = {
  lang: Lang;
  items: (TemplateIndex | UserPrivateTemplate)[];
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUse?: (item: TemplateIndex | UserPrivateTemplate) => void;
  isFavorite?: (id: string) => boolean;
  onToggleFavorite?: (id: string) => void;
  pricingMap?: Record<string, TemplatePricingResult | null>;
  isTemplateOwned?: (templateId: string) => boolean;
};

export function TemplateWorkspaceGridVirtual({
  lang,
  items,
  view,
  onViewChange,
  selectedId,
  onSelect,
  onUse,
  isFavorite,
  onToggleFavorite,
  pricingMap = {},
  isTemplateOwned
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { visibleItems, containerRef } = useVirtualizedTemplateGrid({ items });

  return (
    <div style={styles.wrap} ref={containerRef}>
      <div style={styles.toolbar}>
        <div style={styles.viewToggle}>
          <button
            type="button"
            style={{ ...styles.viewBtn, ...(view === "grid" ? styles.viewBtnOn : {}) }}
            onClick={() => onViewChange("grid")}
            title={t("网格", "Grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            style={{ ...styles.viewBtn, ...(view === "list" ? styles.viewBtnOn : {}) }}
            onClick={() => onViewChange("list")}
            title={t("列表", "List")}
          >
            <List size={16} />
          </button>
        </div>
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
              onSelect={() => onSelect(item.id)}
              onUse={onUse ? () => onUse(item) : undefined}
              isFavorite={isFavorite?.(item.id)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
              pricing={pricingMap[item.id] ?? null}
              owned={isUserPrivateTemplate(item) || (isTemplateOwned?.(item.id) ?? false)}
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
    justifyContent: "flex-end"
  },
  viewToggle: { display: "flex", gap: 4 },
  viewBtn: {
    padding: 6,
    background: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textMuted,
    cursor: "pointer"
  },
  viewBtnOn: {
    background: colors.hover,
    color: colors.accent
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
