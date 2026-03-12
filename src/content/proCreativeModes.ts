import type { Lang } from "../i18n";
import type { LightingProfileId } from "./lightingProfiles";
import {
  applyProMotionSelection,
  getProCameraPreset,
  getProCameraPresetsByTier,
  parseProMotionSelection,
  proMotionPrompt,
  proPlusDisabledIds,
  type ProMotionCategory
} from "./proCameraPresets";

export type VideoClassicMode = {
  id: string;
  nameZh: string;
  nameEn: string;
  effectZh: string;
  effectEn: string;
  shot: string;
  movement: string;
  proPlusIds: string[];
  transitionType?: string;
  time?: string;
  keyDir?: string;
  mood?: string;
  lightingProfileIds?: LightingProfileId[];
};

export type ImageClassicMode = {
  id: string;
  nameZh: string;
  nameEn: string;
  effectZh: string;
  effectEn: string;
  shot: string;
  imageEffectIds: string[];
  time?: string;
  keyDir?: string;
  mood?: string;
  lightingProfileIds?: LightingProfileId[];
};

export type ImageProCategory = "composition" | "relation" | "space" | "material" | "mood";

export type ImageProEffect = {
  id: string;
  category: ImageProCategory;
  labelZh: string;
  labelEn: string;
  descZh: string;
  descEn: string;
  promptZh: string;
  promptEn: string;
  conflicts?: string[];
};

export const VIDEO_CLASSIC_MARK = "video_classic_mode:";
export const IMAGE_CLASSIC_MARK = "image_classic_mode:";
export const IMAGE_PRO_EFFECTS_MARK = "image_pro_effects:";

export const IMAGE_PRO_CATEGORIES: Array<{ id: ImageProCategory; labelZh: string; labelEn: string }> = [
  { id: "composition", labelZh: "构图语法", labelEn: "Composition" },
  { id: "relation", labelZh: "关系表达", labelEn: "Relationship" },
  { id: "space", labelZh: "空间层次", labelEn: "Spatial Depth" },
  { id: "material", labelZh: "材质效果", labelEn: "Material" },
  { id: "mood", labelZh: "情绪氛围", labelEn: "Mood" }
];

