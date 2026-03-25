# T3 Conflict Standard

## Conflict Types

- camera conflict
- space conflict
- composition conflict
- lighting conflict
- style conflict
- semantic conflict
- action conflict

## Standard Conflict Actions

Each conflict MUST define:

- priority
- fallback
- merge
- drop

## Priority Baseline

1. subject
2. semantic
3. camera
4. space
5. composition
6. layer
7. lighting
8. material
9. detail
10. mood
11. style

## Conflict Resolution Rules

1. Same-domain conflict: keep higher-priority field, downgrade lower-priority field to fallback clause.
2. Cross-domain conflict: preserve semantic readability first, then preserve camera/space constraints.
3. Merge rule: merge only non-contradictory constraints; contradictory clauses cannot be merged directly.
4. Drop rule: if conflict remains unresolved after fallback, drop the lower-priority clause.

## Required Conflict Record

For each conflict pair, record at least:

- fieldA
- fieldB
- conflictType
- reason
- priorityField
- fallbackStrategy
- mergePolicy
- dropPolicy
