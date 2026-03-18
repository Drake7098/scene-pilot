import type { Lang } from "../i18n";
import type { Layer, LayerKF, Scene } from "../model";
import { COMBAT_PATCH_LIST } from "../config/combatPatchList";
import { buildProMotionPromptLine, parseProMotionSelection } from "../content/proCameraPresets";
import { buildImageProPromptLine } from "../content/proCreativeModes";
import { parseCameraLanguageId, getCameraLanguageDisplayLabel } from "../content/cameraLanguageLayers";

export type SceneTier = "indoor" | "small_plaza" | "open_space";
export type V2Mode = "short" | "strict";

type SizeTag = "ECU" | "CU" | "MCU" | "MS" | "FS" | "LS" | "XLS";
type DepthTag = "foreground" | "midground" | "background";
type PosTag = "left" | "left-center" | "center" | "right-center" | "right";
type VPosTag = "top" | "upper" | "mid" | "lower" | "bottom";

type SubjectSpec = {
  id: string;
  name: string;
  look: string;
  notes: string;
  externalPrompt: string;
  t0: LayerKF;
  t1: LayerKF;
  size0: SizeTag;
  size1: SizeTag;
  hPos0: PosTag;
  hPos1: PosTag;
  vPos0: VPosTag;
  vPos1: VPosTag;
  depth0: DepthTag;
  depth1: DepthTag;
};

const TIER_PROFILE: Record<
  SceneTier,
  { farCut: number; bgDensity: "low" | "mid" | "high"; anti: "low" | "mid" | "strong"; nearDelta: number; farDelta: number; xyMove: number }
> = {
  indoor: {
    farCut: COMBAT_PATCH_LIST.profiles.indoor.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.indoor.background_density === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.indoor.background_density,
    anti: COMBAT_PATCH_LIST.profiles.indoor.anti_director_strength === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.indoor.anti_director_strength,
    nearDelta: 0.06,
    farDelta: 0.06,
    xyMove: 0.03,
  },
  small_plaza: {
    farCut: COMBAT_PATCH_LIST.profiles.small_plaza.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.small_plaza.background_density === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.small_plaza.background_density,
    anti: COMBAT_PATCH_LIST.profiles.small_plaza.anti_director_strength === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.small_plaza.anti_director_strength,
    nearDelta: 0.08,
    farDelta: 0.08,
    xyMove: 0.04,
  },
  open_space: {
    farCut: COMBAT_PATCH_LIST.profiles.open_space.far_threshold_height_pct,
    bgDensity: COMBAT_PATCH_LIST.profiles.open_space.background_density === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.open_space.background_density,
    anti: COMBAT_PATCH_LIST.profiles.open_space.anti_director_strength === "medium" ? "mid" : COMBAT_PATCH_LIST.profiles.open_space.anti_director_strength,
    nearDelta: 0.1,
    farDelta: 0.1,
    xyMove: 0.05,
  }
};

const MOTION_INTENT_RE =
  /跑|行走|慢走|快走|挪|移动|奔跑|跳|转身|挥手|抬手|吃|喝|追逐|\b(run|walk|jog|step|shift|move|turn|spin|wave|eat|drink|chase|approach|retreat)\b/i;
const NEG_STATIC_RE =
  /不(移动|动|走|跑|转)|静止|保持原位|固定不动|\b(no motion|stay still|static)\b/i;

function compactLocalPrompt(input: string): string {
  return (input ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" | ");
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
  return base ?? { t, x: 50, y: 50, w: 18, h: 18, rot: 0 };
}

function sizeTagFromH(hPct01: number, farCut: number): SizeTag {
  if (hPct01 >= 0.7) return "ECU";
  if (hPct01 >= 0.45) return "CU";
  if (hPct01 >= 0.28) return "MCU";
  if (hPct01 >= 0.18) return "MS";
  if (hPct01 >= 0.1) return "FS";
  if (hPct01 >= farCut) return "LS";
  return "XLS";
}

