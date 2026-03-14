# ScenePilotix 架构状态报告

汇总当前模板系统 / Pro 控制台 / Prompt / Rule / TemplateSpec / Payload 的完整状态，用于判断是否可以进入架构冻结阶段。

**检查范围**：docs/market-technique-corpus, market-to-system-mapping, normalized-field-architecture, field-editability, field-to-module-mapping, rule-matrix, disabled-state-policy, advanced-template-capability-policy, phase-1-template-authoring-policy, template-spec-schema, template-family-spec/*, template-variant-rules, template-payload-schema-v2, prompt-engine-inventory-full。

**注**：`docs/architecture-freeze-check.md` 不存在。

---

## 1. 字段总表

### 统计

| 层级 | 字段数 |
|------|--------|
| Project | 11 |
| Scene | 26 |
| Object | 12 |
| Composition | 7 |
| Hidden/Advanced | 8 |
| **总字段数** | **64** |

### 全部 canonical_name 列表

**Project**：mediaType, ratio, shotPlan, platformTarget, exportMethod, structureIntensity, continuity, sceneCount, totalDuration, workspaceMode, currentTemplate

**Scene**：scenePurpose, sceneType, name, duration_s, shot, cameraTask, movement, cameraLanguage, proMotion, classicMode, directorPack, time, keyDir, mood, lightingPack, transition, entryDir, exitDir, inheritFromPrevious, shotNote, bg, backgroundRef, media, compiler, sceneTier, v2Mode, imageProEffects

**Object**：objectType, role, look, shapeDesc, externalPrompt, notes, continuityId, localRefs, referencePolicy, referenceLinks, z, layoutLocked

**Composition**：x, y, w, h, rot, t0, t1, compositionPreset, safeArea, titleSafe, logoSafe, ctaSafe

**Hidden/Advanced**：cameraLanguage L2, cameraLanguage L3, pro_plus_motion, lightingProfileIds, directorInternalCues, markerCompatibility, stability, constraintStrength

### 检查结果

#### [未定义字段]
无。所有引用的 canonical 字段均在 `normalized-field-architecture-v1.md` 中定义。

#### [重复字段]
无。同一 canonical_name 仅出现一次。

#### [无归属字段]
- **scenePurpose**：Phase 2 可补，当前无 target_layer 明确归属
- **cameraTask**：可选 Phase 2，当前无明确归属
- **markerCompatibility**：engine_only，无 UI 归属
- **constraintStrength**：engine_only，Phase 2+
- **safeArea, titleSafe, logoSafe, ctaSafe**：engine_only，Phase 2+

---

## 2. 模块归属检查

基于 `field-to-module-mapping-v2.md`。

### [多入口字段]
- **continuityId**：主编辑模块为「Object Properties / Scenes」，存在双入口描述

### [无入口字段]
- **scenePurpose**：无模块映射
- **sceneType**：无独立模块（由 category/domain 推导）
- **cameraTask**：无模块映射
- **structureIntensity**：只读，无编辑入口（符合设计）
- **sceneCount, totalDuration, currentTemplate**：只读，无编辑入口（符合设计）

### [模块不存在字段]
无。所有模块（Current Template, Scenes/Continuity, Director Control, Camera Control, Lighting/Atmosphere, Scene Background, Object Properties, Composition, Export/Platform）均在文档中定义。

---

## 3. Rule Matrix 检查

基于 `rule-matrix-v1.md`。

### [规则引用不存在字段]
无。规则引用的字段均在 normalized-field-architecture 中定义：
- R-MUTEX-001/001b: proMotion, movement ✓
- R-MUTEX-002/002b: cameraLanguage L1/L2 ✓
- R-MUTEX-003/003b: lightingPack, time, keyDir, mood, classicMode ✓
- R-MUTEX-004/004b: shotPlan, transition ✓
- R-MUTEX-005: compositionPreset ✓
- R-LAYER-003: continuityId ✓
- R-TPL-003: continuity, entryDir, exitDir ✓

### [规则冲突]
无明确冲突。R-MUTEX-003 与 R-MUTEX-003b 分别处理不同场景（lightingPack 与 raw 不互斥 vs 独立 lightingPack 与 classic 互斥），不冲突。

### [规则重复]
无。规则 ID 唯一。

---

## 4. Template Spec → Payload 映射检查

基于 `template-spec-schema-v1.md` 与 `template-payload-schema-v2.md`。

### [spec 无 payload]
无。所有 spec 字段均有 payload 映射：
- mediaType, storyPlan, ratio, sceneCount → projectDefaults
- shot, movement, cameraLanguage, proMotion, directorPack, time, keyDir, mood, lightingPack, bg, duration_s, classicMode, compositionPreset → scene
- continuitySpec → entryDir, exitDir, inheritFromPrevious, transitionType
- objects → layers
- composition → layer.kf

### [payload 无 spec]
以下 payload 字段无直接 spec 来源，但为推导或运行时字段，可接受：
- **projectDefaults.structureIntensity**：由 sceneCount/template 推导
- **projectDefaults.workspaceMode**：项目设置，非模板 spec
- **scene.raw**：完整 Scene 由 spec 组装，非独立字段
- **payload.continuity**：由 continuitySpec 推导，模板 apply 时写入

### [映射冲突]
无。spec → payload 映射一一对应，无冲突定义。

---

## 5. Template Family / Variant / Spec 一致性

基于 `template-family-spec/*`, `template-variant-rules.md`, `template-spec-schema-v1.md`。

### [family 非法字段]
无。family spec 中的字段均在 spec schema 中定义：
- shot, movement, cameraLanguage, lighting (time, keyDir, mood, lightingPack), composition, objects 类型 ✓

### [variant 非法字段]
无。variant 规则引用的字段均在 spec 中定义：
- cameraLanguage L1/L2, proMotion, directorPack, lightingPack, continuitySpec, continuityId, layers, config 等 ✓

### [spec 未支持字段]
无。spec schema 覆盖 family 与 variant 所需字段。部分 variant（如 commercial, premium）引用的 compositionPreset 取值（hero_center, glossy_detail 等）来自 market-technique-corpus，与 spec 取值约束一致。

---

## 6. Advanced / Hidden / Disabled 检查

基于 `advanced-template-capability-policy.md` 与 `disabled-state-policy-v1.md`。

### [禁选引用错误]
- **image_classic_mode / video_classic_mode**：disabled-state 中引用为 classicMode 的取值，非独立 canonical 字段，需理解为 classicMode 的 media 分支 ✓
- **premium_blockbuster**：advanced-template-capability 中作为 advancedTags 示例，非 canonical 字段名，属能力标签 ✓

### [hidden 字段不存在]
无。disabled/hidden 引用的字段均存在：
- camera_language L2, L3 ✓
- pro_plus_motion ✓
- directorPack ✓
- lightingProfileIds ✓

### [advanced 字段未定义]
无。advancedTags（advanced_camera, advanced_lighting, director_preset, continuity, multi_object, cinematic_mode, drama_mode, anime_mode）均为策略标签，非规范字段，不要求在 normalized 中定义。

---

## 7. Prompt / Engine 接入检查

基于 `prompt-engine-inventory-full.md`。

### [prompt 字段缺失]
- **camera_language**：有 UI 和 marker，**未进入 prompt**（formatScenePrompt、compileV2、resolveSceneStrategy 均未使用）

### [engine 字段缺失]
- **payload.continuity**：applyPayloadToProject 未写入 project 顶层
- **directorPack**：模板 payload 未写入 director_pack marker（仅 UI 可设）
- **lightingPack**：模板 payload 未写入 lightingSetup/lightingProfiles（经 classic/director 间接）

### [rule 字段缺失]
- **applyMode**：layout_only / layout_plus_style / full_workflow 仅 UI，apply 逻辑未按 mode 区分

---

## 8. Template 系统可用性判断

### 是否可以冻结架构

**NO**

### 必须修复的项

1. **camera_language 接入 prompt**：在 formatScenePrompt / compileV2 / resolveSceneStrategy 中接入 camera_language 输出
2. **payload.continuity 写入 project**：applyPayloadToProject 时写入 project.continuity
3. **applyMode 区分**：按 layout_only / layout_plus_style / full_workflow 区分模板应用写入范围
4. **continuityId 双入口**：明确 continuityId 主入口为 Object Properties 或 Scenes，避免歧义

### 建议修复（非阻塞）

- directorPack / lightingPack 进 payload（当前可经 classic/director 间接）
- lightingProfiles 产品化（独立选择器）

---

## 9. 风险等级

**MEDIUM**

- 架构文档完整，字段、规则、spec、payload 定义清晰
- 存在 prompt/engine 接入缺口与 applyMode 未实现，影响功能完整性
- 无严重结构冲突或重复定义

---

## 10. 总结

### 当前系统是否可以进入 Template Workspace 开发阶段

**可以，但需在开发中补齐上述必须修复项。**

Template Workspace 的筛选、展示、应用流程可基于现有 index、payload、spec 开发；camera_language 接入 prompt、continuity 写入 project、applyMode 区分应在开发早期落地，以免后续返工。
