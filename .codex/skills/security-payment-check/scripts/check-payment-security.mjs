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

function fileText(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function runChecks(root) {
  const webhookPath = path.resolve(root, "functions/api/paddle/webhook.ts");
  const billingPath = path.resolve(root, "functions/api/_shared/billing-db.ts");
  const signaturePath = path.resolve(root, "functions/api/_shared/paddle-signature.ts");
  const webhook = fileText(webhookPath);
  const billing = fileText(billingPath);
  const signature = fileText(signaturePath);

  const checks = [
    {
      id: "webhook_signature_module",
      required: true,
      pass: signature.includes("verifyPaddleWebhookSignature"),
      detail: "signature verifier module exists"
    },
    {
      id: "webhook_signature_enforced",
      required: true,
      pass: /verifyPaddleWebhookSignature\s*\(/.test(webhook) && /invalid_webhook_signature/.test(webhook),
      detail: "webhook rejects invalid signatures"
    },
    {
      id: "webhook_event_dedupe",
      required: true,
      pass: /provider_event_id/.test(webhook) && /dedup/.test(webhook) && /payment_events/.test(webhook),
      detail: "webhook has event-level dedupe"
    },
    {
      id: "payment_idempotent_upsert",
      required: true,
      pass: /ON CONFLICT\(provider_transaction_id\)/.test(webhook),
      detail: "payments upsert by provider transaction id"
    },
    {
      id: "ledger_idempotency_key",
      required: true,
      pass: /idempotency_key/.test(billing) && /SELECT id FROM credit_ledger WHERE idempotency_key/.test(billing),
      detail: "credit ledger avoids duplicate grants"
    },
    {
      id: "subscription_downgrade_flow",
      required: false,
      pass: /tier = 'free'/.test(webhook),
      detail: "subscription paused/canceled downgrade present"
    }
  ];

  const failures = checks.filter((item) => item.required && !item.pass);
  const warnings = checks.filter((item) => !item.required && !item.pass);
  return {
    pass: failures.length === 0,
    checks,
    failures,
    warnings
  };
}

function writeReport(outPath, report) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
}

function printHuman(report) {
  console.log(`Payment security: ${report.pass ? "PASS" : "FAIL"}`);
  if (report.failures.length) {
    console.log("Required failures:");
    for (const item of report.failures) {
      console.log(`- ${item.id}: ${item.detail}`);
    }
  }
  if (report.warnings.length) {
    console.log("Warnings:");
    for (const item of report.warnings) {
      console.log(`- ${item.id}: ${item.detail}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root || process.cwd());
  const outPath = path.resolve(root, args.out || "artifacts/reports/security-payment-check.json");
  const asJson = args.json === "true";

  const result = runChecks(root);
  const report = {
    generatedAt: new Date().toISOString(),
    root,
    ...result
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