export const VIDEO_CLASSIC_MODES: VideoClassicMode[] = [
  { id: "steady_dialogue", nameZh: "平稳对话", nameEn: "Steady Dialogue", effectZh: "稳定、自然，适合双人交流和剧情对白。", effectEn: "Stable and natural for two-person dialogue scenes.", shot: "over_shoulder", movement: "static", proPlusIds: ["reverse_angle"], transitionType: "reverse_angle", time: "day", keyDir: "top_left", mood: "warm", lightingProfileIds: ["natural_skin_readability"] },
  { id: "emotion_push", nameZh: "情绪逼近", nameEn: "Emotion Push", effectZh: "情绪越来越近，适合人物内心变化。", effectEn: "Gradually intensifies emotion and inner focus.", shot: "close", movement: "slow_push_in", proPlusIds: ["sudden_realization"], transitionType: "cut", time: "blue_hour", keyDir: "top_left", mood: "cinematic", lightingProfileIds: ["natural_skin_readability"] },
  { id: "suspense_watch", nameZh: "悬疑窥视", nameEn: "Suspense Watch", effectZh: "像有人在暗处观察，紧张感更强。", effectEn: "Feels like hidden surveillance with stronger tension.", shot: "medium", movement: "static", proPlusIds: ["paranoia_peek", "reveal_pan"], transitionType: "same_space_shift", time: "night", keyDir: "backlight", mood: "mysterious", lightingProfileIds: ["low_key_edge_separation"] },
  { id: "hero_entry", nameZh: "英雄出场", nameEn: "Hero Entry", effectZh: "人物气场更强，适合登场和压迫感。", effectEn: "Boosts character presence for entrances and dominance.", shot: "medium", movement: "slow_push_in", proPlusIds: ["freeze_then_push"], transitionType: "cut", time: "sunset", keyDir: "rim_light", mood: "cinematic", lightingProfileIds: ["rim_scale_separation"] },
  { id: "dream_memory", nameZh: "梦境回忆", nameEn: "Dream Memory", effectZh: "漂浮、不稳定，适合回忆和心理片段。", effectEn: "Floating and unstable for memory fragments.", shot: "wide", movement: "slow_pull_out", proPlusIds: ["dream_drift", "memory_palace"], transitionType: "dissolve", time: "blue_hour", keyDir: "backlight", mood: "cold", lightingProfileIds: ["soft_layered_breathing"] },
  { id: "truth_reveal", nameZh: "顿悟真相", nameEn: "Truth Reveal", effectZh: "真相成立瞬间更有心理冲击。", effectEn: "Adds psychological shock to the realization moment.", shot: "close", movement: "slow_push_in", proPlusIds: ["dolly_zoom"], transitionType: "match_cut", time: "night", keyDir: "top_left", mood: "mysterious", lightingProfileIds: ["low_key_edge_separation"] },
  { id: "premium_commercial", nameZh: "高级广告质感", nameEn: "Premium Commercial", effectZh: "更精致、更高级，适合品牌和产品展示。", effectEn: "Refined premium feel for brand and product films.", shot: "insert_closeup", movement: "orbit", proPlusIds: ["glass_refraction"], transitionType: "dissolve", time: "golden_hour", keyDir: "rim_light", mood: "bright", lightingProfileIds: ["premium_focal_highlights"] },
  { id: "character_trail", nameZh: "人物尾随", nameEn: "Character Trail", effectZh: "代入感强，适合进入、探索、跟人物走。", effectEn: "Immersive following shot for movement through space.", shot: "medium", movement: "handheld", proPlusIds: ["third_person_tail"], transitionType: "camera_continues", time: "day", keyDir: "top_right", mood: "cinematic", lightingProfileIds: ["action_path_readability"] },
  { id: "rhythm_transition", nameZh: "节奏转场", nameEn: "Rhythm Transition", effectZh: "节奏明显，适合短视频推进和信息点切换。", effectEn: "Strong pacing for short-form momentum and transitions.", shot: "medium", movement: "pan_right", proPlusIds: ["whip_pan", "match_cut"], transitionType: "match_cut", time: "night", keyDir: "rim_light", mood: "cinematic", lightingProfileIds: ["premium_focal_highlights"] },
  { id: "relationship_standoff", nameZh: "关系对峙", nameEn: "Relationship Standoff", effectZh: "人物关系紧张，压迫感更低更重。", effectEn: "Builds pressure and tension between characters.", shot: "over_shoulder", movement: "static", proPlusIds: ["reaction_push"], transitionType: "reverse_angle", time: "night", keyDir: "backlight", mood: "mysterious", lightingProfileIds: ["low_key_edge_separation"] },
  { id: "first_person_impact", nameZh: "第一人称冲击", nameEn: "First-Person Impact", effectZh: "代入强、速度快，适合冲刺和惊险片段。", effectEn: "Strong immersion and speed for chase or danger beats.", shot: "pov", movement: "handheld", proPlusIds: ["first_person_rush"], transitionType: "cut", time: "day", keyDir: "top_right", mood: "bright", lightingProfileIds: ["action_path_readability"] },
  { id: "mystery_reveal", nameZh: "神秘揭示", nameEn: "Mystery Reveal", effectZh: "信息一点点露出来，适合剧情揭晓。", effectEn: "Gradually reveals information for mystery beats.", shot: "medium", movement: "pan_right", proPlusIds: ["smoke_manifest"], transitionType: "same_space_shift", time: "night", keyDir: "backlight", mood: "mysterious", lightingProfileIds: ["low_key_edge_separation"] }
];

