/**
 * Template Engine - unified template logic layer.
 *
 * Responsibilities:
 * - Template index (list, search metadata)
 * - Payload building and loading
 * - Apply to project
 * - Cost resolution
 * - Entitlement checks
 *
 * UI layer (template-workspace) should import from here.
 */

// ---- Types ----
export type { TemplateIndex } from "./types/templateIndex";
export type { TemplatePayload } from "./types/templatePayload";
export type {
  TemplateVariant,
  TemplateCategory,
  TemplateDomain,
  TemplateIndustry
} from "./types/templateTypes";
export type {
  TemplateWorkspaceScope,
  TemplateWorkspaceFilters,
  ApplyTemplateMode
} from "./types/filter";

// ---- Index ----
export {
  getTemplateIndex,
  getTemplateIndexById,
  getTemplateIndexStats,
  clearTemplateIndexCache
} from "./index/templateIndexData";

// ---- Payload ----
export { loadTemplatePayloadById, loadTemplatePayload, clearPayloadCache } from "./payload/templateLoader";

// ---- Apply ----
export {
  applyTemplateFromIndex,
  applyPayloadToProject,
  type ApplyTemplateResult
} from "./apply/applyPayload";

// ---- Billing ----
export { resolveTemplateCost } from "./billing/resolveCost";

// ---- Entitlement ----
export { canUseTemplate } from "./entitlement/canUseTemplate";

// ---- Metadata (for UI) ----
export function getTemplateMetadataFromIndex(index: import("./types/templateIndex").TemplateIndex) {
  return {
    id: index.id,
    cost: index.cost,
    isFree: index.isFree,
    name: index.nameEn,
    nameZh: index.nameZh
  };
}
