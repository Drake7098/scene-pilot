/**
 * Template search service - filter index by scope, category, filters, search query.
 *
 * Fix: scope and category are now additive (not mutually exclusive).
 *   Step 1 - scope determines base pool
 *   Step 2 - category + filters narrow within that pool
 */

import type { TemplateIndex } from "../model/templateIndex";
import type {
  TemplateWorkspaceScope,
  TemplateWorkspaceFilters
} from "../model/templateFilter";
import { getTemplateIndex } from "../../../template-engine";
import { addToRecent } from "../../../data/templateWorkspaceData";

function matchesSearch(t: TemplateIndex, q: string): boolean {
  const lower = q.toLowerCase();
  if (t.nameEn.toLowerCase().includes(lower)) return true;
  if (t.nameZh.toLowerCase().includes(lower)) return true;
  if (t.familyId.toLowerCase().includes(lower)) return true;
  if (t.familyNameEn?.toLowerCase().includes(lower)) return true;
  if (t.familyNameZh?.toLowerCase().includes(lower)) return true;
  if (t.descriptionEn?.toLowerCase().includes(lower)) return true;
  if (t.descriptionZh?.toLowerCase().includes(lower)) return true;
  if (t.tags.some((tag) => tag.toLowerCase().includes(lower))) return true;
  if (t.category.toLowerCase().includes(lower)) return true;
  return false;
}

export function getRecommendedFromIndex(): TemplateIndex[] {
  const list = getTemplateIndex();
  const featured = list.filter((t) => t.featured).slice(0, 20);
  if (featured.length >= 12) return featured.slice(0, 12);
  const free = list.filter((t) => t.isFree);
  return featured.length > 0 ? featured : free.slice(0, 12);
}

function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem("scenepilot_template_recent_ids_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function getFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem("scenepilot_template_favorite_ids_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRecentFromIndex(): TemplateIndex[] {
  const list = getTemplateIndex();
  const ids = getRecentIds();
  return ids
    .map((id) => list.find((t) => t.id === id))
    .filter((t): t is TemplateIndex => Boolean(t));
}

export function getFavoritesFromIndex(): TemplateIndex[] {
  const list = getTemplateIndex();
  const ids = getFavoriteIds();
  return ids
    .map((id) => list.find((t) => t.id === id))
    .filter((t): t is TemplateIndex => Boolean(t));
}

export function filterTemplateIndex(
  items: TemplateIndex[],
  scope: TemplateWorkspaceScope,
  category: string | null,
  filters: TemplateWorkspaceFilters,
  searchQuery: string
): TemplateIndex[] {
  // --- Step 1: scope determines the base pool ---
  let list: TemplateIndex[];

  if (scope === "recommended") {
    list = getRecommendedFromIndex();
  } else if (scope === "free") {
    list = items.filter((t) => t.isFree);
  } else if (scope === "favorites") {
    list = getFavoritesFromIndex();
  } else if (scope === "recent") {
    list = getRecentFromIndex();
  } else if (scope === "mine") {
    list = [];
  } else {
    // scope === "all" — full pool
    list = [...items];
  }

  // --- Step 2: category narrows within scope pool (additive, not exclusive) ---
  if (category && category !== "all") {
    list = list.filter((t) => t.category === category);
  }

  // --- Step 3: search query ---
  if (searchQuery.trim()) {
    const q = searchQuery.trim();
    list = list.filter((t) => matchesSearch(t, q));
  }

  // --- Step 4: filter bar ---
  if (filters.mediaType !== "all") {
    list = list.filter((t) => t.mediaType === filters.mediaType);
  }
  if (filters.storyPlan !== "all") {
    list = list.filter((t) => t.storyPlan === filters.storyPlan);
  }
  if (filters.ratio !== "all") {
    list = list.filter((t) => t.ratio === filters.ratio);
  }
  if (filters.pricing !== "all" && scope !== "free") {
    list = list.filter((t) =>
      filters.pricing === "free" ? t.isFree : !t.isFree
    );
  }
  if (filters.industry && filters.industry !== "all") {
    list = list.filter((t) => t.industry === filters.industry);
  }

  return list;
}
