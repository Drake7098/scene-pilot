/**
 * CameraLangPanel — Step 4
 * 镜头语言 (camera language) + 焦距/镜头感
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { Aperture } from "lucide-react";
import { FIGMA_COLORS } from "../constants";
import {
  getUserVisibleCameraLanguageOptions,
  parseCameraLanguageId,
  applyCameraLanguage,
} from "../../../content/cameraLanguageLayers";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

// Focal length / lens feel marker
const FOCAL_MARK = "focal_length:";
function parseFocal(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(FOCAL_MARK));
  return hit ? hit.trim().slice(FOCAL_MARK.length).trim() : "";
}
function writeFocal(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(FOCAL_MARK));
  if (v) lines.push(`${FOCAL_MARK}${v}`);
  return lines.join("\n");
}

// Depth of field marker
const DOF_MARK = "depth_of_field:";
function parseDof(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(DOF_MARK));
  return hit ? hit.trim().slice(DOF_MARK.length).trim() : "";
}
function writeDof(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(DOF_MARK));
  if (v) lines.push(`${DOF_MARK}${v}`);
  return lines.join("\n");
}

export function CameraLangPanel({ lang, scene, project, onUpdateScene }: Props) {
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  const currentId = parseCameraLanguageId(scene.notes ?? "");
  const baseOptions = getUserVisibleCameraLanguageOptions();

  const langOptions = [
    { value: "", label: tl(lang, "─ 未定义", "─ Undefined") },
    ...baseOptions.map((o) => ({
      value: o.id,
      label: lang === "zh" ? o.labelZh : o.labelEn,
    })),
  ];

  const focalOptions = [
    { value: "",           label: tl(lang, "─ 未定义",        "─ Undefined") },
    // ── 超广角 ──
    { value: "8mm",        label: tl(lang, "8mm 鱼眼",        "8mm Fisheye") },
    { value: "14mm",       label: tl(lang, "14mm 超广",        "14mm Ultra-wide") },
    { value: "18mm",       label: tl(lang, "18mm 广角",        "18mm Wide") },
    { value: "24mm",       label: tl(lang, "24mm 广角",        "24mm Wide") },
    { value: "28mm",       label: tl(lang, "28mm",             "28mm") },
    // ── 标准视角 ──
    { value: "35mm",       label: tl(lang, "35mm 街拍/叙事",  "35mm Street / Narrative") },
    { value: "40mm",       label: tl(lang, "40mm 人眼视角",   "40mm Natural Field of View") },
    { value: "50mm",       label: tl(lang, "50mm 标准",        "50mm Standard") },
    // ── 人像/中焦 ──
    { value: "85mm",       label: tl(lang, "85mm 人像首选",   "85mm Portrait Prime") },
    { value: "105mm",      label: tl(lang, "105mm 人像/微距", "105mm Portrait / Macro") },
    { value: "135mm",      label: tl(lang, "135mm 中长",       "135mm Medium Telephoto") },
    // ── 长焦/超长焦 ──
    { value: "200mm",      label: tl(lang, "200mm 长焦",       "200mm Telephoto") },
    { value: "300mm",      label: tl(lang, "300mm 超长焦",     "300mm Super Telephoto") },
    { value: "600mm",      label: tl(lang, "600mm 超远摄",     "600mm Wildlife / Sports") },
    // ── 特殊镜头 ──
    { value: "macro",      label: tl(lang, "微距",             "Macro") },
    { value: "tilt_shift", label: tl(lang, "移轴",             "Tilt-Shift") },
    { value: "anamorphic", label: tl(lang, "变形宽银幕",       "Anamorphic") },
  ];

  const dofOptions = [
    { value: "",           label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "very_shallow",label: tl(lang, "极浅景深", "Extremely Shallow DoF") },
    { value: "shallow",    label: tl(lang, "浅景深",    "Shallow DoF") },
    { value: "medium",     label: tl(lang, "中等景深",  "Medium DoF") },
    { value: "deep",       label: tl(lang, "深景深",    "Deep DoF") },
    { value: "full_focus", label: tl(lang, "全焦",      "Pan Focus / All-in-focus") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 4 · 镜头语言", "Step 4 · Lens Style")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择镜头语言流派、焦距和景深", "Choose lens language, focal length and depth of field")}
        </div>
      </div>

      <EditorSection title={tl(lang, "镜头语言", "Camera Language")} icon={Aperture} defaultOpen={true}>
        <EditorSelect
          label={tl(lang, "语言", "Language")}
          value={currentId}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: applyCameraLanguage(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={langOptions}
        />
      </EditorSection>

      <EditorSection title={tl(lang, "焦距 & 景深", "Focal Length & Depth of Field")} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "焦距", "Focal Length")}
          value={parseFocal(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeFocal(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={focalOptions}
        />
        <EditorSelect
          compact
          label={tl(lang, "景深", "Depth of Field")}
          value={parseDof(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeDof(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={dofOptions}
        />
      </EditorSection>
    </div>
  );
}
