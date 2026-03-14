# 模板 Grid 规模扩展方案

## 一、当前 600 条全量渲染现状

| 项目 | 现状 |
|------|------|
| 模板总数 | 600（400 base + 100 webdrama + 100 anime） |
| 渲染方式 | `TemplateWorkspaceGrid` 全量 `items.map()` 渲染 |
| 容器 | `overflowY: auto` 的 div，CSS grid / flex 布局 |
| 筛选 | `filterTemplateIndex` 在内存中筛选，结果仍为数组全量传入 Grid |
| Index 加载 | `getTemplateIndex()` 一次性 600 条，轻量元数据 |
| Payload 加载 | 按需 `loadTemplatePayloadById`，带 cache |

## 二、为什么 1000+ 会有风险

1. **DOM 数量**：1000+ 卡片同时挂载，滚动时重排/重绘开销大
2. **内存**：每个卡片持有 TemplateIndex + 预览图引用，1000+ 同时存在会增加 GC 压力
3. **首屏/交互**：初次渲染 1000+ 节点会拉长 TTI，滚动可能卡顿
4. **移动端**：小屏设备更容易出现性能问题

## 三、计划采用的策略

### 首选：虚拟化（Virtualization）

- **工具**：react-window 或 react-virtualized
- **原理**：只渲染视口内可见的卡片 + 少量前后缓冲
- **适用**：Grid / List 两种视图

### 备选

- **分页**：每页 N 条，点击加载下一页
- **加载更多**：滚动到底部加载下一批
- **混合**：虚拟化 + 后端分页（当 index 来自 API 时）

## 四、现阶段已做预留

| 预留 | 位置 | 说明 |
|------|------|------|
| `TemplateGridContainer` | `features/template-workspace/components/TemplateGridContainer.tsx` | 根据 `items.length >= GRID_VIRTUALIZATION_THRESHOLD` 选择 normal / virtual |
| `TemplateWorkspaceGridVirtual` | `features/template-workspace/components/TemplateWorkspaceGridVirtual.tsx` | 虚拟化专用 Grid，当前与 normal 同渲染逻辑 |
| `useVirtualizedTemplateGrid` | `features/template-workspace/hooks/useVirtualizedTemplateGrid.ts` | 返回 `visibleItems`、`containerRef` 等，预留 react-window 接入点 |
| `GRID_VIRTUALIZATION_THRESHOLD` | `features/template-workspace/constants/gridStrategy.ts` | 阈值 400，超过则走 virtual 分支 |

当前：`items >= 400` 时使用 `TemplateWorkspaceGridVirtual`，内部仍为全量渲染（passthrough），结构已就绪。

## 五、扩到 1000+ 前需补内容

1. **接入 react-window**：`npm i react-window`，在 `useVirtualizedTemplateGrid` 中根据 `containerRef` 的尺寸和滚动位置计算 `visibleItems`、`startIndex`，在 `TemplateWorkspaceGridVirtual` 中渲染仅可见项 + spacer
2. **固定卡片尺寸**：虚拟化需预知 item 高度（list）或 row/col 布局（grid），需统一 `TemplateCard` 的预估尺寸
3. **预览图懒加载**：配合 `IntersectionObserver`，进入视口再加载 `item.preview`
4. **测试**：在 1000+ index 下验证滚动流畅度、内存占用
