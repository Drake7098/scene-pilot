# 模板系统重构 Step 1 输出说明

## 1. 新增/修改文件列表

### 新增文件（feature 模块）

**model/**
- `src/features/template-workspace/model/templateTypes.ts` - 核心类型（Variant, Category, StoryPlan 等）
- `src/features/template-workspace/model/templateIndex.ts` - 轻量索引类型
- `src/features/template-workspace/model/templatePayload.ts` - 完整 payload 类型
- `src/features/template-workspace/model/templateFilter.ts` - 筛选/范围/应用模式
- `src/features/template-workspace/model/templateCategory.ts` - 分类导航

**data/**
- `src/features/template-workspace/data/templateIndexData.ts` - 索引数据层
- `src/features/template-workspace/data/families/indexAdapter.ts` - 400 模板 → Index 适配

**factory/**
- `src/features/template-workspace/factory/buildTemplatePayload.ts` - base + patch 工厂
- `src/features/template-workspace/factory/unifiedAdapter.ts` - UnifiedTemplate → Payload 适配
- `src/features/template-workspace/factory/familyBases/index.ts` - 家族基底注册
- `src/features/template-workspace/factory/variantPatches/index.ts` - 变体补丁注册

**services/**
- `src/features/template-workspace/services/templateLoader.ts` - 按需加载 payload
- `src/features/template-workspace/services/templateApplyService.ts` - 应用模板到 Pro
- `src/features/template-workspace/services/templateCreditsService.ts` - credits 检查
- `src/features/template-workspace/services/templateSearchService.ts` - 搜索/筛选

**hooks/**
- `src/features/template-workspace/hooks/useTemplateWorkspace.ts`
- `src/features/template-workspace/hooks/useTemplateFilters.ts`
- `src/features/template-workspace/hooks/useTemplateSearch.ts`
- `src/features/template-workspace/hooks/useTemplateFavorites.ts`
- `src/features/template-workspace/hooks/useTemplateRecent.ts`

**state/**
- `src/features/template-workspace/state/templateWorkspaceState.ts`
- `src/features/template-workspace/state/templateWorkspaceReducer.ts`

**utils/**
- `src/features/template-workspace/utils/templateGrouping.ts`
- `src/features/template-workspace/utils/templateCompatibility.ts`

**components/**
- `src/features/template-workspace/components/TemplateWorkspace.tsx` - 主容器
- `src/features/template-workspace/components/TemplateWorkspaceHeader.tsx`
- `src/features/template-workspace/components/TemplateWorkspaceSidebar.tsx`
- `src/features/template-workspace/components/TemplateCategoryNav.tsx`
- `src/features/template-workspace/components/TemplateWorkspaceGrid.tsx`
- `src/features/template-workspace/components/TemplateWorkspaceList.tsx`
- `src/features/template-workspace/components/TemplateWorkspaceDetail.tsx`
- `src/features/template-workspace/components/TemplateCard.tsx`
- `src/features/template-workspace/components/TemplateSidebarEntry.tsx`
- `src/features/template-workspace/components/TemplateSearchBar.tsx`
- `src/features/template-workspace/components/TemplateFilterBar.tsx`

**adapters/**
- `src/features/template-workspace/adapters/legacyAdapter.ts` - Index → TemplateWorkspaceItem

**入口**
- `src/features/template-workspace/index.ts` - 公共 API

### 修改文件

- `src/App.tsx` - 导入 feature 模块、`DEFAULT_TEMPLATE_WORKSPACE_STATE`、`handleUseTemplateFromWorkspace` 支持 `TemplateIndex | TemplateWorkspaceItem`

### 未删除的旧文件（继续复用）

- `src/components/TemplateWorkspace/*` - 保留，Sidebar 的 `TemplateWorkspaceEntry` 仍使用
- `src/data/templateLibrary400.ts`
- `src/data/templateWorkspaceData.ts`
- `src/data/builtinTemplates.ts`
- `src/model/template.ts`
- `src/lib/templateStore.ts`
- `src/rules/applyTemplate.ts`
- `src/utils/unifiedTemplateToSceneTemplate.ts`

---

## 2. 新的模板系统目录树

```
src/features/template-workspace/
├── index.ts
├── model/
│   ├── templateTypes.ts
│   ├── templateIndex.ts
│   ├── templatePayload.ts
│   ├── templateFilter.ts
│   └── templateCategory.ts
├── data/
│   ├── templateIndexData.ts
│   └── families/
│       └── indexAdapter.ts
├── factory/
│   ├── buildTemplatePayload.ts
│   ├── unifiedAdapter.ts
│   ├── familyBases/
│   │   └── index.ts
│   └── variantPatches/
│       └── index.ts
├── services/
│   ├── templateLoader.ts
│   ├── templateApplyService.ts
│   ├── templateCreditsService.ts
│   └── templateSearchService.ts
├── hooks/
│   ├── useTemplateWorkspace.ts
│   ├── useTemplateFilters.ts
│   ├── useTemplateSearch.ts
│   ├── useTemplateFavorites.ts
│   └── useTemplateRecent.ts
├── state/
│   ├── templateWorkspaceState.ts
│   └── templateWorkspaceReducer.ts
├── utils/
│   ├── templateGrouping.ts
│   └── templateCompatibility.ts
├── components/
│   ├── TemplateWorkspace.tsx
│   ├── TemplateWorkspaceHeader.tsx
│   ├── TemplateWorkspaceSidebar.tsx
│   ├── TemplateCategoryNav.tsx
│   ├── TemplateWorkspaceGrid.tsx
│   ├── TemplateWorkspaceList.tsx
│   ├── TemplateWorkspaceDetail.tsx
│   ├── TemplateCard.tsx
│   ├── TemplateSidebarEntry.tsx
│   ├── TemplateSearchBar.tsx
│   └── TemplateFilterBar.tsx
└── adapters/
    └── legacyAdapter.ts
```

---

## 3. 类型设计说明

### TemplateIndex（轻量索引）

用于列表、搜索、分类、免费/付费筛选、最近/收藏、首屏加载。

```ts
type TemplateIndex = {
  id: string;
  familyId: string;
  variantId: string;
  nameZh: string;
  nameEn: string;
  category: TemplateCategory;
  descriptionZh?: string;
  descriptionEn?: string;
  tags: string[];
  mediaType: "image" | "video";
  storyPlan: TemplateStoryPlan;
  ratio: "16:9" | "9:16" | "1:1";
  isFree: boolean;
  cost: number;
  featured: boolean;
  preview?: string;
  variant: TemplateVariant;
};
```

### TemplatePayload（完整 payload）

支持一键植入 Pro，含 projectDefaults、scenes[]、objects[]、continuity、exportDefaults。

```ts
type TemplatePayload = {
  projectDefaults?: TemplateProjectDefaults;  // mediaType, aspectRatio, storyPlan, etc.
  scenes: TemplateSceneSnapshot[];           // nameZh/En, duration, lensRecipe, classicShot, etc.
  objects?: TemplateObjectSnapshot[];        // id, continuityId, type, appearance, t0/t1, etc.
  continuity?: TemplateContinuity;
  exportDefaults?: TemplateExportDefaults;
};
```

### FamilyBase（家族基底）

通过 `registerFamilyBase(familyId, payload)` 注册，用于 40 个基础家族。

### VariantPatch（变体补丁）

通过 `registerVariantPatch(familyId, variant, patch)` 注册，覆盖 base 生成完整 payload。10 种变体：free_starter, basic_wide, basic_medium, basic_close, vertical_9_16, horizontal_16_9, social_fast, cinematic, multi_object, advanced_motion。

---

## 4. 模板工作台从 App 剥离后的打开/关闭逻辑

- **App 仅保留**：`isTemplateWorkspaceOpen`、`templateWorkspaceState`、`onOpenTemplateWorkspace`、`handleUseTemplateFromWorkspace`。
- **TemplateWorkspace** 自身管理：搜索、分类、详情、视图切换、收藏/最近。
- **布局**：模板工作台打开时覆盖中间 Stage + 右侧 Props 区；左侧 Sidebar 保留。
- **使用流程**：用户选模板 → `onUseTemplate(index)` → App 通过 `getTemplateWorkspaceItemFromIndex` 转为 `TemplateWorkspaceItem` → 调用现有 credits / apply 逻辑 → `setIsTemplateWorkspaceOpen(false)`。

---

## 5. 旧文件复用与兼容层

| 旧文件 | 用途 | 兼容方式 |
|--------|------|----------|
| `templateLibrary400.ts` | 400 模板数据 | 通过 `indexAdapter` 生成 `TemplateIndex[]`，通过 `unifiedAdapter` 生成 `TemplatePayload` |
| `templateWorkspaceData.ts` | 最近/收藏、filterTemplates | `addToRecent`、`toggleFavorite`、`isFavorite` 仍由 feature 直接调用；`templateSearchService` 自建 `filterTemplateIndex` 基于 Index |
| `builtinTemplates.ts` | 内置模板 | 未改动，`templateStore` 继续使用 |
| `template.ts` (SceneTemplate) | applyTemplateSnapshot 入参 | 通过 `unifiedTemplateToSceneTemplate` 从 UnifiedTemplate 转换 |
| `templateStore.ts` | cloneSceneFromTemplate | `applyTemplateSnapshot` 内部调用 |
| `applyTemplate.ts` | 应用模板到项目 | `templateApplyService` 调用 |
| `unifiedTemplateToSceneTemplate.ts` | Unified → SceneTemplate | `templateApplyService`、`legacyAdapter` 使用 |

**兼容层**：`adapters/legacyAdapter.ts` 提供 `getTemplateWorkspaceItemFromIndex`，使 App 的 `handleUseTemplateFromWorkspace` 能同时接受 `TemplateIndex` 和 `TemplateWorkspaceItem`。

---

## 6. 性能预留

- `templateIndexData.ts`：全量加载轻量 Index（约 400 条）。
- `templateLoader.ts`：按 `familyId + variant` 按需加载 payload，带缓存。
- `familyBases` / `variantPatches`：当前为空，后续可接入 dynamic import / lazy loading。
- 最近/收藏仅依赖 Index，不加载完整 payload。
