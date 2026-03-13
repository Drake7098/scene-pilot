import { useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import PublicFooter from "../components/PublicFooter";

type Locale = "zh" | "en";
const LANDING_LANG_KEY = "sp_landing_lang";

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LANDING_LANG_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    // ignore localStorage failures
  }
  if (typeof navigator === "undefined") return "en";
  return /^zh(?:-|$)/i.test(navigator.language || "") ? "zh" : "en";
}

const COPY = {
  zh: {
    back: "返回首页",
    title: "ScenePilotix 产品介绍",
    lead: "结构化提示词工作台，用更少试错获得更稳定输出。",
    menuLabel: "下拉查看章节",
    menu: [
      { key: "overview", label: "产品定位" },
      { key: "method", label: "工作方法" },
      { key: "fit", label: "适合任务" }
    ],
    sections: [
      {
        key: "overview",
        title: "产品定位",
        bullets: [
          "Quick：快试方向。",
          "Pro：稳做交付。",
          "模式边界清晰。"
        ]
      },
      {
        key: "method",
        title: "核心方法",
        bullets: [
          "先结构，后生成。",
          "先关系，后细节。",
          "先定方向，再放大。"
        ]
      },
      {
        key: "fit",
        title: "适合的团队",
        bullets: [
          "创作者与小团队。",
          "营销与品牌内容组。",
          "商业交付项目。"
        ]
      }
    ]
  },
  en: {
    back: "Back to Home",
    title: "ScenePilotix Product Overview",
    lead: "A structured prompt workspace for faster direction and steadier delivery.",
    menuLabel: "Jump to section",
    menu: [
      { key: "overview", label: "Positioning" },
      { key: "method", label: "Method" },
      { key: "fit", label: "Task Fit" }
    ],
    sections: [
      {
        key: "overview",
        title: "Positioning",
        bullets: [
          "Quick for direction.",
          "Pro for delivery.",
          "Clear mode boundaries."
        ]
      },
      {
        key: "method",
        title: "Core Method",
        bullets: [
          "Structure first.",
          "Relationships before details.",
          "Direction before scale."
        ]
      },
      {
        key: "fit",
        title: "Best For",
        bullets: [
          "Creators and small teams.",
          "Marketing and brand workflows.",
          "Commercial delivery projects."
        ]
      }
    ]
  }
} as const;

export default function ProductIntroPage() {
  const locale = useMemo(() => detectLocale(), []);
  const [current, setCurrent] = useState("overview");
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const t = COPY[locale];
  const onJump = (key: string) => {
    setCurrent(key);
    const el = refs.current[key];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div style={page}>
      <div style={shell}>
        <header style={head}>
          <a href="/" style={backLink}>{t.back}</a>
          <h1 style={title}>{t.title}</h1>
          <p style={lead}>{t.lead}</p>
          <label style={menuLabel}>
            <span>{t.menuLabel}</span>
            <div style={menuSelectWrap}>
              <select value={current} onChange={(e) => onJump(e.target.value)} style={menuSelect}>
                {t.menu.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
              <ChevronDown size={14} style={menuIcon} />
            </div>
          </label>
        </header>

        <main style={main}>
          {t.sections.map((section) => (
            <section
              key={section.title}
              id={section.key}
              ref={(el) => { refs.current[section.key] = el; }}
              style={sectionStyle}
            >
              <h2 style={sectionTitle}>{section.title}</h2>
              <div style={list}>
                {section.bullets.map((item) => (
                  <p key={item} style={itemStyle}>{item}</p>
                ))}
              </div>
            </section>
          ))}
        </main>

        <PublicFooter compact />
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100%",
  color: "var(--spx-text-1)",
  background:
    "radial-gradient(860px 460px at 0% -20%, rgba(57,180,120,0.14), transparent 62%), radial-gradient(740px 420px at 100% -18%, rgba(88,138,232,0.14), transparent 62%), #080c12"
};

const shell: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "28px 20px 44px"
};

const head: CSSProperties = {
  display: "grid",
  gap: 12
};

const backLink: CSSProperties = {
  width: "fit-content",
  color: "rgba(160,233,194,0.9)",
  textDecoration: "none",
  fontSize: 13.5,
  fontWeight: 640
};

const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 56px)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em"
};

const lead: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: 16,
  lineHeight: 1.72,
  maxWidth: 820
};

const menuLabel: CSSProperties = {
  display: "grid",
  gap: 6,
  width: "fit-content",
  color: "var(--spx-text-3)",
  fontSize: 12.5,
  fontWeight: 600
};

const menuSelectWrap: CSSProperties = {
  position: "relative",
  width: 220
};

const menuSelect: CSSProperties = {
  width: "100%",
  minHeight: 36,
  borderRadius: 10,
  border: "1px solid rgba(167,203,240,0.26)",
  background: "rgba(14,22,34,0.86)",
  color: "var(--spx-text-1)",
  padding: "0 32px 0 10px",
  fontSize: 13,
  fontWeight: 620,
  appearance: "none"
};

const menuIcon: CSSProperties = {
  position: "absolute",
  right: 10,
  top: 11,
  color: "var(--spx-text-3)",
  pointerEvents: "none"
};

const main: CSSProperties = {
  marginTop: 20,
  display: "grid",
  gap: 16
};

const sectionStyle: CSSProperties = {
  paddingTop: 14,
  borderTop: "1px solid rgba(188,214,242,0.14)",
  display: "grid",
  gap: 8
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 20
};

const list: CSSProperties = {
  display: "grid",
  gap: 6
};

const itemStyle: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  fontSize: 14.5,
  lineHeight: 1.62
};
