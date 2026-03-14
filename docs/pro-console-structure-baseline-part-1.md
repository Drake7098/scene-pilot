# ScenePilotix｜Pro 控制台结构基线文档（第一部分）

> 不含模板模块与提示词区  
> 用于后续与模板结果规格、字段总表、规则矩阵进行比对

---

## 一、文档目的

本文件用于固化当前 Pro 控制台（不含模板工作台、提示词展示区）的真实结构现状，作为后续以下工作的基线输入：

1. 模板结果规格定义
2. 字段总表梳理
3. 字段唯一主入口映射
4. 规则引擎与冲突矩阵设计
5. Pro 工作台模块重构判断

本文件只记录「现状」，不做优化结论。

---

## 二、数据模型（`model.ts`）

### 2.1 顶层类型

| 类型 | 取值 | 说明 |
|------|------|------|
| `Mode` | `"static"` \| `"storyboard"` | 项目模式 |
| `MediaType` | `"image"` \| `"video"` | 媒体类型 |
| `ShotPlan` | `"single"` \| `"multicam"` \| `"continuous"` \| `"edit"` | 分镜计划 |
| `SceneCompiler` | `"v1"` \| `"v2"` | 场景编译器 |
| `SceneTier` | `"indoor"` \| `"small_plaza"` \| `"open_space"` | 场景层级 |
| `SceneV2Mode` | `"strict"` \| `"short"` | V2 模式 |
| `SceneStability` | `"off"` \| `"standard"` \| `"strict"` | 稳定性 |
| `Direction` | `"N"` \| `"NE"` \| `"E"` \| `"SE"` \| `"S"` \| `"SW"` \| `"W"` \| `"NW"` | 方向 |
| `TransitionType` | `"cut"` \| `"reverse_angle"` \| `"camera_continues"` \| `"dissolve"` \| `"time_jump"` | 衔接类型 |
| `ObjectRefInheritMode` | `"off"` \| `"identity_only"` \| `"all"` | 对象继承模式 |
| `Shape` | `"circle"` \| `"rect"` \| `"ring"` \| `"arrow"` | 对象形状（画布用） |

---

### 2.2 Layer（对象 / 图层）

#### Layer 字段

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID |
| `type` | string | 类型（自由文本） |
| `shape` | Shape | 画布形状 |
| `shapeDesc` | string? | 形状描述 |
| `look` | string | 外观 / 背景描述 |
| `z` | number | 层级 |
| `color` | string | 颜色（固定） |
| `opacity` | number | 不透明度 |
| `kf` | LayerKF[] | 关键帧 |
| `notes` | string | 备注 |
| `externalPrompt` | string | 对象局部提示词 |
| `referenceLinks` | string | 参考链接 |
| `localRefs` | LocalRefMeta[]? | 本地参考图 |
| `referencePolicy` | `"optional"` \| `"required"`? | 参考图策略 |

#### LayerKF 字段

| 属性 | 类型 | 说明 |
|------|------|------|
| `t` | `0` \| `1` | 起止帧 |
| `x`, `y` | number | 中心坐标（0..100） |
| `w`, `h` | number | 宽高（0..100） |
| `rot` | number | 旋转（度） |

#### LocalRefType

- `"identity"`
- `"appearance"`
- `"style"`

---

### 2.3 Scene（分镜）

#### Scene 字段

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID |
| `name` | string | 名称 |
| `index` | number? | 序号 |
| `layoutLocked` | boolean? | 布局锁定 |
| `backgroundRef` | SceneRefMeta? | 背景参考图 |
| `inheritFromPrevious` | boolean? | 继承前一镜 |
| `inheritBgRefFromPrevious` | boolean? | 继承背景参考图 |
| `inheritObjectRefsFromPrevious` | ObjectRefInheritMode? | 继承对象参考图 |
| `transitionType` | TransitionType? | 衔接方式 |
| `duration_s` | number | 时长（秒） |
| `cameraPreset` | string? | 相机预设 |
| `shotNote` | string? | 分镜备注 |
| `entryDir` | Direction? | 入镜方向 |
| `exitDir` | Direction? | 出镜方向 |
| `camera` | Camera | 相机 |
| `lighting` | Lighting | 光照 |
| `layers` | Layer[] | 对象列表 |
| `config` | object? | 配置 |
| `notes` | string | 备注（含 marker） |

