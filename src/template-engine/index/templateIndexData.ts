/**
 * Template index — V3 era.
 * 使用 V3 结构化模版（100个），替换旧的400+webdrama+anime系统。
 */
import type { TemplateIndex } from "../types/templateIndex";
import { getV3TemplateIndex } from "../data/v3/templateIndex";

let _cached: TemplateIndex[] | null = null;

export function getTemplateIndex(): TemplateIndex[] {
  if (_cached) return _cached;
  _cached = getV3TemplateIndex();
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
  variant: string
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
