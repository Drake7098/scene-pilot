/**
 * Help Center — layout: sidebar + scroll panel.
 */

import React from "react";
import type { HelpSectionId } from "./types";
import { HelpSidebar } from "./HelpSidebar";
import { HelpPanel, type HelpPanelFeedbackProps } from "./HelpPanel";

type Lang = "zh" | "en";

const styles = {
  body: {
    marginTop: 10,
    display: "grid" as const,
    gridTemplateColumns: "180px minmax(0,1fr)",
    gap: 10,
    minHeight: 0,
    overflow: "hidden" as const
  },
  bodyNarrow: {
    gridTemplateColumns: "1fr" as const
  },
  navWrap: {
    minHeight: 0,
    overflow: "hidden" as const
  }
};

export function HelpLayout({
  sectionId,
  setSectionId,
  lang,
  viewportWidth,
  feedbackProps
}: {
  sectionId: HelpSectionId;
  setSectionId: (id: HelpSectionId) => void;
  lang: Lang;
  viewportWidth: number;
  feedbackProps?: HelpPanelFeedbackProps | null;
}) {
  const narrow = viewportWidth < 760;
  return (
    <div
      style={{
        ...styles.body,
        ...(narrow ? styles.bodyNarrow : {})
      }}
    >
      <div style={styles.navWrap}>
        <HelpSidebar sectionId={sectionId} onSelect={setSectionId} lang={lang} />
      </div>
      <HelpPanel sectionId={sectionId} lang={lang} feedbackProps={feedbackProps} />
    </div>
  );
}