#### Camera

| 属性 | 类型 | 说明 |
|------|------|------|
| `shot` | string | 景别 |
| `movement` | string | 运动 |
| `keyframes` | `{ t, x, y, zoom, rot }[]` | 相机关键帧 |

#### Lighting

| 属性 | 类型 | 说明 |
|------|------|------|
| `time` | string | 光线时间 |
| `key_dir` | string | 主光方向 |
| `mood` | string | 氛围 |

---

### 2.4 Project

| 属性 | 类型 |
|------|------|
| `project` | `{ mode, mediaType?, shotPlan?, creativeContext? }` |
| `scenes` | `Scene[]` |
| `meta` | `ProjectMeta?` |

---

## 三、左侧栏（Sidebar）

### 3.1 项目（Project）

| 动作 | 说明 |
|------|------|
| 保存项目… | 写入保存平台 |
| 复制提示词 | 打开复制流程 |
| 导出… | 打开导出弹窗 |
| 打开项目 | 本地打开 JSON |
| 项目库 | 打开项目库 |
| 重命名项目 | 重命名 |
| 另存项目… | 另存为 |
| 新建项目 | 新建 |

---

### 3.2 场景（Scenes）

| 功能 | 说明 |
|------|------|
| 场景卡片列表 | 分镜列表，点击切换 |
| 场景命名 | 双击改名 |
| 场景时长 | `duration_s`，视频可编辑 |
| 衔接方式 | `transitionType` |
| 添加场景 | `+` 按钮，受 `shotPlan` 限制 |
| 删除场景 | 每卡片 `-` 按钮 |
| 场景上限 | `MAX_SCENES` |

---

### 3.3 连续性（Continuity）

#### ContinuityViewModel

| 字段 | 类型 | 说明 |
|------|------|------|
| `continuityEnabled` | boolean | 连续开 / 关 |
| `templateType` | `"base"` \| `"webdrama"` \| `"anime"` \| null | 模板类型 |
| `currentSceneIndex` | number | 当前分镜索引 |
| `totalScenes` | number | 总分镜数 |
| `sceneLinks` | `{ fromPrevious, toNext, transition, entryDir, exitDir }` | 承接关系 |
| `carryOver` | `{ character, direction, camera, background }` | 继承摘要 |
| `anchorSummary` | `string[]` | 锚点摘要 |

---

### 3.4 对象 / 图层（Layers）

| 功能 | 说明 |
|------|------|
| 对象列表 | 当前分镜对象，点击选中 |
| 对象命名 | 双击改名 |
| 添加对象 | `+` 按钮 |
| 删除对象 | 每行 `-` 按钮 |
| 对象上限 | `MAX_LAYERS_PER_SCENE` |

---

### 3.5 场景策略（Scene Strategy）

#### 景别（`shotOptions`）

| value | label |
|-------|-------|
| `""` | 未设置 |
| `wide` | 广角 |
| `medium` | 中景 |
| `close` | 特写 |
| `extreme_close` | 极特写 |
| `over_shoulder` | 过肩 |
| `pov` | 主观视角 (POV) |
| `insert_closeup` | 插入特写 |
| `establishing` | 建立镜头 |
| `dutch_angle` | Dutch 角 |

#### 镜头运动（`moveOptions`，视频）

| value | label |
|-------|-------|
| `""` | 未设置 |
| `static` | 静止 |
| `slow_push_in` | 缓慢推进 |
| `slow_pull_out` | 缓慢拉远 |
| `pan_left` | 左摇 |
| `pan_right` | 右摇 |
| `tilt_up` | 上仰 |
| `tilt_down` | 下俯 |
| `handheld` | 手持 |
| `orbit` | 环绕 |

#### 衔接方式（`transitionType`）

