# ScenePilotix Phase 1 模板编写规则

明确 Phase 1 模板 authoring 必须遵守的规则：规范字段架构、引擎编译、禁止随意新加自由字段、禁止高级隐藏能力直接暴露、禁止多入口。

---

## 1. 先用规范字段架构写模板

| 规则 | 说明 |
|------|------|
| **AUTH-001** | 模板 payload 必须只使用 `normalized-field-architecture-v1.md` 中定义的 canonical 字段 |
| **AUTH-002** | 不得新增未在规范架构中定义的字段 |
| **AUTH-003** | 字段值必须来自 `market-technique-corpus` 中定义的 canonical_id 或约定取值集 |

**示例**：shot 取值必须为 wide, medium, close, extreme_close, over_shoulder, pov, insert_closeup, establishing 等；不得用随意字符串。

---

## 2. 再由引擎编译

| 规则 | 说明 |
|------|------|
| **AUTH-004** | 模板 payload 经 `buildTemplatePayload` / `buildWebdramaPayload` / `buildAnimePayload` 产出 |
| **AUTH-005** | 产出 payload 经 `applyPayloadToProject` 或 `applyTemplateSnapshot` 应用 |
| **AUTH-006** | 应用后的 project 作为 prompt 编译输入，经 `generatePrompts` → `formatScenePrompt` / `compileV2` 生成 prompt |

**禁止**：在手写 payload 中嵌入 prompt 片段；prompt 必须由引擎从字段编译。

---

## 3. 不允许随意新加自由字段

| 规则 | 说明 |
|------|------|
| **AUTH-007** | 不得在 scene.notes 中写入未在 `phase-1-template-authoring-policy` 或 marker 规范中定义的 marker |
| **AUTH-008** | 不得在 layer 上增加未在 Object Layer 规范中定义的属性 |
| **AUTH-009** | 若需新字段，必须先更新 `normalized-field-architecture-v1.md` 再使用 |

**允许的 marker**：bg:, media:, @compiler:, director_pack:, video_classic_mode:, image_classic_mode:, image_pro_effects:, pro_basic_motion:, pro_plus_motion:, camera_language:, @continuityId:, @layoutlocked:1

---

## 4. 不允许高级隐藏能力直接暴露给普通用户

| 规则 | 说明 |
|------|------|
| **AUTH-010** | camera_language L2 的 raw id（如 cinematic_soft, hero_entry）不得出现在用户可编辑的 UI 选项列表中 |
| **AUTH-011** | 用户选镜头语言时，只能选 L1；模板写入 L2 时，用户看到 L1 映射标签 |
| **AUTH-012** | camera_language L3、directorInternalCues 等 engine_only 能力不得写入模板 payload |

---

## 5. 不允许一个字段多个入口

| 规则 | 说明 |
|------|------|
| **AUTH-013** | 每个 canonical 字段在模板 payload 中只能有一个写入来源 |
| **AUTH-014** | 例如：shot 只来自 scene.camera.shot，不得同时在 notes 中写 shot: 等冗余 |
| **AUTH-015** | 背景只来自 scene.notes 的 bg: 或 backgroundRef，不得多处冲突写入 |

---

## 6. 模板类型与能力白名单

| 模板类型 | 可写字段/能力 |
|----------|---------------|
| base free_starter | shot, movement, layers, lighting(time/keyDir/mood), config |
| base basic_* | 同上 + ratio 等 projectDefaults |
| base cinematic | + camera_language L2 (cinematic_soft) |
| base advanced_motion | + camera_language L2 (hero_entry) |
| base multi_object | + 多 layer |
| continuity starter | continuity 结构, entryDir, exitDir, @continuityId |
| continuity 非 starter | + L2, pro_plus, directorPack（按 variant 定义）|

---

## 7. 校验检查点

| 检查点 | 时机 | 内容 |
|--------|------|------|
| Payload 校验 | buildPayload 产出时 | 字段名、取值是否符合规范 |
| Apply 校验 | applyPayloadToProject 时 | 不写入未定义 project 字段 |
| Index 校验 | buildTemplateIndex 时 | cost=5 须有 advancedTags |

---

## 8. 违反后果

| 违反 | 处理 |
|------|------|
| 新加未定义字段 | 引擎忽略；或 build 时报错（若实现校验） |
| 高级能力直接暴露 | 产品验收不通过 |
| 多入口写入同一语义 | 以 single_source 为准；其他写入视为覆盖 |
