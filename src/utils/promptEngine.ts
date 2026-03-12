import type { Lang } from "../i18n";
import type { Project, Scene } from "../model";
import { resolveSceneConfig } from "../model";
import type { PlatformPresetId } from "../config/platformPresets";
import type { PromptProfile } from "./prompt";
import { runPromptPipeline, type PromptPipelineInput, type PromptPipelineOutput } from "./promptPipeline";
import type { PromptEngineId, PromptWorkspace } from "../types/export";

const GEN_MARK = "genmode:";

type PromptSectionSet = {
  scene: string[];
  layout: string[];
  subjects: string[];
  camera: string[];
  motion: string[];
  negative: string[];
  constraints: string[];
  extras: string[];
};

type EngineTransform = {
  finalPrompt: string;
  strippedVideoScaffoldForImage: boolean;
  compactedForEngine: boolean;
  enginePasses: string[];
};

type PromptEngineRoute = "quick_image" | "quick_video" | "pro_image" | "pro_video";

function splitMachineNotes(allText: string): { main: string; notes: string } {
  const text = allText ?? "";
  const lines = text.split("\n");

  const isMarker = (line: string) => {
    const t = (line ?? "").trim();
    if (!t) return false;
    const low = t.toLowerCase();
    return (
      t.includes("以下为机器语言") ||
      t.startsWith("（以下为机器语言") ||
      t.includes("系统结构控制层") ||
      t.includes("系统追加结构控制层") ||
      low.includes("machine notes") ||
      low.includes("system structural control layer")
    );
  };

  const idx = lines.findIndex((line) => isMarker(line));
  if (idx < 0) return { main: text.trimEnd(), notes: "" };
  return {
    main: lines.slice(0, idx).join("\n").trimEnd(),
    notes: lines.slice(idx).join("\n").trimEnd()
  };
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function isSceneLine(line: string): boolean {
  return /^Scene:/i.test(line) || /^#\s*(Scene|Shot)\b/i.test(line) || /^分镜\b/.test(line);
}

function isGenerationConstraintLine(line: string): boolean {
  return /^Generation constraints:/i.test(line) || /^生成约束[:：]?/.test(line);
}

function isCameraHeading(line: string): boolean {
  return /^Camera Contract:/i.test(line) || /^Camera:/i.test(line) || /^镜头[:：]/.test(line);
}

function isLayoutHeading(line: string): boolean {
  return /^Layout Contract/i.test(line) || /^Layout:/i.test(line) || /^布局[:：]/.test(line);
}

function isT0Heading(line: string): boolean {
  return /^T0 Frame Spec:/i.test(line) || /^Subjects:/i.test(line) || /^主体[:：]/.test(line);
}

function isT1Heading(line: string): boolean {
  return /^T1 Frame Spec:/i.test(line) || /^Motion:/i.test(line) || /^动作[:：]/.test(line);
}

function isNegativeHeading(line: string): boolean {
  return /^Anti-Director Rules:/i.test(line) || /^Negative:/i.test(line) || /^负向约束[:：]/.test(line);
}

function stripInlineDuration(line: string): string {
  return line
    .replace(/[(（]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*[)）]/gi, "")
    .replace(/[(（]\s*\d+(\.\d+)?\s*秒\s*[)）]/g, "")
    .replace(/\b\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "")
    .replace(/\b\d+(\.\d+)?\s*秒\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripImageOnlyMotionLine(line: string): string {
  return line
    .replace(/专业运镜[:：].*$/i, "")
    .replace(/psychological push[- ]?in.*$/i, "")
    .replace(/顿悟瞬间.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseSections(main: string): PromptSectionSet {
  const sections: PromptSectionSet = {
    scene: [],
    layout: [],
    subjects: [],
    camera: [],
    motion: [],
    negative: [],
    constraints: [],
    extras: []
  };

  type SectionKey = keyof PromptSectionSet | null;
  let current: SectionKey = null;
  const lines = (main ?? "").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === "[V2 SCENEPILOT COMPILE]" || line === "[END]" || line === "---") continue;

    if (isSceneLine(line)) {
      current = "scene";
      sections.scene.push(line);
      continue;
    }
    if (isCameraHeading(line)) {
      current = "camera";
      continue;
    }
    if (isLayoutHeading(line)) {
      current = "layout";
      continue;
    }
    if (isT0Heading(line)) {
      current = "subjects";
      continue;
    }
    if (isT1Heading(line)) {
      current = "motion";
      continue;
    }
    if (isNegativeHeading(line)) {
      current = "negative";
      continue;
    }
    if (isGenerationConstraintLine(line)) {
      current = "constraints";
      continue;
    }

    if (current) {
      sections[current].push(line);
      continue;
    }

    sections.extras.push(line);
  }

  return {
    scene: dedupeLines(sections.scene),
    layout: dedupeLines(sections.layout),
    subjects: dedupeLines(sections.subjects),
    camera: dedupeLines(sections.camera),
    motion: dedupeLines(sections.motion),
    negative: dedupeLines(sections.negative),
    constraints: dedupeLines(sections.constraints),
    extras: dedupeLines(sections.extras)
  };
}

function normalizeImageSections(sections: PromptSectionSet): PromptSectionSet {
  return {
    ...sections,
    scene: dedupeLines(
      sections.scene
        .map(stripInlineDuration)
        .map(stripImageOnlyMotionLine)
        .filter(Boolean)
    ),
    camera: [],
    motion: [],
    layout: dedupeLines(sections.layout.map(stripImageOnlyMotionLine).filter(Boolean)),
    subjects: dedupeLines(sections.subjects.map(stripImageOnlyMotionLine).filter(Boolean)),
    negative: dedupeLines(sections.negative.map(stripImageOnlyMotionLine).filter(Boolean)),
    constraints: dedupeLines(sections.constraints.map(stripImageOnlyMotionLine).filter(Boolean)),
    extras: dedupeLines(
      sections.extras
        .map(stripImageOnlyMotionLine)
        .filter((line) => line && !isCameraHeading(line) && !isT1Heading(line))
    )
  };
}

function limitLines(lines: string[], max: number): string[] {
  if (max <= 0) return [];
  return lines.slice(0, max);
}

function labelFor(lang: Lang, key: "layout" | "subjects" | "camera" | "motion" | "negative" | "constraints"): string {
  if (lang === "zh") {
    if (key === "layout") return "布局";
    if (key === "subjects") return "主体";
    if (key === "camera") return "镜头";
    if (key === "motion") return "动作";
    if (key === "negative") return "负向约束";
    return "执行约束";
  }
  if (key === "layout") return "Layout";
  if (key === "subjects") return "Subjects";
  if (key === "camera") return "Camera";
  if (key === "motion") return "Motion";
  if (key === "negative") return "Negative";
  return "Constraints";
}

function renderSection(label: string, lines: string[]): string {
  if (!lines.length) return "";
  return `${label}:\n${lines.join("\n")}`;
}

function compactQuickSubjectLines(
  lines: string[],
  lang: Lang,
  mediaMode: "image" | "video"
): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    line = line
      .replace(/（仅作用于[^）]+）/g, "")
      .replace(/\(only applies to [^)]+\)/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const isCoordinateHeavy = /(起点t0|终点t1|Start t0|End\s+t1|x=|y=|w=|h=|rot=|t0\s*[->→]\s*t1)/i.test(line);
    if (isCoordinateHeavy) continue;

    const isLocalPromptTail = /(对象局部参考|Object-local pasted prompt|Reference links)/i.test(line);
    if (isLocalPromptTail && line.length > 90) continue;

    out.push(line);
  }

  const deduped = dedupeLines(out);
  if (deduped.length) return deduped.slice(0, 4);

  return [
    mediaMode === "image"
      ? (lang === "zh" ? "- 保持主体位置关系与画面比例稳定。" : "- Keep subject relation and frame proportions stable.")
      : (lang === "zh" ? "- 保持主体身份与空间方位连续一致。" : "- Keep subject identity and spatial orientation continuous.")
  ];
}

function renderImagePrompt(sections: PromptSectionSet, lang: Lang, workspace: PromptWorkspace): string {
  const layout = workspace === "quick" ? limitLines(sections.layout, 3) : sections.layout;
  const subjects = workspace === "quick"
    ? compactQuickSubjectLines(sections.subjects, lang, "image")
    : sections.subjects;
  const negatives = workspace === "quick" ? limitLines([...sections.negative, ...sections.constraints], 4) : [...sections.negative, ...sections.constraints];
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "layout"), layout),
    renderSection(labelFor(lang, "subjects"), subjects),
    renderSection(labelFor(lang, "negative"), dedupeLines(negatives))
  ].filter(Boolean);
  return blocks.join("\n\n").trim();
}

