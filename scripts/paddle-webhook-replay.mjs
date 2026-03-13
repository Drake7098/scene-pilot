import { createHmac, randomUUID } from "node:crypto";

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function nowTs() {
  return `${Math.floor(Date.now() / 1000)}`;
}

function buildSignature(secret, ts, rawBody) {
  return createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
}

async function postWebhook(baseUrl, webhookSecret, body, ts) {
  const rawBody = JSON.stringify(body);
  const h1 = buildSignature(webhookSecret, ts, rawBody);
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/paddle/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paddle-signature": `ts=${ts};h1=${h1}`
    },
    body: rawBody
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

function usage() {
  console.log("Usage:");
  console.log("APP_URL=https://scene-pilot-12y.pages.dev PADDLE_WEBHOOK_SECRET=... npm run paddle:webhook:replay");
}

async function main() {
  const appUrl = env("APP_URL");
  const webhookSecret = env("PADDLE_WEBHOOK_SECRET");
  if (!appUrl || !webhookSecret) {
    usage();
    process.exit(1);
  }

  const eventId = env("PADDLE_REPLAY_EVENT_ID", `evt_replay_${randomUUID()}`);
  const userId = env("PADDLE_REPLAY_USER_ID", "00000000-0000-4000-8000-000000000001");
  const productId = env("PADDLE_REPLAY_PRODUCT_ID", "pro_monthly");
  const eventType = env("PADDLE_REPLAY_EVENT_TYPE", "transaction.completed");
  const totalCents = Number(env("PADDLE_REPLAY_TOTAL_CENTS", "1200")) || 1200;
  const ts = nowTs();

  const body = {
    event_id: eventId,
    event_type: eventType,
    data: {
      id: `txn_${eventId}`,
      custom_data: {
        userId,
        productId
      },
      details: {
        totals: {
          grand_total: totalCents
        }
      },
      currency_code: "USD"
    }
  };

  const first = await postWebhook(appUrl, webhookSecret, body, ts);
  const second = await postWebhook(appUrl, webhookSecret, body, ts);

  console.log(JSON.stringify({
    eventId,
    first,
    second
  }, null, 2));

  const firstOk = first.status >= 200 && first.status < 300 && first.payload?.ok;
  const secondDedup = second.status >= 200 && second.status < 300 && second.payload?.dedup === true;
  if (!firstOk || !secondDedup) {
    console.error("Replay check failed: expected first ok and second dedup=true.");
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

