import { corsOptions, json, rejectDisallowedOrigin } from "../_shared/http";
import { createUpstashClient } from "../../_lib/upstashRedis";
import { getGenerationStatus, submitGeneration, type ProviderSubmitBody } from "../_shared/provider-gateway";
import { finalizeReservedCredits, rollbackReservedCredits } from "../_shared/credits-service";

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

function nowIso() {
  return new Date().toISOString();
}

function envInt(env: any, key: string, fallback: number, min: number, max: number) {
  const raw = Number(env?.[key] || fallback);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
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
function globalRunningKey() {
  return "spx:gen:running:global";
}

function isDoneStatus(status: string) {
  const s = status.toLowerCase();
  return s === "completed" || s === "succeeded" || s === "done";
}
function isFailedStatus(status: string) {
  const s = status.toLowerCase();
  return s === "failed" || s === "canceled" || s === "cancelled" || s === "error";
}

async function runSingleJob(env: any, job: GenerationJob): Promise<GenerationJob> {
  const submitted = await submitGeneration(env, job.payload);
  if (!submitted.ok || !submitted.taskId) {
    throw new Error(submitted.error || "submit_failed");
  }
  let latestStatus = String(submitted.status || "queued");
  let latestOutput: unknown = submitted.output ?? submitted.raw;
  const started = Date.now();
  const maxWaitMs = envInt(env, "GENERATION_WORKER_MAX_WAIT_MS", 240_000, 10_000, 900_000);
  while (Date.now() - started < maxWaitMs) {
    if (isDoneStatus(latestStatus)) {
      return {
        ...job,
        status: "done",
        providerTaskId: submitted.taskId,
        output: latestOutput,
        updatedAt: nowIso()
      };
    }
    if (isFailedStatus(latestStatus)) {
      throw new Error(typeof (latestOutput as any)?.error === "string" ? (latestOutput as any).error : "provider_failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const status = await getGenerationStatus(env, { ...job.payload, taskId: submitted.taskId });
    latestStatus = String(status.status || latestStatus);
    latestOutput = status.output ?? status.raw ?? latestOutput;
    if (!status.ok && isFailedStatus(latestStatus)) {
      throw new Error(status.error || "provider_failed");
    }
  }
  throw new Error("generation_timeout");
}

async function processOne(env: any): Promise<"processed" | "empty"> {
  const redis = createUpstashClient(env);
  const jobId = await redis.rpop("queue:pro") || await redis.rpop("queue:free");
  if (!jobId) return "empty";

  const raw = await redis.get(jobKey(jobId));
  if (!raw) return "empty";
  const job = JSON.parse(raw) as GenerationJob;
  if (job.status !== "queued") return "empty";

  await redis.decr(userQueuedKey(job.userId));
  await redis.incr(userRunningKey(job.userId));
  await redis.incr(globalRunningKey());

  const runningJob: GenerationJob = {
    ...job,
    status: "running",
    updatedAt: nowIso()
  };
  await redis.set(jobKey(job.id), JSON.stringify(runningJob), 60 * 60 * 24);

  try {
    const doneJob = await runSingleJob(env, runningJob);
    await finalizeReservedCredits(env, doneJob.userId, doneJob.reserveEntryId);
    await redis.set(jobKey(doneJob.id), JSON.stringify(doneJob), 60 * 60 * 24);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const canRetry = runningJob.retries < 1;
    if (canRetry) {
      const retryJob: GenerationJob = {
        ...runningJob,
        status: "queued",
        retries: runningJob.retries + 1,
        error: reason,
        updatedAt: nowIso()
      };
      await redis.lpush(retryJob.queueKey, retryJob.id);
      await redis.incr(userQueuedKey(retryJob.userId));
      await redis.set(jobKey(retryJob.id), JSON.stringify(retryJob), 60 * 60 * 24);
    } else {
      await rollbackReservedCredits(
        env,
        runningJob.userId,
        runningJob.reserveEntryId,
        `genq_rollback_${runningJob.id}`,
        "generation_queue_failed",
        { error: reason }
      );
      const failedJob: GenerationJob = {
        ...runningJob,
        status: "failed",
        error: reason,
        updatedAt: nowIso()
      };
      await redis.set(jobKey(failedJob.id), JSON.stringify(failedJob), 60 * 60 * 24);
    }
  } finally {
    await redis.decr(userRunningKey(job.userId));
    await redis.decr(globalRunningKey());
  }

  return "processed";
}

function ensureWorkerAuthorized(request: Request, env: any) {
  const expected = String(env?.GENERATION_WORKER_TOKEN || "").trim();
  if (!expected) return true;
  const token = String(request.headers.get("x-worker-token") || "").trim();
  return token && token === expected;
}

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const originErr = rejectDisallowedOrigin(context.request, context.env);
    if (originErr) return originErr;
    if (!ensureWorkerAuthorized(context.request, context.env)) {
      return json({ ok: false, error: "unauthorized_worker" }, 401, context.request, context.env);
    }

    const redis = createUpstashClient(context.env);
    const maxConcurrent = envInt(context.env, "GENERATION_MAX_CONCURRENT", 5, 1, 100);
    const maxJobsPerTick = envInt(context.env, "GENERATION_WORKER_MAX_JOBS_PER_TICK", 3, 1, 20);
    const runningGlobal = Number(await redis.get(globalRunningKey()) || 0);
    const available = Math.max(0, maxConcurrent - runningGlobal);
    const toProcess = Math.min(maxJobsPerTick, available);

    let processed = 0;
    for (let i = 0; i < toProcess; i += 1) {
      const outcome = await processOne(context.env);
      if (outcome === "empty") break;
      processed += 1;
    }

    return json({
      ok: true,
      processed,
      runningGlobal: Number(await redis.get(globalRunningKey()) || 0),
      proQueue: await redis.llen("queue:pro"),
      freeQueue: await redis.llen("queue:free")
    }, 200, context.request, context.env);
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500, context.request, context.env);
  }
};

export const onRequestOptions: PagesFunction = async (context) => corsOptions("POST, OPTIONS", context.request, context.env);

