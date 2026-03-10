import path from "node:path";
import { readdir, stat } from "node:fs/promises";

const IMAGE_NAME_RE = /^(.+)__(plain|structured)__seed(\d+)\.(png|jpg|jpeg|webp)$/i;

export type DrawImageHit = {
  absPath: string;
  filename: string;
  mtimeMs: number;
};

async function safeReaddir(dirPath: string): Promise<import("node:fs").Dirent[]> {
  try {
    return await readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function walkForImages(dirPath: string, depth: number, hits: DrawImageHit[]): Promise<void> {
  if (depth < 0) return;
  const entries = await safeReaddir(dirPath);
  for (const entry of entries) {
    const absPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkForImages(absPath, depth - 1, hits);
      continue;
    }
    if (!entry.isFile() || !IMAGE_NAME_RE.test(entry.name)) continue;
    const info = await stat(absPath).catch(() => null);
    hits.push({
      absPath,
      filename: entry.name,
      mtimeMs: info?.mtimeMs ?? 0
    });
  }
}

export async function findDrawThingsImages(candidateDirs: string[]): Promise<{ sourceDir: string | null; files: DrawImageHit[] }> {
  const dirs = [...new Set(candidateDirs.filter(Boolean))];
  let bestDir: string | null = null;
  let bestFiles: DrawImageHit[] = [];

  for (const dirPath of dirs) {
    const files: DrawImageHit[] = [];
    await walkForImages(dirPath, 3, files);
    files.sort((a, b) => b.mtimeMs - a.mtimeMs);
    if (files.length > bestFiles.length) {
      bestDir = dirPath;
      bestFiles = files;
    }
  }
  return { sourceDir: bestDir, files: bestFiles };
}

export async function resolveDrawThingsImageCandidates(rootDir: string): Promise<string[]> {
  const homeDir = process.env.HOME ?? "";
  const localRawDir = path.join(rootDir, "tests/local-ab/outputs/raw/drawthings/images");
  const reportDir = homeDir ? path.join(homeDir, "Downloads") : "";
  const appDownloads = homeDir
    ? path.join(homeDir, "Library/Containers/com.liuliu.draw-things/Data/Documents/Downloads")
    : "";
  const explicit = process.env.DRAWTHINGS_IMAGE_DIR ?? "";

  const candidates = [
    explicit,
    localRawDir,
    appDownloads,
    reportDir
  ].filter(Boolean);

  if (!reportDir) return candidates;
  const entries = await safeReaddir(reportDir);
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("scenepilot_ab_report_")) continue;
    candidates.push(path.join(reportDir, entry.name, "data/raw/drawthings/images"));
    candidates.push(path.join(reportDir, entry.name, "data/raw/drawthings"));
  }
  return [...new Set(candidates)];
}

export function getDrawThingsAppDownloadsDir(): string {
  const homeDir = process.env.HOME ?? "";
  return path.join(homeDir, "Library/Containers/com.liuliu.draw-things/Data/Documents/Downloads");
}
