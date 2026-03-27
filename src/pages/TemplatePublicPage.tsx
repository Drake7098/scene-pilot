import React, { useMemo, useState } from "react";
import { Copy, Share2, Sparkles } from "lucide-react";
import { getTemplateIndex } from "../features/template-workspace";
import { buildTemplateShareText, copyTemplateLink, findTemplateBySlug, shareTemplateLink } from "../features/template-workspace/utils/templateShare";

function currentLang(): "zh" | "en" {
  if (typeof window === "undefined") return "zh";
  const raw = localStorage.getItem("scenepilot_lang");
  return raw === "en" ? "en" : "zh";
}

function currentSlug(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/^\/template\/(.+)$/);
  return decodeURIComponent(m?.[1] ?? "");
}

export default function TemplatePublicPage() {
  const lang = currentLang();
  const slug = currentSlug();
  const template = useMemo(() => findTemplateBySlug(getTemplateIndex(), slug), [slug]);
  const [hint, setHint] = useState("");
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);

  const openWorkspaceWithTemplate = () => {
    if (!template) {
      window.location.href = "/app?template=1";
      return;
    }
    const url = new URL("/app", window.location.origin);
    url.searchParams.set("template", "1");
    url.searchParams.set("template_id", template.id);
    window.location.href = `${url.pathname}${url.search}`;
  };

  const onShare = async () => {
    if (!template) return;
    const mode = await shareTemplateLink(template, lang);
    if (mode === "shared") setHint(t("已打开系统分享", "System share opened"));
    else if (mode === "copied") setHint(t("链接已复制", "Link copied"));
    else setHint(t("分享失败，请重试", "Share failed, please retry"));
  };

  const onCopy = async () => {
    if (!template) return;
    const ok = await copyTemplateLink(template);
    setHint(ok ? t("链接已复制", "Link copied") : t("复制失败，请重试", "Copy failed, please retry"));
  };

  if (!template) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>{t("模板不存在", "Template not found")}</h1>
          <p style={styles.desc}>{t("链接可能已失效。你可以回到模板工作台继续选择。", "The link may be invalid. You can open template workspace to continue.")}</p>
          <button style={styles.primaryBtn} onClick={() => (window.location.href = "/app?template=1")}>
            {t("打开模板工作台", "Open Template Workspace")}
          </button>
        </div>
      </div>
    );
  }

  const name = lang === "zh" ? template.nameZh : template.nameEn;
  const desc = lang === "zh" ? (template.descriptionZh ?? template.descriptionEn) : (template.descriptionEn ?? template.descriptionZh);
  const pricing = template.isFree ? t("免费", "Free") : `${template.cost} credits`;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{name}</h1>
        <p style={styles.desc}>{desc}</p>

        <section style={styles.block}>
          <h3 style={styles.blockTitle}>{t("适用场景", "Applicable Scenes")}</h3>
          <p style={styles.blockText}>
            {lang === "zh"
              ? `${template.familyNameZh} · ${template.tags.slice(0, 3).join(" / ")}`
              : `${template.familyNameEn} · ${template.tags.slice(0, 3).join(" / ")}`}
          </p>
        </section>

        <section style={styles.block}>
          <h3 style={styles.blockTitle}>{t("替换内容", "What to Replace")}</h3>
          <p style={styles.blockText}>
            {t("替换主体描述并上传你的参考图即可使用。", "Replace the subject description and upload your reference image to use immediately.")}
          </p>
        </section>

        <section style={styles.block}>
          <h3 style={styles.blockTitle}>{t("生成结果", "Output Result")}</h3>
          <p style={styles.blockText}>{desc}</p>
        </section>

        <section style={styles.block}>
          <h3 style={styles.blockTitle}>{t("镜头语言与核心设置", "Lens Language & Core Setup")}</h3>
          <p style={styles.blockText}>
            {`${template.mediaType.toUpperCase()} · ${template.ratio} · ${template.storyPlan} · ${pricing}`}
          </p>
        </section>

        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={openWorkspaceWithTemplate}>
            <Sparkles size={14} />
            {t("使用模板", "Use Template")}
          </button>
          <button style={styles.secondaryBtn} onClick={onShare}>
            <Share2 size={14} />
            {t("分享模板", "Share Template")}
          </button>
          <button style={styles.secondaryBtn} onClick={onCopy}>
            <Copy size={14} />
            {t("复制链接", "Copy Link")}
          </button>
        </div>

        <div style={styles.shareText}>
          {buildTemplateShareText(template, lang)}
        </div>
        {hint ? <div style={styles.hint}>{hint}</div> : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#1f2125",
    color: "#e5e7eb",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  card: {
    width: "min(860px, 100%)",
    background: "#24262b",
    border: "1px solid #3a3f46",
    borderRadius: 10,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { margin: 0, fontSize: 28, lineHeight: 1.15 },
  desc: { margin: 0, color: "#9ca3af", fontSize: 14, lineHeight: 1.5 },
  block: {
    border: "1px solid #3a3f46",
    borderRadius: 8,
    background: "#1f2125",
    padding: "10px 12px",
  },
  blockTitle: { margin: 0, fontSize: 12, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" },
  blockText: { margin: "6px 0 0", fontSize: 13, color: "#e5e7eb", lineHeight: 1.5 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 },
  primaryBtn: {
    minHeight: 36,
    padding: "0 12px",
    border: "none",
    borderRadius: 6,
    background: "#f59e0b",
    color: "#111827",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  secondaryBtn: {
    minHeight: 36,
    padding: "0 12px",
    border: "1px solid #3a3f46",
    borderRadius: 6,
    background: "#1f2125",
    color: "#e5e7eb",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  shareText: {
    marginTop: 4,
    fontSize: 12,
    color: "#9ca3af",
    borderTop: "1px solid #3a3f46",
    paddingTop: 10,
  },
  hint: { fontSize: 12, color: "#f59e0b" },
};
