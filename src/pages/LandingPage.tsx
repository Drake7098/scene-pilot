import { useMemo, useState, type CSSProperties } from "react";
import { ChevronDown, UserRound } from "lucide-react";
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
    introMenu: [
      { href: "/product-intro#overview", label: "产品定位" },
      { href: "/product-intro#method", label: "工作方法" },
      { href: "/product-intro#fit", label: "适合任务" }
    ],
    pricing: "Pricing",
    lang: "EN",
    signIn: "登录",
    title: "结构化提示词工作台",
    subtitle: "我们通过场景结构化、镜头语言和导演风格包，让大模型更准确理解创作意图，提升效率并加速有效生成。",
    quickBtn: "进入快捷工作台",
    proBtn: "进入 Pro 工作台",
    quickHint: ["适合试方向", "更快验证与迭代"],
    proHint: ["适合商业交付", "更稳复用与协作"],
    service: "服务协议",
    privacy: "隐私协议",
    contact: "联系我们",
    support: "支持",
    business: "商务"
  },
  en: {
    intro: "Product",
    introMenu: [
      { href: "/product-intro#overview", label: "Positioning" },
      { href: "/product-intro#method", label: "Method" },
      { href: "/product-intro#fit", label: "Task Fit" }
    ],
    pricing: "Pricing",
    lang: "中文",
    signIn: "Sign in",
    title: "Structured Prompt Workspace",
    subtitle:
      "We use scene structure, camera language, and director packs to improve model understanding, increase efficiency, and accelerate valid generation.",
    quickBtn: "Enter Quick Workspace",
    proBtn: "Enter Pro Workspace",
    quickHint: ["Best for direction testing", "Faster validation and iteration"],
    proHint: ["Best for commercial delivery", "Stable reuse and collaboration"],
    service: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    support: "Support",
    business: "Business"
  }
} as const;