function hPosTag(x: number): PosTag {
  const v = n1(x);
  if (v < 20) return "left";
  if (v < 40) return "left-center";
  if (v < 60) return "center";
  if (v < 80) return "right-center";
  return "right";
}

function vPosTag(y: number): VPosTag {
  const v = n1(y);
  if (v < 20) return "top";
  if (v < 40) return "upper";
  if (v < 60) return "mid";
  if (v < 80) return "lower";
  return "bottom";
}

function subjectName(layer: Layer, idx: number, lang: Lang): string {
  const t = (layer.type ?? "").trim();
  if (t) return t.slice(0, 28);
  if (lang === "zh") return `对象${idx + 1}`;
  return `Subject ${idx + 1}`;
}

function subjectLabel(s: SubjectSpec, lang: Lang): string {
  const alias = (s.name ?? "").trim();
  if (!alias || alias === s.id) return s.id;
  return lang === "zh" ? `${s.id}（${alias}）` : `${s.id} (${alias})`;
}

function depthByHeight(subjects: SubjectSpec[], t: 0 | 1) {
  const sorted = subjects
    .map((s) => ({ id: s.id, h: (t === 0 ? s.t0.h : s.t1.h) / 100 }))
    .sort((a, b) => b.h - a.h);
  const n = sorted.length;
  const fgCount = Math.min(2, n);
  const bgCount = Math.min(2, Math.max(0, n - fgCount));
  const fg = new Set(sorted.slice(0, fgCount).map((x) => x.id));
  const bg = new Set(sorted.slice(Math.max(0, n - bgCount)).map((x) => x.id));
  for (const s of subjects) {
    const d: DepthTag = fg.has(s.id) ? "foreground" : bg.has(s.id) ? "background" : "midground";
    if (t === 0) s.depth0 = d;
    else s.depth1 = d;
  }
}

function posLabel(tag: PosTag, lang: Lang): string {
  if (lang === "zh") {
    if (tag === "left") return "左侧";
    if (tag === "left-center") return "左中";
    if (tag === "center") return "中间";
    if (tag === "right-center") return "右中";
    return "右侧";
  }
  return tag;
}

function vPosLabel(tag: VPosTag, lang: Lang): string {
  if (lang === "zh") {
    if (tag === "top") return "偏上";
    if (tag === "upper") return "上部";
    if (tag === "mid") return "中部";
    if (tag === "lower") return "偏下";
    return "底部";
  }
  return tag;
}

function sizeLabel(tag: SizeTag, lang: Lang): string {
  if (lang !== "zh") return tag;
  if (tag === "ECU") return "超近景";
  if (tag === "CU") return "近景";
  if (tag === "MCU") return "中近景";
  if (tag === "MS") return "中景";
  if (tag === "FS") return "全景";
  if (tag === "LS") return "远景";
  return "极远景";
}

function depthLabel(tag: DepthTag, lang: Lang): string {
  if (lang !== "zh") return tag;
  if (tag === "foreground") return "前景";
  if (tag === "midground") return "中景层";
  return "背景";
}

