/**
 * Template Workspace feature module - UI layer.
 * Template logic lives in template-engine.
 */

export { TemplateWorkspace } from "./components/TemplateWorkspace";
export type { TemplateWorkspaceProps } from "./components/TemplateWorkspace";
export { DEFAULT_TEMPLATE_WORKSPACE_STATE } from "./state/templateWorkspaceState";
export type { TemplateWorkspaceState } from "./state/templateWorkspaceState";
export type { TemplateIndex } from "./model/templateIndex";
export type { TemplatePayload } from "./model/templatePayload";
export type { ApplyTemplateMode } from "./model/templateFilter";
export { getTemplateMetadataFromIndex, getTemplateIndex, applyTemplateFromIndex } from "../../template-engine";
export { TemplateSidebarEntry } from "./components/TemplateSidebarEntry";
export { CurrentTemplateContext } from "./components/CurrentTemplateContext";
