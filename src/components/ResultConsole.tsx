import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Download, Heart, Layers3, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import type { Lang } from "../i18n";
import type { CanvasDraft } from "../types/canvasDraft";
import type { IntentPlan } from "../types/intentPlan";
import type { StructureDraft } from "../types/structureDraft";
import { generateStructureDraft } from "../utils/structureDraft";
import { canvasDraftToIntentPlan } from "../utils/canvasDraftToIntentPlan";
import { structureDraftToCanvas } from "../utils/structureDraftToCanvas";
import { generateQuickWorkspacePromptV3 } from "../utils/quickWorkspacePromptV3";
import { QuickWorkspaceIntro } from "./quick-workspace/QuickWorkspaceIntro";
import {
  QuickWorkspaceSecondaryCards,
  type ImageSecondarySelections,
  type ImageSecondaryStructure,
  type VideoSecondarySelections,
  type VideoSecondaryStructure
} from "./quick-workspace/QuickWorkspaceSecondaryCards";

export type ResultConsoleMode = "results" | "pro";

export type ResultGenerationPrefs = {
  mediaType: "image" | "video";
  ratio: "16:9" | "9:16" | "1:1";
  batchSize: 1 | 2 | 4 | 8;
  engineMode: "auto" | "comfyui" | "drawthings";
  showcaseMode: "show" | "headless";
};

export type ResultStructureState = {
  subjectX: number;
  subjectY: number;
  subjectSize: number;
  subjectLayer: number;
  compositionFocus: "left" | "center" | "right";
};

export type ResultPlanStructure =
  | ResultStructureState
  | IntentPlan
  | {
      subject: string;
      composition: string;
      background: string;
      style: string;
      keyChecks: string[];
    };

export type ResultPlan = {
  brief: string;
  mediaType: "image" | "video";
  shotPlan: "single" | "multicam" | "continuous" | "edit";
  shotCount: number;
  totalDuration: number;
  ratio: "16:9" | "9:16" | "1:1";
  outputCount: number;
  engineMode: ResultGenerationPrefs["engineMode"];
  headline: string;
  summary: string;
  target: string;
  route: string[];
  checkpoints: string[];
  scenes: Array<{ title: string; goal: string }>;
  structure?: ResultPlanStructure;
  routeReason?: string;
};

export type ResultPreview = {
  id: string;
  title: string;
  summary: string;
  status: "draft" | "refine" | "approved";
  hint: string;
  tone: string;
  mediaType?: "image" | "video";
  imageUrl?: string;
  videoUrl?: string;
  provider?: "comfyui" | "drawthings";
};

export type LocalRuntimeCard = {
  comfy: { state: "idle" | "checking" | "ready" | "fail"; label: string };
  draw: { state: "idle" | "checking" | "ready" | "handoff" | "fail"; label: string };
  drawPackReady: boolean;
  drawPackCount: number;
};

type Props = {
  lang: Lang;
  mode: ResultConsoleMode;
  onModeChange: (mode: ResultConsoleMode) => void;
  brief: string;
  onBriefChange: (value: string) => void;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  busy: boolean;
  freeQuota: number;
  freeUsed: number;
  plan: ResultPlan | null;
  previews: ResultPreview[];
  prefs: ResultGenerationPrefs;
  onPrefsChange: (next: ResultGenerationPrefs) => void;
  canGenerate: boolean;
  creditsBalance: number;
  onGenerate: () => void;
  onOpenUpgrade: () => void;
  onOpenCredits: () => void;
  onRefine: () => void;
  onApplyToPro: () => void;
  onOpenWizard: () => void;
  runtime: LocalRuntimeCard;
  onDownloadDrawPack: () => void;
  selectedPreviewId: string | null;
  onSelectPreview: (previewId: string | null) => void;
  ratings: Record<string, number>;
  onRatingChange: (previewId: string, score: number) => void;
  cardFeedbacks: Record<string, string>;
  onCardFeedbackChange: (previewId: string, text: string) => void;
  structureState: ResultStructureState;
  onStructureChange: (next: ResultStructureState) => void;
  intentPlan: IntentPlan | null;
  onIntentPlanReady?: (intentPlan: IntentPlan) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type MediaGroup = "mine" | "liked" | "downloads" | "trash";

type FirstLayerSelections = {
  image: {
    frameType: "auto" | "single_subject" | "multi_subject" | "environment" | "product_object";
    compositionFocus: "auto" | "subject_highlight" | "relation_expression" | "environment_wrap" | "product_showcase";
    styleGoal: "auto" | "cinematic" | "realistic" | "animation" | "commercial";
  };
  video: {
    shotStructure: "auto" | "single_shot" | "multicam" | "continuous" | "multi_scene";
    expressionFocus: "auto" | "character_action" | "relation_change" | "scene_progression" | "mood_atmosphere";
    styleGoal: "auto" | "cinematic" | "realistic" | "animation" | "advertising";
  };
};

type SecondLayerSelections = {
  image: ImageSecondarySelections;
  video: VideoSecondarySelections;
};

const QUICK_MEDIA_TYPE_KEY = "sp_quick_media_type";

const defaultFirstLayerSelections: FirstLayerSelections = {
  image: {
    frameType: "single_subject",
    compositionFocus: "subject_highlight",
    styleGoal: "cinematic"
  },
  video: {
    shotStructure: "single_shot",
    expressionFocus: "character_action",
    styleGoal: "cinematic"
  }
};

function imageCompositionFocusLabel(lang: Lang, value: FirstLayerSelections["image"]["compositionFocus"]) {
  const map: Record<FirstLayerSelections["image"]["compositionFocus"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    subject_highlight: t(lang, "主体突出", "Subject Highlight"),
    relation_expression: t(lang, "关系表达", "Relation Expression"),
    environment_wrap: t(lang, "环境包围", "Environment Wrap"),
    product_showcase: t(lang, "产品展示", "Product Showcase")
  };
  return map[value];
}

function imageStyleGoalLabel(lang: Lang, value: FirstLayerSelections["image"]["styleGoal"]) {
  const map: Record<FirstLayerSelections["image"]["styleGoal"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    cinematic: t(lang, "电影感", "Cinematic"),
    realistic: t(lang, "写实", "Realistic"),
    animation: t(lang, "动画", "Animation"),
    commercial: t(lang, "商业图", "Commercial Visual")
  };
  return map[value];
}

function videoExpressionFocusLabel(lang: Lang, value: FirstLayerSelections["video"]["expressionFocus"]) {
  const map: Record<FirstLayerSelections["video"]["expressionFocus"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    character_action: t(lang, "人物动作", "Character Action"),
    relation_change: t(lang, "关系变化", "Relation Change"),
    scene_progression: t(lang, "场景推进", "Scene Progression"),
    mood_atmosphere: t(lang, "情绪氛围", "Mood Atmosphere")
  };
  return map[value];
}

function videoStyleGoalLabel(lang: Lang, value: FirstLayerSelections["video"]["styleGoal"]) {
  const map: Record<FirstLayerSelections["video"]["styleGoal"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    cinematic: t(lang, "电影感", "Cinematic"),
    realistic: t(lang, "写实", "Realistic"),
    animation: t(lang, "动画", "Animation"),
    advertising: t(lang, "广告感", "Advertising")
  };
  return map[value];
}

function videoContinuityLabel(lang: Lang, value: VideoSecondarySelections["continuityFocus"]) {
  const map = {
    auto: t(lang, "不确定", "Not Sure"),
    identity: t(lang, "人物一致", "Identity consistency"),
    scene: t(lang, "场景一致", "Scene consistency"),
    lighting: t(lang, "光线一致", "Lighting consistency"),
    style: t(lang, "风格一致", "Style consistency")
  };
  return map[value];
}

function imageSubjectScaleLabel(lang: Lang, value: ImageSecondarySelections["subjectScale"]) {
  const map = {
    auto: t(lang, "不确定", "Not Sure"),
    tight: t(lang, "主体更满", "Fill Frame"),
    balanced: t(lang, "标准构图", "Balanced"),
    wide: t(lang, "留出环境", "More Environment"),
    detail: t(lang, "细节特写", "Detail Close-up")
  };
  return map[value];
}

function videoCameraMotionLabel(lang: Lang, value: VideoSecondarySelections["cameraMotion"]) {
  const map = {
    auto: t(lang, "不确定", "Not Sure"),
    static: t(lang, "稳机位", "Locked Camera"),
    follow: t(lang, "跟随主体", "Follow Subject"),
    push: t(lang, "缓慢推进", "Slow Push"),
    orbit: t(lang, "轻绕拍", "Light Orbit")
  };
  return map[value];
}

function videoSceneTransitionLabel(lang: Lang, value: VideoSecondarySelections["sceneTransition"]) {
  const map = {
    auto: t(lang, "不确定", "Not Sure"),
    same_space: t(lang, "同空间变化", "Same Space Shift"),
    indoor_outdoor: t(lang, "室内到室外", "Indoor to Outdoor"),
    location_switch: t(lang, "地点直接切换", "Location Switch"),
    time_jump: t(lang, "时间跳切", "Time Jump")
  };
  return map[value];
}

function videoShotGrammarLabel(lang: Lang, value: VideoSecondarySelections["shotGrammar"]) {
  const map = {
    auto: t(lang, "不确定", "Not Sure"),
    cut: t(lang, "切镜", "Cut"),
    reverse_angle: t(lang, "反打", "Reverse Angle"),
    over_shoulder: t(lang, "过肩", "Over Shoulder"),
    pov: t(lang, "主观视角", "POV"),
    insert_closeup: t(lang, "插入特写", "Insert Close-up"),
    establishing: t(lang, "建立镜头", "Establishing Shot")
  };
  return map[value];
}

function mediaTypeLabel(lang: Lang, value: "image" | "video") {
  return value === "image" ? t(lang, "图片", "Image") : t(lang, "视频", "Video");
}

function imageFrameTypeLabel(lang: Lang, value: FirstLayerSelections["image"]["frameType"]) {
  const map: Record<FirstLayerSelections["image"]["frameType"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    single_subject: t(lang, "单主体", "Single Subject"),
    multi_subject: t(lang, "多主体关系", "Multi Subject Relation"),
    environment: t(lang, "环境场景", "Environment Scene"),
    product_object: t(lang, "产品物件", "Product Object")
  };
  return map[value];
}

function videoShotStructureLabel(lang: Lang, value: FirstLayerSelections["video"]["shotStructure"]) {
  const map: Record<FirstLayerSelections["video"]["shotStructure"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    single_shot: t(lang, "单镜头", "Single Shot"),
    continuous: t(lang, "连续镜头", "Continuous"),
    multi_scene: t(lang, "多场景", "Multi Scene"),
    multicam: t(lang, "多机位", "Multicam")
  };
  return map[value];
}

function textVisualUnits(text: string) {
  return Array.from(text).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    const isWide =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xff01 && code <= 0xff60);
    return sum + (isWide ? 1.76 : 0.92);
  }, 0);
}

