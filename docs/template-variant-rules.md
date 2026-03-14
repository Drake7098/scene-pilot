# ScenePilotix 模板 Variant Rules

定义各 variant 允许、必须、禁止的字段，及默认 advancedTags、默认 sceneCount。

---

## Variant 列表

| variant | 说明 | cost |
|---------|------|------|
| free_starter | 免费起步版 | 0 |
| basic | 基础版（含 wide/medium/close/vertical/horizontal/social） | 3 |
| cinematic | 电影质感版 | 3 |
| multi_object | 多对象复杂版 | 5 |
| advanced_motion | 高级运镜版 | 5 |
| advanced_lighting | 高级光影版 | 5 |
| continuity | 连续性模板（多镜衔接） | 0/5 |
| anime | 动漫专属 | 0/5 |
| commercial | 商业/产品专属 | 3 |
| premium | 高端质感版 | 5 |

---

## 1. free_starter

### 允许哪些字段
- shot, movement
- time, keyDir, mood（基础 lighting）
- layers（objectType, look, composition）
- bg
- config（mediaMode, compiler）

### 必须包含
- shot
- layers（≥1）
- mediaType, storyPlan, ratio

### 禁止哪些字段
- cameraLanguage（L1 可空，L2 禁止）
- proMotion
- classicMode, directorPack
- lightingPack
- compositionPreset
- continuitySpec（entryDir, exitDir, transition）
- continuityId

### 默认 advancedTags
- （无）

### 默认 sceneCount
1

---

## 2. basic

### 允许哪些字段
- 同 free_starter
- + ratio 覆盖（16:9, 9:16, 1:1）
- + cameraLanguage L1（可选）

### 必须包含
- shot
- layers（≥1）
- mediaType, storyPlan, ratio

### 禁止哪些字段
- cameraLanguage L2
- proMotion（pro_plus 禁止）
- directorPack
- lightingPack
- compositionPreset（可 family 级开放基础项）
- continuitySpec
- continuityId

### 默认 advancedTags
- （无）

### 默认 sceneCount
1

---

## 3. cinematic

### 允许哪些字段
- 同 basic
- + cameraLanguage L2（cinematic_soft, cinematic_dark, cinematic_wide 等）

### 必须包含
- shot
- layers（≥1）
- cameraLanguage L2 至少其一（cinematic_*）

### 禁止哪些字段
- directorPack
- pro_plus_motion
- continuitySpec
- continuityId

### 默认 advancedTags
- cinematic_mode
- advanced_camera

### 默认 sceneCount
1

---

## 4. multi_object

### 允许哪些字段
- 同 basic
- + layers ≥2（多对象）
- + compositionPreset（含 left_right_standoff 等需 2+ 对象）

### 必须包含
- shot
- layers（≥2）
- mediaType, storyPlan, ratio

### 禁止哪些字段
- cameraLanguage L2
- pro_plus_motion
- directorPack
- lightingPack
- continuitySpec
- continuityId

### 默认 advancedTags
- multi_object

### 默认 sceneCount
1

---

## 5. advanced_motion

### 允许哪些字段
- 同 basic
- + proMotion（pro_basic, pro_plus）
- + cameraLanguage L2（hero_entry, drama_* 等）
- + directorPack（dialogue 类 family 可写）

### 必须包含
- shot
- layers（≥1）
- proMotion 或 cameraLanguage L2 至少其一

### 禁止哪些字段
- movement（有 proMotion 时自动禁用）
- continuitySpec, continuityId（非 continuity 时）

### 默认 advancedTags
- advanced_camera
- drama_mode
- director_preset（当 family=dialogue 时）

### 默认 sceneCount
1

---

## 6. advanced_lighting

### 允许哪些字段
- 同 basic
- + lightingPack（natural_skin_readability, low_key_edge_separation, premium_focal_highlights, noir_shadow, studio_highkey, ecommerce_white 等）

### 必须包含
- shot
- layers（≥1）
- lightingPack 至少其一

