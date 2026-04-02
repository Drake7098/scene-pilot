/**
 * Rule Engine UI v1 - ConstraintInspectorPanel
 * Composes: RuleSummarySection, ActiveRuleList, DisabledStateSection,
 * ConflictListSection, ResolutionHintSection.
 * Read-only rule inspection, no editing. Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { detectSceneConflicts } from "../../../utils/conflictRules";
import { getStageObjectState } from "../../../features/stage-editor/guards/stageObjectState";
import { resolveSceneConfig } from "../../../model";
import { EditorSection } from "../../../components/ui";
import { Shield, AlertTriangle, Lock, ListChecks, Lightbulb } from "lucide-react";
import { RuleSummarySection } from "./RuleSummarySection";
import { ActiveRuleList } from "./ActiveRuleList";
import { DisabledStateSection } from "./DisabledStateSection";
import { ConflictListSection } from "./ConflictListSection";
import { ResolutionHintSection } from "./ResolutionHintSection";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  selectedLayerId?: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
  onUpdateScene?: (scene: Scene) => void;
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export function ConstraintInspectorPanel({
  lang,
  scene,
  project,
  selectedLayerId,
  onJumpToConflict,
  onUpdateScene,
}: Props) {
  const conflicts = detectSceneConflicts(scene, lang);
  const layers = scene.layers ?? [];
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "full_workflow";
  const layoutLocked = applyMode === "layout_only";

  const objectStates = layers.map((l) => ({
    layer: l,
    state: getStageObjectState(l, scene, project),
  }));

  const objectStateCount = objectStates.filter(
    (s) =>
      s.state.isLocked ||
      s.state.continuityId ||
      s.state.isProtectedLayout ||
      s.state.labels.some((l) => ["locked", "anchor-bound", "protected-layout"].includes(l))
  ).length;

  const hasContent =
    conflicts.length > 0 ||
    layoutLocked ||
    objectStateCount > 0 ||
    mediaMode === "image";

  const readMarker = React.useCallback((notes: string, key: string): string => {
    const line = (notes ?? "").split("\n").find((l) => l.trim().toLowerCase().startsWith(`${key.toLowerCase()}:`));
    return line ? line.trim().slice(key.length + 1).trim() : "";
  }, []);

  const upsertMarker = React.useCallback((notes: string, key: string, value: string): string => {
    const lines = (notes ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const rest = lines.filter((line) => !line.toLowerCase().startsWith(`${key.toLowerCase()}:`));
    return [`${key}: ${value}`, ...rest].join("\n");
  }, []);

  const removeMarker = React.useCallback((notes: string, key: string): string => {
    const lines = (notes ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const rest = lines.filter((line) => !line.toLowerCase().startsWith(`${key.toLowerCase()}:`));
    return rest.join("\n");
  }, []);

  const isDefaultValue = React.useCallback((key: string, value: string): boolean => {
    const v = String(value ?? "").trim().toLowerCase();
    if (!v) return true;
    const defaultsByKey: Record<string, Set<string>> = {
      lock_perspective: new Set(["off"]),
      lock_proportion: new Set(["off"]),
      subject_integrity: new Set(["off"]),
      ground_contact_lock: new Set(["off"]),
      frame_safety_margin: new Set(["off"]),
      pedestal_subordinate: new Set(["off"]),
      pedestal_reflectivity_max: new Set([""]),
      focus_priority: new Set(["default"]),
      support_defocus: new Set(["none"]),
      highlight_discipline: new Set(["default"]),
      palette_discipline: new Set(["default"]),
      visual_climax_mode: new Set(["off"]),
    };
    if (key === "frame_safety_margin" && v === "normal") return true;
    const set = defaultsByKey[key];
    return set ? set.has(v) : false;
  }, []);

  const setMarker = React.useCallback((key: string, value: string) => {
    if (!onUpdateScene) return;
    const nextNotes = isDefaultValue(key, value)
      ? removeMarker(scene.notes ?? "", key)
      : upsertMarker(scene.notes ?? "", key, value);
    onUpdateScene({ ...scene, notes: nextNotes });
  }, [onUpdateScene, scene, upsertMarker, removeMarker, isDefaultValue]);

  const lockPerspective = readMarker(scene.notes ?? "", "lock_perspective") || "off";
  const lockProportion = readMarker(scene.notes ?? "", "lock_proportion") || "off";
  const subjectIntegrity = readMarker(scene.notes ?? "", "subject_integrity") || "off";
  const groundContactLock = readMarker(scene.notes ?? "", "ground_contact_lock") || "off";
  const frameSafetyRaw = readMarker(scene.notes ?? "", "frame_safety_margin");
  const frameSafetyMargin = frameSafetyRaw === "strict" ? "strict" : "off";
  const pedestalSubordinate = readMarker(scene.notes ?? "", "pedestal_subordinate") || "off";
  const pedestalReflectivityMax = readMarker(scene.notes ?? "", "pedestal_reflectivity_max") || "";
  const focusPriority = readMarker(scene.notes ?? "", "focus_priority") || "default";
  const supportDefocus = readMarker(scene.notes ?? "", "support_defocus") || "none";
  const highlightDiscipline = readMarker(scene.notes ?? "", "highlight_discipline") || "default";
  const paletteDiscipline = readMarker(scene.notes ?? "", "palette_discipline") || "default";
  const visualClimaxMode = readMarker(scene.notes ?? "", "visual_climax_mode") || "off";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection
        title={t(lang, "约束策略", "Constraint Strategy")}
        icon={Shield}
        defaultOpen={true}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "透视锁定", "Perspective lock")}
            <select
              value={lockPerspective}
              onChange={(e) => setMarker("lock_perspective", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "关闭", "Off")}</option>
              <option value="natural">{t(lang, "自然", "Natural")}</option>
              <option value="strict">{t(lang, "严格", "Strict")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "比例锁定", "Proportion lock")}
            <select
              value={lockProportion}
              onChange={(e) => setMarker("lock_proportion", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "关闭", "Off")}</option>
              <option value="on">{t(lang, "开启", "On")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "主体完整性", "Subject integrity")}
            <select
              value={subjectIntegrity}
              onChange={(e) => setMarker("subject_integrity", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "未选择", "Not selected")}</option>
              <option value="full_body_required">{t(lang, "必须全身完整", "Full body required")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "地面接触锁", "Ground contact lock")}
            <select
              value={groundContactLock}
              onChange={(e) => setMarker("ground_contact_lock", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "关闭", "Off")}</option>
              <option value="on">{t(lang, "开启", "On")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "边界安全区", "Frame safety margin")}
            <select
              value={frameSafetyMargin}
              onChange={(e) => setMarker("frame_safety_margin", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "未选择", "Not selected")}</option>
              <option value="strict">{t(lang, "严格", "Strict")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "底座降权", "Pedestal subordinate")}
            <select
              value={pedestalSubordinate}
              onChange={(e) => setMarker("pedestal_subordinate", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "关闭", "Off")}</option>
              <option value="on">{t(lang, "开启", "On")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "底座反射上限", "Pedestal reflectivity max")}
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={pedestalReflectivityMax}
              onChange={(e) => setMarker("pedestal_reflectivity_max", e.target.value)}
              disabled={!onUpdateScene}
              placeholder={t(lang, "未选择", "Not selected")}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30, padding: "0 8px" }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "焦点优先", "Focus priority")}
            <select
              value={focusPriority}
              onChange={(e) => setMarker("focus_priority", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="default">{t(lang, "默认", "Default")}</option>
              <option value="hero_only">{t(lang, "仅主物", "Hero only")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "支撑失焦", "Support defocus")}
            <select
              value={supportDefocus}
              onChange={(e) => setMarker("support_defocus", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="none">{t(lang, "无", "None")}</option>
              <option value="slight">{t(lang, "轻度", "Slight")}</option>
              <option value="medium">{t(lang, "中度", "Medium")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "高光纪律", "Highlight discipline")}
            <select
              value={highlightDiscipline}
              onChange={(e) => setMarker("highlight_discipline", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="default">{t(lang, "默认", "Default")}</option>
              <option value="hero_edge_only">{t(lang, "主物边缘优先", "Hero edge only")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db" }}>
            {t(lang, "色彩纪律", "Palette discipline")}
            <select
              value={paletteDiscipline}
              onChange={(e) => setMarker("palette_discipline", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="default">{t(lang, "默认", "Default")}</option>
              <option value="warm_amber_limited">{t(lang, "暖琥珀限色", "Warm amber limited")}</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#d1d5db", gridColumn: "1 / span 2" }}>
            {t(lang, "终帧峰值", "Visual climax")}
            <select
              value={visualClimaxMode}
              onChange={(e) => setMarker("visual_climax_mode", e.target.value)}
              disabled={!onUpdateScene}
              style={{ background: "#1f2125", color: "#e5e7eb", border: "1px solid #3a3f46", borderRadius: 6, height: 30 }}
            >
              <option value="off">{t(lang, "关闭", "Off")}</option>
              <option value="silhouette_contour_peak">{t(lang, "轮廓高光峰值", "Silhouette contour peak")}</option>
            </select>
          </label>
        </div>
      </EditorSection>

      <EditorSection
        title={t(lang, "规则汇总", "Rule Summary")}
        icon={Shield}
        defaultOpen={true}
      >
        <RuleSummarySection
          lang={lang}
          conflicts={conflicts}
          layoutLocked={layoutLocked}
          objectStateCount={objectStateCount}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "生效规则", "Active Rules")}
        icon={ListChecks}
        defaultOpen={conflicts.length > 0}
      >
        <ActiveRuleList
          lang={lang}
          conflicts={conflicts}
          selectedLayerId={selectedLayerId}
          onJumpToConflict={onJumpToConflict}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "禁用字段", "Disabled Fields")}
        icon={Lock}
        defaultOpen={layoutLocked || mediaMode === "image" || objectStateCount > 0}
      >
        <DisabledStateSection
          lang={lang}
          layoutLocked={layoutLocked}
          mediaMode={mediaMode}
          objectStates={objectStates}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "冲突列表", "Conflicts")}
        icon={AlertTriangle}
        defaultOpen={conflicts.length > 0}
      >
        <ConflictListSection
          lang={lang}
          conflicts={conflicts}
          selectedLayerId={selectedLayerId}
          onJumpToConflict={onJumpToConflict}
        />
      </EditorSection>

      <EditorSection
        title={t(lang, "处理建议", "Resolution Hints")}
        icon={Lightbulb}
        defaultOpen={conflicts.length > 0 || layoutLocked}
      >
        <ResolutionHintSection
          lang={lang}
          conflicts={conflicts}
          layoutLocked={layoutLocked}
        />
      </EditorSection>

      {!hasContent && (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 12,
          }}
        >
          {t(lang, "暂无约束或冲突", "No constraints or conflicts")}
        </div>
      )}
    </div>
  );
}
