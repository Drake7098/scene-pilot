# Template Billing Rules

Last updated: 2026-03-15

## Cost tiers

| Type | Cost |
|------|------|
| Free starter | 0 |
| Standard | 3 credits |
| Premium / continuous / advanced | 5 credits |

Cost is defined in template metadata (e.g. `templateLibrary600` `templateCost`). Do not hard-code cost in UI.

## Advanced template = 5 credits

- `category === "continuous"`
- Variant `multi_object` or `advanced_motion`
- Cost ≥ 5 in metadata

## applyMode vs cost

- `layout_only`, `layout_plus_style`, `full_workflow` all use the **same** template cost.
- Cost is per template use, not per apply mode.
- applyMode only affects what structure is written, not billing.

## Why no permanent unlock

- Charge unit is (project + templateId).
- Re-use in same project = no repeat charge.
- New project = may charge again.
- Keeps pricing simple and predictable.

## Billing service APIs

- `getTemplateCost(template)` — from metadata.
- `hasTemplateBeenChargedInProject(project, templateId)` — no repeat.
- `canAffordTemplate(userId, template)` — balance check.
- `applyTemplateCharge(userId, project, template)` — reserve, record, finalize.
- `recordTemplateCharge(project, template, cost)` — write to project.meta.billing.
