import type { CreditLedgerEntry, WalletState } from "../types/billing";
import { appendLedger, getLedger, getWallet, replaceLedgerEntry, setWallet } from "./mockAccountStore";
import { getApiAuthHeaders } from "./authService";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const g = globalThis as typeof globalThis & { crypto?: Crypto };
  const randomPart = typeof g.crypto?.randomUUID === "function"
    ? g.crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${randomPart}`;
}

export async function getWalletState(userId: string): Promise<WalletState> {
  const api = await getJson<{ credits?: number }>("/api/billing/me", userId);
  if (api.ok && api.data) {
    return {
      creditsBalance: Number(api.data.credits || 0),
      currency: "credits"
    };
  }
  return getWallet(userId);
}

export async function getCreditLedger(userId: string): Promise<CreditLedgerEntry[]> {
  const api = await getJson<{ ledger?: CreditLedgerEntry[] }>("/api/billing/credits/ledger", userId);
  if (api.ok && Array.isArray(api.data?.ledger)) {
    return api.data.ledger;
  }
  return getLedger(userId);
}

export async function grantCredits(userId: string, credits: number, reason: string) {
  const wallet = getWallet(userId);
  const nextBalance = wallet.creditsBalance + credits;
  setWallet(userId, { ...wallet, creditsBalance: nextBalance });
  appendLedger(userId, {
    id: makeId("ledger"),
    userId,
    kind: reason === "purchase" ? "purchase" : "grant",
    credits,
    status: "done",
    relatedAction: reason,
    createdAt: nowIso()
  });
  return getWallet(userId);
}

export async function reserveCredits(userId: string, credits: number, relatedAction: string) {
  const api = await postJson<{
    entry?: { id?: string };
  }>("/api/billing/credits/reserve", {
    userId,
    credits,
    relatedAction
  }, userId);
  if (api.ok && api.data?.entry?.id) {
    return {
      id: api.data.entry.id,
      userId,
      kind: "reserve",
      credits: -Math.max(0, Math.round(credits)),
      status: "pending",
      relatedAction,
      createdAt: nowIso()
    } as CreditLedgerEntry;
  }
  if (api.error === "insufficient_credits") {
    throw new Error("insufficient_credits");
  }

  const wallet = getWallet(userId);
  if (wallet.creditsBalance < credits) {
    throw new Error("insufficient_credits");
  }
  const entry: CreditLedgerEntry = {
    id: makeId("reserve"),
    userId,
    kind: "reserve",
    credits: -credits,
    status: "pending",
    relatedAction,
    createdAt: nowIso()
  };
  setWallet(userId, { ...wallet, creditsBalance: wallet.creditsBalance - credits });
  appendLedger(userId, entry);
  return entry;
}

export async function finalizeReservedCredits(userId: string, entryId: string) {
  const api = await postJson("/api/billing/credits/finalize", { userId, entryId }, userId);
  if (api.ok) return;
  replaceLedgerEntry(userId, entryId, { kind: "finalize", status: "done" });
}

export async function rollbackReservedCredits(userId: string, entryId: string) {
  const api = await postJson("/api/billing/credits/rollback", { userId, entryId }, userId);
  if (api.ok) return;

  const ledger = getLedger(userId);
  const entry = ledger.find((item) => item.id === entryId);
  if (!entry || entry.status !== "pending") return;
  const wallet = getWallet(userId);
  setWallet(userId, { ...wallet, creditsBalance: wallet.creditsBalance + Math.abs(entry.credits) });
  replaceLedgerEntry(userId, entryId, { kind: "rollback", status: "rolled_back" });
}

async function getJson<T>(path: string, userId: string) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${path}${sep}userId=${encodeURIComponent(userId)}`;
  try {
    const headers = await getApiAuthHeaders(userId);
    const res = await fetch(url, {
      headers
    });
    const payload = await res.json().catch(() => null) as ({ error?: string } & T) | null;
    if (!res.ok) {
      return { ok: false, data: null as T | null, error: String(payload?.error || "").trim() };
    }
    return { ok: true, data: payload, error: "" };
  } catch {
    return { ok: false, data: null as T | null, error: "network_error" };
  }
}

async function postJson<T = Record<string, unknown>>(path: string, body: Record<string, unknown>, userId?: string) {
  try {
    const headers = await getApiAuthHeaders(userId);
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    });
    const payload = await res.json().catch(() => null) as ({ error?: string } & T) | null;
    if (!res.ok) {
      return { ok: false, data: null as T | null, error: String(payload?.error || "").trim() };
    }
    return { ok: true, data: payload, error: "" };
  } catch {
    return { ok: false, data: null as T | null, error: "network_error" };
  }
}
