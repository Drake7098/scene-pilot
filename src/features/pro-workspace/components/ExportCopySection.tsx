/**
 * Export UI v1 - CopySection
 * Copy Prompt actions. Reuses existing copy logic. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { Copy } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  prompt: string;
  /** Reuse existing copy flow (e.g. opens ExportPanel for copy) */
  onCopy: () => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ExportCopySection({ lang, prompt, onCopy }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={() => onCopy()}
        disabled={!prompt.trim()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 6,
          border: `1px solid ${FIGMA_COLORS.border}`,
          background: prompt.trim() ? FIGMA_COLORS.bg : FIGMA_COLORS.panel,
          color: prompt.trim() ? FIGMA_COLORS.accent : FIGMA_COLORS.textMuted,
          fontSize: 12,
          cursor: prompt.trim() ? "pointer" : "not-allowed",
        }}
      >
        <Copy size={14} />
        {t(lang, "复制提示词", "Copy Prompt")}
      </button>
      <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "复制当前分镜完整 prompt（含 platform 适配）", "Copy current scene prompt with platform adaptation")}
      </div>
    </div>
  );
}
