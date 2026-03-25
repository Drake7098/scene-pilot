# T3 Batch Template Rules

## Batch Generation Entry Gate

Any future batch-generated template MUST satisfy all below before onboarding:

1. comply with field standard
2. comply with structure standard
3. comply with conflict standard
4. comply with prompt standard/rules
5. pass lint standard
6. score >= 6.0

## Batch Pipeline Requirements

1. Generate candidate templates.
2. Run field/structure validator.
3. Run conflict resolver simulation.
4. Run prompt segment validator.
5. Run lint.
6. Run scoring.
7. Only templates passing all gates enter `templates-online`.

## Rejection Rules

Template is rejected if any gate fails.
No manual bypass is allowed for production pool.

## Pool Policy

- `templates-old`: compare-only, non-online
- `templates-experiment`: test-only, non-online
- `templates-benchmark`: standard reference
- `templates-final`: pre-online candidate
- `templates-online`: only fully passed templates
