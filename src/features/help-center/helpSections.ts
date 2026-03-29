/**
 * Help Center — section list and labels (new 14-section structure).
 * Stage 1: section id stable; labels zh/en only.
 */

import type { HelpSectionId, HelpSectionMeta } from "./types";

export const HELP_SECTIONS: HelpSectionMeta[] = [
  { id: "intro", labelZh: "简介", labelEn: "Introduction" },
  { id: "workspace", labelZh: "工作台", labelEn: "Workspace" },
  { id: "templates", labelZh: "模板", labelEn: "Templates" },
  { id: "advanced_templates", labelZh: "专业模板", labelEn: "Pro Templates" },
  { id: "credits", labelZh: "积分", labelEn: "Credits" },
  { id: "billing", labelZh: "计费", labelEn: "Billing" },
  { id: "generation", labelZh: "生成方式", labelEn: "Generation Modes" },
  { id: "camera", labelZh: "镜头与运镜", labelEn: "Camera" },
  { id: "lighting", labelZh: "布光", labelEn: "Lighting" },
  { id: "director", labelZh: "导演与风格", labelEn: "Director" },
  { id: "continuity", labelZh: "连续性", labelEn: "Continuity" },
  { id: "export", labelZh: "导出", labelEn: "Export" },
  { id: "platform", labelZh: "API 与本地接入", labelEn: "API & Local" },
  { id: "faq", labelZh: "常见问题", labelEn: "FAQ" }
];

export function getHelpSections(lang: "zh" | "en"): Array<{ id: HelpSectionId; label: string }> {
  return HELP_SECTIONS.map((s) => ({
    id: s.id,
    label: lang === "zh" ? s.labelZh : s.labelEn
  }));
}
