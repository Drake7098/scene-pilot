/**
 * Platform Adapt UI v1 - PlatformCapabilitySection
 * Displays platform capabilities from existing presets/config. No new capability fields.
 * Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { getPlatformCapability } from "../../../config/platformCapabilities";
import { Check } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
  mediaMode: "image" | "video";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Derive display capabilities from existing PlatformCapability + PlatformPreset */
function getCapabilityItems(
  platformId: PlatformPresetId,
  mediaMode: "image" | "video",
  lang: Lang
): { label: string; supported: boolean }[] {
  const preset = getPlatformPreset(platformId);
  const cap = getPlatformCapability(preset.baseProfile);

  return [
    {
      label: t(lang, "支持图片", "Supports image"),
      supported: cap.supportsImage,
    },
    {
      label: t(lang, "支持视频", "Supports video"),
      supported: cap.supportsVideo,
    },
    {
      label: t(lang, "支持运动/运镜", "Supports motion"),
      supported: cap.supportsVideo,
    },
    {
      label: t(lang, "镜头语言", "Camera language"),
      supported: cap.prefersNaturalLanguage || cap.prefersKeywordChain,
    },
    {
      label: t(lang, "布局控制", "Layout control"),
      supported: cap.prefersStructuredBlocks || cap.prefersNaturalLanguage,
    },
    {
      label: t(lang, "参考图", "Reference images"),
      supported: (preset.maxRefsPerObject ?? 0) > 0,
    },
    {
      label: t(lang, "多对象", "Multi object"),
      supported: true,
    },
    {
      label: t(lang, "风格标签", "Style tags"),
      supported: cap.prefersKeywordChain || cap.prefersNaturalLanguage,
    },
    {
      label: t(lang, "机器尾", "Machine tail"),
      supported: cap.supportsMachineTail,
    },
  ];
}

export function PlatformCapabilitySection({ lang, platformId, mediaMode }: Props) {
  const items = getCapabilityItems(platformId, mediaMode, lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map(({ label, supported }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: supported ? FIGMA_COLORS.text : FIGMA_COLORS.textMuted,
          }}
        >
          <Check
            size={12}
            color={supported ? FIGMA_COLORS.accent : FIGMA_COLORS.textMuted}
            style={{ opacity: supported ? 1 : 0.4, flexShrink: 0 }}
          />
          {label}
          {!supported && (
            <span style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
              ({t(lang, "不支持", "not supported")})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
