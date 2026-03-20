/**
 * Template workspace UI state.
 */

import type {
  TemplateWorkspaceScope,
  TemplateWorkspaceFilters,
  ApplyTemplateMode
} from "../model/templateFilter";
import {
  DEFAULT_TEMPLATE_INTENT_ID,
  loadLastTemplateIntent,
  type TemplateIntentId
} from "../model/templateIntent";

/** Top-level view: market (all templates) vs my templates. */
export type TemplateWorkspaceView = "market" | "my_templates";

/** Within my_templates: owned (marketplace unlocked) vs created (user private). */
export type MyTemplateSection = "owned" | "created";

export type TemplateWorkspaceState = {
  /** "全部模板" | "我的模板" */
  templateWorkspaceView: TemplateWorkspaceView;
  /** When my_templates: "已拥有" | "我创建的" */
  myTemplateSection: MyTemplateSection;
  view: "grid" | "list";
  scope: TemplateWorkspaceScope;
  selectedIntentId: TemplateIntentId | null;
  selectedSubTaskId: string | null;
  selectedCategory: string | null;
  selectedFamilyId: string | null;
  selectedTemplateId: string | null;
  searchQuery: string;
  filters: TemplateWorkspaceFilters;
  applyMode: ApplyTemplateMode;
  isQuickModeActive: boolean;
  quickModeDismissed: boolean;
  showAllTemplatesInSubTask: boolean;
};

export const DEFAULT_TEMPLATE_WORKSPACE_STATE: TemplateWorkspaceState = {
  templateWorkspaceView: "market",
  myTemplateSection: "owned",
  view: "grid",
  scope: "recommended",
  selectedIntentId: loadLastTemplateIntent() ?? DEFAULT_TEMPLATE_INTENT_ID,
  selectedSubTaskId: null,
  selectedCategory: null,
  selectedFamilyId: null,
  selectedTemplateId: null,
  searchQuery: "",
  filters: {
    mediaType: "all",
    storyPlan: "all",
    ratio: "all",
    pricing: "all",
    industry: "all"
  },
  applyMode: "layout_only",
  isQuickModeActive: false,
  quickModeDismissed: false,
  showAllTemplatesInSubTask: false
};
