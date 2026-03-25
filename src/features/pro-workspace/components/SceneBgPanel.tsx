/**
 * SceneBgPanel — Step 5
 * 场景环境 + 背景（从 SceneEditorPanel 拆出，移除多分镜continuity）
 */
import React, { useEffect, useRef, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, SceneRefMeta } from "../../../model";
import { EditorSection, EditorInput, EditorSelect } from "../../../components/ui";
import { Mountain, Image as ImageIcon } from "lucide-react";
import { FIGMA_COLORS } from "../constants";
import { deleteRefBlob, getRefBlob, putRefBlob } from "../../../utils/localRefs";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

const BG_MARK = "bg:";
function parseBg(notes: string): string {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().toLowerCase().startsWith(BG_MARK));
  return hit ? hit.trim().slice(BG_MARK.length).trim() : "";
}
function setBg(notes: string, bg: string): string {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().toLowerCase().startsWith(BG_MARK));
  if (bg.trim()) lines.unshift(`${BG_MARK} ${bg.trim()}`);
  return lines.join("\n");
}

const BG_PRESET_OPTIONS = (lang: Lang) => [
  { value: "", label: tl(lang, "─ 未定义", "─ Undefined") },
  // Studio
  { value: "plain white seamless backdrop",  label: tl(lang, "白底棚拍", "White Studio") },
  { value: "plain black seamless backdrop",  label: tl(lang, "黑底棚拍", "Black Studio") },
  { value: "neutral gray studio backdrop",   label: tl(lang, "灰底棚拍", "Gray Studio") },
  // Interior
  { value: "modern indoor living room",      label: tl(lang, "现代客厅", "Living Room") },
  { value: "minimal office, clean desk",     label: tl(lang, "极简办公室", "Minimal Office") },
  { value: "luxury hotel lobby",             label: tl(lang, "奢华酒店大堂", "Luxury Lobby") },
  { value: "warehouse loft, exposed brick",  label: tl(lang, "工业风仓库", "Industrial Loft") },
  // Urban exterior
  { value: "city street, wet pavement, dense storefront signs", label: tl(lang, "城市街道", "City Street") },
  { value: "urban rooftop skyline",          label: tl(lang, "城市天台", "Rooftop Skyline") },
  { value: "neon-lit alley, cyberpunk",      label: tl(lang, "霓虹街巷", "Neon Alley") },
  { value: "clean futuristic corridor",      label: tl(lang, "科幻走廊", "Futuristic Corridor") },
  // Nature
  { value: "forest clearing, natural haze",  label: tl(lang, "森林空地", "Forest Clearing") },
  { value: "desert dunes",                   label: tl(lang, "沙漠", "Desert Dunes") },
  { value: "coastal beach, open sky",        label: tl(lang, "海岸", "Coastal Beach") },
  { value: "mountain peak, thin clouds",     label: tl(lang, "山顶云海", "Mountain Summit") },
  // Abstract / other
  { value: "deep space, dense starfield",    label: tl(lang, "深空", "Deep Space") },
  { value: "abstract gradient, dark tones",  label: tl(lang, "抽象渐变", "Abstract Gradient") },
  { value: "__custom__",                     label: tl(lang, "自定义…", "Custom…") },
];

const ENVIRONMENT_MARK = "env_mood:";
function parseEnvMood(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(ENVIRONMENT_MARK));
  return hit ? hit.trim().slice(ENVIRONMENT_MARK.length).trim() : "";
}
function writeEnvMood(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(ENVIRONMENT_MARK));
  if (v) lines.push(`${ENVIRONMENT_MARK}${v}`);
  return lines.join("\n");
}

