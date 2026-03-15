/**
 * Help Center — layout: fixed sidebar + scrollable panel (Stage 3).
 * Panel scrolls; modal does not. Desktop: sidebar 200px, panel flex. Narrow: section dropdown + panel.
 */

import React from "react";
import type { HelpSectionId } from "./types";
import { HelpSidebar } from "./HelpSidebar";
import { HelpPanel, type HelpPanelFeedbackProps } from "./HelpPanel";
import { HELP_GROUPS } from "./helpGroups";
import { getHelpSections } from "./helpSections";
import { helpModalStyles, helpColors } from "./helpStyles";

type Lang = "zh" | "en";

const allSectionIds: HelpSectionId[] = HELP_GROUPS.flatMap((g) => g.sections);

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
  const sectionLabels = React.useMemo(
    () => Object.fromEntries(getHelpSections(lang).map((s) => [s.id, s.label])),
    [lang]
  );

  return (
    <div style={helpModalStyles.body}>
      {!narrow ? (
        <HelpSidebar sectionId={sectionId} onSelect={setSectionId} lang={lang} />
      ) : (
        <div style={{ padding: "8px 0 12px", borderBottom: `1px solid ${helpColors.border}`, marginBottom: 8 }}>
          <select
            data-testid="help-center-section-select"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value as HelpSectionId)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${helpColors.border}`,
              background: helpColors.bg,
              color: helpColors.text,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            {allSectionIds.map((id) => (
              <option key={id} value={id}>
                {sectionLabels[id] ?? id}
              </option>
            ))}
          </select>
        </div>
      )}
      <HelpPanel sectionId={sectionId} lang={lang} feedbackProps={feedbackProps} />
    </div>
  );
}
