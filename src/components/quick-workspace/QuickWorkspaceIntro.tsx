import React from "react";
import type { Lang } from "../../i18n";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = {
  lang: Lang;
  mode?: "full" | "compact";
};

export function QuickWorkspaceIntro({ lang, mode = "full" }: Props) {
  return (
    <header
      style={{ ...styles.wrap, ...(mode === "compact" ? styles.wrapCompact : null) }}
      data-testid="quick-workspace-intro"
    >
      {mode === "full" ? (
        <h1 style={styles.title} data-testid="quick-intro-title">
          {t(lang, "先说你想看到什么", "Tell us what you want to see first")}
        </h1>
      ) : (
        <p style={styles.compactLine} data-testid="quick-intro-compact">
          {t(lang, "通过分镜结构和机器语言提升图片和视频制作达成率。", "Use storyboard structure and machine-ready language to improve image and video hit rate.")}
        </p>
      )}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 8,
    padding: "14px 4px 0",
    background: "transparent",
    border: "none",
    animation: "spxFadeUpIn 420ms ease both"
  },
  wrapCompact: {
    paddingTop: 8,
    justifyItems: "start"
  },
  title: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.16,
    letterSpacing: -0.34,
    fontWeight: 760,
    color: "#ffffff"
  },
  compactLine: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.28,
    fontWeight: 650,
    color: "rgba(255,255,255,0.82)",
    textAlign: "left",
    letterSpacing: -0.2
  }
};
