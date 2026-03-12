import type { Lang } from "../i18n";
import type { CanvasDraft, ImageCanvasDraft, VideoCanvasDraft } from "../types/canvasDraft";

type Args = {
  lang: Lang;
  draft: CanvasDraft | null;
  ratio: "16:9" | "9:16" | "1:1";
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function cleanLine(input: string) {
  return (input ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAsciiTerm(term: string) {
  return /^[\x20-\x7E]+$/.test(term);
}

function containsTerm(text: string, term: string) {
  const source = cleanLine(text).toLowerCase();
  const needle = cleanLine(term).toLowerCase();
  if (!source || !needle) return false;
  if (!isAsciiTerm(needle)) return source.includes(needle);
  const re = new RegExp(`\\b${escapeRegExp(needle).replace(/\\ /g, "\\s+")}\\b`, "i");
  return re.test(source);
}

function parseHintKV(hints: string[]) {
  const out: Record<string, string> = {};
  for (const raw of hints) {
    const line = cleanLine(raw);
    const split = line.indexOf(":");
    if (split <= 0) continue;
    const key = line.slice(0, split).trim().toLowerCase();
    const value = line.slice(split + 1).trim();
    if (!key || !value) continue;
    if (!out[key]) out[key] = value;
  }
  return out;
}

function readHint(hints: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = hints[key.toLowerCase()];
    if (value) return value;
  }
  return "";
}

function compactLabels(labels: string[], max: number, lang: Lang) {
  const generic = lang === "zh"
    ? /^(主体|对象|场景|镜头|环境|人物|主角)$/i
    : /^(subject|object|scene|shot|environment|character|lead)$/i;
  const out: string[] = [];
  for (const item of labels.map((v) => cleanLine(v))) {
    if (!item || generic.test(item)) continue;
    if (out.some((v) => v.toLowerCase() === item.toLowerCase())) continue;
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function joinNatural(lang: Lang, parts: string[]) {
  const clean = parts.map((item) => cleanLine(item)).filter(Boolean);
  if (!clean.length) return "";
  return lang === "zh" ? clean.join("，") : clean.join(", ");
}

function finalizeSentence(lang: Lang, text: string) {
  const line = cleanLine(text);
  if (!line) return "";
  return lang === "zh" ? `${line}。` : `${line}.`;
}

function mapImageStructure(lang: Lang, value: ImageCanvasDraft["structureType"]) {
  const map: Record<ImageCanvasDraft["structureType"], string> = {
    single_subject: t(lang, "单主体构图", "single-subject composition"),
    multi_subject: t(lang, "多主体关系构图", "multi-subject relational composition"),
    environment: t(lang, "环境主导构图", "environment-led composition"),
    product_object: t(lang, "产品展示构图", "product showcase composition")
  };
  return map[value];
}

function mapImageScene(lang: Lang, value: ImageCanvasDraft["sceneType"]) {
  const map: Record<ImageCanvasDraft["sceneType"], string> = {
    indoor: t(lang, "室内场景", "indoor scene"),
    outdoor: t(lang, "室外场景", "outdoor scene"),
    complex: t(lang, "复杂环境", "complex environment"),
    product_display: t(lang, "产品展示场景", "product display setup")
  };
  return map[value];
}

function mapImageComposition(lang: Lang, value: ImageCanvasDraft["compositionFocus"]) {
  const map: Record<ImageCanvasDraft["compositionFocus"], string> = {
    center: t(lang, "主体集中表达", "subject-centered framing"),
    left_right: t(lang, "左右关系表达", "left-right relational framing"),
    depth: t(lang, "前中后景深表达", "foreground-midground-background depth"),
    environment_wrap: t(lang, "环境包裹主体", "environment wrapping the subject")
  };
  return map[value];
}

function mapImageRelation(lang: Lang, value: ImageCanvasDraft["relationMode"]) {
  const map: Record<ImageCanvasDraft["relationMode"], string> = {
    solo: t(lang, "单主体主导", "single-subject focus"),
    eye_contact: t(lang, "主体互动关系", "interactive relation between subjects"),
    confront: t(lang, "对峙关系", "confrontational relation"),
    left_right: t(lang, "左右分布关系", "left-right spatial relation"),
    front_back: t(lang, "前后层次关系", "front-back depth relation"),
    subject_environment: t(lang, "主体与环境关系", "subject-environment relation")
  };
  return map[value];
}

function mapImageDensity(lang: Lang, value: ImageCanvasDraft["backgroundDensity"]) {
  const map: Record<ImageCanvasDraft["backgroundDensity"], string> = {
    clean: t(lang, "干净", "clean"),
    normal: t(lang, "正常", "normal"),
    rich: t(lang, "丰富", "rich"),
    strong_environment: t(lang, "强环境感", "strong-environment")
  };
  return map[value];
}

function imageLensSuggestion(lang: Lang, draft: ImageCanvasDraft) {
  if (draft.structureType === "product_object") {
    return t(lang, "中近景静态机位，重点强化材质与轮廓细节", "medium-close static framing, emphasize material and contour detail");
  }
  if (draft.compositionFocus === "depth" || draft.relationMode === "front_back") {
    return t(lang, "中广景平视机位，明确前中后景层次", "medium-wide eye-level framing with clear depth layering");
  }
  if (draft.structureType === "environment") {
    return t(lang, "广角构图保留空间信息，主体仍保持识别度", "wide-angle framing that preserves environment context while keeping the subject readable");
  }
  return t(lang, "中景主视角，主体清晰、关系明确", "medium framing with clear primary subject and readable relations");
}

function mapVideoStructure(lang: Lang, value: VideoCanvasDraft["structureType"]) {
  const map: Record<VideoCanvasDraft["structureType"], string> = {
    single_shot: t(lang, "单镜头", "single-shot"),
    multicam: t(lang, "多机位", "multi-camera"),
    continuous: t(lang, "连续镜头", "continuous camera movement"),
    multi_scene: t(lang, "多场景", "multi-scene sequence")
  };
  return map[value];
}

function mapVideoScene(lang: Lang, value: VideoCanvasDraft["mainScene"]) {
  const map: Record<VideoCanvasDraft["mainScene"], string> = {
    indoor: t(lang, "室内", "indoor"),
    outdoor: t(lang, "室外", "outdoor"),
    complex: t(lang, "复杂环境", "complex environment"),
    multi_scene: t(lang, "多场景切换", "multi-scene switching")
  };
  return map[value];
}

function mapContinuity(lang: Lang, value: VideoCanvasDraft["continuityFocus"]) {
  const map: Record<VideoCanvasDraft["continuityFocus"], string> = {
    identity: t(lang, "人物身份一致", "identity consistency"),
    scene: t(lang, "场景空间一致", "scene continuity"),
    lighting: t(lang, "光线一致", "lighting consistency"),
    style: t(lang, "风格一致", "style consistency")
  };
  return map[value];
}

function mapTransition(lang: Lang, value: VideoCanvasDraft["sceneTransitions"]) {
  const map: Record<VideoCanvasDraft["sceneTransitions"], string> = {
    none: t(lang, "无切换", "none"),
    same_space: t(lang, "同空间衔接", "same-space transition"),
    indoor_outdoor: t(lang, "室内外转换", "indoor-outdoor transition"),
    location_switch: t(lang, "地点切换", "location switch"),
    time_jump: t(lang, "时间跳切", "time jump")
  };
  return map[value];
}

function defaultVideoShotCountByStructure(structureType: VideoCanvasDraft["structureType"]): 1 | 3 | 4 | 5 {
  if (structureType === "single_shot") return 1;
  if (structureType === "multicam") return 4;
  if (structureType === "continuous") return 4;
  return 5;
}

function inferVideoMainScene(
  structureType: VideoCanvasDraft["structureType"],
  narrative: string,
  fallback: VideoCanvasDraft["mainScene"]
): VideoCanvasDraft["mainScene"] {
  if (structureType === "multi_scene") return "multi_scene";
  const indoorTerms = ["室内", "房间", "客厅", "卧室", "厨房", "酒吧", "咖啡馆", "indoor", "room", "interior", "living room", "kitchen", "bedroom", "bar", "cafe"];
  const outdoorTerms = ["室外", "街道", "森林", "公园", "海边", "山", "沙漠", "雪地", "outdoor", "street", "forest", "park", "beach", "mountain", "desert", "snowfield"];
  const indoor = indoorTerms.filter((term) => containsTerm(narrative, term)).length;
  const outdoor = outdoorTerms.filter((term) => containsTerm(narrative, term)).length;
  if (outdoor > 0 && indoor === 0) return "outdoor";
  if (indoor > 0 && outdoor === 0) return "indoor";
  if (indoor > 0 && outdoor > 0) return "complex";
  return fallback === "multi_scene" ? "complex" : fallback;
}

function normalizeVideoShots(
  lang: Lang,
  structureType: VideoCanvasDraft["structureType"],
  shotCount: 1 | 3 | 4 | 5,
  shots: VideoCanvasDraft["shots"],
  shotGrammar: string,
  transition: VideoCanvasDraft["sceneTransitions"]
) {
  const base = shots.map((shot) => ({ ...shot }));
  const out = base.slice(0, shotCount);
  while (out.length < shotCount) {
    const nextIndex = out.length + 1;
    out.push({
      id: `shot_${nextIndex}`,
      index: nextIndex,
      title: `${mapShotGrammar(lang, shotGrammar)} / ${lang === "zh" ? `镜头 ${nextIndex}` : `Shot ${nextIndex}`}`,
      summary: "",
      transitionFromPrev: (nextIndex === 1 ? "none" : transition) as VideoCanvasDraft["shots"][number]["transitionFromPrev"],
      emphasis: "",
      sceneLabel: lang === "zh" ? "场景" : "scene",
      objectIds: []
    });
  }
  return out.map((shot, index) => ({
    ...shot,
    index: index + 1,
    transitionFromPrev: (index === 0 ? "none" : shot.transitionFromPrev || transition) as VideoCanvasDraft["shots"][number]["transitionFromPrev"]
  }));
}

function sanitizeVideoKeyObjects(lang: Lang, narrative: string, labels: string[]) {
  const banned = [
    "shot", "scene", "camera", "grammar", "transition", "continuity",
    "镜头", "场景", "运镜", "语法", "衔接", "连续性",
    "same_space", "location_switch", "indoor_outdoor", "time_jump",
    "shot_count", "main_scene", "scene_transition"
  ];
  const result: string[] = [];
  for (const raw of labels.map((item) => cleanLine(item))) {
    if (!raw) continue;
    if (raw.length > 24) continue;
    const low = raw.toLowerCase();
    if (raw.includes(":")) continue;
    if (banned.some((term) => containsTerm(low, term))) continue;
    if (!containsTerm(narrative, raw)) continue;
    if (result.some((item) => item.toLowerCase() === low)) continue;
    result.push(raw);
    if (result.length >= 5) break;
  }
  if (result.length) return result;
  return [lang === "zh" ? "主体" : "subject"];
}

function mapCameraMotion(lang: Lang, value: string) {
  const map: Record<string, string> = {
    static: t(lang, "稳机位", "locked camera"),
    follow: t(lang, "跟随主体", "follow shot"),
    push: t(lang, "缓慢推进", "slow push-in"),
    orbit: t(lang, "轻绕拍", "light orbit")
  };
  return map[value] ?? (value || t(lang, "跟随主体", "follow shot"));
}

function mapShotGrammar(lang: Lang, value: string) {
  const map: Record<string, string> = {
    cut: t(lang, "切镜", "cut"),
    reverse_angle: t(lang, "反打", "reverse angle"),
    over_shoulder: t(lang, "过肩", "over-shoulder"),
    pov: t(lang, "主观视角", "POV"),
    insert_closeup: t(lang, "插入特写", "insert close-up"),
    establishing: t(lang, "建立镜头", "establishing shot")
  };
  return map[value] ?? (value || t(lang, "切镜", "cut"));
}

function splitShots(lang: Lang, shots: VideoCanvasDraft["shots"]) {
  return shots.slice(0, 5).map((shot) => {
    const title = cleanLine(shot.title || (lang === "zh" ? `镜头 ${shot.index}` : `Shot ${shot.index}`));
    return lang === "zh" ? `镜头${shot.index} ${title}` : `Shot ${shot.index} ${title}`;
  });
}

function buildImagePrompt(lang: Lang, draft: ImageCanvasDraft, ratio: Args["ratio"]) {
  const hints = parseHintKV(draft.compileHints.slice(0, 14));
  const styleGoal = readHint(hints, ["风格目标", "style goal"]) || t(lang, "电影感", "cinematic");

  const subjects = compactLabels(
    draft.objects.filter((item) => item.kind === "subject").map((item) => item.label),
    4,
    lang
  );
  const envs = compactLabels(
    draft.objects.filter((item) => item.kind === "environment").map((item) => item.label),
    2,
    lang
  );
  const mergedObjects = subjects.length ? subjects : compactLabels(draft.objects.map((item) => item.label), 5, lang);
  const objectText = joinNatural(lang, [
    mergedObjects.length ? mergedObjects.join(lang === "zh" ? "、" : ", ") : "",
    envs.length ? `${t(lang, "环境元素", "environment")}: ${envs.join(lang === "zh" ? "、" : ", ")}` : ""
  ]);

  const narrative = joinNatural(lang, [draft.primaryBrief, draft.secondaryBrief]);
  const structural = joinNatural(lang, [
    `${t(lang, "画幅", "Aspect ratio")} ${ratio}`,
    `${t(lang, "结构", "Structure")} ${mapImageStructure(lang, draft.structureType)}`,
    `${t(lang, "场景", "Scene")} ${mapImageScene(lang, draft.sceneType)}`,
    `${t(lang, "构图重点", "Composition focus")} ${mapImageComposition(lang, draft.compositionFocus)}`,
    `${t(lang, "关系表达", "Relation")} ${mapImageRelation(lang, draft.relationMode)}`,
    `${t(lang, "背景密度", "Background density")} ${mapImageDensity(lang, draft.backgroundDensity)}`,
    `${t(lang, "风格目标", "Style")} ${styleGoal}`
  ]);

  const execution = joinNatural(lang, [
    imageLensSuggestion(lang, draft),
    t(lang, "保持主体与空间层次清晰，避免新增无关元素与错误解剖", "keep the subject and spatial hierarchy clear, avoid unrelated additions and anatomy errors")
  ]);

  if (lang === "zh") {
    return [
      finalizeSentence(lang, `请生成一张专业级静帧，画面任务是${narrative}`),
      finalizeSentence(lang, structural),
      objectText ? finalizeSentence(lang, `关键对象 ${objectText}`) : "",
      finalizeSentence(lang, execution)
    ].filter(Boolean).join(" ");
  }

  return [
    finalizeSentence(lang, `Create a production-ready still frame; core task: ${narrative}`),
    finalizeSentence(lang, structural),
    objectText ? finalizeSentence(lang, `Key objects: ${objectText}`) : "",
    finalizeSentence(lang, execution)
  ].filter(Boolean).join(" ");
}

function buildVideoPrompt(lang: Lang, draft: VideoCanvasDraft, ratio: Args["ratio"]) {
  const hints = parseHintKV(draft.compileHints.slice(0, 16));
  const styleGoal = readHint(hints, ["风格目标", "style goal"]) || t(lang, "电影感", "cinematic");
  const cameraMotionRaw = readHint(hints, ["镜头运动", "camera_motion", "camera motion"]);
  const shotGrammarRaw = readHint(hints, ["镜头语法", "shot_grammar", "shot grammar"]);

  const narrative = joinNatural(lang, [draft.primaryBrief, draft.secondaryBrief]);
  const structureType = draft.structureType;
  const correctedShotCount = (structureType === "single_shot"
    ? 1
    : draft.shotCount <= 1
      ? defaultVideoShotCountByStructure(structureType)
      : draft.shotCount) as 1 | 3 | 4 | 5;
  const correctedMainScene = inferVideoMainScene(structureType, narrative, draft.mainScene);
  const correctedTransition: VideoCanvasDraft["sceneTransitions"] = structureType === "single_shot"
    ? "none"
    : structureType === "multi_scene"
      ? (draft.sceneTransitions === "none" ? "location_switch" : draft.sceneTransitions)
      : (draft.sceneTransitions === "none" ? "same_space" : draft.sceneTransitions);
  const normalizedShots = normalizeVideoShots(
    lang,
    structureType,
    correctedShotCount,
    draft.shots,
    shotGrammarRaw,
    correctedTransition
  );
  const shots = splitShots(lang, normalizedShots);
  const keyObjects = sanitizeVideoKeyObjects(
    lang,
    narrative,
    compactLabels(draft.keyObjects.map((item) => item.label), 8, lang)
  );

  const structural = joinNatural(lang, [
    `${t(lang, "画幅", "Aspect ratio")} ${ratio}`,
    `${t(lang, "镜头结构", "Shot structure")} ${mapVideoStructure(lang, structureType)}`,
    `${t(lang, "镜头数量", "Shot count")} ${lang === "zh" ? `${correctedShotCount}镜头` : `${correctedShotCount} shots`}`,
    `${t(lang, "主场景", "Main scene")} ${mapVideoScene(lang, correctedMainScene)}`,
    `${t(lang, "连续性重点", "Continuity")} ${mapContinuity(lang, draft.continuityFocus)}`,
    `${t(lang, "风格目标", "Style")} ${styleGoal}`
  ]);

  const cameraAndGrammar = joinNatural(lang, [
    `${t(lang, "运镜", "Camera motion")} ${mapCameraMotion(lang, cameraMotionRaw)}`,
    `${t(lang, "镜头语法", "Shot grammar")} ${mapShotGrammar(lang, shotGrammarRaw)}`,
    `${t(lang, "场景衔接", "Scene transition")} ${mapTransition(lang, correctedTransition)}`
  ]);

  if (lang === "zh") {
    return [
      finalizeSentence(lang, `请生成一个专业级视频片段，核心任务是${narrative}`),
      finalizeSentence(lang, structural),
      shots.length ? finalizeSentence(lang, `分镜计划 ${shots.join("；")}`) : "",
      keyObjects.length ? finalizeSentence(lang, `关键对象 ${keyObjects.join("、")}`) : "",
      finalizeSentence(lang, cameraAndGrammar),
      finalizeSentence(lang, "保持人物身份、服装与空间方位一致，动作动机连贯，不新增无依据剧情")
    ].filter(Boolean).join(" ");
  }

  return [
    finalizeSentence(lang, `Create a production-ready video clip; core task: ${narrative}`),
    finalizeSentence(lang, structural),
    shots.length ? finalizeSentence(lang, `Shot plan: ${shots.join("; ")}`) : "",
    keyObjects.length ? finalizeSentence(lang, `Key objects: ${keyObjects.join(", ")}`) : "",
    finalizeSentence(lang, cameraAndGrammar),
    finalizeSentence(lang, "Keep identity, wardrobe, and spatial orientation consistent; preserve action logic and avoid unsupported story additions")
  ].filter(Boolean).join(" ");
}

export function generateQuickWorkspacePromptV3(args: Args): string {
  const { lang, draft, ratio } = args;
  if (!draft) return "";
  if (draft.mediaType === "image") return buildImagePrompt(lang, draft, ratio);
  return buildVideoPrompt(lang, draft, ratio);
}
