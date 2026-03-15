/**
 * Template Asset Pipeline v1 - Render Videos (runway)
 * Reads template list, uses first-frame or template image, calls runway, saves videos + logs
 */

import path from "node:path";
import { writeFile } from "node:fs/promises";
import { loadConfig } from "./config";
import {
  buildProjectAndPrompt,
  selectPhaseATemplates,
  ensureDir,
  saveJson,
  loadJson,
  simpleHash,
  type AssetManifestEntry,
} from "./shared";

const RUNWAY_BASE = "https://api.dev.runwayml.com";
const RUNWAY_VERSION = "2024-11-06";

async function submitRunway(
  prompt: string,
  apiKey: string,
  model: string,
  ratio: string,
  duration: number,
  promptImage?: string
): Promise<{ taskId?: string; error?: string }> {
  const endpoint = promptImage ? "/v1/image_to_video" : "/v1/text_to_video";
  const url = `${RUNWAY_BASE}${endpoint}`;
  const payload: Record<string, unknown> = {
    model,
    ratio,
    duration,
  };
  if (promptImage) {
    payload.promptImage = promptImage;
  } else {
    payload.promptText = prompt;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": RUNWAY_VERSION,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) {
    return { error: String(body?.error ?? body?.message ?? `HTTP ${res.status}`) };
  }
  const taskId = body?.id;
  return taskId ? { taskId } : { error: "No task id in response" };
}

