import React from "react";
import type { Lang } from "../../../i18n";
import { PRO_TYPO } from "../../../uiTokens";
import { editorTheme } from "../../../theme/editorTheme";
import type { TemplateIndex } from "../model/templateIndex";
import {
  getAvailableSubTasks,
  getIntentMeta,
  type TemplateIntentId
} from "../model/templateIntent";

const { colors: figmaColors, spacing } = editorTheme;

type Props = {
  lang: Lang;
  items: TemplateIndex[];
  intentId: TemplateIntentId | null;
  selectedSubTaskId: string | null;
  onSelectSubTask: (subTaskId: string | null) => void;
};

export function TemplateSubIntentList({
  lang,
  items,
  intentId,
  selectedSubTaskId,
  onSelectSubTask
}: Props) {
  if (!intentId) return null;
  const intent = getIntentMeta(intentId);
  const subIntents = getAvailableSubTasks(items, intentId);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);

  return (
    <nav className="pro-rail-scroll" style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.intentTitle}>{lang === "zh" ? intent?.labelZh : intent?.labelEn}</div>
        <div style={styles.intentDesc}>{lang === "zh" ? intent?.descriptionZh : intent?.descriptionEn}</div>
      </div>
      {subIntents.map((subIntent) => {
        const count = items.filter((item) => subIntent.familyIds.includes(item.familyId)).length;
        return (
          <button
            key={subIntent.id}
            type="button"
            style={{
              ...styles.item,
              ...(selectedSubTaskId === subIntent.id ? styles.itemActive : {})
            }}
            onClick={() => onSelectSubTask(subIntent.id)}
          >
            <span style={styles.itemTitle}>{lang === "zh" ? subIntent.labelZh : subIntent.labelEn}</span>
            <span style={styles.itemDesc}>{lang === "zh" ? subIntent.descriptionZh : subIntent.descriptionEn}</span>
            <span style={styles.count}>{count}</span>
          </button>
        );
      })}
      {subIntents.length === 0 ? (
        <div style={styles.empty}>{t("当前任务下暂无可用模版", "No templates for this task yet")}</div>
      ) : null}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 220,
    flexShrink: 0,
    padding: `${spacing.panelPadding / 2}px 0`,
    borderRight: `1px solid ${figmaColors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: figmaColors.panel,
    overflowY: "auto"
  },
  header: {
    padding: "8px 12px 10px",
    borderBottom: `1px solid ${figmaColors.border}`
  },
  intentTitle: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightBold,
    fontFamily: PRO_TYPO.fontFamily,
    color: figmaColors.text
  },
  intentDesc: {
    marginTop: 4,
    fontSize: PRO_TYPO["2xs"],
    lineHeight: 1.4,
    color: figmaColors.textMuted,
    fontFamily: PRO_TYPO.fontFamily
  },
  item: {
    margin: "0 8px",
    padding: "10px 12px",
    textAlign: "left",
    background: figmaColors.bg,
    border: `1px solid ${figmaColors.border}`,
    borderRadius: 10,
    color: figmaColors.textMuted,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  itemActive: {
    borderColor: figmaColors.accent,
    background: figmaColors.hover,
    color: figmaColors.text
  },
  itemTitle: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily
  },
  itemDesc: {
    fontSize: PRO_TYPO["3xs"],
    lineHeight: 1.35,
    fontFamily: PRO_TYPO.fontFamily
  },
  count: {
    marginTop: 2,
    fontSize: PRO_TYPO["3xs"],
    color: figmaColors.accent,
    fontFamily: PRO_TYPO.fontFamily
  },
  empty: {
    padding: "12px",
    fontSize: PRO_TYPO["2xs"],
    color: figmaColors.textMuted,
    fontFamily: PRO_TYPO.fontFamily
  }
};
