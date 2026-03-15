/**
 * Rule Engine UI v1 - ActiveRuleList
 * Displays currently active rules (from detectSceneConflicts). Read-only, no editing.
 * Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { Shield, AlertTriangle } from "lucide-react";
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

function scopeLabel(scope: string, lang: Lang): string {
  if (lang === "zh") {
    if (scope === "layer") return "对象";
    if (scope === "scene") return "场景";
    if (scope === "cross-layer") return "跨对象";
  } else {
    if (scope === "layer") return "Object";
    if (scope === "scene") return "Scene";
    if (scope === "cross-layer") return "Cross-layer";
  }
  return scope;
}

export function ActiveRuleList({
  lang,
  conflicts,
  selectedLayerId,
  onJumpToConflict,
}: Props) {
  if (conflicts.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无规则命中", "No rules triggered")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {conflicts.map((c) => {
        const Icon = c.severity === "high" ? Shield : AlertTriangle;
        const color = c.severity === "high" ? "#ef4444" : FIGMA_COLORS.accent;
        return (
          <li key={c.id} style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Icon size={12} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 500 }}>{c.title}</span>
                <span style={{ color: FIGMA_COLORS.textMuted, marginLeft: 4 }}>
                  [{scopeLabel(c.scope, lang)}]
                </span>
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
                <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted, marginTop: 2 }}>{c.detail}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
