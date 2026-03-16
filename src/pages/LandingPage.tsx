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
  } catch {
    // ignore localStorage failures
  }
  if (typeof navigator === "undefined") return "en";
  return /^zh(?:-|$)/i.test(navigator.language || "") ? "zh" : "en";
}

function saveLocale(lang: LandingLocale) {
  try {
    localStorage.setItem(LANDING_LANG_KEY, lang);
  } catch {
    // ignore localStorage failures
  }
}

function routeToSignIn(mode?: WorkspaceMode) {
  if (mode) {
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
      localStorage.setItem(WORKSPACE_ENTRY_GUIDE_KEY, "1");
    } catch {
      // ignore storage failures
    }
  }
  window.location.href = "/signin";
}

const COPY = {
  zh: {
    intro: "产品介绍",
    pricing: "Pricing",
    lang: "EN",
    signIn: "登录",
    signInUp: "登录 / 注册",
    account: "账户",
    openWorkspace: "进入工作台",
    accountPage: "账户设置",
    logOut: "退出登录",
    title: "结构化提示词工作台",
    subtitleLine1: "用模板、分镜结构和镜头语言",
    subtitleLine2: "让大模型准确理解你的创作意图",
    tagline: "更稳定生成 · 更少重试 · 更快出结果",
    workspaceBtn: "进入工作台",
    workspaceHint: "模板驱动 · 分镜编辑 · 多模型生成 · Prompt + 参考图导出",
    terms: "服务协议",
    privacy: "隐私协议",
    contact: "联系我们",
  },
  en: {
    intro: "Product",
    pricing: "Pricing",
    lang: "中文",
    signIn: "Sign in",
    signInUp: "Sign In / Sign Up",
    account: "Account",
    openWorkspace: "Open Workspace",
    accountPage: "Account Settings",
    logOut: "Log Out",
    title: "Structured Prompt Workspace",
    subtitleLine1: "Use templates, storyboard structure, and camera language",
    subtitleLine2: "to help the model accurately understand your creative intent.",
    tagline: "More stable generation · Fewer retries · Faster results",
    workspaceBtn: "Enter Workspace",
    workspaceHint: "Template-driven · Storyboard editing · Multi-model generation · Prompt + reference export",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
  }
} as const;

export default function LandingPage() {
  const [locale, setLocale] = useState<LandingLocale>(() => detectLocale());
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const t = useMemo(() => COPY[locale], [locale]);
  const isZh = locale === "zh";
  const userEntryLabel = accountUser ? t.account : t.signInUp;

  useEffect(() => {
    let alive = true;
    void getCurrentUser()
      .then((user) => {
        if (!alive) return;
        setAccountUser(user);
      })
      .catch(() => {
        if (!alive) return;
        setAccountUser(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggleLang = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
    saveLocale(next);
  };
  return (
    <div className="landing-page" style={page}>
      <div style={shell}>
        <header style={header}>
          <div style={logoWrap}>
            <span style={logoDot} />
            <span style={{ ...logoText, ...(isZh ? logoTextZh : null) }}>ScenePilotix</span>
          </div>
          <div style={topActions}>
            <a href="/product-intro" style={{ ...textLink, ...(isZh ? textLinkZh : null) }}>{t.intro}</a>
            <a href="/pricing" style={{ ...textLink, ...(isZh ? textLinkZh : null) }}>{t.pricing}</a>
            <button type="button" style={{ ...textBtn, ...(isZh ? textBtnZh : null) }} onClick={toggleLang}>{t.lang}</button>
            <div style={userEntryWrap}>
              {accountUser ? (
                <a
                  href="/app"
                  style={{ ...signBtn, ...workspaceEntryBtn, ...(isZh ? signBtnZh : null), textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                  data-testid="landing-user-entry"
                >
                  <span style={avatarDot}>
                    {accountUser.avatarUrl ? (
                      <img src={accountUser.avatarUrl} alt="" style={userAvatarImage} />
                    ) : (
                      <UserRound size={14} />
                    )}
                  </span>
                  <span>{t.openWorkspace}</span>
                </a>
              ) : (
                <button
                  type="button"
                  style={{ ...signBtn, ...(isZh ? signBtnZh : null) }}
                  onClick={() => routeToSignIn()}
                  data-testid="landing-user-entry"
                >
                  <span style={avatarDot}>
                    <UserRound size={14} />
                  </span>
                  <span>{t.signInUp}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main style={{ ...main, ...(isZh ? mainZh : null) }}>
          <h1 style={title}>{t.title}</h1>
          <p style={{ ...subtitle, ...subtitleZh }}>
            <span style={subtitleLine}>{t.subtitleLine1}</span>
            <span style={subtitleLine}>{t.subtitleLine2}</span>
          </p>
          <p style={{ ...tagline, ...(isZh ? taglineZh : null) }}>{t.tagline}</p>

          <div style={ctaGrid}>
            <div style={ctaCol}>
              <button
                type="button"
                style={{
                  ...proBtn,
                  ...(isZh ? ctaBtnZh : null),
                  backgroundColor: ctaHover ? "#d97706" : undefined
                }}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                onClick={() => routeToSignIn("pro")}
                data-testid="landing-start-workspace"
              >
                {t.workspaceBtn}
              </button>
              <div style={ctaHintWrap}>
                <span style={{ ...ctaHintLine, ...(isZh ? ctaHintLineZh : null) }}>{t.workspaceHint}</span>
              </div>
            </div>
          </div>
        </main>

        <footer style={footerWrap}>
          <a href="/terms" style={{ ...footerLink, ...(isZh ? footerLinkZh : null) }}>{t.terms}</a>
          <a href="/privacy" style={{ ...footerLink, ...(isZh ? footerLinkZh : null) }}>{t.privacy}</a>
          <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={{ ...footerLink, ...(isZh ? footerLinkZh : null) }}>{t.contact}</a>
        </footer>
      </div>

    </div>
  );
}

/* Design reference: bg #1f2125, panel #24262b, border #3a3f46, text #e5e7eb, textMuted #9ca3af, accent #f59e0b */
const page: CSSProperties = {
  minHeight: "100%",
  background: "#1f2125",
  color: "var(--spx-text-1)",
  position: "relative",
  overflowX: "hidden"
};

const shell: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1040,
  margin: "0 auto",
  padding: "0 20px 80px"
};

const header: CSSProperties = {
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  borderBottom: "1px solid #3a3f46",
  backgroundColor: "#24262b",
  margin: "0 -20px",
  padding: "0 20px"
};

const logoWrap: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9
};

const logoDot: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#f59e0b"
};

const logoText: CSSProperties = {
  fontSize: 13,
  fontWeight: 730,
  letterSpacing: "0.06em"
};
const logoTextZh: CSSProperties = {
  fontSize: 14
};

const topActions: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
};

const textBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-3)",
  fontSize: 13,
  fontWeight: 620,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer"
};
const textBtnZh: CSSProperties = {
  fontSize: 14.5
};

const textLink: CSSProperties = {
  color: "var(--spx-text-3)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 620
};
const textLinkZh: CSSProperties = {
  fontSize: 14.5
};

const signBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-1)",
  fontSize: 14,
  fontWeight: 720,
  padding: 0,
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  outline: "none"
};
const signBtnZh: CSSProperties = {
  fontSize: 15
};

