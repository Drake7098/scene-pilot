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
import {
  dedupByFamily,
  getTemplatesForIntent,
  getTemplatesForSubTask,
  sortByIntentPriority,
  type TemplateIntentId
} from "../model/templateIntent";
import { INTENT_CONFIG } from "../config/intentConfig";
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
  return dedupByFamily(sortByIntentPriority(list.filter((t) => t.isFree))).slice(0, 12);
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
  intentId: TemplateIntentId | null,
  subTaskId: string | null,
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

  if (intentId) {
    const intentList = getTemplatesForIntent(items, intentId);
    const intentIds = new Set(intentList.map((t) => t.id));
    list = scope === "recommended"
      ? intentList
      : list.filter((t) => intentIds.has(t.id));
  }

  if (intentId && subTaskId) {
    const subTaskList = getTemplatesForSubTask(list, intentId, subTaskId);
    const subTaskIds = new Set(subTaskList.map((t) => t.id));
    list = list.filter((t) => subTaskIds.has(t.id));
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
  const sorted = sortWithIntentPriority(list, intentId);
  // Only recommended scope keeps one template per family.
  // "All templates" and task-filtered views should keep full variants.
  if (scope === "recommended") return dedupByFamily(sorted);
  return sorted;
}

const FAMILY_PRIORITY: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  INTENT_CONFIG.forEach((intent, intentIdx) => {
    intent.subTasks.forEach((subTask, subIdx) => {
      subTask.familyIds.forEach((fid) => {
        if (!(fid in map)) {
          map[fid] = intent.id === "pro_workflows" ? 50 + subIdx : intentIdx;
        }
      });
    });
  });
  return map;
})();

function variantRank(template: TemplateIndex): number {
  if (template.variant === "free_starter") return 0;
  if (template.variant === "cinematic") return 1;
  if (template.variant === "advanced_motion") return 2;
  if (template.variant === "multi_object") return 3;
  return 4;
}

function sortWithIntentPriority(list: TemplateIndex[], intentId: TemplateIntentId | null): TemplateIndex[] {
  // When user picked a specific intent/subtask we already filtered; keep existing priority.
  if (intentId) return sortByIntentPriority(list);
  return [...list].sort((a, b) => {
    const pa = FAMILY_PRIORITY[a.familyId] ?? 999;
    const pb = FAMILY_PRIORITY[b.familyId] ?? 999;
    if (pa !== pb) return pa - pb;
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    if ((a.cost ?? 0) !== (b.cost ?? 0)) return (a.cost ?? 0) - (b.cost ?? 0);
    if (variantRank(a) !== variantRank(b)) return variantRank(a) - variantRank(b);
    return a.nameEn.localeCompare(b.nameEn);
  });
}