export const IMAGE_CLASSIC_MODES: ImageClassicMode[] = [
  { id: "poster_center", nameZh: "海报式中心主体", nameEn: "Poster Center", effectZh: "主体明确，视觉中心稳定，适合海报和主视觉。", effectEn: "Stable center-weighted hero framing for poster-like visuals.", shot: "medium", imageEffectIds: ["center_pressure", "clean_layering"], time: "day", keyDir: "top_left", mood: "bright", lightingProfileIds: ["natural_skin_readability"] },
  { id: "premium_product", nameZh: "高级产品质感", nameEn: "Premium Product", effectZh: "产品更精致、更高级，适合商业展示。", effectEn: "Refined premium look for product and commercial stills.", shot: "insert_closeup", imageEffectIds: ["material_focus", "glass_glow"], time: "golden_hour", keyDir: "rim_light", mood: "bright", lightingProfileIds: ["premium_focal_highlights"] },
  { id: "duo_tension", nameZh: "双人关系张力", nameEn: "Duo Tension", effectZh: "两个人物关系更紧，适合对峙和情绪戏。", effectEn: "Builds visible tension between two subjects.", shot: "medium", imageEffectIds: ["left_right_standoff", "eyeline_tension"], time: "night", keyDir: "backlight", mood: "mysterious", lightingProfileIds: ["low_key_edge_separation"] },
  { id: "lonely_env", nameZh: "孤独环境感", nameEn: "Lonely Environment", effectZh: "人物被环境包围，氛围感更强。", effectEn: "Lets environment surround the character for stronger atmosphere.", shot: "wide", imageEffectIds: ["environment_wrap", "depth_split"], time: "blue_hour", keyDir: "top_right", mood: "cold", lightingProfileIds: ["soft_layered_breathing"] },
  { id: "cinematic_still", nameZh: "电影剧照感", nameEn: "Cinematic Still", effectZh: "像电影定格，层次更完整。", effectEn: "Feels like a cinematic still with stronger layering.", shot: "medium", imageEffectIds: ["foreground_occlusion", "depth_split", "cinematic_air"], time: "sunset", keyDir: "rim_light", mood: "cinematic", lightingProfileIds: ["rim_scale_separation"] },
  { id: "dream_portrait", nameZh: "梦境肖像", nameEn: "Dream Portrait", effectZh: "更漂浮、更轻梦境感，适合人物海报。", effectEn: "Dreamlike portrait mood with softer surreal emphasis.", shot: "close", imageEffectIds: ["dream_haze", "silhouette_rim"], time: "blue_hour", keyDir: "backlight", mood: "cold", lightingProfileIds: ["soft_layered_breathing"] }
];

