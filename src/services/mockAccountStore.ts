import type { ApiCredentialState, AuthChallenge, AuthProvider, UserSession, UserState } from "../types/account";
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

function normalizeSession(raw: unknown): UserSession | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const token = String(value.token || "").trim();
  const userId = String(value.userId || "").trim();
  const email = String(value.email || "").trim();
  const createdAt = String(value.createdAt || "").trim();
  if (!token || !userId || !email || !createdAt) return null;
  return {
    token,
    userId,
    email,
    provider: value.provider === "google" ? "google" : value.provider === "password" ? "password" : "email_code",
    providerSubject: typeof value.providerSubject === "string" ? value.providerSubject : null,
    createdAt
  };
}

function normalizeUsers(raw: unknown): Record<string, UserState> {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const entries: Array<[string, UserState]> = [];
  for (const [id, value] of Object.entries(source)) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const email = String(row.email || "").trim().toLowerCase();
    const createdAt = String(row.createdAt || "").trim();
    const updatedAt = String(row.updatedAt || createdAt).trim();
    const creditsValue = Number(row.creditsBalance || 0);
    if (!id || !email || !createdAt || !updatedAt) continue;
    entries.push([
      id,
      {
        id,
        email,
        displayName: typeof row.displayName === "string" ? row.displayName : null,
        avatarUrl: typeof row.avatarUrl === "string" ? row.avatarUrl : null,
        tier: row.tier === "pro" || row.tier === "member" ? row.tier : "free",
        creditsBalance: Number.isFinite(creditsValue) ? creditsValue : 0,
        proConsoleEnabled: Boolean(row.proConsoleEnabled),
        bringYourOwnApiEnabled: Boolean(row.bringYourOwnApiEnabled),
        createdAt,
        updatedAt
      }
    ]);
  }
  return Object.fromEntries(entries);
}

function nowIso() {
  return new Date().toISOString();
}

function providerConfig(baseUrl = "", preferredModel = "") {
  return {
    enabled: false,
    mode: "personal" as const,
    apiKey: "",
    baseUrl,
    preferredModel,
    updatedAt: null,
  };
}

function defaultApiCredentials(): ApiCredentialState {
  return {
    defaultProvider: "fal",
    fal: providerConfig("https://queue.fal.run", "fal-ai/flux/dev"),
    replicate: providerConfig("https://api.replicate.com", "black-forest-labs/flux-1.1-pro"),
    runway: providerConfig("https://api.dev.runwayml.com", "gen4_turbo"),
    pika: providerConfig("https://api.pika.art", "pika-2.2"),
    luma: providerConfig("https://api.lumalabs.ai", "ray-2"),
    stability: providerConfig("https://api.stability.ai", "stable-image-ultra"),
    fal_control: providerConfig("https://queue.fal.run", "fal-ai/flux-controlnet"),
    replicate_control: providerConfig("https://api.replicate.com", "black-forest-labs/flux-depth-pro"),
    comfyui: providerConfig("http://127.0.0.1:8188", "wan2.2"),
    drawthings: providerConfig("http://127.0.0.1:7888", "drawthings-local"),
    custom_api: providerConfig("", ""),
    updatedAt: null
  };
}

function normalizeApiCredentials(raw: unknown): ApiCredentialState {
  const defaults = defaultApiCredentials();
  const parsed = raw && typeof raw === "object" ? raw as Record<string, any> : {};
  if (typeof parsed.openaiApiKey === "string") {
    return {
      ...defaults,
      fal: {
        ...defaults.fal,
        enabled: Boolean(parsed.enabled),
        apiKey: parsed.openaiApiKey,
        updatedAt: parsed.updatedAt ?? null
      },
      updatedAt: parsed.updatedAt ?? null
    };
  }
  return {
    defaultProvider: typeof parsed.defaultProvider === "string"
      && [
        "fal",
        "replicate",
        "runway",
        "pika",
        "luma",
        "stability",
        "fal_control",
        "replicate_control",
        "comfyui",
        "drawthings",
        "custom_api",
      ].includes(parsed.defaultProvider)
      ? parsed.defaultProvider as ApiCredentialState["defaultProvider"]
      : "fal",
    fal: {
      ...defaults.fal,
      ...(parsed.fal ?? {})
    },
    replicate: {
      ...defaults.replicate,
      ...(parsed.replicate ?? {})
    },
    runway: {
      ...defaults.runway,
      ...(parsed.runway ?? {})
    },
    pika: {
      ...defaults.pika,
      ...(parsed.pika ?? {})
    },
    luma: {
      ...defaults.luma,
      ...(parsed.luma ?? {})
    },
    stability: {
      ...defaults.stability,
      ...(parsed.stability ?? {})
    },
    fal_control: {
      ...defaults.fal_control,
      ...(parsed.fal_control ?? {})
    },
    replicate_control: {
      ...defaults.replicate_control,
      ...(parsed.replicate_control ?? {})
    },
    comfyui: {
      ...defaults.comfyui,
      ...(parsed.comfyui ?? {})
    },
    drawthings: {
      ...defaults.drawthings,
      ...(parsed.drawthings ?? {})
    },
    custom_api: {
      ...defaults.custom_api,
      ...(parsed.custom_api ?? {})
    },
    updatedAt: parsed.updatedAt ?? null
  };
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
      users: normalizeUsers(parsed.users),
      wallets: parsed.wallets ?? {},
      ledgers: parsed.ledgers ?? {},
      apiCredentials: parsed.apiCredentials ?? {},
      subscriptions: parsed.subscriptions ?? {},
      challenges: parsed.challenges ?? {},
      session: normalizeSession(parsed.session)
    };
  } catch {
    return createEmptyStore();
  }
}

function writeStore(store: MockStoreShape) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

type UserIdentityOptions = {
  displayName?: string | null;
  avatarUrl?: string | null;
};

export function createOrGetUserByEmail(email: string, options: UserIdentityOptions = {}): UserState {
  const normalized = email.trim().toLowerCase();
  const store = readStore();
  const existing = Object.values(store.users).find((item) => item.email === normalized);
  if (existing) {
    const nextDisplayName = typeof options.displayName === "string" ? options.displayName.trim() : existing.displayName;
    const nextAvatarUrl = typeof options.avatarUrl === "string" ? options.avatarUrl.trim() : existing.avatarUrl;
    if (nextDisplayName !== existing.displayName || nextAvatarUrl !== existing.avatarUrl) {
      const updated: UserState = {
        ...existing,
        displayName: nextDisplayName || null,
        avatarUrl: nextAvatarUrl || null,
        updatedAt: nowIso()
      };
      store.users[existing.id] = updated;
      writeStore(store);
      return updated;
    }
    return existing;
  }
  const createdAt = nowIso();
  const user: UserState = {
    id: makeId("user"),
    email: normalized,
    displayName: (options.displayName || "").trim() || null,
    avatarUrl: (options.avatarUrl || "").trim() || null,
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
  store.apiCredentials[user.id] = defaultApiCredentials();
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
  return normalizeApiCredentials(readStore().apiCredentials[userId]);
}

export function setApiCredentials(userId: string, state: ApiCredentialState) {
  const store = readStore();
  store.apiCredentials[userId] = normalizeApiCredentials(state);
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

type CreateSessionOptions = {
  provider?: AuthProvider;
  providerSubject?: string | null;
};

export function createSessionForUser(user: UserState, options: CreateSessionOptions = {}): UserSession {
  return {
    token: makeId("session"),
    userId: user.id,
    email: user.email,
    provider: options.provider || "email_code",
    providerSubject: options.providerSubject || null,
    createdAt: nowIso()
  };
}
