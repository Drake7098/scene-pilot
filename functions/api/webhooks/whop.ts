import { ensureBillingTables, grantCredits } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";

type WhopEvent = {
  id?: string;
  type?: string;
  action?: string;
  data?: Record<string, unknown>;
  message?: { id?: string };
  [key: string]: unknown;
};

type BillingEventRow = { id: string; processed?: boolean; user_email?: string | null };

type UserProfileRow = { id: string; email?: string };

type SubscriptionRow = { id: string; provider_subscription_id?: string };

const SUPPORTED_EVENTS = new Set<string>([
  "membership.activated",
  "membership.deactivated",
  "membership.cancel_at_period_end_changed",
  "payment.succeeded",
  "payment.failed",
  "refund.updated",
]);

function nowIso() {
  return new Date().toISOString();
}

function normalizeEventType(input: unknown) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, ".");
}

function normalizeEmail(input: unknown) {
  return String(input || "").trim().toLowerCase();
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function extractEventId(event: WhopEvent, rawBody: string) {
  const direct = pickString(event.id, event.message?.id);
  if (direct) return direct;
  const bodyHash = Array.from(new TextEncoder().encode(rawBody))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `whop_${bodyHash || crypto.randomUUID()}`;
}

function extractMembershipId(data: Record<string, unknown>) {
  const member = asObject(data.member);
  return pickString(data.id, data.membership_id, member.id);
}

function extractUserEmail(data: Record<string, unknown>) {
  const user = asObject(data.user);
  const member = asObject(data.member);
  return normalizeEmail(pickString(data.user_email, member.email, user.email));
}

function parseCancelAtPeriodEnd(data: Record<string, unknown>) {
  const raw = data.cancel_at_period_end;
  if (typeof raw === "boolean") return raw;
  const text = String(raw ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(text)) return true;
  if (["0", "false", "no", "off"].includes(text)) return false;
  return false;
}

async function verifyWhopSignature(secret: string, payload: string, signature: string) {
  if (!secret || !signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase();
  return expectedHex === signature.trim().toLowerCase();
}

async function findUserByEmail(env: any, email: string) {
  if (!email) return "";
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<UserProfileRow[]>(
      env,
      `/rest/v1/users_profile?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`
    );
    if (!res.ok) return "";
    return String(res.data?.[0]?.id || "");
  }

  if (!env?.DB) return "";
  await ensureBillingTables(env.DB);
  const row = await env.DB.prepare(`
    SELECT id FROM users_profile WHERE lower(email) = ? LIMIT 1
  `).bind(email).first<{ id: string }>();
  return String(row?.id || "");
}

async function findExistingEvent(env: any, eventId: string) {
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<BillingEventRow[]>(
      env,
      `/rest/v1/billing_events?provider=eq.whop&event_id=eq.${encodeURIComponent(eventId)}&select=id,processed,user_email&limit=1`
    );
    if (!res.ok) return null;
    return res.data?.[0] || null;
  }

  if (!env?.DB) return null;
  await ensureBillingTables(env.DB);
  const row = await env.DB.prepare(`
    SELECT id, processed, user_email
    FROM billing_events
    WHERE provider = 'whop' AND event_id = ?
    LIMIT 1
  `).bind(eventId).first<{ id: string; processed: number; user_email: string | null }>();
  if (!row?.id) return null;
  return { id: row.id, processed: Boolean(row.processed), user_email: row.user_email };
}

