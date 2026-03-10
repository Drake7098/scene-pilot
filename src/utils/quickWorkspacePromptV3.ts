import type { Lang } from "../i18n";
import type { CanvasDraft } from "../types/canvasDraft";

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

function compactObjectLabels(labels: string[], max: number, lang: Lang) {
  const generic = lang === "zh"
    ? /^(主体|对象|场景|镜头|环境|人物)$/i
    : /^(subject|object|scene|shot|environment|character)$/i;
  const unique: string[] = [];
  for (const raw of labels) {
    const item = cleanLine(raw);
    if (!item || generic.test(item)) continue;
    if (unique.some((v) => v.toLowerCase() === item.toLowerCase())) continue;
    unique.push(item);
    if (unique.length >= max) break;
  }
  return unique;
}

function pushUnique(bag: string[], value: string) {
  const v = cleanLine(value);
  if (!v) return;
  const key = v.toLowerCase();
  if (bag.some((item) => item.toLowerCase() === key)) return;
  bag.push(v);
}

function mapVideoStructure(lang: Lang, value: string) {
  const map: Record<string, string> = {
    single_shot: t(lang, "单镜头", "single-shot"),
    multicam: t(lang, "多机位", "multi-camera"),
    continuous: t(lang, "连续镜头", "continuous camera move"),
    multi_scene: t(lang, "多场景", "multi-scene sequence")
  };
  return map[value] ?? value;
}

function mapImageStructure(lang: Lang, value: string) {
  const map: Record<string, string> = {
    single_subject: t(lang, "单主体构图", "single-subject composition"),
    multi_subject: t(lang, "多主体关系构图", "multi-subject relational composition"),
    environment: t(lang, "环境叙事构图", "environment-led composition"),
    product_object: t(lang, "产品展示构图", "product showcase composition")
  };
  return map[value] ?? value;
}

function mapSceneType(lang: Lang, value: string) {
  const map: Record<string, string> = {
    indoor: t(lang, "室内", "indoor"),
    outdoor: t(lang, "室外", "outdoor"),
    complex: t(lang, "复杂场景", "complex environment"),
    product_display: t(lang, "产品展示场景", "product display setup"),
    multi_scene: t(lang, "多场景切换", "multi-location")
  };
  return map[value] ?? value;
}

function mapContinuity(lang: Lang, value: string) {
  const map: Record<string, string> = {
    identity: t(lang, "人物一致", "identity consistency"),
    scene: t(lang, "场景一致", "scene consistency"),
    lighting: t(lang, "光线一致", "lighting consistency"),
    style: t(lang, "风格一致", "style consistency")
  };
  return map[value] ?? value;
}

function mapCameraMotion(lang: Lang, value: string) {
  const map: Record<string, string> = {
    static: t(lang, "稳机位", "locked camera"),
    follow: t(lang, "跟随主体", "follow shot"),
    push: t(lang, "缓慢推进", "slow push-in"),
    orbit: t(lang, "轻绕拍", "light orbit")
  };
  return map[value] ?? value;
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
  return map[value] ?? value;
}

function readHint(hintKV: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = hintKV[key.toLowerCase()];
    if (value) return value;
  }
  return "";
}

function joinPromptSentence(parts: string[], lang: Lang) {
  const valid = parts.map((item) => cleanLine(item)).filter(Boolean);
  if (!valid.length) return "";
  return lang === "zh" ? `${valid.join("，")}。` : `${valid.join(", ")}.`;
}

