import { ensureBillingTables, ensureUserWallet } from "./billing-db";
import { hasSupabaseAdmin, parseRpcRow, supabaseAdminRequest } from "./supabase-admin";

export type CreditLedgerItem = {
  id: string;
  userId: string;
  kind: "purchase" | "grant" | "reserve" | "finalize" | "rollback";
  credits: number;
  status: "pending" | "done" | "rolled_back";
  relatedAction?: string;
  createdAt: string;
};

type CreditMutationResult = {
  entryId: string;
  balanceAfter: number | null;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function ledgerStatusFromKind(kind: string): CreditLedgerItem["status"] {
  if (kind === "reserve") return "pending";
  if (kind === "rollback") return "rolled_back";
  return "done";
}

function rpcNames(base: string) {
  return [base, `sp_${base}`, `app.${base}`];
}

function normalizedSupabaseError(errorCode: string, errorMessage = "") {
  const merged = `${errorCode} ${errorMessage}`.toLowerCase();
  if (merged.includes("insufficient_credits")) return "insufficient_credits";
  if (merged.includes("wallet_not_found")) return "wallet_not_found";
  if (merged.includes("reserve_not_found")) return "reserve_not_found";
  if (merged.includes("invalid_credits")) return "invalid_credits";
  return errorCode || "supabase_request_failed";
}

async function callSupabaseRpc<T extends Record<string, unknown>>(
  env: any,
  fnBaseName: string,
  body: Record<string, unknown>
) {
  const candidates = rpcNames(fnBaseName);
  for (let index = 0; index < candidates.length; index += 1) {
    const name = candidates[index];
    const res = await supabaseAdminRequest<unknown>(env, `/rest/v1/rpc/${encodeURIComponent(name)}`, {
      method: "POST",
      body
    });
    if (res.ok) {
      return { ok: true as const, row: parseRpcRow<T>(res.data) };
    }
    const notFoundLike = res.status === 404 || res.errorCode === "pgrst202";
    if (notFoundLike && index < candidates.length - 1) {
      continue;
    }
    return {
      ok: false as const,
      errorCode: normalizedSupabaseError(res.errorCode, res.errorMessage),
      errorMessage: res.errorMessage
    };
  }
  return { ok: false as const, errorCode: "rpc_not_found", errorMessage: "No RPC bridge function was found." };
}

export async function loadWalletState(env: any, userId: string): Promise<{ creditsBalance: number; currency: "credits" | "usd" }> {
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<Array<{ credit_balance: number; currency: string }>>(
      env,
      `/rest/v1/wallets?user_id=eq.${encodeURIComponent(userId)}&select=credit_balance,currency&limit=1`
    );
    const row = Array.isArray(res.data) ? res.data[0] : null;
    if (!res.ok && res.errorCode !== "pgrst116") {
      throw new Error(normalizedSupabaseError(res.errorCode, res.errorMessage));
    }
    return {
      creditsBalance: Number(row?.credit_balance || 0),
      currency: row?.currency === "usd" ? "usd" : "credits"
    };
  }

  if (!env?.DB) {
    return { creditsBalance: 0, currency: "credits" };
  }
  await ensureBillingTables(env.DB);
  await ensureUserWallet(env.DB, userId);
  const wallet = await env.DB.prepare(`
    SELECT credit_balance
    FROM wallets
    WHERE user_id = ?
    LIMIT 1
  `).bind(userId).first<{ credit_balance: number }>();
  return { creditsBalance: Number(wallet?.credit_balance || 0), currency: "credits" };
}