export default function LandingPage() {
  const [locale, setLocale] = useState<LandingLocale>(() => detectLocale());
  const [introOpen, setIntroOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const t = useMemo(() => COPY[locale], [locale]);

  const toggleLang = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
    saveLocale(next);
  };

  return (
    <div style={page}>
      <div style={glowLeft} />
      <div style={glowRight} />
      <div style={shell}>
        <header style={header}>
          <div style={logoWrap}>
            <span style={logoDot} />
            <span style={logoText}>ScenePilotix</span>
          </div>
          <div style={topActions}>
            <div style={introWrap}>
              <button type="button" style={textBtn} onClick={() => setIntroOpen((v) => !v)}>
                <span>{t.intro}</span>
                <ChevronDown size={13} />
              </button>
              {introOpen ? (
                <div style={menu}>
                  {t.introMenu.map((item) => (
                    <a key={item.href} href={item.href} style={menuItem}>{item.label}</a>
                  ))}
                </div>
              ) : null}
            </div>
            <a href="/pricing" style={textLink}>{t.pricing}</a>
            <button type="button" style={textBtn} onClick={toggleLang}>{t.lang}</button>
            <button type="button" style={signBtn} onClick={() => routeToSignIn()}>
              <span style={avatarDot}><UserRound size={12} /></span>
              <span>{t.signIn}</span>
            </button>
          </div>
        </header>

        <main style={main}>
          <h1 style={title}>{t.title}</h1>
          <p style={subtitle}>{t.subtitle}</p>

          <div style={ctaGrid}>
            <div style={ctaCol}>
              <button type="button" style={quickBtn} onClick={() => routeToSignIn("results")} data-testid="landing-start-quick">
                {t.quickBtn}
              </button>
              <div style={ctaHintWrap}>
                {t.quickHint.map((line) => (
                  <div key={line} style={ctaHintLine}>{line}</div>
                ))}
              </div>
            </div>
            <div style={ctaCol}>
              <button type="button" style={proBtn} onClick={() => routeToSignIn("pro")} data-testid="landing-start-pro">
                {t.proBtn}
              </button>
              <div style={ctaHintWrap}>
                {t.proHint.map((line) => (
                  <div key={line} style={ctaHintLine}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer style={footer}>
        <div style={footerLinks}>
          <a href="/terms" style={footerLink}>{t.service}</a>
          <a href="/privacy" style={footerLink}>{t.privacy}</a>
          <div style={contactWrap}>
            <button type="button" style={footerBtn} onClick={() => setContactOpen((v) => !v)}>
              {t.contact}
            </button>
            {contactOpen ? (
              <div style={contactMenu}>
                <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.support}`} style={footerMail}>
                  {t.support}: {PUBLIC_CONTACT_CHANNELS.support}
                </a>
                <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={footerMail}>
                  {t.business}: {PUBLIC_CONTACT_CHANNELS.business}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  background: "radial-gradient(920px 520px at 0% -20%, rgba(90,140,220,0.16), transparent 62%), #090d15",
  color: "var(--spx-text-1)",
  position: "relative",
  overflowX: "hidden"
};

const glowLeft: CSSProperties = {
  position: "fixed",
  top: -220,
  left: -180,
  width: 620,
  height: 620,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(88,152,238,0.2) 0%, transparent 66%)",
  filter: "blur(18px)",
  pointerEvents: "none"
};

const glowRight: CSSProperties = {
  position: "fixed",
  top: -220,
  right: -180,
  width: 620,
  height: 620,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(76,196,214,0.14) 0%, transparent 66%)",
  filter: "blur(18px)",
  pointerEvents: "none"
};

const shell: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 1040,
  margin: "0 auto",
  padding: "24px 20px 148px"
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap"
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
  background: "linear-gradient(145deg, #68d49f, #6ba7ff)"
};

const logoText: CSSProperties = {
  fontSize: 13,
  fontWeight: 730,
  letterSpacing: "0.06em"
};

const topActions: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap"
};

const introWrap: CSSProperties = {
  position: "relative"
};

const textBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-2)",
  fontSize: 13,
  fontWeight: 620,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer"
};

const textLink: CSSProperties = {
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 620
};

const signBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-1)",
  fontSize: 13,
  fontWeight: 640,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer"
};

const avatarDot: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(145deg, rgba(108,168,245,0.82), rgba(84,203,169,0.78))",
  color: "#f4fbff"
};

const menu: CSSProperties = {
  position: "absolute",
  top: 22,
  left: 0,
  minWidth: 150,
  borderRadius: 10,
  background: "rgba(11,17,28,0.97)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.42)",
  padding: 6,
  display: "grid",
  gap: 2,
  zIndex: 8
};

const menuItem: CSSProperties = {
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 12.5,
  fontWeight: 620,
  padding: "7px 8px",
  borderRadius: 7
};

const main: CSSProperties = {
  marginTop: 66,
  maxWidth: 920,
  marginInline: "auto",
  textAlign: "center"
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
  color: "var(--spx-text-2)",
  fontSize: "clamp(14px, 1.7vw, 16px)",
  lineHeight: 1.62,
  maxWidth: 920
};

const ctaGrid: CSSProperties = {
  marginTop: 30,
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  alignItems: "start"
};

const ctaCol: CSSProperties = {
  display: "grid",
  gap: 8,
  alignContent: "start"
};

const quickBtn: CSSProperties = {
  minHeight: 56,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(180deg, rgba(76,133,214,0.95), rgba(53,99,169,0.98))",
  color: "#eef5ff",
  fontSize: 15,
  fontWeight: 740,
  padding: "0 16px",
  cursor: "pointer"
};

const proBtn: CSSProperties = {
  minHeight: 56,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(180deg, rgba(46,78,128,0.98), rgba(32,56,94,0.99))",
  color: "#edf4ff",
  fontSize: 15,
  fontWeight: 740,
  padding: "0 16px",
  cursor: "pointer"
};

const ctaHintWrap: CSSProperties = {
  display: "grid",
  gap: 2
};

const ctaHintLine: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 13,
  lineHeight: 1.45,
  textAlign: "center"
};

const footer: CSSProperties = {
  position: "fixed",
  right: 20,
  bottom: 16,
  zIndex: 2
};

const footerLinks: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  position: "relative"
};

const footerLink: CSSProperties = {
  color: "var(--spx-text-3)",
  textDecoration: "none",
  fontSize: 12.5,
  fontWeight: 620
};

const footerBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  fontWeight: 620,
  padding: 0,
  cursor: "pointer"
};

const contactWrap: CSSProperties = {
  position: "relative"
};

const contactMenu: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: 20,
  minWidth: 290,
  borderRadius: 10,
  background: "rgba(11,17,28,0.97)",
  boxShadow: "0 14px 30px rgba(0,0,0,0.42)",
  padding: 8,
  display: "grid",
  gap: 6
};

const footerMail: CSSProperties = {
  color: "var(--spx-text-2)",
  textDecoration: "none",
  fontSize: 12.5,
  fontWeight: 560
};
