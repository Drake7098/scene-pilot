import React, { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { tAny } from "../i18n";
import type { Project } from "../model";
import { generatePrompts } from "../utils/prompt";
import type { PromptProfile } from "../utils/prompt";
import { getRefBlob } from "../utils/localRefs";
import { detectSceneConflicts, type PromptConflict } from "../utils/conflictRules";
import { UI_FONT, UI_OPACITY, UI_SIZE } from "../uiTokens";

type Props = {
  lang: Lang;
  project: Project;
  projectLabel?: string;
  sceneIdx: number;
  selectedLayerId: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
};

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

type MediaMode = "image" | "video";
type GenMode = "quick" | "pro";

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

function refShort(type: "identity" | "appearance" | "style") {
  if (type === "identity") return "id";
  if (type === "appearance") return "app";
  return "style";
}

function extFromName(name: string) {
  const m = (name ?? "").trim().match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : "jpg";
}

function extractShotSection(main: string): string {
  const lines = (main ?? "").split("\n");
  const idx = lines.findIndex((l) => l.trim().startsWith("# "));
  if (idx >= 0) return lines.slice(idx).join("\n").trim();
  return (main ?? "").trim();
}

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

function insertAfterHeader(shotSection: string, injectedLines: string[]): string {
  if (!injectedLines.length) return shotSection.trim();
  const lines = (shotSection ?? "").split("\n");
  if (lines.length && lines[0].trim().startsWith("# ")) {
    return [lines[0], "", ...injectedLines, "", ...lines.slice(1)].join("\n").trim();
  }
  return [...injectedLines, "", ...lines].join("\n").trim();
}

function stripAttachmentLines(text: string): string {
  return (text ?? "")
    .split("\n")
    .filter((line) => !/附件照片|attachments/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type FlowFile = { path: string; content: string };
type FlowBlobFile = { path: string; refId: string };
type ZipEntry = { path: string; data: Uint8Array };
const OBJECT_REF_LIMIT = 1;

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16LE(v: number): Uint8Array {
  return new Uint8Array([v & 255, (v >>> 8) & 255]);
}

function u32LE(v: number): Uint8Array {
  return new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function buildZipStored(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path.replace(/^\/+/, ""));
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length >>> 0;
    const flags = 0x0800; // UTF-8 filename

    const localHeader = concatBytes([
      u32LE(0x04034b50),
      u16LE(20),
      u16LE(flags),
      u16LE(0), // store
      u16LE(0),
      u16LE(0),
      u32LE(crc),
      u32LE(size),
      u32LE(size),
      u16LE(name.length),
      u16LE(0),
      name
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      u32LE(0x02014b50),
      u16LE(20),
      u16LE(20),
      u16LE(flags),
      u16LE(0), // store
      u16LE(0),
      u16LE(0),
      u32LE(crc),
      u32LE(size),
      u32LE(size),
      u16LE(name.length),
      u16LE(0),
      u16LE(0),
      u16LE(0),
      u16LE(0),
      u32LE(0),
      u32LE(localOffset),
      name
    ]);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const localBlob = concatBytes(localParts);
  const eocd = concatBytes([
    u32LE(0x06054b50),
    u16LE(0),
    u16LE(0),
    u16LE(entries.length),
    u16LE(entries.length),
    u32LE(centralDirectory.length),
    u32LE(localBlob.length),
    u16LE(0)
  ]);

  return new Blob([toArrayBuffer(localBlob), toArrayBuffer(centralDirectory), toArrayBuffer(eocd)], { type: "application/zip" });
}

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

async function writeBlobToDirectory(dirHandle: any, fullPath: string, blob: Blob) {
  const parts = fullPath.split("/").filter(Boolean);
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  const file = await current.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function ExportPanel({ lang, project, projectLabel, sceneIdx, selectedLayerId, onJumpToConflict }: Props) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportDiff, setShowExportDiff] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflictAction, setPendingConflictAction] = useState<null | "copy" | "save">(null);
  const [pendingConflicts, setPendingConflicts] = useState<PromptConflict[]>([]);
  const [showSaveHint, setShowSaveHint] = useState(false);
  const [actionHint, setActionHint] = useState("");
  const [platformPresetId, setPlatformPresetId] = useState<PlatformPresetId>("universal");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportFolderLabel, setExportFolderLabel] = useState("");
  const [exportResultType, setExportResultType] = useState<"none" | "dir" | "zip">("none");
  const canSaveDirectory = typeof window !== "undefined" && "showDirectoryPicker" in window;

  const scenes = project.scenes ?? [];
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIdx] ?? null;

  const mediaMode: MediaMode = useMemo(() => parseMediaModeFromNotes(currentScene?.notes), [currentScene?.notes]);
  const sceneGenMode: GenMode = useMemo(() => parseGenModeFromNotes(currentScene?.notes), [currentScene?.notes]);
  void sceneGenMode;

  const platformPreset = useMemo(
    () => PLATFORM_PRESETS.find((p) => p.id === platformPresetId) ?? PLATFORM_PRESETS[0],
    [platformPresetId]
  );
  const exportProfile = platformPreset.profile;

  // ✅ 只导出当前分镜 prompts
  const promptProject = useMemo<Project>(() => {
    const refLimit = OBJECT_REF_LIMIT;
    const sourceScenes = currentScene ? [currentScene] : [];
    const nextScenes = sourceScenes.map((s) => ({
      ...s,
      layers: (s.layers ?? []).map((l) => ({
        ...l,
        referenceLinks: limitRefLinks(l.referenceLinks ?? "", refLimit)
      }))
    }));
    return { ...project, scenes: nextScenes };
  }, [project, currentScene]);

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
  const promptsMainWithRefs = useMemo(() => {
    const scene = currentScene;
    if (!scene) return promptsMain;
    const sceneTag = String(scene.index ?? safeIdx + 1).padStart(2, "0");
    const bgFileName = scene.backgroundRef?.id
      ? `${sceneTag}__BG__${safeName(scene.backgroundRef.name || `background.${extFromName(scene.backgroundRef.name || "")}`)}`
      : "";
    const objRefLines = (scene.layers ?? []).flatMap((layer, idx) => {
      const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
      const localRefs = (layer.localRefs ?? []).slice(0, OBJECT_REF_LIMIT);
      return localRefs.map((ref, i) => {
        const fileName = `${sceneTag}_${code}__${refShort(ref.type)}__${String(i + 1).padStart(2, "0")}.${extFromName(ref.name)}`;
        return lang === "zh"
          ? `- 对象 ${layer.id} 参考图见附件照片，名字：${fileName}`
          : `- Object ${layer.id} reference image is in attachments, name: ${fileName}`;
      });
    });
    const refLines = [
      ...(bgFileName
        ? [
            lang === "zh"
              ? `- 本分镜参考图见附件照片，名字：${bgFileName}`
              : `- Shot background reference image is in attachments, name: ${bgFileName}`
          ]
        : []),
      ...objRefLines
    ];

    const shotSection = extractShotSection(promptsMain);
    const mergedShot = insertAfterHeader(collapseStaticKeyframes(shotSection, lang), refLines);
    const constraintTail = lang === "zh"
      ? [
          "生成约束：",
          "- 保持对象数量、对象身份与相对位置，不得新增/删除主体。",
          "- 先结构后风格；不重排构图。",
          "- no subtitles / no overlays / no text / no numbers."
        ].join("\n")
      : [
          "Generation constraints:",
          "- Keep object count, identity, and relative layout. Do not add/remove subjects.",
          "- Structure first, style second; do not re-layout composition.",
          "- no subtitles / no overlays / no text / no numbers."
        ].join("\n");

    return [mergedShot, constraintTail].join("\n\n").trim();
  }, [currentScene, promptsMain, safeIdx, lang]);
  const quickCopyPrompt = useMemo(() => stripAttachmentLines(promptsMainWithRefs), [promptsMainWithRefs]);
  const sceneConflicts = useMemo(() => {
    if (!currentScene) return [];
    return detectSceneConflicts(currentScene, lang);
  }, [currentScene, lang]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove(); // ✅ 标准方式移除
    }
  }

  useEffect(() => {
    if (!actionHint) return;
    const t = window.setTimeout(() => setActionHint(""), 1800);
    return () => window.clearTimeout(t);
  }, [actionHint]);

  async function runCopyPrompt() {
    await copy(quickCopyPrompt);
    setActionHint(lang === "zh" ? "已复制文字提示词（不含附件引用）" : "Copied text-only prompt (no attachment lines)");
  }

  function runOpenSaveModal() {
    setShowExportModal(true);
    setExportDone(false);
    setExportResultType("none");
    setExportFolderLabel("");
  }

  async function guardBeforeExport(action: "copy" | "save") {
    if (!sceneConflicts.length) {
      if (action === "copy") await runCopyPrompt();
      else runOpenSaveModal();
      return;
    }
    setPendingConflictAction(action);
    setPendingConflicts(sceneConflicts);
    setShowConflictModal(true);
  }

  const flowBundle = useMemo(() => {
    const scenesToExport = promptProject.scenes ?? [];
    const sceneBackgrounds = scenesToExport
      .map((scene, sceneOrder) => {
        const bgRef = scene.backgroundRef;
        if (!bgRef?.id) return null;
        const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
        const ext = extFromName(bgRef.name);
        const fileName = `${sceneTag}__BG__${safeName(bgRef.name || `background.${ext}`)}`;
        return {
          sceneTag,
          sceneName: scene.name ?? scene.id,
          fileName,
          refId: bgRef.id
        };
      })
      .filter(Boolean) as Array<{ sceneTag: string; sceneName: string; fileName: string; refId: string }>;

    const objects = scenesToExport.flatMap((scene, sceneOrder) =>
      (scene.layers ?? []).map((layer, idx) => {
      const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
      const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
      const localRefs = (layer.localRefs ?? []).slice(0, OBJECT_REF_LIMIT);
      const refItems = localRefs.map((ref, i) => {
        const type = ref.type;
        const ext = extFromName(ref.name);
        const fileName = `${sceneTag}_${code}__${refShort(type)}__${String(i + 1).padStart(2, "0")}.${ext}`;
        return { source: `local:${ref.name}`, type, fileName, refId: ref.id };
      });
      return {
        sceneTag,
        sceneName: scene.name ?? scene.id,
        code,
        layerId: layer.id,
        type: (layer.type ?? "").trim(),
        look: (layer.look ?? "").trim(),
        notes: (layer.notes ?? "").trim(),
        referencePolicy: layer.referencePolicy ?? "optional",
        refItems
      };
    }));

    const projectNameForFile = safeName(projectLabel || (lang === "zh" ? "未命名项目" : "Untitled"));
    const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
    const platformForFile = safeName(lang === "zh" ? platformPreset.labelZh : platformPreset.labelEn);
    const rootDir = "ScenePilotix";
    const projectDir = projectNameForFile || (lang === "zh" ? "未命名项目" : "Untitled");
    const modeLabelZh = "稳妥高质（两步）";
    const modeLabelEn = "Stable Quality (Two-step)";

    const usageGuide = lang === "zh"
      ? [
          "ScenePilotix 保存说明与提示词",
          "",
          `平台：${platformPreset.labelZh}`,
          `导出方式：${modeLabelZh}`,
          "",
          "【红字提醒】以下提醒不要复制到大模型，仅供操作指引。",
          "【红字提醒】先上传目录中的参考图，再复制分隔线下方提示词进行生成。",
          "________________________________________",
          "以下为可复制提示词：",
          "",
          "说明：",
          "- 不调用 API，不上传云端。",
          "- 对象若没图，不会导出空图片文件。",
          "- 分镜背景参考图为可选项，不填也可导出。"
        ].join("\n")
      : [
          "ScenePilotix Save Guide & Prompt",
          "",
          `Platform: ${platformPreset.labelEn}`,
          `Flow: ${modeLabelEn}`,
          "",
          "[RED NOTICE] Do not copy reminders below to model input.",
          "[RED NOTICE] Upload references first, then copy prompt below the divider.",
          "________________________________________",
          "Copyable prompt starts below:",
          "",
          "Notes:",
          "- No API call, no cloud upload.",
          "- Objects with no images won't generate empty files.",
          "- Shot background references are optional."
        ].join("\n");

    const objectRefText = [
      lang === "zh" ? "对象参考包" : "Object Reference Pack",
      "",
      lang === "zh"
        ? `平台：${platformPreset.labelZh}  |  模式：${modeLabelZh}`
        : `Platform: ${platformPreset.labelEn} | Mode: ${modeLabelEn}`,
      "",
      lang === "zh" ? "## 分镜背景参考图" : "## Shot Background Refs",
      ...(
        sceneBackgrounds.length
          ? sceneBackgrounds.flatMap((bg) => [
              lang === "zh"
                ? `- [${bg.sceneTag}] ${bg.sceneName} -> ${bg.fileName}`
                : `- [${bg.sceneTag}] ${bg.sceneName} -> ${bg.fileName}`
            ])
          : [lang === "zh" ? "- 无" : "- None"]
      ),
      "",
      lang === "zh" ? "## 对象参考图" : "## Object Refs",
      "",
      ...objects.flatMap((obj) => {
        const head =
          lang === "zh"
            ? `# [${obj.sceneTag}] ${obj.sceneName} / ${obj.code} (${obj.layerId})`
            : `# [${obj.sceneTag}] ${obj.sceneName} / ${obj.code} (${obj.layerId})`;
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
          ,
          lang === "zh"
            ? `- 参考图策略: ${obj.referencePolicy === "required" ? "必须带图" : "可选"}`
            : `- Ref policy: ${obj.referencePolicy === "required" ? "required" : "optional"}`
        ].filter(Boolean);
        return [...lines, ""];
      })
    ].join("\n");

    const uploadChecklist = [
      lang === "zh" ? "素材上传清单（按顺序）" : "Asset Upload Checklist (ordered)",
      "",
      lang === "zh" ? "A. 分镜背景参考图（可选）" : "A. Shot background refs (optional)",
      ...(
        sceneBackgrounds.length
          ? sceneBackgrounds.map((bg, index) =>
              lang === "zh"
                ? `${index + 1}. [ ] 上传 ${bg.fileName}（分镜 ${bg.sceneTag}）`
                : `${index + 1}. [ ] Upload ${bg.fileName} (shot ${bg.sceneTag})`
            )
          : [lang === "zh" ? "- 无背景参考图，跳过。" : "- No background refs, skip."]
      ),
      "",
      lang === "zh" ? "B. 对象参考图" : "B. Object refs",
      "",
      ...objects.flatMap((obj) => {
        const lines = [lang === "zh" ? `[${obj.sceneTag}] ${obj.code} / ${obj.layerId}` : `[${obj.sceneTag}] ${obj.code} / ${obj.layerId}`];
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

    const promptsPerShot = [
      lang === "zh" ? "第三步：分镜提示词" : "Step 3: Storyboard Prompt",
      "",
      promptsMainWithRefs
    ].join("\n");

    const bgBlobFiles: FlowBlobFile[] = sceneBackgrounds.map((bg) => ({
      path: `${projectDir}/${bg.fileName}`,
      refId: bg.refId
    }));
    const objectBlobFiles: FlowBlobFile[] = objects.flatMap((obj) =>
      obj.refItems
        .filter((r) => typeof (r as any).refId === "string")
        .map((r) => ({
          path: `${projectDir}/${r.fileName}`,
          refId: (r as any).refId as string
        }))
    );
    const blobFiles: FlowBlobFile[] = [...bgBlobFiles, ...objectBlobFiles];

    const allPromptText = [usageGuide, "", objectRefText, "", uploadChecklist, "", promptsPerShot].join("\n");
    const promptFileName = `${projectNameForFile}__${shotNameForFile}__${platformForFile}.txt`;
    const files: FlowFile[] = [{ path: `${projectDir}/${promptFileName}`, content: allPromptText }];

    return {
      rootDir,
      projectDir,
      objectRefText,
      promptsPerShot,
      files,
      blobFiles
    };
  }, [promptProject.scenes, platformPreset, sceneTitle, lang, promptsMainWithRefs, projectLabel]);
  const manualSaveGuide = useMemo(() => {
    const fileLines = [
      ...flowBundle.files.map((f) => `- ${f.path}`),
      ...flowBundle.blobFiles.map((b) => `- ${b.path}`)
    ];
    if (lang === "zh") {
      return [
        "手动建目录流程",
        `1) 在目标位置新建根目录：${flowBundle.rootDir}`,
        `2) 在根目录下新建项目目录：${flowBundle.projectDir}`,
        "3) 在项目目录下按以下文件名保存文件：",
        ...fileLines,
        "4) 将提示词 txt 与同名参考图一起上传到目标平台。"
      ].join("\n");
    }
    return [
      "Manual directory workflow",
      `1) Create root folder: ${flowBundle.rootDir}`,
      `2) Create project folder under root: ${flowBundle.projectDir}`,
      "3) Save files in the project folder using these exact names:",
      ...fileLines,
      "4) Upload prompt txt and same-name references to your target platform."
    ].join("\n");
  }, [flowBundle, lang]);

  async function exportFlowPackage(): Promise<{ ok: boolean; folderLabel: string }> {
    if (!canSaveDirectory) {
      return { ok: false, folderLabel: lang === "zh" ? "当前浏览器不支持目录保存" : "Directory save is not supported" };
    }
    try {
      const picker = (window as any).showDirectoryPicker;
      const pickedDir = await picker({ mode: "readwrite" });
      const root = await pickedDir.getDirectoryHandle(flowBundle.rootDir, { create: true });
      for (const file of flowBundle.files) {
        await writeTextToDirectory(root, file.path, file.content);
      }
      for (const blobFile of flowBundle.blobFiles) {
        const blob = await getRefBlob(blobFile.refId);
        if (!blob) continue;
        await writeBlobToDirectory(root, blobFile.path, blob);
      }
      return { ok: true, folderLabel: `${pickedDir.name}/${flowBundle.rootDir}` };
    } catch {
      return { ok: false, folderLabel: lang === "zh" ? "保存已取消或失败" : "Save cancelled or failed" };
    }
  }

  async function downloadFlowZipPackage(): Promise<{ ok: boolean; fileLabel: string }> {
    try {
      const encoder = new TextEncoder();
      const zipEntries: ZipEntry[] = flowBundle.files.map((f) => ({
        path: `${flowBundle.rootDir}/${f.path}`.replace(/\/+/g, "/"),
        data: encoder.encode(f.content)
      }));
      for (const blobFile of flowBundle.blobFiles) {
        const blob = await getRefBlob(blobFile.refId);
        if (!blob) continue;
        zipEntries.push({
          path: `${flowBundle.rootDir}/${blobFile.path}`.replace(/\/+/g, "/"),
          data: new Uint8Array(await blob.arrayBuffer())
        });
      }
      const zipBlob = buildZipStored(zipEntries);
      const projectNameForFile = safeName(projectLabel || (lang === "zh" ? "未命名项目" : "Untitled"));
      const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
      const platformForFile = safeName(lang === "zh" ? platformPreset.labelZh : platformPreset.labelEn);
      const zipName = `${projectNameForFile}__${shotNameForFile}__${platformForFile}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, fileLabel: zipName };
    } catch {
      return { ok: false, fileLabel: lang === "zh" ? "ZIP 下载失败" : "ZIP download failed" };
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
          style={styles.btnGhost}
          onClick={async () => {
            await guardBeforeExport("copy");
          }}
          type="button"
          title={lang === "zh" ? "一键复制提示词" : "Copy prompt in one click"}
        >
          {lang === "zh" ? "一键复制提示词" : "Copy Prompt"}
        </button>

        <button
          style={styles.btnPrimary}
          onClick={() => void guardBeforeExport("save")}
          type="button"
          title={lang === "zh" ? "保存到本地目录" : "Save to local folder"}
        >
          {lang === "zh" ? "保存" : "Save"}
        </button>
        {sceneConflicts.length > 0 ? (
          <button style={styles.conflictBadgeBtn} type="button" onClick={() => {
            setPendingConflictAction(null);
            setPendingConflicts(sceneConflicts);
            setShowConflictModal(true);
          }}>
            {lang === "zh" ? `冲突 ${sceneConflicts.length}` : `Conflicts ${sceneConflicts.length}`}
          </button>
        ) : null}
        <button
          style={styles.qBtn}
          onMouseEnter={() => setShowExportDiff(true)}
          onMouseLeave={() => setShowExportDiff(false)}
          onFocus={() => setShowExportDiff(true)}
          onBlur={() => setShowExportDiff(false)}
          type="button"
          title={lang === "zh" ? "查看导出差异" : "Show export differences"}
        >
          ?
        </button>
      </div>
      {actionHint ? <div style={styles.actionHint}>{actionHint}</div> : null}
      {showExportDiff ? (
        <div style={styles.helpFloat}>
          {lang === "zh"
            ? "一键复制只保留文字提示词（去掉附件/插图关联行），用于快速测试。保存会生成分镜文件夹（提示词 + 参考图）。平台选择用于切换平台策略，选择后立即生效；点击保存时按当前平台输出。"
            : "Copy Prompt keeps text-only prompts (attachment/image mapping lines removed) for quick testing. Save generates a shot folder (prompt + references). Platform selection switches platform strategy immediately, and Save exports using the current platform."}
        </div>
      ) : null}

      <div style={styles.preWrap}>
        <pre style={styles.pre}>{quickCopyPrompt}</pre>
        {promptsNotes ? <pre style={styles.preNotes}>{promptsNotes}</pre> : null}
      </div>

      {showExportModal && (
        <div style={styles.modalMask}>
          <div style={{ ...styles.modal, width: "min(560px, calc(100vw - 48px))" }}>
          <div style={styles.modalTitle}>{lang === "zh" ? "保存分镜文件夹" : "Save Shot Folder"}</div>
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "平台" : "Platform"}</div>
            <select
              value={platformPresetId}
              onChange={(e) => setPlatformPresetId(e.target.value as PlatformPresetId)}
              style={styles.profileSelect}
            >
              {PLATFORM_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "zh" ? p.labelZh : p.labelEn}
                </option>
              ))}
            </select>
            <button
              style={styles.qBtn}
              type="button"
              onMouseEnter={() => setShowSaveHint(true)}
              onMouseLeave={() => setShowSaveHint(false)}
              onFocus={() => setShowSaveHint(true)}
              onBlur={() => setShowSaveHint(false)}
              title={lang === "zh" ? "保存策略说明" : "Save strategy details"}
            >
              ?
            </button>
          </div>
          {showSaveHint ? (
            <div style={styles.platformTips}>
              {lang === "zh"
                ? canSaveDirectory
                  ? "平台选择后立即生效。保存会写入根目录/项目目录，文件名包含分镜与平台标识。"
                  : "当前浏览器不支持目录保存。可下载 ZIP，或复制“手动建目录流程”按文件名保存。建议使用 Chrome/Edge 获得连续保存体验。"
                : canSaveDirectory
                  ? "Platform selection applies immediately. Save writes to root/project folders with shot+platform in filenames."
                  : "Directory save is not supported in this browser. Use ZIP or copy the manual workflow to save by exact filenames. Chrome/Edge is recommended for smoother repeated saves."}
            </div>
          ) : null}
          <div style={styles.platformPendingHint}>
            {lang === "zh"
              ? `当前平台策略：${platformPreset.labelZh}。点击保存会直接按该平台策略写入文件。`
              : `Current platform strategy: ${platformPreset.labelEn}. Save writes files directly with this strategy.`}
          </div>
          {!canSaveDirectory ? (
            <div style={styles.unsupportedCard}>
              <div style={styles.unsupportedText}>
                {lang === "zh"
                  ? "目录保存不可用：可下载 ZIP，或复制手动建目录流程。"
                  : "Directory save unavailable: use ZIP download or copy the manual workflow."}
              </div>
              <div style={styles.unsupportedActions}>
                <button
                  style={styles.btnGhost}
                  type="button"
                  onClick={async () => {
                    await copy(manualSaveGuide);
                    setActionHint(lang === "zh" ? "已复制手动建目录流程" : "Manual workflow copied");
                  }}
                >
                  {lang === "zh" ? "复制手动建目录流程" : "Copy Manual Workflow"}
                </button>
              </div>
            </div>
          ) : null}
          {exportDone ? (
            <div style={styles.platformTips}>
              {lang === "zh"
                ? "保存成功。请按下方保存路径前往对应目录，再复制提示词并上传参考图。"
                : "Saved. Use the path below to locate the folder, then copy prompt and upload references."}
            </div>
          ) : null}
          {exportDone ? (
            <div style={styles.successCard}>
              <div style={styles.successTitle}>
                {exportResultType === "zip" ? (lang === "zh" ? "ZIP 已下载" : "ZIP downloaded") : (lang === "zh" ? "保存完成" : "Saved")}
              </div>
              <div style={styles.successPath}>{exportFolderLabel}</div>
              <div style={styles.successSteps}>
                {exportResultType === "zip"
                  ? (lang === "zh"
                      ? "1) 解压 ZIP\n2) 按文件名上传分镜背景图和对象图\n3) 打开 txt 复制提示词生成"
                      : "1) Unzip package\n2) Upload shot/object refs by filename\n3) Open txt, copy prompt, and generate")
                  : (lang === "zh"
                      ? "1) 先前往上方保存路径\n2) 打开该目录中的提示词 txt 并复制\n3) 按文件名上传分镜背景图和对象图后生成"
                      : "1) Go to the saved path above\n2) Open prompt txt and copy\n3) Upload shot/object refs by filename, then generate")}
              </div>
            </div>
          ) : null}
          <div style={styles.modalBtns}>
            <button style={styles.btnGhost} onClick={() => setShowExportModal(false)} type="button">
              {lang === "zh" ? "关闭" : "Close"}
            </button>
            <button
              style={styles.btnPrimary}
              onClick={async () => {
                setExporting(true);
                if (canSaveDirectory) {
                  const res = await exportFlowPackage();
                  setExporting(false);
                  if (res.ok) {
                    setExportDone(true);
                    setExportResultType("dir");
                    setExportFolderLabel(res.folderLabel);
                    setActionHint(lang === "zh" ? `保存成功：${res.folderLabel}` : `Saved: ${res.folderLabel}`);
                  } else {
                    setActionHint(res.folderLabel || (lang === "zh" ? "保存失败" : "Save failed"));
                  }
                } else {
                  const zip = await downloadFlowZipPackage();
                  setExporting(false);
                  if (zip.ok) {
                    setExportDone(true);
                    setExportResultType("zip");
                    setExportFolderLabel(zip.fileLabel);
                    setActionHint(lang === "zh" ? "ZIP 下载成功" : "ZIP downloaded");
                  } else {
                    setActionHint(zip.fileLabel || (lang === "zh" ? "ZIP 下载失败" : "ZIP download failed"));
                  }
                }
              }}
              type="button"
              disabled={exporting || exportDone}
            >
              {exporting
                ? lang === "zh"
                  ? "保存中..."
                  : "Saving..."
                : exportDone
                  ? lang === "zh"
                    ? "已保存"
                    : "Saved"
                  : canSaveDirectory
                    ? (lang === "zh" ? "保存" : "Save")
                    : (lang === "zh" ? "下载 ZIP" : "Download ZIP")}
            </button>
          </div>
          </div>
        </div>
      )}
      {showConflictModal ? (
        <div style={styles.modalMask}>
          <div style={{ ...styles.modal, width: "min(700px, calc(100vw - 48px))" }}>
            <div style={styles.modalTitle}>{lang === "zh" ? "检测到冲突，请先修正" : "Conflicts Detected"}</div>
            <div style={styles.platformTips}>
              {lang === "zh"
                ? "以下冲突来自对象备注/对象局部提示词与结构约束的冲突。点击“定位”可直接跳到对象编辑。"
                : "Conflicts were found between object text and structural constraints. Click Jump to locate the object quickly."}
            </div>
            <div style={styles.conflictList}>
              {pendingConflicts.map((c) => (
                <div key={c.id} style={{ ...styles.conflictItem, ...(c.severity === "high" ? styles.conflictItemHigh : {}) }}>
                  <div style={styles.conflictTitle}>
                    {c.title}
                    {c.layerId ? ` · ${c.layerId}` : ""}
                  </div>
                  <div style={styles.conflictDetail}>{c.detail}</div>
                  <div style={styles.conflictActions}>
                    {c.layerId ? (
                      <button
                        style={styles.btnGhost}
                        type="button"
                        onClick={() => {
                          onJumpToConflict?.(c.layerId);
                          setShowConflictModal(false);
                        }}
                      >
                        {lang === "zh" ? "定位" : "Jump"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button style={styles.btnGhost} type="button" onClick={() => setShowConflictModal(false)}>
                {lang === "zh" ? "返回修改" : "Back to Edit"}
              </button>
              <button
                style={styles.btnPrimary}
                type="button"
                onClick={async () => {
                  const action = pendingConflictAction;
                  setShowConflictModal(false);
                  if (action === "copy") await runCopyPrompt();
                  if (action === "save") runOpenSaveModal();
                }}
              >
                {lang === "zh" ? "忽略并继续导出" : "Continue Anyway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: 12,
    minHeight: 132,
    height: "min(30vh, 250px)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: "rgba(0,0,0,0.10)",
    position: "relative"
  },

  head: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontWeight: 900, fontSize: UI_FONT.title, opacity: UI_OPACITY.title },

  sceneHint: {
    fontSize: UI_FONT.hint,
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
    fontSize: UI_FONT.hint,
    fontWeight: 900,
    opacity: 0.66,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    userSelect: "none"
  },
  scopeSelect: {
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 34px 0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 700
  },

  tab: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
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
    fontSize: UI_FONT.body,
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
    fontSize: UI_FONT.body,
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent" as any
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none"
  },
  actionHint: {
    position: "absolute",
    right: 10,
    top: 44,
    zIndex: 60,
    padding: "7px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(12,16,30,0.95)",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  helpFloat: {
    position: "absolute",
    right: 10,
    top: 44,
    zIndex: 59,
    maxWidth: 420,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(12,16,30,0.97)",
    fontSize: UI_FONT.body,
    lineHeight: 1.4,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  profileRow: { display: "flex", alignItems: "center", gap: 8 },
  profileLabel: {
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: UI_OPACITY.label,
    width: UI_SIZE.labelWExport,
    flexShrink: 0
  },
  profileSelect: {
    flex: 1,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.compactRadius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "0 34px 0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 700
  },
  platformTips: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.7,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    padding: "8px 10px"
  },
  platformPendingHint: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.35,
    opacity: 0.62,
    color: "rgba(220,225,235,0.78)"
  },
  unsupportedCard: {
    border: "1px solid rgba(245,190,120,0.35)",
    borderRadius: 10,
    background: "rgba(245,190,120,0.10)",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  unsupportedTitle: {
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.95
  },
  unsupportedText: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.86
  },
  unsupportedActions: {
    marginTop: 4,
    display: "flex",
    justifyContent: "flex-end"
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
    width: "min(1100px, calc(100vw - 48px))",
    maxHeight: "calc(100vh - 48px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(16,20,34,0.96)",
    boxShadow: "0 16px 56px rgba(0,0,0,0.45)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflow: "auto"
  },
  modalTitle: { fontWeight: 900, fontSize: UI_FONT.title, opacity: UI_OPACITY.title },
  modalRow: { display: "flex", alignItems: "center", gap: 10 },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  successCard: {
    border: "1px solid rgba(120,180,255,0.35)",
    borderRadius: 12,
    background: "rgba(120,180,255,0.10)",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  successTitle: { fontSize: 12, fontWeight: 900, opacity: 0.95 },
  successPath: {
    fontSize: 12,
    borderRadius: 8,
    padding: "6px 8px",
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
    wordBreak: "break-word"
  },
  successSteps: {
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.86,
    whiteSpace: "pre-line"
  },
  optionWrap: { display: "flex", flexWrap: "wrap", gap: 6, flex: 1 },
  optionBtn: {
    padding: "5px 8px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 800,
    outline: "none"
  },
  optionBtnOn: {
    border: "1px solid rgba(120,180,255,0.68)",
    background: "rgba(120,180,255,0.14)"
  },
  conflictBadgeBtn: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,120,120,0.58)",
    background: "rgba(255,120,120,0.16)",
    color: "rgba(255,226,226,0.96)",
    fontSize: UI_FONT.hint,
    fontWeight: 900,
    cursor: "pointer"
  },
  conflictList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 300,
    overflow: "auto"
  },
  conflictItem: {
    border: "1px solid rgba(255,180,120,0.35)",
    borderRadius: 10,
    background: "rgba(255,180,120,0.09)",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  conflictItemHigh: {
    border: "1px solid rgba(255,120,120,0.56)",
    background: "rgba(255,120,120,0.12)"
  },
  conflictTitle: {
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.95
  },
  conflictDetail: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.88
  },
  conflictActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8
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
