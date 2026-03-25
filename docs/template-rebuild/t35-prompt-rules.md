# T3.5 Prompt Rules

## Weak Field Handling

1. Weak fields cannot override core fields.
2. Weak fields are downgraded to supplemental clauses.
3. If weak field conflicts with core field, weak field is dropped.

## Conflict Field Handling

1. Run conflict detection before prompt assembly.
2. Resolve by priority; unresolved lower-priority clause is dropped.
3. Keep deterministic conflict outcome for same input.

## Duplicate Field Handling

1. Exact duplicates are deduplicated.
2. Near-duplicates are normalized to one canonical expression.
3. Contradictory duplicates are treated as conflicts and resolved via priority rules.

## Metadata Handling

1. Metadata must be stored in sidecar/structured data.
2. Metadata must not pollute core prompt segments.
3. Metadata is readable for audit but not used as direct prompt content unless explicitly mapped.

## Hidden Field Handling

1. Hidden fields are non-primary by default.
2. Hidden fields may only enter prompt when explicitly mapped and validated.
3. Hidden fields cannot override required visible control fields.

## Pro Field Handling

1. Pro fields are allowed as enhancement constraints.
2. Pro fields must remain compatible with core segment structure.
3. Pro fields cannot break required segment completeness.

## Advanced Field Handling

1. Advanced fields must pass conflict and lint checks before prompt insertion.
2. Advanced fields are appended as controlled enhancements, not free-form overrides.
3. Advanced fields violating determinism are rejected.