function selectWidthFromLabel(label: string, minPx: number, maxPx: number) {
  const px = Math.round(textVisualUnits(label) * 7.2 + 22);
  return Math.max(minPx, Math.min(maxPx, px));
}

function buildCanvasAutoTitle() {
  return "Untitled-001";
}

function structureSummaryText(
  lang: Lang,
  title: string,
  canvasDraft: CanvasDraft | null
) {
  if (!canvasDraft) return `${t(lang, "名称", "Name")}: ${title}`;
  const lines = [
    `${t(lang, "名称", "Name")}: ${title}`,
    `${t(lang, "第一步", "Step 1")}: ${canvasDraft.primaryBrief.trim() || "-"}`,
    `${t(lang, "第二步", "Step 2")}: ${canvasDraft.secondaryBrief.trim() || "-"}`
  ].filter(Boolean);
  if (canvasDraft.mediaType === "image") {
    lines.push(
      `${t(lang, "结构类型", "Structure")}: ${canvasDraft.structureType}`,
      `${t(lang, "场景类型", "Scene Type")}: ${canvasDraft.sceneType}`,
      `${t(lang, "构图重点", "Composition")}: ${canvasDraft.compositionFocus}`,
      `${t(lang, "背景复杂度", "Background")}: ${canvasDraft.backgroundDensity}`,
      `${t(lang, "关系表达", "Relation")}: ${canvasDraft.relationMode}`
    );
  } else {
    lines.push(
      `${t(lang, "镜头方式", "Shot Mode")}: ${canvasDraft.structureType}`,
      `${t(lang, "分镜数", "Shot Count")}: ${canvasDraft.shotCount}`,
      `${t(lang, "主场景", "Main Scene")}: ${canvasDraft.mainScene}`,
      `${t(lang, "连续性重点", "Continuity")}: ${canvasDraft.continuityFocus}`,
      ...canvasDraft.shots.map((shot) => `${shot.index}. ${shot.title} / ${shot.sceneLabel} / ${shot.transitionFromPrev}`)
    );
  }
  lines.push(...canvasDraft.compileHints);
  return lines.join("\n");
}

function generateQuickWorkspacePrompt(
  lang: Lang,
  canvasDraft: CanvasDraft | null,
  ratio: "16:9" | "9:16" | "1:1"
) {
  return generateQuickWorkspacePromptV3({ lang, draft: canvasDraft, ratio });
}

function normalizeImageSelections(
  imageStructure: ImageSecondaryStructure,
  selections: ImageSecondarySelections
): ImageSecondarySelections {
  const next: ImageSecondarySelections = { ...selections };
  if (next.subjectCount === "auto") next.subjectCount = imageStructure === "multi_subject" ? "2" : "1";
  if (next.compositionPosition === "auto") next.compositionPosition = "center";
  if (next.backgroundComplexity === "auto") next.backgroundComplexity = imageStructure === "environment" ? "strong_environment" : "normal";
  if (next.subjectScale === "auto") next.subjectScale = "balanced";
  if (imageStructure === "multi_subject") {
    if (next.subjectCount === "1") next.subjectCount = "2";
  } else {
    next.subjectCount = "1";
  }
  if (imageStructure === "environment" && next.backgroundComplexity === "clean") {
    next.backgroundComplexity = "strong_environment";
  }
  if (imageStructure === "product_object" && next.subjectScale === "wide") {
    next.subjectScale = "balanced";
  }
  return next;
}

function normalizeVideoSelections(
  videoStructure: VideoSecondaryStructure,
  selections: VideoSecondarySelections
): VideoSecondarySelections {
  const next: VideoSecondarySelections = { ...selections };
  if (next.shotCount === "auto") {
    next.shotCount = videoStructure === "single_shot" ? "1" : videoStructure === "multi_scene" ? "5" : "4";
  }
  if (next.mainScene === "auto") next.mainScene = videoStructure === "multi_scene" ? "multi_scene_switch" : "indoor";
  if (next.continuityFocus === "auto") next.continuityFocus = "identity";
  if (next.cameraMotion === "auto") next.cameraMotion = videoStructure === "continuous" ? "push" : "follow";
  if (next.sceneTransition === "auto") next.sceneTransition = videoStructure === "multi_scene" ? "location_switch" : "same_space";
  if (next.shotGrammar === "auto") next.shotGrammar = videoStructure === "multicam" ? "reverse_angle" : "cut";
  if (videoStructure === "single_shot") {
    next.shotCount = "1";
    if (next.mainScene === "multi_scene_switch") next.mainScene = "indoor";
    next.sceneTransition = "same_space";
  } else if (videoStructure === "multi_scene") {
    if (next.shotCount === "1") next.shotCount = "3";
    next.mainScene = "multi_scene_switch";
  } else {
    if (next.mainScene === "multi_scene_switch") next.mainScene = "complex";
    next.sceneTransition = "same_space";
    if (next.shotCount === "1") {
      next.shotCount = videoStructure === "multicam" ? "4" : "3";
    }
  }
  return next;
}

function imageBgDensity(value: ImageSecondarySelections["backgroundComplexity"]): "clean" | "normal" | "rich" | "strong_environment" {
  if (value === "clean") return "clean";
  if (value === "normal") return "normal";
  if (value === "strong_environment") return "strong_environment";
  return "rich";
}

const defaultSecondLayerSelections: SecondLayerSelections = {
  image: {
    subjectCount: "1",
    compositionPosition: "center",
    backgroundComplexity: "normal",
    subjectScale: "balanced"
  },
  video: {
    shotCount: "1",
    mainScene: "indoor",
    continuityFocus: "identity",
    cameraMotion: "follow",
    sceneTransition: "same_space",
    shotGrammar: "cut"
  }
};

