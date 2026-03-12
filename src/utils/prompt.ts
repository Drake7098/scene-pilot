import type { Lang } from "../i18n";
import type { Project, Scene, Layer, LayerKF, ShotPlan, Direction } from "../model";
import { resolveSceneConfig } from "../model";
import { compileScenePromptV2 } from "./compileV2";
import type { SceneTier, V2Mode } from "./compileV2";
import { optimizeV2ScenePrompt } from "./adaptivePatch";
import { adaptPromptToPlatform } from "./platformAdapter";
import { buildProMotionPromptLine, parseProMotionSelection } from "../content/proCameraPresets";
import { buildImageProPromptLine } from "../content/proCreativeModes";
import { proPromptQualityGate } from "../content/proPlusDirectorModules";
import { resolveEffectiveMotion } from "./proMotionResolver";
import { resolveSceneStrategy } from "./sceneStrategyResolver";

/**
 * ScenePilot prompts generator
 * ✅ Never mention layer.color (UI doesn't expose it)
 *
 * ✅ Tail block (always appended):
 * - System Structural Control Layer (machine notes / coordinate guide)  ✅ ALWAYS ON (no toggle)
 * - Language Reinforcement Layer (LRL)                                 ✅ ALWAYS ON (no toggle)
 * - Exposure Fix Layer (auto, heuristic)                               ✅ auto
 *
 * ✅ IMPORTANT (behavior unchanged):
 * - Coordinate machine-notes + LRL are core and always appended (no switch).
 * - Media mode (image/video) is parsed PER SCENE from `scene.notes` marker `media: image|video`.
 *   - image scene: outputs t0 only, no seconds in header
 *   - video scene: outputs t0/t1 and seconds in header
 *
 * ✅ 文案优化（极限压缩尾部注意力干扰）：
 * - 尾部所有系统层都“短句、少行、少重复”
 * - LRL 不重复坐标数字；静止对象不再写“连续移动”
 * - 避免 silhouette 语义冲突：将其解释为“轮廓清晰但仍保留细节”
 */

function clamp01(v: number) {
  return Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
}
function n1(v: number) {
  const x = Number.isFinite(v) ? v : 0;
  return Math.round(x * 10) / 10;
}
function getKF(layer: Layer, t: 0 | 1): LayerKF {
  const kf = Array.isArray(layer.kf) ? layer.kf : [];
  const hit = kf.find((k) => k.t === t);
  if (hit) return hit;
  const base = kf.find((k) => k.t === 0) ?? kf[0];
  return (
    base ?? {
      t,
      x: 50,
      y: 50,
      w: 18,
      h: 18,
      rot: 0
    }
  );
}

function compactLocalPrompt(input: string): string {
  return (input ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" | ");
}

function compactRefs(input: string, max = 6): string {
  return (input ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
    .join(" | ");
}

/**
 * 从 scene.notes 提取 bg: 背景（隐藏标记）
 */
const BG_MARK = "bg:";
function parseBg(notes: string): string {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((l) => l.trim().toLowerCase().startsWith(BG_MARK));
  if (!hit) return "";
  return hit.trim().slice(BG_MARK.length).trim();
}

/* -------------------- Media Mode (per-scene) -------------------- */

type MediaMode = "image" | "video";
export type PromptProfile =
  | "universal"
  | "jimeng"
  | "qwen"
  | "openai"
  | "fal"
  | "runway"
  | "midjourney"
  | "vertex"
  | "grok"
  | "nano_banana";

function finalizeByPlatform(prompt: string, profile: PromptProfile, lang: Lang, media: "image" | "video"): string {
  return adaptPromptToPlatform({
    prompt,
    profile,
    lang,
    media,
  });
}
const DIRECTION_TO_MOVE: Record<Direction, string> = {
  N: "up",
  NE: "up-right",
  E: "right",
  SE: "down-right",
  S: "down",
  SW: "down-left",
  W: "left",
  NW: "up-left"
};
const DIRECTION_TO_MOVE_ZH: Record<Direction, string> = {
  N: "上方",
  NE: "右上",
  E: "右侧",
  SE: "右下",
  S: "下方",
  SW: "左下",
  W: "左侧",
  NW: "左上"
};

const MOTION_WORDS_RE = /跑|行走|慢走|快走|挪|移动|奔跑|进入|穿过|经过|走进|推门|上楼|下楼|转入|跨过|rush|run|walk|move|moving|enter|go into|pass through|cross|step into|turn into|open the door|through the door|corridor|hallway|hall/i;
const ROOM_WORDS_RE = /门|走廊|过道|房间|客厅|卧室|厨房|办公室|电梯|楼梯|door|doorway|corridor|hallway|room|lobby|kitchen|bedroom|office|stairs|elevator/i;

function summarizeKfPath(lang: Lang, layer: Layer): string {
  const k0 = getKF(layer, 0);
  const k1 = getKF(layer, 1);
  const dx = n1(k1.x) - n1(k0.x);
  const dy = n1(k1.y) - n1(k0.y);
  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
    return lang === "zh" ? "结构上基本保持原位" : "structurally stays near the same mark";
  }
  const horizontal = Math.abs(dx) >= 4 ? (dx > 0 ? (lang === "zh" ? "向右" : "moves right") : (lang === "zh" ? "向左" : "moves left")) : "";
  const vertical = Math.abs(dy) >= 4 ? (dy > 0 ? (lang === "zh" ? "向下" : "moves down") : (lang === "zh" ? "向上" : "moves up")) : "";
  const parts = [horizontal, vertical].filter(Boolean);
  if (!parts.length) return lang === "zh" ? "结构上保持平稳位移" : "keeps a smooth structural move";
  return lang === "zh" ? `结构路径：${parts.join("并")}` : `Structural path: ${parts.join(" and ")}`;
}

