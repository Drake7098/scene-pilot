# T3 Template Lint Standard

## Required Lint Checks

- missing fields
- field conflicts
- field weakening
- fields not entering prompt
- field order mismatch
- missing prompt segments

## Lint Rules

1. Missing mandatory fields => error.
2. Core conflict unresolved => error.
3. Weakening of core field into generic text => warn/error (by severity).
4. Mandatory field not entering prompt mapping => error.
5. Prompt segment order violating standard => error.
6. Required prompt segment absent => error.

## Severity

- error: blocks release
- warn: allowed only for non-core optional degradations
- info: non-blocking diagnostic

## Lint Pass Criteria

Template passes lint only when:

- error count = 0
- required segment coverage = 100%
- core conflict unresolved count = 0
