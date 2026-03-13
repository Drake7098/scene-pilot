type PaddleSignatureVerifyOptions = {
  maxAgeSeconds?: number;
  maxFutureSkewSeconds?: number;
  nowMs?: number;
};

function parseSignatureHeader(header: string) {
  const map = new Map<string, string[]>();
  const parts = header.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key || !value) continue;
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
  }
  return map;
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return hex(signature);
}

export async function verifyPaddleWebhookSignatureWithOptions(
  request: Request,
  rawBody: string,
  secret: string,
  options: PaddleSignatureVerifyOptions = {}
) {
  const signatureHeader = request.headers.get("paddle-signature") || request.headers.get("Paddle-Signature") || "";
  if (!signatureHeader.trim()) return false;
  const parsed = parseSignatureHeader(signatureHeader);
  const ts = (parsed.get("ts") ?? [])[0] || "";
  const hashes = [...(parsed.get("h1") ?? []), ...(parsed.get("v1") ?? [])].map((value) => value.toLowerCase());
  if (!ts || !hashes.length) return false;

  const tsSeconds = Number(ts);
  if (!Number.isFinite(tsSeconds) || tsSeconds <= 0) return false;
  const nowSeconds = Math.floor((Number.isFinite(options.nowMs) ? Number(options.nowMs) : Date.now()) / 1000);
  const maxAgeSeconds = Number.isFinite(options.maxAgeSeconds) ? Math.max(30, Math.floor(Number(options.maxAgeSeconds))) : 300;
  const maxFutureSkewSeconds = Number.isFinite(options.maxFutureSkewSeconds)
    ? Math.max(0, Math.floor(Number(options.maxFutureSkewSeconds)))
    : 60;
  if (tsSeconds < nowSeconds - maxAgeSeconds) return false;
  if (tsSeconds > nowSeconds + maxFutureSkewSeconds) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const computed = await hmacSha256(secret, signedPayload);
  return hashes.some((candidate) => timingSafeEqual(candidate, computed));
}

export async function verifyPaddleWebhookSignature(request: Request, rawBody: string, secret: string) {
  return verifyPaddleWebhookSignatureWithOptions(request, rawBody, secret);
}
