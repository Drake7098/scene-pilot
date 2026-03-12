# Required Fields

All threat model reports must include these sections with non-empty content:

1. `## Context [REQUIRED]`
2. `## Assets [REQUIRED]`
3. `## Trust Boundaries [REQUIRED]`
4. `## Entry Points [REQUIRED]`
5. `## Threat Scenarios [REQUIRED]`
6. `## Mitigations [REQUIRED]`
7. `## Detection and Monitoring [REQUIRED]`
8. `## Residual Risks [REQUIRED]`
9. `## Decision [REQUIRED]`

Minimum quality bar:

- Every threat scenario has `impact`, `likelihood`, and `owner`.
- Every mitigation maps to a concrete endpoint/file or operational control.
- `Decision` states `GO`, `GO_WITH_RISKS`, or `HOLD`.
