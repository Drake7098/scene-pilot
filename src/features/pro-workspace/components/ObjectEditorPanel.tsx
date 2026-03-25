/**
 * ObjectEditorPanel — Step 6
 * 对象字段归组显示：主体 / 外观&服装 / 道具 / 动作 / 状态 / 细节
 * 不改数据结构，只改 UI 呈现分组。
 * Layer 字段：type / look / shapeDesc / notes / externalPrompt / referenceLinks / localRefs
 * 扩展字段通过 notes 内嵌 marker 存储。
 */
import React, { useEffect, useRef, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, Layer, LocalRefMeta, LocalRefType } from "../../../model";
import { EditorSection, EditorInput, EditorSelect, EditorCheckbox } from "../../../components/ui";
import { Users, Anchor, User, Shirt, Package, Zap, Activity, Info, Plus, Trash2 } from "lucide-react";
import { getLayerAnchorId, stageMarkAnchor } from "../../../features/stage-editor/actions/stageMarkAnchor";
import { getStageObjectState, writeLayoutLocked } from "../../../features/stage-editor/guards/stageObjectState";
import { deleteRefBlob, getRefBlob, putRefBlob } from "../../../utils/localRefs";
import { FIGMA_COLORS } from "../constants";
import { editorTheme } from "../../../theme/editorTheme";

const { typography, spacing, sizing, radius } = editorTheme;

// ── Marker helpers (stored in layer.notes) ─────────────────────────────────
function mkLayerMark(mark: string) {
  return {
    parse(notes: string) {
      const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(mark));
      return hit ? hit.trim().slice(mark.length).trim() : "";
    },
    write(notes: string, v: string) {
      const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(mark));
      if (v.trim()) lines.push(`${mark}${v.trim()}`);
      return lines.join("\n");
    },
  };
}

const ACTION_M   = mkLayerMark("action:");
const POSE_M     = mkLayerMark("pose:");
const EXPR_M     = mkLayerMark("expression:");
const COSTUME_M  = mkLayerMark("costume:");
const ACCESSORY_M= mkLayerMark("accessory:");
const PROP_M     = mkLayerMark("prop:");
const STATUS_M   = mkLayerMark("status:");
const EMOTION_M  = mkLayerMark("emotion:");
const DETAIL_M   = mkLayerMark("detail:");

// ── Types ──────────────────────────────────────────────────────────────────
type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateScene: (s: Scene) => void;
  onUpdateLayer: (layerId: string, patch: Partial<Layer>) => void;
  onRenameLayer?: (oldId: string, newId: string) => void;
  onAddLayer?: () => void;
  onDeleteLayer?: (layerId: string) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

// ── Select option sets ─────────────────────────────────────────────────────
const typeOptions = (lang: Lang) => [
  { value: "",            label: tl(lang, "─ 未定义",    "─ Undefined") },
  { value: "character",   label: tl(lang, "人物角色",    "Character") },
  { value: "subject",     label: tl(lang, "主体",        "Subject") },
  { value: "product",     label: tl(lang, "产品",        "Product") },
  { value: "animal",      label: tl(lang, "动物",        "Animal") },
  { value: "vehicle",     label: tl(lang, "载具",        "Vehicle") },
  { value: "spacecraft",  label: tl(lang, "飞船",        "Spacecraft") },
  { value: "creature",    label: tl(lang, "生物",        "Creature") },
  { value: "environment", label: tl(lang, "环境元素",    "Environment") },
  { value: "prop",        label: tl(lang, "道具",        "Prop") },
  { value: "text",        label: tl(lang, "文字",        "Text / Logo") },
  { value: "custom",      label: tl(lang, "自定义",      "Custom") },
];

