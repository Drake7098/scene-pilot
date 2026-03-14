/**
 * Current Template Context - shows which template was applied to the project.
 * Rendered in Pro Sidebar Templates section.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { Project } from "../../../model";
import { PRO_TYPO } from "../../../uiTokens";

type Props = {
  lang: Lang;
  project: Project | null;
  onOpenWorkspace?: () => void;
  onOpenWorkspaceWithTemplate?: (templateId: string) => void;
};

export function CurrentTemplateContext({
  lang,
  project
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const current = project?.meta?.currentTemplate;
  const appliedIds = project?.meta?.appliedTemplateIds ?? [];
  const isCharged = current ? appliedIds.includes(current.templateId) : false;

  if (!current) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyLabel}>{t("当前模板", "Current Template")}</div>
        <div style={styles.emptyHint}>{t("未使用模板", "No template applied")}</div>
      </div>
    );
  }

  const title = lang === "zh" ? current.titleZh : current.titleEn;
  const familyName = lang === "zh" ? current.familyNameZh : current.familyNameEn;

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>{t("当前模板", "Current Template")}</div>
      <div style={styles.card}>
        <div style={styles.title}>{title || current.templateId}</div>
        {[familyName, current.variantId].filter(Boolean).length > 0 ? (
          <div style={styles.meta}>
            {[familyName, current.variantId].filter(Boolean).join(" · ")}
          </div>
        ) : null}
        <div style={styles.tags}>
          {current.category ? (
            <span style={styles.tag}>{current.category}</span>
          ) : null}
          {current.domain ? (
            <span style={styles.tag}>{current.domain}</span>
          ) : null}
          {current.isFree ? (
            <span style={styles.tagFree}>{t("免费", "Free")}</span>
          ) : (
            <span style={styles.tagCost}>{current.cost} {t("积分", "credits")}</span>
          )}
        </div>
        <div style={styles.applyMode}>
          {t("应用模式", "Apply mode")}: {applyModeLabel(current.applyMode, lang)}
        </div>
        {isCharged ? (
          <div style={styles.chargedHint}>{t("已计费", "Charged")}</div>
        ) : null}
        {/* 无独立入口：打开模板工作台统一由下方 TemplateSidebarEntry 提供，打开时自动定位当前模板 */}
      </div>
    </div>
  );
}

function applyModeLabel(mode: string, lang: Lang): string {
  if (lang === "zh") {
    if (mode === "layout_only") return "仅布局";
    if (mode === "layout_plus_style") return "布局+风格";
    if (mode === "full_workflow") return "完整应用";
  } else {
    if (mode === "layout_only") return "Layout only";
    if (mode === "layout_plus_style") return "Layout + style";
    if (mode === "full_workflow") return "Full workflow";
  }
  return mode;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10
  },
  label: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: "#9ca3af"
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10,
    padding: "8px 0"
  },
  emptyLabel: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: "#9ca3af"
  },
  emptyHint: {
    fontSize: PRO_TYPO.xs,
    color: "#6b7280",
    fontFamily: PRO_TYPO.fontFamily
  },
  card: {
    padding: 8,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #3a3f46",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  title: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: "#e5e7eb",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  meta: {
    fontSize: PRO_TYPO["3xs"],
    color: "#9ca3af",
    fontFamily: PRO_TYPO.fontFamily
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  tag: {
    fontSize: 9,
    padding: "1px 4px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    color: "#9ca3af",
    fontFamily: PRO_TYPO.fontFamily
  },
  tagFree: {
    fontSize: 9,
    padding: "1px 4px",
    background: "rgba(76,186,128,0.15)",
    borderRadius: 4,
    color: "#6ee7b7",
    fontFamily: PRO_TYPO.fontFamily
  },
  tagCost: {
    fontSize: 9,
    padding: "1px 4px",
    background: "rgba(245,158,11,0.15)",
    borderRadius: 4,
    color: "#f59e0b",
    fontFamily: PRO_TYPO.fontFamily
  },
  applyMode: {
    fontSize: PRO_TYPO["3xs"],
    color: "#6b7280",
    fontFamily: PRO_TYPO.fontFamily
  },
  chargedHint: {
    fontSize: PRO_TYPO["3xs"],
    color: "#6ee7b7",
    fontFamily: PRO_TYPO.fontFamily
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: "#f59e0b",
    border: "none",
    borderRadius: 6,
    color: "#1f2125",
    fontSize: PRO_TYPO["3xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  },
  actionBtnGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 8px",
    background: "transparent",
    border: "1px solid #3a3f46",
    borderRadius: 6,
    color: "#9ca3af",
    fontSize: PRO_TYPO["3xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer"
  }
};
