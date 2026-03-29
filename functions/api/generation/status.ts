import { getGenerationStatus, type ProviderSubmitBody } from "../_shared/provider-gateway";
import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { requireApiAuth } from "../_shared/auth";
import { buildRequestRateLimitKey, enforceRateLimit } from "../_shared/rate-limit";
import { createUpstashClient } from "../../_lib/upstashRedis";

type StatusBody = ProviderSubmitBody & { taskId?: string };

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    const body = await context.request.json() as StatusBody;
    if (!body.userId) return json({ ok: false, error: "missing_user_id" }, 400, context.request, context.env);
    const authErr = await requireApiAuth(context, { claimedUserId: body.userId });
    if (authErr) return authErr;

    const limiter = await enforceRateLimit(context.env?.DB, {
      key: await buildRequestRateLimitKey(context.request, "generation_status", [body.userId, body.provider || "fal"]),
      limit: envInt(context.env, "GENERATION_STATUS_LIMIT_PER_MIN", 180, 1, 2000),
      windowSeconds: 60
    });
    if (!limiter.ok) {
      return json({
        ok: false,
        error: "too_many_requests",
        retryAfterSeconds: limiter.retryAfterSeconds
      }, 429, context.request, context.env);
    }

    const taskId = String(body.taskId || "").trim();
    if (taskId.startsWith("job_")) {
      const redis = createUpstashClient(context.env);
      const raw = await redis.get(`spx:gen:job:${taskId}`);
      if (!raw) {
        return json({
          ok: false,
          provider: body.provider || "fal",
          mode: body.mode || "platform",
          mediaType: body.mediaType || "image",
          taskId,
          error: "job_not_found"
        }, 404, context.request, context.env);
      }
      const job = JSON.parse(raw) as {
        status: "queued" | "running" | "done" | "failed";
        queueKey: "queue:pro" | "queue:free";
        output?: unknown;
        error?: string;
      };
      const queueIndex = job.status === "queued" ? await redis.lpos(job.queueKey, taskId) : null;
      const queuedAhead = queueIndex !== null ? Math.max(0, queueIndex) : 0;
      return json({
        ok: job.status !== "failed",
        provider: body.provider || "fal",
        mode: body.mode || "platform",
        mediaType: body.mediaType || "image",
        taskId,
        status: job.status,
        queuePosition: queueIndex !== null ? queueIndex + 1 : undefined,
        queuedAhead,
        output: job.output,
        error: job.error
      }, 200, context.request, context.env);
    }

    const result = await getGenerationStatus(context.env, body);
    return json(result, result.ok ? 200 : 400, context.request, context.env);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);
