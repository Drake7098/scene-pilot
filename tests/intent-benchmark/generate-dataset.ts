import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { BenchmarkCase, DensityLabel, FramingLabel, GoalLabel, MediaLabel, RatioLabel, SplitName, TimeOfDayLabel } from "./types.js";

const TARGET_TOTAL = 10_000;
const SPLIT_PLAN: Array<{ split: SplitName; count: number }> = [
  { split: "basic", count: 3_000 },
  { split: "extended", count: 2_500 },
  { split: "noise", count: 1_500 },
  { split: "professional", count: 1_200 },
  { split: "adversarial", count: 1_000 },
  { split: "longtail", count: 800 }
];

type ShapeConfig = {
  mediaType: MediaLabel;
  goal: GoalLabel;
  ratio: RatioLabel;
  subjectCount: number;
  primarySubjectType: string;
  framing: FramingLabel;
  backgroundDensity: DensityLabel;
  location: string;
  genre: string;
  lighting: string;
  timeOfDay: TimeOfDayLabel;
  lang: "zh" | "en";
};

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = value + 0x6d2b79f5 | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

const SUBJECTS = ["女主", "男主", "模特", "产品瓶", "运动鞋", "咖啡杯", "机器人", "猫", "建筑", "机车"];
const LOCATIONS = ["indoor", "street", "outdoor nature", "generic scene"] as const;
const GENRES = ["cinematic", "realistic", "anime", "cyberpunk"] as const;
const LIGHTINGS = ["soft", "daylight", "neon", "backlight", "low-key"] as const;
const RATIOS: RatioLabel[] = ["1:1", "16:9", "9:16"];
const FRAMINGS: FramingLabel[] = ["center", "left", "right", "balanced"];
const DENSITIES: DensityLabel[] = ["clean", "normal", "rich"];
const GOALS: GoalLabel[] = ["poster", "ad", "portrait", "scene", "storyframe"];
const MEDIA: MediaLabel[] = ["image", "video"];
const TIMES: TimeOfDayLabel[] = ["day", "night", "indoor", "unknown"];

function composeZh(config: ShapeConfig, split: SplitName, rand: () => number) {
  const mediaHint = config.mediaType === "video" ? "做一个6秒视频" : "做一张图";
  const goalHint = config.goal === "ad" ? "广告主视觉" : config.goal === "poster" ? "情绪海报" : config.goal === "portrait" ? "人像" : config.goal === "storyframe" ? "分镜参考图" : "场景图";
  const ratioHint = config.ratio === "9:16" ? "竖屏" : config.ratio === "16:9" ? "横屏" : "1:1";
  const framingHint = config.framing === "center" ? "主体居中" : config.framing === "left" ? "主体偏左" : config.framing === "right" ? "主体偏右" : "构图平衡";
  const densityHint = config.backgroundDensity === "clean" ? "背景干净" : config.backgroundDensity === "rich" ? "背景细节丰富" : "背景正常";
  const locationHint = config.location === "indoor" ? "室内" : config.location === "street" ? "城市街头" : config.location === "outdoor nature" ? "户外自然" : "通用场景";
  const timeHint = config.timeOfDay === "night" ? "夜景" : config.timeOfDay === "day" ? "白天" : config.timeOfDay === "indoor" ? "室内光" : "时间不限";
  const styleHint = `${config.genre}风格，${config.lighting}光线`;
  const countHint = config.subjectCount === 1 ? "单主体" : config.subjectCount === 2 ? "双主体" : `${config.subjectCount}个主体`;
  if (split === "noise") {
    const fillers = ["那个", "就", "先", "大概", "最好", "麻烦"];
    return `${pick(rand, fillers)}${mediaHint}，${goalHint}，${countHint}，${locationHint}，${ratioHint}，${framingHint}，${densityHint}，${styleHint}，${timeHint}。`;
  }
  if (split === "adversarial") {
    return `先出${goalHint}图片，不要视频；${countHint}，${config.primarySubjectType}在前景，${framingHint}，${densityHint}，${locationHint}，${ratioHint}，${styleHint}。`;
  }
  if (split === "professional") {
    return `${goalHint}需求：${countHint}，主主体是${config.primarySubjectType}，${framingHint}，${densityHint}，${locationHint}，${ratioHint}，${timeHint}，${styleHint}。`;
  }
  if (split === "longtail") {
    return `做一张“${config.primarySubjectType}和旧电视机同框”的图，${framingHint}，${densityHint}，${locationHint}，${ratioHint}，${styleHint}，${countHint}。`;
  }
  return `${mediaHint}，${goalHint}，${countHint}，${locationHint}，${framingHint}，${densityHint}，${ratioHint}，${styleHint}，${timeHint}。`;
}

