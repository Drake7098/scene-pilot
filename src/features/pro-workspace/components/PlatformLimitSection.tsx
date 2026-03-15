/**
 * Platform Adapt UI v1 - PlatformLimitSection
 * Displays platform limits. Explanation only, no rule changes. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { getPlatformCapability } from "../../../config/platformCapabilities";
import { resolvePlatformPatch } from "../../../utils/promptEngines/shared";
import { AlertCircle } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
  mediaMode: "image" | "video";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Derive limit explanations from existing config */
function getLimitItems(
  platformId: PlatformPresetId,
  mediaMode: "image" | "video",
  lang: Lang
): { limit: string; reason: string }[] {
  const preset = getPlatformPreset(platformId);
  const cap = getPlatformCapability(preset.baseProfile);
  const patch = resolvePlatformPatch(platformId);
  const items: { limit: string; reason: string }[] = [];

  if (!cap.supportsVideo && mediaMode === "video") {
    items.push({
      limit: t(lang, "视频运动", "Video motion"),
      reason: t(lang, "该平台不支持视频，运动表达会被忽略", "Platform does not support video; motion expressions ignored"),
    });
  }

  if (preset.maxRefsPerObject < 3) {
    items.push({
      limit: t(lang, "参考图数量", "Reference count"),
      reason: t(
        lang,
        `最多 ${preset.maxRefsPerObject} 张/对象，超出部分不进入 prompt`,
        `Max ${preset.maxRefsPerObject} refs per object; excess omitted`
      ),
    });
  }

  const maxChars = mediaMode === "image" ? cap.maxCharsImage : cap.maxCharsVideo;
  items.push({
    limit: t(lang, "字符上限", "Char limit"),
    reason: t(lang, `约 ${maxChars} 字符，超出会被裁剪`, `~${maxChars} chars; excess trimmed`),
  });

  if (preset.promptStyle === "short" && cap.recommendedPromptStyle === "short") {
    items.push({
      limit: t(lang, "长 prompt", "Long prompt"),
      reason: t(lang, "偏好短结构，长描述会被精简", "Prefers short structure; long descriptions simplified"),
    });
  }

  if (patch.compressTail) {
    items.push({
      limit: t(lang, "机器尾", "Machine tail"),
      reason: t(lang, "adapter 会压缩机器尾", "Adapter compresses machine tail"),
    });
  }

  if (patch.budgetFactor && patch.budgetFactor < 1) {
    items.push({
      limit: t(lang, "token 预算", "Token budget"),
      reason: t(lang, `adapter 按 ${Math.round(patch.budgetFactor * 100)}% 裁剪`, `Adapter trims to ~${Math.round(patch.budgetFactor * 100)}%`),
    });
  }

  return items;
}

export function PlatformLimitSection({ lang, platformId, mediaMode }: Props) {
  const items = getLimitItems(platformId, mediaMode, lang);

  if (items.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无特殊限制说明", "No special limits")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {items.map(({ limit, reason }, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <AlertCircle size={12} color={FIGMA_COLORS.textMuted} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 500 }}>{limit}</span>
              <span style={{ color: FIGMA_COLORS.textMuted, marginLeft: 6 }}>— {reason}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
