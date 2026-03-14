# ScenePilotix Phase 1 规则引擎矩阵 v1

基于规范字段架构，建立可执行的规则矩阵。目标：**从设计上防止乱改**，而非 endless warning。

---

## A. 字段互斥

### A1. proMotion vs basic movement

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-MUTEX-001 | proMotion vs movement | 有 pro_basic_motion 或 pro_plus_motion 时，**movement 自动置空且 UI 禁用** | resolveEffectiveMotion 已置空；UI 需禁用 movement 选择器 |
| R-MUTEX-001b | - | 用户清空 proMotion 时，movement 恢复可编辑 | 状态驱动 |

### A2. camera language 层级互斥

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-MUTEX-002 | L2 vs L1 | 模板写入 camera_language L2 时，**用户不可选 L1**；用户选 L1 时清除 L2 | 模板应用时写入 L2；用户选 L1 时存 L1，清除 L2 |
| R-MUTEX-002b | - | 用户选 L1 时，不自动写入 L2 | 单向：L2 仅模板带入 |

### A3. lightingPack vs raw lighting

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-MUTEX-003 | lightingPack vs time/keyDir/mood | **不互斥**；lightingPack 来自 classic/director 时，可覆盖或补充 time/keyDir/mood | classic/director 携带 lightingProfileIds；用户填 lighting 时优先 |
| R-MUTEX-003b | 独立 lightingPack 选择器 vs classic | 若 Phase 1 加独立 lightingPack，**与 classicMode 互斥**：选 classic 时用 classic 的 profile，不叠加 | 二选一 |

### A4. cameraTask vs transition

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-MUTEX-004 | 单镜 shotPlan vs 多镜 transition | shotPlan=single 时，**transition 无意义，不显示** | UI 条件渲染 |
| R-MUTEX-004b | 某些 pro_plus（如 dolly_zoom）vs transition | dolly_zoom 等与 cut 冲突，**自动禁选** | proPlusDisabledIds 已有；transition 侧可加规则 |

### A5. compositionPreset vs multi-object

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-MUTEX-005 | 单对象 template vs 多对象 image_pro_effects | base 单对象模板 + multi_object variant 时，**某些 compositionPreset 禁用**（如 left_right_standoff 需 2+ 对象） | 按 layer 数量禁选 |

---

## B. 层级互斥

### B1. 模板默认值 vs 用户覆盖

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-LAYER-001 | 模板写入 vs 用户编辑 | **不互斥**；模板写入后用户可覆盖。applyMode=layout_only 时，**部分字段禁止用户覆盖**（见 applyMode） | applyMode 控制可编辑范围 |
| R-LAYER-001b | 模板锁定字段 | Phase 1 无“锁定”；Phase 2 可加 template_locked 标记 | - |

### B2. scene strategy vs object-level free text

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-LAYER-002 | classic/director 已控光照 vs object notes 写光照词 | **冲突检测**（现有 conflictRules）；不自动禁止，**提示** | conflictRules.scene_bg_lighting_conflict |
| R-LAYER-002b | classic/director 已控 vs externalPrompt 写镜头/构图 | **警告**：对象局部提示词含全局词时 warning | conflictRules.layer_strategy_scope |

### B3. continuity vs 强制局部改写

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-LAYER-003 | continuity 模板 + 用户删 continuityId | **禁止**：有 @continuityId 的对象，**不可删除 continuityId**，除非用户明确“解除锚点”。continuityId 唯一入口为 Object Properties，Scene 禁止编辑 | UI 禁用解除 或 二次确认 |
| R-LAYER-003b | continuity 模板 + 用户改 entryDir/exitDir | **允许**，但可能导致 continuity 失效；可提示 | 允许，可选 warning |

### B4. platform mode vs 过强结构字段

| 规则 ID | 互斥对 | 行为 | 执行方式 |
|---------|--------|------|----------|
| R-LAYER-004 | prompt_only + 高 structureIntensity | **不互斥**；exportMethod 由 structureIntensity 推导，用户可改 | PlatformModeViewModel |
| R-LAYER-004b | 某些平台 + 过长 prompt | **预算裁剪**（已有 trimToBudget） | 非互斥，为适配 |

---