function renderVideoPrompt(sections: PromptSectionSet, lang: Lang, workspace: PromptWorkspace): string {
  const camera = workspace === "quick" ? limitLines(sections.camera, 3) : sections.camera;
  const motion = workspace === "quick" ? limitLines(sections.motion, 3) : sections.motion;
  const layout = workspace === "quick" ? limitLines(sections.layout, 3) : sections.layout;
  const subjects = workspace === "quick"
    ? compactQuickSubjectLines(sections.subjects, lang, "video")
    : sections.subjects;
  const negatives = workspace === "quick" ? limitLines([...sections.negative, ...sections.constraints], 4) : [...sections.negative, ...sections.constraints];
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "camera"), camera),
    renderSection(labelFor(lang, "layout"), layout),
    renderSection(labelFor(lang, "subjects"), subjects),
    renderSection(labelFor(lang, "motion"), motion),
    renderSection(labelFor(lang, "negative"), dedupeLines(negatives))
  ].filter(Boolean);
  return blocks.join("\n\n").trim();
}

function renderImagePromptWithLimits(
  sections: PromptSectionSet,
  lang: Lang,
  limits?: { layout?: number; subjects?: number; negative?: number },
): string {
  const negativeLines = dedupeLines([...sections.negative, ...sections.constraints]);
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "layout"), limitLines(sections.layout, limits?.layout ?? sections.layout.length)),
    renderSection(labelFor(lang, "subjects"), limitLines(sections.subjects, limits?.subjects ?? sections.subjects.length)),
    renderSection(
      labelFor(lang, "negative"),
      limitLines(negativeLines, limits?.negative ?? negativeLines.length)
    )
  ].filter(Boolean);
  return blocks.join("\n\n").trim();
}

