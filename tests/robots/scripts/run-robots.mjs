import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve("tests/robots");
const artifactsDir = path.join(root, "artifacts");
const runStatePath = path.join(artifactsDir, "run-state.json");

fs.mkdirSync(artifactsDir, { recursive: true });

const startedAt = new Date().toISOString();
fs.writeFileSync(
  runStatePath,
  JSON.stringify(
    {
      status: "running",
      startedAt,
      finishedAt: null,
      exitCode: null,
    },
    null,
    2,
  ) + "\n",
);

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "-c", "tests/robots/playwright.config.ts"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code) => {
  const finishedAt = new Date().toISOString();
  fs.writeFileSync(
    runStatePath,
    JSON.stringify(
      {
        status: code === 0 ? "passed" : "failed",
        startedAt,
        finishedAt,
        exitCode: code ?? 1,
      },
      null,
      2,
    ) + "\n",
  );

  const summary = spawn(process.execPath, ["tests/robots/scripts/generate-summary.mjs"], {
    stdio: "inherit",
    env: process.env,
  });

  summary.on("exit", () => {
    const gate = spawn(process.execPath, ["tests/robots/scripts/assert-gates.mjs"], {
      stdio: "inherit",
      env: process.env,
    });

    gate.on("exit", (gateCode) => {
      const testCode = code ?? 1;
      const finalCode = testCode !== 0 ? testCode : gateCode ?? 1;
      process.exit(finalCode);
    });
  });
});
