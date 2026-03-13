#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {
    target: "prod",
    appUrl: "",
    skipReadiness: false,
    skipEnvCheck: false,
    skipSmoke: false,
    allowParallel: false,
    allowDirty: false,
    allowBranchMismatch: false
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
    if (token === "--app-url" && next) {
      out.appUrl = next;
      i += 1;
      continue;
    }
    if (token.startsWith("--app-url=")) {
      out.appUrl = token.slice("--app-url=".length) || out.appUrl;
      continue;
    }
    if (token === "--skip-readiness") out.skipReadiness = true;
    if (token === "--skip-env-check") out.skipEnvCheck = true;
    if (token === "--skip-smoke") out.skipSmoke = true;
    if (token === "--allow-parallel") out.allowParallel = true;
    if (token === "--allow-dirty") out.allowDirty = true;
    if (token === "--allow-branch-mismatch") out.allowBranchMismatch = true;
  }
  if (!["test", "prod"].includes(out.target)) out.target = "prod";
  return out;
}

function runStep(label, command, args, options = {}) {
  console.log(`\n[release-orchestrate] ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...(options.env || {}) },
    shell: false
  });
  const code = Number(result.status ?? 1);
  if (code !== 0) {
    console.error(`[release-orchestrate] FAILED at step: ${label}`);
    process.exit(code || 1);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetAppUrl = args.appUrl || (args.target === "test" ? "https://scene-pilot-12y.pages.dev" : "https://www.scenepilotix.com");

  console.log(JSON.stringify({
    target: args.target,
    appUrl: targetAppUrl,
    skipReadiness: args.skipReadiness,
    skipEnvCheck: args.skipEnvCheck,
    skipSmoke: args.skipSmoke
  }, null, 2));

  if (!args.skipReadiness) {
    const readinessArgs = ["run", "release:readiness", "--", "--target", args.target];
    if (args.allowParallel) readinessArgs.push("--allow-parallel");
    if (args.allowDirty) readinessArgs.push("--allow-dirty");
    if (args.allowBranchMismatch) readinessArgs.push("--allow-branch-mismatch");
    runStep("Release readiness", "npm", readinessArgs);
  }

  if (!args.skipEnvCheck) {
    runStep("Env check", "npm", ["run", "check:env:release"]);
  }

  if (!args.skipSmoke) {
    runStep(
      "Smoke release",
      "npm",
      ["run", "smoke:release"],
      { env: { APP_URL: targetAppUrl } }
    );
  }

  console.log(`\n[release-orchestrate] PASS target=${args.target} appUrl=${targetAppUrl}`);
}

main();
