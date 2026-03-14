# Prompt / 编译 / 导出 / 平台适配 / 规则引擎 清单

本文档整理 prompt 编译链路、Scene/Object 字段映射、导演/运镜/镜头语言接入、Lighting 接入、Platform/Export、规则引擎与未接入字段，用于与 pro-console 和 template-system 文档三方比对。

---

## 1. Prompt 编译主流程

### 1.1 调用链概览

```
runPromptPipeline(input)
  → generatePrompts(project, lang, "universal")     → corePrompt
  → adaptPromptToPlatformDetailed({ prompt, profile, platformId, lang, media, sceneStrategy, creativeContext })
      → adaptPromptWithPlatformEngine
          → builtin: fal-family | runway-family | universal-core
  → cleanupFinalPrompt(adapted.prompt)               → finalCopyPrompt
```

### 1.2 各步输入/输出/修改

| 步骤 | 输入 | 输出 | 修改字段 |
|------|------|------|----------|
| **generatePrompts** | project, lang, profile | 完整 prompt 字符串 | 无（纯生成） |
| **formatScenePrompt** | lang, scene | 单镜 prompt 块 | 无 |
| **compileScenePromptV2** | scene, lang, tier, v2Mode | V2 结构化 prompt | 无 |
| **adaptPromptToPlatformDetailed** | corePrompt + PlatformAdaptInput | adapted.prompt + meta | prompt 文本（平台策略注入、strip scaffold、trim budget） |
| **cleanupFinalPrompt** | adapted.prompt | finalCopyPrompt | 图片模式去 duration/t1、collapse 静止 kf、fix scene title |

### 1.3 formatScenePrompt

- **输入**：`lang`, `scene`
- **输出**：单镜 prompt（header + sceneMeta + layerLines）
- **使用字段**：camera.shot/movement, lighting.time/key_dir/mood, shotNote, bg, notes（parseBg、parseProMotionSelection、buildImageProPromptLine）, sceneStrategy.promptLines

### 1.4 compileV2

- **输入**：scene, lang, tier, v2Mode
- **输出**：`[V2 SCENEPILOT COMPILE]` 结构化 prompt
- **使用**：layers（look, notes, externalPrompt, kf）, parseProMotionSelection, buildImageProPromptLine, 无 camera_language

### 1.5 adaptPromptToPlatformDetailed / builtin.ts

- **fal-family**：`falStrategyDirectives`（classicIds, directorIds, usesAdvancedLanguage, usesLightingDefaults, lightingProfileIds）、`falCreativeContextDirectives`；stripExecutionScaffold；image 模式 keepStructuredBlocks
- **runway-family**：`runwayStrategyDirectives`、`runwayCreativeContextDirectives`；video 模式 compressTail、strip refs lines
- **universal-core**：`runCommonAdaptation`，无额外 transform

### 1.6 builtin strategy directives

| 平台 | 策略来源 | 注入内容 |
|------|----------|----------|
| **runway** | sceneStrategy | classicModeIds、usesAdvancedLanguage、usesLightingDefaults、lightingProfileIds、directorPackIds 对应英文指令 |
| **fal** | sceneStrategy | 同上（图片专用） |
| **creativeContext** | creativeContext | hasSecondaryInput、subjectLabels（runway）；hasPrimaryInput、subjectLabels（fal） |

---

## 2. Scene 字段进入 prompt 的映射

| 字段 | 是否进入 prompt | 是否进入平台适配 | 仅 UI | 仅 marker | 未使用 | 说明 |
|------|-----------------|------------------|-------|-----------|--------|------|
| **scene.camera.shot** | ✔ | - | - | - | - | formatScenePrompt / sceneStrategy.defaults.shot |
| **scene.camera.movement** | ✔ | - | - | - | - | 经 resolveEffectiveMotion；有 pro_motion 时被覆盖为空 |
| **scene.notes** | ✔ | - | - | ✔ | - | 解析 bg:, pro_basic_motion:, pro_plus_motion:, image_pro_effects:, video_classic_mode:, image_classic_mode:, director_pack:；notes 全文进 layer 备注 |
| **camera_language** | ✖ | ✖ | ✔ | ✔ | - | 仅 Sidebar 解析；**未进入 prompt** |
| **pro_plus_motion** | ✔ | ✔ | - | ✔ | - | buildProMotionPromptLine → 专业运镜行；usesAdvancedLanguage 进 platform adapt |
| **image_pro_effects** | ✔ | ✔ | - | ✔ | - | buildImageProPromptLine；usesAdvancedLanguage |
| **director_pack** | ✔ | ✔ | - | ✔ | - | resolveSceneStrategy → promptLines；platform adapt 注入 directorPackIds 指令 |
| **lighting.time** | ✔ | - | - | - | - | 或 sceneStrategy.defaults.time |
| **lighting.key_dir** | ✔ | - | - | - | - | 或 sceneStrategy.defaults.keyDir |
| **lighting.mood** | ✔ | - | - | - | - | 或 sceneStrategy.defaults.mood |
| **lightingProfiles** | ✔ | ✔ | - | - | - | 来自 classicMode/directorPack；resolveSceneStrategy 的 promptLines；platform 注入 profile.runwayEn/falEn |
| **transitionType** | ✔ | - | - | - | - | multicam/edit 模式 transitionLineByType |
| **entryDir / exitDir** | ✔ | - | - | - | - | continuous 模式 buildContinuousBridge、doorLine |
| **inheritFromPrevious** | 间接 | - | - | - | - | 通过 continuous 模式整体逻辑 |

