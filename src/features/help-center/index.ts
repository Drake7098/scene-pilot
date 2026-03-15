/**
 * Help Center feature — Stage 1: new 14-section structure, skeleton components, placeholders.
 */

export { HelpModal } from "./HelpModal";
export { HelpLayout } from "./HelpLayout";
export { HelpSidebar } from "./HelpSidebar";
export { HelpPanel, type HelpPanelFeedbackProps } from "./HelpPanel";
export { HELP_SECTIONS, getHelpSections } from "./helpSections";
export { getPlaceholderContent, type PlaceholderContent } from "./helpPlaceholders";
export { getHelpContent, getHelpContentForLang, type HelpContentBlock, type HelpSectionContent } from "./helpContent";
export { DEFAULT_HELP_SECTION } from "./types";
export type { HelpSectionId, HelpSectionMeta } from "./types";
export { LEGACY_SECTION_IDS, LEGACY_CONTENT_SNIPPETS } from "./legacyHelpContent";
export type { LegacyHelpSectionId } from "./legacyHelpContent";
