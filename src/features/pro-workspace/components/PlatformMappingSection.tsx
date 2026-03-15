/**
 * Platform Adapt UI v1 - PlatformMappingSection
 * Displays mapping explanations. UI display only, no mapping engine. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { getPlatformCapability } from "../../../config/platformCapabilities";
import { resolvePlatformPatch } from "../../../utils/promptEngines/shared";
import { ArrowRight } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Derive mapping explanations from existing preset + capability + patch */
function getMappingItems(platformId: PlatformPresetId, lang: Lang): { from: string; to: string }[] {
  const preset = getPlatformPreset(platformId);
  const cap = getPlatformCapability(preset.baseProfile);
  const patch = resolvePlatformPatch(platformId);

  const items: { from: string; to: string }[] = [];

  items.push({
    from: "Layout",
    to: cap.prefersStructuredBlocks
      ? t(lang, "结构化块 / 文本描述", "Structured blocks / text")
      : t(lang, "文本描述", "Text description"),
  });

  items.push({
    from: "Camera",
    to: cap.prefersKeywordChain
      ? t(lang, "关键词链 / prompt token", "Keyword chain / prompt token")
      : t(lang, "自然语言 prompt", "Natural language prompt"),
  });

  items.push({
    from: "Motion",
    to: !cap.supportsVideo
      ? t(lang, "忽略", "Ignored")
      : patch.compressTail
        ? t(lang, "简化", "Simplified")
        : t(lang, "进入 prompt", "Into prompt"),
  });

  items.push({
    from: "Style",
    to: cap.prefersKeywordChain
      ? t(lang, "标签列表", "Tag list")
      : t(lang, "自然语言描述", "Natural language"),
  });

  if (preset.patchId) {
    items.push({
      from: t(lang, "适配", "Adaptation"),
      to: `${preset.patchId} (${preset.strategyNote})`,
    });
  }

  return items;
}

export function PlatformMappingSection({ lang, platformId }: Props) {
  const items = getMappingItems(platformId, lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(({ from, to }, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: FIGMA_COLORS.text,
          }}
        >
          <span style={{ minWidth: 60, color: FIGMA_COLORS.textMuted }}>{from}</span>
          <ArrowRight size={12} color={FIGMA_COLORS.textMuted} />
          <span style={{ flex: 1 }}>{to}</span>
        </div>
      ))}
    </div>
  );
}
