import React, { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { tAny } from "../i18n";
import type { Project } from "../model";
import { generatePrompts } from "../utils/prompt";
import type { PromptProfile } from "../utils/prompt";
import { CURRENT_PLATFORM_MODE } from "../config/platformMode";

type Props = {
  lang: Lang;
  project: Project;
  sceneIdx: number;
  selectedLayerId: string | null;
};

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

type MediaMode = "image" | "video";
type GenMode = "quick" | "pro";
type FlowMode = "one-pass" | "two-step";

type PlatformPresetId =
  | "universal"
  | "midjourney"
  | "runway"
  | "pika"
  | "luma"
  | "krea"
  | "jimeng"
  | "keling"
  | "vidu"
  | "hailuo"
  | "wanx";

type PlatformPreset = {
  id: PlatformPresetId;
  profile: PromptProfile;
  labelZh: string;
  labelEn: string;
  url: string;
  maxRefsPerObject: number;
  uploadMode: "upload-first" | "prompt-first";
  promptStyle: "short" | "long";
};

const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "universal",
    profile: "universal",
    labelZh: "通用",
    labelEn: "Universal",
    url: "",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "long"
  },
  {
    id: "midjourney",
    profile: "midjourney",
    labelZh: "Midjourney",
    labelEn: "Midjourney",
    url: "https://www.midjourney.com/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "runway",
    profile: "runway",
    labelZh: "Runway",
    labelEn: "Runway",
    url: "https://runwayml.com/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "long"
  },
  {
    id: "pika",
    profile: "runway",
    labelZh: "Pika",
    labelEn: "Pika",
    url: "https://pika.art/",
    maxRefsPerObject: 2,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "luma",
    profile: "runway",
    labelZh: "Luma",
    labelEn: "Luma",
    url: "https://lumalabs.ai/dream-machine",
    maxRefsPerObject: 2,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "krea",
    profile: "midjourney",
    labelZh: "Krea",
    labelEn: "Krea",
    url: "https://www.krea.ai/",
    maxRefsPerObject: 2,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "jimeng",
    profile: "jimeng",
    labelZh: "即梦",
    labelEn: "Jimeng",
    url: "https://jimeng.jianying.com/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "keling",
    profile: "jimeng",
    labelZh: "可灵",
    labelEn: "Keling",
    url: "https://klingai.com/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "short"
  },
  {
    id: "vidu",
    profile: "runway",
    labelZh: "Vidu",
    labelEn: "Vidu",
    url: "https://www.vidu.cn/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "long"
  },
  {
    id: "hailuo",
    profile: "runway",
    labelZh: "海螺 AI",
    labelEn: "Hailuo AI",
    url: "https://hailuoai.com/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "long"
  },
  {
    id: "wanx",
    profile: "qwen",
    labelZh: "通义万相",
    labelEn: "Wanx",
    url: "https://tongyi.aliyun.com/wanxiang/",
    maxRefsPerObject: 3,
    uploadMode: "upload-first",
    promptStyle: "long"
  }
];

