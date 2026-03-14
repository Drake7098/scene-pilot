/**
 * Lightweight template index - full load for list/search/filter.
 * Does NOT include full payload. Family payloads loaded on demand via templateLoader.
 */

import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateVariant, TemplateCategory } from "../model/templateTypes";
import { buildTemplateIndexFrom400 } from "./families/indexAdapter";
import { buildWebdramaIndex } from "./families/continuity-webdrama/indexBuilder";
import { buildAnimeIndex } from "./families/continuity-anime/indexBuilder";
import { registerTemplate400BasesAndPatches } from "./families/register400";

let _cached: TemplateIndex[] | null = null;
let _initDone = false;

function ensureInit(): void {
  if (_initDone) return;
  _initDone = true;
  registerTemplate400BasesAndPatches();
}

/** Get full template index: 400 base + 100 webdrama + 100 anime = 600. */
export function getTemplateIndex(): TemplateIndex[] {
  ensureInit();
  if (_cached) return _cached;
  _cached = [
    ...buildTemplateIndexFrom400(),
    ...buildWebdramaIndex(),
    ...buildAnimeIndex()
  ];
  return _cached;
}

/** Clear cache (e.g. for tests). */
export function clearTemplateIndexCache(): void {
  _cached = null;
}

export { registerTemplate400BasesAndPatches };

export function getTemplateIndexById(id: string): TemplateIndex | undefined {
  return getTemplateIndex().find((t) => t.id === id);
}

export function getTemplateIndexByFamilyVariant(
  familyId: string,
  variant: TemplateVariant
): TemplateIndex | undefined {
  return getTemplateIndex().find(
    (t) => t.familyId === familyId && t.variant === variant
  );
}

export function getTemplateIndexStats(): { total: number; free: number } {
  const list = getTemplateIndex();
  return {
    total: list.length,
    free: list.filter((t) => t.isFree).length
  };
}
