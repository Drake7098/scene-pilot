/**
 * Template cost resolution.
 */

import type { TemplateIndex } from "../types/templateIndex";

export function resolveTemplateCost(template: TemplateIndex): number {
  return template.isFree ? 0 : template.cost;
}
