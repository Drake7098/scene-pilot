import type { ApiCredentialState, AuthChallenge, UserSession, UserState } from "../types/account";
import type { CreditLedgerEntry, SubscriptionState, WalletState } from "../types/billing";

const STORE_KEY = "scenepilot_mock_account_store_v1";

type MockStoreShape = {
  users: Record<string, UserState>;
  wallets: Record<string, WalletState>;
  ledgers: Record<string, CreditLedgerEntry[]>;
  apiCredentials: Record<string, ApiCredentialState>;
  subscriptions: Record<string, SubscriptionState>;
  challenges: Record<string, AuthChallenge>;
  session: UserSession | null;
};

function createEmptyStore(): MockStoreShape {
  return {
    users: {},
    wallets: {},
    ledgers: {},
    apiCredentials: {},
    subscriptions: {},
    challenges: {},
    session: null
  };
}

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

function readStore(): MockStoreShape {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as Partial<MockStoreShape>;
    return {
      ...createEmptyStore(),
      ...parsed,
      users: parsed.users ?? {},
      wallets: parsed.wallets ?? {},
      ledgers: parsed.ledgers ?? {},
      apiCredentials: parsed.apiCredentials ?? {},
      subscriptions: parsed.subscriptions ?? {},
      challenges: parsed.challenges ?? {},
      session: parsed.session ?? null
    };
  } catch {
    return createEmptyStore();
  }
}

function writeStore(store: MockStoreShape) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function createOrGetUserByEmail(email: string): UserState {
  const normalized = email.trim().toLowerCase();
  const store = readStore();
  const existing = Object.values(store.users).find((item) => item.email === normalized);
  if (existing) return existing;
  const createdAt = nowIso();
  const user: UserState = {
    id: makeId("user"),
    email: normalized,
    tier: "free",
    creditsBalance: 0,
    proConsoleEnabled: false,
    bringYourOwnApiEnabled: false,
    createdAt,
    updatedAt: createdAt
  };
  store.users[user.id] = user;
  store.wallets[user.id] = { creditsBalance: 0, currency: "credits" };
  store.ledgers[user.id] = [];
  store.apiCredentials[user.id] = { openaiApiKey: "", enabled: false, updatedAt: null };
  store.subscriptions[user.id] = {
    userId: user.id,
    planId: "",
    status: "inactive",
    currentPeriodStart: null,
    currentPeriodEnd: null,
    lastCreditGrantAt: null,
    provider: "mock",
    customerPortalUrl: null
  };
  writeStore(store);
  return user;
}

export function saveChallenge(email: string, code: string, expiresAt: string) {
  const store = readStore();
  store.challenges[email.trim().toLowerCase()] = {
    email: email.trim().toLowerCase(),
    code,
    expiresAt,
    createdAt: nowIso()
  };
  writeStore(store);
}

export function getChallenge(email: string): AuthChallenge | null {
  const store = readStore();
  return store.challenges[email.trim().toLowerCase()] ?? null;
}

export function clearChallenge(email: string) {
  const store = readStore();
  delete store.challenges[email.trim().toLowerCase()];
  writeStore(store);
}

export function saveSession(session: UserSession | null) {
  const store = readStore();
  store.session = session;
  writeStore(store);
}

export function getSession(): UserSession | null {
  return readStore().session;
}

export function getUser(userId: string): UserState | null {
  return readStore().users[userId] ?? null;
}

export function updateUser(userId: string, patch: Partial<UserState>): UserState | null {
  const store = readStore();
  const current = store.users[userId];
  if (!current) return null;
  const next: UserState = {
    ...current,
    ...patch,
    updatedAt: nowIso()
  };
  store.users[userId] = next;
  if (typeof patch.creditsBalance === "number") {
    store.wallets[userId] = {
      ...(store.wallets[userId] ?? { creditsBalance: 0, currency: "credits" }),
      creditsBalance: patch.creditsBalance
    };
  }
  writeStore(store);
  return next;
}

export function getWallet(userId: string): WalletState {
  return readStore().wallets[userId] ?? { creditsBalance: 0, currency: "credits" };
}

export function setWallet(userId: string, wallet: WalletState) {
  const store = readStore();
  store.wallets[userId] = wallet;
  if (store.users[userId]) {
    store.users[userId] = {
      ...store.users[userId],
      creditsBalance: wallet.creditsBalance,
      updatedAt: nowIso()
    };
  }
  writeStore(store);
}

export function appendLedger(userId: string, entry: CreditLedgerEntry) {
  const store = readStore();
  const current = store.ledgers[userId] ?? [];
  store.ledgers[userId] = [entry, ...current];
  writeStore(store);
}

export function replaceLedgerEntry(userId: string, entryId: string, patch: Partial<CreditLedgerEntry>) {
  const store = readStore();
  const current = store.ledgers[userId] ?? [];
  store.ledgers[userId] = current.map((item) => item.id === entryId ? { ...item, ...patch } : item);
  writeStore(store);
}

export function getLedger(userId: string): CreditLedgerEntry[] {
  return readStore().ledgers[userId] ?? [];
}

export function getApiCredentials(userId: string): ApiCredentialState {
  return readStore().apiCredentials[userId] ?? { openaiApiKey: "", enabled: false, updatedAt: null };
}

export function setApiCredentials(userId: string, state: ApiCredentialState) {
  const store = readStore();
  store.apiCredentials[userId] = state;
  writeStore(store);
}

export function getSubscription(userId: string): SubscriptionState {
  return readStore().subscriptions[userId] ?? {
    userId,
    planId: "",
    status: "inactive",
    currentPeriodStart: null,
    currentPeriodEnd: null,
    lastCreditGrantAt: null,
    provider: "mock",
    customerPortalUrl: null
  };
}

export function setSubscription(userId: string, subscription: SubscriptionState) {
  const store = readStore();
  store.subscriptions[userId] = subscription;
  writeStore(store);
}

export function createSessionForUser(user: UserState): UserSession {
  return {
    token: makeId("session"),
    userId: user.id,
    email: user.email,
    createdAt: nowIso()
  };
}
