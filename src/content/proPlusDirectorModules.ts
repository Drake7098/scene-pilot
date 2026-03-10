import type { Lang } from "../i18n";
import {
  applyProMotionSelection,
  getProCameraPreset,
  proPlusDisabledIds,
  type ProMotionTier
} from "./proCameraPresets";

export type ProDirectorGoal = "narrative_clear" | "emotional_impact" | "commercial_showcase";
export type ProDirectorStrength = "light" | "medium" | "strong";
export type ProDirectorStyle = "realistic" | "cinematic" | "stylized";
export type ProDirectorMedia = "image" | "video";

export type ProDirectorSelection = {
  goal: ProDirectorGoal;
  strength: ProDirectorStrength;
  style: ProDirectorStyle;
  autoPack: boolean;
};

export const PRO_DIRECTOR_GOAL_MARK = "pro_director_goal:";
export const PRO_DIRECTOR_STRENGTH_MARK = "pro_director_strength:";
export const PRO_DIRECTOR_STYLE_MARK = "pro_director_style:";
export const PRO_DIRECTOR_AUTOPACK_MARK = "pro_director_autopack:";

function parseMarker(notes: string, mark: string) {
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

function asGoal(value: string): ProDirectorGoal {
  return value === "narrative_clear" || value === "emotional_impact" || value === "commercial_showcase"
    ? value
    : "narrative_clear";
}

function asStrength(value: string): ProDirectorStrength {
  return value === "light" || value === "medium" || value === "strong" ? value : "medium";
}

function asStyle(value: string): ProDirectorStyle {
  return value === "realistic" || value === "cinematic" || value === "stylized" ? value : "cinematic";
}

export function parseProDirectorSelection(notes: string): ProDirectorSelection {
  const goal = asGoal(parseMarker(notes, PRO_DIRECTOR_GOAL_MARK));
  const strength = asStrength(parseMarker(notes, PRO_DIRECTOR_STRENGTH_MARK));
  const style = asStyle(parseMarker(notes, PRO_DIRECTOR_STYLE_MARK));
  const autoPackRaw = parseMarker(notes, PRO_DIRECTOR_AUTOPACK_MARK).toLowerCase();
  const autoPack = autoPackRaw === "1" || autoPackRaw === "true" || autoPackRaw === "yes";
  return { goal, strength, style, autoPack };
}

export function applyProDirectorSelection(notes: string, selection: ProDirectorSelection) {
  let next = writeMarker(notes, PRO_DIRECTOR_GOAL_MARK, selection.goal);
  next = writeMarker(next, PRO_DIRECTOR_STRENGTH_MARK, selection.strength);
  next = writeMarker(next, PRO_DIRECTOR_STYLE_MARK, selection.style);
  next = writeMarker(next, PRO_DIRECTOR_AUTOPACK_MARK, selection.autoPack ? "1" : "0");
  return next;
}

type PackRecommendation = {
  basicId: string | null;
  proPlusIds: string[];
};

function uniquePush(list: string[], id: string) {
  if (!id || list.includes(id)) return;
  list.push(id);
}

function strengthCap(strength: ProDirectorStrength) {
  if (strength === "light") return 1;
  if (strength === "strong") return 3;
  return 2;
}

function sanitizePack(input: PackRecommendation): PackRecommendation {
  const next: PackRecommendation = { basicId: input.basicId, proPlusIds: [] };
  for (const id of input.proPlusIds) {
    const item = getProCameraPreset(id);
    if (!item || item.tier !== ("pro_plus" as ProMotionTier)) continue;
    const disabled = proPlusDisabledIds({ basicId: next.basicId, proPlusIds: next.proPlusIds });
    if (disabled.has(id)) continue;
    next.proPlusIds.push(id);
  }
  return next;
}

export function recommendProDirectorPack(
  media: ProDirectorMedia,
  selection: ProDirectorSelection
): PackRecommendation {
  const plus: string[] = [];
  let basicId: string | null = null;

  if (selection.goal === "narrative_clear") {
    basicId = media === "video" ? "slow_push_in" : "locked_static";
    uniquePush(plus, "eyeline_match");
    uniquePush(plus, "over_shoulder");
  } else if (selection.goal === "emotional_impact") {
    basicId = "slow_push_in";
    uniquePush(plus, "reaction_push");
    uniquePush(plus, "dolly_zoom");
  } else {
    basicId = media === "video" ? "side_follow" : "locked_static";
    uniquePush(plus, "insert_detail");
    uniquePush(plus, "reveal_pan");
  }

  if (selection.style === "realistic") {
    uniquePush(plus, "same_space_shift");
  } else if (selection.style === "cinematic") {
    uniquePush(plus, "match_cut");
    uniquePush(plus, "light_dissolve");
  } else {
    uniquePush(plus, "morph_cut");
    uniquePush(plus, "neon_pulse");
  }

  const capped = plus.slice(0, strengthCap(selection.strength));
  return sanitizePack({ basicId, proPlusIds: capped });
}

function textGoal(lang: Lang, goal: ProDirectorGoal) {
  const map: Record<ProDirectorGoal, string> = {
    narrative_clear: lang === "zh" ? "叙事清晰" : "Narrative clarity",
    emotional_impact: lang === "zh" ? "情绪冲击" : "Emotional impact",
    commercial_showcase: lang === "zh" ? "商业展示" : "Commercial showcase"
  };
  return map[goal];
}

function textStrength(lang: Lang, strength: ProDirectorStrength) {
  const map: Record<ProDirectorStrength, string> = {
    light: lang === "zh" ? "轻" : "Light",
    medium: lang === "zh" ? "中" : "Medium",
    strong: lang === "zh" ? "强" : "Strong"
  };
  return map[strength];
}

function textStyle(lang: Lang, style: ProDirectorStyle) {
  const map: Record<ProDirectorStyle, string> = {
    realistic: lang === "zh" ? "写实" : "Realistic",
    cinematic: lang === "zh" ? "电影感" : "Cinematic",
    stylized: lang === "zh" ? "风格化" : "Stylized"
  };
  return map[style];
}

function imageDirectorLine(lang: Lang, selection: ProDirectorSelection) {
  if (lang === "zh") {
    if (selection.goal === "commercial_showcase") {
      return "摄影策略：主体边缘清晰，材质纹理可读，光比可控，产品与背景分层明确。";
    }
    if (selection.goal === "emotional_impact") {
      return "摄影策略：突出主体表情与动作张力，控制高光与暗部细节，避免画面噪乱。";
    }
    return "摄影策略：主体、环境、关系层级清晰，构图稳定，光线与质感统一。";
  }
  if (selection.goal === "commercial_showcase") {
    return "Photo strategy: clear edge separation, readable material texture, controlled contrast, and strong subject-background layering.";
  }
  if (selection.goal === "emotional_impact") {
    return "Photo strategy: emphasize facial/action tension, protect highlight-shadow detail, and avoid visual clutter.";
  }
  return "Photo strategy: clear subject-environment hierarchy, stable composition, and coherent lighting/material language.";
}

function videoDirectorLine(lang: Lang, selection: ProDirectorSelection) {
  if (lang === "zh") {
    if (selection.goal === "commercial_showcase") {
      return "剪辑策略：信息点先建立后特写，镜头衔接平顺，关键卖点在切换处保持连续可读。";
    }
    if (selection.goal === "emotional_impact") {
      return "剪辑策略：情绪节点前后做节奏对比，反应镜头与推进镜头协同，避免无意义切换。";
    }
    return "剪辑策略：先建立空间关系再推进重点，镜头语法一致，转场逻辑明确。";
  }
  if (selection.goal === "commercial_showcase") {
    return "Edit strategy: establish first then detail close-ups, keep transitions smooth, and preserve key selling points across cuts.";
  }
  if (selection.goal === "emotional_impact") {
    return "Edit strategy: contrast pacing around emotional beats, align reaction and push-in shots, avoid meaningless cuts.";
  }
  return "Edit strategy: establish spatial relation before emphasis, keep grammar consistent, and maintain explicit transition logic.";
}

export function buildProDirectorPromptLine(
  lang: Lang,
  media: ProDirectorMedia,
  selection: ProDirectorSelection
) {
  const prefix = lang === "zh"
    ? `PRO+ 导演模块：目标=${textGoal(lang, selection.goal)}；强度=${textStrength(lang, selection.strength)}；风格=${textStyle(lang, selection.style)}。`
    : `PRO+ Director Module: goal=${textGoal(lang, selection.goal)}; intensity=${textStrength(lang, selection.strength)}; style=${textStyle(lang, selection.style)}.`;
  const strategy = media === "image" ? imageDirectorLine(lang, selection) : videoDirectorLine(lang, selection);
  return `${prefix} ${strategy}`;
}

export function applyRecommendedProPackToNotes(
  notes: string,
  media: ProDirectorMedia,
  selection: ProDirectorSelection
) {
  const pack = recommendProDirectorPack(media, selection);
  return applyProMotionSelection(notes, pack);
}

export function proPromptQualityGate(input: string) {
  const lines = (input ?? "")
    .split("\n")
    .map((line) => line.trimEnd());
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const key = line.trim().toLowerCase();
    if (!key) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

