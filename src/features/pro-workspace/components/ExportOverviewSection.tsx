/**
 * Export UI v1 - ExportOverviewSection
 * Displays current platform, engine, applyMode, mediaMode, template. Read-only + selectable.
 * Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
  engineId: string;
  applyMode: string;
  mediaMode: "image" | "video";
  templateId: string | null;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function applyModeLabel(mode: string, lang: Lang): string {
  if (lang === "zh") {
    if (mode === "layout_only") return "仅布局";
    if (mode === "layout_plus_style") return "布局+风格";
    if (mode === "full_workflow") return "完整工作流";
  } else {
    if (mode === "layout_only") return "Layout only";
    if (mode === "layout_plus_style") return "Layout + style";
    if (mode === "full_workflow") return "Full workflow";
  }
  return mode;
}

export function ExportOverviewSection({
  lang,
  platformId,
  engineId,
  applyMode,
  mediaMode,
  templateId,
}: Props) {
  const preset = getPlatformPreset(platformId);
  const platformLabel = lang === "zh" ? preset.labelZh : preset.labelEn;

  const rows: { label: string; value: string }[] = [
    { label: t(lang, "平台", "Platform"), value: platformLabel },
    { label: t(lang, "引擎", "Engine"), value: engineId || "—" },
    { label: t(lang, "应用模式", "Apply mode"), value: applyModeLabel(applyMode, lang) },
    { label: t(lang, "媒体", "Media"), value: mediaMode === "image" ? (lang === "zh" ? "图片" : "Image") : (lang === "zh" ? "视频" : "Video") },
    { label: t(lang, "模板", "Template"), value: templateId || (lang === "zh" ? "—" : "—") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>{label}</span>
          <span style={{ fontSize: 11, color: FIGMA_COLORS.text, fontFamily: "monospace" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
