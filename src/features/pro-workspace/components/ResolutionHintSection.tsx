/**
 * Rule Engine UI v1 - ResolutionHintSection
 * Provides brief resolution hints for conflicts. Read-only, no auto-fix.
 * Maps conflict types to which panel to use. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { Lightbulb } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  conflicts: PromptConflict[];
  layoutLocked: boolean;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/**
 * Maps conflict id patterns to resolution hints. Uses existing conflict ids from conflictRules.
 * Does NOT add new rule types or definitions.
 */
function getHintForConflict(id: string, lang: Lang): string | null {
  if (id.startsWith("layer_")) {
    return t(lang, "到 Objects 面板检查 notes 或 externalPrompt", "Check notes or externalPrompt in Objects panel");
  }
  if (id.startsWith("scene_static_vs_motion")) {
    return t(lang, "到 Composition 面板检查 T1 或 Objects 面板修改运动描述", "Check T1 in Composition or motion description in Objects panel");
  }
  if (id.startsWith("scene_bg_lighting_conflict")) {
    return t(lang, "到 Scene 面板检查背景描述，避免与左栏光照策略重复", "Check background in Scene panel; avoid duplicating lighting strategy");
  }
  if (id.startsWith("cross_")) {
    return t(lang, "到 Objects 或 Scene 面板统一全局动作描述", "Unify global motion in Objects or Scene panel");
  }
  return null;
}

function getLayoutLockedHint(lang: Lang): string {
  return t(
    lang,
    "重新应用模板，选择「布局+风格」或「完整工作流」解锁场景字段",
    "Re-apply template with layout_plus_style or full_workflow to unlock scene fields"
  );
}

export function ResolutionHintSection({ lang, conflicts, layoutLocked }: Props) {
  const hints: string[] = [];
  const seen = new Set<string>();

  for (const c of conflicts) {
    const h = getHintForConflict(c.id, lang);
    if (h && !seen.has(h)) {
      seen.add(h);
      hints.push(h);
    }
  }

  if (layoutLocked) {
    hints.push(getLayoutLockedHint(lang));
  }

  if (hints.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "无需处理建议", "No resolution hints")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {hints.map((hint, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Lightbulb size={12} color={FIGMA_COLORS.accent} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{hint}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