| value | zh | en |
|-------|-----|-----|
| `cut` | 切换 | Cut |
| `reverse_angle` | 反打 | Reverse |
| `camera_continues` | 连续推进 | Continue |
| `dissolve` | 叠化 | Dissolve |
| `time_jump` | 时间跳转 | Time Jump |

#### 入镜 / 出镜方向（Direction）

- `N`
- `NE`
- `E`
- `SE`
- `S`
- `SW`
- `W`
- `NW`

#### 导演级风格包（Director Style Packs）

| id | labelZh | labelEn |
|----|---------|---------|
| `architectural_tension` | 建筑悬疑 | Architectural Tension |
| `intimate_observation` | 贴身观察 | Intimate Observation |
| `industrial_epic` | 工业史诗 | Industrial Epic |
| `kinetic_pursuit` | 高速追踪 | Kinetic Pursuit |
| `poetic_restraint` | 诗性克制 | Poetic Restraint |
| `commercial_spectacle` | 商业大片 | Commercial Spectacle |

#### 经典模式（Classic Modes）

##### 视频（Video Classic Modes）
- `steady_dialogue`
- `emotion_push`
- `suspense_watch`
- `hero_entry`
- `dream_memory`
- `truth_reveal`
- `premium_commercial`
- `character_trail`
- `rhythm_transition`
- `relationship_standoff`
- `first_person_impact`
- `mystery_reveal`

##### 图片（Image Classic Modes）
- `poster_center`
- `premium_product`
- `duo_tension`
- `lonely_env`
- `cinematic_still`
- `dream_portrait`

#### PRO+ 运镜（`proCameraPresets`）

##### 基础层（basic）
四类，约 21 个 preset：
- `push_pull`
- `pan_tilt`
- `follow_orbit`
- `angle_height`

##### PRO+ 层（pro_plus）
五类，约 40 个 preset：
- `dialogue_grammar`
- `transition_time`
- `psychology`
- `surreal_material`
- `body_perception`

---

### 3.6 镜头 · 光（Camera & Lighting）

#### 光线时间（`timeOptions`）

| value | label |
|-------|-------|
| `""` | 未设置 |
| `day` | 白天 |
| `dawn` | 黎明 |
| `sunset` | 日落 |
| `golden_hour` | 黄金时刻 |
| `blue_hour` | 蓝调时刻 |
| `night` | 夜晚 |

#### 主光方向（`dirOptions` / `key_dir`）

| value | label |
|-------|-------|
| `""` | 未设置 |
| `top_left` | 左上 |
| `top_right` | 右上 |
| `bottom_left` | 左下 |
| `bottom_right` | 右下 |
| `backlight` | 背光 |
| `rim_light` | 边缘光 |

#### 氛围（`moodOptions`）

| value | label |
|-------|-------|
| `""` | 未设置 |
| `cinematic` | 电影感 |
| `mysterious` | 神秘 |
| `bright` | 明亮 |
| `dark` | 暗调 |
| `noir` | 黑色电影 |
| `warm` | 暖色 |
| `cold` | 冷色 |

#### 光照语言（Lighting Profiles）

| id | 说明 |
|----|------|
| `natural_skin_readability` | 自然皮肤可读 |
| `low_key_edge_separation` | 低调边缘分离 |
| `rim_scale_separation` | 边缘光尺度分离 |
| `action_path_readability` | 动作路径可读 |
| `soft_layered_breathing` | 柔和层次呼吸 |
| `premium_focal_highlights` | 高级焦点高光 |

---

### 3.7 镜头语言（Camera Language）

#### 用户可见（Layer 1）
- `realistic_restrained`
- `commercial_ad`
- `cinematic_narrative`
- `dialogue_cover`
- `product_quality`
- `social_direct`
- `emotional_pressure`
- `suspense_atmosphere`
- `anime_dramatic`
- `premium_blockbuster`

---

## 四、中央区（Stage / Canvas）

### 4.1 Stage 画布

