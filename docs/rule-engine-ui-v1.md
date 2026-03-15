# Rule Engine UI v1

## 1. 阶段目标

将现有 Rule Engine / disabled state / conflict detection 做成**可视化、可解释、可定位**的 UI。

- **规则检查与解释界面**，不是规则编辑器
- 展示规则命中、禁用状态、冲突列表、处理建议
- 支持跳转到对应 layer / object
- 为后续 Prompt UI 提供可解释基础

## 2. 与 Figma 参考源的对齐说明

所有 UI 对齐 `src/design-reference/figma/app.tsx`：

- **颜色**：`#1f2125` bg, `#24262b` panel, `#3a3f46` border, `#343942` hover, `#f59e0b` accent, `#e5e7eb` text, `#9ca3af` textMuted
- **区块结构**：使用 `EditorSection` 实现可折叠 Section，与 Figma 中 Camera & Lighting、Object Layers、Properties、Composition 等区块一致
- **信息密度**：紧凑行高、小字号（10–12px）、合理分组
- **风格**：工业工作台风格，非表格后台风格

## 3. 规则 UI 的整体布局

```
ProWorkspaceShell
├── ProWorkspaceNav (Scene | Objects | Composition | Constraints | Prompt Preview)
├── ProWorkspaceEditor
│   └── constraints 面板 → ConstraintInspectorPanel
│       ├── Rule Summary (规则汇总)
│       ├── Active Rules (生效规则)
│       ├── Disabled Fields (禁用字段)
│       ├── Conflicts (冲突列表)
│       └── Resolution Hints (处理建议)
└── ProWorkspaceStatusRail
    └── RuleSummarySection（紧凑汇总）
```

## 4. Rule Hits 如何展示

- **RuleSummarySection**：按等级显示 counts
  - 错误 (errors)：`severity === "high"` 的 conflict 数量
  - 警告 (warnings)：`severity === "warning"` 的 conflict 数量
  - 锁定 (locked)：`layoutLocked` 时为 1
  - 对象状态 (object states)：有 locked / anchor-bound / protected-layout 的对象数量

- **ActiveRuleList**：展示 `detectSceneConflicts` 返回的每条 conflict
  - 规则 id、标题、作用范围 (scope)、影响对象 (layerId)
  - 可点击 layerId 调用 `onJumpToConflict`

## 5. Disabled State 如何展示

- **DisabledStateSection**：从 disabled-state-policy-v1 推导
  - `layoutLocked` → 全部场景字段，source: applyMode
  - `mediaMode === "image"` → 视频运动相关字段，source: mediaType
  - 对象 `isLocked` → 布局锁定，source: layoutLocked
  - 对象 `continuityId` → 锚点已绑定，source: template
  - 对象 `isProtectedLayout` → 受保护布局，source: template

- 每条显示：field, current state, disabled reason, source

## 6. Conflict Detection 如何展示

- **ConflictListSection**：按 severity 分组
  - High：红色图标
  - Warning：accent 色图标
  - 每条可点击 layerId 跳转
  - 复用 `detectSceneConflicts`，不新增冲突引擎

## 7. Jump to Conflict 如何复用

- 沿用 `onJumpToConflict`：从 ConstraintInspectorPanel 传入 ProWorkspaceEditor
- 冲突项、对象状态项中的 layerId 可点击，调用 `onJumpToConflict(layerId)`
- 选中态通过 `selectedLayerId === c.layerId` 高亮

## 8. 是否修改架构

**否**。仍使用现有 project / scene / layer 数据流、`detectSceneConflicts`、`getStageObjectState`、`resolveSceneConfig`。

## 9. 是否修改 Schema

**否**。未改动 project、scene、layer 等 schema。

## 10. 是否新增字段

**否**。未新增字段。

## 11. 是否修改 Rule 定义

**否**。仅展示 `detectSceneConflicts` 的现有输出，未修改 conflictRules、rule 类型或规则逻辑。

## 12. 是否准备进入 Prompt UI

**是**。本阶段已展示“规则会影响 prompt 输出”的说明（Resolution Hints 中可引导用户到对应面板），为 Prompt UI 的可解释性奠定基础。未实现 prompt 编辑、diff、authoring。

---

## 验收摘要

| 项目 | 结论 |
|------|------|
| **Stage** | Rule Engine UI v1 |
| **Tasks** | RuleSummarySection, ActiveRuleList, DisabledStateSection, ConflictListSection, ResolutionHintSection |
| **Modified files** | ConstraintInspectorPanel.tsx, ProWorkspaceStatusRail.tsx |
| **New files** | RuleSummarySection.tsx, ActiveRuleList.tsx, DisabledStateSection.tsx, ConflictListSection.tsx, ResolutionHintSection.tsx |
| **New fields** | none |
| **Schema change** | no |
| **Architecture change** | no |
| **Rule definition change** | no |
| **Figma reference aligned** | yes |
| **Ready for Prompt UI** | yes |
