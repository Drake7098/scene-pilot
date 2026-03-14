/**
 * Template workspace data layer.
 * Uses 400-template library (40 families × 10 variants).
 */

import type { UnifiedTemplate } from "../types/templateWorkspace";
import {
  getTemplateLibrary400,
  getFreeCount,
  getTotalCount
} from "./templateLibrary400";

export type TemplateWorkspaceScope =
  | "recommended"
  | "all"
  | "free"
  | "favorites"
  | "recent"
  | "mine";

export type TemplateNavCategory =
  | "recommended"
  | "all"
  | "free"
  | "favorites"
  | "recent"
  | "mine"
  | "product"
  | "dialogue"
  | "ad"
  | "short_video"
  | "social"
  | "camera_move"
  | "composition"
  | "continuous"
  | "cover_poster";

export type TemplateWorkspaceFilters = {
  mediaType: "all" | "image" | "video";
  storyPlan: "all" | "single" | "continuous" | "multi_cam" | "edited";
  ratio: "all" | "16:9" | "9:16" | "1:1";
  pricing: "all" | "free" | "paid";
};

export type ApplyTemplateMode = "layout_only" | "layout_plus_style" | "full_workflow";

export type TemplateWorkspaceItem = UnifiedTemplate;

const RECENT_IDS_KEY = "scenepilot_template_recent_ids_v1";
const FAVORITE_IDS_KEY = "scenepilot_template_favorite_ids_v1";

function loadRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveRecentIds(ids: string[]) {
  try {
    localStorage.setItem(RECENT_IDS_KEY, JSON.stringify(ids.slice(0, 20)));
  } catch {
    /* ignore */
  }
}

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToRecent(templateId: string) {
  const ids = loadRecentIds();
  const next = [templateId, ...ids.filter((id) => id !== templateId)];
  saveRecentIds(next);
}

export function toggleFavorite(templateId: string): boolean {
  const ids = loadFavoriteIds();
  const has = ids.includes(templateId);
  const next = has ? ids.filter((id) => id !== templateId) : [...ids, templateId];
  try {
    localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return !has;
}

export function isFavorite(templateId: string): boolean {
  return loadFavoriteIds().includes(templateId);
}

export function getTemplateWorkspaceItems(): TemplateWorkspaceItem[] {
  return getTemplateLibrary400();
}

export function getRecentTemplates(): TemplateWorkspaceItem[] {
  const items = getTemplateLibrary400();
  const ids = loadRecentIds();
  return ids
    .map((id) => items.find((t) => t.id === id))
    .filter((t): t is TemplateWorkspaceItem => Boolean(t));
}

export function getFavoriteTemplates(): TemplateWorkspaceItem[] {
  const items = getTemplateLibrary400();
  const ids = loadFavoriteIds();
  return ids
    .map((id) => items.find((t) => t.id === id))
    .filter((t): t is TemplateWorkspaceItem => Boolean(t));
}

export function getRecommendedTemplates(): TemplateWorkspaceItem[] {
  const items = getTemplateLibrary400();
  const featured = items.filter((t) => t.isFeatured).slice(0, 20);
  if (featured.length >= 12) return featured.slice(0, 12);
  const freeStarters = items.filter((t) => t.isFree);
  const byPop = [...items].sort((a, b) => b.popularity - a.popularity).slice(0, 12);
  return featured.length > 0 ? featured : freeStarters.slice(0, 6).concat(byPop.slice(0, 6));
}

export function getFreeTemplates(): TemplateWorkspaceItem[] {
  return getTemplateLibrary400().filter((t) => t.isFree);
}

export function getPaidTemplates(): TemplateWorkspaceItem[] {
  return getTemplateLibrary400().filter((t) => !t.isFree);
}

export function getTemplateStats() {
  return { total: getTotalCount(), free: getFreeCount() };
}

function matchesSearch(t: TemplateWorkspaceItem, q: string): boolean {
  const lower = q.toLowerCase();
  if (t.name.toLowerCase().includes(lower)) return true;
  if (t.family.toLowerCase().includes(lower)) return true;
  if (t.description.toLowerCase().includes(lower)) return true;
  if (t.tags.some((tag) => tag.toLowerCase().includes(lower))) return true;
  if (t.category.toLowerCase().includes(lower)) return true;
  return false;
}

export function filterTemplates(
  items: TemplateWorkspaceItem[],
  scope: TemplateWorkspaceScope,
  category: string | null,
  filters: TemplateWorkspaceFilters,
  searchQuery: string
): TemplateWorkspaceItem[] {
  let list: TemplateWorkspaceItem[];

  if (scope === "recommended") {
    list = getRecommendedTemplates();
  } else if (scope === "free") {
    list = items.filter((t) => t.isFree);
  } else if (scope === "favorites") {
    list = getFavoriteTemplates();
  } else if (scope === "recent") {
    list = getRecentTemplates();
  } else if (scope === "mine") {
    list = [];
  } else if (category && category !== "all") {
    list = items.filter((t) => t.category === category);
  } else {
    list = [...items];
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim();
    list = list.filter((t) => matchesSearch(t, q));
  }

  if (filters.mediaType !== "all") {
    list = list.filter((t) => t.mediaType === filters.mediaType);
  }
  if (filters.storyPlan !== "all") {
    list = list.filter((t) => t.storyPlan === filters.storyPlan);
  }
  if (filters.ratio !== "all") {
    list = list.filter((t) => t.ratio === filters.ratio);
  }
  if (filters.pricing !== "all") {
    list = list.filter((t) => (filters.pricing === "free" ? t.isFree : !t.isFree));
  }

  return list;
}

export const NAV_CATEGORIES: { id: TemplateNavCategory; labelZh: string; labelEn: string }[] = [
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
