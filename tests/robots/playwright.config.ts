import { defineConfig } from "@playwright/test";

const appUrl = process.env.APP_URL || "http://127.0.0.1:5173";
const useExternalServer = Boolean(process.env.APP_URL);

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
    baseURL: appUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        url: appUrl,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
