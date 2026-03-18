import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const lockPath = path.join(root, "docs", "engine-library-lock.json");

const engineFiles = [
  "src/utils/prompt.ts",
  "src/utils/promptEngine.ts",
  "src/utils/promptPipeline.ts",
  "src/utils/sceneStrategyResolver.ts",
  "src/utils/structureDraft.ts",
  "src/utils/structureDraftGenerator.ts",
  "src/utils/structureDraftRules.ts",
  "src/utils/structureDraftToCanvas.ts",
  "src/utils/promptEngines/builtin.ts",
  "src/utils/promptEngines/index.ts",
  "src/utils/promptEngines/shared.ts",
  "src/utils/promptEngines/types.ts"
].sort();

const engineRegistry = {
  quick: {
    image: "IM v5",
    video: "VI V5"
  },
  pro: {
    image: "IM V5P",
    video: "VI V5P"
  }
};

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

async function computeSnapshot() {
  const fileHashes = {};
  for (const rel of engineFiles) {
    const abs = path.join(root, rel);
    const content = await readFile(abs, "utf8");
    fileHashes[rel] = sha256(content);
  }
  const lockSource = engineFiles.map((file) => `${file}:${fileHashes[file]}`).join("\n");
  const lockHash = sha256(lockSource);
  return {
    workspace: "ScenePilot",
    generatedAt: new Date().toISOString(),
    engineRegistry,
    engineFiles,
    fileHashes,
    lockHash
  };
}

async function readLockFile() {
  try {
    const raw = await readFile(lockPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function diffFiles(locked = {}, current = {}) {
  return engineFiles.filter((file) => locked[file] !== current[file]);
}

async function run() {
  const mode = process.argv.includes("--update")
    ? "update"
    : process.argv.includes("--print")
      ? "print"
      : "check";

  const current = await computeSnapshot();

  if (mode === "update") {
    await writeFile(lockPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
    console.log(`[engine-lock] updated: ${lockPath}`);
    console.log(`[engine-lock] lockHash: ${current.lockHash}`);
    return;
  }

  const locked = await readLockFile();
  if (!locked) {
    console.error("[engine-lock] missing docs/engine-library-lock.json");
    console.error("[engine-lock] run: npm run engine:lock:update");
    process.exitCode = 2;
    return;
  }

  const changedFiles = diffFiles(locked.fileHashes, current.fileHashes);
  const ok = locked.lockHash === current.lockHash;

  if (mode === "print") {
    console.log(JSON.stringify({
      lockPath: "docs/engine-library-lock.json",
      lockedHash: locked.lockHash,
      currentHash: current.lockHash,
      inSync: ok,
      changedFiles
    }, null, 2));
    return;
  }

  if (!ok) {
    console.error("[engine-lock] engine library changed but lock is stale.");
    console.error(`[engine-lock] locked:  ${locked.lockHash}`);
    console.error(`[engine-lock] current: ${current.lockHash}`);
    if (changedFiles.length) {
      console.error(`[engine-lock] changed files (${changedFiles.length}):`);
      for (const file of changedFiles) console.error(`- ${file}`);
    }
    console.error("[engine-lock] required actions:");
    console.error("1) npm run engine:lock:update");
    console.error("2) update docs/live-development-strategy.md (prompt engine section)");
    process.exitCode = 2;
    return;
  }

  console.log(`[engine-lock] OK ${current.lockHash}`);
}

void run();