| 功能 | 说明 |
|------|------|
| 对象框 | 拖拽、缩放、旋转 |
| 参考图 | `localRef` 缩略图 |
| 网格 | 扩展画布，支持负坐标 |
| 缩放 | `0.4x–2.5x` |
| 背景参考图 | `backgroundRef` 显示 |

#### 坐标约束
- `WORLD_MIN = -50`
- `WORLD_MAX = 150`
- `SIZE_MIN = 2`
- `SIZE_MAX = 200`

---

### 4.2 Stage Work Bar（对象选中时）

| 动作 ID | 说明 | 条件 |
|---------|------|------|
| `select` | 选择 | 始终 |
| `move` | 移动 | 非锁定、非布局保护 |
| `center` | 居中 | 同上 |
| `reset` | 重置 | 同上 |
| `copyT0ToT1` | 复制 T0→T1 | 视频模式且可编辑 |
| `lock` | 锁定 | 未锁定时 |
| `unlock` | 解锁 | 已锁定时 |
| `markAnchor` | 标记锚点 | 连续模板且可编辑 |

---

### 4.3 Stage 对象状态（StageObjectState）

| 标签 | 说明 |
|------|------|
| `template-derived` | 模板派生 |
| `anchor-bound` | 锚点绑定 |
| `inherited` | 继承自前一镜 |
| `user-added` | 用户添加 |
| `locked` | 已锁定 |
| `protected-layout` | 布局保护 |

#### marker
- `@layoutlocked:1`
- `@continuityid:<id>`

---

### 4.4 分镜资源 Tab（Pro Asset Stage）

| 功能 | 说明 |
|------|------|
| 预览 | 图片 / 视频 |
| 元信息 | 标题、平台、生成源 |
| 菜单 | 下载、继续生成、删除 |

---

## 五、右侧栏（PropsPanel）

### 5.1 分镜背景（Scene Background）

| 功能 | 说明 |
|------|------|
| 预设 | 背景预设选择 |
| 自定义 | `bg:` marker 自定义描述 |
| 分镜背景参考图 | `backgroundRef` 导入 / 管理 |

---

### 5.2 对象属性（Object Properties）

#### 类型（TypeKey）
- `""`
- `station`
- `spacecraft`
- `planet`
- `satellite`
- `character`
- `text`
- `environment`
- `custom`

#### 形状（Shape）
- `circle`
- `rect`
- `ring`
- `arrow`

#### 外观（Look）
- 按类型有预设（`sciFiMetal`, `celestial`, `character`, `env`, `text`）
- 支持自定义

#### 形状描述（shapeDesc）
- 按类型有预设
- 支持自定义

#### 参考图（localRefs）
- `identity`
- `appearance`
- `style`

#### 参考图策略
- `optional`
- `required`

#### 外部提示词（externalPrompt）
- 自由文本

#### 备注（notes）
- 自由文本，含 marker

---

### 5.3 对象构图（Composition）

| 属性 | 范围 | 说明 |
|------|------|------|
| `x`, `y` | `-50..150` | 中心坐标 |
| `w`, `h` | `2..200` | 宽高 |
| `rot` | 度 | 旋转 |
| `t0 / t1` | `0 \| 1` | 时间轴（图片模式 `t1` 锁定） |

---

### 5.4 平台模式（Platform Mode，现位于 ExportPanel 右栏）

| 功能 | 说明 |
|------|------|
| 当前平台 | `PlatformPresetId` 选择 |
| 推荐平台 | 由模板 `domain/category` 推导 |
| 导出方式 | `prompt_only` \| `package` |
| 结构提示 | 强度、坐标、抑制字面等 |

---

### 5.5 底部插槽（bottomSlot）

| 功能 | 说明 |
|------|------|
| 生成源切换 | 平台生成 / 我的 API |
| 生成按钮 | 触发当前分镜生成 |

---

## 六、Field Keys（规则引擎）

### 6.1 PROJECT_KEYS
- `project.mediaType`
- `project.storyPlan`
- `project.workspaceMode`
- `project.sceneCount`
- `project.totalDuration`

