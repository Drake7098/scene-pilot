/**
 * Template category definitions for nav/filter.
 */

import type { TemplateCategory, TemplateIndustry } from "./templateTypes";

export type TemplateCategoryMeta = {
  id: TemplateCategory | "recommended" | "all" | "free" | "favorites" | "recent" | "mine";
  labelZh: string;
  labelEn: string;
};

export type TemplateIndustryMeta = {
  id: "all" | TemplateIndustry;
  labelZh: string;
  labelEn: string;
};

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
  { id: "product",      labelZh: "产品",         labelEn: "Product" },
  { id: "dialogue",     labelZh: "对话",         labelEn: "Dialogue" },
  { id: "ad",           labelZh: "广告",         labelEn: "Ad" },
  { id: "short_video",  labelZh: "短视频",       labelEn: "Short Video" },
  { id: "social",       labelZh: "社媒",         labelEn: "Social" },
  { id: "camera_move",  labelZh: "镜头运动",     labelEn: "Camera Move" },
  { id: "composition",  labelZh: "构图骨架",     labelEn: "Composition" },
  { id: "continuous",   labelZh: "连续调度",     labelEn: "Continuous" },
  { id: "cover_poster", labelZh: "封面 / 海报",  labelEn: "Cover / Poster" }
];
