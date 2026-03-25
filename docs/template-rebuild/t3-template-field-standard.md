# T3 Template Field Standard

## Mandatory Fields

Every template MUST contain the following fields:

- camera
- composition
- space
- layer
- lighting
- material
- detail
- semantic
- subject
- style
- mood

## Optional Fields

The following fields are optional:

- pose
- action
- storyPlan
- layout
- anchor

## Field Constraints

1. Mandatory fields must be non-empty strings or structured objects with non-empty effective values.
2. `subject` and `semantic` must be explicit and cannot be replaced by generic placeholders such as `custom`, `other`, `undefined`.
3. `camera`, `space`, `composition`, `lighting` must provide actionable control language, not only decorative wording.
4. Optional fields may be absent, but if present they must not conflict with mandatory field semantics.

## Validation Gate

A template fails standard gate if:

- any mandatory field is missing,
- any mandatory field is empty,
- core fields use undefined/custom fallback tokens without concrete content.
