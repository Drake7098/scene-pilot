/**
 * Template Asset Pipeline v1 - Score Assets
 * Basic auto-scoring: file exists, size ok, resolution, prompt present, etc.
 */

import path from "node:path";
import { statSync, existsSync } from "node:fs";
import { loadConfig } from "./config";
import { loadJson, ensureDir, saveJson, type AssetManifestEntry } from "./shared";

const MIN_IMAGE_BYTES = 10_000;
const MAX_IMAGE_BYTES = 50_000_000;
const MIN_VIDEO_BYTES = 50_000;
const MAX_VIDEO_BYTES = 200_000_000;
const MIN_IMAGE_DIM = 256;
const MIN_VIDEO_DIM = 256;

function scoreImage(entry: AssetManifestEntry): number {
  let score = 0;
  if (entry.status === "success") score += 2;
  if (entry.promptText && entry.promptText.length > 10) score += 1;
  if (entry.assetPath && existsSync(entry.assetPath)) {
    score += 2;
    try {
      const st = statSync(entry.assetPath);
      if (st.size >= MIN_IMAGE_BYTES && st.size <= MAX_IMAGE_BYTES) score += 1;
    } catch {
      score -= 1;
    }
  } else {
    score -= 2;
  }
  return Math.max(0, score);
}

function scoreVideo(entry: AssetManifestEntry): number {
  let score = 0;
  if (entry.status === "success") score += 2;
  if (entry.promptText && entry.promptText.length > 10) score += 1;
  if (entry.assetPath && existsSync(entry.assetPath)) {
    score += 2;
    try {
      const st = statSync(entry.assetPath);
      if (st.size >= MIN_VIDEO_BYTES && st.size <= MAX_VIDEO_BYTES) score += 1;
    } catch {
      score -= 1;
    }
  } else {
    score -= 2;
  }
  if (entry.durationSec && entry.durationSec >= 3) score += 1;
  if (entry.firstFramePath) score += 0.5;
  return Math.max(0, score);
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const manifestsDir = path.join(cfg.artifactsDir, "manifests");
  const imageManifest = await loadJson<AssetManifestEntry[]>(
    path.join(manifestsDir, "image-manifest.json")
  );
  const videoManifest = await loadJson<AssetManifestEntry[]>(
    path.join(manifestsDir, "video-manifest.json")
  );

  const scored: AssetManifestEntry[] = [];

  for (const e of imageManifest ?? []) {
    scored.push({ ...e, score: scoreImage(e) });
  }
  for (const e of videoManifest ?? []) {
    scored.push({ ...e, score: scoreVideo(e) });
  }

  const byType = { image: scored.filter((x) => x.mediaType === "image"), video: scored.filter((x) => x.mediaType === "video") };
  const outPath = path.join(manifestsDir, "scored-manifest.json");
  await ensureDir(manifestsDir);
  await saveJson(outPath, scored);

  const topImages = byType.image.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 10);
  const topVideos = byType.video.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 5);

  console.log("Scored manifest:", outPath);
  console.log("Top images:", topImages.map((x) => `${x.templateId} score=${x.score}`).join(", "));
  console.log("Top videos:", topVideos.map((x) => `${x.templateId} score=${x.score}`).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
