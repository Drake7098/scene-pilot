/**
 * functions/api/webhooks/whop.ts
 *
 * Whop Webhook Handler
 *
 * 处理事件：
 *   membership_activated  — Credits pack 购买 / Pro 会员激活
 *   membership_went_valid — 同上（部分 plan 用这个事件）
 *   membership_expired    — Pro 会员到期，降回 free
 *   membership_cancelled  — Pro 会员取消
 *
 * Credits pack plan IDs：
 *   plan_S9Y9sX4nIH7M2 → 150 Credits
 *   plan_LsyYESGY0fqI9 → 420 Credits
 *   plan_00vbsXkjSR9jA → 800 Credits
 *
 * Pro plan ID：
 *   plan_BD8J6nLOGIk1t  → tier=pro + 280 Credits
 */

const CREDIT_PACK_MAP: Record<string, number> = {
  plan_S9Y9sX4nIH7M2: 150,
  plan_LsyYESGY0fqI9: 420,
  plan_00vbsXkjSR9jA: 800,
};

const PRO_PLAN_ID = "plan_BD8J6nLOGIk1t";
const PRO_CREDITS_ON_ACTIVATE = 280;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function supabaseBaseUrl(env: Record<string, string>) {
  return String(env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
}

function supabaseServiceKey(env: Record<string, string>) {
  return String(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || "").trim();
}

async function supabaseRequest(
  env: Record<string, string>,
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const base = supabaseBaseUrl(env);
  const key = supabaseServiceKey(env);
  if (!base || !key) return { ok: false, status: 500, data: null, error: "supabase_not_configured" };
  try {
    const res = await fetch(`${base}${path}`, {
      method: init.method || "GET",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "return=representation",
        ...(init.headers || {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data, error: res.ok ? "" : String((data as any)?.message || (data as any)?.error || "supabase_error") };
  } catch (err) {
    return { ok: false, status: 500, data: null, error: String(err instanceof Error ? err.message : err) };
  }
}

/** 通过 email 查找 profile */
async function findProfileByEmail(env: Record<string, string>, email: string) {
  const res = await supabaseRequest(
    env,
    `/rest/v1/profiles?select=id,email,credits_balance,pro_status&email=eq.${encodeURIComponent(email)}&limit=1`
  );
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows[0] as { id: string; email: string; credits_balance: number; pro_status: string } | undefined;
}

/** 给用户加积分 + 写 credit_ledger */
async function addCredits(
  env: Record<string, string>,
  userId: string,
  amount: number,
  eventType: string,
  note: string
) {
  // 1. 读当前余额
  const profileRes = await supabaseRequest(
    env,
    `/rest/v1/profiles?select=id,credits_balance&id=eq.${encodeURIComponent(userId)}&limit=1`
  );
  const profile = Array.isArray(profileRes.data) ? profileRes.data[0] : null;
  if (!profile?.id) return { ok: false, error: "user_not_found" };

  const current = Number(profile.credits_balance || 0);
  const next = current + amount;

  // 2. 更新余额
  const patchRes = await supabaseRequest(
    env,
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    { method: "PATCH", body: { credits_balance: next, updated_at: new Date().toISOString() } }
  );
  if (!patchRes.ok) return { ok: false, error: patchRes.error };

  // 3. 写 ledger
  await supabaseRequest(env, "/rest/v1/credit_ledger", {
    method: "POST",
    body: {
      user_id: userId,
      amount,
      balance_after: next,
      event_type: eventType,
      source: "whop_webhook",
      reference_id: note,
      created_at: new Date().toISOString(),
    },
  });

  return { ok: true, balanceAfter: next };
}

/** 激活 Pro */
async function activatePro(env: Record<string, string>, userId: string, membershipId: string) {
  const ts = new Date().toISOString();
  return supabaseRequest(
    env,
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: {
        pro_status: "active",
        tier: "pro",
        pro_activated_at: ts,
        pro_deactivated_at: null,
        pro_cancel_at_period_end: false,
        pro_membership_id: membershipId,
        updated_at: ts,
      },
    }
  );
}

/** 停用 Pro */
async function deactivatePro(env: Record<string, string>, userId: string, reason: string) {
  const ts = new Date().toISOString();
  return supabaseRequest(
    env,
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: {
        pro_status: reason === "cancelled" ? "inactive" : "inactive",
        tier: "free",
        pro_deactivated_at: ts,
        pro_cancel_at_period_end: false,
        updated_at: ts,
      },
    }
  );
}

/** 验证 Whop webhook 签名 */
async function verifySignature(body: string, sig: string, secret: string): Promise<boolean> {
  if (!secret || !sig) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return expectedHex === sig;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as Record<string, string>;
  const request = context.request;

  try {
    const body = await request.text();
    const sig = request.headers.get("whop-signature") || "";
    const secret = String(env.WHOP_WEBHOOK_SECRET || "").trim();

    // 签名验证
    const valid = await verifySignature(body, sig, secret);
    if (!valid) {
      console.error("[whop-webhook] signature mismatch", { sig: sig.slice(0, 16) });
      return json({ error: "unauthorized" }, 401);
    }

    const event = JSON.parse(body);
    const action: string = event.action || "";
    const membership = event.data || {};
    const planId: string = membership.plan?.id || membership.plan_id || "";
    const userEmail: string = (membership.user?.email || membership.email || "").trim().toLowerCase();
    const membershipId: string = membership.id || "";

    console.log("[whop-webhook]", { action, planId, userEmail: userEmail.slice(0, 6) + "***" });

    // 只处理这 4 个事件
    const isActivate = action === "membership_activated" || action === "membership_went_valid";
    const isDeactivate = action === "membership_expired" || action === "membership_cancelled";

    if (!isActivate && !isDeactivate) {
      return json({ ok: true, skipped: true, action });
    }

    if (!userEmail) {
      console.error("[whop-webhook] missing user email");
      return json({ error: "missing_user_email" }, 400);
    }

    // 查找用户
    const profile = await findProfileByEmail(env, userEmail);
    if (!profile?.id) {
      // 用户还没有在 ScenePilotix 注册，记录但不报错（避免 Whop 重试风暴）
      console.warn("[whop-webhook] user not found for email", userEmail.slice(0, 6) + "***");
      return json({ ok: true, skipped: true, reason: "user_not_found_in_db" });
    }

    const userId = profile.id;

    // ── Credits pack ──────────────────────────────────────────────────────
    if (isActivate && CREDIT_PACK_MAP[planId]) {
      const credits = CREDIT_PACK_MAP[planId];
      const result = await addCredits(env, userId, credits, "credit_purchase", `whop:${membershipId}:${planId}`);
      if (!result.ok) {
        console.error("[whop-webhook] addCredits failed", result.error);
        return json({ error: result.error }, 500);
      }
      console.log("[whop-webhook] credits granted", { userId: userId.slice(0, 8), credits, planId });
      return json({ ok: true, action: "credits_granted", credits, balanceAfter: result.balanceAfter });
    }

    // ── Pro plan ──────────────────────────────────────────────────────────
    if (planId === PRO_PLAN_ID) {
      if (isActivate) {
        // 1. 激活 Pro
        const proRes = await activatePro(env, userId, membershipId);
        if (!proRes.ok) {
          console.error("[whop-webhook] activatePro failed", proRes.error);
          return json({ error: proRes.error }, 500);
        }
        // 2. 发 280 Credits（只在首次激活时发，防止重复）
        if (profile.pro_status !== "active") {
          await addCredits(env, userId, PRO_CREDITS_ON_ACTIVATE, "pro_activation_grant", `whop:${membershipId}:pro_grant`);
        }
        console.log("[whop-webhook] pro activated", { userId: userId.slice(0, 8) });
        return json({ ok: true, action: "pro_activated" });
      }

      if (isDeactivate) {
        const reason = action === "membership_cancelled" ? "cancelled" : "expired";
        const deRes = await deactivatePro(env, userId, reason);
        if (!deRes.ok) {
          console.error("[whop-webhook] deactivatePro failed", deRes.error);
          return json({ error: deRes.error }, 500);
        }
        console.log("[whop-webhook] pro deactivated", { userId: userId.slice(0, 8), reason });
        return json({ ok: true, action: "pro_deactivated", reason });
      }
    }

    // 其他 plan（未知），忽略
    return json({ ok: true, skipped: true, reason: "unknown_plan", planId });

  } catch (err) {
    console.error("[whop-webhook] unexpected error", err);
    return json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
};
