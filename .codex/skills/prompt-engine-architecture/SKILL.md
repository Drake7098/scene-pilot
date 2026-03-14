---
name: prompt-engine-architecture
description: Use when changing ScenePilotix prompt generation, scene strategy, platform adaptation, genMode quick/pro prompt behavior, creative-context routing, or provider-specific prompt compilation. Keeps the prompt engine structured, platform-aware, and separated from product UI concerns.
---

# Prompt Engine Architecture

Use this skill for any ScenePilotix task that touches:

- `prompt.ts`
- `promptEngine.ts`
- `promptPipeline.ts`
- `promptEngines/*`
- `sceneStrategyResolver.ts`
- genMode quick/pro prompt differences
- platform adaptation for `fal`, `Runway`, or other providers
- creative-context routing
- scene-strategy prompt distribution
- provider execution strategy boundaries

## Goal

Keep prompt generation as a structured architecture, not a pile of prompt patches.

ScenePilotix should behave like a prompt execution layer with platform-specific compilers.

## Core Model

ScenePilotix prompt flow should stay conceptually split into:

1. user input / raw intent
2. normalized structure
3. scene strategy
4. creative context
5. workspace-specific prompt behavior
6. platform adaptation
7. provider execution

Do not collapse these layers into one function or one giant prompt template.

## Required Architecture Rules

- genMode quick and pro prompt behavior must stay distinct.
- Image and video prompt behavior must stay distinct.
- Scene strategy must be passed as structured metadata, not inferred late from UI text.
- Creative context must be passed explicitly if the platform layer needs it.
- Platform adaptation must happen in the prompt engine layer, not scattered through UI components.
- Product-facing copy and prompt execution logic must stay separate.
- Provider execution strategy is not the same thing as prompt adaptation.

## Platform Principles

### fal
- Favor object hierarchy, composition clarity, material readability, and scene structure.
- Treat scene presets and lighting defaults as composition anchors.

### Runway
- Favor shot execution, motion continuity, timing, camera movement, and readable action flow.
- Treat scene strategy as motion / lighting / continuity bias, not as object-layout JSON.

## Scene Strategy Rules

- Scene strategy is a first-class input into prompt adaptation.
- It should influence defaults, prompt lines, and platform adaptation metadata.
- Do not let object-level notes silently override scene-level strategy.
- Lighting defaults and lighting soft-language both matter.

## Provider Strategy Rules

- Temporary local testing strategy may differ from long-term provider strategy.
- If local testing is switched (for example, ComfyUI-first), record it in `live-development-strategy.md`.
- Do not present a UI/provider model that implies a provider adapter exists when execution still uses another local fallback path without documenting it.

## Required Review Pass

Before editing prompt-engine code, explicitly check:

1. Is this change about structure, adaptation, or execution?
2. Does this belong in UI, prompt pipeline, platform engine, or provider layer?
3. Will this change affect Quick, Pro, image, and video differently?
4. Is the metadata already available upstream, or am I re-deriving it too late?
5. Am I making a temporary workaround look like final architecture?
6. Does this change require an update to `live-development-strategy.md`?

## Mandatory Engine Lock Sync (Testing + Update)

For any prompt-engine task, this is mandatory:

1. Before any test run, verify engine lock:
   - `npm run engine:lock:check`
2. If any engine library file changed, update lock first:
   - `npm run engine:lock:update`
3. In the same turn, sync strategy document:
   - update `/Users/dk/scene-pilot/docs/live-development-strategy.md` prompt-engine section
4. Then run tests.

Do not run benchmark/e2e tests with stale engine lock.
Do not rely on chat memory of engine state.

Engine lock source:
- `/Users/dk/scene-pilot/docs/engine-library-lock.json`

Engine lock script:
- `/Users/dk/scene-pilot/scripts/engine-library-lock.mjs`

The lock covers the prompt-engine library files and acts as the pre-test consistency gate across threads.

## Files to Read First

Read only what is needed, but start with the most relevant combination:

- `/Users/dk/scene-pilot/docs/live-development-strategy.md`
- `/Users/dk/scene-pilot/src/utils/promptPipeline.ts`
- `/Users/dk/scene-pilot/src/utils/promptEngines/builtin.ts`
- `/Users/dk/scene-pilot/src/utils/sceneStrategyResolver.ts`

Then expand to:

- `/Users/dk/scene-pilot/src/utils/prompt.ts`
- `/Users/dk/scene-pilot/src/utils/promptEngine.ts`
- `/Users/dk/scene-pilot/src/types/export.ts`

## Output Standard

For relevant tasks, final summaries should include:

- which layer changed: structure / adaptation / execution
- whether Quick/Pro behavior changed
- whether scene strategy or creative context routing changed
- whether provider behavior is temporary local testing or final architecture
- engine lock status (`checked` / `updated`) and lock hash used in the run
