# Billing System V1

Last updated: 2026-03-15

## Overview

ScenePilotix billing is **pay-per-use**, not permanent unlock. Credits are consumed when applying templates and (future) when running image/video generation.

## Template charges

- **Per-use**: Each template apply may consume credits.
- **No repeat in same project**: Same template + same project = charge once. Re-apply, re-open, re-edit in that project = no extra charge.
- **New project = may charge again**: Charge unit is (project + templateId).
- **Free templates**: Always 0 credits.
- **Standard**: 3 credits.
- **Premium / continuous / advanced**: 5 credits.

## Project billing meta

Stored in `project.meta.billing`:

```ts
{
  appliedTemplateCharges: [
    { templateId, familyId?, variantId?, cost, chargedAt, chargeType: "template_apply" }
  ],
  generationCharges: [
    { sceneId?, platformId?, cost, chargedAt, chargeType: "generate_image" | "generate_video" }
  ]
}
```

- Persists with project; survives refresh.
- Source of truth for "already charged in this project".

## Account structure

- `creditsBalance`: Current spendable credits.
- `totalCreditsPurchased`, `totalCreditsSpent`, `totalTemplateCreditsSpent`, `totalGenerationCreditsSpent`, `lastTransactionAt`: Reserved for backend/audit.

## Transaction log (local)

`billingTransactions` in localStorage:

```ts
{
  id, type: "purchase" | "template_apply" | "generate_image" | "generate_video" | "refund",
  creditsDelta, usdAmount?, projectId?, templateId?, sceneId?, platformId?,
  createdAt, note?
}
```

## Generation charges (reserved)

- Not connected to real generation yet.
- `estimateGenerationCost`, `canAffordGeneration`, `applyGenerationCharge`, `recordGenerationCharge` are stubbed.
- Template charges and generation charges are separate.
