/**
 * Template category definitions for nav/filter.
 */

import type { TemplateCategory, TemplateDomain } from "./templateTypes";

export type TemplateCategoryMeta = {
  id: TemplateCategory | "recommended" | "all" | "free" | "favorites" | "recent" | "mine";
  labelZh: string;
  labelEn: string;
};

export type TemplateDomainMeta = {
  id: "all" | TemplateDomain;
  labelZh: string;
  labelEn: string;
};

export const TEMPLATE_DOMAIN_OPTIONS: TemplateDomainMeta[] = [
  { id: "all", labelZh: "全部", labelEn: "All" },
  { id: "base", labelZh: "基础模板", labelEn: "Base" },
  { id: "webdrama_continuity", labelZh: "网剧连续", labelEn: "Web Drama" },
  { id: "anime_continuity", labelZh: "动漫连续", labelEn: "Anime" }
];

export const TEMPLATE_NAV_CATEGORIES: TemplateCategoryMeta[] = [
  { id: "recommended", labelZh: "推荐", labelEn: "Recommended" },
  { id: "all", labelZh: "全部", labelEn: "All" },
  { id: "free", labelZh: "免费模板", labelEn: "Free" },
  { id: "recent", labelZh: "最近使用", labelEn: "Recent" },
  { id: "favorites", labelZh: "收藏", labelEn: "Favorites" },
  { id: "mine", labelZh: "我的模板", labelEn: "My Templates" },
  { id: "product", labelZh: "产品", labelEn: "Product" },
  { id: "dialogue", labelZh: "对话", labelEn: "Dialogue" },
  { id: "ad", labelZh: "广告", labelEn: "Ad" },
  { id: "short_video", labelZh: "短视频", labelEn: "Short Video" },
  { id: "social", labelZh: "社媒", labelEn: "Social" },
  { id: "camera_move", labelZh: "镜头运动", labelEn: "Camera Move" },
  { id: "composition", labelZh: "构图骨架", labelEn: "Composition" },
  { id: "continuous", labelZh: "连续调度", labelEn: "Continuous" },
  { id: "cover_poster", labelZh: "封面 / 海报", labelEn: "Cover / Poster" }
];