async function insertEvent(env: any, args: {
  eventId: string;
  eventType: string;
  resourceId: string;
  userEmail: string;
  payload: string;
}) {
  const ts = nowIso();
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<BillingEventRow[]>(env, "/rest/v1/billing_events", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        provider: "whop",
        event_id: args.eventId,
        event_type: args.eventType,
        resource_id: args.resourceId || null,
        user_email: args.userEmail || null,
        payload: JSON.parse(args.payload),
        processed: false,
        created_at: ts,
      }
    });
    if (!res.ok) throw new Error(res.errorCode || "billing_event_insert_failed");
    return String(res.data?.[0]?.id || "");
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  const id = `be_${crypto.randomUUID()}`;
  await env.DB.prepare(`
    INSERT INTO billing_events (
      id, provider, event_id, event_type, resource_id,
      user_email, user_external_id, payload, processed, created_at
    ) VALUES (?, 'whop', ?, ?, ?, ?, NULL, ?, 0, ?)
  `).bind(id, args.eventId, args.eventType, args.resourceId || null, args.userEmail || null, args.payload, ts).run();
  return id;
}

async function markEventProcessed(env: any, eventRowId: string) {
  const ts = nowIso();
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest(env, `/rest/v1/billing_events?id=eq.${encodeURIComponent(eventRowId)}`, {
      method: "PATCH",
      body: {
        processed: true,
        processed_at: ts,
      }
    });
    if (!res.ok) throw new Error(res.errorCode || "billing_event_patch_failed");
    return;
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await env.DB.prepare(`
    UPDATE billing_events
    SET processed = 1, processed_at = ?
    WHERE id = ?
  `).bind(ts, eventRowId).run();
}

async function upsertMembershipState(
  env: any,
  userId: string,
  membershipId: string,
  status: "active" | "inactive" | "cancel_at_period_end",
  cancelAtPeriodEnd: boolean
) {
  const now = nowIso();
  const tier = status === "inactive" ? "free" : "pro";

  if (hasSupabaseAdmin(env)) {
    const profileRes = await supabaseAdminRequest(env, `/rest/v1/users_profile?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: {
        tier,
        updated_at: now,
      }
    });
    if (!profileRes.ok) throw new Error(profileRes.errorCode || "profile_update_failed");

    const existingSub = await supabaseAdminRequest<SubscriptionRow[]>(
      env,
      `/rest/v1/subscriptions?provider=eq.whop&provider_subscription_id=eq.${encodeURIComponent(membershipId)}&select=id,provider_subscription_id&limit=1`
    );
    if (existingSub.ok && existingSub.data?.[0]?.id) {
      const patch = await supabaseAdminRequest(env, `/rest/v1/subscriptions?id=eq.${encodeURIComponent(existingSub.data[0].id)}`, {
        method: "PATCH",
        body: {
          status,
          cancel_at_period_end: cancelAtPeriodEnd,
          updated_at: now,
        }
      });
      if (!patch.ok) throw new Error(patch.errorCode || "subscription_patch_failed");
      return;
    }

    const insert = await supabaseAdminRequest(env, "/rest/v1/subscriptions", {
      method: "POST",
      body: {
        id: crypto.randomUUID(),
        user_id: userId,
        provider: "whop",
        provider_subscription_id: membershipId || null,
        plan_code: "pro_monthly",
        status,
        cancel_at_period_end: cancelAtPeriodEnd,
        monthly_credit_grant: 0,
        created_at: now,
        updated_at: now,
      }
    });
    if (!insert.ok) throw new Error(insert.errorCode || "subscription_insert_failed");
    return;
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await env.DB.prepare(`
    UPDATE users_profile SET tier = ?, updated_at = ? WHERE id = ?
  `).bind(tier, now, userId).run();
  const existing = await env.DB.prepare(`
    SELECT id FROM subscriptions WHERE provider = 'whop' AND provider_subscription_id = ? LIMIT 1
  `).bind(membershipId).first<{ id: string }>();
  if (existing?.id) {
    await env.DB.prepare(`
      UPDATE subscriptions
      SET status = ?, cancel_at_period_end = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, cancelAtPeriodEnd ? 1 : 0, now, existing.id).run();
    return;
  }
  await env.DB.prepare(`
    INSERT INTO subscriptions (
      id, user_id, provider, provider_subscription_id, plan_code, status,
      current_period_start, current_period_end, cancel_at_period_end,
      monthly_credit_grant, last_credit_granted_at, created_at, updated_at
    ) VALUES (?, ?, 'whop', ?, 'pro_monthly', ?, ?, ?, ?, 0, NULL, ?, ?)
  `).bind(
    `sub_${crypto.randomUUID()}`,
    userId,
    membershipId || null,
    status,
    now,
    null,
    cancelAtPeriodEnd ? 1 : 0,
    now,
    now
  ).run();
}

