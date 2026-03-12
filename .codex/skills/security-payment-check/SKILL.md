---
name: security-payment-check
description: Validate payment-chain security controls for ScenePilot. Use when changing Paddle checkout, webhook handling, credits ledger, subscription lifecycle, or billing state transitions that can impact money, credits, or account tier.
---

# Security Payment Check

Use this skill for any payment-related change before merge and before release.

## Workflow

1. Run payment security scanner:
   - `node .codex/skills/security-payment-check/scripts/check-payment-security.mjs --root /Users/dk/scene-pilot`
2. Fix required failures:
   - webhook signature verification
   - webhook idempotency / replay protection
   - ledger idempotency and consistency
3. Review warnings:
   - cancel/downgrade handling
   - payout/credits reconciliation visibility
4. Re-run until required checks pass.

## Required Controls

- webhook signature validation is mandatory
- webhook event dedupe is mandatory
- credit grant path must be idempotent
- transaction upsert must prevent duplicate payment records

## Resources

- Checklist:
  - `.codex/skills/security-payment-check/references/checklist.md`
- Scanner:
  - `.codex/skills/security-payment-check/scripts/check-payment-security.mjs`
