import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function loadTemplate() {
  const templatePath = path.resolve(__dirname, "../references/template.md");
  return fs.readFileSync(templatePath, "utf8");
}

function renderTemplate(template, fields) {
  return template
    .replaceAll("{{feature}}", fields.feature)
    .replaceAll("{{workspace}}", fields.workspace)
    .replaceAll("{{surface}}", fields.surface)
    .replaceAll("{{owner}}", fields.owner)
    .replaceAll("{{date}}", fields.date);
}

function validateThreatModel(content) {
  const requiredHeadings = [
    "## Context [REQUIRED]",
    "## Assets [REQUIRED]",
    "## Trust Boundaries [REQUIRED]",
    "## Entry Points [REQUIRED]",
    "## Threat Scenarios [REQUIRED]",
    "## Mitigations [REQUIRED]",
    "## Detection and Monitoring [REQUIRED]",
    "## Residual Risks [REQUIRED]",
    "## Decision [REQUIRED]"
  ];
  const missing = requiredHeadings.filter((heading) => !content.includes(heading));
  const hasDecision = /Decision:\s*`?(GO|GO_WITH_RISKS|HOLD)`?/i.test(content);
  if (!hasDecision) missing.push("Decision value");
  return {
    valid: missing.length === 0,
    missing
  };
}

function output(result, asJson) {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.valid === false) {
    console.error(`Threat model validation failed: ${result.missing.join(", ")}`);
    return;
  }
  console.log(result.message || "Threat model validation passed");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const asJson = args.json === "true";

  if (args.validate) {
    const target = path.resolve(process.cwd(), args.validate);
    if (!fs.existsSync(target)) {
      const result = { valid: false, missing: ["file_not_found"], file: target };
      output(result, asJson);
      process.exit(1);
    }
    const content = fs.readFileSync(target, "utf8");
    const result = { ...validateThreatModel(content), file: target, message: `Threat model validation passed: ${target}` };
    output(result, asJson);
    if (!result.valid) process.exit(1);
    return;
  }

  const feature = (args.feature || "").trim();
  const owner = (args.owner || "").trim();
  if (!feature || !owner) {
    const result = {
      valid: false,
      missing: [
        !feature ? "feature" : "",
        !owner ? "owner" : ""
      ].filter(Boolean)
    };
    output(result, asJson);
    process.exit(1);
  }

  const workspace = (args.workspace || process.cwd()).trim();
  const out = path.resolve(process.cwd(), args.out || "artifacts/reports/security-threat-model.md");
  const surface = (args.surface || "general").trim();

  const template = loadTemplate();
  const content = renderTemplate(template, {
    feature,
    workspace,
    surface,
    owner,
    date: nowDate()
  });

  ensureDir(out);
  fs.writeFileSync(out, content, "utf8");
  output({ valid: true, file: out, message: `Threat model template generated: ${out}` }, asJson);
}

main();
