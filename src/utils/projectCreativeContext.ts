import type { Lang } from "../i18n";
import type { MediaType, Project, ProjectCreativeContext } from "../model";
import { defaultObjectName } from "./naming";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLabels(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  ).slice(0, 12);
}

export function readProjectCreativeContext(project: Project): ProjectCreativeContext | null {
  const raw = project?.project?.creativeContext;
  if (!raw || typeof raw !== "object") return null;
  return {
    source: raw.source === "quick_workspace" || raw.source === "imported" ? raw.source : "manual",
    mediaType: raw.mediaType === "image" || raw.mediaType === "video" ? raw.mediaType : undefined,
    fileName: normalizeText(raw.fileName),
    primaryInput: normalizeText(raw.primaryInput),
    secondaryInput: normalizeText(raw.secondaryInput),
    mergedInput: normalizeText(raw.mergedInput),
    intentSummary: normalizeText(raw.intentSummary),
    locationHint: normalizeText(raw.locationHint),
    styleHint: normalizeText(raw.styleHint),
    subjectLabels: normalizeLabels(raw.subjectLabels)
  };
}

export function withProjectCreativeContext(project: Project, patch: Partial<ProjectCreativeContext>): Project {
  const current = readProjectCreativeContext(project) ?? {
    source: "manual" as const,
    mediaType: project.project?.mediaType,
    fileName: "",
    primaryInput: "",
    secondaryInput: "",
    mergedInput: "",
    intentSummary: "",
    locationHint: "",
    styleHint: "",
    subjectLabels: []
  };

  const next: ProjectCreativeContext = {
    ...current,
    ...patch,
    source: patch.source === "quick_workspace" || patch.source === "imported" ? patch.source : (patch.source === "manual" ? "manual" : current.source),
    mediaType: patch.mediaType === "image" || patch.mediaType === "video" ? patch.mediaType : current.mediaType,
    fileName: normalizeText(patch.fileName ?? current.fileName),
    primaryInput: normalizeText(patch.primaryInput ?? current.primaryInput),
    secondaryInput: normalizeText(patch.secondaryInput ?? current.secondaryInput),
    intentSummary: normalizeText(patch.intentSummary ?? current.intentSummary),
    locationHint: normalizeText(patch.locationHint ?? current.locationHint),
    styleHint: normalizeText(patch.styleHint ?? current.styleHint),
    subjectLabels: normalizeLabels(patch.subjectLabels ?? current.subjectLabels)
  };

  next.mergedInput = normalizeText(
    patch.mergedInput
      ?? [next.primaryInput, next.secondaryInput].filter(Boolean).join("\n")
  );

  return {
    ...project,
    project: {
      ...project.project,
      creativeContext: next
    }
  };
}

export function buildQuickWorkspaceCreativeContext(input: {
  mediaType?: MediaType;
  fileName?: string;
  primaryInput?: string;
  secondaryInput?: string;
  intentSummary?: string;
  locationHint?: string;
  styleHint?: string;
  subjectLabels?: string[];
}): ProjectCreativeContext {
  const primaryInput = normalizeText(input.primaryInput);
  const secondaryInput = normalizeText(input.secondaryInput);
  return {
    source: "quick_workspace",
    mediaType: input.mediaType === "image" || input.mediaType === "video" ? input.mediaType : undefined,
    fileName: normalizeText(input.fileName),
    primaryInput,
    secondaryInput,
    mergedInput: [primaryInput, secondaryInput].filter(Boolean).join("\n"),
    intentSummary: normalizeText(input.intentSummary),
    locationHint: normalizeText(input.locationHint),
    styleHint: normalizeText(input.styleHint),
    subjectLabels: normalizeLabels(input.subjectLabels)
  };
}

export function nextCreativeObjectName(project: Project, layers: Array<{ id: string }>, lang: Lang): string {
  const ctx = readProjectCreativeContext(project);
  const used = new Set((layers ?? []).map((layer) => normalizeText(layer.id).toLowerCase()).filter(Boolean));
  for (const label of ctx?.subjectLabels ?? []) {
    const normalized = normalizeText(label);
    if (!normalized) continue;
    if (used.has(normalized.toLowerCase())) continue;
    return normalized;
  }
  return defaultObjectName(lang, Math.max(1, (layers ?? []).length + 1));
}

export function buildProjectCreativeContextPromptLines(project: Project, lang: Lang): string[] {
  const ctx = readProjectCreativeContext(project);
  if (!ctx) return [];

  const lines: string[] = [];
  if (lang === "zh") {
    lines.push("项目级创作上下文：以下原始输入仅作为上游创作意图，若与分镜结构冲突，以分镜结构为准。");
    if (ctx.fileName) lines.push(`工作名：${ctx.fileName}`);
    if (ctx.primaryInput) lines.push(`原始输入一：${ctx.primaryInput}`);
    if (ctx.secondaryInput) lines.push(`原始输入二：${ctx.secondaryInput}`);
    if (ctx.intentSummary) lines.push(`意图摘要：${ctx.intentSummary}`);
    if (ctx.locationHint) lines.push(`地点线索：${ctx.locationHint}`);
    if (ctx.styleHint) lines.push(`风格线索：${ctx.styleHint}`);
  if ((ctx.subjectLabels ?? []).length) lines.push(`主体候选：${(ctx.subjectLabels ?? []).join("、")}`);
    return lines;
  }

  lines.push("Project creative context: treat the raw inputs below as upstream intent only; if they conflict with storyboard structure, storyboard structure wins.");
  if (ctx.fileName) lines.push(`Working title: ${ctx.fileName}`);
  if (ctx.primaryInput) lines.push(`Raw input 1: ${ctx.primaryInput}`);
  if (ctx.secondaryInput) lines.push(`Raw input 2: ${ctx.secondaryInput}`);
  if (ctx.intentSummary) lines.push(`Intent summary: ${ctx.intentSummary}`);
  if (ctx.locationHint) lines.push(`Location cue: ${ctx.locationHint}`);
  if (ctx.styleHint) lines.push(`Style cue: ${ctx.styleHint}`);
  if ((ctx.subjectLabels ?? []).length) lines.push(`Subject candidates: ${(ctx.subjectLabels ?? []).join(", ")}`);
  return lines;
}
