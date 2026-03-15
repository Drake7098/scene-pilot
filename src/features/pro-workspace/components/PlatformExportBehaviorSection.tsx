/**
 * Platform Adapt UI v1 - PlatformExportBehaviorSection
 * Explains export behavior per platform. No new export logic. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { PlatformPresetId } from "../../../config/platformPresets";
import { getPlatformPreset } from "../../../config/platformPresets";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  platformId: PlatformPresetId;
  exportMode: string;
  generationSource: "hosted" | "byo";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

/** Derive export behavior explanation from existing preset */
function getBehaviorItems(
  platformId: PlatformPresetId,
  exportMode: string,
  generationSource: string,
  lang: Lang
): { label: string; desc: string }[] {
  const preset = getPlatformPreset(platformId);
  const items: { label: string; desc: string }[] = [];

  if (exportMode === "prompt_only") {
    items.push({
      label: t(lang, "仅提示词", "Prompt only"),
      desc: t(
        lang,
        "复制或导出 prompt 文本，适配当前平台风格",
        "Copy or export prompt text, adapted for current platform"
      ),
    });
  }

  if (exportMode === "package") {
    items.push({
      label: t(lang, "完整项目包", "Package"),
      desc: t(
        lang,
        "导出项目 JSON + 参考图，含平台配置",
        "Export project JSON + refs, includes platform config"
      ),
    });
  }

  items.push({
    label: t(lang, "生成", "Generate"),
    desc:
      generationSource === "hosted"
        ? t(lang, "使用平台托管生成", "Uses hosted generation")
        : t(lang, "使用我的 API 生成", "Uses My API generation"),
  });

  items.push({
    label: t(lang, "上传模式", "Upload mode"),
    desc: preset.uploadMode === "upload-first"
      ? t(lang, "先上传参考图再填写 prompt", "Upload refs first, then prompt")
      : t(lang, "先填写 prompt 再上传", "Prompt first, then upload"),
  });

  if (preset.patchId) {
    items.push({
      label: t(lang, "适配器", "Adapter"),
      desc: t(lang, `使用 ${preset.patchId} 进行 prompt 适配`, `Uses ${preset.patchId} for prompt adaptation`),
    });
  }

  return items;
}

export function PlatformExportBehaviorSection({
  lang,
  platformId,
  exportMode,
  generationSource,
}: Props) {
  const items = getBehaviorItems(platformId, exportMode, generationSource, lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(({ label, desc }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: FIGMA_COLORS.text }}>{label}</span>
          <span style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}