### 6.2 SCENE_KEYS
- `scene.duration`
- `scene.classicShot`
- `scene.classicMotion`
- `scene.directorStylePack`
- `scene.proMotions`
- `scene.imageProEffects`
- `scene.constraintStrength`
- `scene.lightingSetup`
- `scene.backgroundPrompt`
- `scene.backgroundRefImage`
- `scene.lensRecipe`
- `scene.sceneChangeMode`
- `scene.entryDirection`
- `scene.exitDirection`
- `scene.objectInheritance`
- `scene.jumpCutMode`
- `scene.cameraMoveMode`

### 6.3 OBJECT_KEYS
- `object.t0`
- `object.t1`
- `object.refImage`
- `object.notes`

### 6.4 EXPORT_KEYS
- `export.range`
- `export.method`
- `export.target`

---

## 七、Notes Marker 汇总

| Marker | 说明 |
|--------|------|
| `bg:` | 背景描述 |
| `media:` | 媒体模式 `image/video` |
| `@compiler:` | `v1/v2` |
| `@scene_tier:` | `indoor/small_plaza/open_space` |
| `v2_mode:` | `short/strict` |
| `stability:` | `off/standard/strict` |
| `director_pack:` | `DirectorStylePackId` |
| `video_classic_mode:` | `VideoClassicMode id` |
| `image_classic_mode:` | `ImageClassicMode id` |
| `image_pro_effects:` | 逗号分隔 `ImageProEffect id` |
| `pro_basic_motion:` | 基础运镜 id |
| `pro_plus_motion:` | PRO+ 运镜 id，逗号分隔 |
| `pro_shot_recipe:` | `ProShotRecipe id` |
| `camera_language:` | `CameraLanguageOption id` |
| `@layoutlocked:1` | 对象布局锁定 |
| `@continuityid:` | 连续性锚点 ID |

---

## 八、常量与限制

| 常量 | 值 |
|------|-----|
| `MAX_SCENES` | `6` |
| `MAX_LAYERS_PER_SCENE` | `8` |
| `OBJECT_REF_LIMIT` | `1`（导出用） |

---

## 九、基线观察（仅事实，不下优化结论）

### 9.1 当前已明显存在的高价值能力
- 分镜层（Scene）结构完整
- 对象层（Layer）结构完整
- 连续性视图已独立
- Director Style Pack、Classic Modes、Pro Motion、Camera Language 已存在
- Lighting 基础项与 lightingProfiles 已存在
- Stage Work Bar 与对象状态系统已存在
- Platform Mode 已存在
- 规则引擎已有 field key 分层基础

### 9.2 当前已明显存在的潜在复杂性来源
- Scene Strategy、Director、Camera、Lighting 的边界尚未在本基线文档中做最终归属判断
- `notes marker` 承担了较多高级状态信息
- `camera_language:`、`director_pack:`、`pro_plus_motion:`、`image_pro_effects:` 同时存在，后续需判断是否有层级重叠
- `movement` 与 `pro motion`、`camera language` 的关系需要在后续文档比对时统一
- 背景、风格、镜头、对象描述分别落在 Scene Background / Scene Strategy / Object Properties / markers 中，后续需判断是否有多入口问题

### 9.3 本文档的使用方式
本文件将作为以下后续文档的比对输入之一：

- `docs/template-result-spec-master.md`
- `docs/template-type-specs.md`
- `docs/template-scene-purpose-taxonomy.md`
- `docs/template-field-master-table.md`
- `docs/field-to-module-mapping.md`
- `docs/template-rule-matrix.md`
- `docs/field-conflict-map.md`

---

## 十、下一步待比对内容

在拿本文件做最终判断前，还需要继续补充：

1. 模板系统结构与 family / variant / payload 现状
2. 模板类型与模板内容规划
3. 专业运镜 / 导演控制 / 镜头控制 / 光与氛围 的真实代码接入情况
4. Prompt / Export / Platform Mode 的最终展示与导出逻辑
5. 规则引擎当前实际已生效的规则与未生效规则

---

## 十一、文档状态

当前状态：
- 已整理第一部分
- 属于「现状基线」
- 暂不下最终产品判断
- 等待后续部分继续汇总后统一比对
