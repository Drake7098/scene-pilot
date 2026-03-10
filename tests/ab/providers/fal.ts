import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadAbEnv } from "../config/env.js";
import { durationToFrames, ensureDir, requestJson, resolutionToSizePreset, saveJson, sleep, type ProviderAdapter, type RunInput, type RunOutput } from "./base.js";

const QUEUE_BASE = "https://queue.fal.run";

function buildFalInput(input: RunInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...(input.defaultInput ?? {}),
    prompt: input.prompt
  };

  if (input.taskType === "image") {
    payload.image_size = resolutionToSizePreset(input.resolution);
  } else {
    payload.num_frames = durationToFrames(input.durationSec ?? 5, 15);
    if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
  }

  if (input.referenceImages?.length) {
    payload.image_url = input.referenceImages[0];
    payload.images = input.referenceImages;
  }
  return payload;
}

function extractOutputUrls(result: unknown): string[] {
  if (!result || typeof result !== "object") return [];
  const obj = result as Record<string, unknown>;
  if (typeof obj.video?.toString === "function" && typeof obj.video === "string") return [obj.video];
  if (typeof obj.image?.toString === "function" && typeof obj.image === "string") return [obj.image];
  if (Array.isArray(obj.images)) {
    return obj.images.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") return [(item as Record<string, string>).url];
      return [];
    });
  }
  if (Array.isArray(obj.data)) {
    return obj.data.flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") return [(item as Record<string, string>).url];
      return [];
    });
  }
  return [];
}

export class FalAdapter implements ProviderAdapter {
  name = "fal" as const;

  async run(input: RunInput): Promise<RunOutput> {
    const env = loadAbEnv();
    if (!env.falKey) throw new Error("Missing FAL_KEY");

    const startedAt = Date.now();
    const runId = `${input.taskId}__${input.provider}__${input.promptMode}`;
    const rawResponsePath = path.join(input.outputRootDir, "raw", input.taskType === "image" ? "images" : "videos", `${runId}.json`);
    const mediaDir = path.join(input.outputRootDir, "media", input.taskType, runId);
    await ensureDir(mediaDir);

    const submit = await requestJson(`${QUEUE_BASE}/${input.endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${env.falKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildFalInput(input))
    }) as Record<string, unknown>;

    const statusUrl = typeof submit.status_url === "string"
      ? submit.status_url
      : `${QUEUE_BASE}/${input.endpoint}/requests/${String(submit.request_id ?? "")}/status`;
    const resultUrl = typeof submit.response_url === "string"
      ? submit.response_url
      : `${QUEUE_BASE}/${input.endpoint}/requests/${String(submit.request_id ?? "")}`;

    let status = submit;
    while (["IN_QUEUE", "IN_PROGRESS"].includes(String(status.status ?? ""))) {
      await sleep(3_000);
      status = await requestJson(statusUrl, {
        method: "GET",
        headers: { Authorization: `Key ${env.falKey}` }
      }) as Record<string, unknown>;
    }

    const success = String(status.status ?? "") === "COMPLETED";
    const result = success
      ? await requestJson(resultUrl, {
          method: "GET",
          headers: { Authorization: `Key ${env.falKey}` }
        }) as Record<string, unknown>
      : status;

    const outputUrls = extractOutputUrls(result.data ?? result);
    const savedFiles: string[] = [];
    for (let index = 0; index < outputUrls.length; index += 1) {
      const url = outputUrls[index];
      const ext = input.taskType === "image" ? ".png" : ".mp4";
      const filePath = path.join(mediaDir, `${String(index + 1).padStart(2, "0")}${ext}`);
      const response = await fetch(url);
      if (!response.ok) continue;
      const arrayBuffer = await response.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));
      savedFiles.push(filePath);
    }

    await saveJson(rawResponsePath, { submit, status, result });

    return {
      taskId: input.taskId,
      taskType: input.taskType,
      provider: input.provider,
      endpoint: input.endpoint,
      promptMode: input.promptMode,
      success,
      costUsdEstimate: input.estimatedCostUsd,
      latencyMs: Date.now() - startedAt,
      outputUrls,
      savedFiles,
      rawResponsePath,
      createdAt: new Date().toISOString(),
      title: input.title,
      prompt: input.prompt,
      errorMessage: success ? undefined : String((status.error as string | undefined) ?? "fal request failed")
    };
  }
}
