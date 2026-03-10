import React from "react";
import type { Lang } from "../../i18n";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = { lang: Lang };

export function QuickWorkspaceWelcome({ lang }: Props) {
  return (
    <header style={styles.wrap} data-testid="quick-workspace-welcome">
      <h1 style={styles.title} data-testid="quick-welcome-title">
        {t(lang, "先说你想看到什么", "Tell us what you want to see first")}
      </h1>
      <p style={styles.sub} data-testid="quick-welcome-subtitle">
        {t(lang, "一句话先定方向，我们再帮你拆成结构", "Lock the direction in one sentence, then we break it into structure")}
      </p>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 8,
    padding: "18px 0 0",
    background: "transparent",
    border: "none"
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.1,
    letterSpacing: -0.5,
    fontWeight: 760,
    color: "#ffffff"
  },
  sub: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.78)",
    fontWeight: 520
  }
};
