# UI Polish v1 — Layout Normalize

**Stage:** UI Polish / Layout Normalize — STRICT SAFE (Figma-bound)

**Date:** 2025-03-14

---

## Unified Layout & Components

### 1. Header
- Height / border / padding / font / icon size aligned with Figma reference
- Pro workspace bottom bar uses `PRO_FIELD_GAP` and `PRO_BOTTOM_BAR_PADDING`

### 2. Left Rail
- **Width:** 260px (`editorTheme.sizing.navWidth` / `PRO_NAV_WIDTH`)
- **Pro:** `ProWorkspaceNav` uses `PRO_NAV_WIDTH`, `PRO_PANEL_PADDING`, `PRO_FIELD_GAP`
- **Template:** `TemplateFamilyList` uses `editorTheme.sizing.navWidth`, `pro-rail-scroll`
- Section padding, icon size, text size, hover/active styles unified

### 3. Right Rail / Status Rail
- **Width:** 260px (`editorTheme.sizing.railWidth` / `PRO_RAIL_WIDTH`)
- **Pro:** `ProWorkspaceStatusRail` uses `PRO_RAIL_WIDTH`, `PRO_PANEL_PADDING`, `PRO_SECTION_GAP`, `pro-rail-scroll`
- **Template:** `TemplateWorkspaceDetail` uses `editorTheme.sizing.railWidth`, `editorTheme.spacing.panelPadding`, `pro-rail-scroll`
- Section spacing, header style, field label style unified

### 4. Section Styles
- All panels reuse `EditorSection` from `src/components/ui`
- `EditorSection` uses `editorTheme` (colors, spacing, typography) — matches FIGMA_COLORS
- No per-panel custom Section implementations

### 5. Panel Padding
- **Constants:** `PRO_PANEL_PADDING` (16), `PRO_SECTION_GAP` (12), `PRO_FIELD_GAP` (8)
- ProWorkspaceShell bottom bar: `PRO_FIELD_GAP` vertical, `PRO_BOTTOM_BAR_PADDING` horizontal
- ProWorkspaceEditor: `PRO_PANEL_PADDING`, `PRO_SECTION_GAP`
- ProWorkspaceStatusRail / ProWorkspaceNav: `PRO_PANEL_PADDING`, `PRO_SECTION_GAP`, `PRO_FIELD_GAP`

### 6. Input / Select / Checkbox / Button
- Components use `editorTheme` (control height, typography)
- No hardcoded `#fff` / `#000` / `#333` / `#999` in Pro or Template workspaces

### 7. Bottom Bar
- Pro workspace bottom slot: `PRO_FIELD_GAP`, `PRO_BOTTOM_BAR_PADDING`, `PRO_SECTION_GAP`
- Border-top, background, padding unified with Figma

### 8. Editor Layout
- ProWorkspaceEditor: center area with `PRO_PANEL_PADDING`, `PRO_SECTION_GAP`
- Composition bottom panel: `pro-rail-scroll`, same padding
- Non-composition panels: `pro-rail-scroll`, `PRO_PANEL_PADDING`

### 9. Colors
- All use `FIGMA_COLORS` (pro-workspace) or `editorTheme.colors` (template) — same values
- `editorTheme.colors` = `#1f2125`, `#24262b`, `#3a3f46`, `#343942`, `#e5e7eb`, `#9ca3af`, `#f59e0b`, `#d97706`
- TemplateWorkspaceDetail: removed `#1f2125` hardcode; uses `colors.bg`

### 10. Scroll / Overflow
- **Class:** `pro-rail-scroll` in `index.css`
  - `overflow-y: auto`, `scrollbar-width: thin`, `scrollbar-color: #3a3f46`
  - WebKit scrollbar: 8px width, `#3a3f46` thumb, `#343942` hover
- Applied to: ProWorkspaceNav, ProWorkspaceStatusRail, ProWorkspaceEditor panels, TemplateFamilyList, TemplateWorkspaceDetail

---

## Constants Added / Updated

| Constant | Value | Usage |
|----------|-------|-------|
| `editorTheme.sizing.navWidth` | 260 | Left rail (Template, Pro) |
| `editorTheme.sizing.railWidth` | 260 | Right rail (Template, Pro) |
| `PRO_NAV_WIDTH` | 260 (from theme) | ProWorkspaceNav |
| `PRO_RAIL_WIDTH` | 260 (from theme) | ProWorkspaceStatusRail |
| `PRO_PANEL_PADDING` | 16 | Panels |
| `PRO_SECTION_GAP` | 12 | Section spacing |
| `PRO_FIELD_GAP` | 8 | Field spacing |
| `PRO_BOTTOM_BAR_PADDING` | 16 | Bottom bar horizontal |

---

## Files Modified

- `src/index.css` — Added `pro-rail-scroll` class
- `src/theme/editorTheme.ts` — Added `navWidth`, `railWidth`
- `src/features/pro-workspace/constants.ts` — Use `editorSizing` for nav/rail width
- `src/features/pro-workspace/components/ProWorkspaceNav.tsx` — Constants, `pro-rail-scroll`
- `src/features/pro-workspace/components/ProWorkspaceStatusRail.tsx` — Constants, `pro-rail-scroll`
- `src/features/pro-workspace/components/ProWorkspaceShell.tsx` — Bottom bar constants
- `src/features/pro-workspace/components/ProWorkspaceEditor.tsx` — Panel padding, `pro-rail-scroll`
- `src/features/template-workspace/components/TemplateWorkspace.tsx` — Use `editorTheme.colors`
- `src/features/template-workspace/components/TemplateFamilyList.tsx` — `editorTheme`, nav width 260, `pro-rail-scroll`
- `src/features/template-workspace/components/TemplateWorkspaceDetail.tsx` — `editorTheme`, rail width 260, `pro-rail-scroll`, `colors.bg` for button text

---

## Schema Change

**no**

---

## Engine Change

**no**

---

## New Fields

**none**

---

## Ready for Template600 Expansion

**yes**

---

## Acceptance Format

```
Stage: UI Polish v1

Unified:
Header
LeftRail
RightRail
Section
Padding
Input
BottomBar
EditorLayout
Colors

Schema change:
no

Engine change:
no

New fields:
none

Ready for Template600 Expansion:
yes
```