function renderVideoPromptWithLimits(
  sections: PromptSectionSet,
  lang: Lang,
  limits?: { camera?: number; layout?: number; subjects?: number; motion?: number; negative?: number },
): string {
  const negativeLines = dedupeLines([...sections.negative, ...sections.constraints]);
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "camera"), limitLines(sections.camera, limits?.camera ?? sections.camera.length)),
    renderSection(labelFor(lang, "layout"), limitLines(sections.layout, limits?.layout ?? sections.layout.length)),
    renderSection(labelFor(lang, "subjects"), limitLines(sections.subjects, limits?.subjects ?? sections.subjects.length)),
    renderSection(labelFor(lang, "motion"), limitLines(sections.motion, limits?.motion ?? sections.motion.length)),
    renderSection(labelFor(lang, "negative"), limitLines(negativeLines, limits?.negative ?? negativeLines.length))
  ].filter(Boolean);
  return blocks.join("\n\n").trim();
}

function fallbackCompact(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function compactVideoBudgetLanguage(text: string, lang: Lang): string {
  const replacements: Array<[RegExp, string]> = lang === "zh"
    ? [
        [/，?（仅作用于\s*[^）]+）/g, ""],
        [/不自动推拉镜头，不自动换角度。/g, "不自动推拉，不换角度。"],
        [/主要主体保持可识别。/g, ""],
        [/中等背景密度：保持层次均衡，不挤压深度。/g, "保持背景层次，不挤压深度。"],
        [/结束保持原位，距离与尺度稳定。/g, "结束保持原位。"],
        [/保持层级关系与相对顺序。/g, "保持层级与相对顺序。"],
        [/保持对象顺序和前中后层级，不要自动重排。/g, "保持对象顺序与层级，不自动重排。"],
        [/用画面占比表达远近，保持大小层级。/g, "用画面占比表达远近。"]
      ]
    : [
        [/\s*\(only applies to [^)]+\)/gi, ""],
        [/Do not automatically push or change angle\./gi, "No auto push or angle change."],
        [/Keep the primary subject readable\./gi, ""],
        [/Keep balanced background density without flattening depth\./gi, "Keep background depth."],
        [/End in place with stable distance and scale\./gi, "End in place."],
        [/Keep layer relationship and relative order\./gi, "Keep layer order."],
        [/Preserve object order and depth layering; do not relayout\./gi, "Preserve object order and depth."],
        [/Use frame coverage to express distance and size hierarchy\./gi, "Use coverage to express depth."]
      ];

  let next = text;
  for (const [pattern, value] of replacements) {
    next = next.replace(pattern, value);
  }
  return next
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trimEnd())
    .filter((line, index, list) => line.trim() || (index > 0 && list[index - 1].trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function transformByEngine(
  input: string,
  lang: Lang,
  workspace: PromptWorkspace,
  mediaMode: "image" | "video"
): EngineTransform {
  const { main, notes } = splitMachineNotes(input);
  const sectionsBase = parseSections(main);
  const enginePasses: string[] = [];

  const sections = mediaMode === "image" ? normalizeImageSections(sectionsBase) : sectionsBase;
  const strippedVideoScaffoldForImage =
    mediaMode === "image" && (sectionsBase.camera.length > 0 || sectionsBase.motion.length > 0);
  if (strippedVideoScaffoldForImage) enginePasses.push("strip_image_video_scaffold");

  let rebuilt =
    mediaMode === "image"
      ? renderImagePrompt(sections, lang, workspace)
      : renderVideoPrompt(sections, lang, workspace);

  if (workspace === "quick") enginePasses.push("quick_compaction");
  else enginePasses.push("pro_structured");

  if (!rebuilt) rebuilt = fallbackCompact(main);
  const compactedForEngine = rebuilt.trim() !== main.trim();
  if (compactedForEngine && !enginePasses.includes("quick_compaction") && mediaMode === "video") {
    enginePasses.push("video_heading_normalization");
  }

  const final = notes ? `${rebuilt.trim()}\n\n${notes.trim()}\n` : `${rebuilt.trim()}\n`;
  return {
    finalPrompt: final,
    strippedVideoScaffoldForImage,
    compactedForEngine,
    enginePasses
  };
}

export function parsePromptWorkspace(notes: string): PromptWorkspace {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(GEN_MARK));
  if (!hit) return "quick";
  const value = hit.trim().slice(GEN_MARK.length).trim().toLowerCase();
  return value === "pro" ? "pro" : "quick";
}

export function resolvePromptEngineId(input: {
  workspace: PromptWorkspace;
  mediaMode: "image" | "video";
}): PromptEngineId {
  const route = resolvePromptEngineRoute(input);
  if (route === "quick_image") return "IM v5";
  if (route === "quick_video") return "VI V5";
  if (route === "pro_image") return "IM V5P";
  return "VI V5P";
}

function resolvePromptEngineRoute(input: {
  workspace: PromptWorkspace;
  mediaMode: "image" | "video";
}): PromptEngineRoute {
  const { workspace, mediaMode } = input;
  if (workspace === "quick") return mediaMode === "image" ? "quick_image" : "quick_video";
  return mediaMode === "image" ? "pro_image" : "pro_video";
}

function stripLines(lines: string[], patterns: RegExp[]) {
  const out: string[] = [];
  let removed = 0;
  for (const line of lines) {
    const hit = patterns.some((re) => re.test(line.trim()));
    if (hit) {
      removed += 1;
      continue;
    }
    out.push(line);
  }
  return { lines: out, removed };
}

function enforceRouteContract(input: {
  route: PromptEngineRoute;
  prompt: string;
  lang: Lang;
}): { prompt: string; passes: string[] } {
  const { route, prompt, lang } = input;
  const { main, notes } = splitMachineNotes(prompt);
  const passes: string[] = [];
  let working = main;

  if (route === "quick_image" || route === "pro_image") {
    const rawLines = working.split("\n");
    const { lines, removed } = stripLines(rawLines, [
      /^Camera(?: Contract)?:/i,
      /^镜头[:：]/,
      /^Motion:/i,
      /^T1 Frame Spec:/i,
      /^动作[:：]/,
      /^Transition\s+\d+/i,
      /^衔接\s+\d+/,
      /^End\s+t1:/i,
      /^终点t1[:：]/,
      /^-+\s*camera\s+continues/i,
      /^-+\s*reverse angle/i,
      /^-+\s*time jump/i
    ]);
    if (removed > 0) {
      working = lines.join("\n").trim();
      passes.push("image_contract_strip_video_terms");
    }
  }

  if (route === "quick_video" || route === "pro_video") {
    const hasCamera = /(^Camera(?: Contract)?:|^镜头[:：])/im.test(working);
    const hasMotion = /(^Motion:|^T1 Frame Spec:|^动作[:：]|^Transition\s+\d+|^衔接\s+\d+)/im.test(working);
    if (!hasCamera || !hasMotion) {
      const inject = lang === "zh"
        ? [
            !hasCamera ? "镜头:\n- 明确景别、机位与运动方式。" : "",
            !hasMotion ? "动作/衔接:\n- 明确主体动作、镜头切换或连续推进关系。" : ""
          ].filter(Boolean).join("\n\n")
        : [
            !hasCamera ? "Camera:\n- Specify shot size, angle, and camera movement." : "",
            !hasMotion ? "Motion/Transition:\n- Specify subject action and transition/continuity logic." : ""
          ].filter(Boolean).join("\n\n");
      if (inject) {
        working = `${working.trim()}\n\n${inject}`.trim();
        passes.push("video_contract_inject_camera_motion");
      }
    }

    const sections = parseSections(working);
    const joined = working;
    const hasIntentionalMove = /跟随|follow|心理逼近|push-?in|dolly/i.test(joined);
    const hasTransitionIntent = /时间跳切|时间变化|多场景|scene progression|time jump|scene switch|multi-scene/i.test(joined);

    let nextCamera = dedupeLines(sections.camera).filter((line, index, list) => {
      if (hasIntentionalMove && /不自动推拉镜头|do not auto push|no automatic push/i.test(line)) return false;
      if (hasTransitionIntent && /保持静止构图|t0=t1|distance and scale stable/i.test(line)) return false;
      if (/在\s*\d+(\.\d+)?\s*秒.*t0.?t1/i.test(line) && list.some((other) => other !== line && /按\s*T0.?T1|完成\s*t0.?t1/i.test(other))) {
        return index === list.findIndex((candidate) => /在\s*\d+(\.\d+)?\s*秒.*t0.?t1/i.test(candidate));
      }
      return true;
    });
    if (hasIntentionalMove && !nextCamera.some((line) => /不自动换角度|no auto angle change/i.test(line))) {
      nextCamera.push(lang === "zh" ? "- 不自动换角度，不做无关镜头切换。" : "- Avoid unrelated angle changes or gratuitous reframing.");
    }

    let nextMotion = dedupeLines(sections.motion);
    if (hasTransitionIntent) {
      const filteredStatic = nextMotion.filter((line) => !/保持静止构图|结束保持原位|distance and scale stable/i.test(line));
      if (filteredStatic.length !== nextMotion.length) {
        nextMotion = filteredStatic;
        passes.push("video_transition_preserve_progression");
      }
      if (!nextMotion.some((line) => /时间跳切|多场景|scene switch|time jump|transition/i.test(line))) {
        nextMotion.unshift(
          lang === "zh"
            ? "- 保留时间跳切/场景切换，主体身份与风格连续。"
            : "- Preserve scene progression or time jump while keeping identity and style consistent."
        );
      }
    }

    let rebuilt = renderVideoPromptWithLimits(
      {
        ...sections,
        camera: nextCamera,
        motion: nextMotion
      },
      lang,
      route === "quick_video"
        ? { camera: 3, layout: 3, subjects: 4, motion: 3, negative: 4 }
        : { camera: 4, layout: 4, subjects: 4, motion: 4, negative: 3 }
    );

    if (route === "pro_video" && rebuilt.length > 430) {
      rebuilt = renderVideoPromptWithLimits(
        {
          ...sections,
          camera: nextCamera,
          motion: nextMotion
        },
        lang,
        { camera: 3, layout: 3, subjects: 4, motion: 4, negative: 3 }
      );
      passes.push("pro_video_budget_compaction");
      if (rebuilt.length > 430) {
        rebuilt = compactVideoBudgetLanguage(rebuilt, lang);
        passes.push("pro_video_budget_language_compaction");
      }
    }

    working = rebuilt.trim();
    if (route === "quick_video" && working.length > 320) {
      working = compactVideoBudgetLanguage(working, lang);
      passes.push("quick_video_budget_language_compaction");
    }
  }

  if (route === "pro_image" && working.length > 300) {
    const sections = normalizeImageSections(parseSections(working));
    working = renderImagePromptWithLimits(sections, lang, { layout: 3, subjects: 4, negative: 3 }).trim();
    passes.push("pro_image_budget_compaction");
  }

  const finalPrompt = notes ? `${working.trim()}\n\n${notes.trimEnd()}\n` : `${working.trim()}\n`;
  return { prompt: finalPrompt, passes };
}

export type PromptEngineInput = PromptPipelineInput & {
  workspace?: PromptWorkspace;
};

export function runPromptEngine(input: PromptEngineInput): PromptPipelineOutput {
  const pipeline = runPromptPipeline(input);
  const firstScene: Scene | undefined = input.project.scenes?.[0];
  const mediaMode = firstScene ? resolveSceneConfig(firstScene).mediaMode : pipeline.metadata.mediaMode;
  const workspace = input.workspace ?? parsePromptWorkspace(firstScene?.notes ?? "");
  const route = resolvePromptEngineRoute({ workspace, mediaMode });
  const engineId = resolvePromptEngineId({ workspace, mediaMode });
  const transformed = transformByEngine(pipeline.finalCopyPrompt, input.lang, workspace, mediaMode);
  const contracted = enforceRouteContract({ route, prompt: transformed.finalPrompt, lang: input.lang });
  const enginePasses = [...transformed.enginePasses, ...contracted.passes];

  return {
    ...pipeline,
    finalCopyPrompt: contracted.prompt,
    metadata: {
      ...pipeline.metadata,
      mediaMode,
      workspace,
      engineId,
      strippedVideoScaffoldForImage: transformed.strippedVideoScaffoldForImage,
      compactedForEngine: transformed.compactedForEngine,
      enginePasses
    }
  };
}

export function buildPromptForScene(input: {
  project: Project;
  scene: Scene;
  lang: Lang;
  platformId: PlatformPresetId;
  profile?: PromptProfile;
  workspace?: PromptWorkspace;
}): PromptPipelineOutput {
  return runPromptEngine({
    project: { ...input.project, scenes: [input.scene] },
    lang: input.lang,
    platformId: input.platformId,
    profile: input.profile,
    scope: "current_scene",
    workspace: input.workspace
  });
}
