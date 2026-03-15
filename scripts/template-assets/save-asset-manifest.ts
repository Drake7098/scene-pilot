/**
 * Template Asset Pipeline v1 - Save Asset Manifest
 * Outputs unified manifest with templateId, asset path, score, platform, engine, status
 */

import path from "node:path";
import { loadConfig } from "./config";
import { loadJson, ensureDir, saveJson, type AssetManifestEntry } from "./shared";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const manifestsDir = path.join(cfg.artifactsDir, "manifests");
  const imageManifest = await loadJson<AssetManifestEntry[]>(
    path.join(manifestsDir, "image-manifest.json")
  );
  const videoManifest = await loadJson<AssetManifestEntry[]>(
    path.join(manifestsDir, "video-manifest.json")
  );
  const scored = await loadJson<AssetManifestEntry[]>(
    path.join(manifestsDir, "scored-manifest.json")
  );

  const byId = new Map<string, AssetManifestEntry>();
  for (const e of imageManifest ?? []) {
    byId.set(e.templateId, e);
  }
  for (const e of videoManifest ?? []) {
    byId.set(e.templateId, e);
  }
  for (const e of scored ?? []) {
    const cur = byId.get(e.templateId);
    if (cur) byId.set(e.templateId, { ...cur, score: e.score });
  }

  const unified = Array.from(byId.values()).map((e) => ({
    templateId: e.templateId,
    familyId: e.familyId,
    variantId: e.variantId,
    mediaType: e.mediaType,
    platformId: e.platformId,
    engineId: e.engineId,
    exportMode: "prompt",
    promptHash: e.promptHash,
    assetPath: e.assetPath,
    thumbnailPath: e.thumbnailPath,
    firstFramePath: e.firstFramePath,
    status: e.status,
    retryCount: e.retryCount ?? 0,
    score: e.score,
    selected: e.selected,
    rejected: e.rejected,
    error: e.error,
    durationSec: e.durationSec,
    width: e.width,
    height: e.height,
    fileSizeBytes: e.fileSizeBytes,
  }));

  const outPath = path.join(manifestsDir, "asset-manifest-unified.json");
  await ensureDir(manifestsDir);
  await saveJson(outPath, unified);

  const successImages = unified.filter((e) => e.mediaType === "image" && e.status === "success");
  const successVideos = unified.filter((e) => e.mediaType === "video" && e.status === "success");

  console.log("Unified manifest:", outPath);
  console.log("Image batch:", successImages.length);
  console.log("Video batch:", successVideos.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
