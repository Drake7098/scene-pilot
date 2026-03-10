import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProviderName, TaskType } from "../config/endpoints.js";

export type RunInput = {
  taskId: string;
  taskType: TaskType;
  provider: ProviderName;
  endpoint: string;
  promptMode: "plain" | "structured";
  prompt: string;
  title: string;
  resolution?: string;
  durationSec?: number;
  aspectRatio?: string;
  referenceImages?: string[];
  outputRootDir: string;
  estimatedCostUsd: number;
  defaultInput?: Record<string, unknown>;
};

export type RunOutput = {
  taskId: string;
  taskType: TaskType;
  provider: ProviderName;
  endpoint: string;
  promptMode: "plain" | "structured";
  success: boolean;
  costUsdEstimate: number;
  latencyMs: number;
  outputUrls: string[];
  savedFiles: string[];
  rawResponsePath: string;
  createdAt: string;
  title: string;
  prompt: string;
  errorMessage?: string;
};

export interface ProviderAdapter {
  name: ProviderName;
  run(input: RunInput): Promise<RunOutput>;
}

export function sanitizeFilePart(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export function createRunId(input: RunInput): string {
  return `${sanitizeFilePart(input.taskId)}__${sanitizeFilePart(input.provider)}__${sanitizeFilePart(input.endpoint)}__${input.promptMode}`;
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function requestJson(url: string, init: RequestInit, timeoutMs = 120_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveJson(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function resolutionToSizePreset(resolution?: string): string {
  if (!resolution) return "square_hd";
  if (/^1024x1024$/i.test(resolution)) return "square_hd";
  if (/^1024x1536$/i.test(resolution)) return "portrait_4_3";
  if (/^1536x1024$/i.test(resolution)) return "landscape_4_3";
  if (/^1280x720$/i.test(resolution) || /^1920x1080$/i.test(resolution)) return "landscape_16_9";
  if (/^720x1280$/i.test(resolution) || /^1080x1920$/i.test(resolution)) return "portrait_16_9";
  return "square_hd";
}

export function durationToFrames(durationSec = 5, fps = 15): number {
  return Math.max(fps, Math.round(durationSec * fps));
}
