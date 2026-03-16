#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

function argValue(flag, fallback = "") {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return fallback;
  return String(process.argv[idx + 1] || fallback).trim();
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function required(name, fallback = "") {
  const value = env(name, fallback);
  if (!value) throw new Error(`missing_env:${name}`);
  return value;
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 10) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function buildSecretMap(target) {
  const supabaseUrl = required("SUPABASE_URL", env("VITE_SUPABASE_URL"));
  const supabaseAnon = required("VITE_SUPABASE_ANON_KEY", env("SUPABASE_ANON_KEY"));
  const supabaseServiceRole = required("SUPABASE_SERVICE_ROLE_KEY");
  const apiAuthToken = env("API_AUTH_TOKEN", randomBytes(32).toString("hex"));

  const commonSecurity = {
    AUTH_PASSWORD_PBKDF2_ITERATIONS: env("AUTH_PASSWORD_PBKDF2_ITERATIONS", "210000"),
    AUTH_PASSWORD_IP_LIMIT_PER_10M: env("AUTH_PASSWORD_IP_LIMIT_PER_10M", "60"),
    AUTH_PASSWORD_EMAIL_LIMIT_PER_10M: env("AUTH_PASSWORD_EMAIL_LIMIT_PER_10M", "12"),
    AUTH_SEND_CODE_IP_LIMIT_PER_10M: env("AUTH_SEND_CODE_IP_LIMIT_PER_10M", "30"),
    AUTH_SEND_CODE_EMAIL_LIMIT_PER_10M: env("AUTH_SEND_CODE_EMAIL_LIMIT_PER_10M", "6"),
    AUTH_VERIFY_CODE_IP_LIMIT_PER_10M: env("AUTH_VERIFY_CODE_IP_LIMIT_PER_10M", "40"),
    AUTH_VERIFY_CODE_EMAIL_LIMIT_PER_10M: env("AUTH_VERIFY_CODE_EMAIL_LIMIT_PER_10M", "12"),
    GENERATION_SUBMIT_LIMIT_PER_MIN: env("GENERATION_SUBMIT_LIMIT_PER_MIN", "30"),
    GENERATION_STATUS_LIMIT_PER_MIN: env("GENERATION_STATUS_LIMIT_PER_MIN", "180"),
    CHECKOUT_LIMIT_PER_10M: env("CHECKOUT_LIMIT_PER_10M", "20"),
    LEGAL_CONSENT_LIMIT_PER_10M: env("LEGAL_CONSENT_LIMIT_PER_10M", "40"),
    COLLECT_RATE_LIMIT_PER_MIN: env("COLLECT_RATE_LIMIT_PER_MIN", "240"),
    FEEDBACK_RATE_LIMIT_PER_10M: env("FEEDBACK_RATE_LIMIT_PER_10M", "20"),
    PADDLE_WEBHOOK_MAX_AGE_SECONDS: env("PADDLE_WEBHOOK_MAX_AGE_SECONDS", "300"),
    PADDLE_WEBHOOK_MAX_FUTURE_SKEW_SECONDS: env("PADDLE_WEBHOOK_MAX_FUTURE_SKEW_SECONDS", "60")
  };

  if (target === "test") {
    return {
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseAnon,
      VITE_APP_BASE_URL: env("TEST_VITE_APP_BASE_URL", "https://scenepilotix.pages.dev"),
      VITE_BILLING_ENABLED: env("TEST_VITE_BILLING_ENABLED", "0"),
      VITE_BILLING_MODE: env("TEST_VITE_BILLING_MODE", "sandbox"),
      VITE_BILLING_LIVE_ALLOWED: env("TEST_VITE_BILLING_LIVE_ALLOWED", "0"),
      VITE_BILLING_ALLOW_MOCK_FALLBACK: env("TEST_VITE_BILLING_ALLOW_MOCK_FALLBACK", "0"),
      VITE_AUTH_MOCK_FALLBACK: env("TEST_VITE_AUTH_MOCK_FALLBACK", "0"),
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRole,
      CORS_ALLOW_ORIGINS: env(
        "TEST_CORS_ALLOW_ORIGINS",
        "https://scenepilotix.pages.dev,https://www.scenepilotix.com,http://localhost:5173"
      ),
      API_AUTH_STRICT: env("TEST_API_AUTH_STRICT", "1"),
      API_AUTH_TOKEN: env("TEST_API_AUTH_TOKEN", apiAuthToken),
      BILLING_ENABLED: env("TEST_BILLING_ENABLED", "0"),
      BILLING_MODE: env("TEST_BILLING_MODE", "sandbox"),
      BILLING_LIVE_ALLOWED: env("TEST_BILLING_LIVE_ALLOWED", "0"),
      AUTH_DEV_CODE_EXPOSE: env("TEST_AUTH_DEV_CODE_EXPOSE", "0"),
      ...commonSecurity
    };
  }

  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnon,
    VITE_APP_BASE_URL: env("PROD_VITE_APP_BASE_URL", "https://www.scenepilotix.com"),
    VITE_BILLING_ENABLED: env("PROD_VITE_BILLING_ENABLED", "0"),
    VITE_BILLING_MODE: env("PROD_VITE_BILLING_MODE", "live"),
    VITE_BILLING_LIVE_ALLOWED: env("PROD_VITE_BILLING_LIVE_ALLOWED", "1"),
    VITE_BILLING_ALLOW_MOCK_FALLBACK: env("PROD_VITE_BILLING_ALLOW_MOCK_FALLBACK", "0"),
    VITE_AUTH_MOCK_FALLBACK: env("PROD_VITE_AUTH_MOCK_FALLBACK", "0"),
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRole,
    CORS_ALLOW_ORIGINS: env(
      "PROD_CORS_ALLOW_ORIGINS",
      "https://www.scenepilotix.com,https://scenepilotix.pages.dev"
    ),
    API_AUTH_STRICT: env("PROD_API_AUTH_STRICT", "1"),
    API_AUTH_TOKEN: env("PROD_API_AUTH_TOKEN", apiAuthToken),
    BILLING_ENABLED: env("PROD_BILLING_ENABLED", "0"),
    BILLING_MODE: env("PROD_BILLING_MODE", "live"),
    BILLING_LIVE_ALLOWED: env("PROD_BILLING_LIVE_ALLOWED", "1"),
    AUTH_DEV_CODE_EXPOSE: env("PROD_AUTH_DEV_CODE_EXPOSE", "0"),
    ...commonSecurity
  };
}

