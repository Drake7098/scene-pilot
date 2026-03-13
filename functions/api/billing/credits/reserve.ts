import { requireApiAuth } from "../../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { reserveCreditsForGeneration } from "../../_shared/credits-service";

type ReserveBody = {
  userId?: string;
  credits?: number;
  relatedAction?: string;
  idempotencyKey?: string;
  meta?: Record<string, unknown>;
};

function makeIdempotencyKey(userId: string, relatedAction: string) {
  return `reserve_${userId}_${relatedAction}_${crypto.randomUUID()}`;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as ReserveBody;
    const userId = String(body.userId || "").trim();
    const credits = Math.max(0, Math.round(Number(body.credits || 0)));
    const relatedAction = String(body.relatedAction || "generation").trim() || "generation";
    if (!userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    if (!credits) return json({ ok: false, error: "invalid_credits" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    const idempotencyKey = String(body.idempotencyKey || "").trim() || makeIdempotencyKey(userId, relatedAction);
    const mutation = await reserveCreditsForGeneration(
      context.env,
      userId,
      credits,
      relatedAction,
      idempotencyKey,
      body.meta || {}
    );

    return json({
      ok: true,
      entry: {
        id: mutation.entryId,
        status: "pending"
      },
      balanceAfter: mutation.balanceAfter
    }, 200, context.request, context.env);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "insufficient_credits" ? 400 : 500;
    return json({ ok: false, error: message }, status, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);

