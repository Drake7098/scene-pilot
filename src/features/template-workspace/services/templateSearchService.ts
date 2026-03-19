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
import type { TemplateIntentId } from "../model/templateIntent";
import { getTemplateIndex } from "../../../template-engine";
import { addToRecent } from "../../../data/templateWorkspaceData";

const RECOMMENDED_TEMPLATE_IDS = [
  "tpl400_product_hero_cinematic",
  "tpl400_feature_breakdown_cinematic",
  "tpl400_product_in_hand_cinematic",
  "tpl400_white_bg_product_free_starter",
  "tpl400_selling_point_ad_cinematic",
  "tpl400_cta_landing_layout_cinematic",
  "tpl400_talking_head_ad_cinematic",
  "tpl400_solo_speaker_free_starter",
  "tpl400_dialogue_duo_cinematic",
  "tpl400_opening_shot_cinematic",
  "tpl400_emotional_peak_cinematic",
  "tpl400_tech_product_cinematic"
] as const;

const INTENT_TEMPLATE_IDS: Record<TemplateIntentId, readonly string[]> = {
  sell_product: [
    "tpl400_white_bg_product_free_starter",
    "tpl400_product_hero_cinematic",
    "tpl400_feature_breakdown_cinematic",
    "tpl400_product_in_hand_cinematic",
    "tpl400_selling_point_ad_cinematic",
    "tpl400_cta_landing_layout_cinematic",
    "tpl400_tech_product_cinematic",
    "tpl400_food_ad_cinematic"
  ],
  people_portrait: [
    "tpl400_portrait_fashion_free_starter",
    "tpl400_portrait_fashion_cinematic",
    "tpl400_lifestyle_casual_free_starter",
    "tpl400_lifestyle_casual_cinematic",
    "tpl400_beauty_closeup_free_starter",
    "tpl400_beauty_closeup_cinematic",
    "tpl400_center_composition_free_starter",
    "tpl400_center_composition_cinematic"
  ],
  cover_poster: [
    "tpl400_poster_cover_free_starter",
    "tpl400_poster_cover_cinematic",
    "tpl400_brand_promo_cover_cinematic",
    "tpl400_social_vertical_ad_free_starter",
    "tpl400_social_vertical_ad_cinematic",
    "tpl400_title_subtitle_layout_cinematic",
    "tpl400_logo_copy_layout_cinematic",
    "tpl400_cta_landing_layout_free_starter"
  ],
  talking_video: [
    "tpl400_solo_speaker_free_starter",
    "tpl400_solo_speaker_cinematic",
    "tpl400_talking_head_ad_cinematic",
    "tpl400_interview_layout_free_starter",
    "tpl400_interview_layout_cinematic",
    "tpl400_tutorial_demo_cinematic",
    "tpl400_product_tutorial_cinematic",
    "tpl400_tracking_dialogue_cinematic"
  ],
  story_video: [
    "tpl400_opening_shot_cinematic",
    "tpl400_character_entrance_cinematic",
    "tpl400_emotional_peak_cinematic",
    "tpl400_turning_point_shot_cinematic",
    "tpl400_scene_push_forward_cinematic",
    "tpl400_drama_conflict_cinematic",
    "tpl400_drama_climax_cinematic",
    "tpl400_drama_ending_cinematic"
  ],
  continuity: [
    "tpl400_dialogue_duo_cinematic",
    "tpl400_faceoff_scene_cinematic",
    "tpl400_tracking_dialogue_cinematic",
    "tpl400_chase_sequence_advanced_motion",
    "tpl400_dialogue_sequence_advanced_motion",
    "tpl400_action_sequence_advanced_motion",
    "tpl400_continuous_single_scene_advanced_motion",
    "tpl400_multi_scene_continuity_advanced_motion"
  ]
} as const;

const INTENT_FALLBACK_RULES: Record<TemplateIntentId, (t: TemplateIndex) => boolean> = {
  sell_product: (t) =>
    t.mediaType === "image" &&
    ["product", "ad"].includes(t.category) &&
    ["ecommerce", "ad"].includes(t.industry ?? ""),
  people_portrait: (t) =>
    t.mediaType === "image" &&
    ["composition", "social"].includes(t.category) &&
    /(portrait|beauty|fashion|lifestyle|人物|写真|美妆)/i.test(
      [t.familyId, t.nameEn, t.nameZh, t.familyNameEn, t.familyNameZh].join(" ")
    ),
  cover_poster: (t) =>
    t.mediaType === "image" &&
    ["cover_poster", "social", "ad"].includes(t.category),
  talking_video: (t) =>
    t.mediaType === "video" &&
    ["dialogue", "ad"].includes(t.category),
  story_video: (t) =>
    t.mediaType === "video" &&
    ["short_video"].includes(t.category),
  continuity: (t) =>
    t.storyPlan === "continuous" || t.category === "continuous"
};

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
  const curated = RECOMMENDED_TEMPLATE_IDS
    .map((id) => list.find((t) => t.id === id))
    .filter((t): t is TemplateIndex => Boolean(t));
  if (curated.length >= 10) return curated;

  const paidHighIntent = list.filter((t) =>
    !t.isFree &&
    ["product", "ad", "dialogue", "short_video"].includes(t.category)
  );
  const freeUtility = list.filter((t) =>
    t.isFree &&
    ["product", "ad", "dialogue"].includes(t.category)
  );

  return [...curated, ...paidHighIntent, ...freeUtility]
    .filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx)
    .slice(0, 12);
}

export function getTemplatesForIntent(intentId: TemplateIntentId): TemplateIndex[] {
  const list = getTemplateIndex();
  const curated = INTENT_TEMPLATE_IDS[intentId]
    .map((id) => list.find((t) => t.id === id))
    .filter((t): t is TemplateIndex => Boolean(t));
  if (curated.length >= 6) return curated;

  const fallback = list
    .filter(INTENT_FALLBACK_RULES[intentId])
    .sort((a, b) => {
      if (a.isFree !== b.isFree) return a.isFree ? 1 : -1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.cost - b.cost;
    });
  return [...curated, ...fallback]
    .filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx)
    .slice(0, 12);
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
    const intentList = getTemplatesForIntent(intentId);
    const intentIds = new Set(intentList.map((t) => t.id));
    list = scope === "recommended"
      ? intentList
      : list.filter((t) => intentIds.has(t.id));
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
