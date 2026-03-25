/**
 * StylePanel — Step 8
 * 视觉风格 / 色调 / 后期处理
 */
import React from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { EditorSection, EditorSelect } from "../../../components/ui";
import { Palette } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const tl = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

function mkMark(mark: string) {
  return {
    parse(notes: string) {
      const hit = (notes ?? "").split("\n").find((l) => l.trim().startsWith(mark));
      return hit ? hit.trim().slice(mark.length).trim() : "";
    },
    write(notes: string, v: string) {
      const lines = (notes ?? "").split("\n").filter((l) => !l.trim().startsWith(mark));
      if (v) lines.push(`${mark}${v}`);
      return lines.join("\n");
    },
  };
}

const colorGrade = mkMark("color_grade:");
const postProcess = mkMark("post_process:");
const filmLook = mkMark("film_look:");

export function StylePanel({ lang, scene, project, onUpdateScene }: Props) {
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";
  const mediaMode = resolveSceneConfig(scene).mediaMode;

  const colorGradeOptions = [
    { value: "",               label: tl(lang, "─ 未定义",       "─ Undefined") },
    { value: "natural",        label: tl(lang, "自然色彩",       "Natural / True-to-life") },
    { value: "cinematic",      label: tl(lang, "电影调色",       "Cinematic Grade") },
    { value: "teal_orange",    label: tl(lang, "青橙对比",       "Teal & Orange") },
    { value: "warm_golden",    label: tl(lang, "暖金琥珀",       "Warm Golden / Amber") },
    { value: "cool_steel",     label: tl(lang, "冷调钢铁",       "Cool / Steel Blue") },
    { value: "bleach_bypass",  label: tl(lang, "漂白旁路",       "Bleach Bypass") },
    { value: "warm_vintage",   label: tl(lang, "暖色复古",       "Warm Vintage") },
    { value: "high_key",       label: tl(lang, "高调亮白",       "High Key") },
    { value: "low_key",        label: tl(lang, "低调暗黑",       "Low Key / Noir") },
    { value: "pastel",         label: tl(lang, "粉彩柔和",       "Pastel / Soft") },
    { value: "desaturated",    label: tl(lang, "低饱和",         "Desaturated") },
    { value: "neon_pop",       label: tl(lang, "霓虹饱和",       "Neon / Hyper-saturated") },
    // ── 导演标志性调色 ──
    { value: "fincher_teal",   label: tl(lang, "Fincher 绿青调", "Fincher Teal Grade") },
    { value: "wkw_warm_neon",  label: tl(lang, "王家卫暖霓虹",  "WKW Warm Neon") },
    { value: "nolan_imax",     label: tl(lang, "诺兰 IMAX 冷感", "Nolan IMAX Desaturated") },
    { value: "anderson_pastel",label: tl(lang, "韦斯安德森粉调", "Wes Anderson Pastel") },
    // ── 胶片仿真 ──
    { value: "kodak_vision3",  label: tl(lang, "Kodak Vision3",  "Kodak Vision3 Film") },
    { value: "fuji_velvia",    label: tl(lang, "富士 Velvia 饱和","Fuji Velvia Vivid") },
    { value: "agfa_ultra",     label: tl(lang, "Agfa Ultra 复古", "Agfa Ultra Vintage") },
  ];

  const filmLookOptions = [
    { value: "",               label: tl(lang, "─ 未定义",        "─ Undefined") },
    { value: "digital_clean",  label: tl(lang, "数字洁净",        "Digital Clean") },
    { value: "film_grain",     label: tl(lang, "35mm 胶片颗粒",   "Film Grain (35mm)") },
    { value: "16mm_grain",     label: tl(lang, "16mm 粗颗粒",     "16mm Heavy Grain") },
    { value: "super8",         label: tl(lang, "Super 8 质感",    "Super 8 / Vintage") },
    { value: "vhs",            label: tl(lang, "VHS 录像",        "VHS / Tape") },
    { value: "anamorphic",     label: tl(lang, "变形宽幅光晕",    "Anamorphic Flare") },
    { value: "imax",           label: tl(lang, "IMAX 质感",       "IMAX / Ultra-large Format") },
    { value: "halation",       label: tl(lang, "镜头晕光扩散",    "Lens Halation") },
    { value: "vignette",       label: tl(lang, "自然暗角",        "Natural Vignette") },
    { value: "drone_raw",      label: tl(lang, "航拍原始",        "Drone / RAW Aerial") },
    { value: "log_c",          label: tl(lang, "Log-C 平调",      "Log-C / S-Log Flat") },
    { value: "infrared",       label: tl(lang, "红外摄影感",      "Infrared Feel") },
  ];

  const postProcessOptions = [
    { value: "",               label: tl(lang, "─ 未定义",         "─ Undefined") },
    { value: "none",           label: tl(lang, "无后期",           "No Post / Straight") },
    { value: "subtle_grade",   label: tl(lang, "轻度调色",         "Subtle Grade") },
    { value: "heavy_grade",    label: tl(lang, "重度调色",         "Heavy Grade") },
    { value: "vfx_composite",  label: tl(lang, "VFX 合成",         "VFX Composite") },
    { value: "particle_fx",    label: tl(lang, "粒子特效",         "Particle FX") },
    { value: "fluid_sim",      label: tl(lang, "流体模拟",         "Fluid Simulation") },
    { value: "slow_motion",    label: tl(lang, "慢动作",           "Slow Motion") },
    { value: "ramping",        label: tl(lang, "速度渐变",         "Speed Ramping") },
    { value: "timelapse",      label: tl(lang, "延时摄影",         "Timelapse") },
    { value: "hyperlapse",     label: tl(lang, "移动延时",         "Hyperlapse") },
    { value: "freeze_frame",   label: tl(lang, "定格",             "Freeze Frame") },
    { value: "double_exposure",label: tl(lang, "双重曝光",         "Double Exposure") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ padding: "12px 16px 8px", borderBottom: `1px solid ${FIGMA_COLORS.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: FIGMA_COLORS.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
          {tl(lang, "步骤 8 · 风格", "Step 8 · Style")}
        </div>
        <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
          {tl(lang, "选择调色方案、胶片质感和后期处理方式", "Choose color grade, film look and post treatment")}
        </div>
      </div>

      <EditorSection title={tl(lang, "调色方案", "Color Grading")} icon={Palette} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "调色", "Color Grade")}
          value={colorGrade.parse(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: colorGrade.write(scene.notes ?? "", v) })}
          disabled={layoutLocked} options={colorGradeOptions} />
        <EditorSelect compact label={tl(lang, "胶片质感", "Film Look")}
          value={filmLook.parse(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: filmLook.write(scene.notes ?? "", v) })}
          disabled={layoutLocked} options={filmLookOptions} />
      </EditorSection>

      <EditorSection title={tl(lang, "后期处理", "Post Processing")} defaultOpen={true}>
        <EditorSelect compact label={tl(lang, "处理方式", "Treatment")}
          value={postProcess.parse(scene.notes ?? "")}
          onChange={(v) => onUpdateScene({ ...scene, notes: postProcess.write(scene.notes ?? "", v) })}
          disabled={layoutLocked}
          options={mediaMode === "image"
            ? postProcessOptions.filter((o) => !["slow_motion","timelapse","hyperlapse"].includes(o.value))
            : postProcessOptions} />
      </EditorSection>
    </div>
  );
}
