import type { Lang } from "../i18n";
import type { IntentPlan } from "../types/intentPlan";

export type BriefParserMode = "baseline" | "round1" | "round2" | "round3";

type ParseLevel = 0 | 1 | 2 | 3;

const CN_NUM_MAP: Record<string, number> = {
  "一": 1,
  "二": 2,
  "两": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "七": 7,
  "八": 8,
  "九": 9,
  "十": 10
};

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function countHits(text: string, terms: string[]) {
  let hits = 0;
  for (const term of terms) {
    if (text.includes(term)) hits += 1;
  }
  return hits;
}

function normalizeInput(brief: string) {
  const source = brief.replace(/\[ScenePilot Object Hints\][\s\S]*/g, "").trim();
  const text = source
    .toLowerCase()
    .replace(/[“”"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { source, text };
}

function parseRatio(text: string): IntentPlan["ratio"] {
  if (hasAny(text, ["9:16", "竖屏", "竖构图", "vertical", "mobile wallpaper", "手机壁纸"])) return "9:16";
  if (hasAny(text, ["16:9", "横屏", "landscape", "wide", "banner", "横幅"])) return "16:9";
  return "1:1";
}

function parseGoal(text: string, level: ParseLevel): IntentPlan["goal"] {
  if (level === 0) {
    if (hasAny(text, ["海报", "poster"])) return "poster";
    if (hasAny(text, ["广告", "ad", "campaign"])) return "ad";
    if (hasAny(text, ["人像", "portrait", "headshot"])) return "portrait";
    if (hasAny(text, ["分镜", "storyframe", "story frame", "shot"])) return "storyframe";
    if (hasAny(text, ["scene", "场景", "room", "street"])) return "scene";
    return "unknown";
  }

  if (hasAny(text, ["广告", "ad ", "ad-", "campaign", "主视觉", "kv", "key visual", "商品图", "电商图", "product shot"])) return "ad";
  if (hasAny(text, ["海报", "poster", "情绪海报", "movie poster"])) return "poster";
  if (hasAny(text, ["人像", "portrait", "headshot", "close portrait"])) return "portrait";
  if (hasAny(text, ["分镜", "storyframe", "story board", "shot reference", "镜头参考"])) return "storyframe";
  if (hasAny(text, ["场景", "scene", "街景", "room", "interior", "environment"])) return "scene";
  return "unknown";
}

function parseMediaType(text: string, level: ParseLevel): IntentPlan["mediaType"] {
  if (level === 0) {
    if (hasAny(text, ["video", "视频", "镜头", "shot"])) return "video";
    return "image";
  }

  const videoTerms = ["video", "视频", "动图", "动画", "镜头运动", "运镜", "转场", "clip", "6秒", "10秒", "15秒"];
  const imageTerms = ["image", "图片", "图像", "海报", "poster", "主视觉", "kv", "photo", "静帧", "广告图"];
  const videoHits = countHits(text, videoTerms);
  const imageHits = countHits(text, imageTerms);
  if (videoHits === 0) return "image";
  if (imageHits > 0 && videoHits <= 1) return "image";
  return videoHits >= 2 ? "video" : "image";
}

function parseFraming(text: string, level: ParseLevel): IntentPlan["camera"]["framing"] {
  if (level === 0) {
    if (hasAny(text, ["left", "左", "靠左"])) return "left";
    if (hasAny(text, ["right", "右", "靠右"])) return "right";
    if (hasAny(text, ["balanced", "平衡", "对称"])) return "balanced";
    if (hasAny(text, ["center", "居中", "中央"])) return "center";
    return "center";
  }
  if (hasAny(text, ["偏左", "left", "靠左", "left side"])) return "left";
  if (hasAny(text, ["偏右", "right", "靠右", "right side"])) return "right";
  if (hasAny(text, ["对称", "balanced", "平衡", "symmetry"])) return "balanced";
  if (hasAny(text, ["居中", "center", "中央", "中景主体"])) return "center";
  return "center";
}

function parseBackgroundDensity(text: string, level: ParseLevel): IntentPlan["scene"]["backgroundDensity"] {
  if (level === 0) {
    if (hasAny(text, ["clean", "简洁", "干净", "minimal"])) return "clean";
    if (hasAny(text, ["rich", "复杂", "dense", "detail-rich"])) return "rich";
    return "normal";
  }
  if (hasAny(text, ["背景干净", "简洁", "clean", "minimal", "留白", "极简", "空背景"])) return "clean";
  if (hasAny(text, ["背景太乱", "复杂", "rich", "dense", "细节多", "繁杂", "crowded", "busy"])) return "rich";
  return "normal";
}

function parseLocation(text: string, level: ParseLevel) {
  if (level === 0) {
    if (hasAny(text, ["indoor", "室内", "房间", "studio"])) return "indoor";
    if (hasAny(text, ["street", "街头", "城市", "city"])) return "street";
    if (hasAny(text, ["forest", "森林", "野外", "mountain"])) return "outdoor nature";
    return "generic scene";
  }
  if (hasAny(text, ["室内", "indoor", "room", "studio", "客厅", "摄影棚"])) return "indoor";
  if (hasAny(text, ["街头", "street", "city", "城市", "urban", "地铁"])) return "street";
  if (hasAny(text, ["森林", "mountain", "outdoor", "户外", "沙漠", "海边", "park"])) return "outdoor nature";
  return "generic scene";
}

function parseStyle(text: string, level: ParseLevel): IntentPlan["style"] {
  const genre = hasAny(text, ["anime", "二次元"]) ? "anime"
    : hasAny(text, ["cinematic", "电影感"]) ? "cinematic"
      : hasAny(text, ["realistic", "写实", "photoreal"]) ? "realistic"
        : level >= 2 && hasAny(text, ["cyberpunk", "赛博", "未来感"]) ? "cyberpunk"
          : undefined;
  const mood = hasAny(text, ["dramatic", "戏剧", "紧张"]) ? "dramatic"
    : hasAny(text, ["soft", "柔和", "calm"]) ? "soft"
      : hasAny(text, ["dark", "暗黑", "moody"]) ? "moody"
        : undefined;
  const lighting = hasAny(text, ["backlight", "逆光"]) ? "backlight"
    : hasAny(text, ["soft light", "柔光"]) ? "soft"
      : hasAny(text, ["neon", "霓虹"]) ? "neon"
        : hasAny(text, ["daylight", "白天", "自然光"]) ? "daylight"
          : level >= 2 && hasAny(text, ["low key", "压暗", "暗调"]) ? "low-key"
            : undefined;
  return { genre, mood, lighting };
}

function toIntMaybe(raw: string) {
  if (/^\d+$/.test(raw)) return Number(raw);
  return CN_NUM_MAP[raw] ?? 0;
}

function parseSubjectCount(text: string, fallbackFromSplit: number, level: ParseLevel): number {
  if (level <= 1) return Math.max(1, Math.min(4, fallbackFromSplit));

  const explicit = text.match(/([0-9一二两三四五六七八九十]+)\s*(?:个)?(?:主体|人|角色|objects?|subjects?|people|人物)/i);
  if (explicit) {
    const count = toIntMaybe(explicit[1]);
    if (count > 0) return Math.max(1, Math.min(4, count));
  }

  if (hasAny(text, ["单人", "一人", "single subject", "solo", "单主体"])) return 1;
  if (hasAny(text, ["双人", "两人", "two people", "double subject", "双主体", "一男一女", "couple"])) return 2;
  if (hasAny(text, ["三人", "three people", "三主体", "trio"])) return 3;
  if (hasAny(text, ["多人", "群像", "crowd", "group shot"])) return 4;
  return Math.max(1, Math.min(4, fallbackFromSplit));
}

function cleanupSubjectLabel(input: string) {
  return input
    .replace(/^(做一张|来一张|生成|请做|create|make|generate)\s*/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/^(画面|图片|图像|海报|广告主视觉)\s*/i, "")
    .trim();
}

function parseSubjects(brief: string, lang: Lang, level: ParseLevel): IntentPlan["subjects"] {
  if (level === 0) {
    const cleaned = brief.replace(/\[ScenePilot Object Hints\][\s\S]*/g, "").trim();
    const raw = cleaned.split(/[\n,，。;；]|(?:\band\b)|(?:\bwith\b)|和/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (!raw.length) {
      return [{
        id: "subject_1",
        label: lang === "zh" ? "主主体" : "main subject",
        role: "main",
        positionHint: "center",
        sizeHint: "large",
        locked: false
      }];
    }
    return raw.map((label, idx) => ({
      id: `subject_${idx + 1}`,
      label,
      role: idx === 0 ? "main" : "secondary",
      positionHint: idx === 0 ? "center" : idx % 2 ? "left" : "right",
      sizeHint: idx === 0 ? "large" : "medium",
      locked: false
    }));
  }

  const cleaned = brief.replace(/\[ScenePilot Object Hints\][\s\S]*/g, "").trim();
  const rawTokens = cleaned.split(/[\n,，。;；]|(?:\band\b)|(?:\bwith\b)|(?:\bplus\b)|和|以及/gi)
    .map((item) => cleanupSubjectLabel(item))
    .filter((item) => item.length >= 2)
    .slice(0, 6);

  const deduped: string[] = [];
  for (const token of rawTokens) {
    if (deduped.some((x) => x === token)) continue;
    deduped.push(token);
  }

  const inferredCount = parseSubjectCount(cleaned.toLowerCase(), deduped.length || 1, level);
  const labels = deduped.length
    ? deduped.slice(0, inferredCount)
    : [lang === "zh" ? "主主体" : "main subject"];
  while (labels.length < inferredCount) {
    labels.push(lang === "zh" ? `主体 ${labels.length + 1}` : `subject ${labels.length + 1}`);
  }

  return labels.map((label, idx) => ({
    id: `subject_${idx + 1}`,
    label,
    role: idx === 0 ? "main" : "secondary",
    positionHint: idx === 0 ? "center" : idx % 2 ? "left" : "right",
    sizeHint: idx === 0
      ? (hasAny(cleaned.toLowerCase(), ["主体太小", "主体偏小", "close-up", "特写"]) ? "large" : "medium")
      : "medium",
    locked: false
  }));
}

function parseTimeOfDay(text: string, location: string): IntentPlan["scene"]["timeOfDay"] {
  if (hasAny(text, ["night", "夜", "夜景", "深夜"])) return "night";
  if (hasAny(text, ["day", "白天", "日间", "午后"])) return "day";
  if (location === "indoor") return "indoor";
  return "unknown";
}

function parserLevel(mode: BriefParserMode): ParseLevel {
  if (mode === "baseline") return 0;
  if (mode === "round1") return 1;
  if (mode === "round2") return 2;
  return 3;
}

export function briefToIntentPlanWithMode(brief: string, lang: Lang, mode: BriefParserMode): IntentPlan {
  const { source, text } = normalizeInput(brief);
  const level = parserLevel(mode);
  const subjects = parseSubjects(source, lang, level);
  const framing = parseFraming(text, level);
  const backgroundDensity = parseBackgroundDensity(text, level);
  const location = parseLocation(text, level);
  const style = parseStyle(text, level);

  const primarySize: "small" | "medium" | "large" = hasAny(text, ["主体太小", "太小", "close up", "特写", "近景"])
    ? "large"
    : hasAny(text, ["主体太大", "太大", "tiny subject", "远景"])
      ? "small"
      : "medium";
  const primaryDepth: "foreground" | "midground" | "background" = hasAny(text, ["前景", "foreground"]) ? "foreground"
    : hasAny(text, ["背景里", "background"]) ? "background"
      : "midground";

  return {
    version: "v1",
    sourceBrief: source,
    lang,
    mediaType: parseMediaType(text, level),
    goal: parseGoal(text, level),
    ratio: parseRatio(text),
    style,
    camera: {
      shotType: hasAny(text, ["close", "特写"]) ? "closeup" : hasAny(text, ["wide", "全景", "远景"]) ? "wide" : "medium",
      angle: hasAny(text, ["low angle", "低机位", "仰拍"]) ? "low" : hasAny(text, ["high angle", "高机位", "俯拍"]) ? "high" : "eye",
      framing
    },
    scene: {
      location,
      backgroundDensity,
      timeOfDay: parseTimeOfDay(text, location)
    },
    composition: {
      visualFocus: framing === "balanced" ? "center" : framing,
      primarySubjectWeight: subjects.length <= 1 ? 0.8 : subjects.length === 2 ? 0.7 : 0.6,
      subjectScalePreference: primarySize,
      primaryDepth
    },
    subjects,
    constraints: [
      lang === "zh" ? "优先保证主体数量和位置关系稳定" : "Prioritize stable subject count and positions",
      lang === "zh" ? "先锁构图，再细化风格" : "Lock composition before style polish"
    ],
    hardConstraints: [
      `subject_count=${subjects.length}`,
      `framing=${framing}`,
      `background_density=${backgroundDensity}`
    ],
    editHints: [
      lang === "zh" ? `构图重心: ${framing}` : `composition focus: ${framing}`,
      lang === "zh" ? `背景复杂度: ${backgroundDensity}` : `background density: ${backgroundDensity}`
    ]
  };
}

export function briefToIntentPlan(brief: string, lang: Lang): IntentPlan {
  return briefToIntentPlanWithMode(brief, lang, "round3");
}
