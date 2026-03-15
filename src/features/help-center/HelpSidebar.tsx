/**
 * Help Center — sidebar navigation (section list).
 */

import React from "react";
import type { HelpSectionId } from "./types";
import { getHelpSections } from "./helpSections";

type Lang = "zh" | "en";

const styles = {
  nav: {
    display: "grid" as const,
    gap: 6,
    alignContent: "start" as const,
    minHeight: 0,
    overflowY: "auto" as const,
    paddingRight: 4
  },
  btn: {
    textAlign: "left" as const,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(170,193,226,0.24)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(237,243,252,0.96)",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer" as const
  },
  btnOn: {
    border: "1px solid rgba(104,171,255,0.86)",
    background: "rgba(102,168,255,0.18)"
  }
};

export function HelpSidebar({
  sectionId,
  onSelect,
  lang
}: {
  sectionId: HelpSectionId;
  onSelect: (id: HelpSectionId) => void;
  lang: Lang;
}) {
  const sections = getHelpSections(lang);
  return (
    <div style={styles.nav}>
      {sections.map((section) => (
        <button
          key={section.id}
          data-testid={`help-center-tab-${section.id}`}
          type="button"
          style={{
            ...styles.btn,
            ...(sectionId === section.id ? styles.btnOn : {})
          }}
          onClick={() => onSelect(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
