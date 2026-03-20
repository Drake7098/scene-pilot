import type { TemplateIndex } from "./templateIndex";
import { INTENT_CONFIG } from "../config/intentConfig";

export type TemplateIntentId =
  | "sell_product"
  | "people_portrait"
  | "cover_poster"
  | "talking_video"
  | "story_video"
  | "pro_workflows";

export type TemplateSubTask = {
  id: string;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  /** 2–3 个具体场景短句，用于模板卡闭合态展示，帮助用户对号入座 */
  sceneHintsZh: string[];
  sceneHintsEn: string[];
  familyIds: string[];
  freeFirst: number;
};

export type TemplateIntentMeta = {
  id: TemplateIntentId;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  featured: boolean;
  tagsZh: string[];
  tagsEn: string[];
  subTasks: TemplateSubTask[];
};

const LAST_TEMPLATE_INTENT_KEY = "sp_template_last_intent_v1";
const PENDING_TEMPLATE_INTENT_KEY = "sp_template_pending_intent_v1";
const PENDING_TEMPLATE_SUBTASK_KEY = "sp_template_pending_subtask_v1";

export const DEFAULT_TEMPLATE_INTENT_ID: TemplateIntentId = "sell_product";
export const TEMPLATE_INTENTS: TemplateIntentMeta[] = INTENT_CONFIG;

function normalizeIntentId(raw: string | null): TemplateIntentId | null {
  if (raw === "continuity" || raw === "advanced") return "pro_workflows";
  return TEMPLATE_INTENTS.some((item) => item.id === raw) ? (raw as TemplateIntentId) : null;
}

export function getDefaultSubTaskIdForIntent(intentId: TemplateIntentId): string | null {
  return TEMPLATE_INTENTS.find((item) => item.id === intentId)?.subTasks[0]?.id ?? null;
}

export function loadLastTemplateIntent(): TemplateIntentId {
  try {
    const raw = localStorage.getItem(LAST_TEMPLATE_INTENT_KEY);
    return normalizeIntentId(raw) ?? DEFAULT_TEMPLATE_INTENT_ID;
  } catch {
    return DEFAULT_TEMPLATE_INTENT_ID;
  }
}

export function saveLastTemplateIntent(intentId: TemplateIntentId | null) {
  try {
    if (intentId) localStorage.setItem(LAST_TEMPLATE_INTENT_KEY, intentId);
    else localStorage.removeItem(LAST_TEMPLATE_INTENT_KEY);
  } catch {
    // ignore
  }
}

export function setPendingTemplateIntent(intentId: TemplateIntentId) {
  try {
    localStorage.setItem(PENDING_TEMPLATE_INTENT_KEY, intentId);
    localStorage.setItem(LAST_TEMPLATE_INTENT_KEY, intentId);
  } catch {
    // ignore
  }
}

export function setPendingTemplateSubTask(subTaskId: string | null) {
  try {
    if (subTaskId) localStorage.setItem(PENDING_TEMPLATE_SUBTASK_KEY, subTaskId);
    else localStorage.removeItem(PENDING_TEMPLATE_SUBTASK_KEY);
  } catch {
    // ignore
  }
}

export function consumePendingTemplateSubTask(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_TEMPLATE_SUBTASK_KEY);
    localStorage.removeItem(PENDING_TEMPLATE_SUBTASK_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function consumePendingTemplateIntent(): TemplateIntentId | null {
  try {
    const raw = localStorage.getItem(PENDING_TEMPLATE_INTENT_KEY);
    localStorage.removeItem(PENDING_TEMPLATE_INTENT_KEY);
    return normalizeIntentId(raw);
  } catch {
    return null;
  }
}

export function getIntentMeta(intentId: TemplateIntentId): TemplateIntentMeta | undefined {
  return TEMPLATE_INTENTS.find((item) => item.id === intentId);
}

export function getAvailableSubTasks(items: TemplateIndex[], intentId: TemplateIntentId): TemplateSubTask[] {
  const availableFamilies = new Set(items.map((item) => item.familyId));
  return (getIntentMeta(intentId)?.subTasks ?? []).filter((subTask) =>
    subTask.familyIds.some((familyId) => availableFamilies.has(familyId))
  );
}

export function getSubTaskMeta(intentId: TemplateIntentId, subTaskId: string): TemplateSubTask | undefined {
  return getIntentMeta(intentId)?.subTasks.find((item) => item.id === subTaskId);
}

export function getDefaultTemplateLimitForSubTask(intentId: TemplateIntentId, subTaskId: string): number {
  return Math.max(1, getSubTaskMeta(intentId, subTaskId)?.freeFirst ?? 2);
}

function variantRank(template: TemplateIndex): number {
  if (template.variant === "free_starter") return 0;
  if (template.variant === "cinematic") return 1;
  if (template.variant === "advanced_motion") return 2;
  if (template.variant === "multi_object") return 3;
  return 4;
}

export function sortByIntentPriority(templates: TemplateIndex[]): TemplateIndex[] {
  const free = templates
    .filter((t) => t.isFree)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (variantRank(a) !== variantRank(b)) return variantRank(a) - variantRank(b);
      return a.nameEn.localeCompare(b.nameEn);
    });
  const paid = templates
    .filter((t) => !t.isFree)
    .sort((a, b) => {
      if ((a.cost ?? 0) !== (b.cost ?? 0)) return (a.cost ?? 0) - (b.cost ?? 0);
      if (variantRank(a) !== variantRank(b)) return variantRank(a) - variantRank(b);
      return a.nameEn.localeCompare(b.nameEn);
    });
  return [...free, ...paid];
}

export function dedupByFamily(templates: TemplateIndex[]): TemplateIndex[] {
  const seen = new Set<string>();
  return templates.filter((template) => {
    const key = template.familyId ?? template.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getTemplatesForSubTask(
  items: TemplateIndex[],
  intentId: TemplateIntentId,
  subTaskId: string
): TemplateIndex[] {
  const subTask = getAvailableSubTasks(items, intentId).find((item) => item.id === subTaskId);
  if (!subTask) return [];
  const familyIds = new Set(subTask.familyIds);
  return sortByIntentPriority(items.filter((item) => familyIds.has(item.familyId)));
}

export function getTemplatesForIntent(items: TemplateIndex[], intentId: TemplateIntentId): TemplateIndex[] {
  const subTasks = getAvailableSubTasks(items, intentId);
  const familyIds = new Set(subTasks.flatMap((subTask) => subTask.familyIds));
  return sortByIntentPriority(items.filter((item) => familyIds.has(item.familyId)));
}

export function pickDefaultTemplateForIntent(intentId: TemplateIntentId, items: TemplateIndex[]): string | null {
  return getTemplatesForIntent(items, intentId)[0]?.id ?? null;
}
