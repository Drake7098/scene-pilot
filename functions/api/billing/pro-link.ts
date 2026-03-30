import { requireApiAuth } from "../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";

const DEFAULT_PRO_LINK = "https://whop.com/checkout/plan_BD8J6nLOGIk1t";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const userId = new URL(context.request.url).searchParams.get("userId")?.trim() || "";
    if (userId) {
      const authErr = await requireApiAuth(context, { claimedUserId: userId });
      if (authErr) return authErr;
    }

    const url = String(context.env?.WHOP_PRO_PURCHASE_URL || "").trim() || DEFAULT_PRO_LINK;
    return json({ ok: true, url, requiresLogin: true }, 200, context.request, context.env);
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
