/**
 * DirectorPanel — Step 2
 * 导演风格 → 影响结构字段（shot/movement/lighting defaults）
 * 不直接输出导演名字到 prompt。
 * 已有 directorStylePacks 系统，这里收束为干净 UI。
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { Clapperboard } from "lucide-react";
import { FIGMA_COLORS } from "../constants";
import {
  DIRECTOR_STYLE_PACKS,
  parseDirectorStylePackId,
  applyDirectorStylePack,
} from "../../../content/directorStylePacks";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

// Narrative rhythm options (stored in notes via marker)
const RHYTHM_MARK = "narrative_rhythm:";
function parseRhythm(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(RHYTHM_MARK));
  return hit ? hit.trim().slice(RHYTHM_MARK.length).trim() : "";
}
function writeRhythm(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(RHYTHM_MARK));
  if (v) lines.push(`${RHYTHM_MARK}${v}`);
  return lines.join("\n");
}

// Tension options
const TENSION_MARK = "visual_tension:";
function parseTension(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(TENSION_MARK));
  return hit ? hit.trim().slice(TENSION_MARK.length).trim() : "";
}
function writeTension(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(TENSION_MARK));
  if (v) lines.push(`${TENSION_MARK}${v}`);
  return lines.join("\n");
}

export function DirectorPanel({ lang, scene, project, onUpdateScene }: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const packId = parseDirectorStylePackId(scene.notes ?? "");
  const currentPack = DIRECTOR_STYLE_PACKS.find((p) => p.id === packId) ?? null;

  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  const packOptions = [
    { value: "", label: tl(lang, "─ 未定义（系统自动）", "─ Undefined (auto)") },
    ...DIRECTOR_STYLE_PACKS.map((p) => ({
      value: p.id,
      label: tl(lang, p.labelZh, p.labelEn),
    })),
  ];

  const rhythmOptions = [
    { value: "",             label: tl(lang, "─ 未定义",    "─ Undefined") },
    { value: "slow_build",   label: tl(lang, "缓慢铺垫",    "Slow Build") },
    { value: "steady",       label: tl(lang, "匀速稳进",    "Steady Pace") },
    { value: "accelerate",   label: tl(lang, "逐渐加速",    "Accelerate") },
    { value: "burst",        label: tl(lang, "短促爆发",    "Burst / Punchy") },
    { value: "breath",       label: tl(lang, "呼吸感",      "Breathe / Pause") },
    { value: "staccato",     label: tl(lang, "断奏切换",    "Staccato / Jump Cut") },
    { value: "lyrical",      label: tl(lang, "抒情流动",    "Lyrical / Flowing") },
    { value: "meditative",   label: tl(lang, "冥想静默",    "Meditative / Still") },
    { value: "freeform",     label: tl(lang, "自由节奏",    "Freeform") },
  ];

  const tensionOptions = [
    { value: "",             label: tl(lang, "─ 未定义",    "─ Undefined") },
    { value: "minimal",      label: tl(lang, "极简克制",    "Minimal") },
    { value: "balanced",     label: tl(lang, "平衡自然",    "Balanced") },
    { value: "charged",      label: tl(lang, "带电紧绷",    "Charged") },
    { value: "confrontational",label: tl(lang, "对峙剑拔",  "Confrontational") },
    { value: "explosive",    label: tl(lang, "爆炸张力",    "Explosive") },
    { value: "unsettling",   label: tl(lang, "不安悬疑",    "Unsettling / Suspense") },
    { value: "euphoric",     label: tl(lang, "狂喜高涨",    "Euphoric / Ecstatic") },
  ];

  // When a pack is chosen, apply its defaults to camera/lighting
  function handlePackChange(id: string) {
    const pack = DIRECTOR_STYLE_PACKS.find((p) => p.id === id) ?? null;
    const nextNotes = applyDirectorStylePack(scene.notes ?? "", id as any);
    if (!pack) {
      onUpdateScene({ ...scene, notes: nextNotes });
      return;
    }
    const defaults = mediaMode === "video" ? pack.videoDefaults : pack.imageDefaults;
    const nextCamera = { ...(scene.camera ?? {}) };
    const nextLighting = { ...(scene.lighting ?? {}) };
    if (defaults?.shot && !scene.camera?.shot)       nextCamera.shot     = defaults.shot;
    if (mediaMode === "video" && pack.videoDefaults?.movement && !scene.camera?.movement)
      nextCamera.movement = pack.videoDefaults.movement;
    if (defaults?.time && !scene.lighting?.time)     nextLighting.time   = defaults.time;
    if (defaults?.keyDir && !scene.lighting?.key_dir) nextLighting.key_dir = defaults.keyDir;
    if ((defaults as any)?.mood && !scene.lighting?.mood) nextLighting.mood = (defaults as any).mood;
    onUpdateScene({ ...scene, notes: nextNotes, camera: nextCamera, lighting: nextLighting });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 2 · 导演", "Step 2 · Director")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择导演风格包，自动填充镜头与灯光默认值", "Style pack presets shot and lighting defaults automatically")}
        </div>
      </div>

      <EditorSection title={tl(lang, "导演风格包", "Director Style Pack")} icon={Clapperboard} defaultOpen={true}>
        <EditorSelect
          label={tl(lang, "风格包", "Style Pack")}
          value={packId ?? ""}
          onChange={handlePackChange}
          disabled={layoutLocked}
          options={packOptions}
        />
        {/* Pack description */}
        {currentPack && (
          <div
            style={{
              marginTop: 6,
              padding: "8px 10px",
              borderRadius: 6,
              background: `${FIGMA_COLORS.accent}10`,
              border: `1px solid ${FIGMA_COLORS.border}`,
              fontSize: 11,
              color: FIGMA_COLORS.textMuted,
              lineHeight: 1.5,
            }}
          >
            {tl(lang, currentPack.descZh, currentPack.descEn)}
            {currentPack.rhythmCueZh && (
              <div style={{ marginTop: 4, fontStyle: "italic" }}>
                {tl(lang, currentPack.rhythmCueZh, currentPack.rhythmCueEn ?? "")}
              </div>
            )}
          </div>
        )}
      </EditorSection>

      <EditorSection title={tl(lang, "叙事节奏", "Narrative Rhythm")} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "节奏", "Rhythm")}
          value={parseRhythm(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeRhythm(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={rhythmOptions}
        />
      </EditorSection>

      <EditorSection title={tl(lang, "视觉张力", "Visual Tension")} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "张力", "Tension")}
          value={parseTension(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({ ...scene, notes: writeTension(scene.notes ?? "", v) })
          }
          disabled={layoutLocked}
          options={tensionOptions}
        />
      </EditorSection>
    </div>
  );
}
