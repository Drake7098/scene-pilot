import React from "react";
import { ArrowRight, Coins, Copy, Cpu, X } from "lucide-react";
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
            <div style={styles.desc}>{t(lang, "站内生成需要积分。你也可以复制提示词去熟悉的平台继续，或者使用本地链路。", "Hosted generation needs credits. You can also copy the prompt to another platform, or use a local provider.")}</div>
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
              <div style={styles.cardTitle}><Coins size={15} /> {t(lang, "充值 $3", "Top up $3")}</div>
              <div style={styles.cardDesc}>{t(lang, "购买 150 积分，保留当前模板和参考图，继续站内生成。", "Buy 150 credits and continue here with your current template and references.")}</div>
            </div>
            <ArrowRight size={15} />
          </button>
          {canUseLocal ? (
            <button type="button" style={styles.card} onClick={onLocalGenerate}>
              <div style={styles.cardText}>
                <div style={styles.cardTitle}><Cpu size={15} /> {t(lang, "本地生成", "Generate Local")}</div>
                <div style={styles.cardDesc}>{t(lang, "使用已连接的 Draw Things / ComfyUI，不消耗平台积分。", "Use connected Draw Things / ComfyUI without platform credits.")}</div>
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
