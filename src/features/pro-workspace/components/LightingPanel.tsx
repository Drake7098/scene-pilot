/**
 * LightingPanel — Step 7
 * 光线时间 / 主光方向 / 氛围 / 色温 / 特殊灯光
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { Sun } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

const SPECLIGHT_MARK = "spec_light:";
function parseSpecLight(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(SPECLIGHT_MARK));
  return hit ? hit.trim().slice(SPECLIGHT_MARK.length).trim() : "";
}
function writeSpecLight(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(SPECLIGHT_MARK));
  if (v) lines.push(`${SPECLIGHT_MARK}${v}`);
  return lines.join("\n");
}

const COLOR_TEMP_MARK = "color_temp:";
function parseColorTemp(notes: string) {
  const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(COLOR_TEMP_MARK));
  return hit ? hit.trim().slice(COLOR_TEMP_MARK.length).trim() : "";
}
function writeColorTemp(notes: string, v: string) {
  const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(COLOR_TEMP_MARK));
  if (v) lines.push(`${COLOR_TEMP_MARK}${v}`);
  return lines.join("\n");
}

export function LightingPanel({ lang, scene, project, onUpdateScene }: Props) {
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  const timeOptions = [
    { value: "",              label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "dawn",          label: tl(lang, "黎明",       "Dawn") },
    { value: "golden_hour",   label: tl(lang, "黄金时段",   "Golden Hour") },
    { value: "day",           label: tl(lang, "日间",       "Daylight") },
    { value: "overcast",      label: tl(lang, "阴天",       "Overcast") },
    { value: "blue_hour",     label: tl(lang, "蓝色时段",   "Blue Hour") },
    { value: "dusk",          label: tl(lang, "傍晚黄昏",   "Dusk / Sunset") },
    { value: "night",         label: tl(lang, "夜间",       "Night") },
    { value: "indoor",        label: tl(lang, "室内受控光", "Controlled Indoor") },
    { value: "studio",        label: tl(lang, "摄影棚",     "Photo / Film Studio") },
  ];

  const keyDirOptions = [
    { value: "",               label: tl(lang, "─ 未定义",          "─ Undefined") },
    // ── 方向性主光 ──
    { value: "front",          label: tl(lang, "正面主光",          "Front Key") },
    { value: "45_left",        label: tl(lang, "左前 45°",         "45° Front-Left") },
    { value: "45_right",       label: tl(lang, "右前 45°",         "45° Front-Right") },
    { value: "side_left",      label: tl(lang, "左侧光",            "Side Left") },
    { value: "side_right",     label: tl(lang, "右侧光",            "Side Right") },
    { value: "back",           label: tl(lang, "逆光",              "Backlight") },
    { value: "top",            label: tl(lang, "顶光",              "Top Light") },
    { value: "under",          label: tl(lang, "底光",              "Under Light") },
    { value: "rim_light",      label: tl(lang, "轮廓光",            "Rim Light") },
    // ── 经典布光方案 ──
    { value: "three_point",    label: tl(lang, "三点布光",          "Three-Point Setup") },
    { value: "rembrandt",      label: tl(lang, "伦勃朗光",          "Rembrandt Lighting") },
    { value: "butterfly",      label: tl(lang, "蝴蝶光 / 派拉蒙",  "Butterfly / Paramount") },
    { value: "split",          label: tl(lang, "分割光",            "Split Lighting") },
    { value: "loop",           label: tl(lang, "环形光",            "Loop Lighting") },
    { value: "broad",          label: tl(lang, "宽光",              "Broad Lighting") },
    { value: "short",          label: tl(lang, "短光",              "Short Lighting") },
    { value: "silhouette",     label: tl(lang, "剪影逆光",          "Silhouette Backlight") },
  ];

  const moodOptions = [
    { value: "",          label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "warm",      label: tl(lang, "温暖",       "Warm") },
    { value: "cold",      label: tl(lang, "冷调",       "Cold") },
    { value: "cinematic", label: tl(lang, "电影质感",   "Cinematic") },
    { value: "mysterious",label: tl(lang, "神秘",       "Mysterious") },
    { value: "harsh",     label: tl(lang, "强硬对比",   "Harsh / High Contrast") },
    { value: "soft",      label: tl(lang, "柔和",       "Soft / Diffused") },
    { value: "dramatic",  label: tl(lang, "戏剧性",     "Dramatic") },
    { value: "natural",   label: tl(lang, "自然平衡",   "Natural / Balanced") },
  ];

  const colorTempOptions = [
    { value: "",        label: tl(lang, "─ 未定义",   "─ Undefined") },
    { value: "3200K",   label: tl(lang, "3200K 钨丝", "3200K Tungsten") },
    { value: "4000K",   label: tl(lang, "4000K 暖白", "4000K Warm White") },
    { value: "5600K",   label: tl(lang, "5600K 日光", "5600K Daylight") },
    { value: "6500K",   label: tl(lang, "6500K 正白", "6500K Cool White") },
    { value: "8000K",   label: tl(lang, "8000K 蓝调", "8000K Blue Sky") },
  ];

  const specLightOptions = [
    { value: "",                  label: tl(lang, "─ 未定义",           "─ Undefined") },
    // ── 自然/环境 ──
    { value: "volumetric",        label: tl(lang, "丁达尔体积光",       "Volumetric / God Rays") },
    { value: "golden_hour_rays",  label: tl(lang, "黄金时段光束",       "Golden Hour Rays") },
    { value: "blue_hour_ambient", label: tl(lang, "蓝调环境光",         "Blue Hour Ambient") },
    { value: "practical_window",  label: tl(lang, "窗户自然光",         "Window Practical") },
    // ── 人工/效果 ──
    { value: "practical",         label: tl(lang, "场景实用光",         "Practical Lights") },
    { value: "lens_flare",        label: tl(lang, "镜头光晕",           "Lens Flare") },
    { value: "anamorphic_flare",  label: tl(lang, "变形镜头光晕",       "Anamorphic Flare") },
    { value: "neon_spill",        label: tl(lang, "霓虹溢色",           "Neon Spill") },
    { value: "haze",              label: tl(lang, "烟雾机散射",         "Haze / Atmosphere Machine") },
    // ── 戏剧效果 ──
    { value: "candlelight",       label: tl(lang, "烛光",               "Candlelight") },
    { value: "fire_glow",         label: tl(lang, "火光映照",           "Fire Glow") },
    { value: "strobe",            label: tl(lang, "频闪",               "Strobe / Flash") },
    { value: "lightning",         label: tl(lang, "闪电/瞬间高光",      "Lightning / Flash Burst") },
    { value: "screen_glow",       label: tl(lang, "屏幕反光",           "Screen Glow") },
    { value: "bokeh_lights",      label: tl(lang, "背景焦外光斑",       "Bokeh Lights BG") },
    { value: "laser",             label: tl(lang, "激光束",             "Laser Beams") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 7 · 灯光", "Step 7 · Lighting")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择布光方案、主光方向和特殊灯光效果", "Set key light setup, direction and special lighting effects")}
        </div>
      </div>

      <EditorSection title={tl(lang, "主光设置", "Key Light Setup")} icon={Sun} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "时间 / 光源", "Time / Source")} value={scene.lighting?.time ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...(scene.lighting ?? {}), time: v } })}
          disabled={layoutLocked} options={timeOptions} />
        <EditorSelect compact label={tl(lang, "主光方向", "Key Light Direction")} value={scene.lighting?.key_dir ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...(scene.lighting ?? {}), key_dir: v } })}
          disabled={layoutLocked} options={keyDirOptions} />
        <EditorSelect compact label={tl(lang, "光线情绪", "Lighting Mood")} value={scene.lighting?.mood ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, lighting: { ...(scene.lighting ?? {}), mood: v } })}
          disabled={layoutLocked} options={moodOptions} />
      </EditorSection>

      <EditorSection title={tl(lang, "色温 & 特殊效果", "Color Temp & Special Effects")} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "色温", "Color Temperature")} value={parseColorTemp(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: writeColorTemp(scene.notes ?? "", v) })}
          disabled={layoutLocked} options={colorTempOptions} />
        <EditorSelect compact label={tl(lang, "特殊灯光效果", "Special Light FX")} value={parseSpecLight(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: writeSpecLight(scene.notes ?? "", v) })}
          disabled={layoutLocked} options={specLightOptions} />
      </EditorSection>
    </div>
  );
}