function parseMediaModeFromNotes(notes: string | undefined | null): MediaMode {
  const lines = (notes ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  const keys = ["media:", "mode:", "type:"];
  for (const l of lines) {
    for (const k of keys) {
      if (l.startsWith(k)) {
        const v = l.slice(k.length).trim();
        if (v.startsWith("image") || v.startsWith("img") || v.includes("图片")) return "image";
        if (v.startsWith("video") || v.startsWith("vid") || v.includes("视频")) return "video";
      }
    }
  }

  // 默认保持你原来的逻辑：没标就按视频（因为很多人需要 t0/t1）
  return "video";
}

function parseGenModeFromNotes(notes: string | undefined | null): GenMode {
  const lines = (notes ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  const hit = lines.find((l) => l.startsWith("genmode:"));
  if (!hit) return "quick";
  const v = hit.slice("genmode:".length).trim();
  return v === "pro" ? "pro" : "quick";
}

/**
 * 将末尾“系统追加/机器语言块”分离出来，用于 UI 灰显（复制仍保留完整）
 * 关键：不要把这段“机器语言/控制层”展示给用户当正文，但复制导出时仍附带。
 *
 * 兼容多种 marker（你改过文案，会变）：
 * - 中文旧： （以下为机器语言，可忽略...）
 * - 英文旧： (Machine Notes — you can ignore...)
 * - 英文可能： (Machine Notes ...)
 * - 中文可能： （系统结构控制层）/（系统追加结构控制层）
 * - 英文可能： (System Structural Control Layer)
 */
function splitMachineNotes(allText: string): { main: string; notes: string } {
  const text = allText ?? "";
  const lines = text.split("\n");

  const isMarker = (line: string) => {
    const t = (line ?? "").trim();
    if (!t) return false;
    const low = t.toLowerCase();

    // 中文 marker
    if (t.includes("以下为机器语言")) return true;
    if (t.startsWith("（以下为机器语言")) return true;
    if (t.includes("系统结构控制层")) return true;
    if (t.includes("系统追加结构控制层")) return true;

    // 英文 marker
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

/** 图片模式：移除秒数/时长（行内+整行） */
function stripDurationForImageMode(prompts: string): string {
  const src = (prompts ?? "").split("\n");

  const isDurationWholeLine = (s: string) => {
    const t = s.trim();
    if (!t) return false;
    const low = t.toLowerCase();
    if (low.includes("duration_s")) return true;
    if (low.startsWith("duration")) return true;
    if (low.startsWith("length")) return true;
    if (low.startsWith("len")) return true;
    if (t.includes("时长")) return true;
    if (/^\d+(\.\d+)?\s*(s|sec|secs|second|seconds)$/i.test(t)) return true;
    if (/^\d+(\.\d+)?\s*秒$/.test(t)) return true;
    if (/^duration\s*[:：]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/i.test(t)) return true;
    if (/^时长\s*[:：]\s*\d+(\.\d+)?\s*秒$/.test(t)) return true;
    return false;
  };

  const stripInline = (line: string) => {
    let s = line;

    s = s.replace(/[(（]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*[)）]/gi, "");
    s = s.replace(/[(（]\s*\d+(\.\d+)?\s*秒\s*[)）]/g, "");
    s = s.replace(/\[\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*\]/gi, "");
    s = s.replace(/\[\s*\d+(\.\d+)?\s*秒\s*\]/g, "");

    s = s.replace(/\s*(-|—|–|·|\||\/)\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "");
    s = s.replace(/\s*(-|—|–|·|\||\/)\s*\d+(\.\d+)?\s*秒\b/g, "");

    s = s.replace(/duration\s*[:：]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "");
    s = s.replace(/时长\s*[:：]\s*\d+(\.\d+)?\s*秒\b/g, "");

    s = s.replace(/\b\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "");
    s = s.replace(/\b\d+(\.\d+)?\s*秒\b/g, "");

    s = s
      .replace(/\s{2,}/g, " ")
      .replace(/\s*[,，]\s*[,，]\s*/g, ", ")
      .replace(/\s+([,，:：;；])/g, "$1")
      .replace(/([,，:：;；])\s+/g, "$1 ")
      .trim();

    if (/^[,，:：;；\-—–·|/]+$/.test(s)) return "";
    return s;
  };

  const out: string[] = [];
  for (const line of src) {
    if (isDurationWholeLine(line)) continue;
    const cleaned = stripInline(line);
    if (!cleaned) continue;
    out.push(cleaned);
  }
  return out.join("\n");
}

/** 图片模式：只保留 T0，移除 T1/终点/End/Path 等 */
function stripT1ForImageMode(prompts: string): string {
  const lines = (prompts ?? "").split("\n");

  const isT1WholeLine = (s: string) => {
    const t = s.trim();
    if (!t) return false;
    const low = t.toLowerCase();

    if (/\bt\s*=\s*1\b/i.test(t)) return true;
    if (/\bt1\b/i.test(t)) return true;
    if (/\bkf1\b/i.test(t)) return true;
    if (/\bend\b/i.test(low)) return true;

    if (t.includes("终点") || t.includes("终帧") || t.includes("结束") || t.includes("结尾")) return true;
    if (t.includes("轨迹") || t.includes("路径")) return true;

    if (low.includes("start") && low.includes("end")) return true;

    return false;
  };

  const stripInlineT1 = (line: string) => {
    let s = line;

    s = s.replace(/(\bt\s*=\s*0\b.*?)(\s*(->|→|to)\s*.*)$/i, "$1");
    s = s.replace(/(\bt0\b.*?)(\s*(->|→|to)\s*.*)$/i, "$1");
    s = s.replace(/(起点.*?)(\s*(->|→|到|至)\s*.*)$/i, "$1");
    s = s.replace(/(\bstart\b.*?)(\s*(->|→|to)\s*.*)$/i, "$1");

    s = s.replace(/[(（][^)）]*\b(t1|t\s*=\s*1|end|kf1)\b[^)）]*[)）]/gi, "");
    s = s.replace(/[(（][^)）]*(终点|终帧|结束|结尾)[^)）]*[)）]/g, "");

    s = s.replace(/\bend\s*[:：]\s*[^,，;；]+/gi, "");
    s = s.replace(/\bt1\s*[:：]\s*[^,，;；]+/gi, "");
    s = s.replace(/\bt\s*=\s*1\s*[:：]\s*[^,，;；]+/gi, "");
    s = s.replace(/终点\s*[:：]\s*[^,，;；]+/g, "");

    s = s
      .replace(/\s{2,}/g, " ")
      .replace(/\s*[,，]\s*[,，]\s*/g, ", ")
      .replace(/\s+([,，:：;；])/g, "$1")
      .replace(/([,，:：;；])\s+/g, "$1 ")
      .trim();

    if (!s) return "";
    if (/^[,，:：;；\-—–·|/]+$/.test(s)) return "";
    return s;
  };

  const out: string[] = [];
  for (const raw of lines) {
    if (isT1WholeLine(raw)) continue;
    const cleaned = stripInlineT1(raw);
    if (!cleaned) continue;

    const low = cleaned.toLowerCase();
    if (/\bt1\b/.test(low) || /\bt\s*=\s*1\b/.test(low) || cleaned.includes("终点")) continue;

    out.push(cleaned);
  }

  return out.join("\n");
}

