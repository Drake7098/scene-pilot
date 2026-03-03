import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./scenarios",
  timeout: 90_000,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./artifacts/html-report", open: "never" }],
    ["json", { outputFile: "./artifacts/results.json" }],
  ],
  outputDir: "./artifacts/raw",
  use: {
    baseURL: process.env.APP_URL || "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
});
