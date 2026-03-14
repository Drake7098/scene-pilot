/**
 * Template compatibility utilities - check if template can be applied.
 */

import type { TemplateIndex } from "../model/templateIndex";
import type { Project } from "../../../model";

export type TemplateCompatibility = "full" | "partial" | "blocked";

export function checkTemplateCompatibility(
  _template: TemplateIndex,
  _project: Project
): TemplateCompatibility {
  return "full";
}