export async function listCreditLedger(env: any, userId: string, limit = 80): Promise<CreditLedgerItem[]> {
  const safeLimit = Math.max(1, Math.min(300, Math.round(limit)));
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<Array<{
      id: string;
      entry_type: string;
      status: string;
      credits_delta: number;
      created_at: string;
      meta: Record<string, unknown> | null;
    }>>(
      env,
      `/rest/v1/credit_ledger?user_id=eq.${encodeURIComponent(userId)}&select=id,entry_type,status,credits_delta,created_at,meta&order=created_at.desc&limit=${safeLimit}`
    );
    if (!res.ok && res.errorCode !== "pgrst116") {
      throw new Error(normalizedSupabaseError(res.errorCode, res.errorMessage));
    }
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.map((row) => {
      const meta = normalizeMeta(row.meta);
      return {
        id: row.id,
        userId,
        kind: (row.entry_type === "purchase" || row.entry_type === "grant" || row.entry_type === "reserve" || row.entry_type === "finalize" || row.entry_type === "rollback"
          ? row.entry_type
          : "grant"),
        credits: Number(row.credits_delta || 0),
        status: row.status === "pending" ? "pending" : row.status === "rolled_back" ? "rolled_back" : "done",
        relatedAction: typeof meta.related_action === "string" ? meta.related_action : undefined,
        createdAt: row.created_at
      };
    });
  }

  if (!env?.DB) return [];
  await ensureBillingTables(env.DB);
  await ensureUserWallet(env.DB, userId);
  const { results } = await env.DB.prepare(`
    SELECT id, entry_type, credits_delta, meta, created_at
    FROM credit_ledger
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, safeLimit).all<{
    id: string;
    entry_type: string;
    credits_delta: number;
    meta: string | null;
    created_at: string;
  }>();
  return (results || []).map((row) => {
    let relatedAction: string | undefined;
    try {
      const parsed = row.meta ? JSON.parse(row.meta) as Record<string, unknown> : {};
      if (typeof parsed.related_action === "string") relatedAction = parsed.related_action;
    } catch {
      relatedAction = undefined;
    }
    const kind = (row.entry_type === "purchase" || row.entry_type === "grant" || row.entry_type === "reserve" || row.entry_type === "finalize" || row.entry_type === "rollback"
      ? row.entry_type
      : "grant");
    return {
      id: row.id,
      userId,
      kind,
      credits: Number(row.credits_delta || 0),
      status: ledgerStatusFromKind(kind),
      relatedAction,
      createdAt: row.created_at
    };
  });
}

export async function reserveCreditsForGeneration(
  env: any,
  userId: string,
  credits: number,
  relatedAction: string,
  idempotencyKey: string,
  meta: Record<string, unknown> = {}
): Promise<CreditMutationResult> {
  const safeCredits = Math.max(0, Math.round(credits));
  if (safeCredits <= 0) throw new Error("invalid_credits");

  if (hasSupabaseAdmin(env)) {
    const rpc = await callSupabaseRpc<{ entry_id: string; balance_after: number }>(env, "reserve_credits", {
      p_user_id: userId,
      p_credits: safeCredits,
      p_related_action: relatedAction,
      p_idempotency_key: idempotencyKey,
      p_meta: { ...meta, related_action: relatedAction }
    });
    if (!rpc.ok) throw new Error(rpc.errorCode);
    if (!rpc.row?.entry_id) throw new Error("reserve_failed");
    return {
      entryId: rpc.row.entry_id,
      balanceAfter: typeof rpc.row.balance_after === "number" ? rpc.row.balance_after : null
    };
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await ensureUserWallet(env.DB, userId);
  const wallet = await env.DB.prepare(`
    SELECT credit_balance, lifetime_credits_used
    FROM wallets
    WHERE user_id = ?
    LIMIT 1
  `).bind(userId).first<{ credit_balance: number; lifetime_credits_used: number }>();
  const balance = Number(wallet?.credit_balance || 0);
  if (balance < safeCredits) throw new Error("insufficient_credits");
  const nextBalance = balance - safeCredits;
  const entryId = makeId("reserve");
  await env.DB.prepare(`
    UPDATE wallets
    SET credit_balance = ?, lifetime_credits_used = ?, updated_at = ?
    WHERE user_id = ?
  `).bind(nextBalance, Number(wallet?.lifetime_credits_used || 0) + safeCredits, nowIso(), userId).run();
  await env.DB.prepare(`
    INSERT INTO credit_ledger (id, user_id, entry_type, credits_delta, balance_after, idempotency_key, meta, created_at)
    VALUES (?, ?, 'reserve', ?, ?, ?, ?, ?)
  `).bind(
    entryId,
    userId,
    -safeCredits,
    nextBalance,
    idempotencyKey,
    JSON.stringify({ ...meta, related_action: relatedAction }),
    nowIso()
  ).run();
  return { entryId, balanceAfter: nextBalance };
}

export async function finalizeReservedCredits(
  env: any,
  userId: string,
  reserveEntryId: string
) {
  if (hasSupabaseAdmin(env)) {
    const rpc = await callSupabaseRpc<{ finalize_reserved_credits?: boolean }>(env, "finalize_reserved_credits", {
      p_user_id: userId,
      p_reserve_entry_id: reserveEntryId
    });
    if (!rpc.ok) throw new Error(rpc.errorCode);
    return;
  }
  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await ensureUserWallet(env.DB, userId);
  await env.DB.prepare(`
    UPDATE credit_ledger
    SET entry_type = 'finalize'
    WHERE id = ? AND user_id = ? AND entry_type = 'reserve'
  `).bind(reserveEntryId, userId).run();
}

export async function rollbackReservedCredits(
  env: any,
  userId: string,
  reserveEntryId: string,
  idempotencyKey: string,
  relatedAction: string,
  meta: Record<string, unknown> = {}
) {
  if (hasSupabaseAdmin(env)) {
    const rpc = await callSupabaseRpc<{ entry_id: string; balance_after: number }>(env, "rollback_reserved_credits", {
      p_user_id: userId,
      p_reserve_entry_id: reserveEntryId,
      p_idempotency_key: idempotencyKey,
      p_meta: { ...meta, related_action: relatedAction }
    });
    if (!rpc.ok) throw new Error(rpc.errorCode);
    return {
      entryId: rpc.row?.entry_id || reserveEntryId,
      balanceAfter: typeof rpc.row?.balance_after === "number" ? rpc.row.balance_after : null
    };
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await ensureUserWallet(env.DB, userId);
  const reserve = await env.DB.prepare(`
    SELECT id, credits_delta, entry_type
    FROM credit_ledger
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(reserveEntryId, userId).first<{ id: string; credits_delta: number; entry_type: string }>();
  if (!reserve?.id || reserve.entry_type !== "reserve") return { entryId: reserveEntryId, balanceAfter: null };

  const refund = Math.abs(Number(reserve.credits_delta || 0));
  const wallet = await env.DB.prepare(`
    SELECT credit_balance, lifetime_credits_used
    FROM wallets
    WHERE user_id = ?
    LIMIT 1
  `).bind(userId).first<{ credit_balance: number; lifetime_credits_used: number }>();
  const nextBalance = Number(wallet?.credit_balance || 0) + refund;

  await env.DB.prepare(`
    UPDATE wallets
    SET credit_balance = ?, lifetime_credits_used = ?, updated_at = ?
    WHERE user_id = ?
  `).bind(
    nextBalance,
    Math.max(0, Number(wallet?.lifetime_credits_used || 0) - refund),
    nowIso(),
    userId
  ).run();
  await env.DB.prepare(`
    UPDATE credit_ledger
    SET entry_type = 'rollback'
    WHERE id = ? AND user_id = ?
  `).bind(reserveEntryId, userId).run();
  await env.DB.prepare(`
    UPDATE credit_ledger
    SET meta = ?
    WHERE id = ? AND user_id = ?
  `).bind(JSON.stringify({ ...meta, related_action: relatedAction }), reserveEntryId, userId).run();
  return { entryId: reserveEntryId, balanceAfter: nextBalance };
}

