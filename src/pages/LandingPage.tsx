import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { UserRound } from "lucide-react";
import { getCurrentUser } from "../services/authService";
import type { UserState } from "../types/account";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";

const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";
const LANDING_LANG_KEY = "sp_landing_lang";

type WorkspaceMode = "results" | "pro";
type LandingLocale = "zh" | "en";

function detectLocale(): LandingLocale {
  try {
    const saved = localStorage.getItem(LANDING_LANG_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch { /* ignore */ }
  if (typeof navigator === "undefined") return "en";
  return /^zh(?:-|$)/i.test(navigator.language || "") ? "zh" : "en";
}

function saveLocale(lang: LandingLocale) {
  try { localStorage.setItem(LANDING_LANG_KEY, lang); } catch { /* ignore */ }
}

function routeToSignIn(mode?: WorkspaceMode) {
  if (mode) {
    try {
      localStorage.removeItem(WORKSPACE_MODE_KEY);
      localStorage.removeItem(WORKSPACE_ENTRY_GUIDE_KEY);
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
      localStorage.setItem(WORKSPACE_ENTRY_GUIDE_KEY, "1");
    } catch { /* ignore */ }
  }
  window.location.href = "/signin";
}

const COPY = {
  zh: {
    intro: "产品介绍",
    pricing: "定价",
    lang: "EN",
    signInUp: "登录",
    account: "账户",
    openWorkspace: "工作台",
    // Hero
    eyebrow: "AI 图像 · 视频生成工作台",
    title: "说了十遍\n还是生成错",
    subtitle: "提示词越写越长，结果越跑越偏。\nScenePilotix 用分镜结构替代自由文本——\n主体位置、镜头语言、光影情绪，一次说清。",
    tagline: "首次生成成功率提升 3×",
    ctaMain: "免费开始",
    ctaSub: "工作台",
    // Pain → Solution
    painTitle: "你一定遇过这些",
    pains: [
      { icon: "↺", text: "改了五遍提示词，主体还是跑偏" },
      { icon: "✂", text: "复制别人的 Prompt，风格完全不对" },
      { icon: "⚡", text: "换了模型又要重新调一遍参数" },
    ],
    solveTitle: "ScenePilotix 怎么解决",
    solves: [
      { icon: "◉", label: "结构化分镜", text: "主体 / 背景 / 构图分层填写，不靠猜" },
      { icon: "◎", label: "600+ 模板", text: "开场 · 产品 · 对话 · 运镜，直接套用" },
      { icon: "⬡", label: "多模型一键导出", text: "Midjourney / Runway / fal，同一份结构" },
    ],
    // Footer
    terms: "服务协议",
    privacy: "隐私协议",
    contact: "联系我们",
  },
  en: {
    intro: "Product",
    pricing: "Pricing",
    lang: "中文",
    signInUp: "Sign In",
    account: "Account",
    openWorkspace: "Workspace",
    // Hero
    eyebrow: "AI Image & Video Generation Workspace",
    title: "Wrote the prompt\nten times. Still wrong.",
    subtitle: "The longer your prompt, the further off the result.\nScenePilotix replaces free-text guessing with scene structure —\nsubject position, camera language, mood. Say it once, get it right.",
    tagline: "3× higher first-generation success rate",
    ctaMain: "Start Free",
    ctaSub: "Workspace",
    // Pain → Solution
    painTitle: "Sound familiar?",
    pains: [
      { icon: "↺", text: "Tweaked the prompt five times. Subject still drifts." },
      { icon: "✂", text: "Copied someone's prompt. Looks nothing like it." },
      { icon: "⚡", text: "Switched models. Back to square one." },
    ],
    solveTitle: "How ScenePilotix fixes it",
    solves: [
      { icon: "◉", label: "Structured scenes", text: "Subject / background / composition — filled, not guessed" },
      { icon: "◎", label: "600+ templates", text: "Opening · Product · Dialogue · Camera moves — ready to use" },
      { icon: "⬡", label: "One structure, every model", text: "Midjourney / Runway / fal — export once, run anywhere" },
    ],
    // Footer
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
  }
} as const;

export default function LandingPage() {
  const [locale, setLocale] = useState<LandingLocale>(() => detectLocale());
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [ctaHover, setCtaHover] = useState(false);
  const t = useMemo(() => COPY[locale], [locale]);
  const isZh = locale === "zh";

  useEffect(() => {
    let alive = true;
    void getCurrentUser()
      .then((user) => { if (alive) { setAccountUser(user); setAuthLoading(false); } })
      .catch(() => { if (alive) { setAccountUser(null); setAuthLoading(false); } });
    return () => { alive = false; };
  }, []);

  const toggleLang = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
    saveLocale(next);
  };

  return (
    <div style={page}>
      {/* ── Top nav ── */}
      <header style={header}>
        <div style={logoWrap}>
          <span style={logoDot} />
          <span style={logoText}>ScenePilotix</span>
          {isZh && <span style={logoZh}>场景领航</span>}
        </div>
        <nav style={topActions}>
          <a href="/product-intro" style={navLink}>{t.intro}</a>
          <a href="/pricing" style={navLink}>{t.pricing}</a>
          <button type="button" style={navBtn} onClick={toggleLang}>{t.lang}</button>
          <div style={{ width: 1, height: 16, background: "#3a3f46" }} />
          {authLoading ? (
            <div style={{ ...userBtn, opacity: 0, pointerEvents: "none" as const }}>
              <span style={avatarCircle}><UserRound size={13} /></span>
              {t.signInUp}
            </div>
          ) : accountUser ? (
            <button
              type="button"
              style={{ ...userBtn, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "0 12px", minHeight: 32 }}
              onClick={() => { window.location.href = "/app"; }}
              data-testid="landing-user-entry"
            >
              <span style={avatarCircle}>
                {accountUser.avatarUrl
                  ? <img src={accountUser.avatarUrl} alt="" style={avatarImg} />
                  : <UserRound size={13} />}
              </span>
              {t.openWorkspace}
            </button>
          ) : (
            <a href="/signin" style={{ ...userBtn, background: "rgba(255,255,255,0.06)", border: "1px solid #3a3f46", borderRadius: 8, padding: "0 12px", minHeight: 32, display: "inline-flex", alignItems: "center", gap: 8 }} data-testid="landing-user-entry">
              <span style={avatarCircle}><UserRound size={13} /></span>
              {t.signInUp}
            </a>
          )}
        </nav>
      </header>

      <div style={shell}>
        {/* ── Hero ── */}
        <section style={heroSection}>
          <p style={eyebrow}>{t.eyebrow}</p>
          <h1 style={heroTitle}>
            {t.title.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </h1>
          <p style={heroSubtitle}>
            {t.subtitle.split("\n").map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </p>
          <p style={heroTagline}>{t.tagline}</p>

          <div style={ctaRow}>
            <button
              type="button"
              style={{ ...ctaPrimary, ...(ctaHover ? ctaPrimaryHover : {}) }}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              onClick={() => routeToSignIn("pro")}
              data-testid="landing-start-workspace"
            >
              {t.ctaMain}
            </button>
            {accountUser && (
              <a href="/app" style={ctaSecondary}>{t.ctaSub}</a>
            )}
          </div>
        </section>

        {/* ── Pain points ── */}
        <section style={sectionWrap}>
          <p style={sectionLabel}>{t.painTitle}</p>
          <div style={painGrid}>
            {t.pains.map((p, i) => (
              <div key={i} style={painCard}>
                <span style={painIcon}>{p.icon}</span>
                <span style={painText}>{p.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Solutions ── */}
        <section style={sectionWrap}>
          <p style={sectionLabel}>{t.solveTitle}</p>
          <div style={solveGrid}>
            {t.solves.map((s, i) => (
              <div key={i} style={solveCard}>
                <div style={solveIcon}>{s.icon}</div>
                <div style={solveLabel}>{s.label}</div>
                <div style={solveText}>{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={footerWrap}>
          <a href="/terms" style={footerLink}>{t.terms}</a>
          <a href="/privacy" style={footerLink}>{t.privacy}</a>
          <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={footerLink}>{t.contact}</a>
        </footer>
      </div>
    </div>
  );
}

/* ── Styles ── */
const C = { bg: "#1f2125", panel: "#24262b", border: "#3a3f46", text: "#e5e7eb", muted: "#9ca3af", amber: "#f59e0b", amberHover: "#d97706" };

const page: CSSProperties = { minHeight: "100%", background: C.bg, color: C.text, overflowX: "hidden" };

const header: CSSProperties = {
  height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 12, padding: "0 24px", background: C.panel, borderBottom: `1px solid ${C.border}`,
  position: "sticky", top: 0, zIndex: 100
};
const logoWrap: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const logoDot: CSSProperties = { width: 8, height: 8, borderRadius: "50%", background: C.amber };
const logoText: CSSProperties = { fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" };
const logoZh: CSSProperties = { fontSize: 12, color: C.muted, fontWeight: 500 };

const topActions: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const navLink: CSSProperties = { color: C.muted, textDecoration: "none", fontSize: 13, fontWeight: 500, padding: "0 6px" };
const navBtn: CSSProperties = { border: "none", background: "transparent", color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "0 6px" };
const userBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8,
  border: "none", background: "transparent", color: C.text,
  fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", padding: "0 4px"
};
const avatarCircle: CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", display: "inline-flex",
  alignItems: "center", justifyContent: "center", background: "#343942", color: C.text
};
const avatarImg: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" };

const shell: CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" };

const heroSection: CSSProperties = { paddingTop: 80, paddingBottom: 64, textAlign: "center" };
const eyebrow: CSSProperties = { margin: "0 0 20px", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber };
const heroTitle: CSSProperties = {
  margin: 0, fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 800,
  lineHeight: 1.06, letterSpacing: "-0.03em", color: C.text
};
const heroSubtitle: CSSProperties = {
  margin: "24px auto 0", maxWidth: 600, fontSize: "clamp(15px, 1.8vw, 17px)",
  lineHeight: 1.75, color: C.muted
};
const heroTagline: CSSProperties = {
  margin: "20px auto 0", fontSize: 13, fontWeight: 600,
  color: C.amber, letterSpacing: "0.04em"
};

const ctaRow: CSSProperties = { marginTop: 32, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap" };
const ctaPrimary: CSSProperties = {
  minHeight: 48, padding: "0 40px", borderRadius: 12, border: "none",
  background: C.amber, color: "#1f2125", fontSize: 15, fontWeight: 700,
  cursor: "pointer", transition: "background 150ms ease"
};
const ctaPrimaryHover: CSSProperties = { background: C.amberHover };
const ctaSecondary: CSSProperties = {
  minHeight: 48, padding: "0 28px", borderRadius: 12,
  border: `1px solid ${C.border}`, background: "transparent",
  color: C.text, fontSize: 14, fontWeight: 600, textDecoration: "none",
  display: "inline-flex", alignItems: "center"
};

const sectionWrap: CSSProperties = { marginTop: 64 };
const sectionLabel: CSSProperties = {
  margin: "0 0 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: C.muted, textAlign: "center"
};

const painGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const painCard: CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px",
  borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel
};
const painIcon: CSSProperties = { fontSize: 18, flexShrink: 0, color: C.muted, marginTop: 1, width: 22, textAlign: "center" };
const painText: CSSProperties = { fontSize: 14, lineHeight: 1.55, color: C.text };

const solveGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 };
const solveCard: CSSProperties = {
  padding: "22px 22px 20px", borderRadius: 12,
  border: `1px solid ${C.border}`, background: C.panel
};
const solveIcon: CSSProperties = { fontSize: 22, color: C.amber, marginBottom: 12 };
const solveLabel: CSSProperties = { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 };
const solveText: CSSProperties = { fontSize: 13, lineHeight: 1.6, color: C.muted };

const footerWrap: CSSProperties = { marginTop: 80, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "center", gap: 24 };
const footerLink: CSSProperties = { color: C.muted, textDecoration: "none", fontSize: 12 };
