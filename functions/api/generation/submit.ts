import type { ProviderSubmitBody } from "../_shared/provider-gateway";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";
import { buildRequestRateLimitKey, enforceRateLimit } from "../_shared/rate-limit";
import { createUpstashClient } from "../../_lib/upstashRedis";
import { hasSupabaseAdmin, supabaseAdminRequest } from "../_shared/supabase-admin";
import { loadWalletState, reserveCreditsForGeneration } from "../_shared/credits-service";

type GenerationJob = {
  id: string;
  userId: string;
  tier: "pro" | "free";
  queueKey: "queue:pro" | "queue:free";
  status: "queued" | "running" | "done" | "failed";
  retries: number;
  creditsCost: number;
  reserveEntryId: string;
  createdAt: string;
  updatedAt: string;
  payload: ProviderSubmitBody;
  error?: string;
  output?: unknown;
  providerTaskId?: string;
  queuePosition?: number;
};

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

function nowIso() {
  return new Date().toISOString();
}

function jobKey(jobId: string) {
  return `spx:gen:job:${jobId}`;
}

function userQueuedKey(userId: string) {
  return `spx:gen:user:${userId}:queued`;
}

function userRunningKey(userId: string) {
  return `spx:gen:user:${userId}:running`;
}

async function resolveTier(env: any, userId: string): Promise<"pro" | "free"> {
  if (hasSupabaseAdmin(env)) {
    const res = await supabaseAdminRequest<Array<{ tier: string }>>(
      env,
      `/rest/v1/users_profile?id=eq.${encodeURIComponent(userId)}&select=tier&limit=1`
    );
    const tier = String(res.data?.[0]?.tier || "free").toLowerCase();
    return tier === "pro" ? "pro" : "free";
  }
  if (!env?.DB) return "free";
  const row = await env.DB
    .prepare(`SELECT tier FROM users_profile WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ tier: string }>();
  return String(row?.tier || "free").toLowerCase() === "pro" ? "pro" : "free";
}

function resolveCreditsCost(body: ProviderSubmitBody): number {
  const requested = Number((body as any).creditsCost ?? 0);
  if (Number.isFinite(requested) && requested > 0) return Math.max(1, Math.round(requested));
  return body.mediaType === "video" ? 30 : 6;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as ProviderSubmitBody;
    if (!body.userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;

    const limiter = await enforceRateLimit(context.env?.DB, {
      key: await buildRequestRateLimitKey(
        context.request,
        "generation_submit",
        [body.userId, body.provider || "fal", body.mediaType || "image"]
      ),
      limit: envInt(context.env, "GENERATION_SUBMIT_LIMIT_PER_MIN", 30, 1, 300),
      windowSeconds: 60
    });
    if (!limiter.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: limiter.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const redis = createUpstashClient(context.env);
    const userId = String(body.userId || "").trim();
    const tier = await resolveTier(context.env, userId);
    const wallet = await loadWalletState(context.env, userId);
    const creditsCost = resolveCreditsCost(body);
    if (wallet.creditsBalance < creditsCost) {
      return json({
        ok: false,
        error: "insufficient_credits",
        need: creditsCost,
        have: wallet.creditsBalance
      }, 402, context.request, context.env);
    }

    const maxRunning = tier === "pro" ? 2 : 1;
    const maxQueue = tier === "pro" ? 5 : 2;
    const running = Number(await redis.get(userRunningKey(userId)) || 0);
    const queued = Number(await redis.get(userQueuedKey(userId)) || 0);
    if (running >= maxRunning || queued >= maxQueue) {
      return json({
        ok: false,
        error: "queue_limit_exceeded",
        message: "当前任务较多，请稍后再试",
        tier,
        running,
        queued
      }, 429, context.request, context.env);
    }

    const idempotencyKey = `genq_submit_${crypto.randomUUID()}`;
    const reserve = await reserveCreditsForGeneration(
      context.env,
      userId,
      creditsCost,
      "generation_queue_submit",
      idempotencyKey,
      { provider: body.provider || "fal", mediaType: body.mediaType || "image" }
    );

    const queueKey: "queue:pro" | "queue:free" = tier === "pro" ? "queue:pro" : "queue:free";
    const jobId = `job_${crypto.randomUUID()}`;
    const createdAt = nowIso();
    const job: GenerationJob = {
      id: jobId,
      userId,
      tier,
      queueKey,
      status: "queued",
      retries: 0,
      creditsCost,
      reserveEntryId: reserve.entryId,
      createdAt,
      updatedAt: createdAt,
      payload: body
    };

    const queuedLen = await redis.lpush(queueKey, jobId);
    await redis.incr(userQueuedKey(userId));
    await redis.set(jobKey(jobId), JSON.stringify(job), 60 * 60 * 24);

    return json({
      ok: true,
      provider: body.provider || "fal",
      mode: body.mode || "platform",
      mediaType: body.mediaType || "image",
      taskId: jobId,
      status: "queued",
      queuePosition: Math.max(0, queuedLen - 1),
      queuedAhead: Math.max(0, queuedLen - 1)
    }, 200, context.request, context.env);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
