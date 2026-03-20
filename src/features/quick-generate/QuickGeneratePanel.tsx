import React from "react";
import { ChevronRight, Copy, ImagePlus, Share2, Sparkles } from "lucide-react";
import type { Lang } from "../../i18n";
import type { Scene } from "../../model";

const colors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

type Props = {
  scene: Scene;
  lang: Lang;
  onUpdateScene: (scene: Scene) => void;
  onDismiss: () => void;
  onGenerate: () => void;
  onCopyPrompt: () => void;
  onShare: () => void;
  onPickReference: () => void;
};

const t = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

const STYLE_OPTIONS = [
  { id: "natural", labelZh: "自然真实", labelEn: "Natural" },
  { id: "commercial", labelZh: "商业高级", labelEn: "Commercial" },
  { id: "cinematic", labelZh: "电影质感", labelEn: "Cinematic" }
] as const;

const PLATFORM_OPTIONS = [
  { id: "universal", label: "通用 / Universal" },
  { id: "midjourney", label: "Midjourney" },
  { id: "runway", label: "Runway" },
  { id: "fal", label: "fal" }
] as const;

function readStyle(scene: Scene): string {
  const hit = (scene.notes ?? "").split("\n").find((line) => line.startsWith("quick_style:"));
  return hit?.slice("quick_style:".length).trim() || "natural";
}

function writeStyle(scene: Scene, styleId: string): Scene {
  const lines = (scene.notes ?? "").split("\n").filter(Boolean).filter((line) => !line.startsWith("quick_style:"));
  return { ...scene, notes: [...lines, `quick_style: ${styleId}`].join("\n") };
}

function readPlatform(scene: Scene): string {
  const hit = (scene.notes ?? "").split("\n").find((line) => line.startsWith("quick_platform:"));
  return hit?.slice("quick_platform:".length).trim() || "universal";
}

function writePlatform(scene: Scene, platformId: string): Scene {
  const lines = (scene.notes ?? "").split("\n").filter(Boolean).filter((line) => !line.startsWith("quick_platform:"));
  return { ...scene, notes: [...lines, `quick_platform: ${platformId}`].join("\n") };
}

