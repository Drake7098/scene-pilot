/**
 * OutputConsole - minimal execution bar below FeedbackBar.
 * Only Generate (primary) and optionally Copy prompt.
 * Export / platform / scope moved to Project Menu (next step).
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { Copy, Sparkles } from "lucide-react";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = {
  lang: Lang;
  onGenerate: () => void;
  generateBusy?: boolean;
  onCopyPrompt: () => void;
};

export function OutputConsole({
  lang,
  onGenerate,
  generateBusy = false,
  onCopyPrompt
}: Props) {
  return (
    <div
      style={rootStyle}
      role="region"
      aria-label={t(lang, "输出控制台", "Output console")}
    >
      <div style={innerStyle}>
        <button
          type="button"
          className="pro-btn-ghost"
          onClick={onCopyPrompt}
          style={copyBtnStyle}
          data-testid="output-console-copy-prompt"
        >
          <Copy size={14} />
          {t(lang, "复制提示词", "Copy Prompt")}
        </button>
        <button
          type="button"
          className="pro-btn"
          disabled={generateBusy}
          onClick={() => onGenerate()}
          style={{ ...primaryStyle, cursor: generateBusy ? "wait" : "pointer" }}
          data-testid="output-console-generate"
        >
          <Sparkles size={16} />
          {generateBusy ? t(lang, "生成中…", "Generating…") : t(lang, "生成", "Generate")}
        </button>
      </div>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  flexShrink: 0,
  minHeight: 48,
  height: 48,
  borderTop: "1px solid var(--pro-border)",
  background: "var(--pro-bg-panel)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 12px"
};

const innerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexShrink: 0
};

const copyBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 32,
  padding: "0 12px",
  fontSize: 11,
  border: "1px solid var(--pro-border)",
  borderRadius: 6,
  background: "transparent",
  color: "var(--pro-text-muted)",
  cursor: "pointer",
  whiteSpace: "nowrap"
};

const primaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 32,
  padding: "0 20px",
  fontSize: 12,
  fontWeight: 600,
  background: "var(--pro-accent, #f59e0b)",
  color: "#111",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  flexShrink: 0
};
