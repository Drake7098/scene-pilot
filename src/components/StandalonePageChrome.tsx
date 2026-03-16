import type { CSSProperties } from "react";
import type { Lang } from "../i18n";

export type StandalonePageChromeProps = {
  lang: Lang;
  setLang: (next: Lang) => void;
  backHref?: string;
  backLabelZh?: string;
  backLabelEn?: string;
  extraLinks?: Array<{ href: string; labelZh: string; labelEn: string }>;
  showFooter?: boolean;
  children: React.ReactNode;
};

const C = { bg: "#1f2125", panel: "#24262b", border: "#3a3f46", text: "#e5e7eb", muted: "#9ca3af", amber: "#f59e0b" };

const topRow: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "flex-end",
  gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}`
};
const langBtn: CSSProperties = {
  padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer"
};
const navLink: CSSProperties = {
  color: C.muted, fontSize: 13, textDecoration: "none", fontWeight: 500,
  padding: "4px 8px", borderRadius: 6
};
const footerWrap: CSSProperties = {
  marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.border}`, textAlign: "center"
};
const footerLink: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  minHeight: 42, padding: "0 24px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.panel,
  color: C.text, fontSize: 13, fontWeight: 600, textDecoration: "none"
};

export function StandalonePageChrome({
  lang, setLang,
  backHref = "/app",
  backLabelZh = "返回工作台",
  backLabelEn = "Back to Workspace",
  extraLinks = [],
  showFooter = false,
  children
}: StandalonePageChromeProps) {
  const backLabel = lang === "zh" ? backLabelZh : backLabelEn;
  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");

  return (
    <>
      <header style={topRow} data-testid="standalone-page-chrome">
        <button type="button" style={langBtn} onClick={toggleLang}
          aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}>
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <a href={backHref} style={navLink}>{backLabel}</a>
        {extraLinks.map((link) => (
          <a key={link.href} href={link.href} style={navLink}>
            {lang === "zh" ? link.labelZh : link.labelEn}
          </a>
        ))}
      </header>
      {children}
      {showFooter && (
        <footer style={footerWrap}>
          <a href={backHref} style={footerLink}>{backLabel}</a>
        </footer>
      )}
    </>
  );
}
