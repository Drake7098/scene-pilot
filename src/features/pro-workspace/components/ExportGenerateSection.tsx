/**
 * Export UI v1 - GenerateSection
 * Generate button. Calls existing generateProAsset. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { Wand2 } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  onGenerate: () => void;
  busy: boolean;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ExportGenerateSection({ lang, onGenerate, busy }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        onClick={() => void onGenerate()}
        disabled={busy}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: busy ? FIGMA_COLORS.border : FIGMA_COLORS.accent,
          color: busy ? FIGMA_COLORS.textMuted : "#1f2125",
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        <Wand2 size={16} />
        {busy ? t(lang, "生成中…", "Generating…") : t(lang, "生成", "Generate")}
      </button>
      <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "使用当前 platform / engine 生成", "Generate using current platform / engine")}
      </div>
    </div>
  );
}
