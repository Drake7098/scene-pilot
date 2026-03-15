---
name: product-ui-guardrails
description: Use when changing product-facing UX in ScenePilotix, especially menus, top bars, save/open/export/import flows, workspace switching, naming, status persistence, help-center boundaries, and feature entry priorities.
---

# Product UI Guardrails

Use this skill for any ScenePilotix task that changes user-facing product flow, especially:

- menus and dropdowns
- top-bar actions
- save / save as / open / import / export
- workspace entry (single Pro)
- project library / template / file export boundaries
- naming and button labels
- success / hint / empty states
- help-center vs page copy boundaries

## Goal

Keep product interaction professional, minimal, and consistent.

Working code is not enough. Before editing, check whether the interaction model is coherent.

## Non-Negotiables

- One user event must have one name.
- One primary action should not have multiple entrances unless they are intentionally mirrored.
- High-frequency actions go higher.
- Low-frequency or destructive actions go lower.
- Page UI should not carry long explanations. Explanations belong in Help Center.
- Workspace is unified as Pro. No Quick/Pro switching.
- Save and Export are different concepts. Do not merge them.
- Project library, template library, and exported files must stay distinct.
- If a choice should persist, persist it. Do not re-ask every time.
- If a workflow completes, do not show redundant “how to use what you just downloaded” blocks unless the user is blocked.
- Critical state must stay visible. Do not make users remember it.
- Actions that require additional choices, input, or a picker should usually use an ellipsis.
- Expert efficiency beats tutorial ceremony in Pro surfaces.
- Advanced capability should use progressive disclosure instead of being always visible.

## Required Review Pass

Before changing code, explicitly review these questions in your reasoning:

1. What is the single user intent here?
2. Is there already another button/menu item doing the same thing?
3. Is the current name consistent with the rest of the product?
4. Should this action live in the main workspace or elsewhere?
5. Should the system remember this choice after the first time?
6. Is this a save action, an export action, or a library action?
7. Does this page now contain explanation text that should instead live in Help Center?
8. If the user finishes this action, should the UI quietly close instead of showing extra ceremony?
9. Which key state must remain visible on screen so the user doesn't have to remember it?
10. Should this action be removed when unavailable, or stay visible but disabled?
11. Does this label need an ellipsis because more information is still required?
12. Is this Pro surface optimizing for expert speed, or accidentally optimizing for tutorial feel?

If any answer is unclear, simplify before adding UI.

## Default Product Rules

### Menus

- Order by frequency, not implementation history.
- Remove duplicate items instead of renaming both.
- Do not keep “legacy convenience” entries if they create overlap.
- Keep important or frequently used actions first.
- If a menu becomes long, split or regroup it instead of letting it sprawl.
- If an action is unavailable but important to discoverability, prefer disabled over hidden.

### Naming

- Use the same label in every entrance for the same action.
- Prefer product language over engineering language.
- Avoid pairs like `Quick Copy` vs `Copy Prompt` for the same action.
- Use concise, specific labels.
- If the command requires more information before it can complete, add an ellipsis.
- If the command happens immediately, do not add an ellipsis.
- Use the same terminology across menu labels, modal titles, and help-center entries.

### Save / Export / Library

- `Save`: write the current project back into the project system.
- `Save As`: create another project file and allow a new target profile if needed.
- `Export`: create assets for external platforms or handoff.
- `Library`: open/manage saved projects, not temporary outputs.

### Quick / Pro

- Pro is the precision workspace.
- Quick is optional and should not dominate Pro chrome.
- In Pro, any path back to Quick should be secondary.
- Pro surfaces should favor speed, low interruption, and stable command placement.

### Success States

- Prefer short hint/toast over large success cards.
- After file export/download, users should usually be able to close immediately.
- Only keep post-success UI if there is a real next action that would otherwise be unclear.

### Visibility

- Keep critical state visible instead of relying on user memory.
- For this repo, typical visible state includes:
  - current save target platform
  - whether the project is unsaved
  - current export scope
  - overwrite or replace risk when saving/importing

### Progressive Disclosure

- Keep defaults simple.
- Put advanced or infrequent controls behind a second step, submenu, or modal.
- “More” entrances are only valid when there is genuinely meaningful additional capability.

### Availability

- Hide actions that are irrelevant in the current mode and would create confusion.
- Disable actions that are part of the product model but temporarily unavailable.
- Never keep a dead action visible just because it existed historically.

### Standalone pages (full-site standard)

- **Back / return**: All “back” or “go to workspace” actions live in **one place**: the top-right chrome.
- **Language**: **One** language toggle button (e.g. shows “EN” when current is zh, “中文” when current is en), in the **top-right** next to the back link. Use `useLocalLang` and persist to `scenepilot_lang`.
- **Chrome**: Use `StandalonePageChrome`: top-right = [Lang button] [Back / 返回工作台] [optional extra links]. No duplicate lang or back controls elsewhere on the page.
- **Long pages**: Add a **footer** with a single button/link “返回工作台” / “Back to Workspace” (or the page’s back target). Use `showFooter` on `StandalonePageChrome`.
- **Implementation**: `src/hooks/useLocalLang.ts`, `src/components/StandalonePageChrome.tsx`. New standalone pages (pricing, legal, account, product intro, etc.) must use this chrome and hook.

## Expected Implementation Pattern

When touching affected areas:

1. Inspect nearby UI and all existing entrances.
2. Decide the canonical action model first.
3. Remove duplicates and invalid paths.
4. Rename every remaining entrance consistently.
5. Add persistence if the choice should be remembered.
6. Re-check page copy against Help Center boundary.
7. Run build/tests relevant to the area.

## Output Standard

In final summaries for these tasks, explicitly mention:

- what duplicate or conflicting action was removed
- what the canonical action name is now
- what state is now persisted
- what UI ceremony was removed
