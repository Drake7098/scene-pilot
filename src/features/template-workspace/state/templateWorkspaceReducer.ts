/**
 * Template workspace state reducer (optional - for future use).
 */

import type { TemplateWorkspaceState } from "./templateWorkspaceState";

export type TemplateWorkspaceAction =
  | { type: "SET_VIEW"; payload: "grid" | "list" }
  | { type: "SET_SCOPE"; payload: TemplateWorkspaceState["scope"] }
  | { type: "SET_CATEGORY"; payload: string | null }
  | { type: "SET_SELECTED"; payload: string | null }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FILTERS"; payload: TemplateWorkspaceState["filters"] }
  | { type: "SET_APPLY_MODE"; payload: TemplateWorkspaceState["applyMode"] };

export function templateWorkspaceReducer(
  state: TemplateWorkspaceState,
  action: TemplateWorkspaceAction
): TemplateWorkspaceState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.payload };
    case "SET_SCOPE":
      return { ...state, scope: action.payload, selectedCategory: null };
    case "SET_CATEGORY":
      return { ...state, selectedCategory: action.payload, scope: "all" };
    case "SET_SELECTED":
      return { ...state, selectedTemplateId: action.payload };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: action.payload };
    case "SET_APPLY_MODE":
      return { ...state, applyMode: action.payload };
    default:
      return state;
  }
}