export function QuickGeneratePanel({ scene, lang, onUpdateScene, onDismiss, onGenerate, onCopyPrompt, onShare, onPickReference }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const subjectValue = scene.layers?.[0]?.externalPrompt ?? "";
  const selectedStyle = readStyle(scene);
  const selectedPlatform = readPlatform(scene);
  const aspectRatio = scene.aspectRatio ?? "16:9";

  function updateSubject(value: string) {
    const nextLayers = [...(scene.layers ?? [])];
    if (!nextLayers[0]) return;
    nextLayers[0] = { ...nextLayers[0], externalPrompt: value };
    onUpdateScene({ ...scene, layers: nextLayers });
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <div>
          <div style={styles.eyebrow}>{t(lang, "快速生成", "Quick Generate")}</div>
          <div style={styles.title}>{t(lang, "先改最少字段，再决定怎么生成", "Edit the minimum, then choose how to generate")}</div>
        </div>
        <div style={styles.headActions}>
          <button type="button" style={styles.iconBtn} onClick={onShare} aria-label={t(lang, "分享", "Share")}>
            <Share2 size={14} />
          </button>
          <button type="button" style={styles.linkBtn} onClick={onDismiss}>
            {t(lang, "完整编辑", "Full Editor")} <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div style={styles.fieldStack}>
        <label style={styles.label}>{t(lang, "画面里有什么？", "What is in the frame?")}</label>
        <textarea
          value={subjectValue}
          onChange={(e) => updateSubject(e.target.value)}
          placeholder={t(lang, "例：一个女生，长发，穿白色连衣裙，站在咖啡馆窗边", "Example: a woman with long hair in a white dress standing by a cafe window")}
          style={styles.textarea}
        />
      </div>

      <div style={styles.row}>
        <div style={styles.cardField}>
          <div style={styles.label}>{t(lang, "参考图（可选）", "Reference image (optional)")}</div>
          <button type="button" style={styles.secondaryBtn} onClick={onPickReference}>
            <ImagePlus size={14} />
            {scene.backgroundRef ? scene.backgroundRef.name : t(lang, "上传参考图", "Upload reference")}
          </button>
        </div>
        <div style={styles.cardField}>
          <div style={styles.label}>{t(lang, "画面比例", "Aspect ratio")}</div>
          <div style={styles.segmentRow}>
            {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                style={{ ...styles.segmentBtn, ...(aspectRatio === ratio ? styles.segmentBtnActive : {}) }}
                onClick={() => onUpdateScene({ ...scene, aspectRatio: ratio })}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" style={styles.moreBtn} onClick={() => setExpanded((v) => !v)}>
        <Sparkles size={13} />
        {expanded ? t(lang, "收起更多设置", "Hide more settings") : t(lang, "更多设置", "More settings")}
      </button>

      {expanded ? (
        <div style={styles.expandedWrap}>
          <div style={styles.fieldStack}>
            <div style={styles.label}>{t(lang, "风格方向", "Style direction")}</div>
            <div style={styles.segmentRow}>
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  style={{ ...styles.segmentBtn, ...(selectedStyle === option.id ? styles.segmentBtnActive : {}) }}
                  onClick={() => onUpdateScene(writeStyle(scene, option.id))}
                >
                  {lang === "zh" ? option.labelZh : option.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.fieldStack}>
            <div style={styles.label}>{t(lang, "生成平台", "Target platform")}</div>
            <div style={styles.segmentRow}>
              {PLATFORM_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  style={{ ...styles.segmentBtn, ...(selectedPlatform === option.id ? styles.segmentBtnActive : {}) }}
                  onClick={() => onUpdateScene(writePlatform(scene, option.id))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div style={styles.actionRow}>
        <button type="button" style={styles.primaryBtn} onClick={onCopyPrompt}>
          <Copy size={14} />
          {t(lang, "复制提示词", "Copy Prompt")}
        </button>
        <button type="button" style={styles.secondaryBtnStrong} onClick={onGenerate}>
          <ImagePlus size={14} />
          {t(lang, "站内生成", "Generate Here")}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 360,
    maxWidth: "calc(100vw - 24px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)"
  },
  head: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: 700, color: colors.accent, letterSpacing: "0.08em", textTransform: "uppercase" },
  title: { marginTop: 4, fontSize: 14, fontWeight: 700, color: colors.text, lineHeight: 1.35 },
  headActions: { display: "flex", alignItems: "center", gap: 8 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textMuted, display: "grid", placeItems: "center", cursor: "pointer" },
  linkBtn: { display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: colors.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  cardField: { display: "flex", flexDirection: "column", gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg },
  fieldStack: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 11, fontWeight: 600, color: colors.textMuted },
  textarea: { minHeight: 88, resize: "vertical", borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, padding: "10px 12px", outline: "none", fontSize: 12, lineHeight: 1.5 },
  segmentRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  segmentBtn: { height: 30, borderRadius: 999, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textMuted, padding: "0 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  segmentBtnActive: { borderColor: colors.accent, color: colors.accent, background: "rgba(245,158,11,0.1)" },
  moreBtn: { display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content", border: "none", background: "transparent", color: colors.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 },
  expandedWrap: { display: "flex", flexDirection: "column", gap: 12, paddingTop: 2 },
  actionRow: { display: "flex", gap: 10 },
  primaryBtn: { flex: 1, height: 38, borderRadius: 10, border: `1px solid rgba(245,158,11,0.25)`, background: colors.accent, color: "#171717", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" },
  secondaryBtn: { height: 34, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.panel, color: colors.text, padding: "0 12px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" },
  secondaryBtnStrong: { flex: 1, height: 38, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }
};