function runSecretBulk(projectName, target, secrets, dryRun) {
  const keys = Object.keys(secrets);
  if (dryRun) {
    console.log(JSON.stringify({
      projectName,
      target,
      dryRun: true,
      keys,
      preview: Object.fromEntries(keys.map((key) => [key, mask(secrets[key])]))
    }, null, 2));
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "sp-pages-secrets-"));
  const file = join(dir, `${target}.secrets.json`);
  try {
    writeFileSync(file, JSON.stringify(secrets, null, 2));
    const result = spawnSync("npx", ["wrangler", "pages", "secret", "bulk", file, "--project-name", projectName], {
      stdio: "inherit",
      env: process.env
    });
    if (result.status !== 0) {
      throw new Error(`secret_bulk_failed:${target}:${projectName}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  const target = argValue("--target", "all");
  const dryRun = hasFlag("--dry-run");
  const testProject = argValue("--test-project", env("CF_PAGES_TEST_PROJECT", "scenepilotix"));
  const prodProject = argValue("--prod-project", env("CF_PAGES_PROD_PROJECT", "scenepilotix1-prod"));

  const targets = target === "all" ? ["test", "prod"] : [target];
  for (const item of targets) {
    if (item !== "test" && item !== "prod") {
      throw new Error(`invalid_target:${item}`);
    }
  }

  for (const item of targets) {
    const projectName = item === "test" ? testProject : prodProject;
    const secrets = buildSecretMap(item);
    runSecretBulk(projectName, item, secrets, dryRun);
  }

  console.log(JSON.stringify({
    ok: true,
    target,
    dryRun,
    testProject,
    prodProject
  }, null, 2));
}

main();