function extractContinuousIntent(lang: Lang, layer: Layer): string {
  const textBag = [layer.notes ?? "", layer.externalPrompt ?? "", layer.look ?? ""].join(" ").trim();
  if (!textBag) return "";
  const lines = textBag
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const picked = lines.find((line) => MOTION_WORDS_RE.test(line) || ROOM_WORDS_RE.test(line)) ?? lines[0] ?? "";
  if (!picked) return "";
  return lang === "zh" ? `对象连续意图：${picked}` : `Object continuity intent: ${picked}`;
}

function buildContinuousBridge(lang: Lang, current: Scene, next: Scene, idx: number): string {
  const fromEn = current.exitDir && DIRECTION_TO_MOVE[current.exitDir] ? DIRECTION_TO_MOVE[current.exitDir] : "forward";
  const toEn = next.entryDir && DIRECTION_TO_MOVE[next.entryDir as Direction] ? DIRECTION_TO_MOVE[next.entryDir as Direction] : fromEn;
  const fromZh = current.exitDir && DIRECTION_TO_MOVE_ZH[current.exitDir] ? DIRECTION_TO_MOVE_ZH[current.exitDir] : "前方";
  const toZh = next.entryDir && DIRECTION_TO_MOVE_ZH[next.entryDir as Direction] ? DIRECTION_TO_MOVE_ZH[next.entryDir as Direction] : fromZh;
  const currentNote = (current.shotNote ?? "").trim();
  const nextNote = (next.shotNote ?? "").trim();
  const currentRoomHint = ROOM_WORDS_RE.test(currentNote) ? currentNote : "";
  const nextRoomHint = ROOM_WORDS_RE.test(nextNote) ? nextNote : "";

  if (lang === "zh") {
    return [
      `衔接 ${String(idx + 1).padStart(2, "0")}→${String(idx + 2).padStart(2, "0")}：保持单镜头 no-cut 连续推进，不跳切、不瞬移、不断身份。`,
      `空间路径：先朝${fromZh}穿过当前空间的门/过道，再顺势转向${toZh}进入下一空间。`,
      currentRoomHint ? `当前空间提示：${currentRoomHint}` : "",
      nextRoomHint ? `下一空间提示：${nextRoomHint}` : ""
    ].filter(Boolean).join("\n");
  }

  return [
    `Transition ${String(idx + 1).padStart(2, "0")}→${String(idx + 2).padStart(2, "0")}: keep a single no-cut take with identity continuity, no jump cut, no teleport.`,
    `Spatial path: move ${fromEn}, pass through the door/corridor of the current space, then turn ${toEn} into the next room naturally.`,
    currentRoomHint ? `Current-space cue: ${currentRoomHint}` : "",
    nextRoomHint ? `Next-space cue: ${nextRoomHint}` : ""
  ].filter(Boolean).join("\n");
}

function hasMotionIntent(text: string): boolean {
  return MOTION_WORDS_RE.test(text ?? "");
}

function transitionLineByType(lang: Lang, fromIdx: number, toIdx: number, type: string | undefined): string {
  const t = type ?? "cut";
  const a = String(fromIdx + 1).padStart(2, "0");
  const b = String(toIdx + 1).padStart(2, "0");
  if (lang === "zh") {
    if (t === "reverse_angle") return `衔接 ${a}→${b}：reverse angle，同场景切换反打角度。`;
    if (t === "camera_continues") return `衔接 ${a}→${b}：camera continues，镜头连续推进进入下一分镜。`;
    if (t === "dissolve") return `衔接 ${a}→${b}：dissolve，平滑叠化进入下一分镜。`;
    if (t === "time_jump") return `衔接 ${a}→${b}：time jump，时间向前跳转后进入下一分镜。`;
    return `衔接 ${a}→${b}：cut，直接切换到下一分镜。`;
  }
  if (t === "reverse_angle") return `Transition ${a}→${b}: reverse angle within the same scene.`;
  if (t === "camera_continues") return `Transition ${a}→${b}: camera continues into the next moment.`;
  if (t === "dissolve") return `Transition ${a}→${b}: dissolve into the next shot.`;
  if (t === "time_jump") return `Transition ${a}→${b}: time jump forward before next shot.`;
  return `Transition ${a}→${b}: cut to the next shot.`;
}

function parseMedia(input: Scene | string): MediaMode {
  const resolved = typeof input === "string" ? resolveSceneConfig({ notes: input, config: undefined }) : resolveSceneConfig(input);
  return resolved.mediaMode;
}

function parseCompiler(input: Scene | string): "v1" | "v2" {
  const resolved = typeof input === "string" ? resolveSceneConfig({ notes: input, config: undefined }) : resolveSceneConfig(input);
  return resolved.compiler;
}

function parseSceneTier(input: Scene | string): SceneTier {
  const resolved = typeof input === "string" ? resolveSceneConfig({ notes: input, config: undefined }) : resolveSceneConfig(input);
  return resolved.sceneTier;
}

function parseV2Mode(input: Scene | string): V2Mode {
  const resolved = typeof input === "string" ? resolveSceneConfig({ notes: input, config: undefined }) : resolveSceneConfig(input);
  return resolved.v2Mode;
}

function getShotPlan(project: Project): ShotPlan {
  const raw = (project?.project as any)?.shotPlan;
  if (raw === "single" || raw === "multicam" || raw === "continuous" || raw === "edit") return raw;
  return "single";
}

/* -------------------- Layer / Scene formatting -------------------- */

