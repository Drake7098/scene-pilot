/**
 * Billing storage - local transactions and account extension.
 * Backend will replace; structure is API-ready.
 */

import type { BillingAccount, BillingTransaction } from "./types";

const TX_KEY = "scenepilot_billing_transactions_v1";
const ACCOUNT_KEY = "scenepilot_billing_account_v1";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const g = globalThis as typeof globalThis & { crypto?: Crypto };
  const part =
    typeof g.crypto?.randomUUID === "function"
      ? g.crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${part}`;
}

export function loadTransactions(): BillingTransaction[] {
  try {
    const raw = localStorage.getItem(TX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTransactions(txs: BillingTransaction[]) {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(txs));
  } catch {
    /* ignore */
  }
}

export function appendTransaction(tx: Omit<BillingTransaction, "id" | "createdAt">) {
  const full: BillingTransaction = {
    ...tx,
    id: makeId("tx"),
    createdAt: nowIso(),
  };
  const list = loadTransactions();
  list.push(full);
  saveTransactions(list);
  return full;
}

export function loadBillingAccount(userId: string): BillingAccount | null {
  try {
    const raw = localStorage.getItem(`${ACCOUNT_KEY}_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      creditsBalance: Number(parsed.creditsBalance ?? 0),
      totalCreditsPurchased: Number(parsed.totalCreditsPurchased ?? 0),
      totalCreditsSpent: Number(parsed.totalCreditsSpent ?? 0),
      totalTemplateCreditsSpent: Number(parsed.totalTemplateCreditsSpent ?? 0),
      totalGenerationCreditsSpent: Number(parsed.totalGenerationCreditsSpent ?? 0),
      lastTransactionAt: typeof parsed.lastTransactionAt === "string" ? parsed.lastTransactionAt : null,
    };
  } catch {
    return null;
  }
}

export function saveBillingAccount(userId: string, account: BillingAccount) {
  try {
    localStorage.setItem(`${ACCOUNT_KEY}_${userId}`, JSON.stringify(account));
  } catch {
    /* ignore */
  }
}