export function SceneBgPanel({ lang, scene, project, onUpdateScene }: Props) {
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  const [bgRefThumb, setBgRefThumb] = useState("");
  const [bgRefToast, setBgRefToast] = useState("");
  const bgRefThumbUrlRef = useRef<string>("");

  useEffect(() => {
    const id = scene.backgroundRef?.id;
    if (!id) {
      if (bgRefThumbUrlRef.current) { URL.revokeObjectURL(bgRefThumbUrlRef.current); bgRefThumbUrlRef.current = ""; }
      setBgRefThumb(""); return;
    }
    getRefBlob(id).then((blob) => {
      if (!blob) return;
      if (bgRefThumbUrlRef.current) URL.revokeObjectURL(bgRefThumbUrlRef.current);
      const url = URL.createObjectURL(blob);
      bgRefThumbUrlRef.current = url;
      setBgRefThumb(url);
    }).catch(() => setBgRefThumb(""));
    return () => {
      if (bgRefThumbUrlRef.current) { URL.revokeObjectURL(bgRefThumbUrlRef.current); bgRefThumbUrlRef.current = ""; }
      setBgRefThumb("");
    };
  }, [scene.backgroundRef?.id]);

  async function setSceneBackgroundRef(files: FileList | null) {
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) { setBgRefToast(tl(lang, "未选择有效图片", "No valid image selected")); return; }
    const file = picked[0];
    const nextRef: SceneRefMeta = { id: `bgref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`, name: file.name, mime: file.type, size: file.size, updatedAt: Date.now() };
    await putRefBlob(nextRef.id, file);
    const prev = scene.backgroundRef;
    if (prev?.id) { try { await deleteRefBlob(prev.id); } catch {} }
    onUpdateScene({ ...scene, backgroundRef: nextRef });
    setBgRefToast(tl(lang, "已更新背景参考图", "Background reference updated"));
  }

  async function removeSceneBackgroundRef() {
    const prev = scene.backgroundRef;
    if (!prev?.id) return;
    try { await deleteRefBlob(prev.id); } catch {}
    onUpdateScene({ ...scene, backgroundRef: undefined });
    setBgRefToast(tl(lang, "已移除背景参考图", "Background reference removed"));
  }

  const bgValue = (() => {
    const v = parseBg(scene.notes ?? "");
    const presets = BG_PRESET_OPTIONS(lang).map((o) => o.value).filter((v) => v && v !== "__custom__");
    return presets.includes(v) ? v : v ? "__custom__" : "";
  })();

  const envMoodOptions = [
    { value: "",          label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "bright",    label: tl(lang, "明亮清透",   "Bright & Airy") },
    { value: "moody",     label: tl(lang, "氛围昏暗",   "Moody & Dark") },
    { value: "foggy",     label: tl(lang, "雾气朦胧",   "Foggy / Hazy") },
    { value: "warm",      label: tl(lang, "温暖金调",   "Warm / Golden") },
    { value: "cold",      label: tl(lang, "冷调蓝灰",   "Cold / Steel Blue") },
    { value: "neon",      label: tl(lang, "霓虹色彩",   "Neon Colored") },
    { value: "minimal",   label: tl(lang, "极简留白",   "Minimal / Clean") },
    { value: "dramatic",  label: tl(lang, "戏剧对比",   "Dramatic Contrast") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 5 · 场景", "Step 5 · Scene")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "设定背景环境和氛围基调", "Set environment background and mood tone")}
        </div>
      </div>

      <EditorSection title={tl(lang, "场景背景", "Scene Background")} icon={Mountain} defaultOpen={true}>
        <EditorSelect
          compact
          label={tl(lang, "背景预设", "Background Preset")}
          value={bgValue}
          onChange={(v) => {
            if (v !== "__custom__") onUpdateScene({ ...scene, notes: setBg(scene.notes ?? "", v) });
          }}
          disabled={layoutLocked}
          options={BG_PRESET_OPTIONS(lang)}
        />
        <EditorInput
          compact
          label={tl(lang, "自定义背景描述", "Custom Background")}
          value={parseBg(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: setBg(scene.notes ?? "", v) })}
          disabled={layoutLocked}
          placeholder={tl(lang, "bg: 详细描述场景背景", "bg: describe the background scene")}
        />

        <EditorSelect
          compact
          label={tl(lang, "环境氛围", "Environment Mood")}
          value={parseEnvMood(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: writeEnvMood(scene.notes ?? "", v) })}
          disabled={layoutLocked}
          options={envMoodOptions}
        />
      </EditorSection>

      <EditorSection title={tl(lang, "背景参考图", "Background Reference")} icon={ImageIcon} defaultOpen={false}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
          <label style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${FIGMA_COLORS.border}`, background: FIGMA_COLORS.bg, color: FIGMA_COLORS.text, fontSize: 12, cursor: layoutLocked ? "not-allowed" : "pointer", opacity: layoutLocked ? 0.6 : 1 }}>
            {tl(lang, "导入背景图片", "Import Background Image")}
            <input type="file" accept="image/*" multiple={false} style={{ display: "none" }} disabled={layoutLocked} onChange={async (e) => { await setSceneBackgroundRef(e.target.files); e.target.value = ""; }} />
          </label>
          {scene.backgroundRef ? (
            <>
              {bgRefThumb && <img src={bgRefThumb} alt={scene.backgroundRef.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
              <span style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{scene.backgroundRef.name}</span>
              <button type="button" onClick={() => void removeSceneBackgroundRef()} style={{ padding: "4px 8px", border: `1px solid ${FIGMA_COLORS.border}`, background: "transparent", color: FIGMA_COLORS.textMuted, fontSize: 11, borderRadius: 4, cursor: "pointer" }}>
                {tl(lang, "移除", "Remove")}
              </button>
            </>
          ) : null}
        </div>
        {bgRefToast && <div style={{ marginTop: 4, fontSize: 10, color: FIGMA_COLORS.textMuted }}>{bgRefToast}</div>}
      </EditorSection>
    </div>
  );
}
