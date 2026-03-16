#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/release-safe.sh [options]

Options:
  --target <test|prod|all>        Release target (default: all)
  --app-url <url>                 Custom domain smoke URL (default: https://www.scenepilotix.com)
  --skip-readiness                Skip release:readiness guard
  --skip-custom-domain-smoke      Skip smoke on custom app URL
  --no-keychain                   Do not read/write macOS Keychain
  -h, --help                      Show this help

Required secrets (env or prompt):
  CF_API_TOKEN
  SUPABASE_SERVICE_ROLE_KEY
  VITE_SUPABASE_ANON_KEY

Optional env:
  CF_ACCOUNT_ID                   Defaults to 0b6b05a3bcbc3ad3ef0ec56d0405d24f
  SUPABASE_URL                    Defaults to https://sampclwsqputkeswqbbu.supabase.co
  RELEASE_KEYCHAIN_SERVICE        Defaults to scenepilotix.release
EOF
}

TARGET="all"
APP_URL="${APP_URL:-https://www.scenepilotix.com}"
SKIP_READINESS=0
SKIP_CUSTOM_DOMAIN_SMOKE=0
USE_KEYCHAIN=1
KEYCHAIN_SERVICE="${RELEASE_KEYCHAIN_SERVICE:-scenepilotix.release}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    --app-url)
      APP_URL="${2:-}"
      shift 2
      ;;
    --skip-readiness)
      SKIP_READINESS=1
      shift
      ;;
    --skip-custom-domain-smoke)
      SKIP_CUSTOM_DOMAIN_SMOKE=1
      shift
      ;;
    --no-keychain)
      USE_KEYCHAIN=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

case "$TARGET" in
  test|prod|all) ;;
  *)
    echo "Invalid --target: $TARGET (expected: test|prod|all)" >&2
    exit 2
    ;;
esac

has_security_cli() {
  command -v security >/dev/null 2>&1
}

keychain_get() {
  local account="$1"
  if [[ "$USE_KEYCHAIN" -ne 1 ]]; then
    return 0
  fi
  if ! has_security_cli; then
    return 0
  fi
  security find-generic-password -a "$account" -s "$KEYCHAIN_SERVICE" -w 2>/dev/null || true
}

keychain_set() {
  local account="$1"
  local value="$2"
  if [[ "$USE_KEYCHAIN" -ne 1 ]]; then
    return 0
  fi
  if ! has_security_cli; then
    return 0
  fi
  security add-generic-password -U -a "$account" -s "$KEYCHAIN_SERVICE" -w "$value" >/dev/null 2>&1 || true
}

ensure_secret() {
  local name="$1"
  local prompt="$2"
  local value="${!name:-}"
  local source="env"

  if [[ -z "$value" ]]; then
    value="$(keychain_get "$name")"
    if [[ -n "$value" ]]; then
      source="keychain"
    fi
  fi

  if [[ -z "$value" ]]; then
    if [[ ! -t 0 ]]; then
      echo "Missing required env: $name" >&2
      exit 1
    fi
    read -r -s -p "$prompt: " value
    echo
    source="prompt"
  fi

  if [[ -z "$value" ]]; then
    echo "Missing required value: $name" >&2
    exit 1
  fi

  export "$name=$value"
  if [[ "$source" != "keychain" ]]; then
    keychain_set "$name" "$value"
  fi
}

if [[ -z "${CF_ACCOUNT_ID:-}" ]]; then
  CF_ACCOUNT_ID="$(keychain_get CF_ACCOUNT_ID)"
fi
if [[ -z "${SUPABASE_URL:-}" ]]; then
  SUPABASE_URL="$(keychain_get SUPABASE_URL)"
fi

export CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-0b6b05a3bcbc3ad3ef0ec56d0405d24f}"
export SUPABASE_URL="${SUPABASE_URL:-https://sampclwsqputkeswqbbu.supabase.co}"
keychain_set "CF_ACCOUNT_ID" "$CF_ACCOUNT_ID"
keychain_set "SUPABASE_URL" "$SUPABASE_URL"

ensure_secret "CF_API_TOKEN" "Enter Cloudflare API token"
ensure_secret "SUPABASE_SERVICE_ROLE_KEY" "Enter Supabase service role key"
ensure_secret "VITE_SUPABASE_ANON_KEY" "Enter Supabase publishable key"

echo "[1/5] Release readiness guard"
if [[ "$SKIP_READINESS" -eq 0 ]]; then
  if [[ "$TARGET" == "all" || "$TARGET" == "test" ]]; then
    npm run release:readiness -- --target test
  fi
  if [[ "$TARGET" == "all" || "$TARGET" == "prod" ]]; then
    npm run release:readiness -- --target prod
  fi
else
  echo "Skipped release:readiness by flag."
fi

echo "[2/5] Sync Cloudflare secrets"
npm run release:cloudflare:sync-secrets -- --target "$TARGET"

echo "[3/5] Audit Cloudflare release config"
npm run release:cloudflare:audit

echo "[4/5] Smoke test pages.dev environments"
if [[ "$TARGET" == "all" || "$TARGET" == "test" ]]; then
  APP_URL="https://scenepilotix.pages.dev" npm run smoke:release
fi
if [[ "$TARGET" == "all" || "$TARGET" == "prod" ]]; then
  APP_URL="https://scenepilotix1-prod.pages.dev" npm run smoke:release
fi

echo "[5/5] Smoke test custom domain"
if [[ "$SKIP_CUSTOM_DOMAIN_SMOKE" -eq 0 ]]; then
  APP_URL="$APP_URL" npm run smoke:release
else
  echo "Skipped custom domain smoke by flag."
fi

echo "Release-safe flow completed."