export function generateQuickWorkspacePromptV3(args: Args): string {
  const { lang, draft, ratio } = args;
  if (!draft) return "";

  const step1 = cleanLine(draft.primaryBrief);
  const step2 = cleanLine(draft.secondaryBrief);

  if (draft.mediaType === "image") {
    const objects = compactObjectLabels(draft.objects.map((item) => item.label), 5, lang);
    const subjectLabels = compactObjectLabels(draft.objects.filter((item) => item.kind === "subject").map((item) => item.label), 3, lang);
    const envLabels = compactObjectLabels(draft.objects.filter((item) => item.kind === "environment").map((item) => item.label), 2, lang);
    const hints = draft.compileHints.slice(0, 10);
    const hintKV = parseHintKV(hints);
    const styleGoal = readHint(hintKV, ["风格目标", "style goal"]) || t(lang, "电影感", "cinematic");

    const coreParts: string[] = [];
    pushUnique(coreParts, step1);
    pushUnique(coreParts, step2);
    if (!step1 && !step2) {
      pushUnique(coreParts, t(lang, "按结构草案生成单张高质量图像", "Generate one high-quality image based on the structured draft"));
    }

    const details: string[] = [];
    pushUnique(details, `${ratio}`);
    pushUnique(details, mapImageStructure(lang, draft.structureType));
    pushUnique(details, mapSceneType(lang, draft.sceneType));
    if (subjectLabels.length) pushUnique(details, `${t(lang, "主体", "subject")}: ${subjectLabels.join(" / ")}`);
    if (envLabels.length) pushUnique(details, `${t(lang, "环境", "environment")}: ${envLabels.join(" / ")}`);
    if (!subjectLabels.length && objects.length) pushUnique(details, `${t(lang, "对象", "objects")}: ${objects.join(" / ")}`);
    pushUnique(details, `${t(lang, "构图", "composition")}: ${draft.compositionFocus}`);
    pushUnique(details, `${t(lang, "关系", "relation")}: ${draft.relationMode}`);
    pushUnique(details, `${t(lang, "背景", "background")}: ${draft.backgroundDensity}`);
    pushUnique(details, `${t(lang, "风格", "style")}: ${styleGoal}`);
    pushUnique(details, t(lang, "画面干净，主体明确，细节自然", "clean frame, clear subject focus, natural detail"));

    return joinPromptSentence([...coreParts, ...details], lang);
  }

  const objects = compactObjectLabels(draft.keyObjects.map((item) => item.label), 4, lang);
  const shotTitles = draft.shots.map((shot) => cleanLine(shot.title)).filter(Boolean);
  const hints = draft.compileHints.slice(0, 10);
  const hintKV = parseHintKV(hints);
  const shotGrammarRaw = readHint(hintKV, ["镜头语法", "shot_grammar", "shot grammar"]);
  const shotGrammar = shotGrammarRaw ? mapShotGrammar(lang, shotGrammarRaw) : "";
  const styleGoal = readHint(hintKV, ["风格目标", "style goal"]) || t(lang, "电影感", "cinematic");

  const coreParts: string[] = [];
  pushUnique(coreParts, step1);
  pushUnique(coreParts, step2);
  if (!step1 && !step2) {
    pushUnique(coreParts, t(lang, "按结构草案生成视频片段", "Generate a video clip based on the structured draft"));
  }

  const details: string[] = [];
  pushUnique(details, `${ratio}`);
  const shotCountLabel = lang === "zh"
    ? `${draft.shotCount}镜头`
    : `${draft.shotCount} ${draft.shotCount === 1 ? "shot" : "shots"}`;
  const normalizedStructure = draft.shotCount === 1 ? "single_shot" : draft.structureType;
  pushUnique(details, `${mapVideoStructure(lang, normalizedStructure)}${t(lang, "，共", ", ")}${shotCountLabel}`);
  pushUnique(details, mapSceneType(lang, draft.mainScene));
  if (objects.length) pushUnique(details, `${t(lang, "关键对象", "key objects")}: ${objects.join(" / ")}`);
  const cameraMotionRaw = readHint(hintKV, ["镜头运动", "camera_motion", "camera motion"]);
  const cameraMotion = cameraMotionRaw
    ? mapCameraMotion(lang, cameraMotionRaw)
    : mapCameraMotion(lang, draft.structureType === "single_shot" ? "follow" : "static");
  pushUnique(details, `${t(lang, "连续性", "continuity")}: ${mapContinuity(lang, draft.continuityFocus)}`);
  pushUnique(details, `${t(lang, "镜头运动", "camera motion")}: ${cameraMotion}`);
  if (shotGrammar) pushUnique(details, `${t(lang, "镜头语法", "shot grammar")}: ${shotGrammar}`);
  if (shotTitles.length) pushUnique(details, `${t(lang, "分镜顺序", "shot order")}: ${shotTitles.join(" -> ")}`);
  pushUnique(details, `${t(lang, "风格", "style")}: ${styleGoal}`);
  pushUnique(details, t(lang, "语义准确，主体稳定，场景连贯，衔接自然", "accurate semantics, stable subject, coherent scene continuity, natural transitions"));

  return joinPromptSentence([...coreParts, ...details], lang);
}
