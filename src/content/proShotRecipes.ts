import type { Lang } from "../i18n";
import {
  applyProMotionSelection,
  getProCameraPreset,
  parseProMotionSelection,
  proPlusDisabledIds
} from "./proCameraPresets";

export type ProShotRecipe = {
  id: string;
  nameZh: string;
  nameEn: string;
  effectZh: string;
  effectEn: string;
  basicId: string | null;
  proPlusIds: string[];
};

export const PRO_SHOT_RECIPE_MARK = "pro_shot_recipe:";

export const PRO_SHOT_RECIPES: ProShotRecipe[] = [
  { id: "steady_dialogue", nameZh: "平稳对话", nameEn: "Steady Dialogue", effectZh: "稳定、自然，适合双人交流和剧情对白。", effectEn: "Stable and natural for two-person dialogue scenes.", basicId: "eye_level", proPlusIds: ["over_shoulder", "reverse_angle"] },
  { id: "emotion_push", nameZh: "情绪逼近", nameEn: "Emotion Push", effectZh: "情绪会越拍越近，适合人物内心变化。", effectEn: "Gradually intensifies emotion and inner character focus.", basicId: "slow_push_in", proPlusIds: ["reaction_push", "sudden_realization"] },
  { id: "suspense_watch", nameZh: "悬疑窥视", nameEn: "Suspense Watch", effectZh: "像有人在暗处观察，紧张和不安更强。", effectEn: "Feels like hidden surveillance with strong tension.", basicId: "high_angle", proPlusIds: ["paranoia_peek", "reveal_pan"] },
  { id: "hero_entry", nameZh: "英雄出场", nameEn: "Hero Entry", effectZh: "人物气场更强，适合登场和压迫感。", effectEn: "Boosts character presence for entrances and dominance.", basicId: "low_angle", proPlusIds: ["freeze_then_push"] },
  { id: "dream_memory", nameZh: "梦境回忆", nameEn: "Dream Memory", effectZh: "画面更漂浮，更像层层进入记忆。", effectEn: "Creates drifting, layered memory-like progression.", basicId: "slow_pull_out", proPlusIds: ["dream_drift", "memory_palace"] },
  { id: "truth_reveal", nameZh: "顿悟真相", nameEn: "Truth Reveal", effectZh: "真相被意识到的瞬间会更有心理冲击。", effectEn: "Adds psychological shock to a realization moment.", basicId: "slow_push_in", proPlusIds: ["dolly_zoom", "sudden_realization"] },
  { id: "premium_commercial", nameZh: "高级广告质感", nameEn: "Premium Commercial", effectZh: "更精致、更高级，适合品牌和产品。", effectEn: "Refined premium feel for brand and product shots.", basicId: "orbit_right", proPlusIds: ["insert_detail", "glass_refraction"] },
  { id: "character_trail", nameZh: "人物尾随", nameEn: "Character Trail", effectZh: "代入感强，适合进入、探索、跟人物走。", effectEn: "Strong immersion for following a character through space.", basicId: "follow_back", proPlusIds: ["same_space_shift"] },
  { id: "rhythm_transition", nameZh: "节奏转场", nameEn: "Rhythm Transition", effectZh: "节奏明显，适合短视频和信息点推进。", effectEn: "Strong pacing for short-form rhythm and transitions.", basicId: "move_right", proPlusIds: ["whip_pan", "match_cut"] },
  { id: "relationship_standoff", nameZh: "关系对峙", nameEn: "Relationship Standoff", effectZh: "人物关系紧张，气压更低更有压迫。", effectEn: "Builds pressure and tension between characters.", basicId: "eye_level", proPlusIds: ["over_shoulder", "reaction_push"] },
  { id: "lonely_space", nameZh: "孤独环境包围", nameEn: "Lonely Space", effectZh: "人物会被环境吞没，氛围感更强。", effectEn: "Lets environment overwhelm the character for atmosphere.", basicId: "slow_pull_out", proPlusIds: ["same_space_shift"] },
  { id: "first_person_impact", nameZh: "第一人称冲击", nameEn: "First-Person Impact", effectZh: "代入强、速度快，适合冲刺和惊险片段。", effectEn: "High immersion and speed for chase or danger beats.", basicId: "handheld", proPlusIds: ["pov_lock", "first_person_rush"] },
  { id: "product_showcase", nameZh: "产品展示", nameEn: "Product Showcase", effectZh: "主体突出、细节清晰，适合商品或道具。", effectEn: "Highlights subject detail for products and props.", basicId: "slow_push_in", proPlusIds: ["insert_detail"] },
  { id: "mystery_reveal", nameZh: "神秘揭示", nameEn: "Mystery Reveal", effectZh: "信息一点点露出来，适合剧情揭晓。", effectEn: "Gradually reveals information for mystery beats.", basicId: "pan_right", proPlusIds: ["reveal_pan", "smoke_manifest"] },
  { id: "bullet_highlight", nameZh: "子弹时间高光", nameEn: "Bullet Highlight", effectZh: "动作瞬间被放大，适合记忆点和高光。", effectEn: "Amplifies key action moments for memorable highlights.", basicId: "orbit_left", proPlusIds: ["bullet_time_orbit"] },
  { id: "cyber_neon", nameZh: "赛博霓虹片段", nameEn: "Cyber Neon", effectZh: "风格明显，适合音乐短片和赛博氛围。", effectEn: "Stylized cyber mood for music and neon-driven scenes.", basicId: "side_follow", proPlusIds: ["neon_pulse", "mirror_split"] }
];

