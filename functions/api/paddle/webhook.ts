import { activatePro, ensureBillingTables, ensureUserWallet, grantCredits, seedDefaultProducts } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { verifyPaddleWebhookSignature } from "../_shared/paddle-signature";
import { hasSupabaseAdmin, parseRpcRow, supabaseAdminRequest } from "../_shared/supabase-admin";
import { isBillingEnabled, isLiveBillingBlocked } from "../_shared/billing-feature";

type PaddleWebhookBody = {
  event_id?: string;
  event_type?: string;
  data?: Record<string, any>;
};

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function pickUserId(payload: PaddleWebhookBody): string {
  return String(
    payload.data?.custom_data?.userId ||
    payload.data?.custom_data?.user_id ||
    payload.data?.metadata?.userId ||
    payload.data?.passthrough?.userId ||
    ""
  );
}

function pickProductCode(payload: PaddleWebhookBody): string {
  return String(
    payload.data?.custom_data?.productId ||
    payload.data?.custom_data?.product_id ||
    payload.data?.metadata?.productId ||
    ""
  );
}

function pickProviderTransactionId(payload: PaddleWebhookBody): string {
  return String(payload.data?.id || payload.data?.transaction_id || "");
}

function pickProviderSubscriptionId(payload: PaddleWebhookBody): string {
  return String(payload.data?.id || payload.data?.subscription_id || "");
}

function numericAmountFromPayload(payload: PaddleWebhookBody) {
  const totalRaw = payload.data?.details?.totals?.grand_total ?? payload.data?.totals?.total ?? 0;
  const total = Number(totalRaw);
  if (!Number.isFinite(total)) return 0;
  return total / 100;
}

function paymentCurrency(payload: PaddleWebhookBody) {
  return String(payload.data?.currency_code || payload.data?.currency || "USD");
}

function rpcCandidates(base: string) {
  return [`sp_${base}`, base, `app.${base}`];
}

async function callSupabaseCreditsRpc<T extends Record<string, unknown>>(
  env: any,
  baseName: string,
  body: Record<string, unknown>
) {
  const candidates = rpcCandidates(baseName);
  for (let index = 0; index < candidates.length; index += 1) {
    const fnName = candidates[index];
    const res = await supabaseAdminRequest<unknown>(env, `/rest/v1/rpc/${encodeURIComponent(fnName)}`, {
      method: "POST",
      body
    });
    if (res.ok) {
      return { ok: true as const, row: parseRpcRow<T>(res.data) };
    }
    const notFoundLike = res.status === 404 || res.errorCode === "pgrst202";
    if (notFoundLike && index < candidates.length - 1) continue;
    return { ok: false as const, errorCode: res.errorCode || "supabase_rpc_failed" };
  }
  return { ok: false as const, errorCode: "supabase_rpc_not_found" };
}

