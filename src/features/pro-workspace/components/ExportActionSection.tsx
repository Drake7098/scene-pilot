/**
 * Export UI v1 - ExportActionSection
 * Export, Send to platform, Copy for platform. Reuses existing export / adapter. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { Download, Share2, Copy } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  onExport: () => void;
  onCopy: () => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ExportActionSection({ lang, onExport, onCopy }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase" }}>
        {t(lang, "导出动作", "Export actions")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          type="button"
          onClick={onExport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 6,
            border: `1px solid ${FIGMA_COLORS.border}`,
            background: FIGMA_COLORS.bg,
            color: FIGMA_COLORS.text,
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Download size={14} />
          {t(lang, "导出", "Export")}
        </button>
        <button
          type="button"
          onClick={onCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 6,
            border: `1px solid ${FIGMA_COLORS.border}`,
            background: FIGMA_COLORS.bg,
            color: FIGMA_COLORS.text,
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Copy size={14} />
          {t(lang, "复制后发送到平台", "Copy for platform")}
        </button>
      </div>
      <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "复用已有 export / adapter 逻辑", "Reuses existing export / adapter logic")}
      </div>
    </div>
  );
}
