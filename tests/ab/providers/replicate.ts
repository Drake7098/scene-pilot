import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadAbEnv } from "../config/env.js";
import { ensureDir, requestJson, saveJson, sleep, type ProviderAdapter, type RunInput, type RunOutput } from "./base.js";

const API_BASE = "https://api.replicate.com/v1";

function buildReplicateInput(input: RunInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...(input.defaultInput ?? {}),
    prompt: input.prompt
  };

  if (input.taskType === "image") {
    if (input.resolution && !("megapixels" in payload)) payload.megapixels = 1;
    if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
  } else {
    if (input.durationSec) payload.duration = input.durationSec;
    if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
  }

  if (input.referenceImages?.length) {
    payload.input_images = input.referenceImages;
    payload.image = input.referenceImages[0];
  }
  return payload;
}

function extractUrls(output: unknown): string[] {
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) return output.filter((item): item is string => typeof item === "string");
  if (output && typeof output === "object") {
    const maybe = output as Record<string, unknown>;
    if (typeof maybe.url === "string") return [maybe.url];
    if (typeof maybe.output === "string") return [maybe.output];
  }
  return [];
}

export class ReplicateAdapter implements ProviderAdapter {
  name = "replicate" as const;

  async run(input: RunInput): Promise<RunOutput> {
    const env = loadAbEnv();
    if (!env.replicateApiToken) throw new Error("Missing REPLICATE_API_TOKEN");

    const startedAt = Date.now();
    const runId = `${input.taskId}__${input.provider}__${input.promptMode}`;
    const rawResponsePath = path.join(input.outputRootDir, "raw", input.taskType === "image" ? "images" : "videos", `${runId}.json`);
    const mediaDir = path.join(input.outputRootDir, "media", input.taskType, runId);
    await ensureDir(mediaDir);

    const prediction = await requestJson(`${API_BASE}/models/${input.endpoint}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.replicateApiToken}`,
        "Content-Type": "application/json",
        Prefer: "wait=1"
      },
      body: JSON.stringify({ input: buildReplicateInput(input) })
    }) as Record<string, unknown>;

    let current = prediction;
    const predictionId = String(prediction.id ?? "");
    while (current.status === "starting" || current.status === "processing") {
      await sleep(2_500);
      current = await requestJson(`${API_BASE}/predictions/${predictionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${env.replicateApiToken}` }
      }) as Record<string, unknown>;
    }

    const success = current.status === "succeeded";
    const outputUrls = extractUrls(current.output);
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

    await saveJson(rawResponsePath, current);

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
      errorMessage: success ? undefined : String(current.error ?? current.detail ?? "Replicate prediction failed")
    };
  }
}