async function upsertPaymentSupabase(
  env: any,
  payload: PaddleWebhookBody,
  userId: string,
  productCode: string
) {
  const transactionId = pickProviderTransactionId(payload) || `tx_${makeId("paddle")}`;
  const amount = numericAmountFromPayload(payload);
  const currency = paymentCurrency(payload);
  const paymentType = productCode === "pro_monthly" ? "subscription_initial" : "credit_pack";
  const res = await supabaseAdminRequest(env, "/rest/v1/payments?on_conflict=provider_transaction_id", {
    method: "POST",
    headers: {
      prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: {
      user_id: userId,
      provider: "paddle",
      provider_transaction_id: transactionId,
      payment_type: paymentType,
      product_code: productCode,
      amount,
      currency,
      status: "paid",
      raw_payload: payload
    }
  });
  if (!res.ok) throw new Error(res.errorCode || "upsert_payment_failed");
}

async function processTransactionCompletedSupabase(env: any, body: PaddleWebhookBody) {
  const userId = pickUserId(body);
  const productCode = pickProductCode(body);
  if (!userId || !productCode) {
    return { action: "ignored", reason: "missing_user_or_product" };
  }
  if (!isUuidLike(userId)) {
    return { action: "ignored", reason: "invalid_user_id" };
  }

  const productRes = await supabaseAdminRequest<Array<{
    code: string;
    kind: "credit_pack" | "subscription";
    credits_amount: number | null;
    monthly_credit_grant: number | null;
  }>>(
    env,
    `/rest/v1/products?code=eq.${encodeURIComponent(productCode)}&select=code,kind,credits_amount,monthly_credit_grant&limit=1`
  );
  const product = Array.isArray(productRes.data) ? productRes.data[0] : null;
  if (!product) return { action: "ignored", reason: "product_not_found" };

  await upsertPaymentSupabase(env, body, userId, productCode);
  if (product.kind === "credit_pack") {
    const credits = Math.max(0, Math.round(Number(product.credits_amount || 0)));
    if (credits > 0) {
      const grant = await callSupabaseCreditsRpc(env, "grant_credits", {
        p_user_id: userId,
        p_credits: credits,
        p_entry_type: "purchase",
        p_idempotency_key: `purchase:${pickProviderTransactionId(body)}`,
        p_meta: { provider: "paddle", productCode }
      });
      if (!grant.ok) throw new Error(grant.errorCode);
    }
    return { action: "grant_credits", userId, productCode, credits };
  }
  return { action: "ignored", reason: "not_credit_pack" };
}

async function processSubscriptionLifecycleSupabase(env: any, body: PaddleWebhookBody) {
  const userId = pickUserId(body);
  if (!userId) return { action: "ignored", reason: "missing_user_id" };
  if (!isUuidLike(userId)) return { action: "ignored", reason: "invalid_user_id" };

  const subscriptionId = pickProviderSubscriptionId(body) || `sub_${userId}`;
  const status = String(body.data?.status || "active");
  const eventType = String(body.event_type || "");
  const periodStart = String(body.data?.current_billing_period?.starts_at || nowIso());
  const periodEnd = String(body.data?.current_billing_period?.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
  if (!["subscription.created", "subscription.activated", "subscription.updated"].includes(eventType)) {
    return { action: "ignored", reason: "unsupported_subscription_event" };
  }
  if (!["active", "trialing", "past_due", "paused", "canceled"].includes(status)) {
    return { action: "ignored", reason: "unsupported_subscription_status" };
  }

  const proRes = await supabaseAdminRequest<Array<{ monthly_credit_grant: number | null }>>(
    env,
    "/rest/v1/products?code=eq.pro_monthly&select=monthly_credit_grant&limit=1"
  );
  const monthlyGrant = Math.max(0, Math.round(Number((Array.isArray(proRes.data) ? proRes.data[0]?.monthly_credit_grant : 500) || 500)));
  const targetTier = status === "canceled" || status === "paused" ? "free" : "pro";

  const profileRes = await supabaseAdminRequest(
    env,
    `/rest/v1/users_profile?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: { tier: targetTier }
    }
  );
  if (!profileRes.ok) throw new Error(profileRes.errorCode || "profile_update_failed");

  const subRes = await supabaseAdminRequest(
    env,
    "/rest/v1/subscriptions?on_conflict=provider_subscription_id",
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: {
        user_id: userId,
        provider: "paddle",
        provider_subscription_id: subscriptionId,
        plan_code: "pro_monthly",
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: status === "canceled",
        monthly_credit_grant: monthlyGrant
      }
    }
  );
  if (!subRes.ok) throw new Error(subRes.errorCode || "subscription_upsert_failed");

  if (eventType === "subscription.activated" && monthlyGrant > 0) {
    const grant = await callSupabaseCreditsRpc(env, "grant_credits", {
      p_user_id: userId,
      p_credits: monthlyGrant,
      p_entry_type: "subscription_grant",
      p_idempotency_key: `sub_grant:${subscriptionId}:${periodStart}`,
      p_meta: { provider: "paddle", subscriptionId, periodStart, periodEnd }
    });
    if (!grant.ok) throw new Error(grant.errorCode);
  }

  return { action: "sync_subscription", userId, status, subscriptionId };
}

async function fetchSupabaseEvent(env: any, eventId: string) {
  const res = await supabaseAdminRequest<Array<{ id: string; status: string }>>(
    env,
    `/rest/v1/payment_events?provider_event_id=eq.${encodeURIComponent(eventId)}&select=id,status&limit=1`
  );
  if (!res.ok) throw new Error(res.errorCode || "payment_event_query_failed");
  return Array.isArray(res.data) ? (res.data[0] || null) : null;
}

async function insertSupabaseEvent(env: any, body: PaddleWebhookBody, eventId: string) {
  const res = await supabaseAdminRequest(env, "/rest/v1/payment_events", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: {
      provider: "paddle",
      provider_event_id: eventId,
      event_type: body.event_type || "",
      status: "received",
      payload: body,
      received_at: nowIso()
    }
  });
  if (!res.ok) throw new Error(res.errorCode || "payment_event_insert_failed");
}

async function patchSupabaseEvent(
  env: any,
  eventId: string,
  patch: Record<string, unknown>
) {
  const res = await supabaseAdminRequest(
    env,
    `/rest/v1/payment_events?provider_event_id=eq.${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: patch
    }
  );
  if (!res.ok) throw new Error(res.errorCode || "payment_event_patch_failed");
}

async function upsertPaymentD1(
  db: D1Database,
  payload: PaddleWebhookBody,
  userId: string,
  productCode: string
) {
  const transactionId = pickProviderTransactionId(payload);
  const amount = numericAmountFromPayload(payload);
  const currency = paymentCurrency(payload);
  const paymentType = productCode === "pro_monthly" ? "subscription_initial" : "credit_pack";
  const ts = nowIso();
  await db.prepare(`
    INSERT INTO payments (
      id, user_id, provider, provider_transaction_id, payment_type, product_code, amount, currency, status, raw_payload, created_at, updated_at
    )
    VALUES (?, ?, 'paddle', ?, ?, ?, ?, ?, 'paid', ?, ?, ?)
    ON CONFLICT(provider_transaction_id) DO UPDATE SET
      status = 'paid',
      raw_payload = excluded.raw_payload,
      updated_at = excluded.updated_at
  `)
    .bind(
      makeId("payment"),
      userId,
      transactionId,
      paymentType,
      productCode,
      Number.isFinite(amount) ? amount : 0,
      currency,
      JSON.stringify(payload),
      ts,
      ts
    )
    .run();
}

async function processTransactionCompletedD1(context: EventContext<any, any, any>, body: PaddleWebhookBody) {
  if (!context.env?.DB) return { action: "noop", reason: "db_not_configured" };
  const userId = pickUserId(body);
  const productCode = pickProductCode(body);
  if (!userId || !productCode) {
    return { action: "ignored", reason: "missing_user_or_product" };
  }
  await ensureUserWallet(context.env.DB, userId, "");
  const product = await context.env.DB.prepare(`
    SELECT code, kind, credits_amount, monthly_credit_grant
    FROM products
    WHERE code = ?
    LIMIT 1
  `).bind(productCode).first<{ code: string; kind: string; credits_amount: number | null; monthly_credit_grant: number | null }>();
  if (!product) {
    return { action: "ignored", reason: "product_not_found" };
  }

  await upsertPaymentD1(context.env.DB, body, userId, productCode);
  if (product.kind === "credit_pack") {
    await grantCredits(
      context.env.DB,
      userId,
      product.credits_amount || 0,
      "purchase",
      `purchase:${pickProviderTransactionId(body)}`,
      { provider: "paddle", productCode }
    );
    return { action: "grant_credits", userId, productCode, credits: product.credits_amount || 0 };
  }
  return { action: "ignored", reason: "not_credit_pack" };
}

async function processSubscriptionLifecycleD1(context: EventContext<any, any, any>, body: PaddleWebhookBody) {
  if (!context.env?.DB) return { action: "noop", reason: "db_not_configured" };
  const userId = pickUserId(body);
  if (!userId) return { action: "ignored", reason: "missing_user_id" };
  await ensureUserWallet(context.env.DB, userId, "");

  const subscriptionId = pickProviderSubscriptionId(body) || `sub_${userId}`;
  const status = String(body.data?.status || "active");
  const eventType = String(body.event_type || "");
  const periodStart = body.data?.current_billing_period?.starts_at || nowIso();
  const periodEnd = body.data?.current_billing_period?.ends_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (["subscription.created", "subscription.activated", "subscription.updated"].includes(eventType) && ["active", "trialing", "past_due", "paused", "canceled"].includes(status)) {
    const proProduct = await context.env.DB.prepare(`
      SELECT monthly_credit_grant FROM products WHERE code = 'pro_monthly' LIMIT 1
    `).first<{ monthly_credit_grant: number | null }>();
    const monthlyGrant = proProduct?.monthly_credit_grant || 500;
    await activatePro(context.env.DB, userId, subscriptionId, "pro_monthly", monthlyGrant);
    await context.env.DB.prepare(`
      UPDATE subscriptions
      SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = ?
      WHERE provider_subscription_id = ?
    `).bind(status, periodStart, periodEnd, nowIso(), subscriptionId).run();

    if (eventType === "subscription.activated") {
      await grantCredits(
        context.env.DB,
        userId,
        monthlyGrant,
        "subscription_grant",
        `sub_grant:${subscriptionId}:${periodStart}`,
        { provider: "paddle", subscriptionId, periodStart, periodEnd }
      );
    }
    if (status === "canceled" || status === "paused") {
      await context.env.DB.prepare(`UPDATE users_profile SET tier = 'free', updated_at = ? WHERE id = ?`)
        .bind(nowIso(), userId)
        .run();
    }
    return { action: "sync_subscription", userId, status, subscriptionId };
  }
  return { action: "ignored", reason: "unsupported_subscription_event" };
}

async function processWebhookWithSupabase(context: EventContext<any, any, any>, body: PaddleWebhookBody, eventId: string) {
  const existing = await fetchSupabaseEvent(context.env, eventId);
  if (existing?.id) {
    return { dedup: true, status: existing.status, result: null as Record<string, unknown> | null };
  }
  await insertSupabaseEvent(context.env, body, eventId);

  try {
    let result: Record<string, unknown>;
    if (body.event_type === "transaction.completed") {
      result = await processTransactionCompletedSupabase(context.env, body);
    } else if (body.event_type === "subscription.created" || body.event_type === "subscription.activated" || body.event_type === "subscription.updated") {
      result = await processSubscriptionLifecycleSupabase(context.env, body);
    } else {
      result = { action: "ignored", eventType: body.event_type };
    }
    await patchSupabaseEvent(context.env, eventId, {
      status: "processed",
      processed_at: nowIso(),
      error_message: null
    });
    return { dedup: false, status: "processed", result };
  } catch (error) {
    await patchSupabaseEvent(context.env, eventId, {
      status: "failed",
      processed_at: nowIso(),
      error_message: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!isBillingEnabled(context.env)) {
      return json({ error: "billing_disabled" }, 503, context.request, context.env);
    }
    if (isLiveBillingBlocked(context.env)) {
      return json({ error: "billing_live_blocked" }, 503, context.request, context.env);
    }
    const webhookSecret = String(context.env?.PADDLE_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) return json({ error: "webhook_secret_not_configured" }, 500, context.request, context.env);

    const rawBody = await context.request.text();
    const signatureValid = await verifyPaddleWebhookSignature(context.request, rawBody, webhookSecret);
    if (!signatureValid) return json({ error: "invalid_webhook_signature" }, 401, context.request, context.env);

    const body = JSON.parse(rawBody || "{}") as PaddleWebhookBody;
    if (!body?.event_type) return json({ error: "missing_event_type" }, 400, context.request, context.env);
    const eventId = String(body.event_id || body.data?.id || `${body.event_type}:${Date.now()}`);

    if (hasSupabaseAdmin(context.env)) {
      const processed = await processWebhookWithSupabase(context, body, eventId);
      if (processed.dedup) {
        return json({ ok: true, dedup: true, eventId, status: processed.status }, 200, context.request, context.env);
      }
      return json({ ok: true, eventId, result: processed.result }, 200, context.request, context.env);
    }

    if (!context.env?.DB) return json({ error: "db_not_configured" }, 500, context.request, context.env);
    await ensureBillingTables(context.env.DB);
    await seedDefaultProducts(context.env.DB);

    const existing = await context.env.DB.prepare(`
      SELECT id, status FROM payment_events WHERE provider_event_id = ? LIMIT 1
    `).bind(eventId).first<{ id: string; status: string }>();
    if (existing?.id) return json({ ok: true, dedup: true, eventId, status: existing.status }, 200, context.request, context.env);

    const storeId = makeId("evt");
    await context.env.DB.prepare(`
      INSERT INTO payment_events (id, provider, provider_event_id, event_type, status, payload, received_at)
      VALUES (?, 'paddle', ?, ?, 'received', ?, ?)
    `).bind(storeId, eventId, body.event_type, JSON.stringify(body), nowIso()).run();

    let result: Record<string, unknown>;
    if (body.event_type === "transaction.completed") {
      result = await processTransactionCompletedD1(context, body);
    } else if (body.event_type === "subscription.created" || body.event_type === "subscription.activated" || body.event_type === "subscription.updated") {
      result = await processSubscriptionLifecycleD1(context, body);
    } else {
      result = { action: "ignored", eventType: body.event_type };
    }

    await context.env.DB.prepare(`
      UPDATE payment_events SET status = 'processed', processed_at = ?, error_message = NULL WHERE id = ?
    `).bind(nowIso(), storeId).run();
    return json({ ok: true, eventId, result }, 200, context.request, context.env);
  } catch (error) {
    return json({ error: "webhook_error", message: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