function describeTransition(s: SubjectSpec, lang: Lang, profile: (typeof TIER_PROFILE)[SceneTier], mode: V2Mode): string {
  const dx = (s.t1.x - s.t0.x) / 100;
  const dy = (s.t1.y - s.t0.y) / 100;
  const h0 = Math.max(1, s.t0.h) / 100;
  const h1 = Math.max(1, s.t1.h) / 100;
  const wh0 = (Math.max(1, s.t0.w) * Math.max(1, s.t0.h)) / 10000;
  const wh1 = (Math.max(1, s.t1.w) * Math.max(1, s.t1.h)) / 10000;
  const depthDelta = (h1 - h0) / h0;
  const scaleDelta = wh0 > 0 ? (wh1 - wh0) / wh0 : 0;
  const rotDelta = Math.abs((s.t1.rot ?? 0) - (s.t0.rot ?? 0));

  const parts: string[] = [];

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx >= profile.xyMove || absDy >= profile.xyMove) {
    if (lang === "zh") {
      const hDir = dx > 0 ? "向右" : "向左";
      const vDir = dy > 0 ? "向下" : "向上";
      if (absDx >= profile.xyMove && absDy >= profile.xyMove) parts.push(`${hDir}${vDir}移动`);
      else parts.push(absDx >= profile.xyMove ? `${hDir}移动` : `${vDir}移动`);
    } else {
      const hDir = dx > 0 ? "moves right" : "moves left";
      const vDir = dy > 0 ? "moves downward" : "moves upward";
      if (absDx >= profile.xyMove && absDy >= profile.xyMove) parts.push(`${hDir} and ${vDir}`);
      else parts.push(absDx >= profile.xyMove ? hDir : vDir);
    }
  }

  if (depthDelta >= profile.nearDelta) {
    parts.push(lang === "zh" ? "与镜头距离变近" : "moves closer to camera");
  } else if (depthDelta <= -profile.farDelta) {
    parts.push(lang === "zh" ? "与镜头距离变远" : "moves farther from camera");
  }

  if (scaleDelta >= 0.1) parts.push(lang === "zh" ? "尺寸增大" : "size grows");
  else if (scaleDelta <= -0.1) parts.push(lang === "zh" ? "尺寸减小" : "size shrinks");

  if (rotDelta >= 20) parts.push(lang === "zh" ? "明显转向" : "clear rotation change");
  else if (rotDelta >= 8) parts.push(lang === "zh" ? "轻微转向" : "slight rotation change");

  if (s.depth0 !== s.depth1) {
    parts.push(
      lang === "zh"
        ? `层级由${depthLabel(s.depth0, lang)}变为${depthLabel(s.depth1, lang)}`
        : `depth changes from ${s.depth0} to ${s.depth1}`
    );
  }

  if (!parts.length) {
    return lang === "zh"
      ? mode === "short"
        ? "保持不变。"
        : "结束保持原位，距离与尺度稳定。"
      : mode === "short"
        ? "stays stable."
        : "keeps original position with stable depth and scale.";
  }
  return lang === "zh" ? `${parts.join("，")}。` : `${parts.join(", ")}.`;
}

// 保留原函数，builtin.ts / 其他地方可能引用
function antiDirector(lang: Lang, anti: "low" | "mid" | "strong"): string[] {
  const zh = lang === "zh";
  if (anti === "low") {
    return zh
      ? ["- 不自动居中，不自动对称。", "- 不改变主体相对顺序。"]
      : ["- No auto-centering, no forced symmetry.", "- Keep relative subject order unchanged."];
  }
  if (anti === "mid") {
    return zh
      ? ["- 不自动居中，不做对称构图，不重排队列。", "- 不强行把任何对象变成主角。", "- 保持层级关系与相对顺序。"]
      : ["- No auto-centering, no symmetry, no queue relayout.", "- Do not force any subject into hero framing.", "- Keep depth and relative order stable."];
  }
  return zh
    ? [
        "- 禁止自动居中、对称构图、整齐排队。",
        "- 禁止自动主角化（hero shot）与强行特写。",
        "- 禁止重排前中后层级与左右顺序。",
        "- 禁止自动推拉镜头/换机位。"
      ]
    : [
        "- No auto-centering, no symmetry, no neat lineup.",
        "- No hero-shot promotion or forced close-up.",
        "- No depth/order relayout across subjects.",
        "- No auto zoom/push or camera-angle switching."
      ];
}

function hasSemanticMotionIntent(scene: Scene): boolean {
  return (scene.layers ?? []).some((layer) => {
    const text = [
      layer.type ?? "",
      layer.look ?? "",
      layer.notes ?? "",
      layer.externalPrompt ?? "",
      layer.shapeDesc ?? "",
    ]
      .join(" ")
      .trim();
    if (!text) return false;
    if (!MOTION_INTENT_RE.test(text)) return false;
    return !NEG_STATIC_RE.test(text);
  });
}