---

## 3. Object / Layer 字段进入 prompt

| 字段 | 进入 prompt | 只影响布局 | 只影响 continuity | 只影响 export | 说明 |
|------|-------------|------------|-------------------|---------------|------|
| **look** | ✔ | - | - | - | formatLayerLine、LRL |
| **externalPrompt** | ✔ | - | - | - | 对象局部参考 / 局部粘贴提示 |
| **notes** | ✔ | - | - | - | 约束/备注、anchorHintFromNotes、silhouetteGuard |
| **referencePolicy** | - | - | - | ✔ | 导出/参考策略 |
| **localRefs** | ✔ | - | - | ✔ | referenceLinks 摘要进 prompt；export 时用 |
| **type** | ✔ | - | - | - | 主体 type |
| **shape** | - | ✔ | - | - | shapeDesc 进 prompt |
| **kf** | ✔ | ✔ | - | - | t0/t1 坐标、路径描述 |
| **continuityId** | - | - | ✔ | - | @continuityId:xxx 在 notes；用于 continuity 解析，不直接进 prompt 文本 |

---

## 4. Director / Classic / ProMotion / CameraLanguage / ImagePro

| 能力 | 来源字段 | marker 名 | 进入 prompt 的函数 | 参与 platform adapt | 参与 usesAdvancedLanguage |
|------|----------|-----------|---------------------|---------------------|---------------------------|
| **classicMode** | scene.notes | video_classic_mode: / image_classic_mode: | resolveSceneStrategy → promptLines | ✔ classicModeIds | - |
| **directorPack** | scene.notes | director_pack: | resolveSceneStrategy → promptLines | ✔ directorPackIds | - |
| **pro_basic_motion** | scene.notes | pro_basic_motion: | buildProMotionPromptLine | ✔ usesAdvancedLanguage（仅 proPlusIds） | ✔ |
| **pro_plus_motion** | scene.notes | pro_plus_motion: | buildProMotionPromptLine | ✔ | ✔ |
| **camera_language** | scene.notes | camera_language: | **无** | ✖ | ✖ |
| **image_pro_effects** | scene.notes | image_pro_effects: | buildImageProPromptLine | ✔ | ✔ |
| **lightingProfiles** | classicMode / directorPack | - | resolveSceneStrategy → promptLines | ✔ lightingProfileIds | - |

---

## 5. Lighting / Atmosphere 接入链路

| 环节 | 作用 |
|------|------|
| **lighting.time** | scene.lighting.time 或 sceneStrategy.defaults.time → formatScenePrompt 光照行 |
| **lighting.key_dir** | 同上 keyDir |
| **lighting.mood** | 同上 mood |
| **lightingProfiles** | classicMode/directorPack 的 lightingProfileIds → resolveSceneStrategy.promptLines；platform adapt 注入 runwayEn/falEn |
| **resolveSceneStrategy** | 默认值：classicMode?.time ?? directorPack?.videoDefaults?.time 等；promptLines 含 lighting profile 文案 |
| **formatScenePrompt** | 空时用 sceneStrategy.defaults |
| **adaptPromptToPlatformDetailed** | usesLightingDefaults、lightingProfileIds 进 strategy directives |

**默认值来源**：classicMode → directorPack.imageDefaults/videoDefaults → 空  
**覆盖时机**：用户填 lighting 时优先；否则用 strategy 默认  
**忽略时机**：无显式忽略逻辑  
**平台注入**：runway/fal 的 strategy directives 中注入 lighting 相关指令

---

## 6. PlatformMode / Export / PromptMode

| 概念 | 影响 prompt | 只影响导出 | 影响 pipeline | 影响适配 |
|------|-------------|------------|---------------|----------|
| **prompt_only** | - | ✔ | - | - |
| **package** | - | ✔ | - | - |
| **export.target** | - | ✔ | - | 选平台 preset |
| **platformPresetId** | - | - | ✔ | ✔ 选 engine、patch |
| **structureStrength** | 间接 | - | - | - |
| **suppressLiteral** | 间接 | - | - | structureIntensity 推导 coordinateStrength |
| **coordinateMode** | - | - | - | PlatformModeViewModel 用，未直接改 prompt |

