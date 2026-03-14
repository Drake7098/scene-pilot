# Pro 工作台 · Continuity Panel 模块

---

## 一、为什么 continuity 不能只藏在 Scene Strategy 里

连续性（continuity）涉及**分镜之间的关系**，而 Scene Strategy 主要描述**当前分镜的策略**（景别、镜头、风格等）。两者关注点不同：

- **Scene Strategy**：当前镜头的入镜方向、出镜方向、对象继承、衔接方式等，属于“当前 scene 的属性”
- **Continuity**：当前 scene 在连续链中的位置、与前后镜的承接关系、角色/方向/镜头/背景的跨镜继承

若只在 Scene Strategy 里零散展示 entry/exit/transition，用户难以形成“连续链”的整体认知。Continuity Panel 提供**连续性视图**，集中展示：

- 当前是否处于连续模式
- 当前 scene 在链中的位置
- 与前后镜的承接关系
- 各 carry-over 开关的实际效果

---

## 二、Continuity Panel 的职责

| 职责 | 说明 |
|------|------|
| 连续性摘要 | continuity on/off、模板类型（网剧/动漫/base）、当前 scene / 总 scene |
| 承接关系 | from previous、to next、transition、entry/exit direction |
| Carry-over | character、direction、camera、background |
| 锚点摘要 | continuityId 列表（用于跨镜引用） |
| 快速跳转 | 上一镜、下一镜 |

不负责：

- 分镜列表管理（由 Scenes 负责）
- 当前 scene 的详细策略编辑（由 Scene Strategy 负责）

---

## 三、与 Scenes / Strategy 的边界

| 模块 | 职责 |
|------|------|
| **Scenes** | 分镜列表、增删、切换、命名、时长；不解释连续关系 |
| **Continuity Panel** | 连续链视图、承接关系、carry-over、快速跳转 |
| **Scene Strategy** | 当前分镜的策略：入镜/出镜、对象继承、景别、镜头运动、风格包等 |

- Scenes 管理“有哪些分镜”
- Continuity Panel 管理“分镜之间如何衔接”
- Scene Strategy 管理“当前分镜的详细配置”

三者互补，不重叠。

---

## 四、Continuity 读取模型结构（ContinuityViewModel）

定义在 `src/utils/continuityViewModel.ts`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `continuityEnabled` | boolean | 是否启用连续模式（video + continuous/multicam） |
| `templateType` | "base" \| "webdrama" \| "anime" | 模板类型 |
| `currentSceneIndex` | number | 当前分镜索引 |
| `totalScenes` | number | 总分镜数 |
| `hasPrev` / `hasNext` | boolean | 是否有上一镜/下一镜 |
| `prevSceneId` / `nextSceneId` | string \| null | 前后镜 ID |
| `carryOver` | object | character, direction, camera, background |
| `sceneLinks` | object | fromPrevious, toNext, transition, entryDir, exitDir |
| `anchorSummary` | string[] | continuityId 列表 |
| `directionSummary` | string | 方向摘要 |

数据来源（推导自现有字段）：

- `project.project.shotPlan` → continuityEnabled
- `project.meta.currentTemplate?.domain` → templateType
- `scene.inheritFromPrevious` → carryOver.character
- `scene.inheritBgRefFromPrevious` → carryOver.background
- `scene.entryDir` / `exitDir` → direction
- `scene.transitionType` → transition
- `scene.transitionType === "camera_continues"` → carryOver.camera
- `layer.notes` 中的 `@continuityId:xxx` → anchorSummary

---

*文档生成时间：2026-03-14*
