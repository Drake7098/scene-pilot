type DbLike = D1Database | undefined;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export async function ensureBillingTables(db: DbLike) {
  if (!db) return;
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users_profile (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        tier TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        credit_balance INTEGER NOT NULL DEFAULT 0,
        lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0,
        lifetime_credits_used INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        code TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'paddle',
        provider_price_id TEXT,
        credits_amount INTEGER,
        monthly_credit_grant INTEGER,
        price_amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        active INTEGER NOT NULL DEFAULT 1
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'paddle',
        provider_subscription_id TEXT UNIQUE,
        plan_code TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_start TEXT,
        current_period_end TEXT,
        cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
        monthly_credit_grant INTEGER NOT NULL DEFAULT 0,
        last_credit_granted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_transaction_id TEXT UNIQUE,
        payment_type TEXT NOT NULL,
        product_code TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        raw_payload TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS payment_events (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_event_id TEXT UNIQUE,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        payload TEXT NOT NULL,
        error_message TEXT,
        received_at TEXT NOT NULL,
        processed_at TEXT
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS checkout_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        product_code TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'paddle',
        status TEXT NOT NULL DEFAULT 'created',
        payload TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS credit_ledger (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        credits_delta INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        related_generation_id TEXT,
        related_payment_id TEXT,
        idempotency_key TEXT UNIQUE,
        meta TEXT,
        created_at TEXT NOT NULL
      );
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS legal_consents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        consent_context TEXT NOT NULL,
        docs_json TEXT NOT NULL,
        versions_json TEXT NOT NULL,
        locale TEXT NOT NULL,
        source TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        ip_hash TEXT,
        ua_hash TEXT,
        created_at TEXT NOT NULL
      );
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created ON credit_ledger(user_id, created_at DESC);`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, updated_at DESC);`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id, created_at DESC);`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_legal_consents_user_created ON legal_consents(user_id, created_at DESC);`)
  ]);
}

export async function seedDefaultProducts(db: DbLike) {
  if (!db) return;
  const defaults = [
    { code: "pack_150", kind: "credit_pack", name: "150 Credits", credits: 150, monthly: null, amount: 3, priceId: envOr("PADDLE_PRICE_PACK_150") },
    { code: "pack_420", kind: "credit_pack", name: "420 Credits", credits: 420, monthly: null, amount: 8, priceId: envOr("PADDLE_PRICE_PACK_420") },
    { code: "pack_800", kind: "credit_pack", name: "800 Credits", credits: 800, monthly: null, amount: 15, priceId: envOr("PADDLE_PRICE_PACK_800") },
    { code: "pro_monthly", kind: "subscription", name: "Pro Monthly", credits: null, monthly: 700, amount: 12, priceId: envOr("PADDLE_PRICE_PRO_MONTHLY") }
  ];

  for (const item of defaults) {
    await db.prepare(`
      INSERT INTO products (code, kind, name, provider, provider_price_id, credits_amount, monthly_credit_grant, price_amount, currency, active)
      VALUES (?, ?, ?, 'paddle', ?, ?, ?, ?, 'USD', 1)
      ON CONFLICT(code) DO UPDATE SET
        kind = excluded.kind,
        name = excluded.name,
        provider_price_id = excluded.provider_price_id,
        credits_amount = excluded.credits_amount,
        monthly_credit_grant = excluded.monthly_credit_grant,
        price_amount = excluded.price_amount,
        active = 1;
    `)
      .bind(item.code, item.kind, item.name, item.priceId, item.credits, item.monthly, item.amount)
      .run();
  }
}

export async function ensureUserWallet(db: DbLike, userId: string, email = "") {
  if (!db) return;
  const ts = nowIso();
  await db.prepare(`
    INSERT INTO users_profile (id, email, tier, status, created_at, updated_at)
    VALUES (?, ?, 'free', 'active', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = CASE WHEN excluded.email <> '' THEN excluded.email ELSE users_profile.email END,
      updated_at = excluded.updated_at;
  `).bind(userId, email, ts, ts).run();

  await db.prepare(`
    INSERT INTO wallets (user_id, credit_balance, lifetime_credits_purchased, lifetime_credits_used, updated_at)
    VALUES (?, 0, 0, 0, ?)
    ON CONFLICT(user_id) DO NOTHING;
  `).bind(userId, ts).run();
}

export async function grantCredits(
  db: DbLike,
  userId: string,
  credits: number,
  entryType: "purchase" | "subscription_grant" | "admin_grant",
  idempotencyKey: string,
  meta: Record<string, unknown>
) {
  if (!db || credits <= 0) return;
  const existing = await db.prepare(`
    SELECT id FROM credit_ledger WHERE idempotency_key = ? LIMIT 1
  `).bind(idempotencyKey).first<{ id: string }>();
  if (existing?.id) return;

  const wallet = await db.prepare(`SELECT credit_balance, lifetime_credits_purchased FROM wallets WHERE user_id = ?`)
    .bind(userId)
    .first<{ credit_balance: number; lifetime_credits_purchased: number }>();
  if (!wallet) return;
  const nextBalance = wallet.credit_balance + credits;
  await db.prepare(`UPDATE wallets SET credit_balance = ?, lifetime_credits_purchased = ?, updated_at = ? WHERE user_id = ?`)
    .bind(nextBalance, wallet.lifetime_credits_purchased + credits, nowIso(), userId)
    .run();
  await db.prepare(`
    INSERT INTO credit_ledger (id, user_id, entry_type, credits_delta, balance_after, idempotency_key, meta, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(makeId("ledger"), userId, entryType, credits, nextBalance, idempotencyKey, JSON.stringify(meta), nowIso()).run();
}

export async function activatePro(
  db: DbLike,
  userId: string,
  providerSubscriptionId: string,
  planCode = "pro_monthly",
  monthlyCreditGrant = 500
) {
  if (!db) return;
  const ts = nowIso();
  await db.prepare(`UPDATE users_profile SET tier = 'pro', updated_at = ? WHERE id = ?`).bind(ts, userId).run();
  await db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, provider, provider_subscription_id, plan_code, status,
      current_period_start, current_period_end, cancel_at_period_end,
      monthly_credit_grant, last_credit_granted_at, created_at, updated_at
    )
    VALUES (?, ?, 'paddle', ?, ?, 'active', ?, ?, 0, ?, NULL, ?, ?)
    ON CONFLICT(provider_subscription_id) DO UPDATE SET
      status = 'active',
      plan_code = excluded.plan_code,
      monthly_credit_grant = excluded.monthly_credit_grant,
      updated_at = excluded.updated_at;
  `)
    .bind(
      makeId("sub"),
      userId,
      providerSubscriptionId,
      planCode,
      ts,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyCreditGrant,
      ts,
      ts
    )
    .run();
}

function envOr(name: string) {
  try {
    return ((globalThis as any)?.process?.env?.[name] as string | undefined) || "";
  } catch {
    return "";
  }
}
