import type { Lang } from "../i18n";
import type { ImageStructureHint, VideoStructureHint } from "../types/structureDraft";

type ObjType = "person" | "animal" | "prop" | "environment" | "unknown";

const IMAGE_SCENE_TERMS = [
  "卧室", "客厅", "厨房", "酒吧", "房间", "街道", "森林", "雪地", "海边",
  "bedroom", "living room", "kitchen", "bar", "room", "street", "forest", "snowfield", "beach"
];

const IMAGE_RELATION_TERMS = [
  "中间", "居中", "左边", "右边", "两侧", "前面", "后面", "对视", "旁边", "围绕", "包围",
  "center", "left", "right", "both sides", "front", "behind", "eye contact", "beside", "around", "surround"
];

const PERSON_TERMS = ["人", "男人", "女人", "女孩", "男孩", "主角", "角色", "person", "man", "woman", "girl", "boy", "character", "hero"];
const ANIMAL_TERMS = ["猫", "狗", "鸟", "cat", "dog", "bird", "animal"];
const PROP_TERMS = ["门", "床", "桌子", "椅子", "车", "刀", "枪", "杯子", "窗户", "door", "bed", "table", "chair", "car", "knife", "gun", "cup", "window"];
const ENV_TERMS = ["房间", "酒吧", "卧室", "客厅", "厨房", "街道", "森林", "雪地", "海边", "room", "bar", "bedroom", "living room", "kitchen", "street", "forest", "snowfield", "beach"];

const VIDEO_MULTICAM_TERMS = ["切到", "回到", "看向", "从", "视角", "特写", "广角", "反打", "cut to", "back to", "look at", "angle", "closeup", "wide", "reverse"];
const VIDEO_CONTINUOUS_TERMS = ["走进", "推进", "穿过", "转身", "左转", "右转", "一镜到底", "第一视角", "缓缓推向", "walk into", "push in", "through", "turn", "single take", "first person"];
const VIDEO_MULTI_SCENE_TERMS = ["来到另一个地方", "后来", "第二天", "切到街道", "到了外面", "另一间房", "不同地点", "another place", "later", "next day", "outside", "different location"];

const SHOT_SCENE_TERMS = ["门外", "客厅", "厨房", "卧室", "街道", "风雪", "室内", "door", "living room", "kitchen", "bedroom", "street", "indoor"];
const SHOT_ACTION_TERMS = ["开门", "进入", "看向", "转身", "切到", "回到", "推进", "穿过", "open", "enter", "look", "turn", "cut", "back", "push", "through"];

