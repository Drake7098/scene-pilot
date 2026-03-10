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

function cleanBlockLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function firstLine(block: string): string {
  return cleanBlockLines(block)[0] ?? "";
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

  const blocks = main
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = cleanBlockLines(block);
    const head = firstLine(block);
    if (!head || head === "[V2 SCENEPILOT COMPILE]" || head === "[END]") continue;

    if (isSceneLine(head)) {
      sections.scene.push(...lines.filter((line) => !/^\[END\]$/i.test(line)));
      continue;
    }
    if (isCameraHeading(head)) {
      sections.camera.push(...lines.slice(1));
      continue;
    }
    if (isLayoutHeading(head)) {
      sections.layout.push(...lines.slice(1));
      continue;
    }
    if (isT0Heading(head)) {
      sections.subjects.push(...lines.slice(1));
      continue;
    }
    if (isT1Heading(head)) {
      sections.motion.push(...lines.slice(1));
      continue;
    }
    if (isNegativeHeading(head)) {
      sections.negative.push(...lines.slice(1));
      continue;
    }
    if (isGenerationConstraintLine(head)) {
      sections.constraints.push(...lines.slice(1));
      continue;
    }
    sections.extras.push(...lines);
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

function renderImagePrompt(sections: PromptSectionSet, lang: Lang, workspace: PromptWorkspace): string {
  const layout = workspace === "quick" ? limitLines(sections.layout, 3) : sections.layout;
  const negatives = workspace === "quick" ? limitLines([...sections.negative, ...sections.constraints], 4) : [...sections.negative, ...sections.constraints];
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "layout"), layout),
    renderSection(labelFor(lang, "subjects"), sections.subjects),
    renderSection(labelFor(lang, "negative"), dedupeLines(negatives))
  ].filter(Boolean);
  return blocks.join("\n\n").trim();
}

function renderVideoPrompt(sections: PromptSectionSet, lang: Lang, workspace: PromptWorkspace): string {
  const camera = workspace === "quick" ? limitLines(sections.camera, 3) : sections.camera;
  const motion = workspace === "quick" ? limitLines(sections.motion, 3) : sections.motion;
  const layout = workspace === "quick" ? limitLines(sections.layout, 3) : sections.layout;
  const negatives = workspace === "quick" ? limitLines([...sections.negative, ...sections.constraints], 4) : [...sections.negative, ...sections.constraints];
  const blocks = [
    sections.scene.join("\n"),
    renderSection(labelFor(lang, "camera"), camera),
    renderSection(labelFor(lang, "layout"), layout),
    renderSection(labelFor(lang, "subjects"), sections.subjects),
    renderSection(labelFor(lang, "motion"), motion),
    renderSection(labelFor(lang, "negative"), dedupeLines(negatives))
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
  const { workspace, mediaMode } = input;
  if (workspace === "quick") return mediaMode === "image" ? "IM v5" : "VI V5";
  return mediaMode === "image" ? "IM V5P" : "VI V5P";
}

export type PromptEngineInput = PromptPipelineInput & {
  workspace?: PromptWorkspace;
};

export function runPromptEngine(input: PromptEngineInput): PromptPipelineOutput {
  const pipeline = runPromptPipeline(input);
  const firstScene: Scene | undefined = input.project.scenes?.[0];
  const mediaMode = firstScene ? resolveSceneConfig(firstScene).mediaMode : pipeline.metadata.mediaMode;
  const workspace = input.workspace ?? parsePromptWorkspace(firstScene?.notes ?? "");
  const engineId = resolvePromptEngineId({ workspace, mediaMode });
  const transformed = transformByEngine(pipeline.finalCopyPrompt, input.lang, workspace, mediaMode);

  return {
    ...pipeline,
    finalCopyPrompt: transformed.finalPrompt,
    metadata: {
      ...pipeline.metadata,
      mediaMode,
      workspace,
      engineId,
      strippedVideoScaffoldForImage: transformed.strippedVideoScaffoldForImage,
      compactedForEngine: transformed.compactedForEngine,
      enginePasses: transformed.enginePasses
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
