# ScenePilotix 高级模板能力策略

明确 5 credits 能力、高级模板定义、模板自动带入但不直接给用户选的能力、模板详情应显示的高级标签。

---

## 1. 5 Credits 能力定义

| 能力 | 说明 | 是否必含 |
|------|------|----------|
| **advanced_camera** | 隐藏镜头语言（L2）、高级运镜（pro_plus） | cost=5 时至少其一 |
| **continuity** | 多镜连续性、entryDir/exitDir、@continuityId | continuity 模板必含 |
| **director_preset** | directorPack 写入 | 可选 |
| **cinematic_mode** | camera_language 含 cinematic_* | variant=cinematic 时 |
| **drama_mode** | camera_language 含 drama_* 或 pro_plus 剧情向 | variant=advanced_motion 时 |
| **advanced_lighting** | lightingPack / lightingProfileIds 扩展 | 可选 |

**规则**：cost=5 的模板 **必须** 有 advancedTags 至少一项。

---

## 2. 高级模板定义

| 类型 | 条件 | 能力范围 |
|------|------|----------|
| **base 5 credits** | variant ∈ {multi_object, advanced_motion} 或 category=continuous | 可写 L2 camera_language, pro_plus_motion |
| **base free/basic** | variant ∈ {free_starter, basic_*} | 不可写 L2, directorPack, pro_plus |
| **continuity starter** | domain ∈ {webdrama, anime} 且 variant=starter | 仅 continuity 结构，无高级运镜/镜头 |
| **continuity 非 starter** | domain ∈ {webdrama, anime} 且 variant≠starter | 可写 L2, pro_plus, directorPack |

---

## 3. 模板自动带入但不直接给用户选的能力

| 能力 | 说明 | 用户见到 |
|------|------|----------|
| **camera_language L2** | 模板写入 cinematic_soft, hero_entry 等 | L1 映射标签（如「电影叙事」） |
| **directorPack** | 模板写入 director_pack: | 若 payload 支持则展示；当前 base 未写 |
| **lightingProfileIds** | 经 classic/director 带入 | 通过 classic/director 名称间接 |
| **pro_plus_motion** | 模板写入 pro_plus_motion | 高级运镜标签，用户可改 |
| **continuity 规则** | characterCarryOver, directionCarryOver 等 | 连续性视图摘要 |

**原则**：L2 不暴露 id；用户只能选 L1 或保持模板默认（显示 L1 映射）。

---

## 4. 模板详情应显示的高级标签

| 标签 ID | 显示名（zh/en） | 显示条件 |
|---------|-----------------|----------|
| advanced_camera | 高级镜头 | cost≥5 或 有 L2/pro_plus |
| advanced_lighting | 高级光影 | 有 lightingPack 扩展 |
| director_preset | 导演控制 | 有 directorPack |
| continuity | 连续模板 | domain∈{webdrama, anime} |
| multi_scene | 多分镜 | sceneCount≥2 |
| cinematic_mode | 电影模式 | variant=cinematic |
| drama_mode | 剧情模式 | variant=advanced_motion |
| anime_mode | 动漫模式 | domain=anime_continuity |

**实现**：TemplateIndex 需扩展 advancedTags 或等价字段；indexAdapter 从 UnifiedTemplate.advancedTags 映射。

---

## 5. 用户层 / 模板层 / 引擎层边界

| 层级 | 能力范围 | 用户可见 | 模板可写 |
|------|----------|----------|----------|
| **用户层** | L1 camera_language, classicMode, directorPack, pro_basic, movement, shot, lighting 基础 | ✔ | ✔ |
| **模板层** | L2 camera_language, directorPack, lightingPack, pro_plus | 仅映射显示 | ✔ |
| **引擎层** | L3 camera_language, directorInternalCues, 未展开 profile | ✖ | ✖ |

**边界规则**：
- 用户不可选 L2；用户选 L1 时清除 L2
- 模板不可写 L3
- 引擎可读全部，用于 prompt 编译
