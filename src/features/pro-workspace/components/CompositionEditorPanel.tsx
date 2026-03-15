import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, Layer, LayerKF } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { EditorSection, EditorInput } from "../../../components/ui";
import { LayoutGrid } from "lucide-react";
import { ensureKF } from "../../../model";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project?: Project | null;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onUpdateLayer: (layerId: string, patch: Partial<Layer>) => void;
  editT: 0 | 1;
  setEditT: (t: 0 | 1) => void;
};

function getKF(layer: Layer, t: 0 | 1): LayerKF {
  const hit = (layer.kf ?? []).find((k) => k.t === t);
  if (hit) return hit;
  const base = (layer.kf ?? []).find((k) => k.t === 0) ?? (layer.kf ?? [])[0];
  return base ?? { t: 0, x: 50, y: 50, w: 18, h: 18, rot: 0 };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

export function CompositionEditorPanel({
  lang,
  scene,
  project,
  selectedLayerId,
  onSelectLayer,
  onUpdateScene,
  onUpdateLayer,
  editT,
  setEditT,
}: Props) {
  const layers = scene.layers ?? [];
  const selectedLayer = selectedLayerId ? layers.find((l) => l.id === selectedLayerId) ?? null : null;
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const t1Enabled = mediaMode !== "image";

  if (!selectedLayer) {
    return (
      <div style={{ padding: 16, color: FIGMA_COLORS.textMuted, fontSize: 12 }}>
        {lang === "zh"
          ? "在画布中选择对象以编辑构图，或切换至「对象」面板选择"
          : "Select an object on canvas to edit composition, or switch to Objects panel"}
      </div>
    );
  }

  const kf = getKF(selectedLayer, editT);
  const updateKF = (patch: Partial<LayerKF>) => {
    const nextKf = ensureKF(selectedLayer, editT);
    const merged = { ...nextKf, ...patch };
    const kfList = [...(selectedLayer.kf ?? [])];
    const idx = kfList.findIndex((k) => k.t === editT);
    const newKf = { ...merged, t: editT };
    if (idx >= 0) kfList[idx] = newKf;
    else kfList.push(newKf);
    kfList.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    onUpdateLayer(selectedLayer.id, { kf: kfList });
  };

  const toNum = (s: string, fallback: number) => {
    const n = Number(s);
    return Number.isFinite(n) ? round1(n) : fallback;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection title={lang === "zh" ? "关键帧" : "Keyframe"} icon={LayoutGrid} defaultOpen={true}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setEditT(0)}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${editT === 0 ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
              background: editT === 0 ? `${FIGMA_COLORS.accent}20` : "transparent",
              color: editT === 0 ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            T0
          </button>
          <button
            type="button"
            onClick={() => t1Enabled && setEditT(1)}
            disabled={!t1Enabled}
            title={!t1Enabled ? (lang === "zh" ? "图片模式：终点 t1 已锁定" : "Image mode: End t1 locked") : undefined}
            style={{
              flex: 1,
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${editT === 1 && t1Enabled ? FIGMA_COLORS.accent : FIGMA_COLORS.border}`,
              background: editT === 1 && t1Enabled ? `${FIGMA_COLORS.accent}20` : "transparent",
              color: editT === 1 && t1Enabled ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
              fontSize: 12,
              fontWeight: 500,
              cursor: t1Enabled ? "pointer" : "not-allowed",
              opacity: t1Enabled ? 1 : 0.6,
            }}
          >
            T1
          </button>
        </div>
        {!t1Enabled && (
          <div style={{ marginBottom: 8, fontSize: 10, color: FIGMA_COLORS.textMuted }}>
            {lang === "zh" ? "图片模式：终点 t=1 已锁定" : "Image mode: End t=1 locked"}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <EditorInput
            label="X"
            type="number"
            value={String(kf.x ?? 50)}
            onChange={(v) => updateKF({ x: Math.max(0, Math.min(100, toNum(v, 50))) })}
          />
          <EditorInput
            label="Y"
            type="number"
            value={String(kf.y ?? 50)}
            onChange={(v) => updateKF({ y: Math.max(0, Math.min(100, toNum(v, 50))) })}
          />
          <EditorInput
            label={lang === "zh" ? "宽" : "W"}
            type="number"
            value={String(kf.w ?? 18)}
            onChange={(v) => updateKF({ w: Math.max(2, Math.min(100, toNum(v, 18))) })}
          />
          <EditorInput
            label={lang === "zh" ? "高" : "H"}
            type="number"
            value={String(kf.h ?? 18)}
            onChange={(v) => updateKF({ h: Math.max(2, Math.min(100, toNum(v, 18))) })}
          />
        </div>
        <EditorInput
          label={lang === "zh" ? "旋转 (°)" : "Rot (°)"}
          type="number"
          value={String(kf.rot ?? 0)}
          onChange={(v) => updateKF({ rot: toNum(v, 0) })}
        />
      </EditorSection>

      <EditorSection title={lang === "zh" ? "层级" : "Z-index"} defaultOpen={false}>
        <EditorInput
          label="Z"
          type="number"
          value={String(selectedLayer.z ?? 0)}
          onChange={(v) => onUpdateLayer(selectedLayer.id, { z: Math.round(Number(v) || 0) })}
        />
      </EditorSection>
    </div>
  );
}
