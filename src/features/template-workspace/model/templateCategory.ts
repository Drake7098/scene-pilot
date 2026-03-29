/**
 * Template category definitions for nav/filter.
 */

import type { TemplateIndustry } from "./templateTypes";
import type { TemplateIndex } from "./templateIndex";
import type { FrontCategory } from "../../../template-engine/types/templatePayload";

export type TemplateCategoryMeta = {
  id: string;
  labelZh: string;
  labelEn: string;
};

export type TemplateIndustryMeta = {
  id: "all" | TemplateIndustry;
  labelZh: string;
  labelEn: string;
};

export const TEMPLATE_CATEGORIES = {
  daily: [
    "商品展示",
    "人物形象",
    "封面视觉",
    "口播视频",
    "剧情片段"
  ],
  pro: [
    "广告镜头",
    "影视镜头",
    "动画镜头",
    "游戏视觉",
    "风格实验"
  ]
} as const;

export type TemplateDisplayCategory =
  | (typeof TEMPLATE_CATEGORIES.daily)[number]
  | (typeof TEMPLATE_CATEGORIES.pro)[number];

const FRONT_CATEGORY_LABELS: Record<FrontCategory, TemplateDisplayCategory> = {
  sell_product: "商品展示",
  people_portrait: "人物形象",
  cover_poster: "封面视觉",
  video_talking_head: "口播视频",
  story_video: "剧情片段",
  continuous_storyboard: "广告镜头",
  dialogue_multishot: "影视镜头",
  action_motion: "游戏视觉",
  chase_sequence: "风格实验",
  anime_stylized: "动画镜头"
};

const LEGACY_CATEGORY_LABELS: Record<string, TemplateDisplayCategory> = {
  "卖货出图": "商品展示",
  "人物出图": "人物形象",
  "封面海报": "封面视觉",
  "视频口播": "口播视频",
  "剧情短视频": "剧情片段",
  "连续分镜": "影视镜头",
  "多镜对话": "影视镜头",
  "动作连续": "影视镜头",
  "追逐调度": "影视镜头",
  "动漫风格": "动画镜头",
  sell_product: "商品展示",
  people_portrait: "人物形象",
  cover_poster: "封面视觉",
  talking_video: "口播视频",
  video_talking_head: "口播视频",
  story_video: "剧情片段",
  continuity: "广告镜头",
  continuous_storyboard: "广告镜头",
  dialogue: "影视镜头",
  dialogue_multishot: "影视镜头",
  action: "游戏视觉",
  action_motion: "游戏视觉",
  chase: "风格实验",
  chase_sequence: "风格实验",
  anime: "动画镜头",
  anime_stylized: "动画镜头"
};

const DISPLAY_CATEGORY_EN: Record<TemplateDisplayCategory, string> = {
  "商品展示": "Product Showcase",
  "人物形象": "Character Portraits",
  "封面视觉": "Cover Visuals",
  "口播视频": "Talking Videos",
  "剧情片段": "Story Snippets",
  "广告镜头": "Ad Shots",
  "影视镜头": "Film Shots",
  "动画镜头": "Animation Shots",
  "游戏视觉": "Game Visuals",
  "风格实验": "Style Experiments"
};

export function mapOldCategory(old: string): string {
  const normalized = String(old || "").trim();
  return LEGACY_CATEGORY_LABELS[normalized] ?? normalized;
}

export function getTemplateDisplayCategory(template: Pick<TemplateIndex, "frontCategory" | "category" | "domain" | "industry">): TemplateDisplayCategory {
  if (template.frontCategory && FRONT_CATEGORY_LABELS[template.frontCategory]) {
    return FRONT_CATEGORY_LABELS[template.frontCategory];
  }
  const mapped = mapOldCategory(template.category);
  if (([...TEMPLATE_CATEGORIES.daily, ...TEMPLATE_CATEGORIES.pro] as readonly string[]).includes(mapped)) {
    return mapped as TemplateDisplayCategory;
  }
  if (template.industry === "anime" || template.domain === "anime") return "动画镜头";
  if (template.industry === "game") return "游戏视觉";
  if (template.domain === "brand" || template.category === "ad") return "广告镜头";
  return "影视镜头";
}

export function getTemplateDisplayCategoryLabel(category: string, lang: "zh" | "en"): string {
  const mapped = mapOldCategory(category) as TemplateDisplayCategory;
  if (lang === "zh") return mapped;
  return DISPLAY_CATEGORY_EN[mapped] ?? mapped;
}

/** User-facing industry options for the filter dropdown */
export const TEMPLATE_INDUSTRY_OPTIONS: TemplateIndustryMeta[] = [
  { id: "all",         labelZh: "全部场景",   labelEn: "All Scenes" },
  { id: "drama",       labelZh: "电视剧/网剧", labelEn: "Drama" },
  { id: "anime",       labelZh: "动漫",        labelEn: "Anime" },
  { id: "ad",          labelZh: "广告/品牌",   labelEn: "Advertising" },
  { id: "ecommerce",   labelZh: "电商",        labelEn: "E-Commerce" },
  { id: "shortfilm",   labelZh: "短片/MV",     labelEn: "Short Film / MV" },
  { id: "documentary", labelZh: "纪录片",      labelEn: "Documentary" },
  { id: "social",      labelZh: "社交/自媒体", labelEn: "Social Media" },
  { id: "game",        labelZh: "游戏",        labelEn: "Game" }
];

export const TEMPLATE_NAV_CATEGORIES: TemplateCategoryMeta[] = [
  { id: "recommended",  labelZh: "推荐",        labelEn: "Recommended" },
  { id: "all",          labelZh: "全部",         labelEn: "All" },
  { id: "free",         labelZh: "免费模板",     labelEn: "Free" },
  { id: "recent",       labelZh: "最近使用",     labelEn: "Recent" },
  { id: "favorites",    labelZh: "收藏",         labelEn: "Favorites" },
  { id: "mine",         labelZh: "我的模板",     labelEn: "My Templates" },
  { id: "商品展示",       labelZh: "商品展示",     labelEn: "Product Showcase" },
  { id: "人物形象",       labelZh: "人物形象",     labelEn: "Character Portraits" },
  { id: "封面视觉",       labelZh: "封面视觉",     labelEn: "Cover Visuals" },
  { id: "口播视频",       labelZh: "口播视频",     labelEn: "Talking Videos" },
  { id: "剧情片段",       labelZh: "剧情片段",     labelEn: "Story Snippets" },
  { id: "广告镜头",       labelZh: "广告镜头",     labelEn: "Ad Shots" },
  { id: "影视镜头",       labelZh: "影视镜头",     labelEn: "Film Shots" },
  { id: "动画镜头",       labelZh: "动画镜头",     labelEn: "Animation Shots" },
  { id: "游戏视觉",       labelZh: "游戏视觉",     labelEn: "Game Visuals" },
  { id: "风格实验",       labelZh: "风格实验",     labelEn: "Style Experiments" }
];
