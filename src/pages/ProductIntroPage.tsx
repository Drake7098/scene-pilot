import { useState, type CSSProperties } from "react";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";

const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";

function routeToSignIn(mode?: "results" | "pro") {
  if (mode) {
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
      localStorage.setItem(WORKSPACE_ENTRY_GUIDE_KEY, "1");
    } catch { /* ignore */ }
  }
  window.location.href = "/signin";
}

const COPY = {
  zh: {
    back: "返回首页",
    eyebrow: "产品介绍",
    title: "提示词写对了，\n生成才对",
    subtitle: "大多数生成失败，不是模型不行——是结构没说清楚。\nScenePilotix 把「主体在哪 / 镜头怎么打 / 光从哪来」变成可填的表单，\n让每一次生成都有据可查。",
    why: "为什么需要结构化",
    whyItems: [
      { q: "为什么换了 Prompt 还是不对？", a: "自然语言里的空间关系太模糊。模型不知道主体在左还是右，在前景还是背景。" },
      { q: "为什么别人的 Prompt 我用不了？", a: "Prompt 是结果，不是配方。背后的构图逻辑换了人就失效。" },
      { q: "为什么换模型要重来？", a: "不同模型读 Prompt 的侧重点不同。结构化后只需切换导出模式。" },
    ],
    howTitle: "ScenePilotix 的工作方式",
    howSteps: [
      { num: "01", label: "选模板", desc: "600+ 场景模板覆盖产品 / 人物 / 运镜 / 对话等类型，直接套用骨架" },
      { num: "02", label: "填结构", desc: "主体、背景、构图、镜头、光影——分层填写，每个字段都有精准语义" },
      { num: "03", label: "导出生成", desc: "一份结构导出适配 Midjourney / Runway / fal 等主流模型的 Prompt + 参考包" },
    ],
    featuresTitle: "功能清单",
    features: [
      "600+ 场景模板（产品 / 人物 / 对话 / 运镜 / 连续镜头）",
      "分镜式编辑器，控制对象位置与运动关键帧",
      "专业镜头语言 · 导演运镜 · 光影情绪包",
      "图像 + 视频双轨生成流程",
      "支持多模型导出（Fal · Runway · Midjourney · 即梦 · 可灵等）",
      "Prompt / 参考图 / 结构包三种导出格式",
    ],
    cta: "免费开始",
    contact: "商务合作",
  },
  en: {
    back: "Back to Home",
    eyebrow: "Product Overview",
    title: "The prompt only works\nwhen the structure is right.",
    subtitle: "Most generation failures aren't the model's fault — the structure wasn't clear.\nScenePilotix turns 'where is the subject / how is the camera framed / where is the light'\ninto a structured form. Every generation is traceable.",
    why: "Why structure matters",
    whyItems: [
      { q: "Why doesn't changing the prompt fix it?", a: "Natural language is spatially vague. The model doesn't know if the subject is left or right, foreground or background." },
      { q: "Why can't I reuse someone else's prompt?", a: "A prompt is the output, not the recipe. The underlying composition logic doesn't transfer." },
      { q: "Why do I have to start over when switching models?", a: "Different models read prompts differently. With structure, you just change the export mode." },
    ],
    howTitle: "How ScenePilotix works",
    howSteps: [
      { num: "01", label: "Pick a template", desc: "600+ scene templates for product / character / camera moves / dialogue — grab a skeleton and go" },
      { num: "02", label: "Fill the structure", desc: "Subject, background, composition, camera, lighting — layered fields with precise semantic meaning" },
      { num: "03", label: "Export and generate", desc: "One structure exports to Midjourney / Runway / fal-ready Prompts + reference packs" },
    ],
    featuresTitle: "What's included",
    features: [
      "600+ scene templates (product / character / dialogue / camera / continuity)",
      "Storyboard editor with per-object position and motion keyframes",
      "Professional camera language · Director motion · Lighting mood packs",
      "Dual-track workflow for image and video generation",
      "Multi-model export: Fal · Runway · Midjourney · Jimeng · Keling and more",
      "Three export formats: Prompt / Reference images / Structure pack",
    ],
    cta: "Start Free",
    contact: "Business Inquiry",
  }
} as const;

