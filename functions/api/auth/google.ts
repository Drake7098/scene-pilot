import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { isGoogleAuthConfigured, verifyGoogleIdToken } from "../_shared/google-auth";

type GoogleAuthBody = {
  credential?: string;
};

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    if (!isGoogleAuthConfigured(context.env)) {
      return json(
        { ok: false, error: "google_not_configured" },
        500,
        context.request,
        context.env
      );
    }

    const body = await context.request.json() as GoogleAuthBody;
    const credential = String(body?.credential || "").trim();
    if (!credential) {
      return json(
        { ok: false, error: "google_missing_credential" },
        400,
        context.request,
        context.env
      );
    }

    const result = await verifyGoogleIdToken(context.env, credential);
    if (!result.ok) {
      return json(result, 401, context.request, context.env);
    }

    return json(
      { ok: true, profile: result.profile },
      200,
      context.request,
      context.env
    );
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
  corsOptions("POST, OPTIONS", context.request, context.env);
