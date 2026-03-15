/**
 * Export UI v1 - EngineSelectSection
 * Displays engineId (derived, read-only) and selects hosted / my api.
 * Reuses existing engineId + proGenerationSource logic. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { FIGMA_COLORS } from "../constants";

export type GenerationSource = "hosted" | "byo";

type Props = {
  lang: Lang;
  engineId: string;
  generationSource: GenerationSource;
  onGenerationSourceChange: (v: GenerationSource) => void;
  canUseByo: boolean;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function EngineSelectSection({
  lang,
  engineId,
  generationSource,
  onGenerationSourceChange,
  canUseByo,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase" }}>
          {t(lang, "引擎", "Engine")}
        </span>
        <span style={{ fontSize: 11, color: FIGMA_COLORS.text, fontFamily: "monospace" }}>{engineId}</span>
      </div>
      {canUseByo && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onGenerationSourceChange("hosted")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${generationSource === "hosted" ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
              background: generationSource === "hosted" ? `${FIGMA_COLORS.accent}20` : FIGMA_COLORS.bg,
              color: generationSource === "hosted" ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t(lang, "平台生成", "Hosted")}
          </button>
          <button
            type="button"
            onClick={() => onGenerationSourceChange("byo")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${generationSource === "byo" ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
              background: generationSource === "byo" ? `${FIGMA_COLORS.accent}20` : FIGMA_COLORS.bg,
              color: generationSource === "byo" ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t(lang, "我的 API", "My API")}
          </button>
        </div>
      )}
    </div>
  );
}