export const IMAGE_PRO_EFFECTS: ImageProEffect[] = [
  { id: "center_pressure", category: "composition", labelZh: "居中压迫", labelEn: "Center Pressure", descZh: "主体压在视觉中心，注意力集中。", descEn: "Locks the subject into the center for concentrated attention.", promptZh: "构图采用居中压迫式主体组织，视觉中心稳定。", promptEn: "Use center-pressure composition with stable visual focus." },
  { id: "left_right_standoff", category: "composition", labelZh: "左右对峙", labelEn: "Left-Right Standoff", descZh: "主体分布在左右两侧，关系更紧张。", descEn: "Split subjects left and right to create tension.", promptZh: "主体在左右两侧形成对峙关系，画面张力明确。", promptEn: "Place subjects in left-right opposition for visible tension." },
  { id: "foreground_occlusion", category: "space", labelZh: "前景遮挡", labelEn: "Foreground Occlusion", descZh: "前景增加遮挡，空间更有真实感。", descEn: "Adds foreground blockers for stronger spatial realism.", promptZh: "前景加入轻微遮挡，增强空间层次和真实感。", promptEn: "Add foreground occlusion to strengthen spatial realism." },
  { id: "environment_wrap", category: "space", labelZh: "环境包围", labelEn: "Environment Wrap", descZh: "主体被环境包围，氛围更强。", descEn: "Lets the environment visibly surround the subject.", promptZh: "让环境明显包围主体，强化氛围与空间存在。", promptEn: "Let environment visibly wrap around the subject." },
  { id: "depth_split", category: "space", labelZh: "前后分离", labelEn: "Depth Split", descZh: "前中后景层次分明，结构更清楚。", descEn: "Separates foreground, midground, and background clearly.", promptZh: "前景、中景、后景层次清楚分离。", promptEn: "Separate foreground, midground, and background clearly." },
  { id: "clean_layering", category: "space", labelZh: "干净层次", labelEn: "Clean Layering", descZh: "主体清楚，背景不过度抢戏。", descEn: "Keeps subject clear while background stays restrained.", promptZh: "主体清晰，背景收住，不让环境抢主角。", promptEn: "Keep the subject clear and the background restrained." },
  { id: "eyeline_tension", category: "relation", labelZh: "视线张力", labelEn: "Eyeline Tension", descZh: "通过眼神方向强化关系感。", descEn: "Uses eyelines to intensify relationship dynamics.", promptZh: "通过人物视线方向增强关系张力。", promptEn: "Use eyeline direction to heighten relationship tension." },
  { id: "subject_env_link", category: "relation", labelZh: "主体与环境呼应", labelEn: "Subject-Environment Link", descZh: "主体和环境形成明确呼应。", descEn: "Creates visible dialogue between subject and environment.", promptZh: "主体与环境形成明确呼应关系，不是孤立摆拍。", promptEn: "Create a visible relationship between subject and environment." },
  { id: "material_focus", category: "material", labelZh: "材质强调", labelEn: "Material Focus", descZh: "材质纹理更可读，适合产品和近景。", descEn: "Emphasizes readable material texture for products and details.", promptZh: "强调材质纹理和表面质感的可读性。", promptEn: "Emphasize readable material texture and surface detail." },
  { id: "glass_glow", category: "material", labelZh: "玻璃光感", labelEn: "Glass Glow", descZh: "高光和折射更高级，适合商业图。", descEn: "Adds premium glow and refraction for commercial visuals.", promptZh: "加入高级玻璃光感和折射效果。", promptEn: "Add premium glass glow and refraction." },
  { id: "dream_haze", category: "mood", labelZh: "梦境雾感", labelEn: "Dream Haze", descZh: "画面带轻雾和漂浮感。", descEn: "Creates soft haze and dreamlike air.", promptZh: "画面带轻微梦境雾感和柔和漂浮气氛。", promptEn: "Add gentle dream haze and floating atmosphere." },
  { id: "silhouette_rim", category: "mood", labelZh: "剪影边缘光", labelEn: "Silhouette Rim", descZh: "人物轮廓更鲜明，适合情绪海报。", descEn: "Highlights contour and rim light for emotional posters.", promptZh: "强调剪影轮廓和边缘光，让主体轮廓更鲜明。", promptEn: "Emphasize silhouette contour and rim light." },
  { id: "cinematic_air", category: "mood", labelZh: "电影空气感", labelEn: "Cinematic Air", descZh: "画面更像电影剧照，氛围完整。", descEn: "Adds cinematic atmosphere and still-frame cohesion.", promptZh: "加入电影空气感和完整氛围层次。", promptEn: "Add cinematic atmosphere and cohesive still-frame mood." },
  { id: "suspense_cold", category: "mood", labelZh: "冷悬疑氛围", labelEn: "Cold Suspense", descZh: "画面气压更低，更偏悬疑感。", descEn: "Lowers the emotional pressure into suspense.", promptZh: "整体氛围偏冷、偏悬疑，压低画面气压。", promptEn: "Lean the mood colder and more suspenseful." }
];

const VIDEO_CLASSIC_MAP = new Map(VIDEO_CLASSIC_MODES.map((item) => [item.id, item]));
const IMAGE_CLASSIC_MAP = new Map(IMAGE_CLASSIC_MODES.map((item) => [item.id, item]));
const IMAGE_EFFECT_MAP = new Map(IMAGE_PRO_EFFECTS.map((item) => [item.id, item]));
const VIDEO_PRO_PLUS_HIDDEN = new Set(["over_shoulder", "pov_lock", "insert_detail"]);

function readMarker(notes: string, mark: string) {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
  return hit ? hit.trim().slice(mark.length).trim() : "";
}

function writeMarker(notes: string, mark: string, value: string) {
  const lines = (notes ?? "").split("\n").filter((line) => line.trim().length > 0);
  const next = lines.filter((line) => !line.trim().toLowerCase().startsWith(mark));
  if (value.trim()) next.push(`${mark} ${value.trim()}`);
  return next.join("\n");
}

