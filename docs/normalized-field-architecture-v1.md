# ScenePilotix Phase 1 规范字段架构 v1

基于行业手法总库与现有系统映射，定义 Phase 1 规范字段架构。本架构解决：哪些字段要有、哪些不要、哪些自动带入、哪些用户可改、哪些高级模板专用、哪些仅模板/引擎使用。

---

## A. Project Layer

| canonical_name | current_source | target_layer | visibility | enters_prompt | enters_platform_adapt | enters_rules | single_source | notes |
|----------------|----------------|--------------|------------|---------------|----------------------|--------------|---------------|-------|
| mediaType | project.mediaType | Project | user_visible | ✔ | ✔ | ✔ | 是 | 图片/视频 |
| ratio | project.aspectRatio? | Project | user_visible | ✔ | - | - | 是 | 16:9/9:16/1:1 |
| shotPlan | project.shotPlan | Project | user_visible | ✔ | ✔ | ✔ | 是 | single/continuous/multicam/edit |
| platformTarget | meta / ExportPanel | Project | user_visible | - | ✔ | - | 是 | 导出平台 |
| exportMethod | ExportPanel | Project | user_visible | - | ✔ | - | 是 | prompt_only/package |
| structureIntensity | 推导 | Project | user_visible | - | - | - | 是 | soft/balanced/strong |
| continuity | 缺失，payload 有 | Project | user_visible | - | - | - | 否→是 | Phase 1 必补：apply 时写入 |
| sceneCount | 推导 | Project | user_visible | - | - | ✔ | 是 | 分镜数 |
| totalDuration | 推导 | Project | user_visible | - | - | - | 是 | 总时长 |
| workspaceMode | project.workspaceMode | Project | user_visible | - | - | - | 是 | quick/pro |
| currentTemplate | meta.currentTemplate | Project | user_visible | - | ✔ | - | 是 | 当前应用模板元数据 |

---

## B. Scene Layer

| canonical_name | current_source | target_layer | visibility | enters_prompt | enters_platform_adapt | enters_rules | single_source | notes |
|----------------|----------------|--------------|------------|---------------|----------------------|--------------|---------------|-------|
| scenePurpose | 无 | Scene | template_default | - | - | - | - | Phase 2 可补 |
| sceneType | category/domain 推导 | Scene | template_default | - | ✔ | - | 是 | 来自模板 |
| name | scene.name | Scene | user_visible | - | - | - | 是 | 分镜名 |
| duration_s | scene.duration_s | Scene | user_visible | ✔ | - | ✔ | 是 | 时长 |
| shot | camera.shot | Scene | user_visible | ✔ | - | ✔ | 是 | 景别 |
| cameraTask | 无 | Scene | - | - | - | - | - | 可选 Phase 2 |
| movement | camera.movement | Scene | user_visible | ✔ | - | ✔ | 是 | 有 pro_motion 时被覆盖 |
| cameraLanguage | notes camera_language: | Scene | user_visible | ✖→✔ | ✔ | - | 是 | Phase 1 必补进 prompt |
| proMotion | notes pro_basic_motion: pro_plus_motion: | Scene | user_visible | ✔ | ✔ | - | 是 | 覆盖 movement |
| classicMode | notes video_classic_mode: image_classic_mode: | Scene | user_visible | ✔ | ✔ | - | 是 | 经典模式 |
| directorPack | notes director_pack: | Scene | user_visible | ✔ | ✔ | - | 是 | 导演包 |
| time | lighting.time | Scene | user_visible | ✔ | - | - | 是 | 光线时间 |
| keyDir | lighting.key_dir | Scene | user_visible | ✔ | - | - | 是 | 主光方向 |
| mood | lighting.mood | Scene | user_visible | ✔ | - | - | 是 | 氛围 |
| lightingPack | 经 classic/director 间接 | Scene | template_default | ✔ | ✔ | - | 否 | Phase 1 可加独立选择器 |
| transition | scene.transitionType | Scene | user_visible | ✔ | - | ✔ | 是 | 衔接方式 |
| entryDir | scene.entryDir | Scene | user_visible | ✔ | - | ✔ | 是 | 入场方向 |
| exitDir | scene.exitDir | Scene | user_visible | ✔ | - | ✔ | 是 | 离场方向 |
| inheritFromPrevious | scene.inheritFromPrevious | Scene | user_visible | ✔ | - | ✔ | 是 | 继承上一镜 |
| shotNote | scene.shotNote | Scene | user_visible | ✔ | - | - | 是 | 分镜备注 |
| bg | notes bg: | Scene | user_visible | ✔ | - | - | 否 | 与背景预设重叠，需统一 |
| backgroundRef | scene.backgroundRef | Scene | user_visible | - | - | - | 是 | 背景参考图 |
| media | notes media: | Scene | advanced_hidden | ✔ | - | ✔ | 是 | 单镜 media 覆盖 |
| compiler | config/notes | Scene | advanced_hidden | ✔ | - | - | 是 | v1/v2 |
| sceneTier | notes @scene_tier: | Scene | advanced_hidden | ✔ | - | - | 是 | indoor/small_plaza/open_space |
| v2Mode | notes v2_mode: | Scene | advanced_hidden | ✔ | - | - | 是 | short/strict |
| imageProEffects | notes image_pro_effects: | Scene | user_visible | ✔ | ✔ | - | 是 | 图片专业效果 |

