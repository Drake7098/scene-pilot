/**
 * ShotPanel — Step 1
 * 景别 / 运动 / 时长 / 分镜备注
 * 单镜头模式：不显示多分镜入口
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { EditorSection, EditorInput, EditorSelect } from "../../../components/ui";
import { Video, Clock } from "lucide-react";
import { FIGMA_COLORS } from "../constants";
import { resolveActiveProFields } from "../../../utils/proFieldsResolver";
import { PRO_CAMERA_PRESETS } from "../../../content/proCameraPresets";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

export function ShotPanel({ lang, scene, project, onUpdateScene }: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const activeProFields = resolveActiveProFields(scene.notes ?? "");

  // Shot size options — professionally named
  const shotSizeOptions = [
    { value: "",              label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "extreme_close", label: tl(lang, "极近景 ECU","Extreme Close-up (ECU)") },
    { value: "close",         label: tl(lang, "近景 CU",   "Close-up (CU)") },
    { value: "medium_close",  label: tl(lang, "中近景 MCU","Medium Close-up (MCU)") },
    { value: "medium",        label: tl(lang, "中景 MS",   "Medium Shot (MS)") },
    { value: "full",          label: tl(lang, "全身 FS",   "Full Shot (FS)") },
    { value: "wide",          label: tl(lang, "全景 LS",   "Long Shot (LS)") },
    { value: "extreme_wide",  label: tl(lang, "大远景 XLS","Extreme Long Shot (XLS)") },
    { value: "aerial",        label: tl(lang, "航拍俯视",  "Aerial / Bird's Eye") },
    { value: "overhead",      label: tl(lang, "顶视",      "Overhead / Top Down") },
    { value: "pov",           label: tl(lang, "主观视角",  "Point of View (POV)") },
    { value: "custom",        label: tl(lang, "自定义",    "Custom") },
  ];

  const movementOptions = [
    { value: "",           label: tl(lang, "─ 未定义",   "─ Undefined") },
    // ── 基础固定 ──
    { value: "static",     label: tl(lang, "固定机位",   "Static / Locked") },
    // ── 手持/稳定器 ──
    { value: "handheld",   label: tl(lang, "手持",       "Handheld") },
    { value: "steadicam",  label: tl(lang, "斯坦尼康",   "Steadicam") },
    // ── 摇/仰/俯 ──
    { value: "pan_left",   label: tl(lang, "左摇",       "Pan Left") },
    { value: "pan_right",  label: tl(lang, "右摇",       "Pan Right") },
    { value: "tilt_up",    label: tl(lang, "上仰",       "Tilt Up") },
    { value: "tilt_down",  label: tl(lang, "下俯",       "Tilt Down") },
    { value: "whip_pan",   label: tl(lang, "甩镜",       "Whip Pan") },
    { value: "roll",       label: tl(lang, "旋转镜头",   "Roll / Dutch Roll") },
    // ── 推拉跟 ──
    { value: "push_in",    label: tl(lang, "推进",       "Push In / Dolly In") },
    { value: "pull_out",   label: tl(lang, "拉远",       "Pull Out / Dolly Out") },
    { value: "tracking",   label: tl(lang, "横向跟拍",   "Tracking / Side Dolly") },
    { value: "follow_focus",label: tl(lang, "跟焦追拍",  "Follow Focus") },
    // ── 变焦 ──
    { value: "zoom_in",    label: tl(lang, "变焦推近",   "Zoom In") },
    { value: "zoom_out",   label: tl(lang, "变焦拉远",   "Zoom Out") },
    { value: "dolly_zoom", label: tl(lang, "焦距推拉 (希区柯克)", "Dolly Zoom (Hitchcock)") },
    // ── 环绕/升降 ──
    { value: "arc",        label: tl(lang, "弧形环绕",   "Arc / Orbit") },
    { value: "crane_up",   label: tl(lang, "升降臂上",   "Crane / Jib Up") },
    { value: "crane_down", label: tl(lang, "升降臂下",   "Crane / Jib Down") },
    { value: "drone_rise", label: tl(lang, "无人机上升", "Drone Rise") },
    { value: "drone_descend", label: tl(lang, "无人机下降","Drone Descend") },
    { value: "drone_orbit",label: tl(lang, "无人机环绕", "Drone Orbit") },
    // ── Pro presets ──
    ...activeProFields.proMotionIds
      .map((id) => {
        const preset = PRO_CAMERA_PRESETS.find((p) => p.id === id);
        if (!preset) return null;
        return {
          label: (lang === "zh" ? preset.labelZh : preset.labelEn) + " ✦",
          value: id,
        };
      })
      .filter(Boolean) as { label: string; value: string }[],
  ];

  const angleOptions = [
    { value: "",              label: tl(lang, "─ 未定义",       "─ Undefined") },
    { value: "eye_level",     label: tl(lang, "平视",           "Eye Level") },
    { value: "low_angle",     label: tl(lang, "低机位",         "Low Angle") },
    { value: "high_angle",    label: tl(lang, "高机位",         "High Angle") },
    { value: "dutch",         label: tl(lang, "荷兰角",         "Dutch / Canted") },
    { value: "worm_eye",      label: tl(lang, "虫眼极低角",     "Worm's Eye / Extreme Low") },
    { value: "bird_eye",      label: tl(lang, "鸟瞰正顶角",     "Bird's Eye / Straight Down") },
    { value: "over_shoulder", label: tl(lang, "过肩角",         "Over-the-Shoulder (OTS)") },
    { value: "two_shot",      label: tl(lang, "双人同框",       "Two-Shot / Cowboy") },
    { value: "profile",       label: tl(lang, "侧面 90°",       "Profile / Side-on") },
    { value: "three_quarter", label: tl(lang, "四分之三角",     "Three-Quarter / 3/4 Angle") },
  ];

  // camera.shot is reused for angle via a separate sub-field stored in notes
  // We read angle from scene.notes via a simple marker
  const ANGLE_MARK = "cam_angle:";
  function parseAngle(notes: string) {
    const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(ANGLE_MARK));
    return hit ? hit.trim().slice(ANGLE_MARK.length).trim() : "";
  }
  function writeAngle(notes: string, v: string) {
    const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(ANGLE_MARK));
    if (v) lines.push(`${ANGLE_MARK}${v}`);
    return lines.join("\n");
  }

  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Step header */}
      <div
        style={{
          padding: "12px 16px 8px",
          borderBottom: `1px solid ${FIGMA_COLORS.border}`,
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 1 · 镜头", "Step 1 · Shot")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "设定景别、运动方式和机位角度", "Set shot size, camera movement, and angle")}
        </div>
      </div>

      <EditorSection title={tl(lang, "景别 & 机位", "Shot Frame & Angle")} icon={Video} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "景别", "Shot Size")}
          value={scene.camera?.shot ?? ""}
          onChange={(v) =>
            onUpdateScene({ ...scene, camera: { ...(scene.camera ?? {}), shot: v } })
          }
          disabled={layoutLocked}
          options={shotSizeOptions}
        />
        <EditorSelect
          compact
          label={tl(lang, "机位角度", "Camera Angle")}
          value={parseAngle(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeAngle(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={angleOptions}
        />
      </EditorSection>

      <EditorSection title={tl(lang, "运动", "Camera Movement")} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "运动方式", "Movement")}
          value={scene.camera?.movement ?? ""}
          onChange={(v) =>
            onUpdateScene({ ...scene, camera: { ...(scene.camera ?? {}), movement: v } })
          }
          disabled={layoutLocked || mediaMode === "image"}
          options={movementOptions}
        />
        {mediaMode === "image" && (
          <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted, marginTop: 2 }}>
            {tl(lang, "图片模式下运动字段已禁用", "Camera movement is disabled in image mode")}
          </div>
        )}
      </EditorSection>

      <EditorSection title={tl(lang, "镜头参数", "Shot Parameters")} icon={Clock} defaultOpen={true}>
        <EditorInput
          label={tl(lang, "时长 (秒)", "Duration (s)")}
          type="number"
          value={String(Math.max(1, Math.round(Number(scene.duration_s) || 4)))}
          onChange={(v) => {
            const n = Math.max(1, Math.min(120, Math.round(Number(v) || 4)));
            onUpdateScene({ ...scene, duration_s: n });
          }}
          disabled={layoutLocked}
        />
        <EditorInput
          label={tl(lang, "场景名称", "Scene Name")}
          value={scene.name ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, name: v })}
          disabled={layoutLocked}
          placeholder={tl(lang, "镜头描述", "Shot description")}
        />
        <EditorInput
          label={tl(lang, "导演备注", "Director's Note")}
          value={scene.shotNote ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, shotNote: v })}
          disabled={layoutLocked}
          placeholder={tl(lang, "给团队的拍摄注记（不进入提示词）", "Production note for the crew (not in prompt)")}
        />
      </EditorSection>

      {layoutLocked && (
        <div style={{ margin: "8px 0", padding: "8px 12px", borderRadius: 6, background: `${FIGMA_COLORS.accent}18`, border: `1px solid ${FIGMA_COLORS.border}`, fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "「仅布局」模式下场景字段只读", "Layout-only mode: scene fields are read-only")}
        </div>
      )}
    </div>
  );
}
