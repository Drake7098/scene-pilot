/**
 * Template Asset Pipeline v1 - Render Images (fal)
 * Reads template list, builds prompt via existing pipeline, calls fal, saves images + logs
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

const FAL_BASE = "https://queue.fal.run";

async function callFal(
  prompt: string,
  apiKey: string,
  model: string,
  imageSize: string
): Promise<{ imageUrl?: string; error?: string }> {
  const url = `${FAL_BASE}/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, image_size: imageSize, num_images: 1, output_format: "png" }),
  });
  const body = await res.json();
  if (!res.ok) {
    return { error: String(body?.error ?? body?.detail ?? `HTTP ${res.status}`) };
  }
  const img = body?.images?.[0] ?? body?.image;
  const imageUrl = typeof img === "string" ? img : img?.url;
  return imageUrl ? { imageUrl } : { error: "No image in response" };
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await ensureDir(path.dirname(destPath));
  await writeFile(destPath, buf);
  return true;
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  if (!cfg.falKey) {
    console.error("FAL_KEY required. Set in .env or .env.local");
    process.exit(1);
  }

  const batchSize = parseInt(process.argv[2] ?? String(cfg.batchSize), 10) || 10;
  const retryBatch = process.env.TEMPLATE_ASSETS_RETRY_BATCH?.split(",").filter(Boolean);
  const { image: phaseIds } = selectPhaseATemplates();
  const templateIds = retryBatch?.length ? retryBatch : phaseIds;
  const toRun = templateIds.slice(0, Math.min(batchSize, templateIds.length));

  const imagesDir = path.join(cfg.artifactsDir, "images");
  const logsDir = path.join(cfg.artifactsDir, "logs");
  const manifestPath = path.join(cfg.artifactsDir, "manifests", "image-manifest.json");
  const existingManifest = await loadJson<AssetManifestEntry[]>(manifestPath);
  const byTemplate = new Map<string, AssetManifestEntry>(
    (existingManifest ?? []).map((e) => [e.templateId, e])
  );

  await ensureDir(imagesDir);
  await ensureDir(logsDir);

  for (let i = 0; i < toRun.length; i++) {
    const templateId = toRun[i];
    const existing = byTemplate.get(templateId);
    if (existing?.status === "success" && existing.assetPath) {
      console.log(`[${i + 1}/${toRun.length}] ${templateId} - skip (already success)`);
      continue;
    }

    const built = await buildProjectAndPrompt(templateId, "fal", "en");
    if (!built) {
      console.error(`[${i + 1}/${toRun.length}] ${templateId} - build prompt failed`);
      byTemplate.set(templateId, {
        templateId,
        familyId: templateId.split("_")[1] ?? "",
        variantId: templateId.split("_")[2] ?? "",
        mediaType: "image",
        platformId: "fal",
        promptText: "",
        status: "failed",
        retryCount: existing?.retryCount ?? 0,
        error: "build_failed",
      });
      continue;
    }

    const promptHash = simpleHash(built.prompt);
    const { imageUrl, error } = await callFal(
      built.prompt,
      cfg.falKey,
      cfg.imageModel,
      cfg.imageSize
    );

    const runId = `${templateId.replace(/[^a-zA-Z0-9_-]/g, "-")}_${promptHash}`;
    const imagePath = path.join(imagesDir, `${runId}.png`);
    const logPath = path.join(logsDir, `${runId}.json`);

    let status: AssetManifestEntry["status"] = "failed";
    let assetPath: string | undefined;

    if (imageUrl) {
      const ok = await downloadImage(imageUrl, imagePath);
      status = ok ? "success" : "failed";
      assetPath = ok ? imagePath : undefined;
    }

    const entry: AssetManifestEntry = {
      templateId,
      familyId: built.project.meta?.currentTemplate?.familyId ?? "",
      variantId: built.project.meta?.currentTemplate?.variantId ?? "",
      mediaType: "image",
      platformId: "fal",
      engineId: built.engineId,
      promptHash,
      promptText: built.prompt,
      assetPath,
      status,
      retryCount: existing?.retryCount ?? 0,
      error: error ?? (status === "failed" ? "download_failed" : undefined),
      fileSizeBytes: assetPath ? (await import("node:fs")).statSync(assetPath).size : undefined,
    };

    byTemplate.set(templateId, entry);

    await saveJson(logPath, {
      templateId,
      prompt: built.prompt,
      promptHash,
      imageUrl: imageUrl ?? null,
      status,
      error: entry.error,
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
