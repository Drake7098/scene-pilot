#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = path.resolve(__dirname, "../docs/development-tracker.json");

function parseArgs(argv) {
  const out = {
    target: "prod",
    allowDirty: false,
    allowParallel: false,
    allowBranchMismatch: false,
    json: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "");
    const next = String(argv[i + 1] || "");
    if (token === "--target" && next) {
      out.target = next;
      i += 1;
      continue;
    }
    if (token.startsWith("--target=")) {
      out.target = token.slice("--target=".length) || out.target;
      continue;
    }
    if (token === "--allow-dirty") out.allowDirty = true;
    if (token === "--allow-parallel") out.allowParallel = true;
    if (token === "--allow-branch-mismatch") out.allowBranchMismatch = true;
    if (token === "--json") out.json = true;
  }
  if (!["prod", "test"].includes(out.target)) out.target = "prod";
  return out;
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) return { items: [] };
  try {
    return JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
  } catch {
    return { items: [] };
  }
}

function truthyString(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tracker = loadTracker();
  const gitBranchRaw = run("git branch --show-current");
  const gitStatusRaw = run("git status --porcelain");
  const gitBranch = typeof gitBranchRaw === "string" ? gitBranchRaw : "";
  const gitStatus = typeof gitStatusRaw === "string" ? gitStatusRaw : "";
  const dirtyFiles = gitStatus
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const inProgressStatuses = new Set(["active", "testing", "blocked"]);
  const releaseTags = new Set(["release", "infra", "auth", "billing", "dns", "prod"]);
  const blockingParallel = (Array.isArray(tracker.items) ? tracker.items : [])
    .filter((item) => inProgressStatuses.has(String(item?.status || "")))
    .filter((item) => ["p0", "p1"].includes(String(item?.priority || "")))
    .filter((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags.map((v) => String(v || "").toLowerCase()) : [];
      return !tags.some((tag) => releaseTags.has(tag));
    })
    .map((item) => ({
      id: String(item.id || ""),
      title: String(item.title || ""),
      status: String(item.status || ""),
      priority: String(item.priority || ""),
      workspace: String(item.workspace || "")
    }));

  const expectedBranch = args.target === "prod" ? "main" : "develop";
  const blocking = [];
  const warnings = [];

  if (gitBranch && gitBranch !== expectedBranch && !args.allowBranchMismatch) {
    blocking.push(`branch_mismatch:${gitBranch}->expected:${expectedBranch}`);
  }
  if (dirtyFiles.length && !args.allowDirty) {
    blocking.push(`dirty_worktree:${dirtyFiles.length}`);
  }
  if (blockingParallel.length && !args.allowParallel) {
    blocking.push(`parallel_active_tasks:${blockingParallel.length}`);
  }

  if (dirtyFiles.length) {
    warnings.push(`working_tree_dirty_files=${dirtyFiles.length}`);
  }
  if (blockingParallel.length) {
    warnings.push(`parallel_threads_active=${blockingParallel.length}`);
  }

  const envHints = {
    API_AUTH_STRICT: process.env.API_AUTH_STRICT || "",
    BILLING_ENABLED: process.env.BILLING_ENABLED || "",
    VITE_BILLING_ENABLED: process.env.VITE_BILLING_ENABLED || "",
    VITE_AUTH_MOCK_FALLBACK: process.env.VITE_AUTH_MOCK_FALLBACK || ""
  };
  if (args.target === "prod" && envHints.VITE_AUTH_MOCK_FALLBACK && truthyString(envHints.VITE_AUTH_MOCK_FALLBACK)) {
    blocking.push("prod_auth_mock_fallback_enabled");
  }

  const result = {
    ok: blocking.length === 0,
    target: args.target,
    expectedBranch,
    branch: gitBranch,
    dirtyFilesCount: dirtyFiles.length,
    dirtyFiles: dirtyFiles.slice(0, 40),
    parallelActiveTasks: blockingParallel,
    blocking,
    warnings,
    envHints
  };

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[release-readiness] target=${result.target} branch=${result.branch || "-"} expected=${result.expectedBranch}`);
    console.log(`[release-readiness] dirty=${result.dirtyFilesCount} parallelActive=${result.parallelActiveTasks.length}`);
    if (result.parallelActiveTasks.length) {
      for (const item of result.parallelActiveTasks) {
        console.log(`- parallel: ${item.id} ${item.priority}/${item.workspace} [${item.status}] ${item.title}`);
      }
    }
    if (result.blocking.length) {
      console.log("[release-readiness] BLOCKED");
      for (const item of result.blocking) console.log(`- ${item}`);
    } else {
      console.log("[release-readiness] PASS");
    }
  }

  if (!result.ok) process.exit(2);
}

main();
