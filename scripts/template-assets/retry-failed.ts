/**
 * Template Asset Pipeline v1 - Retry Failed
 * Re-runs render-images / render-videos for failed or low-score entries
 */

import path from "node:path";
import { loadConfig } from "./config";
import { loadJson, type AssetManifestEntry } from "./shared";
import { execSync } from "node:child_process";

async function main(): Promise<void> {
  const cfg = loadConfig();
  const manifestsDir = path.join(cfg.artifactsDir, "manifests");
  const scoredPath = path.join(manifestsDir, "scored-manifest.json");
  const scored = await loadJson<AssetManifestEntry[]>(scoredPath);

  if (!scored?.length) {
    console.log("No scored manifest. Run score-assets first.");
    return;
  }

  const failedImages = scored.filter(
    (e) => e.mediaType === "image" && (e.status !== "success" || (e.score ?? 0) < 3)
  );
  const failedVideos = scored.filter(
    (e) => e.mediaType === "video" && (e.status !== "success" || (e.score ?? 0) < 3)
  );

  const retryLimit = cfg.retryLimit;
  const toRetryImages = failedImages.filter((e) => (e.retryCount ?? 0) < retryLimit);
  const toRetryVideos = failedVideos.filter((e) => (e.retryCount ?? 0) < retryLimit);

  if (toRetryImages.length > 0) {
    console.log(`Retrying ${toRetryImages.length} failed images...`);
    const ids = toRetryImages.map((e) => e.templateId).join(",");
    execSync(`npx tsx scripts/template-assets/render-images.ts ${toRetryImages.length}`, {
      stdio: "inherit",
      env: { ...process.env, TEMPLATE_ASSETS_RETRY_BATCH: ids },
    });
  }

  if (toRetryVideos.length > 0) {
    console.log(`Retrying ${toRetryVideos.length} failed videos...`);
    const ids = toRetryVideos.map((e) => e.templateId).join(",");
    execSync(`npx tsx scripts/template-assets/render-videos.ts ${toRetryVideos.length}`, {
      stdio: "inherit",
      env: { ...process.env, TEMPLATE_ASSETS_RETRY_BATCH: ids },
    });
  }

  if (toRetryImages.length === 0 && toRetryVideos.length === 0) {
    console.log("Nothing to retry (all success or at retry limit).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
