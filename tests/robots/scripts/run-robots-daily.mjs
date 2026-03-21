import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve("tests/robots");
const artifactsDir = path.join(root, "artifacts");
const runStatePath = path.join(artifactsDir, "run-state.json");

const dailySpecs = [
  "tests/robots/scenarios/security-hardening.spec.ts",
  "tests/robots/scenarios/structure-draft-rules.spec.ts",
  "tests/robots/scenarios/prompt-tail-split.spec.ts",
  "tests/robots/scenarios/ref-attachment-guard.spec.ts",
  "tests/robots/scenarios/combat-adaptive-patch.spec.ts"
];

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
      suite: "daily"
    },
    null,
    2,
  ) + "\n",
);

const dailyEnv = {
  ...process.env,
  ROBOT_FUNCTIONAL_MANIFEST:
    process.env.ROBOT_FUNCTIONAL_MANIFEST || "tests/robots/config/functional-capabilities.daily.json"
};

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "-c", "tests/robots/playwright.config.ts", ...dailySpecs],
  {
    stdio: "inherit",
    env: dailyEnv,
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
        suite: "daily"
      },
      null,
      2,
    ) + "\n",
  );

  const summary = spawn(process.execPath, ["tests/robots/scripts/generate-summary.mjs"], {
    stdio: "inherit",
    env: dailyEnv,
  });

  summary.on("exit", () => {
    const functional = spawn(process.execPath, ["tests/robots/scripts/audit-functional-coverage.mjs"], {
      stdio: "inherit",
      env: dailyEnv,
    });

    functional.on("exit", () => {
      const gate = spawn(process.execPath, ["tests/robots/scripts/assert-gates.mjs"], {
        stdio: "inherit",
        env: dailyEnv,
      });

      gate.on("exit", (gateCode) => {
        const testCode = code ?? 1;
        const finalCode = testCode !== 0 ? testCode : gateCode ?? 1;
        process.exit(finalCode);
      });
    });
  });
});
