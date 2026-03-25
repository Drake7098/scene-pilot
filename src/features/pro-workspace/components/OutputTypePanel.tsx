/**
 * OutputTypePanel — Step 3
 * image / video 选择 → 写入 scene.config.mediaMode via model helper
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig, withSceneConfig } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { MonitorPlay, Frame } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

export function OutputTypePanel({ lang, scene, project, onUpdateScene }: Props) {
  const config = resolveSceneConfig(scene);
  const mediaMode = config.mediaMode;

  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  function setMediaMode(v: "image" | "video") {
    const nextScene = withSceneConfig(scene, { mediaMode: v });
    onUpdateScene(nextScene);
  }

  const aspectOptions = [
    { value: "",      label: tl(lang, "─ 未定义", "─ Undefined") },
    { value: "16:9",  label: "16:9 — " + tl(lang, "横屏 / 影院", "Landscape / Cinema") },
    { value: "9:16",  label: "9:16 — " + tl(lang, "竖屏 / 短视频", "Portrait / Short-form") },
    { value: "1:1",   label: "1:1 — " + tl(lang, "正方形", "Square") },
    { value: "4:3",   label: "4:3 — " + tl(lang, "传统", "Traditional") },
    { value: "21:9",  label: "21:9 — " + tl(lang, "超宽幅", "Ultrawide / Anamorphic") },
  ];

  const imageStyleOptions = [
    { value: "",               label: tl(lang, "─ 未定义", "─ Undefined") },
    { value: "photorealistic", label: tl(lang, "照片写实",  "Photorealistic") },
    { value: "cinematic_still",label: tl(lang, "电影感静帧","Cinematic Still") },
    { value: "editorial",      label: tl(lang, "编辑/杂志感","Editorial / Magazine") },
    { value: "concept_art",    label: tl(lang, "概念艺术",  "Concept Art") },
    { value: "illustration",   label: tl(lang, "插画",      "Illustration") },
    { value: "anime",          label: tl(lang, "动漫",      "Anime / 2D") },
    { value: "3d_render",      label: tl(lang, "三维渲染",  "3D Render") },
  ];

  const videoStyleOptions = [
    { value: "",               label: tl(lang, "─ 未定义",    "─ Undefined") },
    { value: "filmic",         label: tl(lang, "电影质感",    "Filmic") },
    { value: "documentary",    label: tl(lang, "纪录片",      "Documentary") },
    { value: "commercial",     label: tl(lang, "商业广告",    "Commercial TVC") },
    { value: "social_native",  label: tl(lang, "社媒原生",    "Social / Native") },
    { value: "music_video",    label: tl(lang, "MV / 音乐视频","Music Video") },
    { value: "animation",      label: tl(lang, "动画",        "Animation") },
    { value: "vfx_heavy",      label: tl(lang, "VFX 特效",    "VFX Heavy") },
  ];

  const RENDER_STYLE_MARK = "render_style:";
  function parseRenderStyle(notes: string) {
    const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(RENDER_STYLE_MARK));
    return hit ? hit.trim().slice(RENDER_STYLE_MARK.length).trim() : "";
  }
  function writeRenderStyle(notes: string, v: string) {
    const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(RENDER_STYLE_MARK));
    if (v) lines.push(`${RENDER_STYLE_MARK}${v}`);
    return lines.join("\n");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 3 · 输出类型", "Step 3 · Output Type")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择图片或视频，设置画幅比例与渲染风格", "Set media type, aspect ratio and render style")}
        </div>
      </div>

      <EditorSection title={tl(lang, "媒体类型", "Media Type")} icon={MonitorPlay} defaultOpen={true}>
        {/* Big toggle buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["image", "video"] as const).map((m) => {
            const isActive = mediaMode === m;
            return (
              <button
                key={m}
                type="button"
                disabled={layoutLocked}
                onClick={() => setMediaMode(m)}
                style={{
                  flex: 1,
                  padding: "14px 8px",
                  borderRadius: 8,
                  border: `1.5px solid ${isActive ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
                  background: isActive ? `${FIGMA_COLORS.accent}18` : FIGMA_COLORS.bg,
                  color: isActive ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  cursor: layoutLocked ? "not-allowed" : "pointer",
                  opacity: layoutLocked ? 0.6 : 1,
                  transition: "all 0.12s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 18 }}>{m === "image" ? "🖼" : "🎬"}</span>
                <span>{m === "image" ? tl(lang, "图片", "Image") : tl(lang, "视频", "Video")}</span>
              </button>
            );
          })}
        </div>

        {/* Render style */}
        <EditorSelect
          compact
          label={tl(lang, "渲染风格", "Render Style")}
          value={parseRenderStyle(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeRenderStyle(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={mediaMode === "image" ? imageStyleOptions : videoStyleOptions}
        />
      </EditorSection>

      <EditorSection title={tl(lang, "画幅比例", "Aspect Ratio")} icon={Frame} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "比例", "Ratio")}
          value={scene.aspectRatio ?? ""}
          onChange={(v) =>
            onUpdateScene({ ...scene, aspectRatio: v as Scene["aspectRatio"] || undefined })
          }
          disabled={layoutLocked}
          options={aspectOptions}
        />
      </EditorSection>

      {/* Contextual hint */}
      <div style={{ margin: "4px 16px 12px", padding: "8px 10px", borderRadius: 6, background: `${FIGMA_COLORS.bg}`, border: `1px solid ${FIGMA_COLORS.border}`, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {mediaMode === "image"
          ? tl(lang, "✦ 图片模式：镜头运动字段将被禁用，技术段输出静帧参数", "✦ Image mode: camera movement is disabled; the tech section outputs still-frame parameters")
          : tl(lang, "✦ 视频模式：镜头运动字段完整开放，技术段输出动态参数", "✦ Video mode: all camera movement fields are active; the tech section outputs motion parameters")}
      </div>
    </div>
  );
}
