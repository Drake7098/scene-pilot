/**
 * Template workspace UI state.
 */

import type {
  TemplateWorkspaceScope,
  TemplateWorkspaceFilters,
  ApplyTemplateMode
} from "../model/templateFilter";

export type TemplateWorkspaceState = {
  view: "grid" | "list";
  scope: TemplateWorkspaceScope;
  selectedCategory: string | null;
  selectedTemplateId: string | null;
  searchQuery: string;
  filters: TemplateWorkspaceFilters;
  applyMode: ApplyTemplateMode;
};

export const DEFAULT_TEMPLATE_WORKSPACE_STATE: TemplateWorkspaceState = {
  view: "grid",
  scope: "recommended",
  selectedCategory: null,
  selectedTemplateId: null,
  searchQuery: "",
  filters: {
    mediaType: "all",
    storyPlan: "all",
    ratio: "all",
    pricing: "all",
    domain: "all"
  },
  applyMode: "layout_only"
};
