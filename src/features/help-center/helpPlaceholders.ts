/**
 * Help Center — placeholder content for each section (Stage 1).
 * Format: title, one paragraph describing the section purpose, and a "Coming soon" line.
 */

import type { HelpSectionId } from "./types";
import type { Lang } from "../../i18n";

export type PlaceholderContent = {
  title: string;
  body: string;
  comingSoon: string;
};

const PLACEHOLDERS: Record<HelpSectionId, { titleZh: string; titleEn: string; bodyZh: string; bodyEn: string }> = {
  intro: {
    titleZh: "简介",
    titleEn: "Introduction",
    bodyZh:
      "ScenePilotix 用于「分镜结构 + 精准构图 + 运动轨迹」的提示词生成。本区将说明产品目标与四步流程：创建项目 → 搭结构 → 编对象 → 导出验证。",
    bodyEn:
      "ScenePilotix is for storyboard structure, precise composition, and motion prompt generation. This section will cover product goals and the four-step flow: create project → build structure → edit objects → export and validate."
  },
  workspace: {
    titleZh: "工作台",
    titleEn: "Workspace",
    bodyZh:
      "Pro 工作台布局、项目/分镜/对象层级、侧栏与顶栏入口。本区将说明如何在不同面板间切换、创作输入放在哪里、以及如何管理项目与分镜。",
    bodyEn:
      "Pro workspace layout, project / shot / object hierarchy, sidebar and top bar. This section will explain panel navigation, where creative input lives, and how to manage projects and shots."
  },
  templates: {
    titleZh: "模板",
    titleEn: "Templates",
    bodyZh:
      "模板一键带入分镜结构、镜头、布光与对象骨架。本区将说明：什么是模板、template family 与 variant、从哪里选模板、以及 applyMode（layout_only / layout_plus_style / full_workflow）与费用关系。",
    bodyEn:
      "Templates apply storyboard structure, camera, lighting, and object skeleton in one step. This section will cover: what a template is, template family and variant, where to pick templates, and applyMode (layout_only / layout_plus_style / full_workflow) and how it relates to cost."
  },
  advanced_templates: {
    titleZh: "高级模板",
    titleEn: "Advanced Templates",
    bodyZh:
      "5 credits 高级模板能力：advanced_camera、continuity、director_preset、cinematic_mode、drama_mode 等。本区将说明高级模板定义、能力标签含义、以及 L2 镜头语言由模板带入、用户仅见 L1 映射的规则。",
    bodyEn:
      "5-credit advanced template capabilities: advanced_camera, continuity, director_preset, cinematic_mode, drama_mode, etc. This section will define advanced templates, explain capability tags, and the rule that L2 camera language is template-provided while users see L1 mapping only."
  },
  credits: {
    titleZh: "积分",
    titleEn: "Credits",
    bodyZh:
      "积分用于模板应用与（未来）图片/视频生成。本区将说明积分获取方式、充值包（Starter / Standard / Creator）、以及模板扣费与同项目不重复扣的规则。",
    bodyEn:
      "Credits are used for template application and (future) image/video generation. This section will explain how to get credits, recharge packs (Starter / Standard / Creator), and template charging rules including no repeat charge in the same project."
  },
  billing: {
    titleZh: "计费",
    titleEn: "Billing",
    bodyZh:
      "按次计费、同项目同模板不重复扣、免费模板与付费档位。本区将说明 Free / Pro / Enterprise 分层、模板费用（0 / 3 / 5）、未来生成费用预留、以及升级与充值入口。",
    bodyEn:
      "Pay-per-use billing, no repeat charge for the same template in the same project, free and paid template tiers. This section will cover Free / Pro / Enterprise tiers, template cost (0 / 3 / 5), future generation cost, and upgrade / recharge entry."
  },
  generation: {
    titleZh: "生成",
    titleEn: "Generation",
    bodyZh:
      "当前图片/视频生成入口与偏好设置。本区将说明工作台内生成流程、生成偏好（profile）、以及未来生成费用与扣点规则预留说明。",
    bodyEn:
      "Current image/video generation entry and preferences. This section will explain the in-workspace generation flow, generation profile, and reserved notes for future generation cost and credit deduction."
  },
  camera: {
    titleZh: "镜头与运镜",
    titleEn: "Camera",
    bodyZh:
      "景别、基础运镜、经典模式、PRO+ 与镜头语言概念。本区将说明如何选择景别与运动、经典模式一键拍法、PRO+ 只放基础层没有的语法、以及冲突项变灰规则。",
    bodyEn:
      "Shot size, base movement, classic modes, PRO+ and camera language. This section will cover choosing shot and movement, one-click classic modes, PRO+ for grammar beyond the base layer, and conflict dimming rules."
  },
  lighting: {
    titleZh: "布光",
    titleEn: "Lighting",
    bodyZh:
      "时间、主光方向、氛围与布光配置。本区将说明时间/主光/氛围选择、经典模式与导演包携带的布光、以及专业图片效果中的布光相关项。",
    bodyEn:
      "Time of day, key direction, mood, and lighting setup. This section will explain time/key/mood choices, lighting carried by classic mode and director pack, and lighting-related professional image effects."
  },
  director: {
    titleZh: "导演与风格",
    titleEn: "Director",
    bodyZh:
      "导演包、与镜头/布光分工、经典模式。本区将说明导演级风格包负责整体镜头/光照/转场/节奏偏向、镜头语言负责局部语法、以及先定导演包再补局部语言的建议。",
    bodyEn:
      "Director packs, division of labor with camera and lighting, classic modes. This section will explain how director packs shape overall camera, lighting, transition, and rhythm; shot language handles local grammar; and the recommendation to set the pack first then add local language."
  },
  continuity: {
    titleZh: "连续性",
    titleEn: "Continuity",
    bodyZh:
      "多镜衔接、entryDir/exitDir、continuityId 锚点、导出连续序列。本区将说明连续性模板规则、不可随意删除 continuityId、以及 Continuity Sequence 导出当前镜及后续连续镜的用途。",
    bodyEn:
      "Multi-shot continuity, entryDir/exitDir, continuityId anchors, continuity sequence export. This section will cover continuity template rules, not removing continuityId arbitrarily, and using Continuity Sequence export for current and following shots."
  },
  export: {
    titleZh: "导出",
    titleEn: "Export",
    bodyZh:
      "提示词 TXT、Package 交付包、当前分镜 / 连续序列、目标模型。本区将说明各导出方式适用场景、Target Model 对文案与结构的影响、以及与平台适配的关系。",
    bodyEn:
      "Prompt TXT, Package export, current scene / continuity sequence, target model. This section will explain when to use each export type, how Target Model affects wording and structure, and relation to platform adaptation."
  },
  platform: {
    titleZh: "平台与模型",
    titleEn: "Platform",
    bodyZh:
      "目标模型、平台适配、结构强度与文案差异。本区将说明如何选择目标模型、不同模型理解方式差异、以及导出时结构强度与平台预算裁剪。",
    bodyEn:
      "Target model, platform adaptation, structure intensity and wording differences. This section will explain choosing a target model, how different models interpret prompts, and structure intensity and platform budget trimming on export."
  },
  faq: {
    titleZh: "常见问题",
    titleEn: "FAQ",
    bodyZh:
      "排错顺序、反馈入口、关于与联系方式。本区将合并排错（先冲突→对象数量/位置→风格光照）、反馈模板与发送/复制、以及 ScenePilotix 简介、版本与客服/商务/系统通知。",
    bodyEn:
      "Troubleshooting order, feedback entry, about and contact. This section will combine troubleshooting (conflicts first → object count/layout → style/lighting), feedback template and send/copy, and ScenePilotix intro, version, support, business, and system notification contacts."
  }
};

const COMING_SOON_ZH = "完整内容整理中。";
const COMING_SOON_EN = "Full content coming soon.";

export function getPlaceholderContent(sectionId: HelpSectionId, lang: Lang): PlaceholderContent {
  const p = PLACEHOLDERS[sectionId];
  return {
    title: lang === "zh" ? p.titleZh : p.titleEn,
    body: lang === "zh" ? p.bodyZh : p.bodyEn,
    comingSoon: lang === "zh" ? COMING_SOON_ZH : COMING_SOON_EN
  };
}
