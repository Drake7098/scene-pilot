/**
 * Platform Mode - platform strategy and export method visibility in Pro PropsPanel.
 * Rendered above Generate, below Composition.
 */

import React from "react";
import type { Lang } from "../i18n";
import type { PlatformPresetId } from "../config/platformPresets";
import { getPlatformPreset, PLATFORM_PRESETS } from "../config/platformPresets";
import {
  buildPlatformModeViewModel,
  type StructureIntensity
} from "../utils/platformModeViewModel";
import type { ExportMode } from "../utils/exportViewModel";
import { ProCollapseSection } from "./pro-ui/ProCollapseSection";
import { PRO_TYPO, UI_COLOR, UI_SPACE } from "../uiTokens";

type Props = {
  lang: Lang;
  project: import("../model").Project;
  platformId: PlatformPresetId;
  onPlatformChange: (id: PlatformPresetId) => void;
  exportMode: ExportMode;
  onExportModeChange: (m: ExportMode) => void;
  collapsed: boolean;
  onToggle: () => void;
};

export function PlatformModePanel({
  lang,
  project,
  platformId,
  onPlatformChange,
  exportMode,
  onExportModeChange,
  collapsed,
  onToggle
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const vm = buildPlatformModeViewModel(project, platformId, exportMode);

  return (
    <ProCollapseSection
      title={t("平台模式", "Platform Mode")}
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <div style={styles.wrap}>
        <Block title={t("当前平台", "Current Target")}>
          <select
            value={vm.currentPlatformTarget}
            onChange={(e) => onPlatformChange(e.target.value as PlatformPresetId)}
            style={styles.select}
          >
            {PLATFORM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "zh" ? p.labelZh : p.labelEn}
              </option>
            ))}
          </select>
        </Block>

        <Block title={t("推荐平台", "Recommended")}>
          <div style={styles.tags}>
            {vm.recommendedPlatforms.slice(0, 4).map((id) => {
              const p = getPlatformPreset(id);
              const isCurrent = id === vm.currentPlatformTarget;
              return (
                <span
                  key={id}
                  style={{ ...styles.tag, ...(isCurrent ? styles.tagActive : {}) }}
                >
                  {lang === "zh" ? p.labelZh : p.labelEn}
                </span>
              );
            })}
          </div>
        </Block>

        <Block title={t("导出方式", "Export Method")}>
          <div className="platform-export-segmented">
            <button
              type="button"
              className={exportMode === "prompt_only" ? "platform-export-seg-on" : "platform-export-seg-off"}
              style={styles.exportSegBtn}
              onClick={() => onExportModeChange("prompt_only")}
            >
              {t("仅提示词", "Prompt only")}
            </button>
            <button
              type="button"
              className={exportMode === "package" ? "platform-export-seg-on" : "platform-export-seg-off"}
              style={styles.exportSegBtn}
              onClick={() => onExportModeChange("package")}
            >
              {t("提示词+参考图", "Prompt+refs")}
            </button>
          </div>
        </Block>

        <Block title={t("结构提示", "Structure")}>
          <Row label={t("强度", "Intensity")} value={structureLabel(lang, vm.structureIntensity)} />
          <Row label={t("坐标", "Coords")} value={vm.coordinateStrength === "off" ? (t("关", "Off")) : vm.coordinateStrength === "light" ? (t("轻", "Light")) : (t("全", "Full"))} />
          <Row
            label={t("抑制字面", "Suppress literal")}
            value={vm.suppressCoordinateLiteral ? "✓" : "—"}
          />
          <Row
            label={t("自然语言镜头", "Natural cam")}
            value={vm.prefersNaturalLanguageCamera ? "✓" : "—"}
          />
        </Block>

        {vm.needsReferenceImage && (
          <Block title={t("参考图", "Reference")}>
            <div style={styles.hint}>{t("建议使用参考图", "Reference images recommended")}</div>
          </Block>
        )}
      </div>
    </ProCollapseSection>
  );
}

function Block({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.block}>
      <div style={styles.blockTitle}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value}</span>
    </div>
  );
}

function structureLabel(lang: Lang, s: StructureIntensity): string {
  const m: Record<StructureIntensity, { zh: string; en: string }> = {
    soft: { zh: "弱", en: "Soft" },
    balanced: { zh: "平衡", en: "Balanced" },
    strong: { zh: "强", en: "Strong" }
  };
  return lang === "zh" ? m[s].zh : m[s].en;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: UI_SPACE.sm,
    display: "flex",
    flexDirection: "column",
    gap: UI_SPACE.sm
  },
  block: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  blockTitle: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    fontWeight: 600,
    color: UI_COLOR.textMuted,
    marginBottom: 2
  },
  select: {
    fontSize: PRO_TYPO.xs,
    fontFamily: PRO_TYPO.fontFamily,
    width: "100%",
    padding: `${UI_SPACE.xxs} ${UI_SPACE.sm}`,
    borderRadius: 8,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: UI_COLOR.text
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  tag: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    padding: "2px 6px",
    borderRadius: 4,
    background: UI_COLOR.borderSoft,
    color: UI_COLOR.textMuted
  },
  tagActive: {
    background: UI_COLOR.accentSoft,
    color: UI_COLOR.accent
  },
  exportSegBtn: {
    flex: 1,
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    fontWeight: 600,
    padding: "6px 10px",
    border: "none",
    cursor: "pointer",
    transition: "background 150ms ease, color 150ms ease"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily
  },
  rowLabel: {
    color: UI_COLOR.textMuted
  },
  rowValue: {
    color: UI_COLOR.text
  },
  hint: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    color: UI_COLOR.textMuted
  }
};
