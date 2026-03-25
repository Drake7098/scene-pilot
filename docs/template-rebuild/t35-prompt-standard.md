# T3.5 Prompt Standard

## Required Prompt Segments

Prompt MUST include these segments:

- camera
- composition
- space
- layer
- lighting
- material
- detail
- mood
- style
- semantic
- subject

## Mandatory Priority Order

Prompt conflict arbitration and final ordering MUST follow:

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

## Rendering Rule

1. Segment headers must be explicit (`field: value`).
2. Missing segment values must be marked as `not specified` during validation phase, not silently dropped.
3. Prompt body must not collapse all segments into one uncontrolled paragraph.

## Compliance Gate

Prompt standard fails when:

- any required segment is missing,
- segment ordering violates mandatory priority order,
- segment is present but carries no effective value.