async function grantProSignupBonus(env: any, userId: string, membershipId: string) {
  const credits = Math.max(0, Math.round(Number(env?.PRO_SIGNUP_BONUS_CREDITS || 280)));
  if (!credits) return;
  const key = `whop-pro-bonus-${membershipId || userId}`;

  if (hasSupabaseAdmin(env)) {
    const rpc = await supabaseAdminRequest<Array<{ entry_id: string; balance_after: number }>>(
      env,
      "/rest/v1/rpc/sp_grant_credits",
      {
        method: "POST",
        body: {
          p_user_id: userId,
          p_credits: credits,
          p_entry_type: "admin_grant",
          p_idempotency_key: key,
          p_meta: {
            source: "pro_signup_bonus",
            membership_id: membershipId || null,
          },
        },
      }
    );
    if (!rpc.ok) throw new Error(rpc.errorCode || "grant_bonus_failed");
    return;
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  await grantCredits(env.DB, userId, credits, "admin_grant", key, {
    source: "pro_signup_bonus",
    membership_id: membershipId || null,
  });
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const secret = String(context.env?.WHOP_WEBHOOK_SECRET || "").trim();
    const signature = context.request.headers.get("whop-signature") || "";
    const body = await context.request.text();

    const verified = await verifyWhopSignature(secret, body, signature);
    if (!verified) {
      return json({ ok: false, error: "invalid_signature" }, 401, context.request, context.env);
    }

    const event = JSON.parse(body) as WhopEvent;
    const data = asObject(event.data);
    const eventId = extractEventId(event, body);
    const eventType = normalizeEventType(event.type || event.action);
    const membershipId = extractMembershipId(data);
    const userEmail = extractUserEmail(data);

    const existing = await findExistingEvent(context.env, eventId);
    if (existing?.id) {
      return json({ ok: true, dedup: true, eventId }, 200, context.request, context.env);
    }

    const eventRowId = await insertEvent(context.env, {
      eventId,
      eventType,
      resourceId: membershipId,
      userEmail,
      payload: body,
    });

    if (!SUPPORTED_EVENTS.has(eventType)) {
      await markEventProcessed(context.env, eventRowId);
      return json({ ok: true, ignored: true, eventType, eventId }, 200, context.request, context.env);
    }

    const userId = await findUserByEmail(context.env, userEmail);
    if (!userId && eventType.startsWith("membership.")) {
      await markEventProcessed(context.env, eventRowId);
      return json({ ok: true, eventId, skipped: "user_not_found" }, 200, context.request, context.env);
    }

    if (eventType === "membership.activated") {
      await upsertMembershipState(context.env, userId, membershipId || `whop_${userId}`, "active", false);
      await grantProSignupBonus(context.env, userId, membershipId || userId);
    } else if (eventType === "membership.deactivated") {
      await upsertMembershipState(context.env, userId, membershipId || `whop_${userId}`, "inactive", false);
    } else if (eventType === "membership.cancel_at_period_end_changed") {
      const cancelAtPeriodEnd = parseCancelAtPeriodEnd(data);
      await upsertMembershipState(
        context.env,
        userId,
        membershipId || `whop_${userId}`,
        cancelAtPeriodEnd ? "cancel_at_period_end" : "active",
        cancelAtPeriodEnd
      );
    }

    await markEventProcessed(context.env, eventRowId);
    return json({ ok: true, eventId, eventType }, 200, context.request, context.env);
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      500,
      context.request,
      context.env
    );
  }
};

export const onRequestGet: PagesFunction = async (context) =>
  json({ ok: false, error: "method_not_allowed" }, 405, context.request, context.env);

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