// ─────────────────────────────────────────────
// 新增：空间叙事生成器（取代 T0 Frame Spec 列表）
// ─────────────────────────────────────────────

function buildSpatialNarrative(subjects: SubjectSpec[], lang: Lang): string {
  const n = subjects.length;
  if (n === 0) return "";

  if (n === 1) {
    const s = subjects[0];
    const detail = [s.look, s.notes].filter(Boolean).join(", ");
    if (lang === "zh") {
      return `${sizeLabel(s.size0, lang)}，主体（${s.name}${detail ? `，${detail}` : ""}）位于画面${posLabel(s.hPos0, lang)}${vPosLabel(s.vPos0, lang)}，${depthLabel(s.depth0, lang)}。`;
    }
    return `${sizeLabel(s.size0, lang)} shot. Subject (${s.name}${detail ? `, ${detail}` : ""}) at ${s.hPos0} ${s.vPos0}, ${s.depth0}.`;
  }

  if (n === 2) {
    const [a, b] = subjects;
    const oppSides =
      (a.hPos0.includes("left") && b.hPos0.includes("right")) ||
      (a.hPos0.includes("right") && b.hPos0.includes("left"));
    const depthDiff = a.depth0 !== b.depth0;

    if (lang === "zh") {
      let rel = oppSides
        ? `双人构图：${a.name}（${sizeLabel(a.size0, lang)}，${depthLabel(a.depth0, lang)}）在画面左侧，${b.name}（${sizeLabel(b.size0, lang)}，${depthLabel(b.depth0, lang)}）在画面右侧，两人面向彼此。`
        : `双人构图：${a.name}（${sizeLabel(a.size0, lang)}）与${b.name}（${sizeLabel(b.size0, lang)}）均在${posLabel(a.hPos0, lang)}区域。`;
      if (depthDiff) rel += `${a.name}距镜头更近，${b.name}在${depthLabel(b.depth0, lang)}。`;
      return rel;
    }

    let rel = oppSides
      ? `Two-shot. ${a.name} (${sizeLabel(a.size0, lang)}, ${a.depth0}) anchors ${a.hPos0}, ${b.name} (${sizeLabel(b.size0, lang)}, ${b.depth0}) holds ${b.hPos0}. Facing each other.`
      : `Two-shot. ${a.name} (${sizeLabel(a.size0, lang)}) at ${a.hPos0}, ${b.name} (${sizeLabel(b.size0, lang)}) at ${b.hPos0}.`;
    if (depthDiff) rel += ` ${a.name} is closer to camera.`;
    return rel;
  }

  // 3+ 主体：按深度层分组
  const fg = subjects.filter((s) => s.depth0 === "foreground");
  const mg = subjects.filter((s) => s.depth0 === "midground");
  const bg = subjects.filter((s) => s.depth0 === "background");

  if (lang === "zh") {
    const layers: string[] = [];
    if (fg.length) layers.push(`前景：${fg.map((s) => `${s.name}（${sizeLabel(s.size0, lang)}，${posLabel(s.hPos0, lang)}）`).join("、")}`);
    if (mg.length) layers.push(`中景：${mg.map((s) => `${s.name}（${sizeLabel(s.size0, lang)}，${posLabel(s.hPos0, lang)}）`).join("、")}`);
    if (bg.length) layers.push(`背景：${bg.map((s) => `${s.name}（${sizeLabel(s.size0, lang)}，${posLabel(s.hPos0, lang)}）`).join("、")}`);
    return `多主体构图。${layers.join("；")}。严格保持前中后层级，不重排。`;
  }

  const layers: string[] = [];
  if (fg.length) layers.push(`Foreground: ${fg.map((s) => `${s.name}(${sizeLabel(s.size0, lang)}, ${s.hPos0})`).join(", ")}`);
  if (mg.length) layers.push(`Midground: ${mg.map((s) => `${s.name}(${sizeLabel(s.size0, lang)}, ${s.hPos0})`).join(", ")}`);
  if (bg.length) layers.push(`Background: ${bg.map((s) => `${s.name}(${sizeLabel(s.size0, lang)}, ${s.hPos0})`).join(", ")}`);
  return `Multi-subject. ${layers.join(". ")}. Preserve exact depth layering.`;
}

