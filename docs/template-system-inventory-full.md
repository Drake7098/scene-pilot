# 模板系统完整清单

本文档汇总模板系统的现状、内容规划、应用写入、筛选维度、详情展示与规则/冲突。

---

## 1. 模板系统现状

### 1.1 核心类型

| 类型 | 定义位置 | 主要字段 |
|------|----------|----------|
| **TemplatePayload** | `template-engine/types/templatePayload.ts` | `projectDefaults`, `scenes[]`, `objects?`, `continuity?`, `exportDefaults` |
| **TemplateIndex** | `template-engine/types/templateIndex.ts` | `id`, `familyId`, `familyNameEn/Zh`, `variantId`, `nameZh/En`, `category`, `domain`, `tags`, `mediaType`, `storyPlan`, `ratio`, `isFree`, `cost`, `featured`, `variant?`, `preview?` |
| **FamilyBase** | 概念，无单独类型 | 用 `TemplatePayload` 表示，`registerFamilyBase(familyId, payload)` 注册 |
| **VariantPatch** | 概念，无单独类型 | 用 `Partial<TemplatePayload>` 表示，`registerVariantPatch(familyId, variant, patch)` 注册，key 为 `familyId:variant` |

### 1.2 模板分类

| 分类维度 | 取值 |
|----------|------|
| **category** | product, dialogue, ad, short_video, social, camera_move, composition, continuous, cover_poster |
| **domain** | base, webdrama_continuity, anime_continuity |
| **mediaType** | image, video |
| **storyPlan** | single, continuous, multi_cam, edited |
| **ratio** | 16:9, 9:16, 1:1 |

### 1.3 400 / 600 结构

| 层级 | 数量 | 说明 |
|------|------|------|
| **Base 400** | 40 family × 10 variant | 通过 `templateLibrary400.ts` + `register400` 生成 |
| **Webdrama continuity** | 20 family × 5 variant = 100 | `buildWebdramaIndex` + `buildWebdramaPayload` |
| **Anime continuity** | 20 family × 5 variant = 100 | `buildAnimeIndex` + `buildAnimePayload` |
| **合计** | **600** | `getTemplateIndex()` 合并 |

### 1.4 免费 / 3 credits / 5 credits 规则

| 条件 | cost |
|------|------|
| `variant === "free_starter"` | 0（免费） |
| `variant === "multi_object"` 或 `variant === "advanced_motion"` | 5 |
| `family.category === "continuous"` | 5 |
| 其余 | 3 |

**Continuity 定价**：webdrama / anime 的 `starter` 变体免费，其余 5 credits。

### 1.5 当前模板详情页展示信息

| 字段 | 是否展示 |
|------|----------|
| 标题（nameZh / nameEn） | ✅ |
| 家族（familyNameZh / familyNameEn） | ✅ |
| 描述（descriptionZh / descriptionEn） | ✅ |
| tags | ✅ |
| 定价（免费 / X credits） | ✅ |
| 媒体类型（image / video） | ✅ |
| 场景类型（storyPlan） | ✅ |
| 应用模式（layout_only / layout_plus_style / full_workflow） | ✅ |
| 收藏按钮 | ✅ |
| variant（变体名） | ❌ 当前未单独展示 |
| advanced camera / director / lighting / continuity 标签 | ❌ 当前未展示（UnifiedTemplate.advancedTags 未映射到 TemplateIndex） |

---

## 2. 模板内容规划

### 2.1 基础 family 与 variant

| 类型 | 数量 | 来源 |
|------|------|------|
| **Base families** | 40 | `FAMILIES` in `templateLibrary400.ts` |
| **Base variants** | 10 | free_starter, basic_wide, basic_medium, basic_close, vertical_9_16, horizontal_16_9, social_fast, cinematic, multi_object, advanced_motion |

### 2.2 Continuity 模板

| 域 | 家族数 | 变体数 | 总量 |
|----|--------|--------|------|
| **Webdrama** | 20 | 5 | 100 |
| **Anime** | 20 | 5 | 100 |

- Webdrama 变体：starter, close_emotion, multi_angle, high_tension, advanced_continuity
- Anime 变体：starter, vertical_short, battle_motion, cinematic_anime, advanced_continuity

### 2.3 高级模板（cost ≥ 5）

- **Base**：`multi_object`、`advanced_motion`、`category === "continuous"` 的 family 下所有 variant
- **Continuity**：非 starter 变体（close_emotion, multi_angle, high_tension, advanced_continuity 等）