function normalizeClassicModeId(map: Map<string, unknown>, modeId: string) {
  return map.has(modeId) ? modeId : "";
}

function filterValidImageEffects(ids: string[]) {
  return Array.from(new Set(ids.filter((id) => IMAGE_EFFECT_MAP.has(id))));
}

function imageEffectConflicts(selectedIds: string[]) {
  const disabled = new Set<string>();
  const selected = selectedIds.map((id) => IMAGE_EFFECT_MAP.get(id)).filter(Boolean) as ImageProEffect[];
  for (const item of IMAGE_PRO_EFFECTS) {
    if (selectedIds.includes(item.id)) continue;
    if (selected.some((current) => current.category === item.category)) disabled.add(item.id);
    if (selected.some((current) => (current.conflicts ?? []).includes(item.id) || (item.conflicts ?? []).includes(current.id))) disabled.add(item.id);
  }
  return disabled;
}

function basicEquivalentFromScene(shot: string, movement: string) {
  if (movement === "static") return "locked_static";
  if (movement === "slow_push_in") return "slow_push_in";
  if (movement === "slow_pull_out") return "slow_pull_out";
  if (movement === "pan_left") return "pan_left";
  if (movement === "pan_right") return "pan_right";
  if (movement === "tilt_up") return "tilt_up";
  if (movement === "tilt_down") return "tilt_down";
  if (movement === "handheld") return "handheld";
  if (movement === "orbit") return "orbit_right";
  if (shot === "wide") return "aerial_rise";
  return null;
}

function normalizeVideoProPlus(shot: string, movement: string, inputIds: string[]) {
  const basicId = basicEquivalentFromScene(shot, movement);
  const nextIds: string[] = [];
  for (const id of inputIds) {
    if (VIDEO_PRO_PLUS_HIDDEN.has(id)) continue;
    const item = getProCameraPreset(id);
    if (!item || item.tier !== "pro_plus") continue;
    const disabled = proPlusDisabledIds({ basicId, proPlusIds: nextIds });
    if (disabled.has(id)) continue;
    nextIds.push(id);
  }
  return nextIds;
}

function matchVideoClassicMode(shot: string, movement: string, proPlusIds: string[]) {
  return VIDEO_CLASSIC_MODES.find((item) => {
    const normalized = normalizeVideoProPlus(item.shot, item.movement, item.proPlusIds);
    return item.shot === shot && item.movement === movement && normalized.length === proPlusIds.length && normalized.every((id, index) => proPlusIds[index] === id);
  }) ?? null;
}

function matchImageClassicMode(shot: string, imageEffectIds: string[]) {
  return IMAGE_CLASSIC_MODES.find((item) => {
    const normalized = filterValidImageEffects(item.imageEffectIds);
    return item.shot === shot && normalized.length === imageEffectIds.length && normalized.every((id, index) => imageEffectIds[index] === id);
  }) ?? null;
}

export function getVideoClassicModes() {
  return VIDEO_CLASSIC_MODES;
}

export function getImageClassicModes() {
  return IMAGE_CLASSIC_MODES;
}

export function getVisibleVideoProPlusPresets(category: ProMotionCategory) {
  return getProCameraPresetsByTier("pro_plus").filter((item) => item.category === category && !VIDEO_PRO_PLUS_HIDDEN.has(item.id));
}

export function getImageProEffectsByCategory(category: ImageProCategory) {
  return IMAGE_PRO_EFFECTS.filter((item) => item.category === category);
}

export function getImageProEffect(id: string) {
  return IMAGE_EFFECT_MAP.get(id) ?? null;
}

export function getVideoClassicMode(id: string | null | undefined) {
  if (!id) return null;
  return VIDEO_CLASSIC_MAP.get(id) ?? null;
}

export function getImageClassicMode(id: string | null | undefined) {
  if (!id) return null;
  return IMAGE_CLASSIC_MAP.get(id) ?? null;
}

