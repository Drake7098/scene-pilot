/**
 * Help Center — sidebar with grouped navigation (Stage 3).
 * Renders group titles and section tabs; current section highlighted.
 */

import React from "react";
import type { HelpSectionId } from "./types";
import { HELP_GROUPS } from "./helpGroups";
import { getHelpSections } from "./helpSections";
import { helpSidebarStyles } from "./helpStyles";

type Lang = "zh" | "en";

export function HelpSidebar({
  sectionId,
  onSelect,
  lang
}: {
  sectionId: HelpSectionId;
  onSelect: (id: HelpSectionId) => void;
  lang: Lang;
}) {
  const sectionLabels = React.useMemo(() => {
    const list = getHelpSections(lang);
    return Object.fromEntries(list.map((s) => [s.id, s.label])) as Record<HelpSectionId, string>;
  }, [lang]);

  return (
    <div style={helpSidebarStyles.wrap}>
      {HELP_GROUPS.map((group) => (
        <div
          key={group.groupId}
          data-testid={`help-center-group-${group.groupId}`}
          style={helpSidebarStyles.group}
        >
          <div style={helpSidebarStyles.groupTitle}>
            {lang === "zh" ? group.labelZh : group.labelEn}
          </div>
          {group.sections.map((id) => {
            const isActive = sectionId === id;
            return (
              <button
                key={id}
                data-testid={`help-center-tab-${id}`}
                type="button"
                style={{
                  ...helpSidebarStyles.tab,
                  ...(isActive ? helpSidebarStyles.tabActive : {})
                }}
                onClick={() => onSelect(id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = helpSidebarStyles.tabHover.background;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {sectionLabels[id] ?? id}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
