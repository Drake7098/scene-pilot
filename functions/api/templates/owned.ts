import { requireApiAuth } from "../_shared/auth";
import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";

type OwnedRow = { template_id: string };

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const userId = new URL(context.request.url).searchParams.get("userId")?.trim() || "";
    if (!userId) {
      return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    }
    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    if (hasSupabaseAdmin(context.env)) {
      const res = await supabaseAdminRequest<OwnedRow[]>(
        context.env,
        `/rest/v1/template_purchases?user_id=eq.${encodeURIComponent(userId)}&select=template_id&order=created_at.desc&limit=2000`
      );
      if (!res.ok) {
        if (res.errorCode?.includes("relation") || res.errorCode === "pgrst116") {
          return json({ ok: true, templateIds: [] }, 200, context.request, context.env);
        }
        return json({ ok: false, error: res.errorCode || "owned_query_failed" }, 500, context.request, context.env);
      }
      const templateIds = Array.isArray(res.data)
        ? Array.from(new Set(res.data.map((item) => String(item.template_id || "").trim()).filter(Boolean)))
        : [];
      return json({ ok: true, templateIds }, 200, context.request, context.env);
    }

    if (!context.env?.DB) {
      return json({ ok: true, templateIds: [] }, 200, context.request, context.env);
    }

    await ensureBillingTables(context.env.DB);
    const { results } = await context.env.DB.prepare(`
      SELECT template_id FROM template_purchases
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 2000
    `).bind(userId).all<{ template_id: string }>();
    const templateIds = Array.isArray(results)
      ? Array.from(new Set(results.map((item) => String(item.template_id || "").trim()).filter(Boolean)))
      : [];
    return json({ ok: true, templateIds }, 200, context.request, context.env);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      500,
      context.request,
      context.env
    );
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);
