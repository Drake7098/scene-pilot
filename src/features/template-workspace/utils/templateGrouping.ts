/**
 * Template grouping utilities - group by category, family, etc.
 */

import type { TemplateIndex } from "../model/templateIndex";
import type { TemplateCategory } from "../model/templateTypes";

export function groupByCategory(items: TemplateIndex[]): Map<TemplateCategory, TemplateIndex[]> {
  const map = new Map<TemplateCategory, TemplateIndex[]>();
  for (const t of items) {
    const list = map.get(t.category) ?? [];
    list.push(t);
    map.set(t.category, list);
  }
  return map;
}

export function groupByFamily(items: TemplateIndex[]): Map<string, TemplateIndex[]> {
  const map = new Map<string, TemplateIndex[]>();
  for (const t of items) {
    const list = map.get(t.familyId) ?? [];
    list.push(t);
    map.set(t.familyId, list);
  }
  return map;
}
