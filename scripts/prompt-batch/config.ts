/**
 * Prompt Batch Test v1 - Config
 * Uses .env for overrides
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

import type { ApplyTemplateMode } from "../../src/template-engine/types/filter";

export type PlatformPresetId = string;

export type PromptBatchConfig = {
  rootDir: string;
  artifactsDir: string;
  batchSize: number;
  repeatCount: number;
  applyMode: ApplyTemplateMode;
  platformId: PlatformPresetId;
  mediaMode: "image" | "video" | "all";
  exportMode: "prompt_only" | "package";
  lang: "zh" | "en";
};

export function loadConfig(rootDir = process.cwd()): PromptBatchConfig {
  loadDotEnv(rootDir);

  const artifactsDir =
    process.env.PROMPT_BATCH_ARTIFACTS ||
    path.join(rootDir, "artifacts", "prompt-batch");

  return {
    rootDir,
    artifactsDir,
    batchSize: Math.min(500, Math.max(1, parseInt(process.env.PROMPT_BATCH_SIZE ?? "20", 10))),
    repeatCount: Math.min(10, Math.max(1, parseInt(process.env.PROMPT_BATCH_REPEAT ?? "3", 10))),
    applyMode: (process.env.PROMPT_BATCH_APPLY_MODE as ApplyTemplateMode) || "layout_plus_style",
    platformId: (process.env.PROMPT_BATCH_PLATFORM ?? "fal") as PlatformPresetId,
    mediaMode: (process.env.PROMPT_BATCH_MEDIA as "image" | "video" | "all") || "all",
    exportMode: (process.env.PROMPT_BATCH_EXPORT_MODE as "prompt_only" | "package") || "prompt_only",
    lang: (process.env.PROMPT_BATCH_LANG as "zh" | "en") || "en",
  };
}
