#!/usr/bin/env node

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function parseJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function cfApi(path) {
  const token = env("CF_API_TOKEN");
  const accountId = env("CF_ACCOUNT_ID");
  if (!token) throw new Error("missing_cf_api_token");
  if (!accountId) throw new Error("missing_cf_account_id");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}${path}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    }
  });
  const payload = parseJsonSafe(await res.text());
  if (!res.ok || !payload?.success) {
    const error = Array.isArray(payload?.errors) && payload.errors.length
      ? payload.errors.map((item) => item?.message || JSON.stringify(item)).join("; ")
      : `http_${res.status}`;
    throw new Error(`cloudflare_api_failed:${error}`);
  }
  return payload.result;
}

function readVarMeta(config, key) {
  const raw = config?.env_vars?.[key];
  if (!raw || typeof raw !== "object") {
    return { present: false, known: false, value: "" };
  }
  const value = String(raw.value || "").trim();
  const type = String(raw.type || "").trim().toLowerCase();
  if (value) {
    return { present: true, known: true, value };
  }
  // Cloudflare Pages API returns secret_text with empty value for security.
  if (type === "secret_text") {
    return { present: true, known: false, value: "" };
  }
  return { present: false, known: false, value: "" };
}

function collectChecks(projectName, projectConfig, expected) {
  const checks = [];
  const envVars = projectConfig?.env_vars || {};

  for (const key of expected.requiredKeys) {
    const meta = readVarMeta(projectConfig, key);
    checks.push({
      key,
      ok: meta.present,
      reason: meta.present ? (meta.known ? "present" : "present_secret_text") : "missing",
      value: meta.known ? `${meta.value.slice(0, 4)}...` : ""
    });
  }

  for (const [key, exact] of Object.entries(expected.exactValues)) {
    const meta = readVarMeta(projectConfig, key);
    const unknownSecret = meta.present && !meta.known;
    const ok = unknownSecret ? true : meta.value === exact;
    checks.push({
      key,
      ok,
      reason: unknownSecret ? "present_secret_text_unverifiable" : (ok ? "match" : `expected_${exact}`),
      value: meta.known ? meta.value : ""
    });
  }

  for (const key of expected.notWildcardKeys) {
    const meta = readVarMeta(projectConfig, key);
    const unknownSecret = meta.present && !meta.known;
    const ok = unknownSecret ? true : Boolean(meta.value) && meta.value !== "*";
    checks.push({
      key,
      ok,
      reason: unknownSecret ? "present_secret_text_unverifiable" : !meta.value ? "missing" : meta.value === "*" ? "wildcard_not_allowed" : "ok",
      value: meta.known ? meta.value : ""
    });
  }

  const failed = checks.filter((item) => !item.ok);
  return {
    projectName,
    envVarsCount: Object.keys(envVars).length,
    checks,
    failed
  };
}

function summarizeDomains(result) {
  const domains = Array.isArray(result?.domains) ? result.domains : [];
  return domains.map((item) => {
    if (typeof item === "string") {
      return { name: item, status: "", verification: "" };
    }
    return {
      name: String(item?.name || ""),
      status: String(item?.status || ""),
      verification: String(item?.verification_data || "")
    };
  });
}

async function auditProject(projectName, expected) {
  const result = await cfApi(`/pages/projects/${encodeURIComponent(projectName)}`);
  const productionConfig = result?.deployment_configs?.production || {};
  const previewConfig = result?.deployment_configs?.preview || {};
  const prodAudit = collectChecks(projectName, productionConfig, expected.production);
  const previewAudit = collectChecks(projectName, previewConfig, expected.preview);
  return {
    projectName,
    productionBranch: String(result?.production_branch || ""),
    domains: summarizeDomains(result),
    production: prodAudit,
    preview: previewAudit
  };
}

async function main() {
  const testProject = env("CF_PAGES_TEST_PROJECT", "scene-pilot-test");
  const prodProject = env("CF_PAGES_PROD_PROJECT", "scene-pilot-prod");

  const sharedRequired = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ];

  const expected = {
    test: {
      production: {
        requiredKeys: [...sharedRequired, "CORS_ALLOW_ORIGINS", "API_AUTH_STRICT", "BILLING_ENABLED", "VITE_BILLING_ENABLED", "AUTH_DEV_CODE_EXPOSE", "VITE_AUTH_MOCK_FALLBACK"],
        exactValues: {
          API_AUTH_STRICT: "1",
          BILLING_ENABLED: "0",
          VITE_BILLING_ENABLED: "0",
          AUTH_DEV_CODE_EXPOSE: "0",
          VITE_AUTH_MOCK_FALLBACK: "0"
        },
        notWildcardKeys: ["CORS_ALLOW_ORIGINS"]
      },
      preview: {
        requiredKeys: [],
        exactValues: {},
        notWildcardKeys: []
      }
    },
    prod: {
      production: {
        requiredKeys: [...sharedRequired, "CORS_ALLOW_ORIGINS", "API_AUTH_STRICT", "BILLING_ENABLED", "VITE_BILLING_ENABLED", "AUTH_DEV_CODE_EXPOSE", "VITE_AUTH_MOCK_FALLBACK"],
        exactValues: {
          API_AUTH_STRICT: "1",
          BILLING_ENABLED: "0",
          VITE_BILLING_ENABLED: "0",
          AUTH_DEV_CODE_EXPOSE: "0",
          VITE_AUTH_MOCK_FALLBACK: "0"
        },
        notWildcardKeys: ["CORS_ALLOW_ORIGINS"]
      },
      preview: {
        requiredKeys: [],
        exactValues: {},
        notWildcardKeys: []
      }
    }
  };

  const [testAudit, prodAudit] = await Promise.all([
    auditProject(testProject, expected.test),
    auditProject(prodProject, expected.prod)
  ]);

  const failures = [
    ...testAudit.production.failed.map((item) => `test.production:${item.key}:${item.reason}`),
    ...testAudit.preview.failed.map((item) => `test.preview:${item.key}:${item.reason}`),
    ...prodAudit.production.failed.map((item) => `prod.production:${item.key}:${item.reason}`),
    ...prodAudit.preview.failed.map((item) => `prod.preview:${item.key}:${item.reason}`)
  ];

  const output = {
    ok: failures.length === 0,
    audits: { test: testAudit, prod: prodAudit },
    failures
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exit(2);
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
});