### 2.4 隐藏镜头语言 / 高级导演包 / 高级光影包

| 能力 | 使用位置 | 说明 |
|------|----------|------|
| **隐藏镜头语言（Layer 2）** | `cinematic`、`advanced_motion` variant | `templateLibrary400.buildSceneForVariant` 中：cinematic → `cinematic_soft`，advanced_motion → `hero_entry`，写入 `scene.notes` 的 `camera_language:` marker |
| **高级导演包** | `computeAdvancedTags` 中 `director_preset` | 当 `family.category === "dialogue"` 且 `variant === "advanced_motion"` 时打标；当前 base payload 未显式写入 directorStylePack |
| **高级光影包** | 标签 `advanced_lighting` | `ADVANCED_TEMPLATE_TAGS` 有定义；当前 base / continuity 均未显式写入 lightingSetup 或 lightingPreset |

---

## 3. 模板应用后的默认写入

### 3.1 应用入口

- **Base 400**：`doApplyBase` → `unifiedTemplateToSceneTemplate` → `applyTemplateSnapshot` → `cloneSceneFromTemplate`
- **Continuity 200**：`applyTemplateFromIndex` → `loadTemplatePayloadById` → `applyPayloadToProject`

### 3.2 写入的 project 字段

| 字段 | 来源 | 说明 |
|------|------|------|
| `project.mediaType` | `payload.projectDefaults.mediaType` | 覆盖当前项目 |
| `project.shotPlan` | `payload.projectDefaults.storyPlan` | continuous → "continuous"，否则沿用 |

`projectDefaults.aspectRatio`、`sceneCount`、`totalDuration`、`sceneDurations` 在 payload 中定义但 **未** 写入 project。

### 3.3 写入的 scene 字段

通过 `s.raw`（完整 Scene 对象）整体合并，包含：

| 字段 | 说明 |
|------|------|
| `id`, `name`, `index` | 重新生成 / 按序赋值 |
| `duration_s`, `transitionType` | 来自模板 |
| `camera.shot`, `camera.movement`, `camera.keyframes` | 来自模板 |
| `lighting.time`, `lighting.key_dir`, `lighting.mood` | 来自模板（当前多为空） |
| `layers` | 含 `id`, `type`, `z`, `kf`, `notes`, `externalPrompt` 等 |
| `config.mediaMode`, `config.compiler` | 来自模板 |
| `notes` | 含 `media:`, `genmode:`, `camera_language:`（若使用隐藏镜头语言） |
| `entryDir`, `exitDir` | continuity 模板有，用于方向继承 |
| `inheritFromPrevious` | continuity 模板有 |

### 3.4 写入的 lighting / camera / director 字段

- **camera**：通过 `scene.camera` 写入 `shot`、`movement`、`keyframes`
- **lighting**：通过 `scene.lighting` 写入 `time`、`key_dir`、`mood`（当前 base / continuity 多为空）
- **director**：`directorStylePack` 等通过 `scene.notes` 的 marker 存储，当前模板 **未** 显式写入

### 3.5 写入的 object（layer）字段

| 字段 | 说明 |
|------|------|
| `id`, `type`, `shape`, `z`, `color`, `opacity` | 来自模板 |
| `kf` | 关键帧 |
| `notes` | 含 `@continuityId:xxx`（continuity 模板） |
| `externalPrompt`, `referenceLinks`, `referencePolicy` | 来自模板 |

### 3.6 Continuity 写入的字段

| 层级 | 字段 | 说明 |
|------|------|------|
| **Scene** | `entryDir`, `exitDir`, `inheritFromPrevious` | 方向继承、是否继承上一镜 |
| **Layer** | `notes` 中 `@continuityId:char_a` 等 | 角色/对象 continuity 绑定 |
| **Payload** | `continuity.enabled`, `characterCarryOver`, `directionCarryOver`, `cameraCarryOver`, `bgCarryOver`, `referenceSlots` | 定义在 payload 中；**applyPayloadToProject 未写入 project 顶层**，连续性逻辑依赖 scenes 内字段 |

---

## 4. 当前模板工作台筛选维度

### 4.1 Scope（左侧导航）

| scope | 说明 |
|-------|------|
| recommended | 推荐（featured 或 free 前 12） |
| all | 全部 |
| free | 仅免费 |
| favorites | 收藏（localStorage） |
| recent | 最近使用（localStorage） |
| mine | 用户自建（当前为空） |

