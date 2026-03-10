import { spawnSync } from "node:child_process";

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit", cwd: process.cwd(), env: process.env });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

run("npx", [
  "playwright",
  "test",
  "-c",
  "tests/robots/playwright.config.ts",
  "tests/robots/scenarios/prompt-ab-offline.spec.ts"
]);
run("node", ["tests/robots/scripts/render-prompt-ab-report.mjs"]);
