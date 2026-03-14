# ScenePilotix Phase 1 字段可编辑性策略 v1

定义每个规范字段的编辑策略：用户可编辑、模板自动带入、仅高级模板、只读展示、引擎控制、禁止多入口。

---

## 策略类型定义

| 策略 | 说明 |
|------|------|
| **用户可编辑** | 用户可在对应模块直接修改 |
| **模板自动带入** | 应用模板时写入，用户可覆盖 |
| **仅高级模板** | 仅 cost≥5 或 continuity 非 starter 模板可带入 |
| **只读展示** | 由系统推导或只读，不可编辑 |
| **引擎控制** | 仅 prompt/平台适配逻辑使用，UI 不暴露 |
| **禁止多入口** | 同一字段只有一个主编辑入口，禁止重复 |

---

## Project Layer

| canonical_name | 用户可编辑 | 模板自动带入 | 仅高级模板 | 只读展示 | 引擎控制 | 禁止多入口 |
|----------------|------------|--------------|------------|----------|----------|------------|
| mediaType | ✔ | ✔ | - | - | - | ✔ |
| ratio | ✔ | ✔ | - | - | - | ✔ |
| shotPlan | ✔ | ✔ | - | - | - | ✔ |
| platformTarget | ✔ | - | - | - | - | ✔ |
| exportMethod | ✔ | - | - | - | - | ✔ |
| structureIntensity | - | - | - | ✔ | - | - |
| continuity | ✔ | ✔ | - | - | - | ✔ |
| sceneCount | - | - | - | ✔ | - | - |
| totalDuration | - | - | - | ✔ | - | - |
| workspaceMode | ✔ | - | - | - | - | ✔ |
| currentTemplate | - | ✔ | - | ✔ | - | - |

---

## Scene Layer

| canonical_name | 用户可编辑 | 模板自动带入 | 仅高级模板 | 只读展示 | 引擎控制 | 禁止多入口 |
|----------------|------------|--------------|------------|----------|----------|------------|
| name | ✔ | ✔ | - | - | - | ✔ |
| duration_s | ✔ | ✔ | - | - | - | ✔ |
| shot | ✔ | ✔ | - | - | - | ✔ |
| movement | ✔ | ✔ | - | - | - | ✔（pro_motion 时只读） |
| cameraLanguage | ✔ | ✔ | ✔ | - | - | ✔ |
| proMotion | ✔ | ✔ | ✔ | - | - | ✔ |
| classicMode | ✔ | - | - | - | - | ✔ |
| directorPack | ✔ | ✔ | ✔ | - | - | ✔ |
| time | ✔ | ✔ | - | - | - | ✔ |
| keyDir | ✔ | ✔ | - | - | - | ✔ |
| mood | ✔ | ✔ | - | - | - | ✔ |
| lightingPack | ✔ | ✔ | ✔ | - | - | ✔ |
| transition | ✔ | ✔ | - | - | - | ✔ |
| entryDir | ✔ | ✔ | - | - | - | ✔ |
| exitDir | ✔ | ✔ | - | - | - | ✔ |
| inheritFromPrevious | ✔ | ✔ | - | - | - | ✔ |
| shotNote | ✔ | - | - | - | - | ✔ |
| bg | ✔ | - | - | - | - | ✔（与背景预设统一） |
| backgroundRef | ✔ | - | - | - | - | ✔ |
| media | ✔ | ✔ | - | - | - | ✔ |
| compiler | ✔ | ✔ | - | - | - | ✔ |
| sceneTier | ✔ | ✔ | - | - | - | ✔ |
| v2Mode | ✔ | - | - | - | - | ✔ |
| imageProEffects | ✔ | - | - | - | - | ✔ |

---

## Object Layer

| canonical_name | 用户可编辑 | 模板自动带入 | 仅高级模板 | 只读展示 | 引擎控制 | 禁止多入口 |
|----------------|------------|--------------|------------|----------|----------|------------|
| objectType | ✔ | ✔ | - | - | - | ✔ |
| look | ✔ | ✔ | - | - | - | ✔ |
| shapeDesc | ✔ | ✔ | - | - | - | ✔ |
| externalPrompt | ✔ | - | - | - | - | ✔ |
| notes | ✔ | ✔ | - | - | - | ✔ |
| continuityId | ✔ | ✔ | - | - | - | ✔ |
| localRefs | ✔ | - | - | - | - | ✔ |
| referencePolicy | ✔ | ✔ | - | - | - | ✔ |
| referenceLinks | ✔ | - | - | - | - | ✔ |
| z | ✔ | ✔ | - | - | - | ✔ |
| layoutLocked | ✔ | ✔ | - | - | - | ✔ |

---

## Composition Layer

| canonical_name | 用户可编辑 | 模板自动带入 | 仅高级模板 | 只读展示 | 引擎控制 | 禁止多入口 |
|----------------|------------|--------------|------------|----------|----------|------------|
| x, y, w, h, rot | ✔ | ✔ | - | - | - | ✔ |
| t0, t1 | ✔ | ✔ | - | - | - | ✔ |
| compositionPreset | ✔ | - | - | - | - | ✔ |

---

## Hidden / Advanced Layer

| canonical_name | 用户可编辑 | 模板自动带入 | 仅高级模板 | 只读展示 | 引擎控制 | 禁止多入口 |
|----------------|------------|--------------|------------|----------|----------|------------|
| cameraLanguage L2 | - | ✔ | ✔ | - | - | ✔ |
| cameraLanguage L3 | - | - | - | - | ✔ | ✔ |
| pro_plus_motion | ✔ | ✔ | ✔ | - | - | ✔ |
| lightingProfileIds | - | ✔ | ✔ | - | ✔ | ✔ |
| directorInternalCues | - | - | - | - | ✔ | ✔ |
| stability | ✔ | - | - | - | - | ✔ |

---

## 特殊规则

### 互斥与覆盖

| 规则 | 说明 |
|------|------|
| pro_motion 覆盖 movement | 当 pro_basic_motion 或 pro_plus_motion 有值时，movement 不输出；UI 应禁用或提示 |
| classic/director 携带 lighting | classicMode 或 directorPack 选中时，可带入 lightingPack；用户可覆盖 |
| camera_language L2 映射 L1 | 模板写入 L2 id 时，用户看到 L1 映射标签；用户选 L1 时存 L1 |

### 禁止多入口

| 字段 | 主入口 | 禁止 |
|------|--------|------|
| bg | Scene Background 自定义 / bg: | 禁止 notes 手写 bg: 与预设冲突 |
| shot | Camera Control 景别 | 禁止 pro motion 内隐含 shot 与景别冲突 |
| 对象描述 | look + externalPrompt + notes 分工 | 禁止三者语义重叠导致冲突 |

### applyMode 与写入范围（Phase 1 必补）

| applyMode | 写入范围 |
|-----------|----------|
| layout_only | 仅 layers(kf), objectType, continuityId |
| layout_plus_style | + shot, movement, time, keyDir, mood, cameraLanguage |
| full_workflow | 全部 scene 字段 + project 覆盖 |
