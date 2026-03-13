import { clearSessionCookie, ensureAuthTables, revokeAuthSession } from "../_shared/auth-email";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ ok: false, error: "db_not_configured" }, 500, context.request, context.env);
    await ensureAuthTables(context.env.DB);
    await revokeAuthSession(context.env.DB, context.request);
    const response = json({ ok: true }, 200, context.request, context.env);
    response.headers.append("set-cookie", clearSessionCookie(context.request));
    return response;
  } catch (error) {
    return json({
      ok: false,
      error: "logout_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
