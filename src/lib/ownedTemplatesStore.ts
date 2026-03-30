/**
 * Owned templates: unlock once, reuse freely.
 * Local cache mirrors backend owned list.
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

export function replaceOwnedTemplateIds(userId: string, templateIds: string[]): void {
  try {
    const unique = Array.from(new Set(templateIds.map((id) => String(id || "").trim()).filter(Boolean)));
    localStorage.setItem(key(userId), JSON.stringify(unique));
  } catch {
    // ignore
  }
}

export async function fetchOwnedTemplateIdsFromApi(userId: string): Promise<string[] | null> {
  if (!userId) return null;
  try {
    const mod = await import("../services/authService");
    const headers = await mod.getApiAuthHeaders(userId);
    const res = await fetch(`/api/templates/owned?userId=${encodeURIComponent(userId)}`, { headers });
    if (!res.ok) return null;
    const payload = await res.json() as { templateIds?: string[] };
    if (!Array.isArray(payload.templateIds)) return [];
    return Array.from(new Set(payload.templateIds.map((id) => String(id || "").trim()).filter(Boolean)));
  } catch {
    return null;
  }
}
