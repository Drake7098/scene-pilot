/**
 * Family list - left panel. Lists unique families from TemplateIndex.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { PRO_TYPO } from "../../../uiTokens";
import { editorTheme } from "../../../theme/editorTheme";
import type { TemplateIndex } from "../model/templateIndex";

const { colors: figmaColors, spacing } = editorTheme;

type FamilyItem = {
  familyId: string;
  familyNameZh: string;
  familyNameEn: string;
  count: number;
};

function uniqueFamilies(items: TemplateIndex[]): FamilyItem[] {
  const byId = new Map<string, FamilyItem>();
  for (const t of items) {
    const cur = byId.get(t.familyId);
    if (cur) {
      cur.count += 1;
    } else {
      byId.set(t.familyId, {
        familyId: t.familyId,
        familyNameZh: t.familyNameZh ?? t.familyId,
        familyNameEn: t.familyNameEn ?? t.familyId,
        count: 1
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    (a.familyNameEn || a.familyId).localeCompare(b.familyNameEn || b.familyId)
  );
}

type Props = {
  lang: Lang;
  items: TemplateIndex[];
  selectedFamilyId: string | null;
  onSelectFamily: (familyId: string | null) => void;
};

export function TemplateFamilyList({
  lang,
  items,
  selectedFamilyId,
  onSelectFamily
}: Props) {
  const families = React.useMemo(() => uniqueFamilies(items), [items]);
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);

  return (
    <nav className="pro-rail-scroll" style={styles.wrap}>
      <button
        type="button"
        style={{
          ...styles.item,
          ...(!selectedFamilyId ? styles.itemActive : {})
        }}
        onClick={() => onSelectFamily(null)}
      >
        {t("全部", "All")}
      </button>
      {families.map((f) => (
        <button
          key={f.familyId}
          type="button"
          style={{
            ...styles.item,
            ...(selectedFamilyId === f.familyId ? styles.itemActive : {})
          }}
          onClick={() => onSelectFamily(f.familyId)}
        >
          {lang === "zh" ? f.familyNameZh : f.familyNameEn}
          <span style={styles.count}>{f.count}</span>
        </button>
      ))}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: editorTheme.sizing.navWidth,
    flexShrink: 0,
    padding: `${spacing.panelPadding / 2}px 0`,
    borderRight: `1px solid ${figmaColors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    background: figmaColors.panel,
    overflowY: "auto"
  },
  item: {
    padding: "8px 12px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    color: figmaColors.textMuted,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  itemActive: {
    background: figmaColors.hover,
    color: figmaColors.accent
  },
  count: {
    fontSize: PRO_TYPO["2xs"],
    opacity: 0.8
  }
};
