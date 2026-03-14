# ScenePilotix 模板工作台 Step 2 输出

## 1. 模板数据文件列表

| 文件 | 说明 |
|------|------|
| `src/types/templateWorkspace.ts` | 统一模板类型 `UnifiedTemplate`、`TemplateVariant`、`TemplateCategory` |
| `src/data/templateLibrary400.ts` | 400 模板生成逻辑、40 家族 × 10 变体 |
| `src/data/templateWorkspaceData.ts` | 数据层：筛选、最近、收藏、推荐（基于 400 库） |
| `src/utils/unifiedTemplateToSceneTemplate.ts` | 转换为 `SceneTemplate` 供 apply 使用 |

---

## 2. 模板总数统计

| 项目 | 数量 |
|------|------|
| **模板家族** | 40 |
| **每家族变体数** | 10 |
| **模板总数** | **400** |

---

## 3. 免费模板数统计

| 项目 | 数量 |
|------|------|
| **免费模板** | **40** |
| 说明 | 每家族 1 个 Free Starter 变体 |
| 付费模板 | 360（cost 3 或 5） |

---

## 4. 分类筛选说明

### 导航分类与 family 映射

| 导航分类 | 对应 category | 家族数量 |
|----------|---------------|----------|
| 产品 | product | 8 |
| 对话 | dialogue | 6 |
| 广告 | ad | 4 |
| 社媒 | social | 2 |
| 短视频 | short_video | 6 |
| 镜头运动 | camera_move | 6 |
| 构图骨架 | composition | 4 |
| 连续调度 | continuous | 2 |
| 封面/海报 | cover_poster | 2 |

### 筛选流程

1. **范围 (scope)**：全部 / 免费 / 推荐 / 最近 / 收藏 / 我的
2. **分类 (category)**：点击左侧 nav 后按 `category` 过滤
3. **搜索 (searchQuery)**：名称、family、描述、tags 匹配
4. **媒体 (mediaType)**：all / image / video
5. **场景计划 (storyPlan)**：all / single / continuous / multi_cam / edited
6. **比例 (ratio)**：all / 16:9 / 9:16 / 1:1
7. **定价 (pricing)**：all / free / paid

---

## 5. 搜索逻辑说明

`matchesSearch(t, q)` 对以下字段做大小写不敏感的包含匹配：

- `t.name`
- `t.family`
- `t.description`
- `t.tags` 中任一 tag
- `t.category`

逻辑：任一字段包含搜索词即命中。

---

## 6. 模板卡片展示

每张卡片展示：

- 模板名 (`name`)
- 家族 (`family`)
- 一句话说明 (`description`，超过 48 字截断)
- 标签 (`tags`，最多 3 个)
- 定价：`免费` / `3 credits` / `5 credits`
- **使用** 按钮

---

## 7. 价格规则（仅数据，不接扣点）

| 类型 | cost |
|------|------|
| Free Starter | 0 |
| 常规模板 | 3 |
| 复杂连续 / 高级镜头 (continuous, orbit, crane, tracking, advanced_motion) | 5 |

---

## 8. 截图

> 需本地运行 `npm run dev` 后手动截取。

- **全部模板**：打开模板工作台，默认 scope=all
- **产品类**：点击左侧「产品」
- **免费模板**：点击左侧「免费模板」或筛选 pricing=free
