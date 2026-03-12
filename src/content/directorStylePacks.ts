import type { Lang } from "../i18n";
import type { LightingProfileId } from "./lightingProfiles";

export type DirectorStylePackId =
  | "architectural_tension"
  | "intimate_observation"
  | "industrial_epic"
  | "kinetic_pursuit"
  | "poetic_restraint"
  | "commercial_spectacle";

export type DirectorStylePack = {
  id: DirectorStylePackId;
  labelZh: string;
  labelEn: string;
  descZh: string;
  descEn: string;
  imageDefaults?: {
    shot?: string;
    time?: string;
    keyDir?: string;
    mood?: string;
  };
  videoDefaults?: {
    shot?: string;
    movement?: string;
    transitionType?: string;
    time?: string;
    keyDir?: string;
    mood?: string;
  };
  promptZh: string;
  promptEn: string;
  lightingProfileIds?: LightingProfileId[];
  lightingCueZh?: string;
  lightingCueEn?: string;
  rhythmCueZh?: string;
  rhythmCueEn?: string;
};

export const DIRECTOR_STYLE_PACK_MARK = "director_pack:";

export const DIRECTOR_STYLE_PACKS: DirectorStylePack[] = [
  {
    id: "architectural_tension",
    labelZh: "建筑悬疑",
    labelEn: "Architectural Tension",
    descZh: "先建立空间秩序，再逐步收紧压迫与悬疑。",
    descEn: "Establish spatial order first, then tighten pressure and suspense.",
    lightingProfileIds: ["low_key_edge_separation"],
    imageDefaults: { shot: "wide", time: "night", keyDir: "backlight", mood: "mysterious" },
    videoDefaults: { shot: "wide", movement: "slow_push_in", transitionType: "same_space_shift", time: "night", keyDir: "backlight", mood: "mysterious" },
    promptZh: "导演级风格包：先建立空间几何关系，再逐步收紧压迫感；镜头克制、秩序清晰、情绪持续累积。",
    promptEn: "Director pack: establish spatial geometry first, then tighten pressure; restrained camera, clear order, cumulative tension.",
    lightingCueZh: "光照倾向：低调对比、轮廓压光、空间边缘保持可读但不过曝。",
    lightingCueEn: "Lighting bias: low-key contrast with readable edge light and controlled highlights.",
    rhythmCueZh: "节奏倾向：先建立空间，再逐步收紧，不急于切换。",
    rhythmCueEn: "Rhythm bias: establish the space first, then tighten gradually without rushing the cut."
  },
  {
    id: "intimate_observation",
    labelZh: "贴身观察",
    labelEn: "Intimate Observation",
    descZh: "贴近人物和关系细节，优先反应、停顿和呼吸感。",
    descEn: "Stay close to character and relationship detail, prioritizing reactions, pauses, and breath.",
    lightingProfileIds: ["natural_skin_readability"],
    imageDefaults: { shot: "medium", time: "day", keyDir: "top_left", mood: "warm" },
    videoDefaults: { shot: "medium", movement: "handheld", transitionType: "cut", time: "day", keyDir: "top_left", mood: "warm" },
    promptZh: "导演级风格包：贴近人物观察，优先细微反应、停顿和关系变化，镜头存在感轻但情绪靠近。",
    promptEn: "Director pack: intimate observation of micro-reactions, pauses, and relational shifts with gentle camera presence.",
    lightingCueZh: "光照倾向：自然主光贴近人物皮肤与表情，避免夸张戏剧光抢走关系细节。",
    lightingCueEn: "Lighting bias: natural key light close to skin and expression, avoiding overly theatrical distraction.",
    rhythmCueZh: "节奏倾向：允许停顿、反应和呼吸感，优先关系细节而不是大动作。",
    rhythmCueEn: "Rhythm bias: allow pauses, reactions, and breath; favor relational detail over large action."
  },
  {
    id: "industrial_epic",
    labelZh: "工业史诗",
    labelEn: "Industrial Epic",
    descZh: "主体与大尺度环境并置，强调规模、机械感和空间压强。",
    descEn: "Pair the subject with large-scale environments and emphasize scale, machinery, and spatial pressure.",
    lightingProfileIds: ["rim_scale_separation"],
    imageDefaults: { shot: "wide", time: "sunset", keyDir: "rim_light", mood: "cold" },
    videoDefaults: { shot: "wide", movement: "slow_pull_out", transitionType: "dissolve", time: "sunset", keyDir: "rim_light", mood: "cold" },
    promptZh: "导演级风格包：强调规模、金属感和空间压强，让主体与巨大环境形成对照，节奏稳重而宏大。",
    promptEn: "Director pack: emphasize scale, metallic force, and environmental pressure; contrast the subject against a large world with stately pacing.",
    lightingCueZh: "光照倾向：边缘光、体积光或工业反光更重要，让主体与结构轮廓清楚分离。",
    lightingCueEn: "Lighting bias: prioritize rim light, volume, or industrial reflections to separate subject from structure.",
    rhythmCueZh: "节奏倾向：宏大、稳重、逐步揭示，不做碎切。",
    rhythmCueEn: "Rhythm bias: stately, gradual reveals rather than fragmented cutting."
  },
  {
    id: "kinetic_pursuit",
    labelZh: "高速追踪",
    labelEn: "Kinetic Pursuit",
    descZh: "优先方向、速度和持续追踪感，适合奔跑、追逐和任务推进。",
    descEn: "Prioritize direction, speed, and sustained tracking for chase and mission-forward motion.",
    lightingProfileIds: ["action_path_readability"],
    imageDefaults: { shot: "medium", time: "day", keyDir: "top_right", mood: "cinematic" },
    videoDefaults: { shot: "medium", movement: "handheld", transitionType: "cut", time: "day", keyDir: "top_right", mood: "cinematic" },
    promptZh: "导演级风格包：优先速度感、方向连续性和追踪张力，动作清晰，镜头跟随主体推进，不做多余停顿。",
    promptEn: "Director pack: prioritize speed, directional continuity, and pursuit tension; keep action readable and the camera committed to forward tracking.",
    lightingCueZh: "光照倾向：优先保证动作和方向可读，不让光影遮掉运动路径。",
    lightingCueEn: "Lighting bias: preserve action readability and directional clarity instead of burying movement in shadow.",
    rhythmCueZh: "节奏倾向：持续推进、少犹豫、切换服务动势而不是打断动势。",
    rhythmCueEn: "Rhythm bias: keep momentum forward; transitions should serve motion, not interrupt it."
  },
  {
    id: "poetic_restraint",
    labelZh: "诗性克制",
    labelEn: "Poetic Restraint",
    descZh: "画面留白更多，动作克制，优先情绪流动和空间呼吸感。",
    descEn: "Use more negative space and restraint, prioritizing emotional flow and breathing room.",
    lightingProfileIds: ["soft_layered_breathing"],
    imageDefaults: { shot: "medium", time: "blue_hour", keyDir: "top_right", mood: "cold" },
    videoDefaults: { shot: "medium", movement: "static", transitionType: "dissolve", time: "blue_hour", keyDir: "top_right", mood: "cold" },
    promptZh: "导演级风格包：画面留白、动作克制、节奏舒缓，优先情绪流动与空间呼吸感。",
    promptEn: "Director pack: more negative space, restrained motion, and slower pacing with emotional flow.",
    lightingCueZh: "光照倾向：柔和、克制、层次细腻，避免过强对比破坏呼吸感。",
    lightingCueEn: "Lighting bias: soft, restrained, and layered; avoid aggressive contrast that breaks the breathing room.",
    rhythmCueZh: "节奏倾向：缓慢、留白、少解释，允许情绪自然流动。",
    rhythmCueEn: "Rhythm bias: slower, spare, and less explanatory; let emotion flow naturally."
  },
  {
    id: "commercial_spectacle",
    labelZh: "商业大片",
    labelEn: "Commercial Spectacle",
    descZh: "高可读、高对比、重点明确，强调展示效率和结果感。",
    descEn: "High readability, high contrast, and clear emphasis with showcase efficiency.",
    lightingProfileIds: ["premium_focal_highlights"],
    imageDefaults: { shot: "close", time: "golden_hour", keyDir: "rim_light", mood: "bright" },
    videoDefaults: { shot: "close", movement: "slow_push_in", transitionType: "match_cut", time: "golden_hour", keyDir: "rim_light", mood: "bright" },
    promptZh: "导演级风格包：高可读、高对比、重点明确，优先卖点呈现、节奏强化和镜头结果感。",
    promptEn: "Director pack: high readability, high contrast, and strong emphasis; prioritize showcase beats, punchy rhythm, and result-oriented framing.",
    lightingCueZh: "光照倾向：高可读主光与边缘高光并重，确保主体、材质和重点信息一眼可见。",
    lightingCueEn: "Lighting bias: prioritize readable key light and premium highlights so subject, materials, and focal points read immediately.",
    rhythmCueZh: "节奏倾向：明确、直接、结果导向，重点尽快到位。",
    rhythmCueEn: "Rhythm bias: direct, result-oriented, and fast to the point."
  }
];

const DIRECTOR_STYLE_PACK_MAP = new Map(DIRECTOR_STYLE_PACKS.map((item) => [item.id, item]));

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

export function getDirectorStylePack(id: string | null | undefined) {
  if (!id) return null;
  return DIRECTOR_STYLE_PACK_MAP.get(id as DirectorStylePackId) ?? null;
}

export function parseDirectorStylePackId(notes: string): DirectorStylePackId | null {
  const raw = readMarker(notes, DIRECTOR_STYLE_PACK_MARK);
  return getDirectorStylePack(raw)?.id ?? null;
}

export function applyDirectorStylePack(notes: string, packId: DirectorStylePackId | "") {
  const next = packId && getDirectorStylePack(packId)?.id ? packId : "";
  return writeMarker(notes, DIRECTOR_STYLE_PACK_MARK, next);
}

export function directorStylePackLabel(packId: DirectorStylePackId | null, lang: Lang) {
  const pack = getDirectorStylePack(packId);
  if (!pack) return lang === "zh" ? "自动" : "Auto";
  return lang === "zh" ? pack.labelZh : pack.labelEn;
}
