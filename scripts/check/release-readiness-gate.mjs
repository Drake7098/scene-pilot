#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const passthroughArgs = process.argv.slice(2);

const child = spawnSync(
  process.execPath,
  ["scripts/release-readiness.mjs", ...passthroughArgs],
  {
    stdio: "inherit",
    env: process.env,
    shell: false
  }
);

const code = Number(child.status ?? 1);

if (code === 0) {
  console.log("[release:readiness] PASS");
  process.exit(0);
}

console.error("[release:readiness] FAIL");
console.error("[release:readiness] 未通过不可发版");
process.exit(code || 1);