function formatLayerLine(lang: Lang, layer: Layer, mode: MediaMode): string {
  const k0 = getKF(layer, 0);
  const k1 = getKF(layer, 1);

  const type = (layer.type ?? "").trim();
  const look = (layer.look ?? "").trim();
  const shapeDesc = (layer.shapeDesc ?? "").trim();
  const notes = (layer.notes ?? "").trim();
  const externalPrompt = compactLocalPrompt(layer.externalPrompt ?? "");
  const refs = compactRefs(layer.referenceLinks ?? "", 1);

  // ⚠️ UI 已经没有层级/透明度，提示词也不要输出它们
  void clamp01;

  if (lang === "zh") {
    const base = [
      `- ${layer.id}`,
      type ? `主体(type)：${type}` : "",
      look ? `外观(look)：${look}` : "",
      shapeDesc ? `形状描述：${shapeDesc}` : "",
      externalPrompt
        ? `对象局部参考：${externalPrompt}（仅作用于 ${layer.id}，不得覆盖全局镜头/对象数量/整体构图）`
        : "",
      refs ? `参考图链接：${refs}` : "",
      `起点t0：x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
      mode === "video" ? `终点t1：x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}` : "",
      notes ? `约束/备注：${notes}` : ""
    ];
    return base.filter(Boolean).join("\n");
  }

  const base = [
    `- ${layer.id}`,
    type ? `Subject (type): ${type}` : "",
    look ? `Look: ${look}` : "",
    shapeDesc ? `Shape description: ${shapeDesc}` : "",
    externalPrompt
      ? `Object-local pasted prompt: ${externalPrompt} (apply to ${layer.id} only; do not override global camera/object count/overall composition).`
      : "",
    refs ? `Reference links: ${refs}` : "",
    `Start t0: x=${n1(k0.x)} y=${n1(k0.y)} w=${n1(k0.w)} h=${n1(k0.h)} rot=${n1(k0.rot)}`,
    mode === "video" ? `End   t1: x=${n1(k1.x)} y=${n1(k1.y)} w=${n1(k1.w)} h=${n1(k1.h)} rot=${n1(k1.rot)}` : "",
    notes ? `Constraints / notes: ${notes}` : ""
  ];
  return base.filter(Boolean).join("\n");
}

/**
 * ✅ FIX: camera/lighting 未选择（空字符串/undefined）时，不输出默认 wide/static/sunset...
 */
function formatScenePrompt(lang: Lang, scene: Scene): string {
  const camera = (scene.camera ?? {}) as any;
  const lighting = (scene.lighting ?? {}) as any;
  const cameraPreset = ((scene as any).cameraPreset ?? "").toString().trim();
  const shotNote = ((scene as any).shotNote ?? "").toString().trim();
  const proMotionLine = buildProMotionPromptLine(parseProMotionSelection(scene.notes ?? ""), lang);

  const bg = parseBg(scene.notes ?? "");
  const duration = Number.isFinite(scene.duration_s) ? Math.round(scene.duration_s) : 0;

  const mode: MediaMode = parseMedia(scene);
  const sceneStrategy = resolveSceneStrategy(scene, lang, mode);

  const shotRaw = typeof camera.shot === "string" ? camera.shot.trim() : "";
  const shot = shotRaw || cameraPreset || sceneStrategy.defaults.shot;
  const effectiveMotion = resolveEffectiveMotion(scene);
  const movement = effectiveMotion.source === "camera_movement"
    ? effectiveMotion.movementValue
    : effectiveMotion.source === "none"
      ? sceneStrategy.defaults.movement
      : "";
  const imageProLine = mode === "image" ? buildImageProPromptLine(scene.notes ?? "", lang) : "";

  const time = (typeof lighting.time === "string" ? lighting.time.trim() : "") || sceneStrategy.defaults.time;
  const keyDir = (typeof lighting.key_dir === "string" ? lighting.key_dir.trim() : "") || sceneStrategy.defaults.keyDir;
  const mood = (typeof lighting.mood === "string" ? lighting.mood.trim() : "") || sceneStrategy.defaults.mood;

  const layerLines = (scene.layers ?? [])
    .slice()
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0))
    .map((l) => formatLayerLine(lang, l, mode))
    .join("\n\n");

  if (lang === "zh") {
    const header =
      mode === "video"
        ? `# ${scene.name || scene.id}（${duration}秒）`
        : `# ${scene.name || scene.id}`;

    const cameraLine =
      shot || movement ? `摄像机：${[shot ? `景别=${shot}` : "", movement ? `运动=${movement}` : ""].filter(Boolean).join("，")}` : "";

    const lightingLine =
      time || keyDir || mood
        ? `光照：${[time ? `时间=${time}` : "", keyDir ? `主光=${keyDir}` : "", mood ? `氛围=${mood}` : ""]
            .filter(Boolean)
            .join("，")}`
        : "";

    const noteLine = shotNote ? `分镜说明：${shotNote}` : "";
    const strategyLines = sceneStrategy.promptLines;
    const sceneMeta = [bg ? `背景：${bg}` : "", cameraLine, lightingLine, noteLine, ...strategyLines, proMotionLine, imageProLine].filter(Boolean).join("\n");

    return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
  }

  const header =
    mode === "video"
      ? `# ${scene.name || scene.id} (${duration}s)`
      : `# ${scene.name || scene.id}`;

  const cameraLine =
    shot || movement
      ? `Camera: ${[shot ? `shot=${shot}` : "", movement ? `movement=${movement}` : ""].filter(Boolean).join(", ")}`
      : "";

  const lightingLine =
    time || keyDir || mood
      ? `Lighting: ${[time ? `time=${time}` : "", keyDir ? `key=${keyDir}` : "", mood ? `mood=${mood}` : ""]
          .filter(Boolean)
          .join(", ")}`
      : "";

  const noteLine = shotNote ? `Shot note: ${shotNote}` : "";
  const strategyLines = sceneStrategy.promptLines;
  const sceneMeta = [bg ? `Background: ${bg}` : "", cameraLine, lightingLine, noteLine, ...strategyLines, proMotionLine, imageProLine].filter(Boolean).join("\n");

  return [header, sceneMeta, layerLines].filter(Boolean).join("\n\n");
}