// ─────────────────────────────────────────────
// 新增：运动摘要生成器（取代 T1 Frame Spec 列表）
// 只输出有实际运动的主体，静止主体不输出
// ─────────────────────────────────────────────

function buildMotionSummary(
  subjects: SubjectSpec[],
  lang: Lang,
  profile: (typeof TIER_PROFILE)[SceneTier],
  mode: V2Mode,
  hasAnyMotion: boolean
): string {
  if (!hasAnyMotion) {
    return lang === "zh"
      ? "所有主体保持静止，不添加位移或缩放。"
      : "All subjects static. No motion added.";
  }

  const staticZh = mode === "short" ? "保持不变。" : "结束保持原位，距离与尺度稳定。";
  const staticEn = mode === "short" ? "stays stable." : "keeps original position with stable depth and scale.";

  const lines = subjects
    .map((s) => {
      const transition = describeTransition(s, lang, profile, mode);
      const isStatic = transition === (lang === "zh" ? staticZh : staticEn);
      if (isStatic) return null;
      return lang === "zh"
        ? `${s.name}：${transition}`
        : `${s.name}: ${transition}`;
    })
    .filter((line): line is string => line !== null);

  return lines.length
    ? lines.join(lang === "zh" ? "；" : "; ")
    : "";
}

export function compileScenePromptV2(
  scene: Scene,
  lang: Lang,
  tier: SceneTier,
  mode: V2Mode = "strict",
  aspectRatio?: string
): string {
  const profile = TIER_PROFILE[tier];
  const duration = Math.max(1, Math.round(Number(scene.duration_s) || 1));
  const subjects: SubjectSpec[] = (scene.layers ?? []).map((l, idx) => {
    const t0 = getKF(l, 0);
    const t1 = getKF(l, 1);
    const s: SubjectSpec = {
      id: l.id,
      name: subjectName(l, idx, lang),
      look: (l.look ?? "").trim(),
      notes: (l.notes ?? "").trim(),
      externalPrompt: compactLocalPrompt(l.externalPrompt ?? ""),
      t0,
      t1,
      size0: sizeTagFromH((t0.h ?? 0) / 100, profile.farCut),
      size1: sizeTagFromH((t1.h ?? 0) / 100, profile.farCut),
      hPos0: hPosTag(t0.x),
      hPos1: hPosTag(t1.x),
      vPos0: vPosTag(t0.y),
      vPos1: vPosTag(t1.y),
      depth0: "midground",
      depth1: "midground"
    };
    return s;
  });

  const hasGeometryMotion = subjects.some(
    (s) => describeTransition(s, lang, profile, "short") !== (lang === "zh" ? "保持不变。" : "stays stable.")
  );
  const hasAnyMotion = hasGeometryMotion || hasSemanticMotionIntent(scene);

  depthByHeight(subjects, 0);
  depthByHeight(subjects, 1);

  const title = scene.name || scene.id || (lang === "zh" ? "未命名分镜" : "Untitled Scene");
  const sceneHeader =
    lang === "zh"
      ? `Scene: ${title}（${duration}秒）。Style: realistic, cinematic natural light.`
      : `Scene: ${title} (${duration}s). Style: realistic, cinematic natural light.`;

  const cameraContract =
    lang === "zh"
      ? [
          "Camera Contract:",
          "- 单机位，保持镜头与构图一致。",
          "- 不自动推拉镜头，不自动换角度。",
          hasAnyMotion
            ? `- 在 ${duration} 秒时长内完成 t0→t1 变化。`
            : `- 当前 t0=t1，整段 ${duration} 秒保持静止构图，不自动添加位移/缩放。`,
          "- 主要主体保持可识别。"
        ]
      : [
          "Camera Contract:",
          "- Single camera with consistent framing.",
          "- Do not auto zoom or switch angle.",
          hasAnyMotion
            ? `- Apply t0→t1 transition across the full ${duration}s duration.`
            : `- Current t0=t1; keep composition static for the full ${duration}s with no auto motion/zoom.`,
          "- Keep all main subjects recognizable."
        ];

  const proMotionLine = buildProMotionPromptLine(parseProMotionSelection(scene.notes ?? ""), lang);
  const mediaMode = /(^|\n)\s*media\s*:\s*image\b/i.test(scene.notes ?? "") ? "image" : "video";
  const imageProLine = mediaMode === "image" ? buildImageProPromptLine(scene.notes ?? "", lang) : "";
  const cameraLanguageId = parseCameraLanguageId(scene.notes ?? "");
  const cameraLanguageLine = cameraLanguageId
    ? (lang === "zh"
        ? `镜头语言：${getCameraLanguageDisplayLabel(cameraLanguageId, lang, false)}`
        : `Camera language: ${getCameraLanguageDisplayLabel(cameraLanguageId, lang, false)}`)
    : "";

  const layoutExtra =
    profile.bgDensity === "high"
      ? lang === "zh"
        ? "- 开阔外景：强调前中后深度拉开，远景对象保留可见。"
        : "- Open-space: emphasize strong foreground-midground-background separation."
      : profile.bgDensity === "mid"
        ? lang === "zh"
          ? "- 中等背景密度：保持层次均衡，不挤压深度。"
          : "- Medium background density: keep balanced depth layering."
        : lang === "zh"
          ? "- 低背景密度：主体优先，减少背景干扰。"
          : "- Low background density: prioritize subjects over cluttered background.";

  const layoutContract = [
    "Layout Contract (obey strictly):",
    lang === "zh"
      ? "- 保持对象顺序和前中后层级，不要自动重排。"
      : "- Preserve subject order and depth layers; no relayout.",
    lang === "zh"
      ? "- 用画面占比表达远近，保持大小层级。"
      : "- Use frame-height ratio as depth cue; keep size hierarchy.",
    layoutExtra
  ];

  // 空间叙事（取代 T0 列表）
  const spatialNarrative = buildSpatialNarrative(subjects, lang);

  // 运动摘要（取代 T1 列表，静止主体不输出）
  const motionSummary = buildMotionSummary(subjects, lang, profile, mode, hasAnyMotion);

  // 约束（Anti-Director 4条 → 1条正向）
  const constraint =
    lang === "zh"
      ? profile.anti === "strong"
        ? "约束：严格按构图生成，保持主体位置、景深层级与画面构图，不自动调整。"
        : profile.anti === "mid"
          ? "约束：保持指定构图，不自动居中，不重排。"
          : "约束：保持主体位置不变。"
      : profile.anti === "strong"
        ? "Constraint: Render exactly as specified. Preserve positions, depth, and composition without improvisation."
        : profile.anti === "mid"
          ? "Constraint: Preserve the specified composition. No recentering or relayout."
          : "Constraint: Keep subject positions as specified.";

  const aspectRatioNote =
    aspectRatio && aspectRatio !== "16:9"
      ? lang === "zh"
        ? `画面比例：${aspectRatio}。`
        : `Aspect ratio: ${aspectRatio}.`
      : "";

  return [
    sceneHeader,
    cameraContract.join("\n"),
    proMotionLine,
    imageProLine,
    cameraLanguageLine,
    layoutContract.join("\n"),
    spatialNarrative,
    motionSummary,
    constraint,
    aspectRatioNote
  ]
    .filter(Boolean)
    .join("\n\n");
}
