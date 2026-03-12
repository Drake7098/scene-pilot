import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) args[key] = "true";
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function listFiles(rootDir) {
  const stack = [rootDir];
  const files = [];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir || !fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && entry.name.endsWith(".ts")) files.push(full);
    }
  }
  return files;
}

function endpointKind(relativePath) {
  if (relativePath.startsWith("functions/api/generation/")) return "generation";
  if (relativePath.startsWith("functions/api/billing/")) return "billing";
  if (relativePath === "functions/api/paddle/checkout.ts") return "checkout";
  if (relativePath === "functions/api/paddle/customer-portal.ts") return "checkout";
  if (relativePath === "functions/api/paddle/webhook.ts") return "webhook";
  return "other";
}

function analyzeFile(filePath, root) {
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, "/");
  const kind = endpointKind(relativePath);
  if (relativePath.includes("/_shared/")) return null;

  const content = fs.readFileSync(filePath, "utf8");
  const usesJsonBody = /request\.json\s*\(/.test(content);
  const hasSchemaGuard = /(invalid_|missing_|kind_mismatch|body\.[a-zA-Z0-9_]+)/.test(content);
  const hasAuth = /requireApiAuth\s*\(/.test(content);
  const hasCorsGuard = /rejectDisallowedOrigin\s*\(/.test(content);
  const hasCorsPreflight = /corsOptions\s*\(/.test(content);
  const hasRateLimitHint = /(rate[\s_-]*limit|too_many_requests|ratelimit)/i.test(content);

  const required = [];
  if (["generation", "billing", "checkout", "webhook", "other"].includes(kind)) {
    required.push(["cors_guard", hasCorsGuard]);
    required.push(["cors_preflight", hasCorsPreflight]);
  }
  if (["generation", "billing", "checkout"].includes(kind)) {
    required.push(["auth", hasAuth]);
  }
  if (usesJsonBody) {
    required.push(["schema", hasSchemaGuard]);
  }

  const missingRequired = required.filter(([, ok]) => !ok).map(([name]) => name);
  const warnings = [];
  if (["generation", "billing", "checkout", "webhook"].includes(kind) && !hasRateLimitHint) {
    warnings.push("rate_limit");
  }

  return {
    file: relativePath,
    kind,
    checks: {
      hasAuth,
      hasSchemaGuard,
      hasCorsGuard,
      hasCorsPreflight,
      hasRateLimitHint
    },
    missingRequired,
    warnings
  };
}

function writeReport(outPath, report) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
}

function printHuman(report) {
  console.log(`Security API hardening: ${report.pass ? "PASS" : "FAIL"}`);
  console.log(`Endpoints scanned: ${report.summary.files}`);
  console.log(`Required failures: ${report.summary.requiredFailures}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  if (report.failures.length) {
    console.log("Failure details:");
    for (const item of report.failures) {
      console.log(`- ${item.file}: ${item.missingRequired.join(", ")}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const outPath = path.resolve(root, args.out || "artifacts/reports/security-api-hardening.json");
  const asJson = args.json === "true";

  const apiRoot = path.join(root, "functions", "api");
  const files = listFiles(apiRoot);
  const checks = files
    .map((file) => analyzeFile(file, root))
    .filter(Boolean);

  const failures = checks.filter((item) => item.missingRequired.length > 0);
  const warnings = checks.reduce((sum, item) => sum + item.warnings.length, 0);
  const report = {
    generatedAt: new Date().toISOString(),
    root,
    pass: failures.length === 0,
    summary: {
      files: checks.length,
      requiredFailures: failures.length,
      warnings
    },
    failures,
    checks
  };

  writeReport(outPath, report);

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
    console.log(`Report saved: ${outPath}`);
  }

  if (!report.pass) process.exit(1);
}

main();