### 禁止哪些字段
- cameraLanguage L2
- pro_plus_motion
- directorPack
- continuitySpec
- continuityId

### 默认 advancedTags
- advanced_lighting

### 默认 sceneCount
1

---

## 7. continuity

### 允许哪些字段
- 同 basic
- + continuitySpec（entryDir, exitDir, inherit, transition）
- + continuityId（@continuityId）
- + sceneCount ≥2
- + directorPack, pro_plus_motion（非 starter 时）

### 必须包含
- continuity.enabled = true
- sceneCount ≥2
- entryDir, exitDir 至少其一
- continuityId 于需跨镜对象

### 禁止哪些字段
- 无额外禁止（在 continuity 域内按规则执行）

### 默认 advancedTags
- continuity
- multi_scene
- advanced_camera（非 starter 时）

### 默认 sceneCount
2～6（依 storyPlan）

---

## 8. anime

### 允许哪些字段
- 同 continuity 或 advanced_motion（依 domain）
- + cameraLanguage L2（anime_dynamic, anime_pose, anime_battle 等）
- + pro_plus_motion（battle 相关）
- + lightingPack（anime_high_contrast）

### 必须包含
- shot
- layers（≥1）
- 当 domain=anime_continuity 时：continuitySpec, continuityId

### 禁止哪些字段
- 无 anime 专属禁止

### 默认 advancedTags
- anime_mode
- advanced_camera
- continuity（当 domain=anime_continuity）

### 默认 sceneCount
1 或 2～6（ continuity 时）

---

## 9. commercial

### 允许哪些字段
- 同 basic
- + cameraLanguage L1（product_quality, commercial_ad）
- + compositionPreset（hero_center, glossy_detail, white_bg_ecommerce 等）
- + lightingPack（ecommerce_white, premium_focal_highlights）

### 必须包含
- shot
- layers（≥1，含 product 或 text）

### 禁止哪些字段
- cameraLanguage L2（非 cinematic 类）
- pro_plus_motion
- directorPack
- continuitySpec
- continuityId

### 默认 advancedTags
- （无，或 multi_object 当 layers≥2）

### 默认 sceneCount
1

---

## 10. premium

### 允许哪些字段
- 同 advanced_motion
- + advanced_lighting（lightingPack 扩展）
- + directorPack
- + cameraLanguage L2（premium_blockbuster, ad_luxury 等）

### 必须包含
- shot
- layers（≥1）
- 至少其一：cameraLanguage L2, pro_plus_motion, directorPack, lightingPack

### 禁止哪些字段
- 无（在高级能力白名单内均可）

### 默认 advancedTags
- advanced_camera
- advanced_lighting
- director_preset
- premium_blockbuster（若适用）

### 默认 sceneCount
1

---

## 汇总表

| variant | 允许 L2 | 允许 pro_plus | 允许 directorPack | 允许 lightingPack | 允许 continuity | 默认 sceneCount |
|---------|---------|---------------|-------------------|-------------------|-----------------|-----------------|
| free_starter | ✖ | ✖ | ✖ | ✖ | ✖ | 1 |
| basic | ✖ | ✖ | ✖ | ✖ | ✖ | 1 |
| cinematic | ✔ | ✖ | ✖ | ✖ | ✖ | 1 |
| multi_object | ✖ | ✖ | ✖ | ✖ | ✖ | 1 |
| advanced_motion | ✔ | ✔ | ✔* | ✖ | ✖ | 1 |
| advanced_lighting | ✖ | ✖ | ✖ | ✔ | ✖ | 1 |
| continuity | ✔* | ✔* | ✔* | ✖ | ✔ | 2～6 |
| anime | ✔ | ✔ | ✔* | ✔ | ✔* | 1 或 2～6 |
| commercial | ✖ | ✖ | ✖ | ✔ | ✖ | 1 |
| premium | ✔ | ✔ | ✔ | ✔ | ✖ | 1 |

* 依 family/domain 条件开放
