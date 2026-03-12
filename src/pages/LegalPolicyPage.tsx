import { useEffect, useState, type CSSProperties } from "react";
import type { Lang } from "../i18n";
import { LEGAL_DOCS, type LegalDocId, legalText } from "../content/legal";

type Props = {
  docId: "terms" | "privacy";
};

export default function LegalPolicyPage({ docId }: Props) {
  const [lang, setLang] = useLocalLang();
  const doc = LEGAL_DOCS[docId];
  const siblingPath = docId === "terms" ? "/privacy" : "/terms";
  const siblingLabel = docId === "terms"
    ? (lang === "zh" ? "查看隐私说明" : "View Privacy Notice")
    : (lang === "zh" ? "查看服务条款" : "View Terms");

  return (
    <div style={{ minHeight: "100%", color: "var(--spx-text-1)" }}>
      <div style={surface}>
        <header style={{ marginBottom: 20 }}>
          <div style={topActions}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={{ ...langBtn, ...(lang === "zh" ? langBtnOn : null) }} onClick={() => setLang("zh")}>
                中文
              </button>
              <button type="button" style={{ ...langBtn, ...(lang === "en" ? langBtnOn : null) }} onClick={() => setLang("en")}>
                EN
              </button>
            </div>
            <a href="/" style={closeBtn} aria-label="Close and back to home">
              Close
            </a>
          </div>
          <div style={eyebrow}>ScenePilotix Legal</div>
          <h1 style={{ margin: "10px 0 6px", fontSize: 34, lineHeight: 1.15 }}>{legalText(lang, doc.title)}</h1>
          <div style={{ color: "var(--spx-text-2)", fontSize: 14 }}>
            {doc.version} · {doc.updatedAt}
          </div>
          <p style={{ marginTop: 10, color: "var(--spx-text-2)", lineHeight: 1.6 }}>{legalText(lang, doc.summary)}</p>
          <div style={{ marginTop: 10 }}>
            <a href={siblingPath} style={crossLink}>{siblingLabel}</a>
          </div>
        </header>

        <section style={contentBox}>
          {doc.sections.map((section, sectionIndex) => (
            <article key={`${doc.id}_section_${sectionIndex}`} style={sectionBox}>
              <h2 style={sectionTitle}>{legalText(lang, section.heading)}</h2>
              {section.body.map((paragraph, paragraphIndex) => (
                <p key={`${doc.id}_section_${sectionIndex}_paragraph_${paragraphIndex}`} style={paragraphStyle}>
                  {legalText(lang, paragraph)}
                </p>
              ))}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function useLocalLang(): [Lang, (next: Lang) => void] {
  const detect = (): Lang => {
    if (typeof window === "undefined") return "en";
    try {
      const cached = window.localStorage.getItem("scenepilot_lang");
      if (cached === "zh" || cached === "en") return cached;
    } catch {
      // ignore
    }
    const nav = (typeof navigator !== "undefined" ? navigator.language : "") || "";
    return nav.toLowerCase().startsWith("zh") ? "zh" : "en";
  };
  const [lang, setLang] = useState<Lang>(detect);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("scenepilot_lang", lang);
    } catch {
      // ignore
    }
  }, [lang]);
  return [lang, setLang];
}

const surface: CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "42px 20px 56px"
};

const topActions: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10
};

const eyebrow: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid var(--spx-border)",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 12,
  color: "var(--spx-text-2)",
  background: "rgba(255,255,255,0.04)"
};

const contentBox: CSSProperties = {
  border: "1px solid var(--spx-border)",
  borderRadius: 16,
  background: "linear-gradient(180deg, rgba(18,24,38,0.92), rgba(12,17,28,0.94))",
  boxShadow: "var(--spx-shadow-panel)",
  padding: 20
};

const sectionBox: CSSProperties = {
  borderBottom: "1px solid var(--spx-border-soft)",
  paddingBottom: 14,
  marginBottom: 14
};

const sectionTitle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 18,
  color: "var(--spx-text-1)"
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "var(--spx-text-2)",
  lineHeight: 1.7,
  fontSize: 14
};

const langBtn: CSSProperties = {
  minWidth: 58,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid var(--spx-border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--spx-text-2)",
  fontSize: 12,
  fontWeight: 600
};

const langBtnOn: CSSProperties = {
  border: "1px solid rgba(123, 181, 255, 0.84)",
  color: "#eaf2ff",
  background: "rgba(84,144,232,0.35)"
};

const closeBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 90,
  padding: "8px 12px",
  borderRadius: 10,
  textDecoration: "none",
  border: "1px solid var(--spx-border)",
  background: "rgba(255,255,255,0.03)",
  color: "var(--spx-text-2)",
  fontWeight: 600,
  fontSize: 13
};

const crossLink: CSSProperties = {
  color: "var(--spx-accent)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600
};
