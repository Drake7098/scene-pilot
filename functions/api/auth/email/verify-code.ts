import { isValidEmail, normalizeEmail } from "../../_shared/auth-email";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";

type VerifyCodeBody = { email?: string; code?: string };

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const body = await context.request.json() as VerifyCodeBody;
    const email = normalizeEmail(body?.email || "");
    if (!isValidEmail(email)) return json({ ok: false, error: "invalid_email" }, 400, context.request, context.env);
    return json(
      {
        ok: false,
        error: "supabase_only_use_client_auth_v1_verify",
        detail: "Use Supabase auth/v1/verify from client-side flow."
      },
      410,
      context.request,
      context.env
    );
  } catch (error) {
    return json({
      ok: false,
      error: "verify_code_failed",
      detail: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);
