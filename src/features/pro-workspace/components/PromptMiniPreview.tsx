/**
 * Prompt Mini Preview - read-only preview section for current scene prompt.
 * When embedded (right sidebar): uses ProCollapseSection, matches 分镜背景/对象属性/对象构图.
 * Preview expand = 4 lines; full expand = capped max-height. Reuses existing prompt result.
 */

import React, { useState } from "react";
import type { Lang } from "../../../i18n";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { FIGMA_COLORS } from "../constants";
import { ProCollapseSection } from "../../../components/pro-ui/ProCollapseSection";
import { editorTheme } from "../../../theme/editorTheme";

const { colors, spacing, typography } = editorTheme;
const LINE_HEIGHT = 1.35;
const PREVIEW_LINES = 4;
const PREVIEW_CONTENT_HEIGHT = PREVIEW_LINES * LINE_HEIGHT * typography.bodySize;
const FULL_EXPANDED_MAX_HEIGHT = 280;

type Props = {
  lang: Lang;
  prompt: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCopyPrompt: () => void;
  onOpenExport?: () => void;
  /** When true, render as right-sidebar section (ProCollapseSection). */
  embedded?: boolean;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function firstLine(s: string, maxChars: number = 80): string {
  const line = (s || "").trim().split("\n")[0] ?? "";
  return line.length > maxChars ? line.slice(0, maxChars) + "…" : line;
}

export function PromptMiniPreview({
  lang,
  prompt,
  collapsed,
  onToggleCollapse,
  onCopyPrompt,
  onOpenExport,
  embedded = false
}: Props) {
  const hasPrompt = (prompt || "").trim().length > 0;
  const previewLine = hasPrompt ? firstLine(prompt) : (lang === "zh" ? "生成中…" : "Generating…");
  const [expandedMode, setExpandedMode] = useState<"preview" | "full">("preview");

  if (embedded) {
    const isPreview = expandedMode === "preview";
    return (
      <ProCollapseSection
        title={t(lang, "提示词预览", "Prompt Preview")}
        collapsed={collapsed}
        onToggle={() => {
          if (collapsed) setExpandedMode("preview");
          onToggleCollapse();
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.fieldMarginBottom, minWidth: 0, width: "100%" }}>
          <div
            style={{
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              height: isPreview ? PREVIEW_CONTENT_HEIGHT : undefined,
              maxHeight: isPreview ? PREVIEW_CONTENT_HEIGHT : FULL_EXPANDED_MAX_HEIGHT,
              overflowY: "auto",
              overflowX: "hidden",
              background: colors.bg,
              padding: "8px 10px",
              borderRadius: 6
            }}
          >
            <pre
              style={{
                margin: 0,
                maxWidth: "100%",
                fontSize: typography.bodySize,
                fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                color: colors.text,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                lineHeight: LINE_HEIGHT,
                userSelect: "text",
                cursor: "default"
              }}
              aria-readonly="true"
            >
              {(prompt || "").trim() || (lang === "zh" ? "生成中…" : "Generating…")}
            </pre>
          </div>
          {isPreview ? (
            <button
              type="button"
              className="pro-btn-ghost"
              style={{
                padding: "2px 0",
                fontSize: typography.hintSize,
                fontWeight: 600,
                color: colors.accent,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                alignSelf: "flex-start"
              }}
              onClick={() => setExpandedMode("full")}
            >
              {t(lang, "展开全文", "Expand full")}
            </button>
          ) : (
            <button
              type="button"
              className="pro-btn-ghost"
              style={{
                padding: "2px 0",
                fontSize: typography.hintSize,
                fontWeight: 600,
                color: colors.textMuted,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                alignSelf: "flex-start"
              }}
              onClick={() => setExpandedMode("preview")}
            >
              {t(lang, "收起全文", "Collapse to preview")}
            </button>
          )}
          <button
            type="button"
            className="pro-btn-ghost"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: typography.bodySize,
              fontWeight: 600,
              color: hasPrompt ? colors.accent : colors.textMuted,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              background: "transparent",
              cursor: hasPrompt ? "pointer" : "not-allowed",
              opacity: hasPrompt ? 1 : 0.6,
              alignSelf: "flex-start"
            }}
            onClick={() => hasPrompt && onCopyPrompt()}
            disabled={!hasPrompt}
          >
            <Copy size={14} />
            {t(lang, "复制", "Copy")}
          </button>
        </div>
      </ProCollapseSection>
    );
  }

  return (
    <div
      className="prompt-mini-preview"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 20,
        width: "min(320px, calc(100% - 24px))",
        background: FIGMA_COLORS.panel,
        border: `1px solid ${FIGMA_COLORS.border}`,
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
      role="region"
      aria-label={t(lang, "提示词预览", "Prompt preview")}
    >
      <div
        style={{
          padding: "6px 10px",
          borderBottom: collapsed ? "none" : `1px solid ${FIGMA_COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t(lang, "提示词预览", "Prompt Preview")}
        </span>
        <button
          type="button"
          className="pro-btn-ghost"
          style={{ padding: "2px 6px", minWidth: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: FIGMA_COLORS.textMuted, borderRadius: 4 }}
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
      {collapsed ? (
        <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, minHeight: 36 }}>
          <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 11, color: FIGMA_COLORS.text, fontFamily: "ui-monospace, SF Mono, Menlo, monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {previewLine}
          </p>
        </div>
      ) : (
        <>
          <div style={{ padding: "8px 10px", maxHeight: FULL_EXPANDED_MAX_HEIGHT + "px", overflowY: "auto", overflowX: "hidden" }}>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "ui-monospace, SF Mono, Menlo, monospace", color: FIGMA_COLORS.text, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: LINE_HEIGHT, userSelect: "text", cursor: "default" }} aria-readonly="true">
              {(prompt || "").trim() || (lang === "zh" ? "生成中…" : "Generating…")}
            </pre>
          </div>
          <p style={{ margin: 0, padding: "4px 10px 6px", fontSize: 10, color: FIGMA_COLORS.textMuted, borderTop: `1px solid ${FIGMA_COLORS.border}` }}>
            {t(lang, "只读", "Read-only")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 8px", flexShrink: 0 }}>
            <button
              type="button"
              className="pro-btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: FIGMA_COLORS.accent, border: `1px solid ${FIGMA_COLORS.border}`, borderRadius: 6, background: "transparent", cursor: hasPrompt ? "pointer" : "not-allowed", opacity: hasPrompt ? 1 : 0.6 }}
              onClick={() => hasPrompt && onCopyPrompt()}
              disabled={!hasPrompt}
            >
              <Copy size={12} />
              {t(lang, "复制", "Copy")}
            </button>
            {onOpenExport && (
              <button type="button" className="pro-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: FIGMA_COLORS.textMuted, border: `1px solid ${FIGMA_COLORS.border}`, borderRadius: 6, background: "transparent", cursor: "pointer" }} onClick={onOpenExport}>
                {t(lang, "查看完整 / 导出", "View full / Export")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
