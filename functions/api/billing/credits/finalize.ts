import { requireApiAuth } from "../../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../../_shared/http";
import { finalizeReservedCredits } from "../../_shared/credits-service";

type FinalizeBody = {
  userId?: string;
  entryId?: string;
};

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as FinalizeBody;
    const userId = String(body.userId || "").trim();
    const entryId = String(body.entryId || "").trim();
    if (!userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    if (!entryId) return json({ ok: false, error: "missing_entry_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: userId });
    if (authErr) return authErr;

    await finalizeReservedCredits(context.env, userId, entryId);
    return json({ ok: true }, 200, context.request, context.env);
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("POST, OPTIONS", context.request, context.env);