### 4.2 分类（category）

- 与 `TemplateCategory` 一致：product, dialogue, ad, short_video, social, camera_move, composition, continuous, cover_poster
- 通过左侧 CategoryNav 选择

### 4.3 筛选器（filters）

| 维度 | 取值 | 来源 |
|------|------|------|
| **mediaType** | all / image / video | `filters.mediaType` |
| **storyPlan** | all / single / continuous / multi_cam / edited | `filters.storyPlan` |
| **ratio** | all / 16:9 / 9:16 / 1:1 | `filters.ratio` |
| **domain** | all / base / webdrama_continuity / anime_continuity | `filters.domain` |
| **pricing** | all / free / paid | `filters.pricing` |

### 4.4 搜索

- 支持对 `nameEn`, `nameZh`, `familyId`, `familyNameEn/Zh`, `descriptionEn/Zh`, `tags`, `category` 的全文匹配

---

## 5. 当前模板详情内容

### 5.1 已有展示

| 项目 | 来源 |
|------|------|
| 标题 | `template.nameZh` / `template.nameEn` |
| 家族 | `template.familyNameZh` / `template.familyNameEn` |
| 描述 | `template.descriptionZh` / `template.descriptionEn` |
| cost | `template.isFree` ? "免费" : `${template.cost} credits` |
| tags | `template.tags` |
| mediaType | image / video |
| storyPlan | single / continuous / multi_cam / edited |
| apply mode | layout_only / layout_plus_style / full_workflow |

### 5.2 未展示

| 项目 | 说明 |
|------|------|
| variant | TemplateIndex 有 `variantId`，详情未单独展示 |
| advanced camera / director / lighting / continuity 标签 | `UnifiedTemplate.advancedTags` 未映射到 TemplateIndex，详情无法展示 |

### 5.3 Apply mode

| 值 | 说明 |
|----|------|
| layout_only | 仅布局 |
| layout_plus_style | 布局 + 风格 |
| full_workflow | 完整应用 |

当前 apply 逻辑 **未按 applyMode 区分**，均为全量写入。

---

## 6. 当前模板规则 / 已知冲突

### 6.1 模板自动带入的字段

| 层级 | 字段 |
|------|------|
| **Project** | mediaType, shotPlan |
| **Scene** | 整镜（camera, lighting, layers, notes, entryDir, exitDir, inheritFromPrevious, config 等） |
| **Layer** | 全部（含 continuityId 在 notes 中） |

### 6.2 允许用户修改的字段

应用后，用户在 Pro 工作台可编辑：

- Scene：camera（shot, movement）、lighting、notes、duration_s 等
- Layer：notes, externalPrompt, kf, type 等
- Project：mediaType, shotPlan 等

无“模板锁定”机制，所有字段均可改。

### 6.3 高级模板专用字段

| 能力 | 专用字段 | 使用场景 |
|------|----------|----------|
| 隐藏镜头语言 | `scene.notes` 中 `camera_language:` | cinematic, advanced_motion variant |
| 导演包 | `scene.notes` 中 director marker | 标签有 director_preset，payload 未显式写入 |
| 光影包 | lighting 相关 | 标签有 advanced_lighting，payload 未显式写入 |

### 6.4 互斥 / 冲突规则

| 类型 | 说明 |
|------|------|
| **Prompt 冲突** | `conflictRules.ts` 检测 notes 与 externalPrompt 中的词语冲突（如 static vs motion、lighting 相关词、text overlay 等），用于提示词生成前的校验 |
| **字段级互斥** | 代码中无显式“字段互斥”定义；用户可同时修改 camera、lighting、notes 等，由提示词编译与冲突规则在生成时处理 |
| **图片/视频** | mediaType 决定使用 v1/v2 编译器；图片场景不应含视频镜头语言（见 AGENTS.md） |

### 6.5 规范字段键（fieldKeys.ts）

| 层级 | 示例 |
|------|------|
| Project | mediaType, storyPlan, workspaceMode, sceneCount, totalDuration |
| Scene | duration, classicShot, classicMotion, directorStylePack, proMotions, imageProEffects, constraintStrength, lightingSetup, backgroundPrompt, entryDirection, exitDirection, objectInheritance 等 |
| Object | t0, t1 |
| Export | range, method, target |

---

*文档基于当前代码库生成，路径以 `src/` 为根。*
