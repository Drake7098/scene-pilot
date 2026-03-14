# 模板引擎架构

## 一、template-engine 职责

`src/template-engine/` 为独立的模板逻辑层，负责：

| 能力 | 入口方法 | 说明 |
|------|----------|------|
| 模板索引 | `getTemplateIndex`, `getTemplateIndexById`, `getTemplateIndexStats` | 400 base + 100 webdrama + 100 anime = 600 |
| Payload 加载 | `loadTemplatePayloadById`, `loadTemplatePayload` | 按 id 或 familyId+variant 加载 |
| 应用 | `applyTemplateFromIndex`, `applyPayloadToProject` | 统一主链 |
| 费用 | `resolveTemplateCost` | 从 TemplateIndex 解析 cost |
| 权益 | `canUseTemplate` | 结合 unlimited 与 credits |
| 元数据 | `getTemplateMetadataFromIndex` | id / cost / name 等 |

## 二、template-workspace 职责

`src/features/template-workspace/` 为 UI 层，负责：

| 能力 | 说明 |
|------|------|
| 组件 | TemplateWorkspace, TemplateCard, TemplateSidebarEntry 等 |
| 交互状态 | templateWorkspaceState, templateWorkspaceReducer |
| 筛选 / 搜索 | templateSearchService：filterTemplateIndex、getRecentFromIndex、getFavoritesFromIndex |
| 最近 / 收藏 | useTemplateFavorites, useTemplateRecent（依赖 localStorage） |
| 展示 | 模板列表、详情、分类导航 |

Workspace 不承担模板引擎逻辑，通过 `template-engine` 获取索引、加载 payload、应用。

## 三、主要入口方法

| 方法 | 所属 | 说明 |
|------|------|------|
| `getTemplateIndex()` | engine | 获取全量 600 条索引 |
| `getTemplateIndexById(id)` | engine | 按 id 查询 |
| `loadTemplatePayloadById(id)` | engine | 按 id 加载 payload |
| `applyTemplateFromIndex(index, project, append)` | engine | 统一 apply 入口 |
| `applyPayloadToProject(payload, project, append)` | engine | 直接应用 payload |
| `resolveTemplateCost(template)` | engine | 模板 cost |
| `canUseTemplate(template, user, credits)` | engine | 是否可用（unlimited 或 credits 足够） |
| `getTemplateMetadataFromIndex(index)` | engine | 元数据 |

## 四、当前迁移策略

**一次迁完**：本轮已将核心逻辑迁入 engine。

- `template-engine` 拥有：types、registry、factory、payload、apply、billing、entitlement、index、data/families
- `template-workspace` 的 model、data/templateIndexData、services/templateApplyService、templateLoader 改为 re-export engine
- Workspace 内 `data/families`、`factory`、`services/templateContinuityLoader` 等为遗留，可后续移除

## 五、App 层调用关系

- App 通过 `template-workspace` 的公开 API 使用模板能力
- Workspace 对引擎能力做 re-export，App 无需直接依赖 engine（可保持仅依赖 workspace）
- 主流程：`handleUseTemplateFromWorkspace` → `applyTemplateFromIndex` → `loadTemplatePayloadById` → `applyPayloadToProject`

## 六、Billing / Backend 接入点

| 层级 | 建议接入点 |
|------|------------|
| **Billing** | `template-engine/billing/resolveCost` 扩展为可查后端价格；`canUseTemplate` 可扩展为查 entitlement |
| **Backend** | `template-engine/index` 可扩展为远程拉取索引；`loadTemplatePayloadById` 可扩展为远程拉取 payload |
| **Entitlement** | `template-engine/entitlement/canUseTemplate` 已依赖 `canUseUnlimitedTemplates`，可扩展为更多权益规则 |

后续 backend 接入时，优先在 engine 内增加 adapter/service，不侵入 workspace UI。
