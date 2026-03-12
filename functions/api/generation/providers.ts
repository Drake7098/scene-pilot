import { availableProviders } from "../_shared/provider-gateway";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";

export const onRequestGet: PagesFunction = async (context) => {
  const originErr = rejectDisallowedOrigin(context.request, context.env);
  if (originErr) return originErr;
  const authErr = await requireApiAuth(context);
  if (authErr) return authErr;
  return json({
    ok: true,
    providers: availableProviders(context.env)
  }, 200, context.request, context.env);
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("GET, OPTIONS", context.request, context.env);
