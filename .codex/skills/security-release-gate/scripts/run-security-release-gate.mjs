import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function runNodeScript(scriptPath, scriptArgs) {
  const proc = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    encoding: "utf8"
  });
  const stdout = (proc.stdout || "").trim();
  let parsed = null;
  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }
  }
  return {
    ok: proc.status === 0,
    status: proc.status ?? 1,
    stdout,
    stderr: (proc.stderr || "").trim(),
    parsed
  };
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const asJson = args.json === "true";
  const outPath = path.resolve(root, args.out || "artifacts/reports/security-release-gate.json");
  const threatModelPath = path.resolve(root, args.threatModel || "artifacts/reports/security-threat-model.md");

  const apiScript = path.resolve(__dirname, "../../security-api-hardening/scripts/check-api-hardening.mjs");
  const paymentScript = path.resolve(__dirname, "../../security-payment-check/scripts/check-payment-security.mjs");
  const threatScript = path.resolve(__dirname, "../../security-threat-model/scripts/render-threat-model.mjs");

  const api = runNodeScript(apiScript, ["--root", root, "--json"]);
  const payment = runNodeScript(paymentScript, ["--root", root, "--json"]);
  const threat = runNodeScript(threatScript, ["--validate", threatModelPath, "--json"]);

  const blockers = [];
  const warnings = [];

  if (!api.ok || !api.parsed?.pass) blockers.push("api_hardening_failed");
  if (!payment.ok || !payment.parsed?.pass) blockers.push("payment_security_failed");
  if (!threat.ok || !threat.parsed?.valid) blockers.push("threat_model_invalid_or_missing");

  const apiWarnings = Number(api.parsed?.summary?.warnings || 0);
  const paymentWarnings = Array.isArray(payment.parsed?.warnings) ? payment.parsed.warnings.length : 0;
  if (apiWarnings > 0) warnings.push(`api_warnings:${apiWarnings}`);
  if (paymentWarnings > 0) warnings.push(`payment_warnings:${paymentWarnings}`);

  let decision = "GO";
  if (blockers.length > 0) decision = "HOLD";
  else if (warnings.length > 0) decision = "GO_WITH_RISKS";

  const report = {
    generatedAt: new Date().toISOString(),
    root,
    decision,
    blockers,
    warnings,
    threatModelPath,
    checks: {
      api: api.parsed || { pass: false, error: api.stderr || "api_check_failed" },
      payment: payment.parsed || { pass: false, error: payment.stderr || "payment_check_failed" },
      threat: threat.parsed || { valid: false, error: threat.stderr || "threat_check_failed" }
    }
  };

  ensureDir(outPath);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Security release gate: ${decision}`);
    if (blockers.length) console.log(`Blockers: ${blockers.join(", ")}`);
    if (warnings.length) console.log(`Warnings: ${warnings.join(", ")}`);
    console.log(`Report saved: ${outPath}`);
  }

  if (decision === "HOLD") process.exit(1);
}

main();
