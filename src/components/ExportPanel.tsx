import React, { useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { tAny } from "../i18n";
import type { Project } from "../model";
import { generatePrompts } from "../utils/prompt";

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

    s = s.replace(/[\(\（]\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*[\)\）]/gi, "");
    s = s.replace(/[\(\（]\s*\d+(\.\d+)?\s*秒\s*[\)\）]/g, "");
    s = s.replace(/\[\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\s*\]/gi, "");
    s = s.replace(/\[\s*\d+(\.\d+)?\s*秒\s*\]/g, "");

    s = s.replace(/\s*(\-|—|–|·|\||\/)\s*\d+(\.\d+)?\s*(s|sec|secs|second|seconds)\b/gi, "");
    s = s.replace(/\s*(\-|—|–|·|\||\/)\s*\d+(\.\d+)?\s*秒\b/g, "");

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

    s = s.replace(/[\(\（][^)\）]*\b(t1|t\s*=\s*1|end|kf1)\b[^)\）]*[\)\）]/gi, "");
    s = s.replace(/[\(\（][^)\）]*(终点|终帧|结束|结尾)[^)\）]*[\)\）]/g, "");

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

export function ExportPanel({ lang, project, sceneIdx, selectedLayerId }: Props) {
  const [tab, setTab] = useState<"prompts" | "json">("prompts");
  const [copied, setCopied] = useState(false);

  const scenes = project.scenes ?? [];
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIdx] ?? null;

  const mediaMode: MediaMode = useMemo(() => parseMediaModeFromNotes(currentScene?.notes), [currentScene?.notes]);

  // ✅ 只导出当前分镜 prompts
  const promptProject = useMemo<Project>(() => {
    if (!currentScene) return { ...project, scenes: [] };
    return { ...project, scenes: [currentScene] };
  }, [project, currentScene]);

  const sceneTitle = useMemo(() => {
    if (!currentScene) return lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`;
    return (currentScene.name ?? "").trim() || currentScene.id || (lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`);
  }, [currentScene, lang, safeIdx]);

  const rawPrompts = useMemo(() => {
    void selectedLayerId;
    void safeIdx;
    // ✅ 关键：按模式生成不同末尾坐标解释（机器语言块）
    return generatePrompts(promptProject, lang, mediaMode);
  }, [promptProject, lang, safeIdx, selectedLayerId, mediaMode]);

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

  const json = useMemo(() => JSON.stringify(project, null, 2), [project]);

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

  const tabBtn = (on: boolean): React.CSSProperties => ({
    ...styles.tab,
    ...(on ? styles.tabOn : styles.tabOff)
  });

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

        <button style={tabBtn(tab === "prompts")} onClick={() => setTab("prompts")} type="button">
          {tAny(lang, "export.promptsTab")}
        </button>

        <button style={tabBtn(tab === "json")} onClick={() => setTab("json")} type="button">
          {tAny(lang, "export.jsonTab")}
        </button>

        <button
          style={styles.btnPrimary}
          onClick={() => copy(tab === "prompts" ? prompts : json)}
          type="button"
          title={tab === "prompts" ? tAny(lang, "export.copyPrompts") : tAny(lang, "export.copyJson")}
        >
          {copied
            ? tAny(lang, "common.copied")
            : tab === "prompts"
              ? tAny(lang, "export.copyPrompts")
              : tAny(lang, "export.copyJson")}
        </button>
      </div>

      {tab === "prompts" ? (
        <div style={styles.preWrap}>
          <pre style={styles.pre}>{promptsMain}</pre>
          {promptsNotes ? <pre style={styles.preNotes}>{promptsNotes}</pre> : null}
        </div>
      ) : (
        <pre style={styles.pre}>{json}</pre>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: 10,
    minHeight: 130,
    height: 150,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "rgba(0,0,0,0.10)"
  },

  head: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontWeight: 900, fontSize: 13, opacity: 0.95 },

  sceneHint: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.68,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    maxWidth: 180,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
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