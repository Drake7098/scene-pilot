/**
 * Prompt UI v1 - PromptOverviewSection
 * Displays full prompt (read-only), Copy button, basic meta. Aligns with Figma design reference.
 * Copy uses unified pipeline only: no direct clipboard. Pass onCopyPrompt to trigger app copy flow.
 */

import React, { useState } from "react";
import type { Lang } from "../../../i18n";
import { Copy, Check } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  prompt: string;
  /** Unified copy flow (opens ExportPanel copy pipeline). No direct clipboard when this is used. */
  onCopyPrompt?: () => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function PromptOverviewSection({ lang, prompt, onCopyPrompt }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!prompt.trim() || !onCopyPrompt) return;
    onCopyPrompt();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, color: FIGMA_COLORS.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
          {t(lang, "完整提示词", "Full Prompt")}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!prompt.trim() || !onCopyPrompt}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            border: `1px solid ${FIGMA_COLORS.border}`,
            borderRadius: 6,
            background: prompt.trim() && onCopyPrompt ? FIGMA_COLORS.bg : FIGMA_COLORS.panel,
            color: prompt.trim() && onCopyPrompt ? FIGMA_COLORS.accent : FIGMA_COLORS.textMuted,
            fontSize: 11,
            cursor: prompt.trim() && onCopyPrompt ? "pointer" : "not-allowed",
          }}
        >
          {copied ? (
            <>
              <Check size={12} />
              {t(lang, "已复制", "Copied")}
            </>
          ) : (
            <>
              <Copy size={12} />
              {t(lang, "复制", "Copy")}
            </>
          )}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 8,
          border: `1px solid ${FIGMA_COLORS.border}`,
          background: FIGMA_COLORS.bg,
          color: FIGMA_COLORS.text,
          fontSize: 11,
          fontFamily: "monospace",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {prompt.trim() || (lang === "zh" ? "生成中…" : "Generating…")}
      </pre>
    </div>
  );
}
