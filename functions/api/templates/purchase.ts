import { requireApiAuth } from "../_shared/auth";
import { ensureBillingTables } from "../_shared/billing-db";
import { finalizeReservedCredits, loadWalletState, reserveCreditsForGeneration, rollbackReservedCredits } from "../_shared/credits-service";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";

type PurchaseBody = {
  userId?: string;
  templateId?: string;
  creditCost?: number;
  idempotencyKey?: string;
};

type PurchaseRow = { id: string; template_id?: string };

function nowIso() {
  return new Date().toISOString();
}

function makeIdempotencyKey(userId: string, templateId: string) {
  return `template_purchase_${userId}_${templateId}_${crypto.randomUUID()}`;
}

async function isTemplateOwned(env: any, userId: string, templateId: string) {
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<PurchaseRow[]>(
      env,
      `/rest/v1/template_purchases?user_id=eq.${encodeURIComponent(userId)}&template_id=eq.${encodeURIComponent(templateId)}&select=id,template_id&limit=1`
    );
    if (!res.ok) {
      if (res.errorCode?.includes("relation") || res.errorCode === "pgrst116") return false;
      throw new Error(res.errorCode || "template_owned_lookup_failed");
    }
    return Boolean(res.data?.[0]?.id);
  }

  if (!env?.DB) return false;
  await ensureBillingTables(env.DB);
  const row = await env.DB.prepare(`
    SELECT id FROM template_purchases
    WHERE user_id = ? AND template_id = ?
    LIMIT 1
  `).bind(userId, templateId).first<{ id: string }>();
  return Boolean(row?.id);
}

async function insertTemplatePurchase(
  env: any,
  userId: string,
  templateId: string,
  creditCost: number,
  idempotencyKey: string
) {
  const ts = nowIso();
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<PurchaseRow[]>(env, "/rest/v1/template_purchases", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: {
        id: crypto.randomUUID(),
        user_id: userId,
        template_id: templateId,
        unlock_source: "credits",
        credit_cost: creditCost,
        idempotency_key: idempotencyKey,
        created_at: ts,
      }
    });
    if (!res.ok) {
      if (res.errorCode?.includes("relation")) throw new Error("template_purchase_table_missing");
      throw new Error(res.errorCode || "template_purchase_insert_failed");
    }
    return Boolean(res.data?.[0]?.id);
  }

  if (!env?.DB) throw new Error("db_not_configured");
  await ensureBillingTables(env.DB);
  try {
    const id = `tp_${crypto.randomUUID()}`;
    await env.DB.prepare(`
      INSERT INTO template_purchases (
        id, user_id, template_id, unlock_source, credit_cost, idempotency_key, created_at
      ) VALUES (?, ?, ?, 'credits', ?, ?, ?)
    `).bind(id, userId, templateId, creditCost, idempotencyKey, ts).run();
    return true;
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    if (message.toLowerCase().includes("unique")) return false;
    throw error;
  }
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const body = await context.request.json() as PurchaseBody;
    const userId = String(body.userId || "").trim();
    const templateId = String(body.templateId || "").trim();
    const creditCost = Math.max(0, Math.round(Number(body.creditCost || 0)));

    if (!userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    if (!templateId) return json({ ok: false, error: "missing_template_id" }, 400, context.request, context.env);
    if (creditCost <= 0) return json({ ok: false, error: "invalid_credit_cost" }, 400, context.request, context.env);

    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    if (await isTemplateOwned(context.env, userId, templateId)) {
      const wallet = await loadWalletState(context.env, userId);
      return json({ ok: true, success: true, alreadyOwned: true, creditsBalance: wallet.creditsBalance }, 200, context.request, context.env);
    }

    const wallet = await loadWalletState(context.env, userId);
    if (wallet.creditsBalance < creditCost) {
      return json({
        ok: false,
        error: "insufficient_credits",
        need: creditCost,
        have: wallet.creditsBalance,
      }, 400, context.request, context.env);
    }

    const requestKey = String(
      body.idempotencyKey
      || context.request.headers.get("x-idempotency-key")
      || ""
    ).trim() || makeIdempotencyKey(userId, templateId);

    const reserve = await reserveCreditsForGeneration(
      context.env,
      userId,
      creditCost,
      `template_purchase:${templateId}`,
      requestKey,
      { template_id: templateId, source: "template_purchase" }
    );

    const inserted = await insertTemplatePurchase(context.env, userId, templateId, creditCost, requestKey);

    if (!inserted) {
      await rollbackReservedCredits(
        context.env,
        userId,
        reserve.entryId,
        `template_purchase_rollback_${requestKey}`,
        `template_purchase:${templateId}`,
        { reason: "already_owned" }
      );
      const nextWallet = await loadWalletState(context.env, userId);
      return json({ ok: true, success: true, alreadyOwned: true, creditsBalance: nextWallet.creditsBalance }, 200, context.request, context.env);
    }

    await finalizeReservedCredits(context.env, userId, reserve.entryId);
    const nextWallet = await loadWalletState(context.env, userId);
    return json({
      ok: true,
      success: true,
      alreadyOwned: false,
      templateId,
      creditsBalance: nextWallet.creditsBalance,
    }, 200, context.request, context.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "insufficient_credits" ? 400 : 500;
    return json({ ok: false, error: message }, status, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
