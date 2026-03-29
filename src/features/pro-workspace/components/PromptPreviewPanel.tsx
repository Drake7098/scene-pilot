/**
 * Prompt Review Panel (v2)
 * Structure:
 * 1) Overview
 * 2) Compile Summary
 * 3) Constraint Impact
 * 4) Warnings
 * 5) Full Prompt (collapsed)
 */

import React, { useMemo } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { getCanonicalPromptV3 } from "../../../utils/promptPipeline";
import { detectSceneConflicts } from "../../../utils/conflictRules";
import { parsePromptSections } from "../utils/parsePromptSections";
import { getStageObjectState } from "../../stage-editor/guards/stageObjectState";
import { EditorSection } from "../../../components/ui";
import { FileText, ClipboardCheck, AlertTriangle, ListChecks, ShieldAlert } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  project: Project | null;
  scene: Scene;
  platformId: string;
  onCopyPrompt?: () => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function firstLine(value: string): string {
  return String(value || "").split("\n").map((it) => it.trim()).find(Boolean) ?? "";
}

function roleFromNotes(notes: string): "primary" | "secondary" | "support" | null {
  const line = (notes ?? "").split("\n").find((it) => it.trim().toLowerCase().startsWith("role:"));
  if (!line) return null;
  const role = line.trim().slice(5).trim().toLowerCase();
  if (role === "primary" || role === "secondary" || role === "support") return role;
  return null;
}

function objectShortSummary(scene: Scene, lang: Lang): string {
  const layers = scene.layers ?? [];
  if (layers.length === 0) return lang === "zh" ? "无对象" : "No objects";
  const names = layers.slice(0, 3).map((l) => firstLine(l.look) || l.id).filter(Boolean);
  return names.join(lang === "zh" ? " + " : " + ");
}

function cameraSummary(scene: Scene): string {
  const notes = scene.notes ?? "";
  const camera = firstLine(
    ((notes.split("\n").find((it) => it.trim().startsWith("cam_movement:")) ?? "").split(":").slice(1).join(":")).trim()
  );
  const shot = firstLine((((notes.split("\n").find((it) => it.trim().startsWith("shot_size:")) ?? "").split(":").slice(1).join(":")).trim()));
  return [shot, camera].filter(Boolean).join(" · ");
}

function styleSummary(scene: Scene): string {
  const notes = scene.notes ?? "";
  const render = firstLine((((notes.split("\n").find((it) => it.trim().startsWith("render_style:")) ?? "").split(":").slice(1).join(":")).trim()));
  const mood = firstLine((((notes.split("\n").find((it) => it.trim().startsWith("env_mood:")) ?? "").split(":").slice(1).join(":")).trim()));
  return [render, mood].filter(Boolean).join(" · ");
}

function sceneSummary(scene: Scene, lang: Lang): string {
  const bgFromNotes = firstLine(
    (((scene.notes ?? "").split("\n").find((it) => it.trim().startsWith("bg_preset:")) ?? "").split(":").slice(1).join(":").trim())
  );
  if (bgFromNotes) return bgFromNotes;
  if (scene.shotNote && scene.shotNote.trim()) return firstLine(scene.shotNote);
  return scene.name || (lang === "zh" ? "未设置场景摘要" : "No scene summary");
}

