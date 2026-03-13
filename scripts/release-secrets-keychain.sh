#!/usr/bin/env bash
set -euo pipefail

SERVICE="${RELEASE_KEYCHAIN_SERVICE:-scenepilotix.release}"

SECRET_KEYS=(
  CF_API_TOKEN
  SUPABASE_SERVICE_ROLE_KEY
  VITE_SUPABASE_ANON_KEY
)

NON_SECRET_KEYS=(
  CF_ACCOUNT_ID
  SUPABASE_URL
)

usage() {
  cat <<'EOF'
Usage:
  bash scripts/release-secrets-keychain.sh <setup|status|clear>

Commands:
  setup    Prompt and save release keys to macOS Keychain
  status   Show whether each key exists in Keychain
  clear    Remove all stored keys from Keychain service

Env:
  RELEASE_KEYCHAIN_SERVICE   Keychain service name (default: scenepilotix.release)
EOF
}

require_security() {
  if ! command -v security >/dev/null 2>&1; then
    echo "security CLI not found; this script requires macOS Keychain." >&2
    exit 1
  fi
}

keychain_set() {
  local account="$1"
  local value="$2"
  security add-generic-password -U -a "$account" -s "$SERVICE" -w "$value" >/dev/null
}

keychain_exists() {
  local account="$1"
  security find-generic-password -a "$account" -s "$SERVICE" >/dev/null 2>&1
}

setup() {
  require_security

  local value=""
  for key in "${SECRET_KEYS[@]}"; do
    value="${!key:-}"
    if [[ -z "$value" ]]; then
      read -r -s -p "Enter ${key}: " value
      echo
    fi
    if [[ -z "$value" ]]; then
      echo "Missing required value: $key" >&2
      exit 1
    fi
    keychain_set "$key" "$value"
  done

  local default_account_id="0b6b05a3bcbc3ad3ef0ec56d0405d24f"
  local default_supabase_url="https://sampclwsqputkeswqbbu.supabase.co"
  for key in "${NON_SECRET_KEYS[@]}"; do
    value="${!key:-}"
    if [[ -z "$value" ]]; then
      if [[ "$key" == "CF_ACCOUNT_ID" ]]; then
        read -r -p "Enter ${key} [${default_account_id}]: " value
        value="${value:-$default_account_id}"
      else
        read -r -p "Enter ${key} [${default_supabase_url}]: " value
        value="${value:-$default_supabase_url}"
      fi
    fi
    keychain_set "$key" "$value"
  done

  echo "Saved release keys to Keychain service: ${SERVICE}"
}

status() {
  require_security
  local key=""
  for key in "${SECRET_KEYS[@]}" "${NON_SECRET_KEYS[@]}"; do
    if keychain_exists "$key"; then
      echo "${key}: present"
    else
      echo "${key}: missing"
    fi
  done
}

clear() {
  require_security
  local key=""
  for key in "${SECRET_KEYS[@]}" "${NON_SECRET_KEYS[@]}"; do
    security delete-generic-password -a "$key" -s "$SERVICE" >/dev/null 2>&1 || true
  done
  echo "Cleared Keychain entries for service: ${SERVICE}"
}

CMD="${1:-status}"
case "$CMD" in
  setup) setup ;;
  status) status ;;
  clear) clear ;;
  -h|--help|help) usage ;;
  *)
    echo "Unknown command: $CMD" >&2
    usage
    exit 2
    ;;
esac
