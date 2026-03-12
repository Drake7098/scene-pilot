import { activatePro, ensureBillingTables, ensureUserWallet, grantCredits, seedDefaultProducts } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { verifyPaddleWebhookSignature } from "../_shared/paddle-signature";

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

async function upsertPayment(
  db: D1Database,
  payload: PaddleWebhookBody,
  userId: string,
  productCode: string
) {
  const transactionId = pickProviderTransactionId(payload);
  const amount = Number(payload.data?.details?.totals?.grand_total || payload.data?.totals?.total || 0) / 100;
  const currency = String(payload.data?.currency_code || payload.data?.currency || "USD");
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

async function processTransactionCompleted(context: EventContext<any, any, any>, body: PaddleWebhookBody) {
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

  await upsertPayment(context.env.DB, body, userId, productCode);
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

async function processSubscriptionLifecycle(context: EventContext<any, any, any>, body: PaddleWebhookBody) {
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

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ error: "db_not_configured" }, 500, context.request, context.env);
    await ensureBillingTables(context.env.DB);
    await seedDefaultProducts(context.env.DB);
    const webhookSecret = String(context.env?.PADDLE_WEBHOOK_SECRET || "").trim();
    if (!webhookSecret) return json({ error: "webhook_secret_not_configured" }, 500, context.request, context.env);

    const rawBody = await context.request.text();
    const signatureValid = await verifyPaddleWebhookSignature(context.request, rawBody, webhookSecret);
    if (!signatureValid) return json({ error: "invalid_webhook_signature" }, 401, context.request, context.env);

    const body = JSON.parse(rawBody || "{}") as PaddleWebhookBody;
    if (!body?.event_type) return json({ error: "missing_event_type" }, 400, context.request, context.env);

    const eventId = String(body.event_id || body.data?.id || `${body.event_type}:${Date.now()}`);
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
      result = await processTransactionCompleted(context, body);
    } else if (body.event_type === "subscription.created" || body.event_type === "subscription.activated" || body.event_type === "subscription.updated") {
      result = await processSubscriptionLifecycle(context, body);
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