export function parseVideoClassicModeId(notes: string) {
  const id = readMarker(notes, VIDEO_CLASSIC_MARK);
  return VIDEO_CLASSIC_MAP.has(id) ? id : null;
}

export function parseImageClassicModeId(notes: string) {
  const id = readMarker(notes, IMAGE_CLASSIC_MARK);
  return IMAGE_CLASSIC_MAP.has(id) ? id : null;
}

export function parseImageProEffects(notes: string) {
  return filterValidImageEffects(readMarker(notes, IMAGE_PRO_EFFECTS_MARK).split(",").map((item) => item.trim()).filter(Boolean));
}

export function applyImageProEffects(notes: string, ids: string[]) {
  return writeMarker(notes, IMAGE_PRO_EFFECTS_MARK, filterValidImageEffects(ids).join(", "));
}

export function applyVideoClassicMode(notes: string, shot: string, movement: string, modeId: string) {
  const mode = VIDEO_CLASSIC_MAP.get(modeId);
  let next = applyProMotionSelection(notes, { basicId: null, proPlusIds: normalizeVideoProPlus(mode?.shot ?? shot, mode?.movement ?? movement, mode?.proPlusIds ?? []) });
  next = writeMarker(next, VIDEO_CLASSIC_MARK, mode?.id ?? "");
  return next;
}

export function setVideoClassicModeMarker(notes: string, modeId: string) {
  return writeMarker(notes, VIDEO_CLASSIC_MARK, normalizeClassicModeId(VIDEO_CLASSIC_MAP, modeId));
}

export function syncVideoClassicMode(notes: string, shot: string, movement: string, proPlusIds: string[]) {
  const normalized = normalizeVideoProPlus(shot, movement, proPlusIds);
  let next = applyProMotionSelection(notes, { basicId: null, proPlusIds: normalized });
  next = writeMarker(next, VIDEO_CLASSIC_MARK, matchVideoClassicMode(shot, movement, normalized)?.id ?? "");
  return next;
}

export function applyImageClassicMode(notes: string, shot: string, modeId: string) {
  const mode = IMAGE_CLASSIC_MAP.get(modeId);
  let next = applyImageProEffects(notes, mode?.imageEffectIds ?? []);
  next = writeMarker(next, IMAGE_CLASSIC_MARK, mode?.id ?? "");
  return next;
}

export function setImageClassicModeMarker(notes: string, modeId: string) {
  return writeMarker(notes, IMAGE_CLASSIC_MARK, normalizeClassicModeId(IMAGE_CLASSIC_MAP, modeId));
}

export function syncImageClassicMode(notes: string, shot: string, effectIds: string[]) {
  const normalized = filterValidImageEffects(effectIds);
  let next = applyImageProEffects(notes, normalized);
  next = writeMarker(next, IMAGE_CLASSIC_MARK, matchImageClassicMode(shot, normalized)?.id ?? "");
  return next;
}

export function summarizeVideoClassicMode(notes: string, shot: string, movement: string, lang: Lang) {
  const selection = parseProMotionSelection(notes);
  const exact = matchVideoClassicMode(shot, movement, normalizeVideoProPlus(shot, movement, selection.proPlusIds));
  if (exact) return lang === "zh" ? exact.nameZh : exact.nameEn;
  if (shot || movement || selection.proPlusIds.length) return lang === "zh" ? "自定义组合" : "Custom Mix";
  return lang === "zh" ? "未选择" : "None";
}

export function summarizeImageClassicMode(notes: string, shot: string, lang: Lang) {
  const effects = parseImageProEffects(notes);
  const exact = matchImageClassicMode(shot, effects);
  if (exact) return lang === "zh" ? exact.nameZh : exact.nameEn;
  if (shot || effects.length) return lang === "zh" ? "自定义组合" : "Custom Mix";
  return lang === "zh" ? "未选择" : "None";
}

export function summarizeImageEffects(notes: string, lang: Lang) {
  const ids = parseImageProEffects(notes);
  if (!ids.length) return lang === "zh" ? "当前还没选专业图片效果。" : "No professional image effects selected yet.";
  return ids.map((id) => lang === "zh" ? IMAGE_EFFECT_MAP.get(id)?.labelZh : IMAGE_EFFECT_MAP.get(id)?.labelEn).filter(Boolean).join(lang === "zh" ? "、" : ", ");
}