async function pollRunwayStatus(
  taskId: string,
  apiKey: string
): Promise<{ status: string; outputUrl?: string; error?: string }> {
  const url = `${RUNWAY_BASE}/v1/tasks/${taskId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": RUNWAY_VERSION,
    },
  });
  const body = await res.json();
  if (!res.ok) {
    return { status: "FAILED", error: String(body?.error ?? body?.message ?? `HTTP ${res.status}`) };
  }
  const status = String(body?.status ?? "").toUpperCase();
  const output = body?.output;
  const outputUrl = Array.isArray(output) ? output[0] : typeof output === "string" ? output : output?.url;
  return { status, outputUrl };
}

async function downloadVideo(url: string, destPath: string): Promise<boolean> {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await ensureDir(path.dirname(destPath));
  await writeFile(destPath, buf);
  return true;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  if (!cfg.runwayKey) {
    console.error("RUNWAY_API_KEY required. Set in .env or .env.local");
    process.exit(1);
  }

  const batchSize = parseInt(process.argv[2] ?? "3", 10) || 3;
  const retryBatch = process.env.TEMPLATE_ASSETS_RETRY_BATCH?.split(",").filter(Boolean);
  const { video: phaseIds } = selectPhaseATemplates();
  const templateIds = retryBatch?.length ? retryBatch : phaseIds;
  const toRun = templateIds.slice(0, Math.min(batchSize, templateIds.length));

  const videosDir = path.join(cfg.artifactsDir, "videos");
  const logsDir = path.join(cfg.artifactsDir, "logs");
  const manifestPath = path.join(cfg.artifactsDir, "manifests", "video-manifest.json");
  const imageManifestPath = path.join(cfg.artifactsDir, "manifests", "image-manifest.json");

  const existingManifest = await loadJson<AssetManifestEntry[]>(manifestPath);
  const imageManifest = await loadJson<AssetManifestEntry[]>(imageManifestPath);
  const byTemplate = new Map<string, AssetManifestEntry>(
    (existingManifest ?? []).map((e) => [e.templateId, e])
  );

  const firstFrameByTemplate = new Map<string, string>();
  for (const e of imageManifest ?? []) {
    if (e.status === "success" && e.assetPath) {
      firstFrameByTemplate.set(e.templateId, e.assetPath);
    }
  }

  await ensureDir(videosDir);
  await ensureDir(logsDir);

  for (let i = 0; i < toRun.length; i++) {
    const templateId = toRun[i];
    const existing = byTemplate.get(templateId);
    if (existing?.status === "success" && existing.assetPath) {
      console.log(`[${i + 1}/${toRun.length}] ${templateId} - skip (already success)`);
      continue;
    }

    const built = await buildProjectAndPrompt(templateId, "runway", "en");
    if (!built) {
      console.error(`[${i + 1}/${toRun.length}] ${templateId} - build prompt failed`);
      byTemplate.set(templateId, {
        templateId,
        familyId: templateId.split("_")[1] ?? "",
        variantId: templateId.split("_")[2] ?? "",
        mediaType: "video",
        platformId: "runway",
        promptText: "",
        status: "failed",
        retryCount: existing?.retryCount ?? 0,
        error: "build_failed",
      });
      continue;
    }

    const promptHash = simpleHash(built.prompt);
    const firstFramePath = firstFrameByTemplate.get(templateId);
    // V1: Runway image_to_video expects URL; local files → use text_to_video
    const promptImage: string | undefined = undefined;

    const { taskId, error: submitError } = await submitRunway(
      built.prompt,
      cfg.runwayKey,
      cfg.videoModel,
      cfg.videoRatio,
      cfg.videoDuration,
      promptImage
    );

    if (submitError || !taskId) {
      byTemplate.set(templateId, {
        templateId,
        familyId: built.project.meta?.currentTemplate?.familyId ?? "",
        variantId: built.project.meta?.currentTemplate?.variantId ?? "",
        mediaType: "video",
        platformId: "runway",
        engineId: built.engineId,
        promptHash,
        promptText: built.prompt,
        status: "failed",
        retryCount: existing?.retryCount ?? 0,
        error: submitError ?? "submit_failed",
        firstFramePath: firstFramePath ?? undefined,
      });
      console.log(`[${i + 1}/${toRun.length}] ${templateId} - failed: ${submitError}`);
      continue;
    }

    let status: AssetManifestEntry["status"] = "pending";
    let outputUrl: string | undefined;
    for (let poll = 0; poll < 60; poll++) {
      await sleep(5000);
      const { status: s, outputUrl: url } = await pollRunwayStatus(taskId, cfg.runwayKey);
      if (s === "SUCCEEDED" && url) {
        status = "success";
        outputUrl = url;
        break;
      }
      if (s === "FAILED") {
        status = "failed";
        break;
      }
    }

    const runId = `${templateId.replace(/[^a-zA-Z0-9_-]/g, "-")}_${promptHash}`;
    const videoPath = path.join(videosDir, `${runId}.mp4`);
    const logPath = path.join(logsDir, `video_${runId}.json`);

    let assetPath: string | undefined;
    if (outputUrl) {
      const ok = await downloadVideo(outputUrl, videoPath);
      assetPath = ok ? videoPath : undefined;
      if (!ok) status = "failed";
    }

    const entry: AssetManifestEntry = {
      templateId,
      familyId: built.project.meta?.currentTemplate?.familyId ?? "",
      variantId: built.project.meta?.currentTemplate?.variantId ?? "",
      mediaType: "video",
      platformId: "runway",
      engineId: built.engineId,
      promptHash,
      promptText: built.prompt,
      assetPath,
      firstFramePath: firstFramePath ?? undefined,
      status,
      retryCount: existing?.retryCount ?? 0,
      durationSec: cfg.videoDuration,
      fileSizeBytes: assetPath ? (await import("node:fs")).statSync(assetPath).size : undefined,
    };

    byTemplate.set(templateId, entry);

    await saveJson(logPath, {
      templateId,
      taskId,
      prompt: built.prompt,
      promptHash,
      status,
      outputUrl: outputUrl ?? null,
      timestamp: new Date().toISOString(),
    });

    console.log(`[${i + 1}/${toRun.length}] ${templateId} - ${status}${assetPath ? ` ${assetPath}` : ""}`);
  }

  const manifest = Array.from(byTemplate.values());
  await ensureDir(path.dirname(manifestPath));
  await saveJson(manifestPath, manifest);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