function composeEn(config: ShapeConfig, split: SplitName, rand: () => number) {
  const mediaHint = config.mediaType === "video" ? "make a 6-second video" : "make an image";
  const goalHint = config.goal === "ad" ? "ad key visual" : config.goal === "poster" ? "emotional poster" : config.goal === "portrait" ? "portrait" : config.goal === "storyframe" ? "storyframe reference" : "scene image";
  const ratioHint = `ratio ${config.ratio}`;
  const framingHint = config.framing === "center" ? "subject centered" : config.framing === "left" ? "subject on the left" : config.framing === "right" ? "subject on the right" : "balanced framing";
  const densityHint = config.backgroundDensity === "clean" ? "clean background" : config.backgroundDensity === "rich" ? "dense background details" : "normal background complexity";
  const locationHint = config.location === "indoor" ? "indoor" : config.location === "street" ? "city street" : config.location === "outdoor nature" ? "outdoor nature" : "generic location";
  const timeHint = config.timeOfDay === "night" ? "night" : config.timeOfDay === "day" ? "daylight" : config.timeOfDay === "indoor" ? "indoor lighting" : "time flexible";
  const styleHint = `${config.genre} style with ${config.lighting} lighting`;
  const countHint = config.subjectCount === 1 ? "single subject" : config.subjectCount === 2 ? "two subjects" : `${config.subjectCount} subjects`;
  if (split === "noise") {
    const fillers = ["uh", "kinda", "please", "like", "maybe"];
    return `${pick(rand, fillers)} ${mediaHint}, ${goalHint}, ${countHint}, ${locationHint}, ${ratioHint}, ${framingHint}, ${densityHint}, ${styleHint}, ${timeHint}.`;
  }
  if (split === "adversarial") {
    return `image first, not video. ${goalHint}, ${countHint}, ${config.primarySubjectType} in foreground, ${framingHint}, ${densityHint}, ${locationHint}, ${ratioHint}, ${styleHint}.`;
  }
  if (split === "professional") {
    return `campaign brief: ${goalHint}, ${countHint}, primary ${config.primarySubjectType}, ${framingHint}, ${densityHint}, ${locationHint}, ${ratioHint}, ${timeHint}, ${styleHint}.`;
  }
  if (split === "longtail") {
    return `create an image where ${config.primarySubjectType} appears with an old CRT monitor, ${framingHint}, ${densityHint}, ${locationHint}, ${ratioHint}, ${styleHint}, ${countHint}.`;
  }
  return `${mediaHint}, ${goalHint}, ${countHint}, ${locationHint}, ${framingHint}, ${densityHint}, ${ratioHint}, ${styleHint}, ${timeHint}.`;
}

function deriveConfig(rand: () => number, split: SplitName): ShapeConfig {
  const lang = rand() > 0.45 ? "zh" : "en";
  const mediaType = split === "adversarial" ? (rand() > 0.75 ? "video" : "image") : (rand() > 0.9 ? "video" : "image");
  const goal = pick(rand, GOALS);
  const ratio = pick(rand, RATIOS);
  const subjectCount = split === "basic" ? pick(rand, [1, 1, 2]) : pick(rand, [1, 2, 2, 3, 4]);
  const primarySubjectType = pick(rand, SUBJECTS);
  const framing = pick(rand, FRAMINGS);
  const backgroundDensity = pick(rand, DENSITIES);
  const location = pick(rand, LOCATIONS);
  const genre = pick(rand, GENRES);
  const lighting = pick(rand, LIGHTINGS);
  const timeOfDay = location === "indoor" ? pick(rand, ["indoor", "day", "night", "unknown"] as const) : pick(rand, TIMES);
  return {
    mediaType,
    goal,
    ratio,
    subjectCount,
    primarySubjectType,
    framing,
    backgroundDensity,
    location,
    genre,
    lighting,
    timeOfDay,
    lang
  };
}

function buildCase(idx: number, split: SplitName, rand: () => number): BenchmarkCase {
  const config = deriveConfig(rand, split);
  const brief = config.lang === "zh" ? composeZh(config, split, rand) : composeEn(config, split, rand);
  return {
    id: `${split}_${String(idx + 1).padStart(5, "0")}`,
    split,
    lang: config.lang,
    brief,
    expected: {
      mediaType: config.mediaType,
      goal: config.goal,
      ratio: config.ratio,
      subjectCount: config.subjectCount,
      primarySubjectType: config.primarySubjectType,
      framing: config.framing,
      backgroundDensity: config.backgroundDensity,
      location: config.location,
      style: {
        genre: config.genre,
        lighting: config.lighting
      },
      scene: {
        timeOfDay: config.timeOfDay
      }
    }
  };
}

function summarize(cases: BenchmarkCase[]) {
  const bySplit: Record<string, number> = {};
  for (const item of cases) {
    bySplit[item.split] = (bySplit[item.split] ?? 0) + 1;
  }
  return {
    total: cases.length,
    bySplit
  };
}

function main() {
  const output = resolve(process.cwd(), "artifacts/intent-benchmark/dataset.jsonl");
  mkdirSync(dirname(output), { recursive: true });
  const rand = mulberry32(20260309);
  const cases: BenchmarkCase[] = [];
  for (const config of SPLIT_PLAN) {
    for (let i = 0; i < config.count; i += 1) {
      cases.push(buildCase(i, config.split, rand));
    }
  }

  if (cases.length !== TARGET_TOTAL) {
    throw new Error(`dataset size mismatch: expected=${TARGET_TOTAL}, actual=${cases.length}`);
  }

  writeFileSync(output, `${cases.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf-8");
  writeFileSync(
    resolve(process.cwd(), "artifacts/intent-benchmark/dataset.summary.json"),
    JSON.stringify(summarize(cases), null, 2),
    "utf-8"
  );
  console.log(`dataset generated: ${output}`);
  console.log(`total=${cases.length}`);
}

main();