export function disabledVideoProPlusIds(shot: string, movement: string, selectedIds: string[]) {
  const basicId = basicEquivalentFromScene(shot, movement);
  const disabled = proPlusDisabledIds({ basicId, proPlusIds: selectedIds });
  for (const id of VIDEO_PRO_PLUS_HIDDEN) disabled.add(id);
  return disabled;
}

export function disabledImageEffectIds(selectedIds: string[]) {
  return imageEffectConflicts(selectedIds);
}

export function buildImageProPromptLine(notes: string, lang: Lang) {
  const ids = parseImageProEffects(notes);
  const parts = ids.map((id) => {
    const item = IMAGE_EFFECT_MAP.get(id);
    if (!item) return "";
    return lang === "zh" ? item.promptZh : item.promptEn;
  }).filter(Boolean);
  if (!parts.length) return "";
  return lang === "zh" ? `专业图片：${parts.join("；")}` : `Professional image language: ${parts.join("; ")}`;
}

export function beginnerCreativeTutorialBlocks(lang: Lang) {
  return [
    {
      title: lang === "zh" ? "先用经典模式" : "Start with Classic Modes",
      body: lang === "zh"
        ? "经典模式就是一键拍法。外面只看名字，点开后再看效果说明。先选经典模式，再微调基础项，会比直接堆镜头词更稳。"
        : "Classic modes are one-click recipes. See the name first, open the menu for the effect description, then fine-tune the basics."
    },
    {
      title: lang === "zh" ? "新手先调基础，再补高级" : "Tune basics first, then add advanced layers",
      body: lang === "zh"
        ? "视频先定景别和运动，再补 PRO+；图片先定主体构图，再补专业图片效果。这样更快、更不容易冲突。"
        : "For video, set shot size and movement first, then add PRO+. For image, set framing first, then add professional image effects."
    },
    {
      title: lang === "zh" ? "创作输入放哪里" : "Where Creative Input Lives",
      body: lang === "zh"
        ? "Quick 工作台的两段原始文字会进入 Pro 左栏的“创作输入”。它们保留原始意图，给对象命名和提示词编译做参考，但不会直接覆盖分镜结构。"
        : "The two raw lines from Quick Workspace are carried into Pro under Creative Input. They preserve upstream intent for object naming and prompt compilation without overriding storyboard structure."
    }
  ];
}

export function advancedCreativeTutorialBlocks(lang: Lang) {
  return [
    {
      title: lang === "zh" ? "PRO+ 只放基础层没有的语法" : "PRO+ only keeps language beyond the base layer",
      body: lang === "zh"
        ? "像推进、拉远、平移、摇镜、跟拍、环绕这些都属于基础层。PRO+ 只负责叙事语法、心理效果、转场和超现实视觉。"
        : "Push, pull, pan, tilt, follow, and orbit belong to the base layer. PRO+ is reserved for grammar, psychology, transitions, and surreal effects."
    },
    {
      title: lang === "zh" ? "导演包和镜头语言怎么分工" : "Director Packs vs Shot Language",
      body: lang === "zh"
        ? "导演级风格包负责整体镜头、光照、转场和节奏偏向；镜头语言和专业图片效果负责局部语法。先定导演包，再补局部语言，系统会更稳定。"
        : "Directing Packs shape the overall camera, lighting, transition, and rhythm bias. Shot Language and professional image effects handle local grammar. Pick the pack first, then add local language."
    },
    {
      title: lang === "zh" ? "冲突项不隐藏，只变灰" : "Conflicts stay visible but dimmed",
      body: lang === "zh"
        ? "当一个专业项和当前基础或已选高级项冲突时，它仍然保留可见，只是变灰不可选，方便用户理解专业边界。"
        : "When a professional option conflicts with the current base or selected advanced options, it stays visible but dimmed so the user can still read the vocabulary."
    }
  ];
}
