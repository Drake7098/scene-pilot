import React, { useEffect, useRef, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, Layer, LocalRefMeta, LocalRefType } from "../../../model";
import { EditorSection, EditorInput, EditorSelect, EditorCheckbox } from "../../../components/ui";
import { Layers, Anchor } from "lucide-react";
import { getLayerAnchorId, stageMarkAnchor } from "../../../features/stage-editor/actions/stageMarkAnchor";
import { getStageObjectState, writeLayoutLocked } from "../../../features/stage-editor/guards/stageObjectState";
import { deleteRefBlob, getRefBlob, putRefBlob } from "../../../utils/localRefs";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onUpdateLayer: (layerId: string, patch: Partial<Layer>) => void;
  onRenameLayer?: (oldId: string, newId: string) => void;
};

export function ObjectEditorPanel({
  lang,
  scene,
  project,
  selectedLayerId,
  onSelectLayer,
  onUpdateScene,
  onUpdateLayer,
  onRenameLayer,
}: Props) {
  const layers = scene.layers ?? [];

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId) ?? null
    : null;

  const objState = selectedLayer
    ? getStageObjectState(selectedLayer, scene, project)
    : null;

  const continuityId = selectedLayer ? getLayerAnchorId(selectedLayer) : null;

  const [idEditing, setIdEditing] = useState(false);
  const [idDraft, setIdDraft] = useState("");
  const [localRefToast, setLocalRefToast] = useState("");
  const [localRefThumb, setLocalRefThumb] = useState("");
  useEffect(() => {
    setIdEditing(false);
    setIdDraft(selectedLayer?.id ?? "");
  }, [selectedLayer?.id]);

  useEffect(() => {
    if (!localRefToast) return;
    const t = window.setTimeout(() => setLocalRefToast(""), 3000);
    return () => window.clearTimeout(t);
  }, [localRefToast]);

  const localRefs = selectedLayer?.localRefs ?? [];
  const localRefId = localRefs[0]?.id;
  const thumbUrlRef = useRef<string>("");
  useEffect(() => {
    if (!localRefId) {
      if (thumbUrlRef.current) {
        URL.revokeObjectURL(thumbUrlRef.current);
        thumbUrlRef.current = "";
      }
      setLocalRefThumb("");
      return;
    }
    getRefBlob(localRefId)
      .then((blob) => {
        if (!blob) return;
        if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
        const url = URL.createObjectURL(blob);
        thumbUrlRef.current = url;
        setLocalRefThumb(url);
      })
      .catch(() => setLocalRefThumb(""));
    return () => {
      if (thumbUrlRef.current) {
        URL.revokeObjectURL(thumbUrlRef.current);
        thumbUrlRef.current = "";
      }
      setLocalRefThumb("");
    };
  }, [localRefId]);

  function commitRename() {
    if (!selectedLayer || !onRenameLayer) return;
    const nextId = idDraft.trim();
    if (!nextId || nextId === selectedLayer.id) {
      setIdEditing(false);
      setIdDraft(selectedLayer.id);
      return;
    }
    const exists = (scene.layers ?? []).some((l) => l.id === nextId);
    if (exists) return;
    const layers = (scene.layers ?? []).map((l) =>
      l.id === selectedLayer.id ? { ...l, id: nextId } : l
    );
    onUpdateScene({ ...scene, layers });
    onRenameLayer(selectedLayer.id, nextId);
    setIdEditing(false);
  }

  async function addLocalRefs(type: LocalRefType, files: FileList | null) {
    if (!selectedLayer || !files?.length) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      setLocalRefToast(lang === "zh" ? "未选择有效图片。" : "No valid images selected.");
      return;
    }
    const current = selectedLayer.localRefs ?? [];
    if (current.length >= 1) {
      setLocalRefToast(lang === "zh" ? "每个对象只保留 1 张参考图。" : "One reference image per object.");
      return;
    }
    const file = picked[0];
    const id = `lref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await putRefBlob(id, file);
    const meta: LocalRefMeta = {
      id,
      type,
      name: file.name,
      mime: file.type,
      size: file.size,
      updatedAt: Date.now(),
    };
    onUpdateLayer(selectedLayer.id, { localRefs: [...current, meta] });
    setLocalRefToast(lang === "zh" ? "已添加参考图。" : "Reference added.");
  }

  async function removeLocalRef(meta: LocalRefMeta) {
    if (!selectedLayer) return;
    try {
      await deleteRefBlob(meta.id);
    } catch {
      /* no-op */
    }
    const next = (selectedLayer.localRefs ?? []).filter((x) => x.id !== meta.id);
    onUpdateLayer(selectedLayer.id, { localRefs: next });
  }

  const setContinuityId = (id: string) => {
    if (!selectedLayer) return;
    const next = stageMarkAnchor(scene, selectedLayer, id.trim());
    onUpdateScene(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection title={lang === "zh" ? "对象列表" : "Object list"} icon={Layers} defaultOpen={true}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {layers.map((layer) => {
            const isSelected = layer.id === selectedLayerId;
            const state = getStageObjectState(layer, scene, project);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onSelectLayer(isSelected ? null : layer.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: isSelected ? `${FIGMA_COLORS.accent}20` : "transparent",
                  color: isSelected ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <Layers size={14} style={{ opacity: 0.8, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {layer.id}
                </span>
                {state.continuityId && (
                  <span title={state.continuityId}>
                    <Anchor size={12} style={{ opacity: 0.7, flexShrink: 0 }} aria-label={state.continuityId} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </EditorSection>

      {selectedLayer && (
        <EditorSection title={lang === "zh" ? "当前对象" : "Current object"} defaultOpen={true}>
          {/* Layer rename */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
              {lang === "zh" ? "对象 ID" : "Object ID"}
            </div>
            {idEditing ? (
              <input
                autoFocus
                value={idDraft}
                onChange={(e) => setIdDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setIdEditing(false);
                    setIdDraft(selectedLayer.id);
                  }
                }}
                onBlur={commitRename}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: `1px solid ${FIGMA_COLORS.border}`,
                  background: FIGMA_COLORS.bg,
                  color: FIGMA_COLORS.text,
                  fontSize: 12,
                }}
              />
            ) : (
              <div
                onClick={() => onRenameLayer && setIdEditing(true)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: `1px solid ${FIGMA_COLORS.border}`,
                  background: FIGMA_COLORS.bg,
                  color: FIGMA_COLORS.text,
                  fontSize: 12,
                  cursor: onRenameLayer ? "pointer" : "default",
                }}
                title={onRenameLayer ? (lang === "zh" ? "点击改名" : "Click to rename") : undefined}
              >
                {selectedLayer.id}
              </div>
            )}
          </div>

          <EditorSelect
            label={lang === "zh" ? "类型" : "Type"}
            value={selectedLayer.type ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { type: v })}
            options={[
              { value: "", label: lang === "zh" ? "（未填）" : "(empty)" },
              { value: "character", label: lang === "zh" ? "人物" : "Character" },
              { value: "subject", label: lang === "zh" ? "主体" : "Subject" },
              { value: "station", label: lang === "zh" ? "空间站" : "Station" },
              { value: "spacecraft", label: lang === "zh" ? "飞船" : "Spacecraft" },
              { value: "planet", label: lang === "zh" ? "行星" : "Planet" },
              { value: "satellite", label: lang === "zh" ? "卫星" : "Satellite" },
              { value: "environment", label: lang === "zh" ? "环境" : "Environment" },
              { value: "text", label: lang === "zh" ? "文字" : "Text" },
              { value: "custom", label: lang === "zh" ? "自定义" : "Custom" },
            ]}
          />
          <EditorInput
            label={lang === "zh" ? "外观" : "Look"}
            value={selectedLayer.look ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { look: v })}
            placeholder={lang === "zh" ? "外观描述" : "Appearance description"}
          />
          <EditorInput
            label={lang === "zh" ? "形态 (shapeDesc)" : "Form (shapeDesc)"}
            value={selectedLayer.shapeDesc ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { shapeDesc: v })}
            placeholder={lang === "zh" ? "几何结构描述" : "Geometry description"}
          />
          <EditorInput
            label={lang === "zh" ? "备注" : "Notes"}
            value={selectedLayer.notes ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { notes: v })}
            placeholder={lang === "zh" ? "可选" : "Optional"}
          />
          <EditorInput
            label={lang === "zh" ? "局部提示" : "External prompt"}
            value={selectedLayer.externalPrompt ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { externalPrompt: v })}
            placeholder={lang === "zh" ? "可选" : "Optional"}
          />
          <EditorSelect
            label={lang === "zh" ? "参考策略 (referencePolicy)" : "Ref policy"}
            value={selectedLayer.referencePolicy ?? "optional"}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { referencePolicy: v as "optional" | "required" })}
            options={[
              { value: "optional", label: lang === "zh" ? "可选" : "Optional" },
              { value: "required", label: lang === "zh" ? "必须" : "Required" },
            ]}
          />
          <EditorInput
            label={lang === "zh" ? "参考链接 (referenceLinks)" : "Ref links"}
            value={selectedLayer.referenceLinks ?? ""}
            onChange={(v) => onUpdateLayer(selectedLayer.id, { referenceLinks: v })}
            placeholder={lang === "zh" ? "多行链接" : "Multiple links"}
          />
          <EditorCheckbox
            label={lang === "zh" ? "布局锁定 (layoutLocked)" : "Layout locked"}
            checked={objState?.isLocked ?? false}
            onCheckedChange={(v) => {
              const notes = writeLayoutLocked(selectedLayer.notes ?? "", v);
              onUpdateLayer(selectedLayer.id, { notes });
            }}
          />

          {/* Object refs */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
              {lang === "zh" ? "对象参考图" : "Object Refs"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <label
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${FIGMA_COLORS.border}`,
                  background: FIGMA_COLORS.bg,
                  color: FIGMA_COLORS.text,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {lang === "zh" ? "导入对象图片" : "Import Object Image"}
                <input
                  type="file"
                  accept="image/*"
                  multiple={false}
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    await addLocalRefs("identity" as LocalRefType, e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {localRefs[0] ? (
                <>
                  {localRefThumb ? (
                    <img
                      src={localRefThumb}
                      alt={localRefs[0].name}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                    />
                  ) : null}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {localRefs[0].name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeLocalRef(localRefs[0])}
                    style={{
                      padding: "4px 8px",
                      border: `1px solid ${FIGMA_COLORS.border}`,
                      background: "transparent",
                      color: FIGMA_COLORS.textMuted,
                      fontSize: 11,
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {lang === "zh" ? "移除" : "Remove"}
                  </button>
                </>
              ) : null}
            </div>
            {localRefToast ? (
              <div style={{ marginTop: 4, fontSize: 10, color: FIGMA_COLORS.textMuted }}>{localRefToast}</div>
            ) : null}
          </div>

          {/* continuityId - SINGLE ENTRY (only in Object panel, never in Scene panel) */}
          <EditorInput
            label={lang === "zh" ? "连续性锚点 ID (continuityId)" : "Continuity anchor ID (continuityId)"}
            value={continuityId ?? ""}
            onChange={(v) => setContinuityId(v)}
            placeholder={lang === "zh" ? "如 char_a" : "e.g. char_a"}
          />
          {objState?.labels.includes("anchor-bound") && (
            <div style={{ marginTop: 4, fontSize: 10, color: FIGMA_COLORS.textMuted }}>
              {lang === "zh" ? "已绑定连续性锚点" : "Bound to continuity anchor"}
            </div>
          )}
        </EditorSection>
      )}

      {!selectedLayer && layers.length > 0 && (
        <div style={{ padding: 16, color: FIGMA_COLORS.textMuted, fontSize: 12 }}>
          {lang === "zh" ? "点击上方对象进行编辑" : "Click an object above to edit"}
        </div>
      )}
      {layers.length === 0 && (
        <div style={{ padding: 16, color: FIGMA_COLORS.textMuted, fontSize: 12 }}>
          {lang === "zh" ? "当前场景暂无对象" : "No objects in this scene"}
        </div>
      )}
    </div>
  );
}