export function ResultConsole(props: Props) {
  const {
    lang,
    mode,
    onModeChange,
    brief,
    onBriefChange,
    busy,
    prefs,
    onPrefsChange,
    canGenerate,
    creditsBalance,
    onGenerate,
    onOpenUpgrade,
    onOpenCredits,
    runtime,
    onDownloadDrawPack,
    previews,
    selectedPreviewId,
    onIntentPlanReady,
    onStructureChange,
    structureState
  } = props;

  const [group, setGroup] = useState<MediaGroup>("mine");
  const [mediaType, setMediaType] = useState<"image" | "video">(prefs.mediaType);
  const [firstInput, setFirstInput] = useState(brief);
  const [secondLayerVisible, setSecondLayerVisible] = useState(false);
  const [secondaryMounted, setSecondaryMounted] = useState(false);
  const [secondInput, setSecondInput] = useState("");
  const [firstLayerSelections, setFirstLayerSelections] = useState<FirstLayerSelections>(defaultFirstLayerSelections);
  const [secondLayerSelections, setSecondLayerSelections] = useState<SecondLayerSelections>(defaultSecondLayerSelections);
  const [stage, setStage] = useState<"input" | "draft" | "results">("input");
  const [structureDraft, setStructureDraft] = useState<StructureDraft | null>(null);
  const [canvasDraft, setCanvasDraft] = useState<CanvasDraft | null>(null);
  const [canvasTitleOverride, setCanvasTitleOverride] = useState("");
  const [canvasTitleDraft, setCanvasTitleDraft] = useState("");
  const [isCanvasTitleEditing, setIsCanvasTitleEditing] = useState(false);
  const [canvasMenuOpen, setCanvasMenuOpen] = useState(false);
  const [copyPromptDone, setCopyPromptDone] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState("");
  const [composerLiftBottom, setComposerLiftBottom] = useState(118);
  const mediaInitRef = useRef(false);
  const secondaryInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryRevealTimerRef = useRef<number | null>(null);
  const secondaryDockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mediaInitRef.current) return;
    mediaInitRef.current = true;
    try {
      const saved = localStorage.getItem(QUICK_MEDIA_TYPE_KEY);
      if (saved === "image" || saved === "video") {
        setMediaType(saved);
        if (saved !== prefs.mediaType) onPrefsChange({ ...prefs, mediaType: saved });
      }
    } catch {
      // ignore localStorage errors
    }
  }, [onPrefsChange, prefs]);

  useEffect(() => {
    if (secondLayerVisible || stage === "results") return;
    setFirstInput(brief);
  }, [brief, secondLayerVisible, stage]);

  useEffect(() => {
    setMediaType(prefs.mediaType);
  }, [prefs.mediaType]);

  useEffect(() => {
    if (!canvasDraft) return;
    if (canvasDraft.mediaType !== "image") {
      onStructureChange({
        ...structureState,
        subjectX: 0.5,
        subjectY: 0.5,
        subjectSize: 0.26,
        subjectLayer: 4,
        compositionFocus: "center"
      });
      onIntentPlanReady?.(canvasDraftToIntentPlan(canvasDraft, lang));
      return;
    }
    const target = canvasDraft.draggableNodes.find((node) => node.role === "primary") ?? canvasDraft.draggableNodes[0];
    if (!target) return;
    onStructureChange({
      ...structureState,
      subjectX: target.x / 100,
      subjectY: target.y / 100,
      subjectSize: target.w / 100,
      subjectLayer: target.layer,
      compositionFocus: target.x < 40 ? "left" : target.x > 60 ? "right" : "center"
    });
    onIntentPlanReady?.(canvasDraftToIntentPlan(canvasDraft, lang));
  }, [canvasDraft, lang, onIntentPlanReady, onStructureChange, structureState]);

  useEffect(() => {
    return () => {
      if (secondaryRevealTimerRef.current != null) {
        window.clearTimeout(secondaryRevealTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!secondaryMounted) return;
    window.requestAnimationFrame(() => {
      secondaryInputRef.current?.focus();
      const len = secondaryInputRef.current?.value.length ?? 0;
      secondaryInputRef.current?.setSelectionRange(len, len);
    });
  }, [secondaryMounted]);

  useLayoutEffect(() => {
    if (!secondLayerVisible || !secondaryMounted) return;
    const computeLift = () => {
      const dockHeight = secondaryDockRef.current?.offsetHeight ?? 0;
      const nextBottom = Math.max(106, 12 + dockHeight + 8);
      setComposerLiftBottom(Math.min(176, nextBottom));
    };
    computeLift();
    window.addEventListener("resize", computeLift);
    return () => window.removeEventListener("resize", computeLift);
  }, [secondLayerVisible, secondaryMounted, lang, mediaType, secondInput]);

  const activeImageStructure: ImageSecondaryStructure =
    firstLayerSelections.image.frameType === "auto" ? "single_subject" : firstLayerSelections.image.frameType;
  const activeVideoStructure: VideoSecondaryStructure =
    firstLayerSelections.video.shotStructure === "auto" ? "single_shot" : firstLayerSelections.video.shotStructure;
  const canvasAutoTitle = buildCanvasAutoTitle();
  const canvasTitle = canvasTitleOverride.trim() || canvasAutoTitle;
  const hasLocalDirect = runtime.comfy.state === "ready" || runtime.draw.state === "ready" || runtime.drawPackReady;
  const activePreview = previews.find((item) => item.id === selectedPreviewId) ?? previews[0] ?? null;
  const hasPreviewMedia = Boolean(activePreview?.imageUrl || activePreview?.videoUrl);
  const primaryPlaceholder = t(
    lang,
    mediaType === "video"
      ? "第一句：谁在什么场景，最终想看到什么结果（例：三人在地下室对峙，主角压迫感最强）"
      : "第一句：谁在什么场景，最终想看到什么画面（例：三个人在酒吧对峙，主角居中）",
    mediaType === "video"
      ? "Line 1: who + where + final result (e.g. three people confront in a basement, lead feels dominant)"
      : "Line 1: who + where + target frame (e.g. three people confront in a bar with lead centered)"
  );
  const secondaryPlaceholder = t(
    lang,
    mediaType === "video"
      ? "第二句：动作顺序 + 镜头变化 + 必须保持不变（例：先广角再反打到主角特写，身份和光线不变）"
      : activeImageStructure === "multi_subject"
        ? "第二句：补充关系与层次（例：两人左右对置，主角前景更近）"
        : "第二句：补充构图和限制（例：中景平视，背景不要杂乱）",
    mediaType === "video"
      ? "Line 2: action order + camera change + strict constraints (e.g. wide then reverse-angle close-up, keep identity and lighting stable)"
      : activeImageStructure === "multi_subject"
        ? "Line 2: relation and depth (e.g. two people split left/right with lead closer in foreground)"
        : "Line 2: framing and constraints (e.g. eye-level medium shot with cleaner background)"
  );
  const secondaryComposerVisible = secondLayerVisible;

  const canSubmitFirst = useMemo(() => {
    if (busy) return false;
    return Boolean(firstInput.trim());
  }, [busy, firstInput]);

  const canSubmitSecond = useMemo(() => {
    if (busy) return false;
    if (!secondLayerVisible) return false;
    if (!firstInput.trim()) return false;
    return Boolean(secondInput.trim());
  }, [busy, firstInput, secondInput, secondLayerVisible]);

  function handlePrimaryEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    if (secondLayerVisible) return;
    event.preventDefault();
    if (canSubmitFirst) confirmFirstLayer();
  }

  function handleSecondaryEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (canSubmitSecond) confirmSecondLayer();
  }

  async function handleCopyPrompt() {
    const payload = (editablePrompt || structureSummaryText(lang, canvasTitle, canvasDraft)).trim();
    try {
      await navigator.clipboard.writeText(payload);
      setCopyPromptDone(true);
      window.setTimeout(() => setCopyPromptDone(false), 1200);
    } catch {
      setCopyPromptDone(false);
    }
  }

  function handleDownloadStructure() {
    const payload = (editablePrompt || structureSummaryText(lang, canvasTitle, canvasDraft)).trim();
    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${canvasTitle.replace(/[\\/:*?"<>|]+/g, "_") || "prompt"}.txt`;
    a.click();
    URL.revokeObjectURL(href);
    setCanvasMenuOpen(false);
  }

  function handleDeleteStructure() {
    setStructureDraft(null);
    setCanvasDraft(null);
    setEditablePrompt("");
    setCanvasTitleOverride("");
    setCanvasMenuOpen(false);
    setStage(secondLayerVisible ? "draft" : "input");
  }

  function commitCanvasTitle(next: string) {
    setCanvasTitleOverride(next.trim() || "Untitled-001");
    setCanvasTitleDraft("");
    setIsCanvasTitleEditing(false);
    setCanvasMenuOpen(false);
  }

  function beginCanvasTitleEdit() {
    setCanvasTitleDraft(canvasTitle);
    setIsCanvasTitleEditing(true);
    setCanvasMenuOpen(true);
  }

  function clearPreviewToDraft() {
    setStructureDraft(null);
    setCanvasDraft(null);
    setEditablePrompt("");
    setCanvasMenuOpen(false);
    setCanvasTitleDraft("");
    setIsCanvasTitleEditing(false);
    setStage(secondLayerVisible ? "draft" : "input");
  }

  function applyMediaType(nextMediaType: "image" | "video") {
    const imageStructure = firstLayerSelections.image.frameType === "auto" ? "single_subject" : firstLayerSelections.image.frameType;
    const videoStructure = firstLayerSelections.video.shotStructure === "auto" ? "single_shot" : firstLayerSelections.video.shotStructure;
    setMediaType(nextMediaType);
    clearPreviewToDraft();
    setSecondLayerSelections((prev) => ({
      image: normalizeImageSelections(imageStructure, prev.image),
      video: normalizeVideoSelections(videoStructure, prev.video)
    }));
    onPrefsChange({ ...prefs, mediaType: nextMediaType });
    try {
      localStorage.setItem(QUICK_MEDIA_TYPE_KEY, nextMediaType);
    } catch {
      // ignore localStorage errors
    }
  }

  function onChangeFirstLayer2(value: string) {
    clearPreviewToDraft();
    if (mediaType === "image") {
      const nextStructure = value as FirstLayerSelections["image"]["frameType"];
      const normalizedStructure: ImageSecondaryStructure = nextStructure === "auto" ? "single_subject" : nextStructure;
      setFirstLayerSelections((prev) => ({
        ...prev,
        image: { ...prev.image, frameType: nextStructure }
      }));
      setSecondLayerSelections((prev) => ({
        ...prev,
        image: normalizeImageSelections(normalizedStructure, prev.image)
      }));
      return;
    }
    const nextStructure = value as FirstLayerSelections["video"]["shotStructure"];
    const normalizedStructure: VideoSecondaryStructure = nextStructure === "auto" ? "single_shot" : nextStructure;
    setFirstLayerSelections((prev) => ({
      ...prev,
      video: { ...prev.video, shotStructure: nextStructure }
    }));
    setSecondLayerSelections((prev) => ({
      ...prev,
      video: normalizeVideoSelections(normalizedStructure, prev.video)
    }));
  }

  function onChangeFirstLayer3(value: string) {
    clearPreviewToDraft();
    if (mediaType === "image") {
      setFirstLayerSelections((prev) => ({
        ...prev,
        image: { ...prev.image, compositionFocus: value as FirstLayerSelections["image"]["compositionFocus"] }
      }));
      return;
    }
    setFirstLayerSelections((prev) => ({
      ...prev,
      video: { ...prev.video, expressionFocus: value as FirstLayerSelections["video"]["expressionFocus"] }
    }));
  }

  function onChangeFirstLayer4(value: string) {
    clearPreviewToDraft();
    if (mediaType === "image") {
      setFirstLayerSelections((prev) => ({
        ...prev,
        image: { ...prev.image, styleGoal: value as FirstLayerSelections["image"]["styleGoal"] }
      }));
      return;
    }
    setFirstLayerSelections((prev) => ({
      ...prev,
      video: { ...prev.video, styleGoal: value as FirstLayerSelections["video"]["styleGoal"] }
    }));
  }

  function confirmFirstLayer() {
    const text = firstInput.trim();
    if (!text) return;
    onBriefChange(text);
    setSecondLayerVisible(true);
    setSecondaryMounted(false);
    if (secondaryRevealTimerRef.current != null) {
      window.clearTimeout(secondaryRevealTimerRef.current);
    }
    secondaryRevealTimerRef.current = window.setTimeout(() => {
      setSecondaryMounted(true);
    }, 220);
    setStage("draft");
  }

  function confirmSecondLayer() {
    if (!secondLayerVisible) return;
    const primaryText = firstInput.trim();
    const secondaryText = secondInput.trim();
    if (!primaryText || !secondaryText) return;

    const merged = `${primaryText}\n${secondaryText}`;
    const structureHint = mediaType === "image"
      ? firstLayerSelections.image.frameType === "auto" ? undefined : firstLayerSelections.image.frameType
      : firstLayerSelections.video.shotStructure === "auto" ? undefined : firstLayerSelections.video.shotStructure;

    let draft = generateStructureDraft({
      mediaType,
      structureHint,
      userInput: merged,
      lang
    });

    if (draft.mediaType === "image") {
      const effectiveImageStructure: ImageSecondaryStructure =
        firstLayerSelections.image.frameType === "auto" ? draft.structureType : firstLayerSelections.image.frameType;
      const effectiveCompositionFocus: Exclude<FirstLayerSelections["image"]["compositionFocus"], "auto"> =
        firstLayerSelections.image.compositionFocus === "auto"
          ? effectiveImageStructure === "environment"
            ? "environment_wrap"
            : effectiveImageStructure === "multi_subject"
              ? "relation_expression"
              : "subject_highlight"
          : firstLayerSelections.image.compositionFocus;
      const effectiveImageStyleGoal: Exclude<FirstLayerSelections["image"]["styleGoal"], "auto"> =
        firstLayerSelections.image.styleGoal === "auto" ? "cinematic" : firstLayerSelections.image.styleGoal;
      const imageSelections = normalizeImageSelections(effectiveImageStructure, secondLayerSelections.image);
      const imageSubjectScale: Exclude<ImageSecondarySelections["subjectScale"], "auto"> =
        imageSelections.subjectScale === "auto" ? "balanced" : imageSelections.subjectScale;
      const subjectCount = imageSelections.subjectCount === "1"
        ? 1
        : imageSelections.subjectCount === "2"
          ? 2
          : imageSelections.subjectCount === "3"
            ? 3
            : 4;
      const focusMode = effectiveCompositionFocus === "environment_wrap"
        ? "environment"
        : effectiveCompositionFocus === "relation_expression"
          ? "relation"
        : "subject";
      const framing = imageSelections.compositionPosition === "left"
        ? "left"
        : imageSelections.compositionPosition === "right"
          ? "right"
          : imageSelections.compositionPosition === "depth"
            ? "depth"
            : "center";
      const relationMode = imageSelections.compositionPosition === "depth"
        ? "front_back"
        : effectiveCompositionFocus === "relation_expression"
          ? "left_right"
          : effectiveCompositionFocus === "environment_wrap"
            ? "subject_environment"
            : subjectCount >= 2
              ? "eye_contact"
              : "solo";
      const sceneType = effectiveImageStructure === "product_object"
        ? "product_display"
        : /室内|房间|客厅|室内场景|indoor|room|interior/i.test(merged)
          ? "indoor"
          : /街|室外|森林|公园|街道|outdoor|street|forest|city/i.test(merged)
            ? "outdoor"
            : effectiveImageStructure === "environment"
              ? "complex"
              : "indoor";
      const focus = [
        draft.focus,
        `${t(lang, "主体占比", "subject scale")}: ${imageSubjectScaleLabel(lang, imageSubjectScale)}`,
        imageSelections.compositionPosition === "depth"
          ? t(lang, "构图位置: 强化前后景层次", "composition position: emphasize foreground/background depth")
          : `${t(lang, "构图位置", "composition position")}: ${imageSelections.compositionPosition === "left" ? t(lang, "偏左", "Left") : imageSelections.compositionPosition === "right" ? t(lang, "偏右", "Right") : t(lang, "居中", "Center")}`,
        `${t(lang, "构图重点", "composition focus")}: ${imageCompositionFocusLabel(lang, effectiveCompositionFocus)}`,
        `${t(lang, "风格目标", "style goal")}: ${imageStyleGoalLabel(lang, effectiveImageStyleGoal)}`
      ].join("; ");
      const spatialRelations = Array.from(new Set([
        ...draft.spatialRelations,
        imageSelections.compositionPosition === "depth"
          ? t(lang, "强调前后景层次", "emphasize depth separation")
          : `${t(lang, "构图位置", "composition position")}: ${imageSelections.compositionPosition}`,
        `${t(lang, "主体占比", "subject scale")}: ${imageSubjectScale}`
      ]));

      draft = {
        ...draft,
        primaryBrief: primaryText,
        secondaryBrief: secondaryText,
        structureType: effectiveImageStructure,
        sceneType,
        focus,
        relationMode,
        emphasis: `${imageCompositionFocusLabel(lang, effectiveCompositionFocus)} / ${imageSubjectScaleLabel(lang, imageSubjectScale)}`,
        compositionFocus: effectiveCompositionFocus,
        styleGoal: effectiveImageStyleGoal,
        subjectScale: imageSubjectScale,
        objects: draft.objects.map((item, index) => ({
          ...item,
          role: index === 0 ? "primary" : index === draft.objects.length - 1 && sceneType === "complex" ? "environment" : "secondary",
          depth: imageSelections.compositionPosition === "depth"
            ? index === 0
              ? "foreground"
              : index === draft.objects.length - 1
                ? "background"
                : "midground"
            : index === 0
              ? "midground"
              : "background"
        })),
        spatialRelations,
        composition: {
          ...draft.composition,
          subjectCount,
          focusMode,
          framing,
          backgroundDensity: imageSelections.backgroundComplexity === "strong_environment" ? "strong_environment" : imageBgDensity(imageSelections.backgroundComplexity)
        }
      };
    } else {
      const effectiveVideoStructure: VideoSecondaryStructure =
        firstLayerSelections.video.shotStructure === "auto" ? draft.structureType : firstLayerSelections.video.shotStructure;
      const effectiveExpressionFocus: Exclude<FirstLayerSelections["video"]["expressionFocus"], "auto"> =
        firstLayerSelections.video.expressionFocus === "auto"
          ? effectiveVideoStructure === "multi_scene"
            ? "scene_progression"
            : "character_action"
          : firstLayerSelections.video.expressionFocus;
      const effectiveVideoStyleGoal: Exclude<FirstLayerSelections["video"]["styleGoal"], "auto"> =
        firstLayerSelections.video.styleGoal === "auto" ? "cinematic" : firstLayerSelections.video.styleGoal;
      const videoSelections = normalizeVideoSelections(effectiveVideoStructure, secondLayerSelections.video);
      const videoContinuityFocus: Exclude<VideoSecondarySelections["continuityFocus"], "auto"> =
        videoSelections.continuityFocus === "auto" ? "identity" : videoSelections.continuityFocus;
      const videoCameraMotion: Exclude<VideoSecondarySelections["cameraMotion"], "auto"> =
        videoSelections.cameraMotion === "auto" ? "follow" : videoSelections.cameraMotion;
      const videoSceneTransition: Exclude<VideoSecondarySelections["sceneTransition"], "auto"> =
        videoSelections.sceneTransition === "auto" ? "same_space" : videoSelections.sceneTransition;
      const videoShotGrammar: Exclude<VideoSecondarySelections["shotGrammar"], "auto"> =
        videoSelections.shotGrammar === "auto" ? "cut" : videoSelections.shotGrammar;
      const normalizedShotCount: Exclude<VideoSecondarySelections["shotCount"], "auto"> =
        videoSelections.shotCount === "auto" ? "4" : videoSelections.shotCount;
      const shotCount = Number(normalizedShotCount) as 1 | 3 | 4 | 5;
      const continuity = Array.from(new Set([
        `${t(lang, "表达重点", "expression focus")}: ${videoExpressionFocusLabel(lang, effectiveExpressionFocus)}`,
        `${t(lang, "连续性重点", "continuity focus")}: ${videoContinuityLabel(lang, videoContinuityFocus)}`,
        `${t(lang, "风格目标", "style goal")}: ${videoStyleGoalLabel(lang, effectiveVideoStyleGoal)}`,
        `${t(lang, "镜头语法", "shot grammar")}: ${videoShotGrammarLabel(lang, videoShotGrammar)}`
      ]));
      if (effectiveVideoStructure === "single_shot") {
        continuity.push(`${t(lang, "镜头运动", "camera motion")}: ${videoCameraMotionLabel(lang, videoCameraMotion)}`);
      }
      if (effectiveVideoStructure === "multi_scene") {
        continuity.push(`${t(lang, "场景切换", "scene transition")}: ${videoSceneTransitionLabel(lang, videoSceneTransition)}`);
      }
      const sceneByType = effectiveVideoStructure === "multi_scene"
        ? `${t(lang, "多场景切换", "multi-scene switching")} / ${videoSceneTransitionLabel(lang, videoSceneTransition)}`
        : videoSelections.mainScene === "indoor"
          ? t(lang, "室内场景", "indoor scene")
          : videoSelections.mainScene === "outdoor"
            ? t(lang, "室外场景", "outdoor scene")
            : videoSelections.mainScene === "complex"
              ? t(lang, "复杂环境", "complex environment")
              : t(lang, "多场景切换", "multi-scene switching");
      const shots = Array.from({ length: shotCount }, (_, i) => ({
        index: i + 1,
        title: `${videoShotGrammarLabel(lang, videoShotGrammar)} / ${effectiveExpressionFocus === "character_action"
          ? `${lang === "zh" ? "动作推进" : "Action Beat"} ${i + 1}`
          : effectiveExpressionFocus === "relation_change"
            ? `${lang === "zh" ? "关系变化" : "Relation Shift"} ${i + 1}`
            : effectiveExpressionFocus === "scene_progression"
              ? `${lang === "zh" ? "场景推进" : "Scene Progression"} ${i + 1}`
              : `${lang === "zh" ? "情绪氛围" : "Mood Beat"} ${i + 1}`}`,
        durationSec: 4,
        id: `shot_${i + 1}`,
        sceneLabel: sceneByType,
        objectIds: draft.objects.map((item) => item.id),
        transitionFromPrev: (i === 0 ? "none" : effectiveVideoStructure === "multi_scene" ? videoSceneTransition : "same_space") as "none" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump",
        emphasis: `${videoExpressionFocusLabel(lang, effectiveExpressionFocus)} / ${videoShotGrammarLabel(lang, videoShotGrammar)}`
      }));
      if (effectiveVideoStructure === "single_shot") {
        shots[0] = {
          ...shots[0],
          index: 1,
          title: `${lang === "zh" ? "单镜头" : "Single Shot"} / ${videoCameraMotionLabel(lang, videoCameraMotion)}`,
          durationSec: 5,
          transitionFromPrev: "none"
        };
      }

      draft = {
        ...draft,
        primaryBrief: primaryText,
        secondaryBrief: secondaryText,
        structureType: effectiveVideoStructure,
        shotCount,
        shots,
        scene: sceneByType,
        continuity,
        mainScene: effectiveVideoStructure === "multi_scene" ? "multi_scene" : videoSelections.mainScene === "outdoor" ? "outdoor" : videoSelections.mainScene === "complex" ? "complex" : "indoor",
        continuityFocus: videoContinuityFocus,
        rhythm: effectiveVideoStructure === "continuous"
          ? "push"
          : effectiveVideoStructure === "multi_scene"
            ? "emotion"
            : effectiveExpressionFocus === "relation_change"
              ? "switch"
              : "stable",
        sceneTransitions: effectiveVideoStructure === "multi_scene" ? videoSceneTransition : "same_space",
        cameraMotion: videoCameraMotion,
        expressionFocus: effectiveExpressionFocus,
        styleGoal: effectiveVideoStyleGoal,
        objects: draft.objects.map((item, index) => ({
          ...item,
          role: index === 0 ? "primary" : "secondary",
          depth: "midground"
        }))
      };
    }

    const nextCanvasDraft = structureDraftToCanvas(draft, lang);

    setStructureDraft(draft);
    setCanvasDraft(nextCanvasDraft);
    setCanvasTitleOverride("");
    setCanvasMenuOpen(false);
    setIsCanvasTitleEditing(false);
    setEditablePrompt(generateQuickWorkspacePrompt(lang, nextCanvasDraft, prefs.ratio));
    onBriefChange(merged);
    onIntentPlanReady?.(canvasDraftToIntentPlan(nextCanvasDraft, lang));
    setStage("results");
  }

  const firstLayer2Label = mediaType === "image" ? t(lang, "画面类型", "Frame Type") : t(lang, "镜头方式", "Shot Mode");
  const firstLayer3Label = mediaType === "image" ? t(lang, "构图重点", "Composition Focus") : t(lang, "表达重点", "Expression Focus");
  const firstLayer4Label = mediaType === "image" ? t(lang, "风格目标", "Style Goal") : t(lang, "风格目标", "Style Goal");

  const firstLayer2Value = mediaType === "image" ? firstLayerSelections.image.frameType : firstLayerSelections.video.shotStructure;
  const firstLayer3Value = mediaType === "image" ? firstLayerSelections.image.compositionFocus : firstLayerSelections.video.expressionFocus;
  const firstLayer4Value = mediaType === "image" ? firstLayerSelections.image.styleGoal : firstLayerSelections.video.styleGoal;
  const mediaTypeValueLabel = mediaTypeLabel(lang, mediaType);
  const firstLayer2ValueLabel = mediaType === "image"
    ? imageFrameTypeLabel(lang, firstLayerSelections.image.frameType)
    : videoShotStructureLabel(lang, firstLayerSelections.video.shotStructure);
  const firstLayer3ValueLabel = mediaType === "image"
    ? imageCompositionFocusLabel(lang, firstLayerSelections.image.compositionFocus)
    : videoExpressionFocusLabel(lang, firstLayerSelections.video.expressionFocus);
  const firstLayer4ValueLabel = mediaType === "image"
    ? imageStyleGoalLabel(lang, firstLayerSelections.image.styleGoal)
    : videoStyleGoalLabel(lang, firstLayerSelections.video.styleGoal);
  const primarySelectWidths = lang === "zh"
    ? {
        mediaType: selectWidthFromLabel(mediaTypeValueLabel, 66, 96),
        layer2: selectWidthFromLabel(firstLayer2ValueLabel, 102, 178),
        layer3: selectWidthFromLabel(firstLayer3ValueLabel, 102, 182),
        layer4: selectWidthFromLabel(firstLayer4ValueLabel, 96, 166)
      }
    : {
        mediaType: selectWidthFromLabel(mediaTypeValueLabel, 76, 112),
        layer2: selectWidthFromLabel(firstLayer2ValueLabel, 120, 224),
        layer3: selectWidthFromLabel(firstLayer3ValueLabel, 126, 238),
        layer4: selectWidthFromLabel(firstLayer4ValueLabel, 114, 206)
      };
  return (
    <div style={styles.root} data-testid="media-studio-root">
      <div style={styles.frame}>
        <aside style={styles.left}>
          <div style={styles.panelTitle}>{t(lang, "快捷工作台", "Quick Workspace")}</div>
          <button style={{ ...styles.navBtn, ...(group === "mine" ? styles.navOn : null) }} onClick={() => setGroup("mine")} data-testid="media-nav-mine">
            <span style={styles.navLabel}><Layers3 size={14} style={styles.navIcon} />{t(lang, "我的", "Mine")}</span>
          </button>
          <button style={{ ...styles.navBtn, ...(group === "liked" ? styles.navOn : null) }} onClick={() => setGroup("liked")} data-testid="media-nav-liked">
            <span style={styles.navLabel}><Heart size={14} style={styles.navIcon} />{t(lang, "喜欢的", "Liked")}</span>
          </button>
          <button style={{ ...styles.navBtn, ...(group === "downloads" ? styles.navOn : null) }} onClick={() => setGroup("downloads")} data-testid="media-nav-downloads">
            <span style={styles.navLabel}><Download size={14} style={styles.navIcon} />{t(lang, "下载", "Downloads")}</span>
          </button>
          <button style={{ ...styles.navBtn, ...(group === "trash" ? styles.navOn : null) }} onClick={() => setGroup("trash")} data-testid="media-nav-trash">
            <span style={styles.navLabel}><Trash2 size={14} style={styles.navIcon} />{t(lang, "删除", "Trash")}</span>
          </button>
          <button
            style={{ ...styles.proBtn, ...(mode === "pro" ? styles.navOn : null) }}
            type="button"
            onClick={() => onModeChange("pro")}
            data-testid="media-nav-pro"
          >
            <span style={styles.navLabel}><Sparkles size={14} style={styles.navIcon} />{t(lang, "Pro 模式", "Pro Mode")}</span>
          </button>
        </aside>

        <main style={styles.main}>
          {!structureDraft ? <QuickWorkspaceIntro lang={lang} /> : null}
          {structureDraft && !hasPreviewMedia ? <QuickWorkspaceIntro lang={lang} mode="compact" /> : null}
          <div
            style={{
              ...styles.mainContent,
              ...(structureDraft ? styles.mainContentWithCanvas : styles.mainContentSingle),
              ...(structureDraft ? { paddingBottom: secondaryComposerVisible ? 228 : 104 } : null)
            }}
          >
            <section style={styles.mainLeft}>
              {structureDraft ? (
                <div style={{ ...styles.previewPane, ...styles.previewPaneRaised }} data-testid="quick-preview-pane">
                  {activePreview?.imageUrl ? (
                    <img
                      src={activePreview.imageUrl}
                      alt={activePreview.title || "preview"}
                      style={styles.previewImage}
                      data-testid="quick-preview-image"
                    />
                  ) : null}
                </div>
              ) : null}
            </section>

            {canvasDraft ? (
              <div style={styles.rightStage}>
                <aside style={{ ...styles.rightCanvas, ...styles.rightCanvasRaised }} data-testid="quick-structure-canvas">
                  <div style={styles.canvasReady} data-testid="quick-structure-canvas-ready">
                    <div style={styles.canvasSurface}>
                      <div style={styles.canvasTopBar}>
                        <div style={styles.canvasTitleWrap}>
                          <div style={styles.canvasTitle} data-testid="quick-canvas-title">
                            {canvasTitle}
                          </div>
                        </div>
                        <div style={styles.canvasMenuWrap}>
                          <button
                            type="button"
                            style={styles.canvasMenuBtn}
                            data-testid="quick-canvas-menu-trigger"
                            aria-label={t(lang, "更多操作", "More actions")}
                            onClick={() => setCanvasMenuOpen((v) => !v)}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {canvasMenuOpen ? (
                            <div style={styles.canvasMenu} data-testid="quick-canvas-menu">
                              {isCanvasTitleEditing ? (
                                <div style={styles.canvasMenuEditor}>
                                  <div style={styles.canvasMenuEditorLabel}>{t(lang, "改名", "Rename")}</div>
                                  <input
                                    autoFocus
                                    value={canvasTitleDraft}
                                    onChange={(e) => setCanvasTitleDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") commitCanvasTitle(canvasTitleDraft);
                                      if (e.key === "Escape") {
                                        setCanvasTitleDraft("");
                                        setIsCanvasTitleEditing(false);
                                      }
                                    }}
                                    style={styles.canvasTitleInput}
                                    data-testid="quick-canvas-title-input"
                                  />
                                  <div style={styles.canvasMenuEditorActions}>
                                    <button
                                      type="button"
                                      style={styles.canvasMenuEditorBtn}
                                      onClick={() => commitCanvasTitle(canvasTitleDraft)}
                                    >
                                      {t(lang, "保存", "Save")}
                                    </button>
                                    <button
                                      type="button"
                                      style={{ ...styles.canvasMenuEditorBtn, ...styles.canvasMenuEditorBtnGhost }}
                                      onClick={() => {
                                        setCanvasTitleDraft("");
                                        setIsCanvasTitleEditing(false);
                                      }}
                                    >
                                      {t(lang, "取消", "Cancel")}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  style={styles.canvasMenuItem}
                                  onClick={beginCanvasTitleEdit}
                                >
                                  {t(lang, "改名", "Rename")}
                                </button>
                              )}
                              <button type="button" style={styles.canvasMenuItem} onClick={handleDownloadStructure}>
                                {t(lang, "下载", "Download")}
                              </button>
                              <button type="button" style={{ ...styles.canvasMenuItem, ...styles.canvasMenuDanger }} onClick={handleDeleteStructure}>
                                {t(lang, "删除", "Delete")}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div style={styles.promptPanel} data-testid="quick-prompt-panel">
                        <div style={styles.promptPanelTitle}>
                          {t(lang, "结构化提示词（可编辑）", "Structured Prompt (Editable)")}
                        </div>
                        <textarea
                          value={editablePrompt}
                          onChange={(e) => setEditablePrompt(e.target.value)}
                          style={styles.promptEditor}
                          data-testid="quick-canvas-prompt-editor"
                        />
                      </div>
                    </div>
                  </div>
                </aside>
                <div style={styles.canvasActionBar} data-testid="quick-canvas-actions">
                  <label style={styles.canvasActionSelectWrap}>
                    <span style={styles.canvasActionLabel}>{t(lang, "尺寸", "Size")}</span>
                    <select
                      value={prefs.ratio}
                      onChange={(e) => onPrefsChange({ ...prefs, ratio: e.target.value as ResultGenerationPrefs["ratio"] })}
                      style={styles.canvasActionSelect}
                      data-testid="quick-canvas-ratio"
                    >
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                      <option value="1:1">1:1</option>
                    </select>
                  </label>
                  <button type="button" style={styles.canvasActionBtn} onClick={() => void handleCopyPrompt()} data-testid="quick-canvas-copy">
                    {copyPromptDone ? t(lang, "已复制", "Copied") : t(lang, "复制提示词", "Copy Prompt")}
                  </button>
                  {canGenerate ? (
                    <>
                      <div style={styles.canvasCreditsMeta} data-testid="quick-canvas-credits-balance">
                        Credits: {creditsBalance}
                      </div>
                      <button type="button" style={styles.canvasActionPrimary} onClick={onGenerate} disabled={busy} data-testid="quick-canvas-generate">
                        {busy ? t(lang, "生成中…", "Generating...") : "Generate Preview"}
                      </button>
                      <button type="button" style={styles.canvasActionBtn} onClick={onOpenCredits} data-testid="quick-canvas-buy-credits">
                        Buy credits
                      </button>
                      {hasLocalDirect ? (
                        <button type="button" style={styles.canvasActionBtn} onClick={onDownloadDrawPack} data-testid="quick-canvas-local">
                          {t(lang, "本地直出", "Local Output")}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button type="button" style={styles.canvasActionPrimary} onClick={onOpenUpgrade} data-testid="quick-canvas-upgrade">
                      Upgrade for AI generation
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <div style={{ ...styles.composerWrap, ...(secondLayerVisible ? { bottom: composerLiftBottom } : null) }}>
        <div style={styles.composerGlass}>
          <div style={styles.composerTop}>
            <input
              value={firstInput}
              onChange={(e) => {
                const next = e.target.value;
                setFirstInput(next);
                onBriefChange(next);
                if (structureDraft) clearPreviewToDraft();
              }}
              onKeyDown={handlePrimaryEnter}
              placeholder={primaryPlaceholder}
              style={styles.promptInline}
              data-testid="result-console-brief"
            />
            {!secondLayerVisible ? (
              <button
                style={{ ...styles.sendCircle, ...(canSubmitFirst ? null : styles.sendDisabled) }}
                onClick={confirmFirstLayer}
                disabled={!canSubmitFirst}
                data-testid="result-console-generate"
                aria-label={t(lang, "继续", "Continue")}
              >
                <ArrowUp size={16} />
              </button>
            ) : null}
          </div>

          <div style={styles.composerOpts} data-testid="quick-primary-dropdowns">
            <label style={styles.selectWrap}>
              <span style={styles.selectLabel}>{t(lang, "类型", "Type")}</span>
              <select
                data-testid="composer-media-type"
                style={{ ...styles.optSelect, width: `${primarySelectWidths.mediaType}px` }}
                value={mediaType}
                onChange={(e) => applyMediaType(e.target.value as "image" | "video")}
              >
                <option value="image">{t(lang, "图片", "Image")}</option>
                <option value="video">{t(lang, "视频", "Video")}</option>
              </select>
            </label>

            <label style={styles.selectWrap}>
              <span style={styles.selectLabel}>{firstLayer2Label}</span>
              <select data-testid="composer-primary-2" style={{ ...styles.optSelect, width: `${primarySelectWidths.layer2}px` }} value={firstLayer2Value} onChange={(e) => onChangeFirstLayer2(e.target.value)}>
                {mediaType === "image" ? (
                  <>
                    <option value="single_subject">{t(lang, "单主体", "Single Subject")}</option>
                    <option value="multi_subject">{t(lang, "多主体关系", "Multi Subject Relation")}</option>
                    <option value="environment">{t(lang, "环境场景", "Environment Scene")}</option>
                    <option value="product_object">{t(lang, "产品物件", "Product Object")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                ) : (
                  <>
                    <option value="single_shot">{t(lang, "单镜头", "Single Shot")}</option>
                    <option value="continuous">{t(lang, "连续镜头", "Continuous")}</option>
                    <option value="multi_scene">{t(lang, "多场景", "Multi Scene")}</option>
                    <option value="multicam">{t(lang, "多机位", "Multicam")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                )}
              </select>
            </label>

            <label style={styles.selectWrap}>
              <span style={styles.selectLabel}>{firstLayer3Label}</span>
              <select data-testid="composer-primary-3" style={{ ...styles.optSelect, width: `${primarySelectWidths.layer3}px` }} value={firstLayer3Value} onChange={(e) => onChangeFirstLayer3(e.target.value)}>
                {mediaType === "image" ? (
                  <>
                    <option value="subject_highlight">{t(lang, "主体突出", "Subject Highlight")}</option>
                    <option value="relation_expression">{t(lang, "关系表达", "Relation Expression")}</option>
                    <option value="environment_wrap">{t(lang, "环境包围", "Environment Wrap")}</option>
                    <option value="product_showcase">{t(lang, "产品展示", "Product Showcase")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                ) : (
                  <>
                    <option value="character_action">{t(lang, "人物动作", "Character Action")}</option>
                    <option value="relation_change">{t(lang, "关系变化", "Relation Change")}</option>
                    <option value="scene_progression">{t(lang, "场景推进", "Scene Progression")}</option>
                    <option value="mood_atmosphere">{t(lang, "情绪氛围", "Mood Atmosphere")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                )}
              </select>
            </label>

            <label style={styles.selectWrap}>
              <span style={styles.selectLabel}>{firstLayer4Label}</span>
              <select data-testid="composer-primary-4" style={{ ...styles.optSelect, width: `${primarySelectWidths.layer4}px` }} value={firstLayer4Value} onChange={(e) => onChangeFirstLayer4(e.target.value)}>
                {mediaType === "image" ? (
                  <>
                    <option value="cinematic">{t(lang, "电影感", "Cinematic")}</option>
                    <option value="realistic">{t(lang, "写实", "Realistic")}</option>
                    <option value="animation">{t(lang, "动画", "Animation")}</option>
                    <option value="commercial">{t(lang, "商业图", "Commercial Visual")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                ) : (
                  <>
                    <option value="cinematic">{t(lang, "电影感", "Cinematic")}</option>
                    <option value="realistic">{t(lang, "写实", "Realistic")}</option>
                    <option value="animation">{t(lang, "动画", "Animation")}</option>
                    <option value="advertising">{t(lang, "广告感", "Advertising")}</option>
                    <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
                  </>
                )}
              </select>
            </label>
          </div>
        </div>
      </div>
      {secondaryComposerVisible && secondaryMounted ? (
        <div ref={secondaryDockRef} style={styles.secondaryDock}>
          <div style={styles.secondaryGlass}>
            <div style={styles.composerTop}>
              <input
                ref={secondaryInputRef}
                value={secondInput}
                onChange={(e) => {
                  setSecondInput(e.target.value);
                  if (structureDraft) clearPreviewToDraft();
                }}
                onKeyDown={handleSecondaryEnter}
                placeholder={secondaryPlaceholder}
                style={styles.promptInline}
                data-testid="result-console-brief-secondary"
              />
              <button
                style={{ ...styles.sendCircle, ...(canSubmitSecond ? null : styles.sendDisabled) }}
                onClick={confirmSecondLayer}
                disabled={!canSubmitSecond}
                data-testid="result-console-generate-secondary"
                aria-label={t(lang, "确认", "Confirm")}
              >
                <ArrowUp size={16} />
              </button>
            </div>
            <QuickWorkspaceSecondaryCards
              lang={lang}
              mediaType={mediaType}
              imageStructure={activeImageStructure}
              videoStructure={activeVideoStructure}
              imageSelections={secondLayerSelections.image}
              onImageSelectionsChange={(next) => setSecondLayerSelections((prev) => ({
                ...prev,
                image: normalizeImageSelections(activeImageStructure, next)
              }))}
              videoSelections={secondLayerSelections.video}
              onVideoSelectionsChange={(next) => setSecondLayerSelections((prev) => ({
                ...prev,
                video: normalizeVideoSelections(activeVideoStructure, next)
              }))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "minmax(0,1fr)",
    gap: 12,
    padding: "18px 18px 132px",
    color: "#ffffff",
    background: "#050505",
    overflow: "hidden"
  },
  frame: {
    minHeight: 0,
    height: "100%",
    display: "grid",
    gridTemplateColumns: "188px minmax(0,1fr)",
    gap: 12
  },
  left: {
    borderRadius: 14,
    border: "none",
    background: "#000000",
    padding: 12,
    display: "grid",
    gap: 9,
    alignContent: "start"
  },
  panelTitle: { fontSize: 14, fontWeight: 720, color: "rgba(255,255,255,0.92)", marginBottom: 2, letterSpacing: 0.12 },
  navLabel: { display: "inline-flex", alignItems: "center", gap: 8 },
  navIcon: { opacity: 0.9 },
  navBtn: {
    minHeight: 38,
    borderRadius: 10,
    border: "none",
    background: "#000000",
    color: "rgba(255,255,255,0.9)",
    textAlign: "left",
    padding: "0 10px",
    fontSize: 13,
    fontWeight: 620,
    cursor: "pointer"
  },
  navOn: { color: "#ffffff", fontWeight: 700, border: "none", background: "rgba(255,255,255,0.08)" },
  proBtn: {
    marginTop: 0,
    minHeight: 38,
    borderRadius: 10,
    border: "none",
    background: "#000000",
    color: "#ffffff",
    fontWeight: 620,
    cursor: "pointer",
    textAlign: "left",
    padding: "0 10px"
  },
  main: {
    minHeight: 0,
    display: "grid",
    gridTemplateRows: "auto minmax(0,1fr)",
    alignContent: "stretch",
    gap: 10,
    width: "min(1020px, 94vw)",
    justifySelf: "center",
    paddingTop: 10
  },
  mainContent: {
    display: "grid",
    gap: 12,
    alignItems: "stretch",
    minHeight: 0
  },
  mainContentSingle: {
    gridTemplateColumns: "minmax(0,1fr)"
  },
  mainContentWithCanvas: {
    gridTemplateColumns: "minmax(0,1fr) minmax(420px, 48%)",
    height: "100%",
    minHeight: 0,
    alignItems: "start",
    paddingBottom: 34
  },
  mainLeft: {
    display: "grid",
    gap: 8,
    minHeight: 0
  },
  previewPane: {
    minHeight: 560,
    height: "100%",
    overflow: "hidden",
    animation: "spxFadeUpIn 420ms ease both"
  },
  previewPaneRaised: {
    marginTop: -52,
    height: "calc(100% + 52px)"
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  rightStage: {
    display: "grid",
    gap: 8,
    minHeight: 0,
    animation: "spxFadeUpIn 420ms ease both"
  },
  rightCanvas: {
    borderRadius: 0,
    border: "none",
    background: "transparent",
    minHeight: 0,
    padding: 0,
    display: "grid",
    alignContent: "start",
    gap: 10
  },
  rightCanvasRaised: {
    marginTop: -46,
    height: "calc(100% + 46px)"
  },
  canvasReady: {
    display: "grid",
    gap: 8
  },
  canvasSurface: {
    position: "relative",
    display: "grid"
  },
  promptPanel: {
    height: 420,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(8,8,8,0.96), rgba(0,0,0,0.98))",
    padding: "40px 12px 12px",
    display: "grid",
    gridTemplateRows: "auto minmax(0,1fr)",
    gap: 8
  },
  promptPanelTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.86)"
  },
  promptEditor: {
    width: "100%",
    height: "100%",
    minHeight: 0,
    resize: "none",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 1.55,
    outline: "none",
    padding: "10px 12px",
    overflowY: "auto"
  },
  canvasIdle: {
    display: "grid",
    gap: 8
  },
  canvasTopBar: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 28,
    gap: 6
  },
  canvasTitleWrap: {
    minWidth: 0,
    display: "grid",
    justifyItems: "end"
  },
  canvasTitle: {
    fontSize: 11,
    lineHeight: 1.2,
    fontWeight: 620,
    color: "rgba(255,255,255,0.72)"
  },
  canvasTitleInput: {
    minHeight: 30,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(8,8,8,0.78)",
    color: "#ffffff",
    fontSize: 13,
    outline: "none",
    padding: "0 10px",
    width: 170
  },
  canvasMenuWrap: {
    position: "relative"
  },
  canvasMenuBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0
  },
  canvasMenu: {
    position: "absolute",
    top: 34,
    right: 0,
    minWidth: 132,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(9,9,9,0.96)",
    boxShadow: "0 16px 30px rgba(0,0,0,0.34)",
    padding: 6,
    display: "grid",
    gap: 4,
    zIndex: 12
  },
  canvasMenuEditor: {
    display: "grid",
    gap: 8,
    padding: 6
  },
  canvasMenuEditorLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.56)",
    fontWeight: 700
  },
  canvasMenuEditorActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 6
  },
  canvasMenuEditorBtn: {
    minHeight: 28,
    borderRadius: 8,
    border: "none",
    background: "rgba(255,255,255,0.12)",
    color: "#ffffff",
    padding: "0 10px",
    cursor: "pointer",
    fontSize: 12
  },
  canvasMenuEditorBtnGhost: {
    background: "transparent",
    color: "rgba(255,255,255,0.72)"
  },
  canvasMenuItem: {
    minHeight: 32,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 12,
    textAlign: "left",
    padding: "0 10px",
    cursor: "pointer"
  },
  canvasMenuDanger: {
    color: "#ffb0b0"
  },
  canvasTagRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6
  },
  canvasTagPrimary: {
    minHeight: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 650,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center"
  },
  canvasTagSecondary: {
    minHeight: 26,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: 600,
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center"
  },
  canvasBoard: {
    position: "relative",
    height: 420,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "linear-gradient(180deg, rgba(8,8,8,0.96), rgba(0,0,0,0.98))",
    overflow: "hidden"
  },
  canvasEmptyState: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    textAlign: "center",
    padding: "0 48px",
    gap: 10
  },
  canvasEmptyTitle: {
    fontSize: 18,
    lineHeight: 1.3,
    fontWeight: 760,
    color: "#ffffff"
  },
  canvasEmptySub: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.66)"
  },
  canvasObj: {
    position: "absolute",
    minHeight: 26,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(154,174,220,0.2)",
    color: "#ffffff",
    fontSize: 11,
    padding: "4px 8px",
    maxWidth: "38%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  canvasMeta: {
    display: "grid",
    gap: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.78)"
  },
  canvasShotTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff"
  },
  canvasShotList: {
    display: "grid",
    gap: 6
  },
  canvasShotItem: {
    display: "grid",
    gridTemplateColumns: "28px minmax(0,1fr)",
    gap: 6,
    alignItems: "center",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    fontSize: 12
  },
  canvasShotIdx: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700
  },
  canvasEditor: {
    marginTop: 2,
    borderRadius: 0,
    border: "none",
    background: "transparent",
    padding: 0,
    display: "grid",
    gap: 8
  },
  canvasEditorTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff"
  },
  canvasEditorRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  canvasEditorControl: {
    display: "grid",
    gap: 4
  },
  canvasEditorLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.68)"
  },
  canvasEditorValue: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: 640
  },
  canvasEditorEmpty: {
    fontSize: 12,
    color: "rgba(255,255,255,0.64)"
  },
  canvasSlider: {
    width: "100%"
  },
  canvasSelect: {
    minHeight: 28,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: 12,
    outline: "none",
    padding: "0 8px"
  },
  canvasActionBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    borderRadius: 0,
    border: "none",
    background: "transparent",
    padding: 0
  },
  canvasActionSelectWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    minHeight: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    padding: "0 10px"
  },
  canvasActionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.56)"
  },
  canvasActionSelect: {
    minHeight: 24,
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 12,
    outline: "none",
    cursor: "pointer"
  },
  canvasActionBtn: {
    minHeight: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 650,
    padding: "0 14px",
    cursor: "pointer"
  },
  canvasCreditsMeta: {
    minHeight: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center"
  },
  canvasActionPrimary: {
    minHeight: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "#ffffff",
    color: "#111111",
    fontSize: 12,
    fontWeight: 760,
    padding: "0 14px",
    cursor: "pointer"
  },
  composerWrap: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 12,
    zIndex: 140,
    display: "flex",
    justifyContent: "center",
    width: "min(760px, 76vw)",
    pointerEvents: "none",
    transition: "bottom 240ms ease, width 240ms ease"
  },
  secondaryDock: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 12,
    width: "min(760px, 76vw)",
    zIndex: 160,
    pointerEvents: "auto"
  },
  secondaryGlass: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06) 42%, rgba(0,0,0,0.18) 100%)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
    backdropFilter: "blur(24px) saturate(135%)",
    WebkitBackdropFilter: "blur(24px) saturate(135%)",
    padding: "4px 8px 5px",
    display: "grid",
    gap: 6
  },
  composerGlass: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06) 42%, rgba(0,0,0,0.18) 100%)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
    backdropFilter: "blur(24px) saturate(135%)",
    WebkitBackdropFilter: "blur(24px) saturate(135%)",
    padding: "4px 8px 5px",
    display: "grid",
    gap: 6,
    pointerEvents: "auto"
  },
  stepHint: {
    margin: 0,
    fontSize: 12,
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.72)",
    fontWeight: 560,
    padding: "0 2px"
  },
  composerTop: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 34px",
    alignItems: "center",
    gap: 5,
    color: "#ffffff",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(120deg, rgba(24,24,24,0.72), rgba(10,10,10,0.84) 45%, rgba(0,0,0,0.9) 100%)",
    backdropFilter: "blur(28px) saturate(128%)",
    WebkitBackdropFilter: "blur(28px) saturate(128%)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.4)",
    minHeight: 32,
    padding: "1px 10px"
  },
  composerTopSingle: {
    gridTemplateColumns: "minmax(0,1fr)"
  },
  promptInline: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 1.24,
    outline: "none",
    padding: "0 2px 0 12px",
    fontWeight: 560
  },
  sendCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.16)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  },
  sendDisabled: {
    opacity: 0.45,
    cursor: "not-allowed"
  },
  composerOpts: { display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  selectWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    minHeight: 25,
    width: "fit-content",
    flex: "0 0 auto",
    whiteSpace: "nowrap",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "#000000",
    padding: "0 7px",
    color: "rgba(255,255,255,0.9)"
  },
  selectLabel: { fontSize: 10, lineHeight: 1.14, color: "rgba(255,255,255,0.62)", letterSpacing: 0.08 },
  optSelect: {
    minHeight: 18,
    minWidth: 0,
    maxWidth: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 1.24,
    outline: "none",
    cursor: "pointer",
    padding: "0 6px 0 2px",
    textOverflow: "clip",
    flex: "0 0 auto"
  }
};