const RECIPE_MAP = new Map(PRO_SHOT_RECIPES.map((item) => [item.id, item]));

function readMarker(notes: string, mark: string) {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
  return hit ? hit.trim().slice(mark.length).trim() : "";
}

function writeMarker(notes: string, mark: string, value: string) {
  const lines = (notes ?? "").split("\n").filter((line) => line.trim().length > 0);
  const nextLines = lines.filter((line) => !line.trim().toLowerCase().startsWith(mark));
  if (value.trim()) nextLines.push(`${mark} ${value.trim()}`);
  return nextLines.join("\n");
}

function normalizeSelection(input: { basicId: string | null; proPlusIds: string[] }) {
  const basicId = input.basicId && getProCameraPreset(input.basicId)?.tier === "basic" ? input.basicId : null;
  const nextIds: string[] = [];
  for (const id of input.proPlusIds) {
    const item = getProCameraPreset(id);
    if (!item || item.tier !== "pro_plus") continue;
    const disabled = proPlusDisabledIds({ basicId, proPlusIds: nextIds });
    if (disabled.has(id)) continue;
    nextIds.push(id);
  }
  return { basicId, proPlusIds: nextIds };
}

function recipeMatchesSelection(recipe: ProShotRecipe, selection: { basicId: string | null; proPlusIds: string[] }) {
  const normalized = normalizeSelection({ basicId: recipe.basicId, proPlusIds: recipe.proPlusIds });
  if (normalized.basicId !== selection.basicId) return false;
  if (normalized.proPlusIds.length !== selection.proPlusIds.length) return false;
  return normalized.proPlusIds.every((id, index) => selection.proPlusIds[index] === id);
}

export function getProShotRecipes() {
  return PRO_SHOT_RECIPES;
}

export function getProShotRecipe(id: string | null | undefined) {
  if (!id) return null;
  return RECIPE_MAP.get(id) ?? null;
}

export function parseProShotRecipeId(notes: string) {
  const id = readMarker(notes, PRO_SHOT_RECIPE_MARK);
  return getProShotRecipe(id) ? id : null;
}

export function proShotRecipeName(id: string, lang: Lang) {
  const recipe = getProShotRecipe(id);
  if (!recipe) return "";
  return lang === "zh" ? recipe.nameZh : recipe.nameEn;
}

export function proShotRecipeEffect(id: string, lang: Lang) {
  const recipe = getProShotRecipe(id);
  if (!recipe) return "";
  return lang === "zh" ? recipe.effectZh : recipe.effectEn;
}

export function summarizeProShotRecipe(notes: string, lang: Lang) {
  const selection = parseProMotionSelection(notes);
  const exactMatch = PRO_SHOT_RECIPES.find((recipe) => recipeMatchesSelection(recipe, selection));
  if (exactMatch) return lang === "zh" ? exactMatch.nameZh : exactMatch.nameEn;
  const stored = parseProShotRecipeId(notes);
  if (stored) return lang === "zh" ? "自定义组合" : "Custom Mix";
  if (selection.basicId || selection.proPlusIds.length) return lang === "zh" ? "自定义组合" : "Custom Mix";
  return lang === "zh" ? "未选择" : "None";
}

export function matchProShotRecipeId(selection: { basicId: string | null; proPlusIds: string[] }) {
  return PRO_SHOT_RECIPES.find((recipe) => recipeMatchesSelection(recipe, selection))?.id ?? null;
}

export function applyProShotRecipe(notes: string, recipeId: string) {
  const recipe = getProShotRecipe(recipeId);
  if (!recipe) return writeMarker(notes, PRO_SHOT_RECIPE_MARK, "");
  const normalized = normalizeSelection({ basicId: recipe.basicId, proPlusIds: recipe.proPlusIds });
  let next = applyProMotionSelection(notes, normalized);
  next = writeMarker(next, PRO_SHOT_RECIPE_MARK, recipe.id);
  return next;
}

export function applyManualMotionSelectionWithRecipeSync(notes: string, selection: { basicId: string | null; proPlusIds: string[] }) {
  const normalized = normalizeSelection(selection);
  let next = applyProMotionSelection(notes, normalized);
  const match = PRO_SHOT_RECIPES.find((recipe) => recipeMatchesSelection(recipe, normalized));
  next = writeMarker(next, PRO_SHOT_RECIPE_MARK, match?.id ?? "");
  return next;
}
