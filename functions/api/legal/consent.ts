import { requireApiAuth } from "../_shared/auth";
import { ensureBillingTables } from "../_shared/billing-db";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { buildRequestRateLimitKey, enforceRateLimit } from "../_shared/rate-limit";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";

type LegalConsentBody = {
  userId?: string;
  context?: string;
  docs?: string[];
  documentVersions?: Record<string, string>;
  locale?: string;
  source?: string;
  acceptedAt?: string;
};

const ALLOWED_DOCS = new Set(["terms", "privacy", "billing", "refund"]);

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function normalizeAcceptedAt(input: string | undefined) {
  const raw = String(input || "").trim();
  if (!raw) return new Date().toISOString();
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function pickIp(request: Request) {
  const forwarded = String(request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "";
  return String(request.headers.get("cf-connecting-ip") || forwarded || "").trim();
}

async function sha256Hex(input: string) {
  const text = String(input || "").trim();
  if (!text) return null;
  const payload = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeBody(body: LegalConsentBody) {
  const userId = String(body.userId || "").trim();
  const context = String(body.context || "").trim().slice(0, 64);
  const source = String(body.source || "").trim().slice(0, 64);
  const locale = String(body.locale || "en").trim().slice(0, 24);
  const acceptedAt = normalizeAcceptedAt(body.acceptedAt);
  const docs = Array.isArray(body.docs)
    ? body.docs
        .map((item) => String(item || "").trim())
        .filter((item) => ALLOWED_DOCS.has(item))
    : [];
  const uniqueDocs = Array.from(new Set(docs));
  const docVersions = body.documentVersions && typeof body.documentVersions === "object"
    ? Object.fromEntries(
        Object.entries(body.documentVersions)
          .filter(([docId, version]) => ALLOWED_DOCS.has(docId) && String(version || "").trim())
          .map(([docId, version]) => [docId, String(version).trim().slice(0, 32)])
      )
    : {};
  return { userId, context, source, locale, acceptedAt, docs: uniqueDocs, documentVersions: docVersions };
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;

    const body = await context.request.json() as LegalConsentBody;
    const normalized = normalizeBody(body);
    if (!normalized.userId || !normalized.context || !normalized.source || !normalized.docs.length) {
      return json({ error: "invalid_consent_payload" }, 400, context.request, context.env);
    }

    const authErr = await requireApiAuth(context, { claimedUserId: normalized.userId });
    if (authErr) return authErr;
    const limiter = await enforceRateLimit(context.env?.DB, {
      key: await buildRequestRateLimitKey(context.request, "legal_consent", [normalized.userId, normalized.context, normalized.source]),
      limit: envInt(context.env, "LEGAL_CONSENT_LIMIT_PER_10M", 40, 1, 300),
      windowSeconds: 600
    });
    if (!limiter.ok) {
      return json({
        error: "too_many_requests",
        retryAfterSeconds: limiter.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const ipHash = await sha256Hex(pickIp(context.request));
    const uaHash = await sha256Hex(String(context.request.headers.get("user-agent") || ""));
    const consentId = crypto.randomUUID();

    if (hasSupabaseAdmin(context.env)) {
      if (!isUuidLike(normalized.userId)) {
        return json({ error: "invalid_user_id" }, 400, context.request, context.env);
      }
      const inserted = await supabaseAdminRequest(
        context.env,
        "/rest/v1/legal_consents",
        {
          method: "POST",
          headers: { prefer: "return=minimal" },
          body: {
            id: consentId,
            user_id: normalized.userId,
            consent_context: normalized.context,
            docs: normalized.docs,
            document_versions: normalized.documentVersions,
            locale: normalized.locale,
            source: normalized.source,
            accepted_at: normalized.acceptedAt,
            ip_hash: ipHash,
            ua_hash: uaHash
          }
        }
      );
      if (!inserted.ok) {
        return json({
          error: inserted.errorCode || "legal_consent_insert_failed",
          message: inserted.errorMessage || ""
        }, 500, context.request, context.env);
      }
      return json({ ok: true, consentId, stored: "supabase" }, 200, context.request, context.env);
    }

    if (!context.env?.DB) {
      return json({ error: "db_not_configured" }, 500, context.request, context.env);
    }

    await ensureBillingTables(context.env.DB);
    const now = new Date().toISOString();
    const id = makeId("consent");
    await context.env.DB.prepare(`
      INSERT INTO legal_consents (
        id, user_id, consent_context, docs_json, versions_json, locale, source,
        accepted_at, ip_hash, ua_hash, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        normalized.userId,
        normalized.context,
        JSON.stringify(normalized.docs),
        JSON.stringify(normalized.documentVersions),
        normalized.locale,
        normalized.source,
        normalized.acceptedAt,
        ipHash,
        uaHash,
        now
      )
      .run();

    return json({ ok: true, consentId: id, stored: "d1" }, 200, context.request, context.env);
  } catch (error) {
    return json({
      error: "legal_consent_error",
      message: error instanceof Error ? error.message : String(error)
    }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
