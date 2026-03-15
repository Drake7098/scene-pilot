/**
 * Prompt UI v1 - PromptMetaSection
 * Displays prompt context summary. Read-only. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  mediaMode: "image" | "video";
  sceneName: string;
  templateId: string | null;
  applyMode: string;
  engineId?: string;
  conflictCount: number;
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

export function PromptMetaSection({
  lang,
  mediaMode,
  sceneName,
  templateId,
  applyMode,
  engineId,
  conflictCount,
}: Props) {
  const rows: { label: string; value: string }[] = [
    { label: t(lang, "媒体模式", "Media mode"), value: mediaMode === "image" ? (lang === "zh" ? "图片" : "Image") : (lang === "zh" ? "视频" : "Video") },
    { label: t(lang, "当前场景", "Current scene"), value: sceneName || (lang === "zh" ? "—" : "—") },
    { label: t(lang, "模板来源", "Template"), value: templateId || (lang === "zh" ? "未使用" : "None") },
    { label: t(lang, "应用模式", "Apply mode"), value: applyModeLabel(applyMode, lang) },
    { label: t(lang, "引擎", "Engine"), value: engineId || "—" },
    { label: t(lang, "活跃约束", "Active constraints"), value: conflictCount > 0 ? `${conflictCount} ${lang === "zh" ? "个" : ""}` : (lang === "zh" ? "无" : "None") },
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
