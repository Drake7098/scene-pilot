import { requireApiAuth } from "../../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { listCreditLedger } from "../../_shared/credits-service";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId")?.trim() || "";
    const limitRaw = Number(url.searchParams.get("limit") || "80");
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, Math.round(limitRaw))) : 80;
    if (!userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    const ledger = await listCreditLedger(context.env, userId, limit);
    return json({ ok: true, ledger }, 200, context.request, context.env);
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);

