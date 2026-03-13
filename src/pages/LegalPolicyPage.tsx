import { useEffect, useState, type CSSProperties } from "react";
import type { Lang } from "../i18n";
import { LEGAL_DOCS, type LegalDocId, legalText } from "../content/legal";

type Props = {
  docId: LegalDocId;
};

export default function LegalPolicyPage({ docId }: Props) {
  const [lang, setLang] = useLocalLang();
  const doc = LEGAL_DOCS[docId];

  return (
    <div style={page}>
      <div style={shell}>
        <header style={topRow}>
          <div style={langSwitch}>
            <button type="button" style={{ ...langBtn, ...(lang === "zh" ? langBtnOn : null) }} onClick={() => setLang("zh")}>
              中文
            </button>
            <button type="button" style={{ ...langBtn, ...(lang === "en" ? langBtnOn : null) }} onClick={() => setLang("en")}>
              EN
            </button>
          </div>
          <a href="/" style={closeBtn} aria-label="Close">Close</a>
        </header>

        <main style={main}>
          <h1 style={title}>{legalText(lang, doc.title)}</h1>
          <p style={meta}>{doc.version} · {doc.updatedAt}</p>
          <p style={summary}>{legalText(lang, doc.summary)}</p>

          <section style={content}>
            {doc.sections.map((section, sectionIndex) => (
              <article key={`${doc.id}_section_${sectionIndex}`} style={article}>
                <h2 style={sectionTitle}>{legalText(lang, section.heading)}</h2>
                {section.body.map((paragraph, paragraphIndex) => (
                  <p key={`${doc.id}_${sectionIndex}_${paragraphIndex}`} style={paragraphStyle}>
                    {legalText(lang, paragraph)}
                  </p>
                ))}
              </article>
            ))}
          </section>
        </main>
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

const page: CSSProperties = {
  minHeight: "100%",
  color: "var(--spx-text-1)",
  background:
    "radial-gradient(820px 460px at -10% -18%, rgba(88,143,230,0.16), transparent 62%), radial-gradient(680px 420px at 110% -20%, rgba(72,188,210,0.1), transparent 64%), #090d15"
};

const shell: CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "26px 20px 40px"
};

const topRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16
};

const langSwitch: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10
};

const langBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--spx-text-3)",
  fontSize: 13,
  fontWeight: 620,
  padding: 0,
  cursor: "pointer"
};

const langBtnOn: CSSProperties = {
  color: "var(--spx-text-1)"
};

const closeBtn: CSSProperties = {
  textDecoration: "none",
  color: "var(--spx-text-2)",
  fontSize: 13,
  fontWeight: 620
};

const main: CSSProperties = {
  display: "grid",
  gap: 10
};

const title: CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 52px)",
  lineHeight: 1.1,
  letterSpacing: "-0.02em"
};

const meta: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-3)",
  fontSize: 12.5
};

const summary: CSSProperties = {
  margin: "2px 0 0",
  color: "var(--spx-text-2)",
  fontSize: 15,
  lineHeight: 1.72
};

const content: CSSProperties = {
  marginTop: 8,
  display: "grid",
  gap: 16
};

const article: CSSProperties = {
  display: "grid",
  gap: 8
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  lineHeight: 1.3
};

const paragraphStyle: CSSProperties = {
  margin: 0,
  color: "var(--spx-text-2)",
  lineHeight: 1.74,
  fontSize: 14.5
};
