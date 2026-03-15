/**
 * Help Center feature — Stage 1–4: 14-section structure, no placeholders, no legacy exports.
 */

export { HelpModal } from "./HelpModal";
export { HelpLayout } from "./HelpLayout";
export { HelpSidebar } from "./HelpSidebar";
export { HelpPanel, type HelpPanelFeedbackProps } from "./HelpPanel";
export { HELP_SECTIONS, getHelpSections } from "./helpSections";
export { HELP_GROUPS } from "./helpGroups";
export type { HelpGroup, HelpGroupId } from "./helpGroups";
export { getHelpContent, getHelpContentForLang, type HelpContentBlock, type HelpSectionContent } from "./helpContent";
export { DEFAULT_HELP_SECTION } from "./types";
export type { HelpSectionId, HelpSectionMeta } from "./types";
