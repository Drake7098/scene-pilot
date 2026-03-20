export interface SharePayload {
  intentId: string;
  subTaskId: string;
  familyId: string;
  variantId: string;
  mainSubjectPrompt: string;
  aspectRatio: string;
  styleDirection?: string;
  platformId: string;
  promptText: string;
  resultImageUrl?: string;
  createdAt: number;
}

const PENDING_SHARE_KEY = "sp_pending_share_payload_v1";

export function encodeSharePayload(payload: SharePayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodeSharePayload(raw: string): SharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(raw))) as SharePayload;
  } catch {
    return null;
  }
}

export function setPendingSharePayload(payload: SharePayload) {
  try {
    localStorage.setItem(PENDING_SHARE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function consumePendingSharePayload(): SharePayload | null {
  try {
    const raw = localStorage.getItem(PENDING_SHARE_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_SHARE_KEY);
    return JSON.parse(raw) as SharePayload;
  } catch {
    return null;
  }
}