const userEntryWrap: CSSProperties = {
  position: "relative",
  zIndex: 10
};

const avatarDot: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#343942",
  color: "var(--spx-text-1)"
};

const userAvatarImage: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%"
};

const main: CSSProperties = {
  marginTop: 66,
  maxWidth: 920,
  marginInline: "auto",
  textAlign: "center"
};
const mainZh: CSSProperties = {
  marginTop: 98
};

const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(46px, 7.7vw, 88px)",
  lineHeight: 1.03,
  letterSpacing: "-0.03em",
  fontWeight: 800
};

const subtitle: CSSProperties = {
  margin: "16px auto 0",
  color: "var(--spx-text-3)",
  fontSize: "clamp(14px, 1.7vw, 16px)",
  lineHeight: 1.62,
  maxWidth: 920
};
const subtitleZh: CSSProperties = {
  fontSize: "clamp(18px, 2.2vw, 22px)",
  lineHeight: 1.72,
  marginTop: 20,
  maxWidth: 980
};
const subtitleLine: CSSProperties = {
  display: "block"
};

const tagline: CSSProperties = {
  margin: "12px auto 0",
  color: "var(--spx-text-3)",
  fontSize: "clamp(13px, 1.5vw, 15px)",
  lineHeight: 1.5,
  maxWidth: 920
};
const taglineZh: CSSProperties = {
  fontSize: "clamp(14px, 1.7vw, 16px)"
};

const ctaGrid: CSSProperties = {
  marginTop: 28,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10
};

const ctaCol: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10
};

const proBtn: CSSProperties = {
  minHeight: 48,
  border: "none",
  borderRadius: 12,
  background: "#fcd34d",
  color: "#1f2125",
  fontSize: 14,
  fontWeight: 700,
  padding: "0 40px",
  cursor: "pointer",
  transition: "background-color 180ms ease",
  width: "fit-content"
};
const ctaBtnZh: CSSProperties = {
  minHeight: 50,
  fontSize: 15
};

const workspaceEntryBtn: CSSProperties = {
  background: "rgba(252,211,77,0.5)",
  borderRadius: 10,
  padding: "0 24px",
  minHeight: 40,
};

const ctaHintWrap: CSSProperties = {
  marginTop: 10
};

const ctaHintLine: CSSProperties = {
  color: "var(--spx-text-3)",
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: "center"
};
const ctaHintLineZh: CSSProperties = {
  fontSize: 15.5,
  lineHeight: 1.56
};

const footerWrap: CSSProperties = {
  position: "absolute",
  bottom: 20,
  right: 20,
  display: "flex",
  alignItems: "center",
  gap: 16
};

const footerLink: CSSProperties = {
  color: "var(--spx-text-3)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 620
};
const footerLinkZh: CSSProperties = {
  fontSize: 14
};

