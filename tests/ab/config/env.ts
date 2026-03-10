import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type AbEnv = {
  replicateApiToken: string;
  falKey: string;
  rootDir: string;
};

function loadDotEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function loadAbEnv(rootDir = process.cwd()): AbEnv {
  const candidates = [
    path.join(rootDir, ".env.local"),
    path.join(rootDir, ".env"),
    path.join(rootDir, "tests/ab/.env.local"),
    path.join(rootDir, "tests/ab/.env")
  ];

  for (const filePath of candidates) loadDotEnvFile(filePath);

  return {
    replicateApiToken: process.env.REPLICATE_API_TOKEN ?? "",
    falKey: process.env.FAL_KEY ?? "",
    rootDir
  };
}