function lower(text: string) {
  return text.toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function countAny(text: string, terms: string[]) {
  return terms.reduce((acc, term) => acc + (text.includes(term) ? 1 : 0), 0);
}

function parseFallbackObjectNames(userInput: string, lang: Lang) {
  const parts = userInput
    .split(/[\n,，。;；]|(?:\band\b)|(?:\bwith\b)|和/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (parts.length) return parts;
  return [lang === "zh" ? "主体" : "subject"];
}

function firstMatched(text: string, terms: string[]) {
  for (const term of terms) {
    if (text.includes(term)) return term;
  }
  return "";
}

function classify(name: string): ObjType {
  const text = lower(name);
  if (hasAny(text, PERSON_TERMS)) return "person";
  if (hasAny(text, ANIMAL_TERMS)) return "animal";
  if (hasAny(text, PROP_TERMS)) return "prop";
  if (hasAny(text, ENV_TERMS)) return "environment";
  return "unknown";
}

export function extractImageObjects(userInput: string, lang: Lang) {
  const text = lower(userInput);
  const matched: Array<{ index: number; name: string; type: ObjType }> = [];
  const collect = (terms: string[], type: ObjType) => {
    for (const term of terms) {
      const idx = text.indexOf(term);
      if (idx >= 0) matched.push({ index: idx, name: term, type });
    }
  };
  collect(PERSON_TERMS, "person");
  collect(ANIMAL_TERMS, "animal");
  collect(PROP_TERMS, "prop");
  collect(ENV_TERMS, "environment");

  const uniq = new Map<string, { index: number; name: string; type: ObjType }>();
  for (const item of matched.sort((a, b) => a.index - b.index)) {
    if (!uniq.has(item.name)) uniq.set(item.name, item);
  }

  const result = [...uniq.values()].slice(0, 6).map((item, idx) => ({
    id: `obj_${idx + 1}`,
    name: item.name,
    type: item.type,
    isPrimary: idx === 0
  }));

  if (result.length) return result;

  return parseFallbackObjectNames(userInput, lang).map((name, idx) => ({
    id: `obj_${idx + 1}`,
    name,
    type: classify(name),
    isPrimary: idx === 0
  }));
}

export function extractImageScene(userInput: string, lang: Lang) {
  const text = lower(userInput);
  const hit = firstMatched(text, IMAGE_SCENE_TERMS);
  if (hit) return hit;
  return lang === "zh" ? "通用场景" : "generic scene";
}

export function extractImageRelations(userInput: string, lang: Lang) {
  const text = lower(userInput);
  const relations = IMAGE_RELATION_TERMS.filter((term) => text.includes(term)).slice(0, 6);
  if (relations.length) return relations;
  return [lang === "zh" ? "主体居中" : "subject centered"];
}

export function inferImageFocus(userInput: string, structureType: ImageStructureHint, lang: Lang) {
  const text = lower(userInput);
  if (structureType === "environment") {
    return hasAny(text, ["层次", "depth", "space"])
      ? (lang === "zh" ? "环境层次" : "environment depth")
      : (lang === "zh" ? "环境氛围" : "environment mood");
  }
  if (structureType === "multi_subject") return lang === "zh" ? "主体关系" : "subject relations";
  if (structureType === "product_object") return lang === "zh" ? "产品细节" : "product detail";
  return lang === "zh" ? "主主体表达" : "main subject";
}

export function inferImageStructureHintByKeywords(userInput: string): ImageStructureHint {
  const text = lower(userInput);
  const peopleCount = countAny(text, PERSON_TERMS);
  const relationCount = countAny(text, IMAGE_RELATION_TERMS);
  const envCount = countAny(text, ENV_TERMS);
  if (peopleCount >= 2 || relationCount >= 2) return "multi_subject";
  if (envCount >= Math.max(2, peopleCount + 1)) return "environment";
  return "single_subject";
}

export function inferVideoStructureHintByKeywords(userInput: string): VideoStructureHint {
  const text = lower(userInput);
  const multicam = countAny(text, VIDEO_MULTICAM_TERMS);
  const continuous = countAny(text, VIDEO_CONTINUOUS_TERMS);
  const multiScene = countAny(text, VIDEO_MULTI_SCENE_TERMS);
  if (multicam === 0 && continuous === 0 && multiScene === 0) return "single_shot";
  if (multicam >= continuous && multicam >= multiScene) return "multicam";
  if (continuous >= multicam && continuous >= multiScene) return "continuous";
  return "multi_scene";
}

export function defaultVideoShotCount(structureType: VideoStructureHint) {
  if (structureType === "single_shot") return 1;
  if (structureType === "multicam") return 4;
  if (structureType === "continuous") return 4;
  return 5;
}

function segmentForShots(userInput: string) {
  return userInput
    .split(/(?:先|然后|接着|最后|回到|then|next|finally|after that|later)/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function generateVideoShotTitles(userInput: string, shotCount: number, lang: Lang) {
  const segments = segmentForShots(userInput);
  const titles: string[] = [];
  for (let i = 0; i < shotCount; i += 1) {
    const seg = lower(segments[i] ?? "");
    const scene = firstMatched(seg, SHOT_SCENE_TERMS);
    const action = firstMatched(seg, SHOT_ACTION_TERMS);
    if (scene && action) {
      titles.push(`${scene}${lang === "zh" ? " " : " - "}${action}`.trim());
      continue;
    }
    if (scene) {
      titles.push(scene);
      continue;
    }
    if (action) {
      titles.push(action);
      continue;
    }
    titles.push(lang === "zh" ? `镜头 ${i + 1}` : `Shot ${i + 1}`);
  }
  return titles;
}

export function extractVideoObjects(userInput: string, lang: Lang) {
  const objs = extractImageObjects(userInput, lang).map((item) => item.name);
  return objs.length ? objs : [lang === "zh" ? "主体" : "subject"];
}

export function defaultVideoContinuity(lang: Lang) {
  return lang === "zh"
    ? ["人物保持一致", "场景保持一致", "光线保持一致", "风格保持一致"]
    : ["Identity consistency", "Scene consistency", "Lighting consistency", "Style consistency"];
}
