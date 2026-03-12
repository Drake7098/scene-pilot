---
name: live-dev-sync
description: Use when working on ScenePilotix across multiple threads or when a task may change product flow, workspace boundaries, naming, save/export behavior, prompt-engine routing, or platform execution strategy. Ensures the shared development strategy doc is treated as the single source of truth and updated at the end.
---

# Live Dev Sync

Use this skill for any ScenePilotix task that can create cross-thread drift, especially:

- product flow changes
- Quick / Pro boundary changes
- save / open / export / import changes
- file menu changes
- project library or storage changes
- prompt-engine routing changes
- platform execution strategy changes
- temporary testing strategy changes
- architecture gap tracking

## Goal

Keep every thread aligned to the same product and engineering state.

The chat thread is not the source of truth.
The shared strategy document is the source of truth.

## Single Source of Truth

Always read this file before making relevant changes:

- `/Users/dk/scene-pilot/docs/live-development-strategy.md`

If the task changes any item recorded there, update the file before finishing.

## Required Workflow

1. Read `live-development-strategy.md` before planning code changes.
2. Compare the requested change against the current recorded strategy.
3. If the request conflicts with the recorded strategy, follow the user's latest instruction and then update the document.
4. If the task changes product flow, naming, storage, export, workspace boundaries, prompt-engine strategy, or provider strategy, update the document in the same turn.
5. In the final summary, explicitly call out whether the shared strategy document was updated.

## Cross-Thread Test Sync Gate (Mandatory)

To prevent thread A/B drift and old test methods:

1. Before any test command, run:
   - `npm run engine:lock:check`
2. If prompt-engine files changed in this thread, run:
   - `npm run engine:lock:update`
3. In the same turn, update:
   - `/Users/dk/scene-pilot/docs/live-development-strategy.md`
4. Only then run local-ab / robots / benchmark.

If `engine:lock:check` fails, do not continue testing on stale assumptions.

Lock file:
- `/Users/dk/scene-pilot/docs/engine-library-lock.json`

## Non-Negotiables

- Do not rely on chat memory when the shared strategy document covers the topic.
- Do not leave a thread-specific decision undocumented if it affects future work.
- Do not update code in a way that invalidates the shared strategy document without updating it.
- If a temporary workaround is introduced, mark it clearly in the strategy document as temporary.
- If an earlier thread implemented something that no longer matches the current strategy, the strategy document wins.

## When to Update the Shared Strategy Doc

Update `/Users/dk/scene-pilot/docs/live-development-strategy.md` when any of these change:

- main user flow
- main entry points
- naming of a canonical action
- Quick / Pro separation
- save / draft / project / export rules
- project storage format
- current local testing provider priority
- prompt-engine architecture or distribution logic
- scene-strategy behavior
- known gaps / high-risk files

## Output Standard

For relevant tasks, final summaries should include:

- whether the task matched the shared strategy or changed it
- whether `live-development-strategy.md` was updated
- any new temporary rule or known gap introduced
- whether engine lock check passed and which lock hash was used
