# ScenePilotix 模板系统阶段性汇总报告

---

## 一、模板系统结构现状

### 1.1 新模板系统（features/template-workspace/）

| 目录 | 文件 | 职责 |
|------|------|------|
| **model/** | templateTypes.ts | 核心类型：Variant, Category, Domain, ContinuityVariant |
| | templateIndex.ts | 轻量索引类型 TemplateIndex |
| | templatePayload.ts | 完整 payload 类型 TemplatePayload |
| | templateFilter.ts | 筛选/范围/应用模式 |
| | templateCategory.ts | 分类导航 |
| **data/** | templateIndexData.ts | 合并 600 索引，触发 register400 |
| | families/indexAdapter.ts | 400 → TemplateIndex[] |
| | families/register400.ts | 注册 40 familyBases + 400 variantPatches |
| | families/continuity-webdrama/* | 网剧 20 家族 × 5 变体 |
| | families/continuity-anime/* | 动漫 20 家族 × 5 变体 |
| **factory/** | buildTemplatePayload.ts | base + patch 合并 |
| | unifiedAdapter.ts | UnifiedTemplate → Payload（base 400 fallback） |
| | familyBases/index.ts | 家族基底注册表 |
| | variantPatches/index.ts | 变体补丁注册表 |
| **services/** | templateLoader.ts | 按 id 加载 payload，支持 tpl400/tpl600 |
| | templateContinuityLoader.ts | 网剧/动漫 continuity 加载 |
| | templateApplyService.ts | applyTemplateFromIndex, applyPayloadToProject |
| | templateCreditsService.ts | cost 检查（轻量） |
| | templateSearchService.ts | 搜索/筛选 |
| **hooks/** | useTemplateWorkspace, useTemplateFilters, useTemplateSearch | |
| | useTemplateFavorites, useTemplateRecent | |
| **state/** | templateWorkspaceState.ts, templateWorkspaceReducer.ts | |
| **utils/** | templateGrouping.ts, templateCompatibility.ts | |
| **components/** | TemplateWorkspace, Header, Sidebar, Grid, List, Detail | |
| | TemplateCard, QuickEntry, SearchBar, FilterBar, CategoryNav | |
| **adapters/** | legacyAdapter.ts | Index → TemplateWorkspaceItem（base 仅） |

### 1.2 旧模板系统

| 文件 | 是否存在 | 是否仍在使用 |
|------|----------|--------------|
| model/template.ts | ✅ | ✅ applyTemplateSnapshot 入参 SceneTemplate |
| model/templateSnapshot.ts | ❌ | - |
| rules/applyTemplate.ts | ✅ | ✅ 单 scene 克隆植入 |
| rules/engine.ts | ❌ | - |
| rules/buildRuleContext.ts | ❌ | - |
| rules/applyPatches.ts | ❌ | - |
| data/builtinTemplates.ts | ✅ | ✅ templateStore.listBuiltinTemplates |
| lib/templateStore.ts | ✅ | ✅ cloneSceneFromTemplate |

### 1.3 结论

1. **新模板系统已独立 feature**：是。`src/features/template-workspace/` 为独立模块。
2. **旧模板系统仍在使用**：是。`applyTemplateSnapshot`、`templateStore.cloneSceneFromTemplate`、`builtinTemplates` 仍被调用。
3. **新旧兼容层**：有。`legacyAdapter.getTemplateWorkspaceItemFromIndex` 将 TemplateIndex 转为 TemplateWorkspaceItem（仅 base 400）；base 应用路径最终调用 `applyTemplateSnapshot`。
4. **模板应用路径**：
   - **Base 400**：`applyTemplateToProject` → getTemplateLibrary400 → unifiedTemplateToSceneTemplate → applyTemplateSnapshot
   - **Continuity 200**：`applyTemplateFromIndex` → loadTemplatePayloadById → applyPayloadToProject（直接合并 scenes）

### 1.4 调用关系图

```
App.handleUseTemplateFromWorkspace(indexOrItem)
  │
  ├─ [base] getTemplateWorkspaceItemFromIndex → item
  │     → doApplyBase(unifiedTemplateToSceneTemplate(item))
  │         → applyTemplateSnapshot(sceneTemplate, project, ...)
  │             → templateStore.cloneSceneFromTemplate
  │
  └─ [continuity] applyTemplateFromIndex(index)
        → loadTemplatePayloadById(id)
        │   → templateLoader
        │       ├─ tpl600_webdrama: templateContinuityLoader
        │       ├─ tpl600_anime: templateContinuityLoader
        │       └─ tpl400_*: buildTemplatePayload
        │             → getFamilyBase + getVariantPatch 或 unifiedAdapter
        │
        → applyPayloadToProject(payload, project)
            → 直接合并 scenes 到 project
```

```
TemplateWorkspace (打开时)
  → useTemplateWorkspace(state)
      → getTemplateIndex() [400 + 100 + 100]
      → filterTemplateIndex(scope, category, filters, search)
  → onUseTemplate(index)
      → addToRecent
      → App.handleUseTemplateFromWorkspace(index)
```

---

## 二、TypeScript 类型结构状态

| 类型 | 存在 | 路径 | 字段 | 完整性 | 使用中 |
|------|------|------|------|--------|--------|
| **TemplatePayload** | ✅ | model/templatePayload.ts | projectDefaults, scenes[], objects?, continuity?, exportDefaults | 完整 | ✅ |
| **TemplateIndex** | ✅ | model/templateIndex.ts | id, familyId, familyNameEn/Zh, variantId, nameZh/En, category, domain, tags, mediaType, storyPlan, ratio, isFree, cost, featured, variant? | 完整 | ✅ |
| **TemplateIndexItem** | ❌ | - | - | - | 实际使用 TemplateIndex |
| **FamilyBase** | ✅（概念） | factory/familyBases/ | 内部用 TemplatePayload 作为 base | 是 | ✅ register400 注册 |
| **VariantPatch** | ✅ | factory/variantPatches/ | Partial<TemplatePayload> | 是 | ✅ register400 注册 |

- **TemplateIndexItem**：未单独定义，统一用 `TemplateIndex`。
- **FamilyBase**：无单独类型，用 `TemplatePayload` 表示。
- **VariantPatch**：`Partial<TemplatePayload>`。

---

## 三、模板数量与生成方式

### 3.1 当前数量

| 项目 | 数量 |
|------|------|
| 模板总数 | **600** |
| 免费 | **80**（40 base free_starter + 40 连续 starter） |
| Base 家族 | 40 |
| Base 变体 | 10 |
| 网剧家族 | 20 |
| 网剧变体 | 5 |
| 动漫家族 | 20 |
| 动漫变体 | 5 |

### 3.2 生成方式

- **Base 400**：**C 混合**。`templateLibrary400` 手写 FAMILIES × VARIANTS 循环 → `getTemplateLibrary400()`；index 通过 `indexAdapter` 从 400 生成；payload 通过 `register400` 注册 familyBases + variantPatches。
- **Continuity 200**：**C 拼接**。`buildWebdramaIndex` / `buildAnimeIndex` 从 family × variant 循环生成 index；payload 由 `buildWebdramaPayload` / `buildAnimePayload` 工厂生成。

### 3.3 family × variant 自动生成 index

- **Base**：通过 `buildTemplateIndexFrom400()` 从 templateLibrary400 自动生成 400 条 index。
- **Webdrama / Anime**：通过 `buildWebdramaIndex()` / `buildAnimeIndex()` 按 family × variant 自动生成各 100 条。

---

## 四、模板工作台 UI 状态

### 4.1 组件清单

| 组件 | 位置 | 真数据 | 假数据 | 占位 | 接入 |
|------|------|--------|--------|------|------|
| TemplateWorkspace | features | ✅ | - | - | ✅ 主容器 |
| TemplateWorkspaceHeader | features | ✅ | - | - | ✅ 搜索+筛选+关闭 |
| TemplateWorkspaceSidebar | features | - | - | 薄封装 | ✅ 仅包 CategoryNav |
| TemplateWorkspaceGrid | features | ✅ | - | - | ✅ 使用 TemplateIndex |
| TemplateWorkspaceList | features | - | - | 薄封装 | 基于 Grid 的 list 视图 |
| TemplateWorkspaceDetail | features | ✅ | - | - | ✅ 使用 TemplateIndex |
| TemplateCard | features | ✅ | - | - | ✅ |
| TemplateCategoryNav | features | ✅ | - | - | ✅ |
| TemplateFilterBar | features | ✅ | - | - | 独立组件，Header 内联筛选 |
| TemplateSearchBar | features | ✅ | - | - | 独立组件，Header 内含 |
| TemplateSidebarEntry | features | ✅ | - | - | ✅ 最近/收藏，Sidebar 使用 |

### 4.2 旧组件（未使用）

- `components/TemplateWorkspace/*`（TemplateWorkspaceTopBar, Nav, Grid, Detail, Entry）：被 feature 版替代，App 已切到 features。
- `TemplatesPanel`：仅在 backup 中使用，当前主流程不用。

### 4.3 行为验证

| 操作 | 状态 |
|------|------|
| 点击模板 | ✅ 能生成 payload（base 经 library400，continuity 经 buildPayload） |
| 点击使用 | ✅ 能植入场景（base 走 applyTemplateSnapshot，continuity 走 applyPayloadToProject） |
| 右侧详情 | ✅ 真实，来自 selectedTemplate（TemplateIndex） |
| 筛选 | ✅ 真实，filterTemplateIndex 支持 scope/category/mediaType/storyPlan/ratio/pricing/domain |

---

## 五、模板 payload 能力检查

| 能力 | 支持 | 说明 |
|------|------|------|
| projectDefaults | ✅ | mediaType, aspectRatio, storyPlan, sceneCount, totalDuration, sceneDurations |
| scenes[] | ✅ | 多 scene |
| objects[] | ✅ | TemplateObjectSnapshot，含 continuityId |
| continuity | ✅ | enabled, characterCarryOver, directionCarryOver, cameraCarryOver, bgCarryOver, referenceSlots |
| exportDefaults | ✅ | range, method, target |
| 多 scene | ✅ | continuity 模板 2+ scene |
| 路径继承 | 部分 | inheritFromPrevious 在 Scene 层 |
| continuityId | ✅ | 通过 layer.notes 的 @continuityId:xxx |
| cameraCarryOver | ✅ | continuity 对象中 |
| objectInheritance | ✅ | TemplateSceneSnapshot.objectInheritance |
| entryDirection | ✅ | Scene.entryDir, TemplateSceneSnapshot |
| exitDirection | ✅ | Scene.exitDir, TemplateSceneSnapshot |

**连续剧模板支持**：**可以**。结构齐全，已实现 200 个连续性模板。

---

## 六、性能与架构评估

### 6.1 当前实现

- Index：全量 600 条一次加载，内存占用小（仅元数据）。
- Payload：`templateLoader` 按需加载，带 `payloadCache`。
- Base 400：首次 `getTemplateIndex` 时 register，之后 familyBases/variantPatches 在内存中。

### 6.2 扩展至 400 / 600 / 1000

| 规模 | 是否可承受 | 建议 |
|------|------------|------|
| 400 | ✅ | 当前已支持 |
| 600 | ✅ | 当前已支持 |
| 1000 | ⚠️ | index 仍可接受；payload 需避免全量预加载 |

### 6.3 建议改进（按优先级）

1. **虚拟列表**：Grid 列表超过 ~200 项时建议用 react-window / react-virtualized。
2. **动态 import**：continuity 的 `templateContinuityLoader` 已用动态 import，可扩展。
3. **分页**：若 index 再增大，可加分页或“加载更多”。
4. **懒加载**：index 已轻量，payload 已按需加载；family base 可按需加载（如按 domain 分块）。

---

## 七、收费 / credits / studio 预留

| 能力 | 存在 | 位置 |
|------|------|------|
| credits 判断层 | ✅ | App.handleUseTemplateFromWorkspace：meta.cost, accountCredits |
| entitlement 判断层 | ✅ | utils/entitlement.ts |
| canUseUnlimitedTemplates | ✅ | entitlement.ts，依赖 user.unlimitedTemplatesEnabled |
| 模板使用计费入口 | ✅ | handleUseTemplateFromWorkspace 中 reserveCredits/finalizeReservedCredits |
| 同项目不重复扣点 | ✅ | appliedTemplateIdsForBillingRef |

**层级**：计费与 entitlement 均在 App 层，通过 `handleUseTemplateFromWorkspace` 统一处理。

---

## 八、风险点

1. **结构风险**：Base 400 仍依赖 `templateLibrary400` + `UnifiedTemplate`，与 feature 的 TemplatePayload/Index 存在双轨，长期可考虑统一到 payload 体系。
2. **性能风险**：600 条全量渲染 Grid 无虚拟化，大屏可能卡顿；1000+ 时需虚拟列表。
3. **数据风险**：`appliedTemplateIdsForBillingRef` 仅在内存，刷新后丢失，同项目“不重复扣点”会失效；若需持久化需写入 project 元数据。
4. **UI 风险**：旧 `components/TemplateWorkspace/*` 仍存在，易被误用；建议标记废弃或删除。
5. **扩展风险**：variantPatches 的 key 为 `familyId:variant`，仅覆盖 base 的 10 变体；continuity 使用独立 builder，新增连续性变体需扩展 builder 或统一 variant 机制。

---

## 九、结论

| 阶段 | 结论 |
|------|------|
| **A 生成 400 模板** | **可以**。已实现并接入。 |
| **B 加 200 连续模板** | **可以**。已实现并接入。 |
| **C 接入 credits 扣点** | **可以**。扣点、不足提示、同项目不重复扣均已实现。 |
| **D 接入 studio** | **可以**。`canUseUnlimitedTemplates` 已预留，需后端/账号配置 `unlimitedTemplatesEnabled`。 |
| **E 接入后端** | **不建议直接上**。当前为前端本地逻辑，接入后端需：模板索引/元数据接口、扣费 API 对账、可选的模板内容拉取；建议先明确 API 契约再接入。 |

---

*报告生成时间：基于当前代码库快照*
