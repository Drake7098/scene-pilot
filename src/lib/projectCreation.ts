/**
 * Project creation: blank, from template, duplicate.
 * Use Template = always create new project. Never append to current.
 */

import type { Project } from "../model";
import type { TemplateIndex } from "../template-engine/types/templateIndex";
import type { UserPrivateTemplate } from "./userTemplatesStore";
import { defaultProject } from "../model";
import { applyPayloadToProject } from "../template-engine/apply/applyPayload";
import { loadTemplatePayloadById } from "../template-engine/payload/templateLoader";
import { sanitizeProject } from "../model";

const SEQ_KEY_PREFIX = "scenepilot_project_seq_";

function nextSeq(prefix: string): number {
  try {
    const key = SEQ_KEY_PREFIX + prefix;
    const raw = localStorage.getItem(key);
    const n = raw != null ? Math.max(0, parseInt(raw, 10)) : 0;
    const next = n + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

/** Template id to slug for naming (e.g. tpl400_premium_product_cinematic -> premium-product). */
export function templateIdToSlug(templateId: string): string {
  const withoutPrefix = templateId.replace(/^tpl\d+_/, "");
  return withoutPrefix.replace(/_/g, "-").toLowerCase() || "template";
}

export type GenerateNextProjectNameOptions = {
  /** Prefix for the name (e.g. "project", "premium-product"). */
  prefix: string;
};

/**
 * Generate stable, sortable project name: {prefix}-001, {prefix}-002, ...
 * Persists per-prefix counter in localStorage.
 */
export function generateNextProjectName(options: GenerateNextProjectNameOptions): string {
  const { prefix } = options;
  const n = nextSeq(prefix);
  const num = String(n).padStart(3, "0");
  return `${prefix}-${num}`;
}

/**
 * Infer prefix from existing project name for Save As (e.g. "premium-product-001" -> "premium-product").
 * Fallback to "project" or "copy".
 */
export function inferProjectNamePrefix(name: string | null | undefined): string {
  const s = (name ?? "").trim();
  const match = s.match(/^(.+)-(\d{3})$/);
  if (match) return match[1];
  if (s.length > 0) return s.replace(/\s+/g, "-").toLowerCase().slice(0, 32);
  return "project";
}

function generateProjectId(): string {
  return "proj_" + Math.random().toString(36).slice(2, 12);
}

/**
 * Create a blank project with id and auto-generated name.
 */
export function createBlankProject(): Project {
  const id = generateProjectId();
  const name = generateNextProjectName({ prefix: "project" });
  const p = defaultProject();
  return sanitizeProject({
    ...p,
    id,
    name,
    meta: {
      ...p.meta,
      sourceType: "blank",
      appliedTemplateIds: [],
      proExportMode: p.meta?.proExportMode ?? "prompt_only"
    }
  });
}

/**
 * Create a new project from template. Never appends to existing project.
 * Caller is responsible for charging (if not owned) and marking template owned.
 */
export async function createProjectFromTemplate(
  template: TemplateIndex,
  options?: { templateOwnedAtCreation?: boolean; pricingBucketAtCreation?: string }
): Promise<Project> {
  const payload = await loadTemplatePayloadById(template.id);
  if (!payload || !payload.scenes?.length) {
    throw new Error("Template not found or has no scenes");
  }
  const blank = defaultProject();
  const result = applyPayloadToProject(payload, blank, false, "full_workflow");
  if (!result.success || !result.appliedProject) {
    throw new Error(result.blockReason ?? "Failed to apply template");
  }
  const slug = templateIdToSlug(template.id);
  const id = generateProjectId();
  const name = generateNextProjectName({ prefix: slug });
  const next: Project = {
    ...result.appliedProject,
    id,
    name,
    meta: {
      ...result.appliedProject.meta,
      sourceType: "template",
      sourceTemplateId: template.id,
      sourceTemplateSlug: slug,
      templateOwnedAtCreation: options?.templateOwnedAtCreation ?? false,
      pricingBucketAtCreation: options?.pricingBucketAtCreation,
      currentTemplate: {
        templateId: template.id,
        familyId: template.familyId,
        familyNameZh: template.familyNameZh ?? "",
        familyNameEn: template.familyNameEn ?? "",
        variantId: template.variantId,
        variantNameZh: template.nameZh,
        variantNameEn: template.nameEn,
        titleZh: template.nameZh,
        titleEn: template.nameEn,
        category: template.category,
        domain: template.domain,
        cost: template.cost ?? 0,
        isFree: template.isFree ?? false,
        applyMode: "full_workflow",
        appliedAt: Date.now(),
        fromTemplateWorkspace: true
      }
    }
  };
  return sanitizeProject(next);
}

/**
 * Create a new project from a user-private template (My Templates > 我创建的).
 * Clones the stored project snapshot with new id/name. No charge.
 */
export function createProjectFromUserTemplate(userTemplate: UserPrivateTemplate): Project {
  const cloned = JSON.parse(JSON.stringify(userTemplate.projectSnapshot)) as Project;
  const id = generateProjectId();
  const prefix = userTemplate.slug || "user-template";
  const name = generateNextProjectName({ prefix });
  const next: Project = {
    ...sanitizeProject(cloned),
    id,
    name,
    meta: {
      ...cloned.meta,
      sourceType: "template",
      sourceTemplateId: userTemplate.id,
      sourceTemplateSlug: userTemplate.slug,
      templateOwnedAtCreation: true
    }
  };
  return sanitizeProject(next);
}

/**
 * Deep clone project and create a new project as duplicate (Save As).
 * New id, name from inferred prefix + next number. No template charge.
 */
export function duplicateProject(project: Project): Project {
  const id = generateProjectId();
  const prefix = inferProjectNamePrefix(project.name ?? project.meta?.sourceTemplateSlug);
  const name = generateNextProjectName({ prefix });
  const cloned: Project = JSON.parse(JSON.stringify(project));
  const next: Project = {
    ...sanitizeProject(cloned),
    id,
    name,
    meta: {
      ...cloned.meta,
      sourceType: "duplicate",
      basedOnProjectId: project.id ?? undefined,
      currentTemplate: cloned.meta?.currentTemplate,
      appliedTemplateIds: cloned.meta?.appliedTemplateIds ?? [],
      proExportMode: cloned.meta?.proExportMode ?? "prompt_only",
      billing: cloned.meta?.billing
    }
  };
  return sanitizeProject(next);
}
