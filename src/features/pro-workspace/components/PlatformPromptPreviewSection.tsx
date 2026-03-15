/**
 * Platform Adapt UI v1 - PlatformPromptPreviewSection
 * Preview of prompt in current platform context. Reuses Prompt UI result, adds platform hints.
 * No prompt rewrite. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { getPlatformCapability } from "../../../config/platformCapabilities";
import { FileText, Info } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
  prompt: string;
  mediaMode: "image" | "video";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Platform-specific preview hint from existing config */
function getPlatformHint(platformId: PlatformPresetId, mediaMode: "image" | "video", lang: Lang): string {
  const preset = getPlatformPreset(platformId);
  const cap = getPlatformCapability(preset.baseProfile);
  const maxChars = mediaMode === "image" ? cap.maxCharsImage : cap.maxCharsVideo;
  const style = preset.promptStyle === "short"
    ? t(lang, "已按短结构精简", "Short structure applied")
    : t(lang, "长结构保留", "Long structure kept");

  return t(
    lang,
    `当前平台适配：${style}，约 ${maxChars} 字符上限。`,
    `Current platform: ${style}, ~${maxChars} char limit.`
  );
}

export function PlatformPromptPreviewSection({ lang, platformId, prompt, mediaMode }: Props) {
  const hint = getPlatformHint(platformId, mediaMode, lang);
  const preview = prompt.trim().slice(0, 400);
  const truncated = prompt.length > 400;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          padding: 8,
          borderRadius: 6,
          background: `${FIGMA_COLORS.accent}10`,
          border: `1px solid ${FIGMA_COLORS.border}`,
          fontSize: 10,
          color: FIGMA_COLORS.textMuted,
        }}
      >
        <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        {hint}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 10,
          borderRadius: 6,
          border: `1px solid ${FIGMA_COLORS.border}`,
          background: FIGMA_COLORS.bg,
          color: FIGMA_COLORS.text,
          fontSize: 10,
          fontFamily: "monospace",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 180,
          overflowY: "auto",
        }}
      >
        {preview || (lang === "zh" ? "—" : "—")}
        {truncated && (lang === "zh" ? "…" : "…")}
      </pre>
      <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "完整 prompt 见「提示词预览」面板", "Full prompt in Prompt Preview panel")}
      </div>
    </div>
  );
}