/* -------------------- System Structural Control Layer (ALWAYS ON) -------------------- */
/** 极限压缩：只保留“必须知道的” */
function machineNotesImage(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（系统追加结构控制层）",
      "",
      "【坐标/锚点】x,y,w,h 为屏幕百分比(0–100)；原点左上；(x,y) 默认主体中心；rot 为度。",
      "【约束】主体保持在画面内（除非备注允许裁切）；远小近大与透视一致；坐标数字仅作内部控制，不作为画面文字。"
    ].join("\n");
  }

  return [
    "(System Structural Control Layer)",
    "",
    "[Coords/Anchor] x,y,w,h are frame percentages (0–100); origin top-left; (x,y)=center by default; rot in degrees.",
    "[Rules] Keep subjects in-frame unless allowed; keep perspective consistent; treat coordinates as control metadata, not visible text."
  ].join("\n");
}

function machineNotesVideo(lang: Lang): string {
  if (lang === "zh") {
    return [
      "（系统结构控制层）",
      "",
      "【坐标】同图片：x,y,w,h 为屏幕百分比；rot 为度；原点左上。",
      "【视频】t0→t1 覆盖整个时长；采用平滑插值并保持运动连续。",
      "【约束】保持主体身份与对象数量连续；坐标数字仅作内部控制，不作为画面文字。"
    ].join("\n");
  }

  return [
    "(System Structural Control Layer)",
    "",
    "[Coords] Same as image: frame percentages; rot degrees; origin top-left.",
    "[Video] Apply t0→t1 across duration with smooth easing and continuous motion.",
    "[Rules] Keep identity and object count consistent unless requested; treat coordinates as control metadata, not visible text."
  ].join("\n");
}

/* -------------------- Exposure Fix Layer (auto) -------------------- */
/** 文案略压缩，但保留意图 */
function shouldAppendExposureFix(project: Project): boolean {
  const scenes = project?.scenes ?? [];
  for (const s of scenes) {
    const bg = parseBg(s?.notes ?? "").toLowerCase();
    const lighting: any = (s as any).lighting ?? {};
    const time = String(lighting.time ?? "").toLowerCase();
    const mood = String(lighting.mood ?? "").toLowerCase();

    const layers = (s.layers ?? []) as Layer[];
    const textBag = [
      bg,
      time,
      mood,
      ...layers.map((l) => `${l.look ?? ""} ${l.notes ?? ""} ${l.shapeDesc ?? ""}`.toLowerCase())
    ].join(" ");

    const hasInterior = /hotel|suite|room|interior|apartment|indoors|室内|酒店|套房|房间/.test(textBag);
    const hasWindow = /window|窗|落地窗|窗外|city view|skyline/.test(textBag);
    const riskyTime = /sunset|dusk|night|blue_hour|evening|黄昏|日落|夜/.test(textBag) || /sunset|night|blue_hour/.test(time);
    const silhouetteCue = /silhouette|剪影/.test(textBag);
    const dramaticCue = /dramatic lighting|high contrast|noir|cinematic/.test(textBag);

    if ((hasInterior && hasWindow && (riskyTime || dramaticCue)) || silhouetteCue) return true;
  }
  return false;
}

function exposureFixBlock(lang: Lang): string {
  if (lang === "zh") {
    return [
      "【曝光修正层】室内+窗景：主体暗部要可读（不压死黑）；允许补光/室内灯；窗外不过曝；除非明确要求，不做纯剪影。"
    ].join("\n");
  }

  return [
    "[Exposure Fix] Interior+window: keep subjects readable (no crushed blacks); allow fill/practical lights; protect window highlights; avoid pure silhouette unless requested."
  ].join("\n");
}

/* -------------------- Language Reinforcement Layer (ALWAYS ON) -------------------- */
/** 极限压缩：不再输出任何坐标数字；对象静止时不写“连续移动” */

