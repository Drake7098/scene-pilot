/**
 * Template grid/list view - uses TemplateIndex.
 * Passes subTask sceneHints down to each TemplateCard so the card can show
 * concrete scene examples instead of a generic description.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";
import { TemplateCard, isUserPrivateTemplate } from "./TemplateCard";
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
  /** 当前子任务的场景提示，透传给每张 TemplateCard */
  sceneHintsZh?: string[];
  sceneHintsEn?: string[];
};

export function TemplateWorkspaceGrid({
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
  sceneHintsEn,
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

  function renderCard(item: TemplateIndex | UserPrivateTemplate) {
    return (
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
    );
  }

  return (
    <div style={styles.wrap}>
      <style>{`
        .template-grid-toolbar-btn {
          transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .template-grid-toolbar-btn:hover {
          background: ${colors.buttonHover} !important;
          border-color: ${colors.buttonBorder} !important;
          color: ${colors.text} !important;
        }
        .template-grid-toolbar-btn--active:hover {
          background: ${colors.buttonHover} !important;
          border-color: ${colors.buttonBorder} !important;
          color: ${colors.accent} !important;
        }
        .template-grid-toolbar-btn:focus,
        .template-grid-toolbar-btn:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <div style={styles.toolbar}>
        {canToggleExpanded ? (
          <button type="button" className="template-grid-toolbar-btn" style={styles.expandBtn} onClick={onToggleExpanded} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {expanded ? t("收起默认推荐", "Collapse") : t(`展开更多 (${hiddenCount})`, `Show More (${hiddenCount})`)}
          </button>
        ) : null}
      </div>

      <div style={view === "grid" ? styles.grid : styles.list}>
        {items.length === 0 ? (
          <div style={styles.empty}>{t("暂无模板", "No templates")}</div>
        ) : view === "list" ? (
          items.map((item) => renderCard(item))
        ) : (() => {
          // 按 family 分组
          const groups: Array<{ familyId: string; familyName: string; items: typeof items }> = [];
          const seen = new Map<string, number>();
          for (const item of items) {
            const familyId = isUserPrivateTemplate(item)
              ? "__mine__"
              : (item as TemplateIndex).familyId ?? "__other__";
            const familyName = isUserPrivateTemplate(item)
              ? t("我的模板", "My Templates")
              : ((lang === "zh"
                  ? (item as TemplateIndex).familyNameZh
                  : (item as TemplateIndex).familyNameEn)
                ?? familyId);
            if (seen.has(familyId)) {
              groups[seen.get(familyId)!].items.push(item);
            } else {
              seen.set(familyId, groups.length);
              groups.push({ familyId, familyName, items: [item] });
            }
          }
          return groups.map((group) => (
            <div key={group.familyId} style={styles.familyGroup}>
              <div style={styles.familyGroupTitle}>{group.familyName}</div>
              <div style={styles.familyGroupGrid}>
                {group.items.map((item) => renderCard(item))}
              </div>
            </div>
          ));
        })()}
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
  familyGroup: {
    marginBottom: 20
  },
  familyGroupTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "6px 0 8px",
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: 10
  },
  familyGroupGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 10
  },
  grid: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 12px 24px",
    display: "block"
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
