import type { Lang } from "../i18n";
import type { Project, SceneCompiler } from "../model";
import { resolveSceneConfig } from "../model";
import type { PlatformPresetId } from "../config/platformPresets";
import { getPlatformPreset } from "../config/platformPresets";
import type { PromptProfile } from "./prompt";
import { generatePrompts } from "./prompt";
import { adaptPromptToPlatformDetailed } from "./platformAdapter";
import type { PromptPipelineMetadata, PromptPipelineStage } from "../types/export";

export type PromptPipelineInput = {
  project: Project;
  lang: Lang;
  platformId: PlatformPresetId;
  profile?: PromptProfile;
  scope?: "current_scene";
};

export type PromptPipelineOutput = {
  corePrompt: string;
  adaptedPrompt: string;
  finalCopyPrompt: string;
  metadata: PromptPipelineMetadata;
};

function collapseStaticKeyframes(text: string, lang: Lang): string {
  const lines = (text ?? "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur = lines[i] ?? "";
    const next = lines[i + 1] ?? "";
    const mZhStart = cur.match(/^起点t0[:：]\s*(.+)$/);
    const mZhEnd = next.match(/^终点t1[:：]\s*(.+)$/);
    const mEnStart = cur.match(/^Start t0[:：]\s*(.+)$/i);
    const mEnEnd = next.match(/^End t1[:：]\s*(.+)$/i);

    if (mZhStart && mZhEnd && mZhStart[1].trim() === mZhEnd[1].trim()) {
      out.push(`位置：${mZhStart[1].trim()}`);
      i += 2;
      continue;
    }
    if (mEnStart && mEnEnd && mEnStart[1].trim() === mEnEnd[1].trim()) {
      out.push(`${lang === "zh" ? "位置" : "Position"}: ${mEnStart[1].trim()}`);
      i += 2;
      continue;
    }

    out.push(cur);
    i += 1;
  }
  return out.join("\n").trim();
}

function splitMachineNotes(allText: string): { main: string; notes: string } {
  const text = allText ?? "";
  const lines = text.split("\n");

  const isMarker = (line: string) => {
    const t = (line ?? "").trim();
    if (!t) return false;
    const low = t.toLowerCase();
    if (t.includes("以下为机器语言")) return true;
    if (t.startsWith("（以下为机器语言")) return true;
    if (t.includes("系统结构控制层")) return true;
    if (t.includes("系统追加结构控制层")) return true;
    if (low.includes("machine notes")) return true;
    if (low.includes("system structural control layer")) return true;
    return false;
  };

  const idx = lines.findIndex((l) => isMarker(l));
  if (idx < 0) return { main: text.trimEnd(), notes: "" };
  const main = lines.slice(0, idx).join("\n").trimEnd();
  const notes = lines.slice(idx).join("\n").trimEnd();
  return { main, notes };
}

function stripDurationForImageMode(prompts: string): string {
  const src = (prompts ?? "").split("\n");
  const isDurationWholeLine = (s: string) => {
    const t = s.trim();
    if (!t) return false;
    const low = t.toLowerCase();
    if (low.includes("duration_s")) return true;
    if (low.startsWith("duration") || low.startsWith("length") || low.startsWith("len")) return true;
    if (t.includes("时长")) return true;
    if (/^\d+(\.\d+)?\s*(s|sec|secs|second|seconds)$/i.test(t)) return true;
    if (/^\d+(\.\d+)?\s*秒$/.test(t)) return true;
    return false;
  };

  const stripInline = (line: string) => {
    let s = line;
    s = s.replace(/[(（]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*[)）]/gi, "");
    s = s.replace(/[(（]\s*\d+(\.\d+)?\s*秒\s*[)）]/g, "");
    s = s.replace(/\b\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "");
    s = s.replace(/\b\d+(\.\d+)?\s*秒\b/g, "");
    s = s.replace(/\s{2,}/g, " ").trim();
    return s;
  };

  return src
    .filter((line) => !isDurationWholeLine(line))
    .map(stripInline)
    .filter(Boolean)
    .join("\n");
}

function stripT1ForImageMode(prompts: string): string {
  const lines = (prompts ?? "").split("\n");
  const isT1WholeLine = (s: string) => {
    const t = s.trim().toLowerCase();
    if (!t) return false;
    if (/\bt\s*=\s*1\b/.test(t) || /\bt1\b/.test(t) || /\bkf1\b/.test(t) || /\bend\b/.test(t)) return true;
    if (s.includes("终点") || s.includes("终帧") || s.includes("结束") || s.includes("结尾") || s.includes("轨迹") || s.includes("路径")) return true;
    return false;
  };

  const stripInlineT1 = (line: string) => {
    let s = line;
    s = s.replace(/(\bt\s*=\s*0\b.*?)(\s*(->|→|to)\s*.*)$/i, "$1");
    s = s.replace(/(\bt0\b.*?)(\s*(->|→|to)\s*.*)$/i, "$1");
    s = s.replace(/(起点.*?)(\s*(->|→|到|至)\s*.*)$/i, "$1");
    s = s.replace(/[(（][^)）]*\b(t1|t\s*=\s*1|end|kf1)\b[^)）]*[)）]/gi, "");
    return s.replace(/\s{2,}/g, " ").trim();
  };

  return lines
    .filter((line) => !isT1WholeLine(line))
    .map(stripInlineT1)
    .filter((line) => {
      const low = line.toLowerCase();
      return !(/\bt1\b/.test(low) || /\bt\s*=\s*1\b/.test(low) || line.includes("终点"));
    })
    .join("\n");
}