---

## 7. conflictRules / fieldKeys / rule engine

### 7.1 PROJECT_KEYS / SCENE_KEYS / OBJECT_KEYS / EXPORT_KEYS

- **PROJECT_KEYS**：mediaType, storyPlan, workspaceMode, sceneCount, totalDuration  
- **SCENE_KEYS**：duration, classicShot, classicMotion, directorStylePack, proMotions, imageProEffects, constraintStrength, lightingSetup, backgroundPrompt, entryDirection, exitDirection, objectInheritance, lensRecipe, sceneChangeMode, jumpCutMode, cameraMoveMode  
- **OBJECT_KEYS**：t0, t1  
- **EXPORT_KEYS**：range, method, target  

注：fieldKeys 为规范键名，非运行时必用；多数 scene 状态存于 notes marker。

### 7.2 conflictRules 规则

| 规则 | 类型 | 说明 |
|------|------|------|
| static vs motion | 真规则 | 同一 layer notes/externalPrompt 内 static 与 motion 词冲突 → high |
| no text vs text overlay | 真规则 | 无文字 vs 添加文字 → high |
| no overlay vs overlay | 提示 | warning |
| no add vs add subject | 真规则 | 对象数量冲突 → high |
| no center vs center hero | 提示 | warning |
| global scope (object-local) | 提示 | externalPrompt 含全局词 → warning |
| strategy override | 提示 | 已有 classic/director 时对象级光照/镜头词 → warning |
| scene static vs motion | 真规则 | t0=t1 但层有运动词 → high |
| cross-layer global static/motion | 真规则 | 跨层冲突 → high |
| bg lighting conflict | 提示 | 背景含光照词且 strategy 已控光照 → warning |

**字段级互斥**：无；conflictRules 只做检测与提示，不强制修改字段。

---

## 8. 当前已知未接入字段

| 项目 | 事实 |
|------|------|
| **camera_language 未进 prompt** | parseCameraLanguageId 仅在 Sidebar 使用；formatScenePrompt、compileV2、resolveSceneStrategy 均未使用 |
| **directorPack 未进 payload** | 模板 payload 未写入 director_pack marker；仅 UI 可设 |
| **lightingPack 未进 payload** | 模板 payload 未写入 lightingSetup/lightingProfiles；classic/director 自带 lightingProfileIds |
| **payload.continuity 未写入 project** | applyPayloadToProject 只写 mediaType、shotPlan、scenes；continuity 对象未写入 project 顶层 |
| **applyMode 未区分** | layout_only / layout_plus_style / full_workflow 仅 UI；apply 逻辑未按 mode 区分 |
| **lightingProfiles 未产品化** | 仅经 classic/director 间接使用；无独立 lighting 预设选择器 |
| **pro motion 覆盖 movement** | resolveEffectiveMotion：有 pro_motion 时 movement 置空，camera.movement 不输出 |
| **notes marker 承担过多状态** | media:, genmode:, bg:, camera_language:, director_pack:, video_classic_mode:, image_classic_mode:, image_pro_effects:, pro_basic_motion:, pro_plus_motion: 等均存于 notes |

---

## 9. 输出文件

`docs/prompt-engine-inventory-full.md`

---

## 摘要

**[Prompt 链路]**  
generatePrompts → formatScenePrompt / compileV2 → proPromptQualityGate → adaptPromptToPlatformDetailed（fal/runway/universal）→ cleanupFinalPrompt → finalCopyPrompt

**[Scene 字段映射]**  
shot/movement、lighting.time/key_dir/mood、notes（含多种 marker）、entryDir/exitDir、transitionType 进入 prompt；camera_language 仅 marker，未进 prompt。

**[Object 字段映射]**  
look、externalPrompt、notes、type、shapeDesc、kf、referenceLinks 进 prompt；continuityId 仅 continuity；referencePolicy、localRefs 影响导出。

**[导演/运镜/镜头语言接入]**  
classicMode、directorPack、pro_basic_motion、pro_plus_motion、image_pro_effects 经 resolveSceneStrategy/buildProMotionPromptLine/buildImageProPromptLine 进 prompt 和 platform adapt；camera_language 未接入。

**[Lighting 接入]**  
lighting 三件套 + lightingProfiles（来自 classic/director）→ resolveSceneStrategy.defaults 与 promptLines → platform strategy directives。

**[Platform/Export 接入]**  
platformPresetId 选 engine；export.target、prompt_only/package 影响导出；structureStrength、suppressLiteral 用于 viewModel，未直接改 prompt。

**[规则引擎现状]**  
conflictRules 做词语冲突检测与提示；fieldKeys 为规范键；无字段级互斥执行。

**[未接入字段]**  
camera_language、directorPack/lightingPack 进 payload、payload.continuity 写 project、applyMode 区分、lightingProfiles 产品化、pro motion 覆盖 movement、notes marker 过载。
