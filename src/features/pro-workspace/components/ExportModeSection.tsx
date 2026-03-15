/**
 * Export UI v1 - ExportModeSection
 * Select exportMode. Uses existing prompt_only | package. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { FIGMA_COLORS } from "../constants";

export type ExportMode = "prompt_only" | "package";

type Props = {
  lang: Lang;
  value: ExportMode;
  onChange: (v: ExportMode) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ExportModeSection({ lang, value, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase" }}>
        {t(lang, "导出模式", "Export mode")}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange("prompt_only")}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: `1px solid ${value === "prompt_only" ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
            background: value === "prompt_only" ? `${FIGMA_COLORS.accent}20` : FIGMA_COLORS.bg,
            color: value === "prompt_only" ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
            fontSize: 11,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {t(lang, "仅提示词", "Prompt only")}
        </button>
        <button
          type="button"
          onClick={() => onChange("package")}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: `1px solid ${value === "package" ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
            background: value === "package" ? `${FIGMA_COLORS.accent}20` : FIGMA_COLORS.bg,
            color: value === "package" ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
            fontSize: 11,
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          {t(lang, "完整项目包", "Package")}
        </button>
      </div>
    </div>
  );
}
