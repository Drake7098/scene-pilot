/**
 * Prompt UI v1 - PromptWarningSection
 * Displays prompt-related warnings and limits. Read-only, no auto-fix. Aligns with Figma design reference.
 * Consumes Rule UI results (layoutLocked, disabled, conflicts affecting prompt).
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { AlertTriangle } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  layoutLocked: boolean;
  mediaMode: "image" | "video";
  conflicts: PromptConflict[];
  /** Count of disabled fields that affect prompt */
  disabledFieldCount: number;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function PromptWarningSection({
  lang,
  layoutLocked,
  mediaMode,
  conflicts,
  disabledFieldCount,
}: Props) {
  const warnings: string[] = [];

  if (layoutLocked) {
    warnings.push(
      t(
        lang,
        "当前 applyMode = 仅布局，场景级字段未进入 prompt",
        "applyMode = layout_only: scene fields not in prompt"
      )
    );
  }

  if (mediaMode === "image") {
    warnings.push(
      t(
        lang,
        "图片模式：T1 / 视频运动表达已精简或移除",
        "Image mode: T1 / video motion expression reduced or removed"
      )
    );
  }

  if (disabledFieldCount > 0) {
    warnings.push(
      t(
        lang,
        `${disabledFieldCount} 个字段因 policy/template 被禁用，未进入 prompt`,
        `${disabledFieldCount} field(s) disabled by policy/template, not in prompt`
      )
    );
  }

  const promptRelevantConflicts = conflicts.filter(
    (c) => c.field === "notes" || c.field === "externalPrompt" || c.field === "scene"
  );
  if (promptRelevantConflicts.length > 0) {
    warnings.push(
      t(
        lang,
        `${promptRelevantConflicts.length} 个冲突可能影响 prompt 输出质量`,
        `${promptRelevantConflicts.length} conflict(s) may affect prompt output quality`
      )
    );
  }

  if (warnings.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无提示词相关警告", "No prompt warnings")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {warnings.map((w, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertTriangle size={12} color={FIGMA_COLORS.accent} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{w}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