const actionOptions = (lang: Lang) => [
  { value: "",            label: tl(lang, "─ 未定义",    "─ Undefined") },
  { value: "standing",    label: tl(lang, "站立",        "Standing") },
  { value: "sitting",     label: tl(lang, "坐姿",        "Sitting") },
  { value: "walking",     label: tl(lang, "行走",        "Walking") },
  { value: "running",     label: tl(lang, "奔跑",        "Running") },
  { value: "jumping",     label: tl(lang, "跳跃",        "Jumping") },
  { value: "crouching",   label: tl(lang, "蹲伏",        "Crouching") },
  { value: "turning",     label: tl(lang, "转身",        "Turning") },
  { value: "reaching",    label: tl(lang, "伸手",        "Reaching Out") },
  { value: "fighting",    label: tl(lang, "战斗",        "Fighting") },
  { value: "dancing",     label: tl(lang, "舞动",        "Dancing") },
  { value: "eating",      label: tl(lang, "进食",        "Eating") },
  { value: "looking",     label: tl(lang, "凝视",        "Looking / Gazing") },
  { value: "custom",      label: tl(lang, "自定义",      "Custom") },
];

const poseOptions = (lang: Lang) => [
  { value: "",            label: tl(lang, "─ 未定义",    "─ Undefined") },
  { value: "power_pose",  label: tl(lang, "强势站姿",    "Power Pose") },
  { value: "relaxed",     label: tl(lang, "放松自然",    "Relaxed / Casual") },
  { value: "confrontational", label: tl(lang, "对峙紧张","Confrontational") },
  { value: "hero_entry",  label: tl(lang, "英雄亮相",    "Hero Entry") },
  { value: "collapsed",   label: tl(lang, "倒地",        "Collapsed / Fallen") },
  { value: "reaching_sky",label: tl(lang, "举手仰天",    "Arms Raised / Triumph") },
  { value: "profile",     label: tl(lang, "侧身",        "Profile / Side View") },
  { value: "back_to_cam", label: tl(lang, "背对镜头",    "Back to Camera") },
  { value: "custom",      label: tl(lang, "自定义",      "Custom") },
];

const expressionOptions = (lang: Lang) => [
  { value: "",            label: tl(lang, "─ 未定义",    "─ Undefined") },
  { value: "neutral",     label: tl(lang, "中性",        "Neutral") },
  { value: "determined",  label: tl(lang, "坚毅",        "Determined") },
  { value: "joyful",      label: tl(lang, "喜悦",        "Joyful") },
  { value: "sad",         label: tl(lang, "悲伤",        "Sad") },
  { value: "angry",       label: tl(lang, "愤怒",        "Angry") },
  { value: "fearful",     label: tl(lang, "恐惧",        "Fearful") },
  { value: "surprised",   label: tl(lang, "惊讶",        "Surprised") },
  { value: "confident",   label: tl(lang, "自信",        "Confident") },
  { value: "vulnerable",  label: tl(lang, "脆弱",        "Vulnerable") },
  { value: "stoic",       label: tl(lang, "木然",        "Stoic") },
  { value: "custom",      label: tl(lang, "自定义",      "Custom") },
];

const emotionOptions = (lang: Lang) => [
  { value: "",            label: tl(lang, "─ 未定义",    "─ Undefined") },
  { value: "calm",        label: tl(lang, "平静",        "Calm") },
  { value: "tense",       label: tl(lang, "紧绷",        "Tense") },
  { value: "melancholic", label: tl(lang, "忧郁",        "Melancholic") },
  { value: "euphoric",    label: tl(lang, "亢奋",        "Euphoric") },
  { value: "desperate",   label: tl(lang, "绝望",        "Desperate") },
  { value: "mysterious",  label: tl(lang, "神秘",        "Mysterious") },
  { value: "playful",     label: tl(lang, "调皮",        "Playful") },
  { value: "custom",      label: tl(lang, "自定义",      "Custom") },
];

