---
name: security-release-gate
description: Run a release-time security decision gate that aggregates threat-model completeness, API hardening checks, and payment-chain checks into a clear GO/GO_WITH_RISKS/HOLD result. Use before deploying feature branches or production releases.
---

# Security Release Gate

Use this skill immediately before release.

## Workflow

1. Ensure threat model report exists:
   - `artifacts/reports/security-threat-model.md`
2. Run release gate:
   - `node .codex/skills/security-release-gate/scripts/run-security-release-gate.mjs --root /Users/dk/scene-pilot`
3. Read decision:
   - `GO`: no required blockers
   - `GO_WITH_RISKS`: only warnings remain
   - `HOLD`: required blockers exist
4. Fix blockers and re-run gate.

## Required Inputs

- threat model report
- API hardening scan result
- payment security scan result

## Resources

- Decision rubric:
  - `.codex/skills/security-release-gate/references/decision-rubric.md`
- Gate runner:
  - `.codex/skills/security-release-gate/scripts/run-security-release-gate.mjs`
