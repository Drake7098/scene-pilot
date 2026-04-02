import { expect, test } from "@playwright/test";
import { requireApiAuth } from "../../../functions/api/_shared/auth";
import { corsOptions, isOriginAllowed, rejectDisallowedOrigin } from "../../../functions/api/_shared/http";
import { verifyPaddleWebhookSignature } from "../../../functions/api/_shared/paddle-signature";
import { submitGeneration } from "../../../functions/api/_shared/provider-gateway";
import { onRequestGet as generationProvidersGet } from "../../../functions/api/generation/providers";
import { onRequestPost as legalConsentPost } from "../../../functions/api/legal/consent";
import { onRequestPost as paddleCheckoutPost } from "../../../functions/api/paddle/checkout";
import { onRequestPost as paddleWebhookPost } from "../../../functions/api/paddle/webhook";

function makeContext(request: Request, env: Record<string, unknown>) {
  return { request, env } as unknown as EventContext<any, any, any>;
}

function createMockDb() {
  const paymentEvents = new Map<string, { id: string; status: string }>();
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          void args;
          return {
            async run() {
              if (sql.includes("INSERT INTO payment_events")) {
                const [id, providerEventId] = args as [string, string];
                paymentEvents.set(providerEventId, { id, status: "received" });
              }
              if (sql.includes("UPDATE payment_events SET status = 'processed'")) {
                const [, storeId] = args as [string, string];
                for (const [eventId, value] of paymentEvents.entries()) {
                  if (value.id === storeId) {
                    paymentEvents.set(eventId, { ...value, status: "processed" });
                    break;
                  }
                }
              }
              return { success: true };
            },
            async first() {
              if (sql.includes("SELECT id, status FROM payment_events")) {
                const [providerEventId] = args as [string];
                return paymentEvents.get(providerEventId) || null;
              }
              if (sql.includes("FROM products")) {
                if (sql.includes("provider_price_id")) {
                  return {
                    code: "pro_monthly",
                    kind: "subscription",
                    provider_price_id: "pri_pro_monthly",
                    price_amount: 12,
                    currency: "USD",
                    active: 1
                  };
                }
                return {
                  code: "pro_monthly",
                  kind: "subscription",
                  credits_amount: null,
                  monthly_credit_grant: 500
                };
              }
              return null;
            },
            async all() {
              return { results: [] };
            }
          };
        }
      };
    },
    async batch(statements: unknown[]) {
      void statements;
      return [];
    }
  };
  return db as unknown as D1Database;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

test("webhook signature verification passes/fails correctly", async () => {
  const secret = "whsec_test";
  const rawBody = JSON.stringify({ event_type: "transaction.completed", data: { id: "tx_1" } });
  const ts = String(Math.floor(Date.now() / 1000));
  const validSig = await hmacSha256Hex(secret, `${ts}:${rawBody}`);
  const staleTs = String(Math.floor(Date.now() / 1000) - 7200);
  const staleSig = await hmacSha256Hex(secret, `${staleTs}:${rawBody}`);

  const validReq = new Request("https://example.com/api/paddle/webhook", {
    method: "POST",
    headers: { "paddle-signature": `ts=${ts};h1=${validSig}` },
    body: rawBody
  });
  const invalidReq = new Request("https://example.com/api/paddle/webhook", {
    method: "POST",
    headers: { "paddle-signature": `ts=${ts};h1=deadbeef` },
    body: rawBody
  });
  const staleReq = new Request("https://example.com/api/paddle/webhook", {
    method: "POST",
    headers: { "paddle-signature": `ts=${staleTs};h1=${staleSig}` },
    body: rawBody
  });

  await expect(verifyPaddleWebhookSignature(validReq, rawBody, secret)).resolves.toBeTruthy();
  await expect(verifyPaddleWebhookSignature(invalidReq, rawBody, secret)).resolves.toBeFalsy();
  await expect(verifyPaddleWebhookSignature(staleReq, rawBody, secret)).resolves.toBeFalsy();
});

test("auth middleware enforces token and claimed user consistency", async () => {
  const env = { API_AUTH_TOKEN: "test-token" };
  const unauthorized = await requireApiAuth(
    makeContext(new Request("https://example.com/api/generation/providers"), env)
  );
  expect(unauthorized?.status).toBe(401);

  const ok = await requireApiAuth(
    makeContext(
      new Request("https://example.com/api/generation/providers", {
        headers: { authorization: "Bearer test-token" }
      }),
      env
    ),
    { claimedUserId: "user_1" }
  );
  expect(ok).toBeNull();

  const mismatch = await requireApiAuth(
    makeContext(
      new Request("https://example.com/api/generation/providers", {
        headers: {
          authorization: "Bearer test-token",
          "x-sp-user-id": "user_2"
        }
      }),
      env
    ),
    { claimedUserId: "user_1" }
  );
  expect(mismatch?.status).toBe(403);
});

