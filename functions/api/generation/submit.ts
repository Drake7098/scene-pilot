import { submitGeneration, type ProviderSubmitBody } from "../_shared/provider-gateway";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";
import { buildRequestRateLimitKey, enforceRateLimit } from "../_shared/rate-limit";

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as ProviderSubmitBody;
    if (!body.userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;

    const limiter = await enforceRateLimit(context.env?.DB, {
      key: await buildRequestRateLimitKey(
        context.request,
        "generation_submit",
        [body.userId, body.provider || "fal", body.mediaType || "image"]
      ),
      limit: envInt(context.env, "GENERATION_SUBMIT_LIMIT_PER_MIN", 30, 1, 300),
      windowSeconds: 60
    });
    if (!limiter.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: limiter.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const result = await submitGeneration(context.env, body);
    return json(result, result.ok ? 200 : 400, context.request, context.env);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