## C. 模板类型约束

### C1. base 模板不能开放的高级能力

| 规则 ID | 约束 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-TPL-001 | base 模板（domain=base） | **不可**写入 camera_language L2、directorPack、pro_plus_motion、lightingPack | 模板 payload 校验 |
| R-TPL-001b | base free_starter | 仅可写入 shot, movement, layers, lighting 基础；**不可**写入 L2 | register400 / buildPayload |

### C2. 5 credits 模板必须包含的能力标签

| 规则 ID | 约束 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-TPL-002 | cost=5 的模板 | **必须**有 advancedTags 至少其一：advanced_camera, continuity, director_preset, cinematic_mode, drama_mode | index 校验 / computeAdvancedTags |
| R-TPL-002b | - | 5 credits 模板 **可**写入 L2 camera_language, directorPack, pro_plus_motion | 模板 authoring 规则 |

### C3. continuity 模板必须具备的约束

| 规则 ID | 约束 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-TPL-003 | domain=webdrama_continuity | 必须有 continuity.enabled=true, scenes≥2, entryDir/exitDir, @continuityId | buildWebdramaPayload 强制 |
| R-TPL-003b | domain=anime_continuity | 同上 | buildAnimePayload 强制 |
| R-TPL-003c | continuity 应用后 | **必须**写入 project.continuity（Phase 1 必补） | applyPayloadToProject |

### C4. anime 模板允许的专属语法

| 规则 ID | 约束 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-TPL-004 | domain=anime_continuity | **可**使用 camera_language anime_*、pro_plus battle/anime 相关 | 模板 authoring 白名单 |
| R-TPL-004b | - | **可**使用 anime 专属 lightingProfile（若扩展） | - |

---

## D. 自动规范化

### D1. 有 pro motion 时 movement 自动禁用

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-001 | pro_basic_motion 或 pro_plus_motion 有值 | **movement 选择器禁用**；输出时 movement 不参与 | UI disabled；resolveEffectiveMotion 已处理 |

### D2. 有 L2 camera language 时 L1 不可选

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-002 | 模板写入 camera_language L2 | **用户看到 L1 映射标签（只读）**；用户点“自定义”时可选 L1，此时清除 L2 | UI：显示映射；编辑时清除 L2 |

### D3. continuity 模板下对象自动锁定

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-003 | 当前项目来自 continuity 模板 + 对象有 @continuityId | **layoutLocked 默认 true**；用户可解锁但给提示 | 模板应用时设置 |
| R-AUTO-003b | - | 有 continuityId 的对象 **不可删除**，仅可解除锚点 | UI 禁用删除 或 解除后允许 |

### D4. 平台模式变化时字段自动屏蔽

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-004 | mediaType=image | **movement、transition、entryDir、exitDir 不显示**（或折叠） | UI 条件渲染 |
| R-AUTO-004b | shotPlan=single | **transition、entryDir、exitDir、inheritFromPrevious 不显示** | UI 条件渲染 |

### D5. 用户选 L1 时清除 L2

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-005 | 用户在 camera_language 选择 L1 项 | **清除 L2 值**，写入 L1 | applyCameraLanguage 写 L1 |

### D6. 用户清空 pro motion 时恢复 movement

| 规则 ID | 触发 | 行为 | 执行方式 |
|---------|------|------|----------|
| R-AUTO-006 | pro_basic_motion 和 pro_plus_motion 均为空 | **movement 恢复可编辑** | 状态驱动 |

---

## 规则执行优先级

1. **互斥**：优先执行，直接禁用/清空  
2. **自动规范化**：状态变化时立即执行  
3. **层级互斥**：检测到冲突时警告，不强制（或可选强制）  
4. **模板类型约束**：模板 authoring / apply 时校验  

---

## 规则汇总表

| 类型 | 规则数 | 强制执行 | 提示 |
|------|--------|----------|------|
| 字段互斥 | 5 组 | R-MUTEX-001, 002, 004, 005 | - |
| 层级互斥 | 4 组 | R-LAYER-003（部分） | R-LAYER-002, 002b, 003b |
| 模板类型 | 4 组 | R-TPL-001~004 | - |
| 自动规范化 | 6 组 | 全部 | - |
