import React from "react";
import { ArrowRight, Copy, Cpu, Crown, X } from "lucide-react";
import type { Lang } from "../../i18n";

const colors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

const t = (lang: Lang, zh: string, en: string) => (lang === "zh" ? zh : en);

type Props = {
  open: boolean;
  lang: Lang;
  canUseLocal: boolean;
  onClose: () => void;
  onCopyPrompt: () => void;
  onTopUp: () => void;
  onLocalGenerate: () => void;
};

export function GenerationGatePanel({ open, lang, canUseLocal, onClose, onCopyPrompt, onTopUp, onLocalGenerate }: Props) {
  if (!open) return null;
  return (
    <div style={styles.mask} onMouseDown={onClose}>
      <div style={styles.sheet} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <div style={styles.head}>
          <div>
            <div style={styles.title}>{t(lang, "继续你的创作", "Keep creating")}</div>
            <div style={styles.desc}>{t(lang, "优先复制提示词或导出项目包；Pro 用户也可以接自己的 API 或本地引擎继续执行。", "Copy the prompt or export a package first. Pro users can also continue with their own API or local engines.")}</div>
          </div>
          <button type="button" style={styles.iconBtn} onClick={onClose}><X size={15} /></button>
        </div>
        <div style={styles.cardStack}>
          <button type="button" style={{ ...styles.card, ...styles.cardPrimary }} onClick={onCopyPrompt}>
            <div style={styles.cardText}>
              <div style={styles.cardTitle}><Copy size={15} /> {t(lang, "复制提示词", "Copy Prompt")}</div>
              <div style={styles.cardDesc}>{t(lang, "复制结构化提示词，去熟悉的平台免费生成。", "Copy the structured prompt and continue on your preferred platform.")}</div>
            </div>
            <ArrowRight size={15} />
          </button>
          <button type="button" style={styles.card} onClick={onTopUp}>
            <div style={styles.cardText}>
              <div style={styles.cardTitle}><Crown size={15} /> {t(lang, "升级到 Pro", "Upgrade to Pro")}</div>
              <div style={styles.cardDesc}>{t(lang, "解锁自己的 API、ComfyUI 和 Draw Things 执行能力。", "Unlock your own API, ComfyUI, and Draw Things execution paths.")}</div>
            </div>
            <ArrowRight size={15} />
          </button>
          {canUseLocal ? (
            <button type="button" style={styles.card} onClick={onLocalGenerate}>
              <div style={styles.cardText}>
                <div style={styles.cardTitle}><Cpu size={15} /> {t(lang, "打开 API / 本地接入", "Open API / Local")}</div>
                <div style={styles.cardDesc}>{t(lang, "检查 ComfyUI、Draw Things 或自己的 API 连接状态。", "Check ComfyUI, Draw Things, or your own API connection status.")}</div>
              </div>
              <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  mask: { position: "fixed", inset: 0, background: "rgba(7,11,18,0.72)", display: "grid", placeItems: "center", zIndex: 2000, padding: 16 },
  sheet: { width: 520, maxWidth: "100%", borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.panel, padding: 16, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 24px 60px rgba(0,0,0,0.35)" },
  head: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 18, fontWeight: 800, color: colors.text },
  desc: { marginTop: 6, fontSize: 13, lineHeight: 1.6, color: colors.textMuted },
  iconBtn: { width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textMuted, display: "grid", placeItems: "center", cursor: "pointer" },
  cardStack: { display: "flex", flexDirection: "column", gap: 10 },
  card: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, cursor: "pointer", textAlign: "left" },
  cardPrimary: { borderColor: "rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)" },
  cardText: { minWidth: 0, display: "flex", flexDirection: "column", gap: 4 },
  cardTitle: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 },
  cardDesc: { fontSize: 12, lineHeight: 1.5, color: colors.textMuted }
};
