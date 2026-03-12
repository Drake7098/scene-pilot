import { getGenerationStatus, type ProviderSubmitBody } from "../_shared/provider-gateway";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";

type StatusBody = ProviderSubmitBody & { taskId?: string };

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as StatusBody;
    if (!body.userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;
    const result = await getGenerationStatus(context.env, body);
    return json(result, result.ok ? 200 : 400, context.request, context.env);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
