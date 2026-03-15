# Template Workspace UI

**Stage:** Template Workspace UI

**目标：** 实现 Template Workspace 面板，用于浏览 / 选择 / 应用 template。

---

## UI 结构

| 区域 | 组件 | 说明 |
|------|------|------|
| 顶部 | TemplateWorkspaceHeader | 搜索、筛选（mediaType, storyPlan, ratio, domain, pricing）、关闭 |
| 左侧 | TemplateFamilyList | family 列表，从 TemplateIndex 派生唯一 familyId |
| 中间 | TemplateGridContainer | variant 列表（选中 family 下的 templates），网格/列表切换 |
| 右侧 | TemplateWorkspaceDetail | template 详情（名称、描述、定价、媒体类型、应用模式、Use Template 按钮）|
| 底部 | （在 Detail 内） | applyMode 选择 + Use Template 按钮 |

### 布局示意

```
+------------------+--------------------------------+------------------+
| Header: 搜索 筛选 关闭                                            |
+------------------+--------------------------------+------------------+
| Family List      | Variant Grid / List            | Template Detail  |
| (左侧)           | (中间)                         | (右侧)           |
| 全部             | [卡片] [卡片] [卡片] ...        | 名称、描述        |
| product_hero     |                                | 定价、媒体类型    |
| dialogue_duo     |                                | applyMode:       |
| ...              |                                | ○ layout_only    |
|                  |                                | ○ layout_plus    |
|                  |                                | ○ full_workflow  |
|                  |                                | [Use Template]   |
+------------------+--------------------------------+------------------+
```

---

## 调用流程

```
用户点击 Use Template
  → TemplateWorkspace.handleUse
  → onUseTemplate(index, state.applyMode)
  → App.handleUseTemplateFromWorkspace(index, applyMode)
  → applyTemplateFromIndex(index, project, true, applyMode)
  → loadTemplatePayloadById(index.id)
  → applyPayloadToProject(payload, project, true, applyMode)
```

**唯一入口：** 使用现有 `applyTemplateFromIndex`，未新增 apply 入口。

---

## 是否改架构

**否**

- 未修改 template engine
- 未修改 payload schema
- 未修改 template schema
- 未修改 prompt engine / compileV2 / resolveSceneStrategy
- 未修改 applyPayloadToProject

---

## 是否改 schema

**否**

- 未新增 template/payload 字段
- 仅新增 UI 状态 `selectedFamilyId`（TemplateWorkspaceState）
