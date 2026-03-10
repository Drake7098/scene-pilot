import type { CreditLedgerEntry, WalletState } from "../types/billing";
import { appendLedger, getLedger, getWallet, replaceLedgerEntry, setWallet } from "./mockAccountStore";

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
  return getWallet(userId);
}

export async function getCreditLedger(userId: string): Promise<CreditLedgerEntry[]> {
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
  replaceLedgerEntry(userId, entryId, { kind: "finalize", status: "done" });
}

export async function rollbackReservedCredits(userId: string, entryId: string) {
  const ledger = getLedger(userId);
  const entry = ledger.find((item) => item.id === entryId);
  if (!entry || entry.status !== "pending") return;
  const wallet = getWallet(userId);
  setWallet(userId, { ...wallet, creditsBalance: wallet.creditsBalance + Math.abs(entry.credits) });
  replaceLedgerEntry(userId, entryId, { kind: "rollback", status: "rolled_back" });
}
