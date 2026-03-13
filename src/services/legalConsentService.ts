import { LEGAL_DOCS, type LegalDocId } from "../content/legal";
import { getApiAuthHeaders } from "./authService";
import type {
  LegalConsentContext,
  LegalConsentPayload,
  LegalConsentResult,
  LegalConsentSource
} from "../types/legalConsent";

type RecordLegalConsentInput = {
  userId: string;
  context: LegalConsentContext;
  docs: LegalDocId[];
  locale?: string;
  source: LegalConsentSource;
  acceptedAt?: string;
};

const PENDING_KEY = "sp_pending_legal_consents_v1";
const ALLOWED_DOCS: LegalDocId[] = ["terms", "privacy", "billing", "refund"];

function normalizeDocs(docs: LegalDocId[]) {
  const set = new Set<LegalDocId>();
  for (const item of docs) {
    if (ALLOWED_DOCS.includes(item)) set.add(item);
  }
  return Array.from(set);
}

function toVersionMap(docs: LegalDocId[]) {
  const map: Partial<Record<LegalDocId, string>> = {};
  for (const doc of docs) {
    map[doc] = LEGAL_DOCS[doc].version;
  }
  return map;
}

function normalizeLocale(locale?: string) {
  const raw = String(locale || "").trim();
  if (raw) return raw.slice(0, 24);
  if (typeof navigator !== "undefined" && navigator.language) {
    return String(navigator.language).slice(0, 24);
  }
  return "en";
}

function normalizeAcceptedAt(value?: string) {
  const raw = String(value || "").trim();
  if (raw) {
    const date = new Date(raw);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

function parsePendingQueue() {
  if (typeof window === "undefined") return [] as LegalConsentPayload[];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return [] as LegalConsentPayload[];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as LegalConsentPayload[];
    return parsed.filter((item) => item && typeof item === "object") as LegalConsentPayload[];
  } catch {
    return [] as LegalConsentPayload[];
  }
}

function writePendingQueue(queue: LegalConsentPayload[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    // ignore storage failures
  }
}

function queueConsent(payload: LegalConsentPayload) {
  const current = parsePendingQueue();
  current.push(payload);
  writePendingQueue(current.slice(-30));
}

async function postConsent(payload: LegalConsentPayload) {
  const headers = await getApiAuthHeaders(payload.userId);
  const response = await fetch("/api/legal/consent", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
      "x-sp-user-id": payload.userId
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return response.ok;
}

function buildPayload(input: RecordLegalConsentInput): LegalConsentPayload | null {
  const userId = String(input.userId || "").trim();
  if (!userId) return null;
  const docs = normalizeDocs(input.docs || []);
  if (!docs.length) return null;
  return {
    userId,
    context: input.context,
    docs,
    documentVersions: toVersionMap(docs),
    locale: normalizeLocale(input.locale),
    source: input.source,
    acceptedAt: normalizeAcceptedAt(input.acceptedAt)
  };
}

export async function recordLegalConsent(input: RecordLegalConsentInput): Promise<LegalConsentResult> {
  const payload = buildPayload(input);
  if (!payload) return { ok: false, queued: false };
  try {
    const ok = await postConsent(payload);
    if (ok) return { ok: true, queued: false };
    queueConsent(payload);
    return { ok: false, queued: true };
  } catch {
    queueConsent(payload);
    return { ok: false, queued: true };
  }
}

export async function syncPendingLegalConsents(userId: string) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return;
  const queue = parsePendingQueue();
  if (!queue.length) return;

  const remains: LegalConsentPayload[] = [];
  for (const item of queue) {
    if (!item || typeof item !== "object") continue;
    if (String(item.userId || "").trim() !== normalizedUserId) {
      remains.push(item);
      continue;
    }
    try {
      const ok = await postConsent(item);
      if (!ok) remains.push(item);
    } catch {
      remains.push(item);
    }
  }
  writePendingQueue(remains);
}
