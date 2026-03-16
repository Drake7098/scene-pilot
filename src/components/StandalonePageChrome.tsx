/**
 * Full-site standard for standalone pages:
 * - Top-right: one language toggle button + back/workspace link (and optional extra links).
 * - Optional footer for long pages: button to return or go to workspace.
 */

import type { CSSProperties } from "react";
import type { Lang } from "../i18n";

export type StandalonePageChromeProps = {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** Default /app */
  backHref?: string;
  /** Default 返回工作台 / Back to Workspace */
  backLabelZh?: string;
  backLabelEn?: string;
  /** Extra links in top-right after the back link (e.g. 价格 / Pricing) */
  extraLinks?: Array<{ href: string; labelZh: string; labelEn: string }>;
  /** Show footer with back/workspace link on long pages */
  showFooter?: boolean;
  children: React.ReactNode;
};

const topRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  marginBottom: 20,
};

const langBtn: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid var(--spx-border-soft)",
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-2)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const navLink: CSSProperties = {
  color: "var(--spx-text-2)",
  fontSize: 14,
  textDecoration: "none",
  padding: "6px 0",
};

const footerWrap: CSSProperties = {
  marginTop: 48,
  paddingTop: 24,
  borderTop: "1px solid var(--spx-border-soft)",
  textAlign: "center",
};

const footerLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  padding: "0 20px",
  borderRadius: 12,
  background: "var(--spx-surface-2)",
  color: "var(--spx-text-1)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

export function StandalonePageChrome({
  lang,
  setLang,
  backHref = "/app",
  backLabelZh = "返回工作台",
  backLabelEn = "Back to Workspace",
  extraLinks = [],
  showFooter = false,
  children
}: StandalonePageChromeProps) {
  const backLabel = lang === "zh" ? backLabelZh : backLabelEn;
  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");
  const langButtonLabel = lang === "zh" ? "EN" : "中文";

  return (
    <>
      <header style={topRow} data-testid="standalone-page-chrome">
        <button
          type="button"
          style={langBtn}
          onClick={toggleLang}
          aria-pressed={lang === "zh"}
          aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
        >
          {langButtonLabel}
        </button>
        <a href={backHref} style={navLink}>
          {backLabel}
        </a>
        {extraLinks.map((link) => (
          <a key={link.href} href={link.href} style={navLink}>
            {lang === "zh" ? link.labelZh : link.labelEn}
          </a>
        ))}
      </header>

      {children}

      {showFooter ? (
        <footer style={footerWrap}>
          <a href={backHref} style={footerLink}>
            {backLabel}
          </a>
        </footer>
      ) : null}
    </>
  );
}
