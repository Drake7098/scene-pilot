import { requireApiAuth } from "../../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { rollbackReservedCredits } from "../../_shared/credits-service";

type RollbackBody = {
  userId?: string;
  entryId?: string;
  relatedAction?: string;
  idempotencyKey?: string;
  meta?: Record<string, unknown>;
};

function makeIdempotencyKey(userId: string, entryId: string) {
  return `rollback_${userId}_${entryId}_${crypto.randomUUID()}`;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as RollbackBody;
    const userId = String(body.userId || "").trim();
    const entryId = String(body.entryId || "").trim();
    const relatedAction = String(body.relatedAction || "generation").trim() || "generation";
    if (!userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    if (!entryId) return json({ ok: false, error: "missing_entry_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    const idempotencyKey = String(body.idempotencyKey || "").trim() || makeIdempotencyKey(userId, entryId);
    const mutation = await rollbackReservedCredits(
      context.env,
      userId,
      entryId,
      idempotencyKey,
      relatedAction,
      body.meta || {}
    );
    return json({
      ok: true,
      entry: { id: mutation.entryId, status: "rolled_back" },
      balanceAfter: mutation.balanceAfter
    }, 200, context.request, context.env);
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);

