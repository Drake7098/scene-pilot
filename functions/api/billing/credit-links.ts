import { requireApiAuth } from "../_shared/auth";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";

type CreditLink = { id: string; credits: number; usd: number; url: string };

const DEFAULT_LINKS: CreditLink[] = [
  { id: "pack_3", credits: 150, usd: 3, url: "https://whop.com/checkout/plan_S9Y9sX4nIH7M2" },
  { id: "pack_8", credits: 420, usd: 8, url: "https://whop.com/checkout/plan_LsyYESGY0fqI9" },
  { id: "pack_15", credits: 800, usd: 15, url: "https://whop.com/checkout/plan_00vbsXkjSR9jA" },
];

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const userId = new URL(context.request.url).searchParams.get("userId")?.trim() || "";
    if (userId) {
      const authErr = await requireApiAuth(context, { claimedUserId: userId });
      if (authErr) return authErr;
    }

    return json({ ok: true, packs: DEFAULT_LINKS, requiresLogin: true }, 200, context.request, context.env);
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
  corsOptions("GET, OPTIONS", context.request, context.env);
