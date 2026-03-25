import { corsOptions, rejectDisallowedOrigin } from "../_shared/http";
import { respondOpsSummary } from "../_shared/ops-monitor";

export const onRequestGet: PagesFunction = async (context) => {
  const originErr = rejectDisallowedOrigin(context.request, context.env);
  if (originErr) return originErr;
  return await respondOpsSummary(context);
};

export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);
