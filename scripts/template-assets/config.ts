/**
 * Template Asset Pipeline v1 - Config
 * Uses .env / .env.local for FAL_KEY, RUNWAY_API_KEY
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(rootDir: string): void {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(rootDir, name);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

export type PipelineConfig = {
  rootDir: string;
  artifactsDir: string;
  falKey: string;
  runwayKey: string;
  batchSize: number;
  retryLimit: number;
  platformId: "fal" | "runway";
  imageModel: string;
  videoModel: string;
  imageSize: string;
  videoDuration: number;
  videoRatio: string;
};

export function loadConfig(rootDir = process.cwd()): PipelineConfig {
  loadDotEnv(rootDir);

  const artifactsDir =
    process.env.TEMPLATE_ASSETS_ARTIFACTS ||
    path.join(rootDir, "artifacts", "template-assets");

  return {
    rootDir,
    artifactsDir,
    falKey: process.env.FAL_KEY ?? "",
    runwayKey: process.env.RUNWAY_API_KEY ?? "",
    batchSize: Math.min(50, Math.max(1, parseInt(process.env.TEMPLATE_ASSETS_BATCH ?? "10", 10))),
    retryLimit: Math.min(5, Math.max(0, parseInt(process.env.TEMPLATE_ASSETS_RETRY ?? "2", 10))),
    platformId: (process.env.TEMPLATE_ASSETS_PLATFORM as "fal" | "runway") || "fal",
    imageModel: process.env.FAL_IMAGE_MODEL ?? "fal-ai/flux/dev",
    videoModel: process.env.RUNWAY_VIDEO_MODEL ?? "gen4_turbo",
    imageSize: process.env.TEMPLATE_ASSETS_IMAGE_SIZE ?? "landscape_16_9",
    videoDuration: parseInt(process.env.TEMPLATE_ASSETS_VIDEO_DURATION ?? "5", 10) || 5,
    videoRatio: process.env.TEMPLATE_ASSETS_VIDEO_RATIO ?? "16:9",
  };
}
