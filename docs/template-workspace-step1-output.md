# ScenePilotix 模板工作台 Step 1 输出

## 1. 新增/修改文件列表

### 新增文件

| 路径 | 说明 |
|------|------|
| `src/data/templateWorkspaceData.ts` | 静态模板数据、筛选逻辑、导航分类 |
| `src/components/TemplateWorkspace/TemplateWorkspace.tsx` | 模板工作台主组件 |
| `src/components/TemplateWorkspace/TemplateWorkspaceTopBar.tsx` | 顶部过滤条 |
| `src/components/TemplateWorkspace/TemplateWorkspaceNav.tsx` | 左侧窄导航 |
| `src/components/TemplateWorkspace/TemplateWorkspaceGrid.tsx` | 中间模板卡片网格 |
| `src/components/TemplateWorkspace/TemplateWorkspaceDetail.tsx` | 右侧详情区 |
| `src/components/TemplateWorkspace/TemplateWorkspaceEntry.tsx` | Sidebar 内模板入口块 |
| `docs/template-workspace-step1-output.md` | 本文档 |

### 修改文件

| 路径 | 修改内容 |
|------|----------|
| `src/App.tsx` | 增加 `isTemplateWorkspaceOpen`、`templateWorkspaceState`，渲染 TemplateWorkspace 覆盖区，`handleUseTemplateFromWorkspace` |
| `src/components/Sidebar.tsx` | 模板库区域改为使用 `TemplateWorkspaceEntry`，新增 `onOpenTemplateWorkspace` |

---

## 2. 模板工作台组件结构说明

```
TemplateWorkspace (主容器)
├── TemplateWorkspaceTopBar (顶部)
│   ├── 搜索框
│   ├── 分类筛选 (图/视频、单镜/连续/多机位/剪辑、免费/付费)
│   └── 关闭按钮
├── 主体 flex 区
│   ├── TemplateWorkspaceNav (左侧 140px)
│   │   └── 导航项: 推荐、全部、免费模板、最近使用、收藏、我的模板、产品、对话、广告、短视频、社媒、镜头运动、构图骨架、连续调度、封面/海报
│   ├── TemplateWorkspaceGrid (中间弹性区)
│   │   ├── 视图切换 (grid / list)
│   │   └── 模板卡片网格或列表
│   └── TemplateWorkspaceDetail (右侧 280px)
│       ├── 模板名、家族、描述、标签
│       ├── 免费/cost、适用媒体类型、适用场景类型
│       ├── 应用模式: 仅布局 / 布局+风格 / 完整应用
│       └── 使用按钮
```

**Sidebar 内入口块 (TemplateWorkspaceEntry)**  
- 打开模板工作台按钮  
- 最近使用 (最多 3 个)  
- 收藏 (最多 3 个)

---

## 3. 状态设计说明

### App 层状态

| 状态 | 类型 | 说明 |
|------|------|------|
| `isTemplateWorkspaceOpen` | `boolean` | 模板工作台是否打开 |
| `templateWorkspaceState` | `TemplateWorkspaceState` | 工作台内部状态 |

### TemplateWorkspaceState

| 字段 | 类型 | 说明 |
|------|------|------|
| `view` | `"grid" \| "list"` | 网格/列表视图，默认 grid |
| `scope` | `TemplateWorkspaceScope` | 范围: all, free, favorites, recent, mine, recommended |
| `selectedCategory` | `string \| null` | 选中的分类 (产品、对话等) |
| `selectedTemplateId` | `string \| null` | 当前选中的模板 ID |
| `searchQuery` | `string` | 搜索关键词 |
| `filters` | `TemplateWorkspaceFilters` | 筛选条件 |
| `applyMode` | `ApplyTemplateMode` | 应用模式: layout_only, layout_plus_style, full_workflow |

### TemplateWorkspaceFilters

| 字段 | 类型 | 说明 |
|------|------|------|
| `mediaType` | `"all" \| "image" \| "video"` | 图/视频 |
| `storyPlan` | `"all" \| "single" \| "continuous" \| "multi_cam" \| "edited"` | 单镜/连续/多机位/剪辑 |
| `ratio` | `"all" \| "16:9" \| "9:16" \| "1:1"` | 比例 |
| `pricing` | `"all" \| "free" \| "paid"` | 免费/付费 |

---

## 4. 打开关闭逻辑说明

### 打开

1. 用户在 Sidebar 模板库区域点击「打开模板工作台」  
2. 调用 `onOpenTemplateWorkspace()` → `setIsTemplateWorkspaceOpen(true)`  
3. App 将中心画布 + 右侧属性区替换为 `TemplateWorkspace` 组件  
4. 左侧 Sidebar 仍然显示

### 关闭

1. 用户点击顶部过滤条右侧关闭按钮  
2. 调用 `onClose()` → `setIsTemplateWorkspaceOpen(false)`  
3. 恢复显示中心画布和右侧属性区

### 使用模板后关闭

1. 用户选中模板并点击「使用」  
2. 调用 `handleUseTemplateFromWorkspace(template)`  
3. 执行 `applyTemplateSnapshot`，更新项目并追加分镜  
4. 调用 `setIsTemplateWorkspaceOpen(false)` 自动关闭工作台  

---

## 5. 截图

> 截图需本地运行 `npm run dev` 后手动截取。

**关闭状态**：Sidebar 模板库为入口块（打开按钮、最近、收藏），中间为画布 + 右侧属性区。

**打开状态**：Sidebar 保持可见，中心 + 右侧区域被模板工作台替换（顶部过滤条、左侧导航、中间卡片网格、右侧详情）。
