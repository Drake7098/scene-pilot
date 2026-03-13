function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

async function fetchCheck(url, options = {}) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, options);
    const elapsedMs = Date.now() - startedAt;
    return {
      ok: true,
      status: response.status,
      elapsedMs
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkStatus(result, allowed, label) {
  const allowedSet = new Set(allowed);
  if (!result.ok || !allowedSet.has(result.status)) {
    return `${label} expected status in [${allowed.join(", ")}], got ${result.status}${result.ok ? "" : ` (${result.error || "network_error"})`}`;
  }
  return "";
}

async function main() {
  const baseUrl = env("APP_URL");
  if (!baseUrl) {
    console.error("Missing APP_URL");
    console.error("Example: APP_URL=https://www.scenepilotix.com npm run smoke:release");
    process.exit(1);
  }

  const billingEnabled = ["1", "true", "yes", "on"].includes(env("SMOKE_BILLING_ENABLED", "0").toLowerCase());
  const expectStrictAuth = ["1", "true", "yes", "on"].includes(env("SMOKE_EXPECT_STRICT_AUTH", "1").toLowerCase());
  const dummyUserId = env("SMOKE_USER_ID", "00000000-0000-4000-8000-000000000001");

  const checks = [];
  checks.push({
    label: "GET /",
    result: await fetchCheck(`${baseUrl}/`)
  });
  checks.push({
    label: "GET /app",
    result: await fetchCheck(`${baseUrl}/app`)
  });
  checks.push({
    label: "GET /pricing",
    result: await fetchCheck(`${baseUrl}/pricing`)
  });
  checks.push({
    label: "GET /terms",
    result: await fetchCheck(`${baseUrl}/terms`)
  });
  checks.push({
    label: "GET /privacy",
    result: await fetchCheck(`${baseUrl}/privacy`)
  });

  checks.push({
    label: "GET /api/generation/providers",
    result: await fetchCheck(`${baseUrl}/api/generation/providers`)
  });
  checks.push({
    label: "GET /api/billing/me",
    result: await fetchCheck(`${baseUrl}/api/billing/me?userId=${encodeURIComponent(dummyUserId)}`)
  });
  checks.push({
    label: "POST /api/paddle/checkout",
    result: await fetchCheck(`${baseUrl}/api/paddle/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "pro",
        productId: "pro_monthly",
        userId: dummyUserId
      })
    })
  });

  const failures = [];
  for (const item of checks) {
    const { label, result } = item;
    if (label.startsWith("GET /api/generation/providers")) {
      const fail = checkStatus(result, expectStrictAuth ? [401, 403] : [200, 401, 403], label);
      if (fail) failures.push(fail);
      continue;
    }
    if (label.startsWith("GET /api/billing/me")) {
      const fail = checkStatus(result, expectStrictAuth ? [401, 403] : [200, 400, 401, 403], label);
      if (fail) failures.push(fail);
      continue;
    }
    if (label.startsWith("POST /api/paddle/checkout")) {
      const fail = checkStatus(result, billingEnabled ? [400, 401, 403] : [503], label);
      if (fail) failures.push(fail);
      continue;
    }
    const fail = checkStatus(result, [200], label);
    if (fail) failures.push(fail);
  }

  console.log(JSON.stringify({
    appUrl: baseUrl,
    billingEnabled,
    expectStrictAuth,
    checks
  }, null, 2));

  if (failures.length) {
    console.error(`Smoke check failed (${failures.length}):`);
    for (const item of failures) console.error(`- ${item}`);
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
