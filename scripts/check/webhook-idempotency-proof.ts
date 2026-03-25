import assert from "node:assert/strict";
import { onRequestPost as paddleWebhookPost } from "../../functions/api/paddle/webhook";

type PaymentEvent = { id: string; status: string; eventId: string };
type Wallet = { credit_balance: number; lifetime_credits_purchased: number };
type Ledger = { idempotencyKey: string; credits: number };

function makeContext(request: Request, env: Record<string, unknown>) {
  return { request, env } as unknown as EventContext<any, any, any>;
}

function createProofDb() {
  const paymentEvents = new Map<string, PaymentEvent>();
  const wallets = new Map<string, Wallet>();
  const ledgers: Ledger[] = [];
  const products = new Map<string, { code: string; kind: string; credits_amount: number | null; monthly_credit_grant: number | null }>();
  products.set("pack_3", { code: "pack_3", kind: "credit_pack", credits_amount: 150, monthly_credit_grant: null });

  const state = {
    grantCount: 0,
    eventCount: () => paymentEvents.size,
    walletBalance: (userId: string) => wallets.get(userId)?.credit_balance ?? 0,
    eventStatus: (eventId: string) => paymentEvents.get(eventId)?.status ?? ""
  };

  const db = {
    prepare(sql: string) {
      const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
      return {
        bind(...args: unknown[]) {
          return {
            async first() {
              if (normalized.includes("select id, status from payment_events where provider_event_id = ?")) {
                const eventId = String(args[0] || "");
                const row = paymentEvents.get(eventId);
                return row ? { id: row.id, status: row.status } : null;
              }
              if (normalized.includes("select code, kind, credits_amount, monthly_credit_grant from products")) {
                const code = String(args[0] || "");
                return products.get(code) || null;
              }
              if (normalized.includes("select id from credit_ledger where idempotency_key = ?")) {
                const idk = String(args[0] || "");
                const hit = ledgers.find((x) => x.idempotencyKey === idk);
                return hit ? { id: "ledger_existing" } : null;
              }
              if (normalized.includes("select credit_balance, lifetime_credits_purchased from wallets where user_id = ?")) {
                const userId = String(args[0] || "");
                const wallet = wallets.get(userId) || { credit_balance: 0, lifetime_credits_purchased: 0 };
                wallets.set(userId, wallet);
                return wallet;
              }
              return null;
            },
            async run() {
              if (normalized.includes("insert into payment_events")) {
                const id = String(args[0] || "");
                const eventId = String(args[1] || "");
                if (paymentEvents.has(eventId)) {
                  throw new Error("UNIQUE constraint failed: payment_events.provider_event_id");
                }
                paymentEvents.set(eventId, { id, status: "received", eventId });
                return { success: true };
              }
              if (normalized.includes("update payment_events set status = 'processed'")) {
                const id = String(args[1] || "");
                for (const row of paymentEvents.values()) {
                  if (row.id === id) row.status = "processed";
                }
                return { success: true };
              }
              if (normalized.includes("update payment_events set status = 'failed'")) {
                const id = String(args[2] || "");
                for (const row of paymentEvents.values()) {
                  if (row.id === id) row.status = "failed";
                }
                return { success: true };
              }
              if (normalized.includes("insert into users_profile")) {
                return { success: true };
              }
              if (normalized.includes("insert into wallets")) {
                const userId = String(args[0] || "");
                if (!wallets.has(userId)) wallets.set(userId, { credit_balance: 0, lifetime_credits_purchased: 0 });
                return { success: true };
              }
              if (normalized.includes("update wallets set credit_balance = ?, lifetime_credits_purchased = ?")) {
                const nextBalance = Number(args[0] || 0);
                const nextPurchased = Number(args[1] || 0);
                const userId = String(args[3] || "");
                wallets.set(userId, { credit_balance: nextBalance, lifetime_credits_purchased: nextPurchased });
                return { success: true };
              }
              if (normalized.includes("insert into credit_ledger")) {
                const credits = Number(args[3] || 0);
                const idempotencyKey = String(args[5] || "");
                if (!ledgers.some((x) => x.idempotencyKey === idempotencyKey)) {
                  ledgers.push({ idempotencyKey, credits });
                  state.grantCount += 1;
                }
                return { success: true };
              }
              return { success: true };
            },
            async all() {
              return { results: [] };
            }
          };
        }
      };
    },
    async batch(_items: unknown[]) {
      return [];
    }
  };

  return { db: db as unknown as D1Database, state };
}

async function hmacSha256Hex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signed)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  const webhookSecret = "whsec_test";
  const userId = "user_webhook_proof";
  const body = JSON.stringify({
    event_id: "evt_webhook_proof_1",
    event_type: "transaction.completed",
    data: {
      id: "txn_webhook_proof_1",
      custom_data: { userId, productId: "pack_3" },
      details: { totals: { grand_total: 300 } },
      currency_code: "USD"
    }
  });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await hmacSha256Hex(webhookSecret, `${ts}:${body}`);
  const requestFactory = () =>
    new Request("https://example.com/api/paddle/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "paddle-signature": `ts=${ts};h1=${sig}`
      },
      body
    });

  const { db, state } = createProofDb();
  const env = { DB: db, PADDLE_WEBHOOK_SECRET: webhookSecret };

  const first = await paddleWebhookPost(makeContext(requestFactory(), env));
  const firstPayload = await first.json() as { ok?: boolean; dedup?: boolean };
  assert.equal(first.status, 200);
  assert.equal(Boolean(firstPayload.ok), true);
  assert.equal(Boolean(firstPayload.dedup), false);

  const grantAfterFirst = state.grantCount;
  const balanceAfterFirst = state.walletBalance(userId);
  assert.equal(grantAfterFirst, 1);
  assert.equal(balanceAfterFirst, 150);
  assert.equal(state.eventStatus("evt_webhook_proof_1"), "processed");

  const second = await paddleWebhookPost(makeContext(requestFactory(), env));
  const secondPayload = await second.json() as { ok?: boolean; dedup?: boolean };
  assert.equal(second.status, 200);
  assert.equal(Boolean(secondPayload.ok), true);
  assert.equal(Boolean(secondPayload.dedup), true);

  assert.equal(state.grantCount, grantAfterFirst);
  assert.equal(state.walletBalance(userId), balanceAfterFirst);
  assert.equal(state.eventCount(), 1);

  console.log("[webhook-idempotency-proof] PASS first=processed duplicate=dedup replay=no_double_mutation");
}

void main();