---

## C. Object Layer

| canonical_name | current_source | target_layer | visibility | enters_prompt | enters_platform_adapt | enters_rules | single_source | notes |
|----------------|----------------|--------------|------------|---------------|----------------------|--------------|---------------|-------|
| objectType | layer.type | Object | user_visible | ✔ | - | - | 是 | 类型 |
| role | 无 | Object | template_default | - | - | - | - | 可选：character/subject/prop |
| look | layer.look | Object | user_visible | ✔ | - | ✔ | 是 | 外观 |
| shapeDesc | layer.shapeDesc | Object | user_visible | ✔ | - | - | 是 | 形状描述 |
| externalPrompt | layer.externalPrompt | Object | user_visible | ✔ | - | ✔ | 是 | 对象局部提示 |
| notes | layer.notes | Object | user_visible | ✔ | - | ✔ | 是 | 备注（含 marker） |
| continuityId | layer.notes @continuityId: | Object | user_visible | - | - | ✔ | 是 | 连续性锚点 |
| localRefs | layer.localRefs | Object | user_visible | ✔ | - | - | 是 | 本地参考图 |
| referencePolicy | layer.referencePolicy | Object | user_visible | - | - | - | 是 | optional/required |
| referenceLinks | layer.referenceLinks | Object | user_visible | ✔ | - | - | 是 | 参考链接 |
| z | layer.z | Object | user_visible | - | - | - | 是 | 层级 |
| layoutLocked | marker @layoutlocked | Object | user_visible | - | - | - | 是 | 布局锁定 |

---

## D. Composition Layer

| canonical_name | current_source | target_layer | visibility | enters_prompt | enters_platform_adapt | enters_rules | single_source | notes |
|----------------|----------------|--------------|------------|---------------|----------------------|--------------|---------------|-------|
| x, y, w, h, rot | layer.kf | Object/Composition | user_visible | ✔ | - | ✔ | 是 | 坐标与尺寸 |
| t0, t1 | layer.kf | Object/Composition | user_visible | ✔ | - | ✔ | 是 | 起止帧 |
| compositionPreset | image_pro_effects 间接 | Scene | user_visible | ✔ | ✔ | - | 是 | 构图预设 |
| safeArea | 无 | Composition | engine_only | - | - | - | - | Phase 2+ |
| titleSafe | 无 | Composition | engine_only | - | - | - | - | Phase 2+ |
| logoSafe | 无 | Composition | engine_only | - | - | - | - | Phase 2+ |
| ctaSafe | 无 | Composition | engine_only | - | - | - | - | Phase 2+ |

---

## E. Hidden / Advanced Layer

| canonical_name | current_source | target_layer | visibility | enters_prompt | enters_platform_adapt | enters_rules | single_source | notes |
|----------------|----------------|--------------|------------|---------------|----------------------|--------------|---------------|-------|
| cameraLanguage L2 | notes camera_language: | Scene | advanced_hidden | ✖→✔ | ✔ | - | 是 | 模板写入，用户见 L1 映射 |
| cameraLanguage L3 | 无 | Scene | engine_only | - | - | - | - | 50+ 底层库 |
| pro_plus_motion | notes pro_plus_motion: | Scene | advanced_hidden | ✔ | ✔ | - | 是 | 高级运镜 |
| lightingProfileIds | classic/director 携带 | Scene | advanced_hidden | ✔ | ✔ | - | 否 | 无独立存储 |
| directorInternalCues | directorPack 内部 | Scene | engine_only | ✔ | ✔ | - | 是 | 导演包内部 cue |
| markerCompatibility | 各类 marker | Scene/Object | engine_only | 部分 | - | - | - | 兼容旧 marker |
| stability | notes stability: | Scene | advanced_hidden | - | - | - | 是 | off/standard/strict |
| constraintStrength | 无 | Scene | engine_only | - | - | - | - | Phase 2+ |

---

## 字段计数

| 层级 | 字段数 |
|------|--------|
| Project | 11 |
| Scene | 26 |
| Object | 12 |
| Composition | 7 |
| Hidden/Advanced | 8 |
| **合计** | **64** |
