/**
 * Template Workspace feature module - public API.
 */

export { TemplateWorkspace } from "./components/TemplateWorkspace";
export type { TemplateWorkspaceProps } from "./components/TemplateWorkspace";
export { DEFAULT_TEMPLATE_WORKSPACE_STATE } from "./state/templateWorkspaceState";
export type { TemplateWorkspaceState } from "./state/templateWorkspaceState";
export type { TemplateIndex } from "./model/templateIndex";
export type { TemplatePayload } from "./model/templatePayload";
export type { ApplyTemplateMode } from "./model/templateFilter";
export { getTemplateWorkspaceItemFromIndex, getTemplateMetadataFromIndex } from "./adapters/legacyAdapter";
export { applyTemplateFromIndex } from "./services/templateApplyService";
export { TemplateQuickEntry } from "./components/TemplateQuickEntry";
