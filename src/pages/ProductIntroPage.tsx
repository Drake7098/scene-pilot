import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
import { getCurrentUser } from "../services/authService";
import type { UserState } from "../types/account";
import PublicFooter from "../components/PublicFooter";

const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";

function routeToSignIn(mode?: "results" | "pro") {
  if (mode) {
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
      localStorage.setItem(WORKSPACE_ENTRY_GUIDE_KEY, "1");
    } catch {
      /* ignore */
    }
  }
  window.location.href = "/signin";
}

const COPY = {
  zh: {
    back: "返回首页",
    title: "结构化提示词工作台",
    subtitleLine1: "用模板、分镜结构和镜头语言",
    subtitleLine2: "让大模型真正理解你的创作意图",
    core: "不再反复重试提示词。通过结构化场景、对象布局和导演级镜头控制，更稳定生成图片和视频，并支持多模型输出。",
    featuresTitle: "功能亮点",
    features: [
      "模板驱动创作（600+ 场景模板）",
      "分镜式编辑，控制对象位置与运动",
      "专业镜头语言 / 运镜 / 光影氛围",
      "支持图片与视频生成流程",
      "可导出 Prompt / 参考图 / 结构包",
      "兼容多种生成模型（Fal / Runway / 等）",
    ],
    cta: "进入工作台",
    ctaHint: "模板驱动 · 分镜编辑 · 稳定生成 · 多模型输出 · Prompt + 参考图导出",
    lang: "EN",
  },
  en: {
    back: "Back to Home",
    title: "Structured Prompt Workspace",
    subtitleLine1: "Use templates, scene structure, and cinematic language",
    subtitleLine2: "to make AI truly understand what you want to create",
    core: "Stop retrying prompts again and again. Build scenes with layout, objects, and camera control for more stable image and video generation across models.",
    featuresTitle: "Features",
    features: [
      "Template-driven workflow (600+ scene templates)",
      "Storyboard-style scene editor",
      "Professional camera / motion / lighting control",
      "Works for both image and video generation",
      "Export Prompt / References / Structure pack",
      "Compatible with multiple engines (Fal / Runway / etc.)",
    ],
    cta: "Enter Workspace",
    ctaHint: "Templates · Storyboard · Stable Generation · Multi-Model · Prompt + Reference Export",
    lang: "中文",
  },
} as const;

export default function ProductIntroPage() {
  const [lang, setLang] = useLocalLang();
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const t = useMemo(() => COPY[lang], [lang]);
  const isZh = lang === "zh";

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

  return (
    <div style={page}>
      <div style={shell}>
        <StandalonePageChrome
          lang={lang}
          setLang={setLang}
          backHref="/"
          backLabelZh="返回首页"
          backLabelEn="Back to Home"
          showFooter
        >
        <main style={main}>
          <h1 style={title}>{t.title}</h1>
          <p style={subtitle}>
            <span style={subtitleLine}>{t.subtitleLine1}</span>
            <span style={subtitleLine}>{t.subtitleLine2}</span>
          </p>
          <p style={coreText}>{t.core}</p>

          <section style={featuresSection}>
            <h2 style={featuresTitle}>{t.featuresTitle}</h2>
            <ul style={featuresList}>
              {t.features.map((item) => (
                <li key={item} style={featureItem}>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <div style={ctaWrap}>
            {accountUser ? (
              <a
                href="/app"
                style={{ ...ctaBtn, ...(isZh ? ctaBtnZh : null), textDecoration: "none" }}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
              >
                {t.cta}
              </a>
            ) : (
              <button
                type="button"
                style={{
                  ...ctaBtn,
                  ...(isZh ? ctaBtnZh : null),
                  backgroundColor: ctaHover ? "#d97706" : undefined,
                }}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                onClick={() => routeToSignIn("pro")}
              >
                {t.cta}
              </button>
            )}
            <p style={ctaHint}>{t.ctaHint}</p>
          </div>
        </main>

        <PublicFooter compact />
        </StandalonePageChrome>
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  color: "var(--spx-text-1)",
  background:
    "radial-gradient(860px 460px at 0% -20%, rgba(57,180,120,0.14), transparent 62%), radial-gradient(740px 420px at 100% -18%, rgba(88,138,232,0.14), transparent 62%), #080c12",
};

const shell: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "28px 20px 44px",
};

const main: CSSProperties = {
  display: "grid",
  gap: 20,
};

const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 56px)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
};

const subtitle: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: "clamp(15px, 1.8vw, 17px)",
  lineHeight: 1.6,
};

const subtitleLine: CSSProperties = {
  display: "block",
};

const coreText: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: "clamp(14px, 1.6vw, 16px)",
  lineHeight: 1.72,
  maxWidth: 820,
};

const featuresSection: CSSProperties = {
  paddingTop: 20,
  borderTop: "1px solid var(--spx-border-soft)",
  display: "grid",
  gap: 12,
};

const featuresTitle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
};

const featuresList: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 8,
};

const featureItem: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 14.5,
  lineHeight: 1.62,
};

const ctaWrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 10,
  paddingTop: 8,
};

const ctaBtn: CSSProperties = {
  minHeight: 48,
  border: "none",
  borderRadius: 12,
  background: "#fcd34d",
  color: "#1f2125",
  fontSize: 15,
  fontWeight: 700,
  padding: "0 48px",
  cursor: "pointer",
  transition: "background-color 180ms ease",
};

const ctaBtnZh: CSSProperties = {
  minHeight: 50,
  fontSize: 16,
};

const ctaHint: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-3)",
  fontSize: 13,
  lineHeight: 1.5,
};
