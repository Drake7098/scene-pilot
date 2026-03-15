/**
 * Rule Engine UI v1 - RuleSummarySection
 * Summarizes rule hit counts by level: errors, warnings, locked, info.
 * Read-only, no editing. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { Shield, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  conflicts: PromptConflict[];
  layoutLocked: boolean;
  /** Count of objects with any non-trivial state (locked, anchor-bound, protected-layout, etc.) */
  objectStateCount: number;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function RuleSummarySection({ lang, conflicts, layoutLocked, objectStateCount }: Props) {
  const errors = conflicts.filter((c) => c.severity === "high").length;
  const warnings = conflicts.filter((c) => c.severity === "warning").length;

  const items: { icon: typeof AlertCircle; label: string; count: number; color: string }[] = [
    { icon: AlertCircle, label: t(lang, "错误", "Errors"), count: errors, color: "#ef4444" },
    { icon: AlertTriangle, label: t(lang, "警告", "Warnings"), count: warnings, color: FIGMA_COLORS.accent },
    { icon: Shield, label: t(lang, "锁定", "Locked"), count: layoutLocked ? 1 : 0, color: FIGMA_COLORS.textMuted },
    { icon: Info, label: t(lang, "对象状态", "Object states"), count: objectStateCount, color: FIGMA_COLORS.textMuted },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {items.map(({ icon: Icon, label, count, color }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: FIGMA_COLORS.bg,
              border: `1px solid ${FIGMA_COLORS.border}`,
            }}
          >
            <Icon size={12} color={color} />
            <span style={{ fontSize: 11, color: FIGMA_COLORS.text }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
