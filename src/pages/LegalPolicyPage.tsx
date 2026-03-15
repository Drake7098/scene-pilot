import { type CSSProperties } from "react";
import type { Lang } from "../i18n";
import { useLocalLang } from "../hooks/useLocalLang";
import { StandalonePageChrome } from "../components/StandalonePageChrome";
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
        <StandalonePageChrome
          lang={lang}
          setLang={setLang}
          backHref="/app"
          backLabelZh="返回工作台"
          backLabelEn="Back to Workspace"
          showFooter
        >
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
        </StandalonePageChrome>
      </div>
    </div>
  );
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
