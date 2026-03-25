# T3 Template Structure Standard

## Required Structural Blocks

Each template MUST include these structural blocks:

- scene
- shot
- layer
- subject
- semantic

## Structural Capability Requirements

Each template MUST support:

1. Multi-layer space expression (foreground/midground/background or equivalent depth structure)
2. Camera control (angle/shot/movement or equivalent shot intent)
3. Lighting control (direction/type/mood or equivalent)
4. Composition control (placement/framing/balance or equivalent)

## Minimum Structural Integrity

1. `scene` must contain at least one valid shot context.
2. `shot` must be mappable to prompt camera segment.
3. `layer` must represent hierarchy, not a flat undifferentiated object list.
4. `subject` must be identifiable as primary entity.
5. `semantic` must define scene intent or narrative objective.

## Fail Conditions

Template structure is invalid when:

- scene exists but no shot semantic is present,
- layer exists but has no hierarchy semantics,
- subject is missing/ambiguous,
- semantic cannot drive prompt intent.