/**
 * ✅ 文案修正：
 * - 移除那句“不要引用任何颜色字段…”
 * - 第一行“图像/视频”按模式切换
 * - 将“# 分镜1/Scene 1”等标题前缀替换成当前分镜名字（保留 #）
 * - 去掉重复的“分镜标题行”（保留一个）
 */
function fixPromptCopy(input: string, lang: Lang, mediaMode: MediaMode, sceneTitle: string): string {
  const rawLines = (input ?? "").split("\n");

  const removedColor = rawLines.filter((l) => !l.includes("注意：不要引用任何颜色字段（color 不在 UI 中）"));

  const firstLineFix = removedColor.map((l, idx) => {
    if (idx !== 0) return l;

    if (lang === "zh") {
      return l.replace(/图像\s*\/\s*视频/g, mediaMode === "image" ? "图像" : "视频");
    }

    return l
      .replace(/image\s*\/\s*video/gi, mediaMode === "image" ? "image" : "video")
      .replace(/image\s+or\s+video/gi, mediaMode === "image" ? "image" : "video");
  });

  const zhHeadRe = /^(\s*#\s*)?分镜\s*#?\s*\d+\s*[:：]\s*/i;
  const enHeadRe = /^(\s*#\s*)?(scene|shot)\s*#?\s*\d+\s*[:：]\s*/i;

  const replacedHeaderLines = firstLineFix.map((line) => {
    const t = line.trim();
    if (!t) return line;

    const m = line.match(/^(\s*#\s*)/);
    const prefix = m ? m[1] : "";

    if (zhHeadRe.test(t)) {
      const tail = line.replace(/^(\s*#\s*)?/, "").replace(zhHeadRe, "").trim();

      let tail2 = tail;
      if (tail2.startsWith(sceneTitle)) {
        tail2 = tail2.slice(sceneTitle.length).trim();
      }
      tail2 = tail2.replace(/^[:：\-—–]\s*/, "").trim();

      return `${prefix}${sceneTitle}${tail2 ? " " + tail2 : ""}`.trimEnd();
    }

    if (enHeadRe.test(t)) {
      const tail = line.replace(/^(\s*#\s*)?/, "").replace(enHeadRe, "").trim();

      let tail2 = tail;
      if (tail2.toLowerCase().startsWith(sceneTitle.toLowerCase())) {
        tail2 = tail2.slice(sceneTitle.length).trim();
      }
      tail2 = tail2.replace(/^[:：\-—–]\s*/, "").trim();

      return `${prefix}${sceneTitle}${tail2 ? " " + tail2 : ""}`.trimEnd();
    }

    return line;
  });

  let seenHeader = false;
  const dedupHeaders = replacedHeaderLines.filter((l) => {
    const t = l.trim();
    if (!t) return true;

    const noHash = t.replace(/^#\s*/, "");
    const isHeader = /^分镜\b/.test(noHash) || /^(scene|shot)\b/i.test(noHash) || noHash === sceneTitle;

    if (!isHeader) return true;

    if (!seenHeader) {
      seenHeader = true;
      return true;
    }
    return false;
  });

  return dedupHeaders.join("\n");
}

function limitRefLinks(raw: string, max: number): string {
  const lines = (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.slice(0, max).join("\n");
}

function safeName(input: string): string {
  return (input ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);
}

function ymd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function splitRefs(raw: string, max: number) {
  return (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function refTypeByIndex(i: number): "identity" | "appearance" | "style" {
  if (i === 0) return "identity";
  if (i === 1) return "appearance";
  return "style";
}

function refShort(type: "identity" | "appearance" | "style") {
  if (type === "identity") return "id";
  if (type === "appearance") return "app";
  return "style";
}

function extFromRef(ref: string) {
  const clean = ref.split("?")[0].trim();
  const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : "jpg";
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

type FlowFile = { path: string; content: string };

async function writeTextToDirectory(dirHandle: any, fullPath: string, content: string) {
  const parts = fullPath.split("/").filter(Boolean);
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  const file = await current.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

export function ExportPanel({ lang, project, sceneIdx, selectedLayerId }: Props) {
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [platformPresetId, setPlatformPresetId] = useState<PlatformPresetId>("universal");
  const [exportMode, setExportMode] = useState<"quick" | "pro">("quick");
  const [flowMode, setFlowMode] = useState<FlowMode>("two-step");
  const [qualityMode, setQualityMode] = useState<"balanced" | "quality" | "cost">("balanced");

  const scenes = project.scenes ?? [];
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIdx] ?? null;

  const mediaMode: MediaMode = useMemo(() => parseMediaModeFromNotes(currentScene?.notes), [currentScene?.notes]);
  const sceneGenMode: GenMode = useMemo(() => parseGenModeFromNotes(currentScene?.notes), [currentScene?.notes]);
  useEffect(() => {
    setExportMode(sceneGenMode);
  }, [sceneGenMode]);

  const platformPreset = useMemo(
    () => PLATFORM_PRESETS.find((p) => p.id === platformPresetId) ?? PLATFORM_PRESETS[0],
    [platformPresetId]
  );
  const exportProfile = platformPreset.profile;

  // ✅ 只导出当前分镜 prompts
  const promptProject = useMemo<Project>(() => {
    if (!currentScene) return { ...project, scenes: [] };
    const modeLimit = exportMode === "quick" ? 2 : 6;
    const refLimit = Math.min(modeLimit, platformPreset.maxRefsPerObject);
    const nextScene = {
      ...currentScene,
      layers: (currentScene.layers ?? []).map((l) => ({
        ...l,
        referenceLinks: limitRefLinks(l.referenceLinks ?? "", refLimit)
      }))
    };
    return { ...project, scenes: [nextScene] };
  }, [project, currentScene, exportMode, platformPreset.maxRefsPerObject]);

  const sceneTitle = useMemo(() => {
    if (!currentScene) return lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`;
    return (currentScene.name ?? "").trim() || currentScene.id || (lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`);
  }, [currentScene, lang, safeIdx]);

  const rawPrompts = useMemo(() => {
    void selectedLayerId;
    void safeIdx;
    // ✅ 关键：按模式生成不同末尾坐标解释（机器语言块）
    return generatePrompts(promptProject, lang, exportProfile);
  }, [promptProject, lang, safeIdx, selectedLayerId, exportProfile]);

  const prompts = useMemo(() => {
    // 先分离“机器语言/控制层块”，只修正文案/裁剪 main，notes 保持原样
    const { main: main0, notes } = splitMachineNotes(rawPrompts);

    let main = main0;

    if (mediaMode === "image") {
      main = stripDurationForImageMode(main);
      main = stripT1ForImageMode(main);
    }

    main = fixPromptCopy(main, lang, mediaMode, sceneTitle);

    // 重新拼回去（复制/导出保持完整）
    return notes ? `${main.trimEnd()}\n\n${notes.trimEnd()}\n` : `${main.trimEnd()}\n`;
  }, [rawPrompts, mediaMode, lang, sceneTitle]);

  const { main: promptsMain, notes: promptsNotes } = useMemo(() => splitMachineNotes(prompts), [prompts]);
  const profileHint = useMemo(() => {
    if (lang === "zh") {
      const uploadHint = platformPreset.uploadMode === "upload-first" ? "先上传参考图再粘贴提示词。" : "先粘贴提示词再补图。";
      const styleHint = platformPreset.promptStyle === "short" ? "建议短句高密度关键词。" : "建议分段结构化描述。";
      return `${platformPreset.labelZh}：${uploadHint}${styleHint}`;
    }
    const uploadHint =
      platformPreset.uploadMode === "upload-first"
        ? "Upload reference images first, then paste prompts."
        : "Paste prompts first, then upload references.";
    const styleHint = platformPreset.promptStyle === "short" ? "Use short dense keywords." : "Use sectioned structured text.";
    return `${platformPreset.labelEn}: ${uploadHint} ${styleHint}`;
  }, [platformPreset, lang]);
  const platformUrl = platformPreset.url;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove(); // ✅ 标准方式移除
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    }
  }

  const flowBundle = useMemo(() => {
    const scene = promptProject.scenes?.[0];
    const layers = scene?.layers ?? [];
    const objects = layers.map((layer, idx) => {
      const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
      const refs = splitRefs(layer.referenceLinks ?? "", platformPreset.maxRefsPerObject);
      const refItems = refs.map((ref, i) => {
        const type = refTypeByIndex(i);
        const ext = extFromRef(ref);
        const fileName = `${code}__${refShort(type)}__${String(i + 1).padStart(2, "0")}.${ext}`;
        return { source: ref, type, fileName };
      });
      return {
        code,
        layerId: layer.id,
        type: (layer.type ?? "").trim(),
        look: (layer.look ?? "").trim(),
        notes: (layer.notes ?? "").trim(),
        refItems
      };
    });

    const now = ymd();
    const projectName = safeName(`project_${project.project?.mode ?? "storyboard"}`);
    const sceneName = safeName(sceneTitle || "Scene");
    const rootDir = `ScenePilot_${projectName}_${sceneName}_${now}`;
    const modeLabelZh = flowMode === "two-step" ? "稳妥高质（两步）" : "极速直出（一次）";
    const modeLabelEn = flowMode === "two-step" ? "Stable Quality (Two-step)" : "Fast Direct (One-pass)";

    const usageGuide = lang === "zh"
      ? [
          "ScenePilot 导出流程先看我",
          "",
          `平台：${platformPreset.labelZh}`,
          `生成方式：${modeLabelZh}`,
          "",
          "步骤：",
          "1) 打开 01_对象参考包/对象参考包.txt，复制并粘贴到目标平台。",
          "2) 按 02_素材图片_按此顺序上传/ 的目录顺序上传本地素材。",
          flowMode === "two-step"
            ? "3) 上传完成后，打开 03_分镜提示词包/分镜提示词_逐条复制.txt，逐条复制生成。"
            : "3) 打开 03_分镜提示词包/分镜提示词_整段版.txt，一次粘贴执行。",
          "",
          "说明：",
          "- 本流程不调用 API，不上传到云端。",
          "- 文件名已包含对象代号，可按对象对齐上传。",
          "- 结构化字段优先于风格形容词。"
        ].join("\n")
      : [
          "ScenePilot Export Workflow",
          "",
          `Platform: ${platformPreset.labelEn}`,
          `Mode: ${modeLabelEn}`,
          "",
          "Steps:",
          "1) Open 01_对象参考包/对象参考包.txt and paste it to your target platform.",
          "2) Upload local assets in folder order under 02_素材图片_按此顺序上传/.",
          flowMode === "two-step"
            ? "3) After upload, open 03_分镜提示词包/分镜提示词_逐条复制.txt and copy per shot."
            : "3) Open 03_分镜提示词包/分镜提示词_整段版.txt and paste once.",
          "",
          "Notes:",
          "- No API call and no cloud image hosting.",
          "- Filenames already include object codes.",
          "- Structural constraints override style adjectives."
        ].join("\n");

    const objectRefText = [
      lang === "zh" ? "对象参考包" : "Object Reference Pack",
      "",
      lang === "zh"
        ? `平台：${platformPreset.labelZh}  |  模式：${modeLabelZh}`
        : `Platform: ${platformPreset.labelEn} | Mode: ${modeLabelEn}`,
      "",
      ...objects.flatMap((obj) => {
        const head =
          lang === "zh"
            ? `# ${obj.code} (${obj.layerId})`
            : `# ${obj.code} (${obj.layerId})`;
        const lines = [
          head,
          obj.type ? (lang === "zh" ? `- 类型: ${obj.type}` : `- Type: ${obj.type}`) : "",
          obj.look ? (lang === "zh" ? `- 外观: ${obj.look}` : `- Look: ${obj.look}`) : "",
          obj.notes ? (lang === "zh" ? `- 备注: ${obj.notes}` : `- Notes: ${obj.notes}`) : "",
          obj.refItems.length
            ? lang === "zh"
              ? `- 参考文件: ${obj.refItems.map((r) => `${r.fileName}(${r.type})`).join(", ")}`
              : `- Ref files: ${obj.refItems.map((r) => `${r.fileName}(${r.type})`).join(", ")}`
            : lang === "zh"
              ? "- 参考文件: 无（仅文本描述）"
              : "- Ref files: none (text-only fallback)"
        ].filter(Boolean);
        return [...lines, ""];
      })
    ].join("\n");

    const uploadChecklist = [
      lang === "zh" ? "素材上传清单（按顺序）" : "Asset Upload Checklist (ordered)",
      "",
      ...objects.flatMap((obj) => {
        const lines = [lang === "zh" ? `${obj.code} / ${obj.layerId}` : `${obj.code} / ${obj.layerId}`];
        if (!obj.refItems.length) {
          lines.push(lang === "zh" ? "- 无本地参考图，跳过上传。" : "- No local refs, skip upload.");
          return [...lines, ""];
        }
        obj.refItems.forEach((ref, index) => {
          const typeZh = ref.type === "identity" ? "身份" : ref.type === "appearance" ? "外观" : "风格";
          const typeEn = ref.type;
          lines.push(
            lang === "zh"
              ? `${index + 1}. [ ] 上传 ${ref.fileName}（${typeZh}）`
              : `${index + 1}. [ ] Upload ${ref.fileName} (${typeEn})`
          );
          lines.push(lang === "zh" ? `    来源：${ref.source}` : `    Source: ${ref.source}`);
        });
        return [...lines, ""];
      })
    ].join("\n");

    const promptsPerShot = promptsMain;
    const promptsCombined =
      flowMode === "two-step"
        ? [
            lang === "zh" ? "第二步：分镜提示词" : "Step 2: Storyboard Prompt",
            "",
            promptsMain
          ].join("\n")
        : [
            lang === "zh" ? "一次直出：对象参考 + 分镜提示词" : "One-pass: Object Refs + Storyboard Prompt",
            "",
            objectRefText,
            "",
            promptsMain
          ].join("\n");

    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      platform: platformPreset.id,
      profile: exportProfile,
      flowMode,
      exportMode,
      qualityMode,
      project: projectName,
      scene: sceneTitle,
      objects: objects.map((obj) => ({
        code: obj.code,
        layerId: obj.layerId,
        type: obj.type,
        look: obj.look,
        notes: obj.notes,
        refs: obj.refItems
      }))
    };

    const assetFolderFiles: FlowFile[] = objects.flatMap((obj) => {
      const buckets: Array<{ key: "identity" | "appearance" | "style"; dir: string }> = [
        { key: "identity", dir: "01_identity" },
        { key: "appearance", dir: "02_appearance" },
        { key: "style", dir: "03_style" }
      ];
      return buckets.map((bucket) => {
        const refs = obj.refItems.filter((r) => r.type === bucket.key);
        const lines = [
          lang === "zh" ? `${obj.code} ${bucket.dir} 上传说明` : `${obj.code} ${bucket.dir} Upload Notes`,
          "",
          refs.length
            ? lang === "zh"
              ? "建议文件名顺序："
              : "Recommended filename order:"
            : lang === "zh"
              ? "当前无该分类参考图，可跳过。"
              : "No references in this category. You can skip."
        ];
        refs.forEach((r, idx) => {
          lines.push(`${idx + 1}. ${r.fileName}`);
        });
        return {
          path: `02_素材图片_按此顺序上传/${obj.code}/${bucket.dir}/上传说明.txt`,
          content: lines.join("\n")
        };
      });
    });

    const files: FlowFile[] = [
      { path: "00_先看我.txt", content: usageGuide },
      { path: "01_对象参考包/对象参考包.txt", content: objectRefText },
      { path: "01_对象参考包/对象上传清单.txt", content: uploadChecklist },
      ...assetFolderFiles,
      { path: "03_分镜提示词包/分镜提示词_逐条复制.txt", content: promptsPerShot },
      { path: "03_分镜提示词包/分镜提示词_整段版.txt", content: promptsCombined },
      { path: "99_manifest/manifest.json", content: JSON.stringify(manifest, null, 2) }
    ];

    return {
      rootDir,
      objectRefText,
      promptsPerShot,
      promptsCombined,
      files
    };
  }, [
    promptProject.scenes,
    platformPreset,
    project.project?.mode,
    sceneTitle,
    flowMode,
    lang,
    promptsMain,
    exportProfile,
    exportMode,
    qualityMode
  ]);

  async function exportFlowPackage() {
    const hasDirPicker = typeof window !== "undefined" && "showDirectoryPicker" in window;
    if (hasDirPicker) {
      try {
        const picker = (window as any).showDirectoryPicker;
        const pickedDir = await picker({ mode: "readwrite" });
        const root = await pickedDir.getDirectoryHandle(flowBundle.rootDir, { create: true });
        for (const file of flowBundle.files) {
          await writeTextToDirectory(root, file.path, file.content);
        }
        return;
      } catch {
        // fallback to downloads
      }
    }
    for (const file of flowBundle.files) {
      downloadTextFile(`${flowBundle.rootDir}__${file.path.replaceAll("/", "__")}`, file.content);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <div style={styles.title}>{tAny(lang, "export.title")}</div>

        <div style={styles.sceneHint} title={currentScene?.id ?? ""}>
          {sceneTitle}
        </div>

        <div style={styles.modeHint}>
          {lang === "zh" ? (mediaMode === "image" ? "图片" : "视频") : mediaMode === "image" ? "Image" : "Video"}
        </div>

        <div style={{ flex: 1 }} />

        <button
          style={styles.btnPrimary}
          onClick={() => setShowExportModal(true)}
          type="button"
          title={lang === "zh" ? "选择导出条件并仅复制提示词" : "Choose export conditions and copy prompt only"}
        >
          {copied ? tAny(lang, "common.copied") : lang === "zh" ? "导出" : "Export"}
        </button>
      </div>
      <div style={styles.platformTips}>
        {CURRENT_PLATFORM_MODE === "export-only"
          ? lang === "zh"
            ? "当前模式：仅导出，不调用 API，不直接生成图像/视频。"
            : "Current mode: export-only. No API calls, no direct image/video generation."
          : ""}
        <br />
        {profileHint}
        <br />
        {lang === "zh"
          ? mediaMode === "video"
            ? "视频实用：先确认 t0/t1 轨迹，再粘贴到平台，必要时分镜拆段生成。"
            : "图片实用：先锁对象位置和数量，再做风格增强，避免一次改太多变量。"
          : mediaMode === "video"
            ? "Video tip: lock t0/t1 trajectory first, then paste prompt; split long shots when needed."
            : "Image tip: lock object positions/count first, then add style enhancements in a second pass."}
      </div>

      <div style={styles.preWrap}>
        <pre style={styles.pre}>{promptsMain}</pre>
        {promptsNotes ? <pre style={styles.preNotes}>{promptsNotes}</pre> : null}
      </div>

      {showExportModal && (
        <div style={styles.floatingPanel}>
          <div style={styles.modalTitle}>{lang === "zh" ? "导出条件" : "Export Conditions"}</div>
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "平台" : "Platform"}</div>
            <div style={styles.optionWrap}>
              {PLATFORM_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformPresetId(p.id)}
                  style={{ ...styles.optionBtn, ...(platformPresetId === p.id ? styles.optionBtnOn : {}) }}
                >
                  {lang === "zh" ? p.labelZh : p.labelEn}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "流程" : "Flow"}</div>
            <div style={styles.optionWrap}>
              <button
                type="button"
                onClick={() => setFlowMode("one-pass")}
                style={{ ...styles.optionBtn, ...(flowMode === "one-pass" ? styles.optionBtnOn : {}) }}
              >
                {lang === "zh" ? "极速直出（一次）" : "Fast Direct (One-pass)"}
              </button>
              <button
                type="button"
                onClick={() => setFlowMode("two-step")}
                style={{ ...styles.optionBtn, ...(flowMode === "two-step" ? styles.optionBtnOn : {}) }}
              >
                {lang === "zh" ? "稳妥高质（两步）" : "Stable Quality (Two-step)"}
              </button>
            </div>
          </div>
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "模式" : "Mode"}</div>
            <div style={styles.optionWrap}>
              <button
                type="button"
                onClick={() => setExportMode("quick")}
                style={{ ...styles.optionBtn, ...(exportMode === "quick" ? styles.optionBtnOn : {}) }}
              >
                {lang === "zh" ? "Quick" : "Quick"}
              </button>
              <button
                type="button"
                onClick={() => setExportMode("pro")}
                style={{ ...styles.optionBtn, ...(exportMode === "pro" ? styles.optionBtnOn : {}) }}
              >
                {lang === "zh" ? "PRO" : "PRO"}
              </button>
            </div>
          </div>
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "策略" : "Strategy"}</div>
            <div style={styles.optionWrap}>
              {(["balanced", "quality", "cost"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setQualityMode(m)}
                  style={{ ...styles.optionBtn, ...(qualityMode === m ? styles.optionBtnOn : {}) }}
                >
                  {m === "balanced" ? (lang === "zh" ? "平衡" : "Balanced") : m === "quality" ? (lang === "zh" ? "质量" : "Quality") : lang === "zh" ? "成本" : "Cost"}
                </button>
              ))}
            </div>
          </div>
          <div style={styles.platformTips}>
            {lang === "zh"
              ? `仅复制提示词，不会发起生成请求。当前：${exportMode.toUpperCase()} / ${qualityMode} / ${flowMode === "two-step" ? "两步" : "一步"}`
              : `Prompt copy only, no generation request. Current: ${exportMode.toUpperCase()} / ${qualityMode} / ${flowMode === "two-step" ? "two-step" : "one-pass"}`}
          </div>
          <div style={styles.modalBtns}>
            <button style={styles.btnGhost} onClick={() => setShowExportModal(false)} type="button">
              {lang === "zh" ? "关闭" : "Close"}
            </button>
            {platformUrl ? (
              <button style={styles.btnGhost} onClick={() => window.open(platformUrl, "_blank", "noopener,noreferrer")} type="button">
                {lang === "zh" ? "前往平台" : "Open Platform"}
              </button>
            ) : null}
            <button
              style={styles.btnGhost}
              onClick={async () => {
                await copy(flowBundle.objectRefText);
              }}
              type="button"
            >
              {lang === "zh" ? "复制对象参考包" : "Copy Object Pack"}
            </button>
            <button
              style={styles.btnGhost}
              onClick={async () => {
                await copy(flowMode === "two-step" ? flowBundle.promptsPerShot : flowBundle.promptsCombined);
              }}
              type="button"
            >
              {lang === "zh" ? "复制分镜提示词包" : "Copy Storyboard Pack"}
            </button>
            <button
              style={styles.btnGhost}
              onClick={async () => {
                await exportFlowPackage();
              }}
              type="button"
            >
              {lang === "zh" ? "导出流程目录包" : "Export Workflow Folder"}
            </button>
            <button
              style={styles.btnPrimary}
              onClick={async () => {
                await copy(prompts);
                setShowExportModal(false);
              }}
              type="button"
            >
              {lang === "zh" ? "仅复制提示词" : "Copy Prompt Only"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: 10,
    minHeight: 170,
    height: "min(38vh, 340px)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "rgba(0,0,0,0.10)",
    position: "relative"
  },

  head: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontWeight: 900, fontSize: 13, opacity: 0.95 },

  sceneHint: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.68,
    padding: "4px 8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    maxWidth: 260,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: 1.25
  },

  modeHint: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.66,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    userSelect: "none"
  },

  tab: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent" as any
  },

  tabOff: {
    opacity: 0.72,
    borderColor: "rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)"
  },

  tabOn: {
    opacity: 1,
    borderColor: "rgba(120,180,255,0.60)",
    background: "rgba(120,180,255,0.14)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.10) inset"
  },

  btnPrimary: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent" as any
  },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent" as any
  },
  profileRow: { display: "flex", alignItems: "center", gap: 8 },
  profileLabel: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.72,
    width: 72,
    flexShrink: 0
  },
  profileSelect: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 10px",
    fontSize: 12
  },
  platformTips: {
    fontSize: 11,
    lineHeight: 1.4,
    opacity: 0.7,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    padding: "8px 10px"
  },
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 560,
    maxWidth: "100%",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(16,20,34,0.96)",
    boxShadow: "0 16px 56px rgba(0,0,0,0.45)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  modalTitle: { fontWeight: 900, fontSize: 13, opacity: 0.95 },
  modalRow: { display: "flex", alignItems: "center", gap: 8 },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  floatingPanel: {
    position: "absolute",
    right: 10,
    top: 44,
    width: 520,
    maxWidth: "calc(100% - 20px)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(12,16,30,0.97)",
    boxShadow: "0 14px 52px rgba(0,0,0,0.45)",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 40
  },
  optionWrap: { display: "flex", flexWrap: "wrap", gap: 6, flex: 1 },
  optionBtn: {
    padding: "5px 8px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 800,
    outline: "none"
  },
  optionBtnOn: {
    border: "1px solid rgba(120,180,255,0.68)",
    background: "rgba(120,180,255,0.14)"
  },

  preWrap: {
    flex: 1,
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflow: "auto"
  },

  pre: {
    flex: "0 0 auto",
    margin: 0,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    lineHeight: 1.35
  },

  // ✅ 末尾机器语言/控制层：略暗显示（但复制仍包含）
  preNotes: {
    flex: "0 0 auto",
    margin: 0,
    padding: 10,
    borderRadius: 12,
    border: "1px dashed rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    lineHeight: 1.35,
    opacity: 0.55
  }
};
