/**
 * Export UI v1 - PlatformSelectSection
 * Select platformId. Uses existing PLATFORM_PRESETS. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { PLATFORM_PRESETS } from "../../../config/platformPresets";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  value: PlatformPresetId;
  onChange: (id: PlatformPresetId) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function PlatformSelectSection({ lang, value, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase" }}>
        {t(lang, "目标平台", "Target platform")}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PlatformPresetId)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: `1px solid ${FIGMA_COLORS.border}`,
          background: FIGMA_COLORS.bg,
          color: FIGMA_COLORS.text,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        {PLATFORM_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {lang === "zh" ? p.labelZh : p.labelEn}
          </option>
        ))}
      </select>
    </div>
  );
}