const C = { bg: "#1f2125", panel: "#24262b", border: "#3a3f46", text: "#e5e7eb", muted: "#9ca3af", amber: "#f59e0b" };

export default function ProductIntroPage() {
  const [lang, setLang] = useLocalLang();
  const t = COPY[lang];

  return (
    <div style={page}>
      <div style={shell}>
        <StandalonePageChrome
          lang={lang}
          setLang={setLang}
          backHref="/"
          backLabelZh={t.back}
          backLabelEn={t.back}
        >
          {/* Hero */}
          <section style={heroWrap}>
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
            <button
              type="button"
              style={ctaBtn}
              onClick={() => routeToSignIn("pro")}
            >
              {t.cta}
            </button>
          </section>

          {/* Why */}
          <section style={section}>
            <h2 style={sectionTitle}>{t.why}</h2>
            <div style={whyGrid}>
              {t.whyItems.map((item, i) => (
                <div key={i} style={whyCard}>
                  <div style={whyQ}>{item.q}</div>
                  <div style={whyA}>{item.a}</div>
                </div>
              ))}
            </div>
          </section>

          {/* How */}
          <section style={section}>
            <h2 style={sectionTitle}>{t.howTitle}</h2>
            <div style={stepGrid}>
              {t.howSteps.map((s, i) => (
                <div key={i} style={stepCard}>
                  <div style={stepNum}>{s.num}</div>
                  <div style={stepLabel}>{s.label}</div>
                  <div style={stepDesc}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section style={section}>
            <h2 style={sectionTitle}>{t.featuresTitle}</h2>
            <ul style={featureList}>
              {t.features.map((f, i) => (
                <li key={i} style={featureItem}>
                  <span style={featureDot} />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* Bottom CTA */}
          <section style={bottomCta}>
            <button type="button" style={ctaBtn} onClick={() => routeToSignIn("pro")}>
              {t.cta}
            </button>
            <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={contactLink}>
              {t.contact}
            </a>
          </section>
        </StandalonePageChrome>
      </div>
    </div>
  );
}

const page: CSSProperties = { minHeight: "100%", background: C.bg, color: C.text };
const shell: CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "24px 24px 80px" };

const heroWrap: CSSProperties = { paddingTop: 40, paddingBottom: 48, textAlign: "center" };
const eyebrow: CSSProperties = { margin: "0 0 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber };
const heroTitle: CSSProperties = { margin: 0, fontSize: "clamp(34px, 5.5vw, 56px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em" };
const heroSubtitle: CSSProperties = { margin: "20px auto 0", maxWidth: 620, fontSize: 15, lineHeight: 1.8, color: C.muted };
const ctaBtn: CSSProperties = {
  marginTop: 28, minHeight: 46, padding: "0 36px", borderRadius: 10, border: "none",
  background: C.amber, color: "#1f2125", fontSize: 14, fontWeight: 700, cursor: "pointer"
};

const section: CSSProperties = { marginTop: 56 };
const sectionTitle: CSSProperties = { margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text };

const whyGrid: CSSProperties = { display: "grid", gap: 12 };
const whyCard: CSSProperties = { padding: "18px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel };
const whyQ: CSSProperties = { fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 };
const whyA: CSSProperties = { fontSize: 13, lineHeight: 1.65, color: C.muted };

const stepGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 };
const stepCard: CSSProperties = { padding: "20px 20px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.panel };
const stepNum: CSSProperties = { fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: "0.08em", marginBottom: 10 };
const stepLabel: CSSProperties = { fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 };
const stepDesc: CSSProperties = { fontSize: 13, lineHeight: 1.65, color: C.muted };

const featureList: CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px 20px" };
const featureItem: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.55, color: C.text };
const featureDot: CSSProperties = { width: 6, height: 6, borderRadius: "50%", background: C.amber, flexShrink: 0, marginTop: 6 };

const bottomCta: CSSProperties = { marginTop: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 };
const contactLink: CSSProperties = { color: C.muted, fontSize: 13, textDecoration: "none" };
