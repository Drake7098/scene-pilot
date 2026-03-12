import { ensureBillingTables, ensureUserWallet, seedDefaultProducts } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";

type PaddleCheckoutRequest = {
  kind?: "credits" | "pro";
  productId?: string;
  userId?: string;
  userEmail?: string;
};

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!context.env?.DB) return json({ error: "db_not_configured" }, 500, context.request, context.env);
    await ensureBillingTables(context.env.DB);
    await seedDefaultProducts(context.env.DB);

    const body = await context.request.json() as PaddleCheckoutRequest;
    if (!body.kind || !body.productId || !body.userId) {
      return json({ error: "invalid_checkout_request" }, 400, context.request, context.env);
    }
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;

    await ensureUserWallet(context.env.DB, body.userId, body.userEmail || "");

    const product = await context.env.DB.prepare(`
      SELECT code, kind, provider_price_id, price_amount, currency, active
      FROM products
      WHERE code = ?
      LIMIT 1
    `).bind(body.productId).first<{
      code: string;
      kind: string;
      provider_price_id: string | null;
      price_amount: number;
      currency: string;
      active: number;
    }>();
    if (!product || product.active !== 1) {
      return json({ error: "product_not_found" }, 404, context.request, context.env);
    }
    const expectedKind = body.kind === "credits" ? "credit_pack" : "subscription";
    if (product.kind !== expectedKind) return json({ error: "kind_mismatch" }, 400, context.request, context.env);

    const checkoutId = makeId("checkout");
    const now = new Date().toISOString();
    await context.env.DB.prepare(`
      INSERT INTO checkout_sessions (id, user_id, kind, product_code, provider, status, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'paddle', 'created', ?, ?, ?)
    `)
      .bind(
        checkoutId,
        body.userId,
        body.kind,
        product.code,
        JSON.stringify({
          userEmail: body.userEmail || "",
          amount: product.price_amount,
          currency: product.currency
        }),
        now,
        now
      )
      .run();

    return json({
      provider: "paddle",
      mock: false,
      kind: body.kind,
      productId: body.productId,
      sessionId: checkoutId,
      items: [{ priceId: product.provider_price_id || body.productId, quantity: 1 }],
      customer: body.userEmail ? { email: body.userEmail } : undefined,
      customData: {
        userId: body.userId,
        productId: body.productId,
        kind: body.kind
      },
      successUrl: `${new URL(context.request.url).origin}/?billing=success`,
      cancelUrl: `${new URL(context.request.url).origin}/?billing=cancel`
    }, 200, context.request, context.env);
  } catch {
    return json({ error: "checkout_error" }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  return corsOptions("POST, OPTIONS", context.request, context.env);
};