// ── Main component ─────────────────────────────────────────────────────────
export function ObjectEditorPanel({
  lang, scene, project, selectedLayerId, onSelectLayer,
  onUpdateScene, onUpdateLayer, onRenameLayer,
  onAddLayer, onDeleteLayer,
}: Props) {
  const layers = scene.layers ?? [];
  const selectedLayer = selectedLayerId ? layers.find((l) => l.id === selectedLayerId) ?? null : null;
  const objState = selectedLayer ? getStageObjectState(selectedLayer, scene, project) : null;
  const continuityId = selectedLayer ? getLayerAnchorId(selectedLayer) : null;

  const [idEditing, setIdEditing] = useState(false);
  const [idDraft, setIdDraft] = useState("");
  const [localRefToast, setLocalRefToast] = useState("");
  const [localRefThumb, setLocalRefThumb] = useState("");

  useEffect(() => { setIdEditing(false); setIdDraft(selectedLayer?.id ?? ""); }, [selectedLayer?.id]);
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
      if (thumbUrlRef.current) { URL.revokeObjectURL(thumbUrlRef.current); thumbUrlRef.current = ""; }
      setLocalRefThumb(""); return;
    }
    getRefBlob(localRefId).then((blob) => {
      if (!blob) return;
      if (thumbUrlRef.current) URL.revokeObjectURL(thumbUrlRef.current);
      const url = URL.createObjectURL(blob);
      thumbUrlRef.current = url; setLocalRefThumb(url);
    }).catch(() => setLocalRefThumb(""));
    return () => {
      if (thumbUrlRef.current) { URL.revokeObjectURL(thumbUrlRef.current); thumbUrlRef.current = ""; }
      setLocalRefThumb("");
    };
  }, [localRefId]);

  function commitRename() {
    if (!selectedLayer || !onRenameLayer) return;
    const nextId = idDraft.trim();
    if (!nextId || nextId === selectedLayer.id) { setIdEditing(false); setIdDraft(selectedLayer.id); return; }
    const exists = (scene.layers ?? []).some((l) => l.id === nextId);
    if (exists) return;
    const newLayers = (scene.layers ?? []).map((l) => l.id === selectedLayer.id ? { ...l, id: nextId } : l);
    onUpdateScene({ ...scene, layers: newLayers });
    onRenameLayer(selectedLayer.id, nextId);
    setIdEditing(false);
  }

  async function addLocalRefs(type: LocalRefType, files: FileList | null) {
    if (!selectedLayer || !files?.length) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) { setLocalRefToast(tl(lang, "未选择有效图片", "No valid images selected")); return; }
    const current = selectedLayer.localRefs ?? [];
    if (current.length >= 1) { setLocalRefToast(tl(lang, "每个对象只保留 1 张参考图", "One reference image per object")); return; }
    const file = picked[0];
    const id = `lref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await putRefBlob(id, file);
    const meta: LocalRefMeta = { id, type, name: file.name, mime: file.type, size: file.size, updatedAt: Date.now() };
    onUpdateLayer(selectedLayer.id, { localRefs: [...current, meta] });
    setLocalRefToast(tl(lang, "已添加参考图", "Reference added"));
  }

  async function removeLocalRef(meta: LocalRefMeta) {
    if (!selectedLayer) return;
    try { await deleteRefBlob(meta.id); } catch {}
    const next = (selectedLayer.localRefs ?? []).filter((x) => x.id !== meta.id);
    onUpdateLayer(selectedLayer.id, { localRefs: next });
  }

  const setContinuityId = (id: string) => {
    if (!selectedLayer) return;
    const next = stageMarkAnchor(scene, selectedLayer, id.trim());
    onUpdateScene(next);
  };

  // Helper: update layer notes via marker
  function updateLayerNotes(mark: { write: (n: string, v: string) => string }, value: string) {
    if (!selectedLayer) return;
    const nextNotes = mark.write(selectedLayer.notes ?? "", value);
    onUpdateLayer(selectedLayer.id, { notes: nextNotes });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Step header */}
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 6 · 对象", "Step 6 · Objects")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择对象并按专业分组填写属性", "Select an object and fill in grouped attributes")}
        </div>
      </div>

      {/* Object list header with add button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: FIGMA_COLORS.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
          <Users size={12} />
          {tl(lang, "对象列表", "Object List")}
        </div>
        {onAddLayer && (
          <button
            type="button"
            onClick={onAddLayer}
            title={tl(lang, "新增对象", "Add object")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 5,
              border: `1px solid ${FIGMA_COLORS.accent}44`,
              background: `${FIGMA_COLORS.accent}10`, color: FIGMA_COLORS.accent,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={11} />
            {tl(lang, "新增对象", "Add")}
          </button>
        )}
      </div>
      <div style={{ padding: "4px 14px 10px" }}>
        {layers.length === 0 ? (
          <div style={{ fontSize: 12, color: FIGMA_COLORS.textMuted, padding: "4px 0" }}>
            {tl(lang, "暂无对象，点右上角「新增」添加", "No objects yet — click Add above")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              const state = getStageObjectState(layer, scene, project);
              const hasAction = ACTION_M.parse(layer.notes ?? "") !== "";
              return (
                <div
                  key={layer.id}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                <button
                  type="button"
                  onClick={() => onSelectLayer(isSelected ? null : layer.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", borderRadius: 7, border: "none",
                    background: isSelected ? `${FIGMA_COLORS.accent}22` : "transparent",
                    color: isSelected ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
                    fontSize: 12, textAlign: "left", cursor: "pointer", flex: 1,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = FIGMA_COLORS.hover; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: isSelected ? FIGMA_COLORS.accent : FIGMA_COLORS.textMuted,
                  }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {layer.id}
                  </span>
                  {layer.type && (
                    <span style={{ fontSize: 10, color: FIGMA_COLORS.textMuted, flexShrink: 0 }}>
                      {layer.type}
                    </span>
                  )}
                  {state.continuityId && <Anchor size={11} style={{ opacity: 0.6, flexShrink: 0 }} />}
                </button>
                {onDeleteLayer && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                    title={tl(lang, "删除对象", "Delete object")}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                      border: "none", background: "transparent",
                      color: FIGMA_COLORS.textMuted, cursor: "pointer",
                      transition: "color 0.1s, background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f87171";
                      e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = FIGMA_COLORS.textMuted;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected layer editor — grouped */}
      {selectedLayer && (
        <>
          {/* ① 主体 */}
          <EditorSection title={tl(lang, "① 主体", "① Subject")} icon={User} defaultOpen={true}>
            {/* ID / rename */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: typography.labelSize, fontWeight: typography.labelWeight, color: FIGMA_COLORS.textMuted, marginBottom: spacing.labelToControl }}>
                {tl(lang, "对象 ID", "Object ID")}
              </div>
              {idEditing ? (
                <input
                  autoFocus value={idDraft}
                  onChange={(e) => setIdDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setIdEditing(false); setIdDraft(selectedLayer.id); } }}
                  onBlur={commitRename}
                  style={{ width: "100%", minHeight: sizing.controlHeight, padding: `0 ${spacing.inputPaddingX}px`, borderRadius: radius.input, border: `1px solid ${FIGMA_COLORS.border}`, background: FIGMA_COLORS.bg, color: FIGMA_COLORS.text, fontSize: typography.bodySize }}
                />
              ) : (
                <div
                  onClick={() => onRenameLayer && setIdEditing(true)}
                  style={{ minHeight: sizing.controlHeight, padding: `0 ${spacing.inputPaddingX}px`, display: "flex", alignItems: "center", borderRadius: radius.input, border: `1px solid ${FIGMA_COLORS.border}`, background: FIGMA_COLORS.bg, color: FIGMA_COLORS.text, fontSize: typography.bodySize, cursor: onRenameLayer ? "pointer" : "default" }}
                  title={onRenameLayer ? tl(lang, "点击改名", "Click to rename") : undefined}
                >
                  {selectedLayer.id}
                </div>
              )}
            </div>

            <EditorSelect
              label={tl(lang, "对象类型", "Object Type")}
              value={selectedLayer.type ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { type: v })}
              options={typeOptions(lang)}
            />
            <EditorInput
              label={tl(lang, "主体描述", "Subject Description")}
              value={selectedLayer.look ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { look: v })}
              placeholder={tl(lang, "角色外观、身形、整体描述", "Character appearance, build, overall description")}
            />

            {/* Reference image */}
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 4 }}>
                {tl(lang, "主体参考图", "Subject Reference")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <label style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${FIGMA_COLORS.border}`, background: FIGMA_COLORS.bg, color: FIGMA_COLORS.text, fontSize: 11, cursor: "pointer" }}>
                  {tl(lang, "导入图片", "Import Image")}
                  <input type="file" accept="image/*" multiple={false} style={{ display: "none" }}
                    onChange={async (e) => { await addLocalRefs("identity" as LocalRefType, e.target.files); e.target.value = ""; }} />
                </label>
                {localRefs[0] && (
                  <>
                    {localRefThumb && <img src={localRefThumb} alt={localRefs[0].name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }} />}
                    <span style={{ flex: 1, minWidth: 0, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{localRefs[0].name}</span>
                    <button type="button" onClick={() => void removeLocalRef(localRefs[0])}
                      style={{ padding: "3px 7px", border: `1px solid ${FIGMA_COLORS.border}`, background: "transparent", color: FIGMA_COLORS.textMuted, fontSize: 10, borderRadius: 4, cursor: "pointer" }}>
                      {tl(lang, "移除", "Remove")}
                    </button>
                  </>
                )}
              </div>
              {localRefToast && <div style={{ marginTop: 3, fontSize: 10, color: FIGMA_COLORS.textMuted }}>{localRefToast}</div>}
            </div>
          </EditorSection>

          {/* ② 外观 & 服装 */}
          <EditorSection title={tl(lang, "② 外观 & 服装", "② Appearance & Costume")} icon={Shirt} defaultOpen={false}>
            <EditorInput
              label={tl(lang, "形态描述", "Form / Shape")}
              value={selectedLayer.shapeDesc ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { shapeDesc: v })}
              placeholder={tl(lang, "几何结构、轮廓、体态", "Geometry, silhouette, body structure")}
            />
            <EditorInput
              label={tl(lang, "服装 / 着装", "Costume / Outfit")}
              value={COSTUME_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(COSTUME_M, v)}
              placeholder={tl(lang, "具体描述服装样式、颜色、材质", "Describe outfit style, color, fabric")}
            />
            <EditorInput
              label={tl(lang, "配饰", "Accessories")}
              value={ACCESSORY_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(ACCESSORY_M, v)}
              placeholder={tl(lang, "帽子、眼镜、首饰、包包等", "Hat, glasses, jewelry, bag, etc.")}
            />
          </EditorSection>

          {/* ③ 道具 */}
          <EditorSection title={tl(lang, "③ 道具", "③ Props")} icon={Package} defaultOpen={false}>
            <EditorInput
              label={tl(lang, "持有道具", "Held Prop")}
              value={PROP_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(PROP_M, v)}
              placeholder={tl(lang, "武器、工具、物品，以及如何持握", "Weapon, tool, item — and how it's held")}
            />
            <EditorInput
              label={tl(lang, "外部提示补充", "Extra Prompt Append")}
              value={selectedLayer.externalPrompt ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { externalPrompt: v })}
              placeholder={tl(lang, "直接追加进提示词的自定义内容", "Custom text appended directly to the prompt")}
            />
          </EditorSection>

          {/* ④ 动作 */}
          <EditorSection title={tl(lang, "④ 动作", "④ Action")} icon={Zap} defaultOpen={true}>
            <EditorSelect
              compact
              label={tl(lang, "主要动作", "Primary Action")}
              value={ACTION_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(ACTION_M, v)}
              options={actionOptions(lang)}
            />
            <EditorSelect
              compact
              label={tl(lang, "姿态", "Pose")}
              value={POSE_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(POSE_M, v)}
              options={poseOptions(lang)}
            />
          </EditorSection>

          {/* ⑤ 状态 */}
          <EditorSection title={tl(lang, "⑤ 状态", "⑤ State")} icon={Activity} defaultOpen={false}>
            <EditorSelect
              compact
              label={tl(lang, "面部表情", "Facial Expression")}
              value={EXPR_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(EXPR_M, v)}
              options={expressionOptions(lang)}
            />
            <EditorSelect
              compact
              label={tl(lang, "情绪内核", "Emotional State")}
              value={EMOTION_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(EMOTION_M, v)}
              options={emotionOptions(lang)}
            />
            <EditorInput
              label={tl(lang, "状态备注", "Status Note")}
              value={STATUS_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(STATUS_M, v)}
              placeholder={tl(lang, "伤势、疲惫、特殊状态等", "Injuries, exhaustion, special conditions, etc.")}
            />
          </EditorSection>

          {/* ⑥ 细节 */}
          <EditorSection title={tl(lang, "⑥ 细节", "⑥ Detail")} icon={Info} defaultOpen={false}>
            <EditorInput
              label={tl(lang, "细节补充", "Fine Detail")}
              value={DETAIL_M.parse(selectedLayer.notes ?? "")}
              onChange={(v) => updateLayerNotes(DETAIL_M, v)}
              placeholder={tl(lang, "皮肤纹理、材质细节、特殊标记", "Skin texture, material detail, special marks")}
            />
            <EditorInput
              label={tl(lang, "参考链接", "Reference Links")}
              value={selectedLayer.referenceLinks ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { referenceLinks: v })}
              placeholder={tl(lang, "多行链接", "Multiple URLs, one per line")}
            />
            <EditorSelect
              label={tl(lang, "参考策略", "Reference Policy")}
              value={selectedLayer.referencePolicy ?? "optional"}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { referencePolicy: v as "optional" | "required" })}
              options={[
                { value: "optional", label: tl(lang, "可选", "Optional") },
                { value: "required", label: tl(lang, "必须", "Required") },
              ]}
            />
            <EditorInput
              label={tl(lang, "备注", "Notes")}
              value={selectedLayer.notes ?? ""}
              onChange={(v) => onUpdateLayer(selectedLayer.id, { notes: v })}
              placeholder={tl(lang, "仅供内部参考，不进提示词", "Internal note — not sent to prompt")}
            />
            <EditorCheckbox
              label={tl(lang, "布局锁定", "Layout Locked")}
              checked={objState?.isLocked ?? false}
              onCheckedChange={(v) => {
                const notes = writeLayoutLocked(selectedLayer.notes ?? "", v);
                onUpdateLayer(selectedLayer.id, { notes });
              }}
            />
            <EditorInput
              label={tl(lang, "连续性锚点 ID", "Continuity Anchor ID")}
              value={continuityId ?? ""}
              onChange={(v) => setContinuityId(v)}
              placeholder={tl(lang, "如 char_a（跨镜头身份锁定）", "e.g. char_a (cross-shot identity lock)")}
            />
            {objState?.labels.includes("anchor-bound") && (
              <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>
                {tl(lang, "已绑定连续性锚点", "Bound to continuity anchor")}
              </div>
            )}
          </EditorSection>
        </>
      )}

      {!selectedLayer && layers.length > 0 && (
        <div style={{ padding: "16px", color: FIGMA_COLORS.textMuted, fontSize: 12 }}>
          {tl(lang, "点击上方对象进入编辑", "Click an object above to edit")}
        </div>
      )}
    </div>
  );
}
