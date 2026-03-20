import React from "react";
import { ArrowRight, Copy, Share2 } from "lucide-react";
import { getCurrentUser } from "../services/authService";
import { decodeSharePayload, setPendingSharePayload, type SharePayload } from "../types/share";

const colors = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b"
};

function readPayload(): SharePayload | null {
  if (typeof window === "undefined") return null;
  return decodeSharePayload(window.location.hash.replace(/^#/, ""));
}

export default function SharePage() {
  const [payload] = React.useState<SharePayload | null>(() => readPayload());
  const [copied, setCopied] = React.useState(false);

  async function handleApply() {
    if (!payload) return;
    setPendingSharePayload(payload);
    const user = await getCurrentUser().catch(() => null);
    window.location.href = user ? "/app" : "/signin?redirect=%2Fapp";
  }

  async function handleCopy() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload.promptText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  if (!payload) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.title}>Share payload not found</div>
          <div style={styles.desc}>The link is empty or invalid.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>ScenePilot Share</div>
        <div style={styles.title}>{payload.intentId} › {payload.subTaskId}</div>
        <div style={styles.metaRow}>
          <span style={styles.metaPill}>{payload.familyId}</span>
          <span style={styles.metaPill}>{payload.variantId}</span>
          <span style={styles.metaPill}>{payload.aspectRatio}</span>
          <span style={styles.metaPill}>{payload.platformId}</span>
        </div>
        {payload.resultImageUrl ? <img src={payload.resultImageUrl} alt="share preview" style={styles.preview} /> : null}
        <div style={styles.block}>
          <div style={styles.blockLabel}>Prompt</div>
          <pre style={styles.prompt}>{payload.promptText}</pre>
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.primaryBtn} onClick={handleCopy}>
            <Copy size={14} /> {copied ? "Copied" : "Copy Prompt"}
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={handleApply}>
            <Share2 size={14} /> Apply This Setup <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: colors.bg, padding: 24 },
  card: { width: 760, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 14, padding: 20, borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.panel },
  kicker: { fontSize: 11, fontWeight: 700, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.08em" },
  title: { fontSize: 24, fontWeight: 800, color: colors.text },
  desc: { fontSize: 14, color: colors.textMuted },
  metaRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  metaPill: { borderRadius: 999, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.textMuted, padding: "4px 8px", fontSize: 11, fontWeight: 600 },
  preview: { width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12, border: `1px solid ${colors.border}` },
  block: { display: "flex", flexDirection: "column", gap: 8 },
  blockLabel: { fontSize: 12, fontWeight: 700, color: colors.textMuted },
  prompt: { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bg, padding: 14, color: colors.text, fontSize: 12, lineHeight: 1.6 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryBtn: { height: 40, borderRadius: 10, border: `1px solid rgba(245,158,11,0.25)`, background: colors.accent, color: "#171717", padding: "0 16px", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" },
  secondaryBtn: { height: 40, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, padding: "0 16px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }
};
