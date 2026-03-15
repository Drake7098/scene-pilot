---
name: ui-design-reference
description: Use when changing UI layout, spacing, colors, or component structure in ScenePilotix. The design reference file is the single source of truth for visual specs.
---

# UI Design Reference

Use this skill whenever you modify user-facing UI in ScenePilotix: layout, height, spacing, colors, panel structure, or component hierarchy.

## Single Source of Truth

**Design Reference File** (必读):
`/Users/dk/scene-pilot/src/design-reference/figma/app.tsx`

This file defines the canonical Figma/SceneMaker theme and component structure. All UI changes must align with it.

**强制规则：**
- 本阶段所有 UI 结构、布局层级、信息密度、分栏逻辑、交互组织，必须统一参考该文件
- 允许基于业务做内容适配
- **不允许脱离该参考源单独设计新的 UI 体系**

## Design Reference Contents

- **Colors**: `#1f2125` (bg), `#24262b` (panel), `#3a3f46` (border), `#343942` (hover), `#e5e7eb` (text), `#9ca3af` (text muted), `#f59e0b` (accent)
- **Section/Collapse**: `Section` component with `pt-1`, `px-3`, `pb-3` content padding
- **Row height**: `--pro-row-height: 28px` in index.css
- **Compact spacing**: prefer `gap` over stacked margins; avoid double margins (e.g. head marginBottom + list marginTop)
- **Right inspector**: Scene Background, Properties, Composition, Effects sections

## Required Workflow

1. **Before editing UI**: Read the design reference file to see the target layout and spacing.
2. **Align with reference**: Use the same colors (or CSS vars), padding, gap, and component hierarchy.
3. **Avoid stacking margins**: Use `display: flex; flex-direction: column; gap: N` instead of `marginBottom` + `marginTop` on siblings.
4. **Remove residue**: Delete unused wrappers, duplicate styles, or leftover code from prior iterations.

## When to Use

- Changing layout or spacing in Pro props panel, sidebar, or canvas
- Adding or restructuring sections (Scene Background, Object Layers, etc.)
- Fixing height/overflow issues
- Aligning new components with the design system

## Output Standard

When completing UI tasks, note in the summary:
- Which design reference patterns were applied
- Any spacing/height fixes made
- Residual code removed (if any)
