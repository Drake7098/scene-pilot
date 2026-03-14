/**
 * Template index - 400 base + 100 webdrama + 100 anime = 600.
 */

import type { TemplateIndex } from "../types/templateIndex";
import type { TemplateVariant } from "../types/templateTypes";
import { buildTemplateIndexFrom400 } from "../data/families/indexAdapter";
import { buildWebdramaIndex } from "../data/families/continuity-webdrama/indexBuilder";
import { buildAnimeIndex } from "../data/families/continuity-anime/indexBuilder";
import { registerTemplate400BasesAndPatches } from "../data/families/register400";

let _cached: TemplateIndex[] | null = null;
let _initDone = false;

function ensureInit(): void {
  if (_initDone) return;
  _initDone = true;
  registerTemplate400BasesAndPatches();
}

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

export function clearTemplateIndexCache(): void {
  _cached = null;
}

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
