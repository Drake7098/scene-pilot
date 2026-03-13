const REQUIRED = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CORS_ALLOW_ORIGINS",
  "API_AUTH_STRICT"
];

const REQUIRED_EQUALS = {
  API_AUTH_STRICT: "1"
};

const OPTIONAL = [
  "VITE_BILLING_ENABLED",
  "BILLING_ENABLED"
];

function valueOf(name) {
  return String(process.env[name] || "").trim();
}

function mask(value) {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function main() {
  const missing = [];
  const invalid = [];
  const summary = [];

  for (const key of REQUIRED) {
    const value = valueOf(key);
    if (!value) missing.push(key);
    if (value && REQUIRED_EQUALS[key] && value !== REQUIRED_EQUALS[key]) {
      invalid.push({ key, reason: `must_equal_${REQUIRED_EQUALS[key]}` });
    }
    if (key === "CORS_ALLOW_ORIGINS" && value === "*") {
      invalid.push({ key, reason: "must_not_be_wildcard" });
    }
    summary.push({ key, present: Boolean(value), value: value ? mask(value) : "", expected: REQUIRED_EQUALS[key] || "" });
  }

  for (const key of OPTIONAL) {
    const value = valueOf(key);
    summary.push({ key, present: Boolean(value), value: value ? mask(value) : "" });
  }

  console.log(JSON.stringify({ summary, missing, invalid }, null, 2));
  if (missing.length || invalid.length) process.exit(1);
}

main();
