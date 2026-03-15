/**
 * Rule Engine UI v1 - ConflictListSection
 * Displays detectSceneConflicts results, supports click-to-jump, grouped by severity.
 * Read-only, no editing. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { AlertTriangle, Shield } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  conflicts: PromptConflict[];
  selectedLayerId?: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ConflictListSection({
  lang,
  conflicts,
  selectedLayerId,
  onJumpToConflict,
}: Props) {
  if (conflicts.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无冲突", "No conflicts detected")}
      </div>
    );
  }

  const high = conflicts.filter((c) => c.severity === "high");
  const warning = conflicts.filter((c) => c.severity === "warning");

  const renderList = (list: PromptConflict[], severity: "high" | "warning") => {
    const Icon = severity === "high" ? Shield : AlertTriangle;
    const color = severity === "high" ? "#ef4444" : FIGMA_COLORS.accent;
    const label = severity === "high" ? t(lang, "严重", "High") : t(lang, "警告", "Warning");

    return (
      <div key={severity} style={{ marginBottom: list === warning && warning.length > 0 ? 12 : 0 }}>
        {list.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
              fontSize: 10,
              fontWeight: 600,
              color: FIGMA_COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <Icon size={11} color={color} />
            {label} ({list.length})
          </div>
        )}
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            listStyle: "disc",
            fontSize: 11,
            color: FIGMA_COLORS.text,
            lineHeight: 1.7,
          }}
        >
          {list.map((c) => (
            <li key={c.id} style={{ marginBottom: 4 }}>
              {c.title}
              {c.layerId && (
                <button
                  type="button"
                  onClick={() => onJumpToConflict?.(c.layerId ?? null)}
                  style={{
                    marginLeft: 4,
                    padding: "0 4px",
                    border: "none",
                    background: selectedLayerId === c.layerId ? `${FIGMA_COLORS.accent}30` : "transparent",
                    color: FIGMA_COLORS.accent,
                    cursor: "pointer",
                    fontSize: 11,
                    textDecoration: "underline",
                  }}
                >
                  {c.layerId}
                </button>
              )}
              {" — "}
              <span style={{ color: FIGMA_COLORS.textMuted }}>{c.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div>
      {renderList(high, "high")}
      {renderList(warning, "warning")}
    </div>
  );
}
