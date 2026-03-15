/**
 * Prompt UI v1 - PromptBreakdownSection
 * Displays prompt split into sections. Read-only, no editing. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { splitMachineNotes } from "../../../utils/promptTail";
import { parsePromptSections, type PromptSection } from "../utils/parsePromptSections";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  prompt: string;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function sectionTitle(s: PromptSection, lang: Lang): string {
  return lang === "zh" ? s.title : s.titleEn;
}

export function PromptBreakdownSection({ lang, prompt }: Props) {
  const { main, notes } = splitMachineNotes(prompt);
  const sections = parsePromptSections(main);

  if (sections.length === 0 && !notes.trim()) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无分段", "No sections")}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map((s) => (
        <div
          key={s.id}
          style={{
            border: `1px solid ${FIGMA_COLORS.border}`,
            borderRadius: 6,
            overflow: "hidden",
            background: FIGMA_COLORS.bg,
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              fontSize: 10,
              fontWeight: 600,
              color: FIGMA_COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: `1px solid ${FIGMA_COLORS.border}`,
              background: FIGMA_COLORS.panel,
            }}
          >
            {sectionTitle(s, lang)}
          </div>
          <pre
            style={{
              margin: 0,
              padding: 8,
              fontSize: 11,
              fontFamily: "monospace",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: FIGMA_COLORS.text,
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            {s.lines.join("\n")}
          </pre>
        </div>
      ))}
      {notes.trim() && (
        <div
          style={{
            border: `1px solid ${FIGMA_COLORS.border}`,
            borderRadius: 6,
            overflow: "hidden",
            background: FIGMA_COLORS.bg,
          }}
        >
          <div
            style={{
              padding: "6px 10px",
              fontSize: 10,
              fontWeight: 600,
              color: FIGMA_COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: `1px solid ${FIGMA_COLORS.border}`,
              background: FIGMA_COLORS.panel,
            }}
          >
            {t(lang, "机器 / 控制尾", "Machine / Control Tail")}
          </div>
          <pre
            style={{
              margin: 0,
              padding: 8,
              fontSize: 10,
              fontFamily: "monospace",
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: FIGMA_COLORS.textMuted,
              maxHeight: 100,
              overflowY: "auto",
            }}
          >
            {notes.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}
