import { spawnSync } from "node:child_process";

function run(file: string): void {
  const result = spawnSync("node", [file], { stdio: "inherit", cwd: process.cwd(), env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("tests/ab/dist/runners/run-images.js");
run("tests/ab/dist/runners/run-videos.js");
run("tests/ab/dist/reports/render-report.js");
