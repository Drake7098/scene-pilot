import { ensureAuthTables, getAuthMe } from "../_shared/auth-email";
import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ ok: false, error: "db_not_configured" }, 500, context.request, context.env);
    await ensureAuthTables(context.env.DB);
    await ensureBillingTables(context.env.DB);
    const auth = await getAuthMe(context.env.DB, context.request);
    if (!auth.ok) return json({ ok: true, user: null }, 200, context.request, context.env);
    return json({
      ok: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        displayName: null,
        avatarUrl: null,
        tier: auth.user.tier,
        creditsBalance: auth.user.credits,
        proConsoleEnabled: auth.user.tier === "pro",
        bringYourOwnApiEnabled: auth.user.tier === "pro",
        createdAt: auth.user.createdAt,
        updatedAt: auth.user.updatedAt
      }
    }, 200, context.request, context.env);
  } catch (error) {
    return json({
      ok: false,
      error: "auth_me_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);