export function PromptPreviewPanel({ lang, project, scene, platformId: _platformId, onCopyPrompt }: Props) {
  void _platformId;
  const config = resolveSceneConfig(scene);
  const mediaMode = config.mediaMode;
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "full_workflow";
  const layoutLocked = applyMode === "layout_only";
  const conflicts = useMemo(() => detectSceneConflicts(scene, lang), [scene, lang]);

  const canonicalPrompt = useMemo(() => {
    const scopedProject = project
      ? { ...project, scenes: [scene] }
      : ({ scenes: [scene] } as Project);
    return getCanonicalPromptV3({ project: scopedProject, lang }).trim();
  }, [project, scene, lang, mediaMode]);

  const objectStates = useMemo(() => {
    const layers = scene.layers ?? [];
    return layers.map((layer) => ({ layer, state: getStageObjectState(layer, scene, project) }));
  }, [scene, project]);

  const overviewRows = useMemo(() => {
    const ratio = scene.aspectRatio || "16:9";
    const duration = Number.isFinite(Number(scene.duration_s)) ? round1(Number(scene.duration_s)) : 0;
    const mediaLabel = mediaMode === "image" ? t(lang, "图片", "Image") : t(lang, "视频", "Video");
    const head = mediaMode === "video"
      ? `${mediaLabel} · ${ratio} · ${duration} ${lang === "zh" ? "秒" : "s"}`
      : `${mediaLabel} · ${ratio}`;
    return [
      head,
      sceneSummary(scene, lang),
      objectShortSummary(scene, lang),
      cameraSummary(scene) || (lang === "zh" ? "未设置镜头摘要" : "No camera summary"),
      styleSummary(scene) || (lang === "zh" ? "未设置风格摘要" : "No style summary"),
    ];
  }, [scene, mediaMode, lang]);

  const compileSummary = useMemo(() => {
    const included: string[] = [];
    const excluded: Array<{ label: string; reason: string }> = [];

    if (sceneSummary(scene, lang)) included.push(t(lang, "场景背景", "Scene background"));
    if ((scene.layers ?? []).length > 0) included.push(t(lang, "主体布局", "Object layout"));
    if (cameraSummary(scene)) included.push(t(lang, "镜头与运动", "Camera & motion"));
    if (styleSummary(scene)) included.push(t(lang, "风格与氛围", "Style & mood"));
    if (scene.lighting?.time || scene.lighting?.key_dir || scene.lighting?.mood) {
      included.push(t(lang, "光线", "Lighting"));
    }
    if (!included.length && canonicalPrompt) {
      included.push(
        t(lang, "场景背景", "Scene background"),
        t(lang, "主体布局", "Object layout"),
        t(lang, "镜头与运动", "Camera & motion"),
        t(lang, "风格与氛围", "Style & mood")
      );
    }

    if (layoutLocked) {
      excluded.push({
        label: t(lang, "场景级字段", "Scene fields"),
        reason: t(lang, "仅布局模式下被锁定", "Disabled by layout-only mode"),
      });
    }
    if (mediaMode === "image") {
      excluded.push({
        label: t(lang, "视频运动字段", "Video motion fields"),
        reason: t(lang, "图片模式自动禁用", "Disabled in image mode"),
      });
    }
    return { included, excluded };
  }, [scene, canonicalPrompt, lang, layoutLocked, mediaMode]);

  const constraintImpact = useMemo(() => {
    const list: string[] = [];
    if (layoutLocked) list.push(t(lang, "场景布局锁定", "Scene layout locked"));
    for (const { layer, state } of objectStates) {
      if (state.isLocked) list.push(`${t(lang, "布局锁定", "Layout locked")}: ${layer.id}`);
      if (state.isProtectedLayout) list.push(`${t(lang, "受保护布局", "Protected layout")}: ${layer.id}`);
      if (state.continuityId) list.push(`${t(lang, "连续性锚点", "Continuity anchor")}: ${layer.id} (${state.continuityId})`);
    }
    return list;
  }, [objectStates, layoutLocked, lang]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (layoutLocked) {
      list.push(t(lang, "场景字段因“仅布局”模式未生效", "Scene fields disabled by layout-only mode"));
    }

    const layers = scene.layers ?? [];
    const primaryCount = layers.reduce((sum, layer) => sum + (roleFromNotes(layer.notes ?? "") === "primary" ? 1 : 0), 0);
    if (primaryCount > 1) {
      list.push(t(lang, "检测到多个 primary 对象", "Multiple primary objects detected"));
    }

    const missingCore = layers.filter((layer) => !firstLine(layer.look) && !firstLine(layer.externalPrompt || "")).map((it) => it.id);
    if (missingCore.length > 0) {
      list.push(
        t(lang, "对象缺少核心描述", "Objects missing core description") +
          `: ${missingCore.slice(0, 3).join(", ")}${missingCore.length > 3 ? "..." : ""}`
      );
    }

    const extras = parsePromptSections(canonicalPrompt).find((section) => section.id === "extras");
    if (extras && extras.lines.length > 0) {
      list.push(t(lang, "存在未分类分段（其他）", "Uncategorized section detected (Extras)"));
    }

    if (conflicts.length > 0) {
      list.push(t(lang, "存在字段冲突或降级", "Field conflicts or downgraded behavior detected"));
    }

    return list;
  }, [scene, lang, canonicalPrompt, layoutLocked, conflicts]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection title={t(lang, "生成概览", "Generation Overview")} icon={ClipboardCheck} defaultOpen={true}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {overviewRows.map((line, i) => (
            <div key={`${line}-${i}`} style={{ fontSize: 11, color: i === 0 ? FIGMA_COLORS.text : FIGMA_COLORS.textMuted }}>
              {line}
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title={t(lang, "编译结果摘要", "Compile Summary")} icon={ListChecks} defaultOpen={true}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, color: FIGMA_COLORS.text }}>
            {t(lang, "已进入编译：", "Included in compile:")}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {compileSummary.included.map((it) => <li key={it}>{it}</li>)}
          </ul>
          <div style={{ fontSize: 11, color: FIGMA_COLORS.text }}>
            {t(lang, "未进入编译：", "Excluded from compile:")}
          </div>
          {compileSummary.excluded.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
              {compileSummary.excluded.map((it, idx) => (
                <li key={`${it.label}-${idx}`}>{it.label} · {it.reason}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
              {t(lang, "全部核心字段已进入编译", "All core fields are included")}
            </div>
          )}
        </div>
      </EditorSection>

      <EditorSection title={t(lang, "约束影响", "Constraint Impact")} icon={ShieldAlert} defaultOpen={true}>
        {constraintImpact.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {constraintImpact.map((line, idx) => <li key={`${line}-${idx}`}>{line}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {t(lang, "当前无约束影响最终编译", "No active constraints affecting final compile")}
          </div>
        )}
      </EditorSection>

      <EditorSection
        title={t(lang, "异常与警告", "Warnings")}
        icon={AlertTriangle}
        defaultOpen={warnings.length > 0}
      >
        {warnings.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {warnings.map((line, idx) => <li key={`${line}-${idx}`}>{line}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
            {t(lang, "无明显异常", "No obvious warnings")}
          </div>
        )}
      </EditorSection>

      <EditorSection title={t(lang, "完整提示词", "Full Prompt")} icon={FileText} defaultOpen={false}>
        <pre
          style={{
            margin: 0,
            padding: 10,
            fontSize: 11,
            lineHeight: 1.5,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            color: FIGMA_COLORS.text,
            border: `1px solid ${FIGMA_COLORS.border}`,
            borderRadius: 6,
            background: FIGMA_COLORS.bg,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {canonicalPrompt || (lang === "zh" ? "暂无可用提示词" : "No prompt available")}
        </pre>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={() => onCopyPrompt?.()}
            style={{
              minHeight: 30,
              padding: "0 10px",
              borderRadius: 6,
              border: `1px solid ${FIGMA_COLORS.border}`,
              background: FIGMA_COLORS.panel,
              color: FIGMA_COLORS.text,
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            {t(lang, "复制提示词", "Copy Prompt")}
          </button>
        </div>
      </EditorSection>
    </div>
  );
}