function bucketX(x: number) {
  const v = n1(x);
  if (v <= 10) return { key: "hard-left", en: "hard-left", zh: "贴左边缘" };
  if (v <= 22) return { key: "left-edge", en: "left edge", zh: "左边缘区" };
  if (v <= 35) return { key: "left-third", en: "left third", zh: "左三分区" };
  if (v <= 45) return { key: "slightly-left", en: "slightly left", zh: "略左" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-right", en: "slightly right", zh: "略右" };
  if (v <= 78) return { key: "right-third", en: "right third", zh: "右三分区" };
  if (v <= 90) return { key: "right-edge", en: "right edge", zh: "右边缘区" };
  return { key: "hard-right", en: "hard-right", zh: "贴右边缘" };
}

function bucketY(y: number) {
  const v = n1(y);
  if (v <= 10) return { key: "top-edge", en: "top edge", zh: "贴上边缘" };
  if (v <= 22) return { key: "upper-area", en: "upper", zh: "上部" };
  if (v <= 35) return { key: "upper-third", en: "upper third", zh: "上三分区" };
  if (v <= 45) return { key: "slightly-up", en: "slightly up", zh: "略上" };
  if (v <= 55) return { key: "center", en: "center", zh: "中心" };
  if (v <= 65) return { key: "slightly-down", en: "slightly down", zh: "略下" };
  if (v <= 78) return { key: "lower-third", en: "lower third", zh: "下三分区" };
  if (v <= 90) return { key: "near-bottom", en: "near bottom", zh: "靠下" };
  return { key: "bottom-edge", en: "bottom edge", zh: "贴下边缘" };
}

function sizeLabel(w: number, h: number, lang: Lang) {
  const ww = n1(w);
  const hh = n1(h);
  const s = Math.max(ww, hh);
  let tagEn = "medium";
  let tagZh = "中等";
  if (s < 12) {
    tagEn = "small";
    tagZh = "偏小";
  } else if (s < 18) {
    tagEn = "medium-small";
    tagZh = "中小";
  } else if (s < 26) {
    tagEn = "medium";
    tagZh = "中等";
  } else if (s < 34) {
    tagEn = "medium-large";
    tagZh = "中大";
  } else if (s < 50) {
    tagEn = "large";
    tagZh = "偏大";
  } else {
    tagEn = "very large";
    tagZh = "很大";
  }
  return lang === "zh" ? `${tagZh}` : `${tagEn}`;
}

function marginHint(x: number, y: number, lang: Lang) {
  const xx = n1(x);
  const yy = n1(y);
  const parts: string[] = [];
  if (lang === "zh") {
    if (xx < 15) parts.push("靠左别出框");
    if (xx > 85) parts.push("靠右别出框");
    if (yy < 15) parts.push("靠上别出框");
    if (yy > 85) parts.push("靠下别出框");
    return parts.length ? `边距：${parts.join("；")}` : "";
  }
  if (xx < 15) parts.push("close-left, stay in-frame");
  if (xx > 85) parts.push("close-right, stay in-frame");
  if (yy < 15) parts.push("close-top, stay in-frame");
  if (yy > 85) parts.push("close-bottom, stay in-frame");
  return parts.length ? `Margins: ${parts.join("; ")}` : "";
}

function anchorHintFromNotes(notes: string, lang: Lang) {
  const bag = (notes ?? "").toLowerCase();
  const hasLie = /lie|lying|reclining|laying|躺|卧|斜躺/.test(bag);
  const hasSit = /sit|seated|sitting|坐|坐着|坐在/.test(bag);
  const hasChair = /chair|stool|armchair|椅|座椅/.test(bag);
  const hasFloor = /floor|ground|on the floor|地上|坐地|席地/.test(bag);

  if (lang === "zh") {
    if (hasLie) return "锚点：躺姿对齐躯干中心（别自动挪位）";
    if (hasSit && hasChair) return "锚点：坐姿对齐座面接触点（别自动居中）";
    if (hasSit && hasFloor) return "锚点：坐地对齐着地点（保持下部）";
    if (hasSit) return "锚点：坐姿重心稳定（别自动居中）";
    return "锚点：默认中心锚点（别自动重排）";
  }

  if (hasLie) return "Anchor: reclining; align torso center (no auto-shift).";
  if (hasSit && hasChair) return "Anchor: seated; align seat contact (no auto-center).";
  if (hasSit && hasFloor) return "Anchor: seated on floor; keep lower region.";
  if (hasSit) return "Anchor: seated; keep COM stable (no auto-center).";
  return "Anchor: center anchor (no auto re-layout).";
}

function silhouetteGuard(look: string, notes: string, lang: Lang) {
  const bag = `${look ?? ""} ${notes ?? ""}`.toLowerCase();
  const explicitSilhouette = /silhouette only|outline-only|纯剪影|只要剪影|仅剪影|轮廓化/.test(bag);
  const hasSilhouetteCue = /silhouette|outline-only|剪影|轮廓/.test(bag);

  if (explicitSilhouette) return "";

  if (hasSilhouetteCue) {
    return lang === "zh"
      ? "可见性：silhouette 解释为“轮廓清晰但保留细节”，不要纯黑剪影（除非明确要求）。"
      : "Visibility: interpret silhouette as clean readable contour with visible detail, not pure black silhouette unless requested.";
  }

  return "";
}

function buildLRLForScene(lang: Lang, mode: MediaMode, scene: Scene): string {
  const layers = (scene.layers ?? []) as Layer[];
  if (!layers.length) return "";

  const title =
    lang === "zh"
      ? `— 当前分镜：${scene.name || scene.id}`
      : `— Current scene: ${scene.name || scene.id}`;

  const global =
    lang === "zh"
      ? ["Global：", "- 不要自动居中/平衡构图；不要自动等比拉齐大小；保持相对位置与边距。"].join("\n")
      : ["Global:", "- No auto-center/auto-balance; no size equalization; respect relative layout and margins."].join("\n");

  const perObj: string[] = [];

  const sorted = layers
    .slice()
    .sort((a, b) => (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0));

  for (const layer of sorted) {
    const k0 = getKF(layer, 0);
    const k1 = getKF(layer, 1);

    const use = mode === "video" ? { a: k0, b: k1 } : { a: k0, b: k0 };
    const type = (layer.type ?? "").trim();
    const look = (layer.look ?? "").trim();
    const notes = (layer.notes ?? "").trim();
    const externalPrompt = compactLocalPrompt(layer.externalPrompt ?? "");
    const motionIntentText = [notes, externalPrompt].filter(Boolean).join(" ");

    const xB = bucketX(use.a.x);
    const yB = bucketY(use.a.y);

    // t0==t1 ? 静止
    const noMotion =
      mode === "video" &&
      n1(use.a.x) === n1(use.b.x) &&
      n1(use.a.y) === n1(use.b.y) &&
      n1(use.a.w) === n1(use.b.w) &&
      n1(use.a.h) === n1(use.b.h) &&
      n1(use.a.rot) === n1(use.b.rot);

    if (lang === "zh") {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? `（${type}）` : ""}：`);
      lines.push(`- 区域：${xB.zh} + ${yB.zh}`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- 尺寸：${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        if (noMotion) {
          lines.push("- 运动：t0 与 t1 一致，保持静止（别加抖动/位移/缩放/旋转）。");
          if (hasMotionIntent(motionIntentText)) {
            lines.push("- 冲突收口：结构优先。若备注里有行走/进入下一空间等动作词，仅保留为情绪或姿态意图，不转成真实位移。");
          }
        } else {
          const xB1 = bucketX(use.b.x);
          const yB1 = bucketY(use.b.y);
          lines.push(`- 终点：${xB1.zh} + ${yB1.zh}；平滑到位（无跳帧/无抖动）。`);
          lines.push(`- 终点尺寸：${sizeLabel(use.b.w, use.b.h, lang)}（别为了构图拉齐）。`);
          const pathSummary = summarizeKfPath(lang, layer);
          if (pathSummary) lines.push(`- ${pathSummary}`);
          const intent = extractContinuousIntent(lang, layer);
          if (intent) lines.push(`- ${intent}`);
        }
      }

      if (notes) lines.push(`- 备注优先：${notes}`);
      if (externalPrompt) lines.push(`- 局部粘贴提示：${externalPrompt}（仅 ${layer.id} 生效，不得改全局构图）。`);
      perObj.push(lines.join("\n"));
    } else {
      const lines: string[] = [];
      lines.push(`${layer.id}${type ? ` (${type})` : ""}:`);
      lines.push(`- Region: ${xB.en} + ${yB.en}`);
      const mh = marginHint(use.a.x, use.a.y, lang);
      if (mh) lines.push(`- ${mh}`);
      lines.push(`- Size: ${sizeLabel(use.a.w, use.a.h, lang)}`);
      lines.push(`- ${anchorHintFromNotes(notes, lang)}`);
      const sg = silhouetteGuard(look, notes, lang);
      if (sg) lines.push(`- ${sg}`);

      if (mode === "video") {
        if (noMotion) {
          lines.push("- Motion: t0==t1, keep static (no jitter/shift/scale/rotate).");
          if (hasMotionIntent(motionIntentText)) {
            lines.push("- Conflict resolution: structure wins. If notes mention walking/entering another room, keep that only as pose intent, not real displacement.");
          }
        } else {
          const xB1 = bucketX(use.b.x);
          const yB1 = bucketY(use.b.y);
          lines.push(`- End: ${xB1.en} + ${yB1.en}; smooth motion (no jumps/jitter).`);
          lines.push(`- End size: ${sizeLabel(use.b.w, use.b.h, lang)} (no size equalization).`);
          const pathSummary = summarizeKfPath(lang, layer);
          if (pathSummary) lines.push(`- ${pathSummary}`);
          const intent = extractContinuousIntent(lang, layer);
          if (intent) lines.push(`- ${intent}`);
        }
      }

      if (notes) lines.push(`- Notes priority: ${notes}`);
      if (externalPrompt) {
        lines.push(`- Local pasted prompt: ${externalPrompt} (object-local for ${layer.id}, no global composition override).`);
      }
      perObj.push(lines.join("\n"));
    }
  }

  return [title, global, perObj.join("\n")].filter(Boolean).join("\n");
}

function languageReinforcementBlock(lang: Lang, project: Project): string {
  const scenes = project?.scenes ?? [];
  const blocks: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const mode = parseMedia(scenes[i]);
    const b = buildLRLForScene(lang, mode, scenes[i]);
    if (b.trim()) blocks.push(b.trim());
  }
  if (!blocks.length) return "";

  if (lang === "zh") {
    return [
      "【语言强化层】把布局转成更“听得懂”的空间语言；不重复输出坐标数字；禁止自动居中/平衡/拉齐。",
      ...blocks
    ].join("\n");
  }

  return [
    "[LRL] Spatial enforcement for layout; no coordinate-number repetition; no auto-center/balance/size equalization.",
    ...blocks
  ].join("\n");
}

/**
 * ✅ Unified tail block (single tail for the exported project)
 * - Marker must stay as first line so ExportPanel can gray-split it.
 * - Machine notes + LRL are ALWAYS appended.
 */
function appendUnifiedTail(prompt: string, lang: Lang, project: Project): string {
  const scenes = project?.scenes ?? [];
  const anyVideo = scenes.some((s) => parseMedia(s) === "video");
  const mode: MediaMode = anyVideo ? "video" : "image";

  const machine = mode === "video" ? machineNotesVideo(lang) : machineNotesImage(lang);

  const parts: string[] = [];
  const machineLines = machine.split("\n");
  const marker = (machineLines[0] ?? "").trim();
  const machineBody = machineLines.slice(1).join("\n").trimEnd();

  parts.push(marker);

  if (shouldAppendExposureFix(project)) {
    parts.push("", exposureFixBlock(lang));
  }

  // ✅ LRL always ON (no switch)
  const lrl = languageReinforcementBlock(lang, project);
  if (lrl.trim()) {
    parts.push("", lrl.trim());
  }

  // ✅ Machine notes always ON (no switch)
  if (machineBody) {
    parts.push("", machineBody);
  }

  const tail = dedupeNonEmptyLines(parts.join("\n"));
  return [prompt.trimEnd(), "", tail.trimEnd()].join("\n");
}

function dedupeNonEmptyLines(input: string): string {
  const lines = (input ?? "").split("\n");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (!key) {
      out.push("");
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n");
}

function normalizeSpaces(s: string): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function constraintBucket(line: string): string | null {
  const low = normalizeSpaces(line).toLowerCase();
  if (!low) return null;

  if (/保持对象数量|object count|add\/remove subjects|新增\/删除主体/.test(low)) return "count-identity";
  if (/对象身份|identity/.test(low)) return "count-identity";
  if (/相对位置|relative layout|relative placement|重排构图|relayout composition/.test(low)) return "layout-stability";
  if (/不自动居中|auto-center|auto centering|symmetry|对称构图/.test(low)) return "anti-director";
  if (/先结构后风格|structure first, style second|structure first/.test(low)) return "structure-first";
  if (/no subtitles|no overlays|no text|no numbers|不要.*文字|不显示数字/.test(low)) return "no-overlay-text";
  if (/冲突处理|conflict policy|发生冲突/.test(low)) return "conflict-policy";
  return null;
}

function optimizeFinalPrompt(raw: string): string {
  const lines = (raw ?? "").split("\n");
  const out: string[] = [];
  const seenBucket = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push("");
      continue;
    }

    // Keep scene/object detail lines intact; dedupe only meta constraints.
    if (/^#\s/.test(trimmed) || /^-\s+[A-Za-z0-9_]/.test(trimmed) || /^- 对象/.test(trimmed)) {
      out.push(line);
      continue;
    }

    const bucket = constraintBucket(trimmed);
    if (!bucket) {
      out.push(line);
      continue;
    }
    if (seenBucket.has(bucket)) continue;
    seenBucket.add(bucket);
    out.push(line);
  }

  // Collapse excessive empty lines.
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function platformGuide(profile: PromptProfile, lang: Lang): string {
  const zh = lang === "zh";
  const header = zh
    ? `【平台执行协议：${profile === "nano_banana" ? "Nano Banana" : profile}】`
    : `[Platform Execution Contract: ${profile === "nano_banana" ? "Nano Banana" : profile}]`;

  const hardRulesZh = [
    "硬约束：必须保持对象数量、对象身份、对象相对位置、坐标区间和镜头方向；不得擅自新增/删除主体。",
    "冲突处理：若用户自由文案与结构字段冲突，以结构字段（坐标/数量/轨迹/镜头）为最高优先级。"
  ];
  const hardRulesEn = [
    "Hard constraints: preserve object count, identity, relative placement, coordinate ranges, and camera direction; do not add/remove subjects.",
    "Conflict policy: if free-form user text conflicts with structural fields, structural fields (coords/count/path/camera) take priority."
  ];

  const tailCommonZh = [
    "输出策略：先结构后风格；每个对象先位置与尺度，再材质与细节；不要重排构图。"
  ];
  const tailCommonEn = [
    "Output policy: structure first, style second; for each object, lock position/scale before material/detail; do not relayout composition."
  ];

  let profileRules: string[] = [];
  if (profile === "universal") {
    profileRules = zh
      ? ["通用策略：使用清晰分段，避免冗长修辞，确保每个对象约束可执行。"]
      : ["Universal: use clear sections, avoid verbose prose, and keep each object constraint executable."];
  } else if (profile === "qwen") {
    profileRules = zh
      ? ["千问策略：采用“对象清单 + 约束清单 + 运动清单”格式，顺序固定，减少叙事性句子。"]
      : ["Qwen: use fixed order as Object List + Constraint List + Motion List; reduce narrative wording."];
  } else if (profile === "jimeng") {
    profileRules = zh
      ? ["即梦策略：短句高密度关键词，风格词控制在 2-4 个核心词，避免互斥风格并列。"]
      : ["Jimeng: short high-density clauses; keep style to 2-4 core anchors and avoid mutually exclusive styles."];
  } else if (profile === "openai") {
    profileRules = zh
      ? ["OpenAI 策略：自然语言分段，但每段只表达单一约束目标，避免含糊代词。"]
      : ["OpenAI: natural-language sections, but one constraint goal per sentence; avoid ambiguous pronouns."];
  } else if (profile === "fal") {
    profileRules = zh
      ? ["fal 策略：图片优先对象与关系，先主体再关系再构图，复杂场景保留结构化分段。"]
      : ["fal: prioritize subject and relation first; for complex scenes, keep structured object blocks before style."];
  } else if (profile === "runway") {
    profileRules = zh
      ? ["Runway 策略：视频优先时间连续性，动作描述使用“起点→终点”形式，镜头变化保持平滑。"]
      : ["Runway: prioritize temporal continuity for video; express actions as start->end and keep camera transitions smooth."];
  } else if (profile === "midjourney") {
    profileRules = zh
      ? ["Midjourney 策略：压缩为关键词链，强调主体/构图/材质锚点，弱化系统解释文字。"]
      : ["Midjourney: compress into keyword chains; emphasize subject/composition/material anchors and minimize system prose."];
  } else if (profile === "vertex") {
    profileRules = zh
      ? ["Vertex 策略：关系优先，明确对象间方位与层次，再补充光照与风格。"]
      : ["Vertex: prioritize inter-object relations and hierarchy first, then add lighting/style."];
  } else if (profile === "grok") {
    profileRules = zh
      ? ["Grok 策略：工程化表达，先给可验证硬条件，再给软风格条件。"]
      : ["Grok: engineering style; provide verifiable hard constraints before soft style cues."];
  } else if (profile === "nano_banana") {
    profileRules = zh
      ? ["Nano Banana 策略：使用可执行短指令，减少修饰语，优先对象与镜头控制词。"]
      : ["Nano Banana: use short executable commands, reduce adjectives, and prioritize object/camera control terms."];
  }

  const lines = [header];
  lines.push(...(zh ? hardRulesZh : hardRulesEn));
  lines.push(...profileRules);
  lines.push(...(zh ? tailCommonZh : tailCommonEn));
  return lines.join("\n");
}

/**
 * ✅ generatePrompts(project, lang)
 * - Media mode is per-scene (scene.notes marker).
 */
export function generatePrompts(project: Project, lang: Lang, profile: PromptProfile = "universal"): string {
  const scenes = project?.scenes ?? [];
  const shotPlan = getShotPlan(project);

  if (!scenes.length) {
    return lang === "zh" ? "（无分镜）" : "(no scenes)";
  }

  const out: string[] = [];
  const anyVideo = scenes.some((s) => parseMedia(s) === "video");
  const hasV2 = scenes.some((s) => parseCompiler(s) === "v2");

  if (lang === "zh") {
    const lines = [
      `你将根据以下分镜结构生成${anyVideo ? "视频" : "图像"}画面。`,
      "要求：严格遵守已填写的 type / look / 形状描述 / 起点终点坐标与尺寸 / 备注约束；未填写字段可由模型补全，但不得改变结构与坐标。",
      "优先级：1) 对象位置与数量 2) 运动路径与镜头 3) 光照与时间 4) 风格细节。发生冲突时以前者为准。"
    ];
    const p = platformGuide(profile, lang);
    if (p) lines.push(p);
    out.push(lines.join("\n"));
  } else {
    const lines = [
      `Generate ${anyVideo ? "video" : "image"} visuals following the storyboard below.`,
      "Strictly follow provided type/look/shape/start-end layout/constraints. Empty fields may be completed by the model, but layout and coordinates must not be altered.",
      "Priority: 1) object position/count 2) motion path/camera 3) lighting/time 4) style details. Resolve conflicts using this order."
    ];
    const p = platformGuide(profile, lang);
    if (p) lines.push(p);
    out.push(lines.join("\n"));
  }

  if (hasV2) {
    scenes.forEach((s) => {
      if (parseCompiler(s) === "v2") {
        const tier = parseSceneTier(s);
        const v2Mode = parseV2Mode(s);
        const compiled = compileScenePromptV2(s, lang, tier, v2Mode);
        out.push(optimizeV2ScenePrompt(compiled, s, lang, tier, v2Mode));
      } else {
        out.push(formatScenePrompt(lang, s));
      }
    });
    return proPromptQualityGate(
      finalizeByPlatform(optimizeFinalPrompt(out.join("\n\n---\n\n")), profile, lang, anyVideo ? "video" : "image")
    );
  }

  if (shotPlan === "continuous" && scenes.length > 1) {
    const totalSec = scenes.reduce((sum, s) => sum + Math.max(1, Math.round(Number(s.duration_s) || 0)), 0);
    if (lang === "zh") {
      out.push(
        [
          `连续镜头模式（总时长约 ${totalSec} 秒）：第一视角，单镜头连续运动，无跳切。`,
          "强制约束：no text / no subtitles / no overlays / do not show numbers。",
          "保持对象身份连续、数量稳定；避免突然位移、瞬移、硬切。",
          "连续轨迹要求：明确从当前空间进入、穿过门或走廊、再自然进入下一空间；动作衔接以对象路径连续为准。"
        ].join("\n")
      );
    } else {
      out.push(
        [
          `Continuous mode (~${totalSec}s): first-person perspective, single long take, seamless motion, no cuts.`,
          "Hard constraints: no text / no subtitles / no overlays / do not show numbers.",
          "Keep identity and object count consistent; avoid sudden jumps/teleports/hard cuts.",
          "Continuity rule: make the subject path explicit from current space, through door/corridor, and naturally into the next space."
        ].join("\n")
      );
    }

    scenes.forEach((s, i) => {
      const shotTitle = (s.name ?? "").trim() || (lang === "zh" ? `分镜 ${i + 1}` : `Shot ${i + 1}`);
      const layerSummary = (s.layers ?? [])
        .map((l) => {
          const parts = [
            l.id,
            l.type,
            l.look,
            l.notes,
            compactLocalPrompt(l.externalPrompt ?? ""),
            summarizeKfPath(lang, l),
            extractContinuousIntent(lang, l)
          ].filter(Boolean);
          return parts.join(" | ");
        })
        .filter(Boolean)
        .join(lang === "zh" ? "；" : "; ");
      const shotLine =
        lang === "zh"
          ? `镜头 ${String(i + 1).padStart(2, "0")}：${shotTitle}（${Math.max(1, Math.round(Number(s.duration_s) || 0))}秒）`
          : `Shot ${String(i + 1).padStart(2, "0")}: ${shotTitle} (${Math.max(1, Math.round(Number(s.duration_s) || 0))}s)`;
      const noteLine = (s as any).shotNote ? (lang === "zh" ? `说明：${(s as any).shotNote}` : `Note: ${(s as any).shotNote}`) : "";
      const doorLine =
        lang === "zh"
          ? [s.entryDir ? `入场方向：${DIRECTION_TO_MOVE_ZH[s.entryDir as Direction] ?? "自动"}` : "", s.exitDir ? `离场方向：${DIRECTION_TO_MOVE_ZH[s.exitDir as Direction] ?? "自动"}` : ""].filter(Boolean).join("；")
          : [s.entryDir ? `Entry: ${DIRECTION_TO_MOVE[s.entryDir as Direction] ?? "auto"}` : "", s.exitDir ? `Exit: ${DIRECTION_TO_MOVE[s.exitDir as Direction] ?? "auto"}` : ""].filter(Boolean).join(" | ");
      out.push([shotLine, noteLine, doorLine, layerSummary].filter(Boolean).join("\n"));

      if (i < scenes.length - 1) {
        out.push(buildContinuousBridge(lang, s, scenes[i + 1], i));
      }
    });

    const prompt = out.join("\n\n---\n\n");
    return proPromptQualityGate(
      finalizeByPlatform(optimizeFinalPrompt(appendUnifiedTail(prompt, lang, project)), profile, lang, "video")
    );
  }

  if ((shotPlan === "multicam" || shotPlan === "edit") && scenes.length > 1) {
    if (shotPlan === "multicam") {
      out.push(
        lang === "zh"
          ? "同场景多机位：保持同一地点/光线/对象位置连续，仅切换机位与视角。"
          : "Multi-cam: keep same location/lighting/object placement continuity; only change camera angle."
      );
    } else {
      out.push(
        lang === "zh"
          ? "标准剪辑：允许镜头跳切、时间跳跃、地点变化，但每个分镜内部需稳定执行。"
          : "Standard edit: cut/time jump/location switch allowed, while each shot remains internally consistent."
      );
    }
    scenes.forEach((s, i) => {
      out.push(formatScenePrompt(lang, s));
      if (i < scenes.length - 1) {
        const strategy = resolveSceneStrategy(s, lang, parseMedia(s));
        const t = (s as any).transitionType ?? strategy.defaults.transitionType ?? (shotPlan === "multicam" ? "reverse_angle" : "cut");
        out.push(transitionLineByType(lang, i, i + 1, t));
      }
    });
    const prompt = out.join("\n\n---\n\n");
    return proPromptQualityGate(
      finalizeByPlatform(optimizeFinalPrompt(appendUnifiedTail(prompt, lang, project)), profile, lang, anyVideo ? "video" : "image")
    );
  }

  scenes.forEach((s) => {
    out.push(formatScenePrompt(lang, s));
  });

  const prompt = out.join("\n\n---\n\n");
  return proPromptQualityGate(
    finalizeByPlatform(optimizeFinalPrompt(appendUnifiedTail(prompt, lang, project)), profile, lang, anyVideo ? "video" : "image")
  );
}
