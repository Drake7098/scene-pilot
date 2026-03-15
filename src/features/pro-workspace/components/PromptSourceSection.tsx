/**
 * Prompt UI v1 - PromptSourceSection
 * Explains main sources of prompt sections. Read-only. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import { parsePromptSections } from "../utils/parsePromptSections";
import { splitMachineNotes } from "../../../utils/promptTail";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  prompt: string;
  hasTemplate: boolean;
  applyMode: string;
  mediaMode: "image" | "video";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Maps section id to primary source explanation */
function sourceFor(id: string, lang: Lang, hasTemplate: boolean, applyMode: string, mediaMode: string): string {
  const sources: Record<string, string> = {
    scene: hasTemplate
      ? t(lang, "模板 + 场景字段", "template + scene fields")
      : t(lang, "场景字段", "scene fields"),
    camera: t(lang, "场景镜头 + 模板 / 导演包", "scene camera + template / director pack"),
    layout: t(lang, "构图 + 对象 kf", "composition + object kf"),
    subjects: t(lang, "对象 look / notes / externalPrompt", "object look / notes / externalPrompt"),
    motion: mediaMode === "video"
      ? t(lang, "对象 kf + 专业运镜", "object kf + pro motion")
      : t(lang, "图片模式下已精简", "reduced in image mode"),
    style: t(lang, "经典模式 / 导演包 / 光照", "classic mode / director pack / lighting"),
    constraints: t(lang, "规则 / 负向约束", "rules / negative constraints"),
    extras: t(lang, "混合来源", "mixed sources"),
  };
  return sources[id] ?? t(lang, "混合来源", "mixed sources");
}

export function PromptSourceSection({ lang, prompt, hasTemplate, applyMode, mediaMode }: Props) {
  const { main } = splitMachineNotes(prompt);
  const sections = parsePromptSections(main);

  if (sections.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无来源说明", "No source info")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {sections.map((s) => (
        <li key={s.id} style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 500 }}>
            {lang === "zh" ? s.title : s.titleEn}
          </span>
          <span style={{ color: FIGMA_COLORS.textMuted, marginLeft: 6 }}>
            → {sourceFor(s.id, lang, hasTemplate, applyMode, mediaMode)}
          </span>
          {applyMode === "layout_only" && (s.id === "scene" || s.id === "camera" || s.id === "style") && (
            <span style={{ color: FIGMA_COLORS.accent, marginLeft: 4, fontSize: 10 }}>
              [{t(lang, "部分受 applyMode 限制", "partially limited by applyMode")}]
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
