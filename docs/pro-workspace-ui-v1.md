# Pro Workspace UI v1

## 1. 阶段目标

基于现有架构，构建 Pro Workspace 的专业编辑壳层（UI only），用于专业用户对 Scene / Objects / Composition / Constraints / Prompt Preview 进行集中编辑与检查。

## 2. 与 Figma 参考源的对齐说明

所有 UI 结构、布局层级、信息密度、分栏逻辑、交互组织统一参考：

`/Users/dk/scene-pilot/src/design-reference/figma/app.tsx`

对齐要点：

- **布局**：左 260px 导航 | 中间主编辑区 | 右 260px 状态栏
- **颜色**：`#1f2125` 背景，`#24262b` 面板，`#3a3f46` 边框，`#343942` 悬停，`#e5e7eb` 正文，`#9ca3af` 次要，`#f59e0b` 强调
- **区块**：Section 折叠组织，紧凑工业面板风格
- **不引入**：移动端卡片流式布局、营销页风格、脱离工作台体系的新视觉结构

## 3. 整体布局说明

```
Header（沿用现有）
└── Main Workspace
    ├── Left: ProWorkspaceNav (260px)
    │   └── Scene | Objects | Composition | Constraints | Prompt Preview
    ├── Center: ProWorkspaceEditor (flex 1)
    │   └── 根据当前 section 渲染对应编辑面板
    └── Right: ProWorkspaceStatusRail (260px)
        └── 模板来源 | 应用模式 | 场景状态 | 风险提示 | 禁用说明 | 规则摘要
```

在现有 App 壳层中接入，不创建独立页面系统。

## 4. 模块清单

| 模块 | 职责 |
|------|------|
| ProWorkspaceShell | 整体布局，管理当前 section |
| ProWorkspaceNav | 左侧五类导航 |
| ProWorkspaceEditor | 中间主编辑容器，根据 section 切换面板 |
| SceneEditorPanel | 编辑 Scene 级字段 |
| ObjectEditorPanel | 编辑 Object 级字段，**continuityId 唯一入口** |
| CompositionEditorPanel | 编辑构图字段，含 Stage 画布 |
| ConstraintInspectorPanel | 只展示规则命中 / disabled / 冲突 |
| PromptPreviewPanel | 只读 prompt 预览 |
| ProWorkspaceStatusRail | 右侧状态栏 |

## 5. 每个 Panel 的职责

### SceneEditorPanel

- 仅显示 scene 可编辑字段：name, duration_s, shotNote, shot, movement, transition, inheritFromPrevious, time, key_dir, bg
- 遵守 field-to-module、editability、disabled policy
- **不包含 continuityId 编辑入口**
- applyMode=layout_only 时字段禁用，并展示禁用说明

### ObjectEditorPanel

- 对象列表 + 当前对象编辑区
- **continuityId 唯一编辑入口**（仅在此面板）
- 字段：type, look, notes, externalPrompt, continuityId

### CompositionEditorPanel

- 使用 Stage 画布 + 数值编辑（x, y, w, h, rot, z）
- 支持 T0/T1 关键帧切换

### ConstraintInspectorPanel

- 只展示：detectSceneConflicts 结果、layoutLocked、object state labels
- 不编辑 rule，不创建新规则

### PromptPreviewPanel

- 只读展示 buildPromptForScene 输出
- 显示来源说明（scene / object / template）
- 不编辑 prompt

### ProWorkspaceStatusRail

- 展示：当前模板来源、applyMode、场景状态、风险提示、禁用说明、规则摘要

## 6. continuityId 单入口如何体现

- continuityId 仅在 **ObjectEditorPanel** 中提供编辑入口
- SceneEditorPanel 不提供 continuityId 编辑
- ObjectEditorPanel 内提供 “连续性锚点 ID (continuityId)” 输入框

## 7. Constraints / disabled state 如何展示

- **ConstraintInspectorPanel**：展示 detectSceneConflicts 冲突列表、layoutLocked 说明、各对象 state labels（locked, anchor-bound, inherited 等）
- **StatusRail**：冲突数量、布局锁定提示
- **SceneEditorPanel**：layoutLocked 时展示禁用说明并置灰字段

## 8. Prompt Preview 为何只读

- 本阶段不做 Prompt 手工编辑器
- Prompt 由现有 prompt engine 生成，仅展示预览
- 避免引入第二套 prompt 编辑逻辑

## 9. 是否修改架构

**否**。Pro Workspace 是现有架构的专业编辑 UI 外壳，未修改数据流或模块职责。

## 10. 是否修改 schema

**否**。未修改 project / scene / layer / template schema。

## 11. 是否新增字段

**否**。未新增任何字段。

## 12. 后续阶段前置条件

- Pro Workspace UI v1 已完成并可正常切换
- 后续可进入：Rule Engine UI、Prompt UI、Export UI、Platform Adapt UI、Template Authoring 等（按阶段规划）
