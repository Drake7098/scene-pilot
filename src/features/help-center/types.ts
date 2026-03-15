/**
 * Help Center — shared types for section id and metadata.
 * Stage 1: new 14-section structure (see docs/help-rewrite-plan-v2.md).
 */

export type HelpSectionId =
  | "intro"
  | "workspace"
  | "templates"
  | "advanced_templates"
  | "credits"
  | "billing"
  | "generation"
  | "camera"
  | "lighting"
  | "director"
  | "continuity"
  | "export"
  | "platform"
  | "faq";

export type HelpSectionMeta = {
  id: HelpSectionId;
  labelZh: string;
  labelEn: string;
  shortDescZh?: string;
  shortDescEn?: string;
};

export const DEFAULT_HELP_SECTION: HelpSectionId = "intro";
