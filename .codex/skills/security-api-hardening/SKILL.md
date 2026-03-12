---
name: security-api-hardening
description: Audit and harden API endpoints for ScenePilot by checking authentication, input/schema validation, rate-limit coverage, and CORS allowlist usage. Use when adding or editing endpoints in functions/api, generation routes, billing routes, checkout routes, or provider/webhook interfaces.
---

# Security API Hardening

Use this skill during API implementation and in review before merge.

## Workflow

1. Run endpoint hardening scan:
   - `node .codex/skills/security-api-hardening/scripts/check-api-hardening.mjs --root /Users/dk/scene-pilot`
2. Fix required failures first:
   - auth missing on protected endpoints
   - missing CORS allowlist guard
   - missing input/schema guard on JSON endpoints
3. Review warnings:
   - missing rate-limit controls
4. Re-run until required checks are fully green.

## Required Controls

- Auth:
  - protected APIs must enforce `requireApiAuth(...)`
- Input/schema:
  - JSON APIs must reject invalid payloads explicitly
- CORS:
  - endpoints must use allowlist + preflight handler (`rejectDisallowedOrigin`, `corsOptions`)
- Rate-limit:
  - required for high-frequency or payment-impact endpoints

## Resources

- Rules:
  - `.codex/skills/security-api-hardening/references/rules.md`
- Scanner:
  - `.codex/skills/security-api-hardening/scripts/check-api-hardening.mjs`