test("generation routes enforce auth and paddle checkout remains disabled", async () => {
  const tokenEnv = { API_AUTH_TOKEN: "test-token", DB: createMockDb() };

  const providerDenied = await generationProvidersGet(
    makeContext(new Request("https://example.com/api/generation/providers"), tokenEnv)
  );
  expect(providerDenied.status).toBe(401);

  const providerAllowed = await generationProvidersGet(
    makeContext(
      new Request("https://example.com/api/generation/providers", {
        headers: { authorization: "Bearer test-token" }
      }),
      tokenEnv
    )
  );
  expect(providerAllowed.status).toBe(200);

  const checkoutDenied = await paddleCheckoutPost(
    makeContext(
      new Request("https://example.com/api/paddle/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "pro", productId: "pro_monthly", userId: "user_1" })
      }),
      tokenEnv
    )
  );
  expect(checkoutDenied.status).toBe(503);

  const checkoutAllowed = await paddleCheckoutPost(
    makeContext(
      new Request("https://example.com/api/paddle/checkout", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
          "x-sp-user-id": "user_1"
        },
        body: JSON.stringify({ kind: "pro", productId: "pro_monthly", userId: "user_1" })
      }),
      tokenEnv
    )
  );
  expect(checkoutAllowed.status).toBe(503);
});

test("legal consent route enforces auth and accepts valid payload", async () => {
  const tokenEnv = { API_AUTH_TOKEN: "test-token", DB: createMockDb() };
  const payload = {
    userId: "user_1",
    context: "auth_signup_signin",
    docs: ["terms", "privacy"],
    documentVersions: { terms: "v1.2", privacy: "v1.2" },
    locale: "en-US",
    source: "account_center_auth",
    acceptedAt: "2026-03-13T00:00:00.000Z"
  };

  const denied = await legalConsentPost(
    makeContext(
      new Request("https://example.com/api/legal/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      }),
      tokenEnv
    )
  );
  expect(denied.status).toBe(401);

  const allowed = await legalConsentPost(
    makeContext(
      new Request("https://example.com/api/legal/consent", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
          "content-type": "application/json",
          "x-sp-user-id": "user_1"
        },
        body: JSON.stringify(payload)
      }),
      tokenEnv
    )
  );
  expect(allowed.status).toBe(200);
});

test("cors uses allowlist instead of wildcard", async () => {
  const env = { CORS_ALLOW_ORIGINS: "https://app.example.com,https://studio.example.com" };
  const allowReq = new Request("https://example.com/api/test", {
    headers: { origin: "https://app.example.com" }
  });
  const denyReq = new Request("https://example.com/api/test", {
    headers: { origin: "https://evil.example.com" }
  });

  expect(isOriginAllowed(allowReq, env)).toBeTruthy();
  expect(isOriginAllowed(denyReq, env)).toBeFalsy();
  expect(rejectDisallowedOrigin(denyReq, env)?.status).toBe(403);

  const preflight = corsOptions("POST, OPTIONS", allowReq, env);
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get("access-control-allow-origin")).toBe("https://app.example.com");
});

test("provider baseUrl allowlist and ssrf guard block unsafe personal endpoints", async () => {
  const base = {
    provider: "fal" as const,
    mode: "personal" as const,
    apiKey: "Key test",
    prompt: "a test prompt",
    mediaType: "image" as const
  };

  const httpLocal = await submitGeneration({}, { ...base, baseUrl: "http://127.0.0.1:8000" });
  expect(httpLocal.ok).toBeFalsy();
  expect(httpLocal.error).toBe("https_required");

  const httpsLocal = await submitGeneration({}, { ...base, baseUrl: "https://127.0.0.1" });
  expect(httpsLocal.ok).toBeFalsy();
  expect(httpsLocal.error).toBe("disallowed_base_host");

  const notAllowlisted = await submitGeneration({}, { ...base, baseUrl: "https://evil.example.com" });
  expect(notAllowlisted.ok).toBeFalsy();
  expect(notAllowlisted.error).toBe("base_host_not_allowlisted");
});

test("paddle webhook remains disabled with stable response", async () => {
  const request = new Request("https://example.com/api/paddle/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event_id: "evt_dedup_1" })
  });

  const resp = await paddleWebhookPost(makeContext(request, { DB: createMockDb() }));
  const payload = await resp.json() as { ok?: boolean; message?: string };
  expect(resp.status).toBe(200);
  expect(payload.ok).toBeTruthy();
  expect(payload.message).toBe("paddle_disabled");
});
