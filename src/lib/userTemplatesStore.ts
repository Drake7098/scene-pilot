/**
 * User-private templates: "我创建的".
 * Stored per user in localStorage. No schema/engine change.
 */

import type { Project } from "../model";
import { sanitizeProject } from "../model";

const KEY_PREFIX = "scenepilot_user_templates_";

export type UserPrivateTemplateOrigin = "marketplace" | "user_private";

export type UserPrivateTemplate = {
  id: string;
  name: string;
  slug: string;
  originType: UserPrivateTemplateOrigin;
  ownerUserId: string;
  sourceProjectId?: string;
  sourceTemplateSlug?: string;
  /** Full project snapshot to restore as new project (no append). */
  projectSnapshot: Project;
  createdAt: number;
};

function key(userId: string): string {
  return KEY_PREFIX + userId;
}

export function getUserPrivateTemplates(userId: string): UserPrivateTemplate[] {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x: unknown): x is UserPrivateTemplate =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as UserPrivateTemplate).id === "string" &&
          typeof (x as UserPrivateTemplate).name === "string" &&
          typeof (x as UserPrivateTemplate).projectSnapshot === "object"
      )
      .map((x) => ({
        ...x,
        projectSnapshot: sanitizeProject(x.projectSnapshot)
      }));
  } catch {
    return [];
  }
}

export function saveUserPrivateTemplate(
  userId: string,
  template: Omit<UserPrivateTemplate, "createdAt">
): void {
  const list = getUserPrivateTemplates(userId);
  const existing = list.findIndex((t) => t.id === template.id);
  const entry: UserPrivateTemplate = {
    ...template,
    createdAt: existing >= 0 ? list[existing].createdAt : Date.now()
  };
  const next = existing >= 0 ? list.map((t, i) => (i === existing ? entry : t)) : [...list, entry];
  try {
    localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function deleteUserPrivateTemplate(userId: string, templateId: string): void {
  const list = getUserPrivateTemplates(userId).filter((t) => t.id !== templateId);
  try {
    localStorage.setItem(key(userId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** Generate next slug for "我创建的" naming: scene-template-001, promo-layout-001, etc. */
function nextUserTemplateSeq(prefix: string): number {
  try {
    const k = "scenepilot_user_tpl_seq_" + prefix;
    const raw = localStorage.getItem(k);
    const n = raw != null ? Math.max(0, parseInt(raw, 10)) : 0;
    const next = n + 1;
    localStorage.setItem(k, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function generateUserTemplateName(project: Project): { name: string; slug: string } {
  const slugFromMeta = project.meta?.sourceTemplateSlug;
  const prefix = slugFromMeta
    ? slugFromMeta.replace(/-/g, "-") + "-custom"
    : "scene-template";
  const seq = nextUserTemplateSeq(prefix);
  const num = String(seq).padStart(3, "0");
  const slug = `${prefix}-${num}`;
  const name = `${prefix}-${num}`;
  return { name, slug };
}

function generateUserTemplateId(): string {
  return "user_tpl_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

/**
 * Create a user-private template from current project and save it.
 * Call from "保存为模板" (Save as template).
 */
export function saveCurrentProjectAsTemplate(
  userId: string,
  project: Project
): UserPrivateTemplate {
  const { name, slug } = generateUserTemplateName(project);
  const id = generateUserTemplateId();
  const snapshot = sanitizeProject(JSON.parse(JSON.stringify(project)));
  const template: UserPrivateTemplate = {
    id,
    name,
    slug,
    originType: "user_private",
    ownerUserId: userId,
    sourceProjectId: project.id,
    sourceTemplateSlug: project.meta?.sourceTemplateSlug,
    projectSnapshot: snapshot,
    createdAt: Date.now()
  };
  saveUserPrivateTemplate(userId, {
    id,
    name,
    slug,
    originType: template.originType,
    ownerUserId: template.ownerUserId,
    sourceProjectId: template.sourceProjectId,
    sourceTemplateSlug: template.sourceTemplateSlug,
    projectSnapshot: template.projectSnapshot
  });
  return template;
}