function fixPromptCopy(input: string, lang: Lang, mediaMode: "image" | "video", sceneTitle: string): string {
  const rawLines = (input ?? "").split("\n");
  const removedColor = rawLines.filter((l) => !l.includes("注意：不要引用任何颜色字段（color 不在 UI 中）"));

  const firstLineFix = removedColor.map((l, idx) => {
    if (idx !== 0) return l;
    if (lang === "zh") return l.replace(/图像\s*\/\s*视频/g, mediaMode === "image" ? "图像" : "视频");
    return l
      .replace(/image\s*\/\s*video/gi, mediaMode === "image" ? "image" : "video")
      .replace(/image\s+or\s+video/gi, mediaMode === "image" ? "image" : "video");
  });

  const zhHeadRe = /^(\s*#\s*)?分镜\s*#?\s*\d+\s*[:：]\s*/i;
  const enHeadRe = /^(\s*#\s*)?(scene|shot)\s*#?\s*\d+\s*[:：]\s*/i;

  const replaced = firstLineFix.map((line) => {
    const t = line.trim();
    if (!t) return line;
    const m = line.match(/^(\s*#\s*)/);
    const prefix = m ? m[1] : "";
    if (zhHeadRe.test(t)) {
      const tail = line.replace(/^(\s*#\s*)?/, "").replace(zhHeadRe, "").trim().replace(/^[:：\-—–]\s*/, "");
      return `${prefix}${sceneTitle}${tail ? ` ${tail}` : ""}`.trimEnd();
    }
    if (enHeadRe.test(t)) {
      const tail = line.replace(/^(\s*#\s*)?/, "").replace(enHeadRe, "").trim().replace(/^[:：\-—–]\s*/, "");
      return `${prefix}${sceneTitle}${tail ? ` ${tail}` : ""}`.trimEnd();
    }
    return line;
  });

  let seenHeader = false;
  return replaced
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      const noHash = t.replace(/^#\s*/, "");
      const isHeader = /^分镜\b/.test(noHash) || /^(scene|shot)\b/i.test(noHash) || noHash === sceneTitle;
      if (!isHeader) return true;
      if (!seenHeader) {
        seenHeader = true;
        return true;
      }
      return false;
    })
    .join("\n")
    .trimEnd();
}

function cleanupFinalPrompt(params: {
  input: string;
  lang: Lang;
  mediaMode: "image" | "video";
  sceneTitle: string;
}): { final: string; strippedDurationForImage: boolean; strippedT1ForImage: boolean } {
  const { main, notes } = splitMachineNotes(params.input);
  let cleaned = main;
  let strippedDurationForImage = false;
  let strippedT1ForImage = false;

  if (params.mediaMode === "image") {
    cleaned = stripDurationForImageMode(cleaned);
    strippedDurationForImage = true;
    cleaned = stripT1ForImageMode(cleaned);
    strippedT1ForImage = true;
  }

  cleaned = collapseStaticKeyframes(cleaned, params.lang);
  cleaned = fixPromptCopy(cleaned, params.lang, params.mediaMode, params.sceneTitle);
  const final = notes ? `${cleaned.trimEnd()}\n\n${notes.trimEnd()}\n` : `${cleaned.trimEnd()}\n`;
  return { final, strippedDurationForImage, strippedT1ForImage };
}

export function runPromptPipeline(input: PromptPipelineInput): PromptPipelineOutput {
  const preset = getPlatformPreset(input.platformId);
  const profile = input.profile ?? preset.baseProfile;
  const scenes = input.project.scenes ?? [];
  const firstScene = scenes[0];
  const resolved = firstScene ? resolveSceneConfig(firstScene) : { mediaMode: "video", compiler: "v1" as SceneCompiler };
  const mediaMode: "image" | "video" = scenes.some((scene) => resolveSceneConfig(scene).mediaMode === "video") ? "video" : "image";
  const compiler: SceneCompiler = scenes.some((scene) => resolveSceneConfig(scene).compiler === "v2") ? "v2" : resolved.compiler;
  const sceneTitle = (firstScene?.name ?? "").trim() || firstScene?.id || (input.lang === "zh" ? "分镜" : "Scene");

  const stages: PromptPipelineStage[] = ["compile", "assemble", "append_tail", "adapt_platform", "final_cleanup"];

  const corePrompt = generatePrompts(input.project, input.lang, "universal");
  const adapted = adaptPromptToPlatformDetailed({
    prompt: corePrompt,
    profile,
    platformId: preset.id,
    lang: input.lang,
    media: mediaMode
  });
  const cleaned = cleanupFinalPrompt({
    input: adapted.prompt,
    lang: input.lang,
    mediaMode,
    sceneTitle
  });

  return {
    corePrompt,
    adaptedPrompt: adapted.prompt,
    finalCopyPrompt: cleaned.final,
    metadata: {
      platformId: preset.id,
      baseProfile: preset.baseProfile,
      nativeStrategy: preset.nativeStrategy,
      mappedFromProfile: preset.nativeStrategy ? null : preset.baseProfile,
      mediaMode,
      compiler,
      strippedDurationForImage: cleaned.strippedDurationForImage,
      strippedT1ForImage: cleaned.strippedT1ForImage,
      tailApplied: /system structural control layer/i.test(corePrompt) || corePrompt.includes("系统结构控制层") || corePrompt.includes("系统追加结构控制层"),
      trimmedByBudget: adapted.meta.trimmedByBudget,
      trimReason: adapted.meta.trimReason,
      appliedPatches: adapted.meta.appliedPatches,
      stages
    }
  };
}
