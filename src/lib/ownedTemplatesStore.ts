/**
 * Owned templates: unlock once, reuse freely.
 * Stored per user in localStorage until backend provides owned list.
 */

const KEY_PREFIX = "scenepilot_owned_templates_";

function key(userId: string): string {
  return KEY_PREFIX + userId;
}

export function getOwnedTemplateIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function isTemplateOwned(userId: string, templateId: string): boolean {
  return getOwnedTemplateIds(userId).includes(templateId);
}

export function markTemplateOwned(userId: string, templateId: string): void {
  const ids = getOwnedTemplateIds(userId);
  if (ids.includes(templateId)) return;
  try {
    localStorage.setItem(key(userId), JSON.stringify([...ids, templateId]));
  } catch {
    // ignore
  }
}
