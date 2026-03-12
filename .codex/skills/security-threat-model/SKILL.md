---
name: security-threat-model
description: Build and validate feature-level threat models for ScenePilot changes. Use when adding or changing generation, billing, checkout, provider routing, data storage, account flows, or any API boundary that can introduce abuse, data leakage, privilege escalation, or payment risk.
---

# Security Threat Model

Use this skill to produce a consistent threat model before implementation or before release.

## Workflow

1. Generate a threat model draft:
   - `node .codex/skills/security-threat-model/scripts/render-threat-model.mjs --workspace /Users/dk/scene-pilot --feature "<feature>" --surface "<surface>" --owner "<owner>" --out artifacts/reports/security-threat-model.md`
2. Fill every required field listed in:
   - `.codex/skills/security-threat-model/references/required-fields.md`
3. Validate the filled draft:
   - `node .codex/skills/security-threat-model/scripts/render-threat-model.mjs --validate artifacts/reports/security-threat-model.md`
4. Keep mitigation items concrete:
   - include exact file path or endpoint
   - include owner and due date
   - separate `blocked now` vs `accepted residual risk`

## Output Standard

- Keep one threat model per feature.
- Include at least one abuse case for:
  - auth bypass
  - data boundary break
  - billing/payment manipulation
  - provider/webhook misuse (if applicable)
- End with a clear decision:
  - `GO`
  - `GO_WITH_RISKS`
  - `HOLD`

## Resources

- Required fields checklist:
  - `.codex/skills/security-threat-model/references/required-fields.md`
- Template:
  - `.codex/skills/security-threat-model/references/template.md`
