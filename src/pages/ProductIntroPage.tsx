import { useMemo, type CSSProperties } from "react";
import PublicFooter from "../components/PublicFooter";

type Locale = "zh" | "en";
const LANDING_LANG_KEY = "sp_landing_lang";

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LANDING_LANG_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator === "undefined") return "en";
  return /^zh(?:-|$)/i.test(navigator.language || "") ? "zh" : "en";
}

type Module = {
  id: string;
  title: string;
  bullets: string[];
};

const MODULES = {
  zh: [
    {
      id: "overview",
      title: "产品定位",
      bullets: [
        "工作台：结构编辑、模板驱动、导出验证",
        "稳做交付，适合商业交付与协作复用"
      ]
    },
    {
      id: "quick_start",
      title: "快速开始",
      bullets: [
        "1) 创建项目：先选图片或视频，确定单张结构还是逐镜编辑",
        "2) 搭结构：确定分镜数量、时长、镜头关系，提示词节奏与连续性提前锁定",
        "3) 编对象：逐镜调整对象位置、大小、层级、参考图，先对齐结构再补风格",
        "4) 导出验证：先看提示词，再复制或导出到目标模型平台，快速判断方向是否达标"
      ]
    },
    {
      id: "method",
      title: "核心方法",
      bullets: [
        "先结构，后生成",
        "先关系，后细节",
        "先定方向，再放大"
      ]
    },
    {
      id: "export",
      title: "导出能力",
      bullets: [
        "快速导出：当前提示词送大模型，先测方向与构图",
        "交付包：提示词 + 参考图 + 说明，适合交接与复用",
        "当前分镜 / 连续序列：按需选择导出范围"
      ]
    },
    {
      id: "fit",
      title: "适合谁",
      bullets: [
        "创作者与小团队",
        "营销与品牌内容组",
        "商业交付项目"
      ]
    }
  ] as Module[],
  en: [
    {
      id: "overview",
      title: "Positioning",
      bullets: [
        "Workspace: structure editing, template-driven flow, export validation",
        "Stable delivery, commercial handoff, reuse"
      ]
    },
    {
      id: "quick_start",
      title: "Quick Start",
      bullets: [
        "1) Create Project: choose Image or Video; lock single-image or shot-by-shot flow",
        "2) Build Structure: set shot count, duration, relationships; define pacing and continuity",
        "3) Edit Objects: tune position, size, layer, references; structure first, style second",
        "4) Export & Validate: review prompt, copy/export to model platform; verify direction"
      ]
    },
    {
      id: "method",
      title: "Core Method",
      bullets: [
        "Structure first, then generate",
        "Relationships before details",
        "Direction before scale"
      ]
    },
    {
      id: "export",
      title: "Export",
      bullets: [
        "Prompt TXT Export: send prompt to model platform, test direction and composition",
        "Package: prompt + refs + readme, for handoff and reuse",
        "Current Scene / Continuity Sequence: choose export scope"
      ]
    },
    {
      id: "fit",
      title: "Best For",
      bullets: [
        "Creators and small teams",
        "Marketing and brand workflows",
        "Commercial delivery projects"
      ]
    }
  ] as Module[]
} as const;

export default function ProductIntroPage() {
  const locale = useMemo(() => detectLocale(), []);
  const t = MODULES[locale];
  const copy = useMemo(
    () => (locale === "zh"
      ? { back: "返回首页", title: "产品介绍", lead: "结构化提示词工作台，用更少试错获得更稳定输出。" }
      : { back: "Back to Home", title: "Product Overview", lead: "A structured prompt workspace for faster direction and steadier delivery." }),
    [locale]
  );
  return (
    <div style={page}>
      <div style={shell}>
        <header style={head}>
          <a href="/" style={backLink}>{copy.back}</a>
          <h1 style={title}>{copy.title}</h1>
          <p style={lead}>{copy.lead}</p>
        </header>

        <main style={main}>
          {t.map((mod) => (
            <section key={mod.id} id={mod.id} style={sectionStyle}>
              <h2 style={sectionTitle}>{mod.title}</h2>
              <ul style={list}>
                {mod.bullets.map((b) => (
                  <li key={b} style={itemStyle}>{b}</li>
                ))}
              </ul>
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

const main: CSSProperties = {
  marginTop: 28,
  display: "grid",
  gap: 20
};

const sectionStyle: CSSProperties = {
  paddingTop: 18,
  borderTop: "1px solid rgba(188,214,242,0.14)",
  display: "grid",
  gap: 10
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 760
};

const list: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 8
};

const itemStyle: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 14.5,
  lineHeight: 1.62
};
