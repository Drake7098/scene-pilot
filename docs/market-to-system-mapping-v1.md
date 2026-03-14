# 行业手法 → 现有系统映射 v1

本文档交叉比对四类输入，明确行业拍摄手法在现有系统中的覆盖状态、入口、是否进 prompt/模板/规则，以及缺失与冲突项。

**输入文档**：
1. docs/pro-console-structure-baseline-part-1.md
2. docs/template-system-inventory-full.md
3. docs/prompt-engine-inventory-full.md
4. docs/market-technique-corpus/unified-technique-master.md

---

## 1. 总览

| 指标 | 数量 |
|------|------|
| **行业总手法数** | ~163（Phase 1 展开） |
| **当前系统已覆盖** | ~72 |
| **部分覆盖** | ~35 |
| **完全缺失** | ~48 |
| **重复/冲突风险** | ~8 |

**状态定义**：
- **已覆盖**：有 UI 入口 + 进 prompt
- **部分覆盖**：有 UI 或 marker，但未打通 prompt / 模板 / 规则中至少一环
- **缺失**：行业有，系统无
- **重复冲突**：多入口、语义重叠、互斥未定义

---

## 2. 按一级分类比对

### 2.1 Shot Size（景别）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| ecu | 极特写 | 已覆盖 | Sidebar shotOptions (extreme_close) | ✔ | ✔ | - | 已覆盖 |
| cu | 特写 | 已覆盖 | shotOptions (close) | ✔ | ✔ | - | 已覆盖 |
| mcu | 中近景 | 部分覆盖 | 无单独项，medium 覆盖 | ✔ | ✔ | - | 部分覆盖 |
| ms | 中景 | 已覆盖 | shotOptions (medium) | ✔ | ✔ | - | 已覆盖 |
| mls | 中远景 | 缺失 | 无 | ✔ | - | - | 缺失 |
| fs | 全景 | 部分覆盖 | 无单独项，wide 可能覆盖 | ✔ | ✔ | - | 部分覆盖 |
| ls | 远景 | 已覆盖 | shotOptions (wide) | ✔ | ✔ | - | 已覆盖 |
| xls | 极远景 | 已覆盖 | shotOptions (establishing) | ✔ | ✔ | - | 已覆盖 |
| insert_closeup | 插入特写 | 已覆盖 | shotOptions | ✔ | ✔ | - | 已覆盖 |
| over_shoulder | 过肩 | 已覆盖 | shotOptions | ✔ | ✔ | - | 已覆盖 |
| pov | 主观视角 | 已覆盖 | shotOptions | ✔ | ✔ | - | 已覆盖 |

### 2.2 Camera Angle（镜头角度）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| eye_level | 眼平 | 已覆盖 | proCameraPresets (angle_height) | ✔ | ✔ | - | 已覆盖 |
| low_angle | 低机位仰拍 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| high_angle | 高机位俯拍 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| top_down | 顶拍 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| aerial_rise | 升空俯看 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| dutch_angle | 荷兰角 | 部分覆盖 | shotOptions（与景别混入） | - | - | - | 重复冲突 |
| worm_eye | 虫眼 | 缺失 | 无 | - | - | - | 缺失 |

### 2.3 Camera Movement（镜头运动）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| static | 静止 | 已覆盖 | moveOptions / pro_basic_motion | ✔ | ✔ | - | 已覆盖 |
| slow_push_in | 缓慢推进 | 已覆盖 | moveOptions / pro_basic_motion | ✔ | ✔ | - | 已覆盖 |
| slow_pull_out | 缓慢拉远 | 已覆盖 | moveOptions / pro_basic_motion | ✔ | ✔ | - | 已覆盖 |
| fast_push, fast_pull | 快推/快拉 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| pan_*, tilt_* | 摇镜 | 已覆盖 | moveOptions / pro_basic_motion | ✔ | ✔ | - | 已覆盖 |
| move_left, move_right | 平移 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |
| follow_*, orbit_*, handheld | 跟拍/环绕/手持 | 已覆盖 | moveOptions / pro_basic_motion | ✔ | ✔ | - | 已覆盖 |
| crane_up | 升镜 | 已覆盖 | proCameraPresets | ✔ | ✔ | - | 已覆盖 |

**注**：有 pro_motion 时 camera.movement 被覆盖为空，存在 movement vs pro motion 冲突。

### 2.4 Camera Language（镜头语言）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| Layer 1（10 项） | 用户层风格 | marker_only | Sidebar camera_language | ✖ | 部分（仅 cinematic/advanced_motion） | - | **部分覆盖** |
| Layer 2（25 项） | 模板层风格 | marker_only | 模板写入 camera_language | ✖ | ✔（2 项：cinematic_soft, hero_entry） | - | **部分覆盖** |
| Layer 3（50+） | 底层库 | engine_only | 无 | - | - | - | engine_only |

**结论**：camera_language 有 UI 和 marker，**完全未进 prompt**，属于“看起来有，实际上没打通”。

### 2.5 Composition（构图）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| center_pressure | 居中压迫 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| left_right_standoff | 左右对峙 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| depth_split | 前后分离 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| clean_layering | 干净层次 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| eyeline_tension | 视线张力 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| material_focus | 材质强调 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| glass_glow | 玻璃光感 | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| dream_haze 等 | 其他 ImagePro | 已覆盖 | image_pro_effects | ✔ | - | - | 已覆盖 |
| symmetry | 对称 | 缺失 | 无 | - | - | - | 缺失 |
| rule_of_thirds | 三分法 | 缺失 | 无 | - | - | - | 缺失 |

### 2.6 Lighting（布光）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| time/key_dir/mood | 基础三件套 | 已覆盖 | Sidebar timeOptions/dirOptions/moodOptions | ✔ | ✔（多为空） | - | 已覆盖 |
| 6 个 lightingProfile | 布光方案 | 部分覆盖 | 经 classicMode/directorPack 间接 | ✔ | ✖ | - | 部分覆盖 |
| noir_shadow, studio_*, ecommerce_white 等 | 扩展方案 | 缺失 | 无独立选择器 | - | - | - | 缺失 |

**结论**：lightingProfiles 未产品化，仅经 classic/director 间接使用；lightingPack 未进 payload。

### 2.7 Continuity / Transition（连续性 / 转场）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| cut, reverse_angle, camera_continues, dissolve, time_jump | 基础转场 | 已覆盖 | transitionType | ✔ | ✔ | - | 已覆盖 |
| match_cut, same_space_shift | 扩展转场 | 已覆盖 | pro_plus_motion | ✔ | ✔ | - | 已覆盖 |
| morph_cut, doorframe_wipe, light_dissolve | 高级转场 | 已覆盖 | pro_plus_motion | ✔ | ✔ | - | 已覆盖 |
| entry_dir, exit_dir, inherit_from_previous | 方向/继承 | 已覆盖 | Continuity / Scene | ✔ | ✔ | - | 已覆盖 |
| character_carry_over 等 | 连续性规则 | 部分覆盖 | payload.continuity 有定义 | - | ✖ 未写 project | - | **部分覆盖** |

**结论**：payload.continuity 未写入 project，连续性逻辑依赖 scenes 内字段。

### 2.8 Commercial / Product（商业 / 产品）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| hero_center | 主图居中 | 已覆盖 | Image Classic (poster_center) + image_pro_effects | ✔ | ✔ | - | 已覆盖 |
| glossy_detail | 光泽细节 | 已覆盖 | image_pro_effects (material_focus, glass_glow) | ✔ | - | - | 已覆盖 |
| white_bg_ecommerce | 白底电商 | 缺失 | 无（模板 family 有 white_bg_product） | - | 间接 | - | 部分覆盖 |
| insert_closeup | 插入特写 | 已覆盖 | shotOptions | ✔ | ✔ | - | 已覆盖 |
| hero_floating | 悬浮主图 | 部分覆盖 | 模板 family (floating_product_showcase) | ✔ | ✔ | - | 已覆盖 |
| premium_spotlight | 高级聚光 | 部分覆盖 | lightingProfile + classic | ✔ | - | - | 部分覆盖 |
| cta_visual_close | CTA 收束 | 缺失 | 无 | - | - | - | 缺失 |
| packshot, in_hand_usage | 包装/手持 | 部分覆盖 | 模板 family | ✔ | ✔ | - | 已覆盖 |
| lifestyle_demo, app_ui_showcase | 生活方式/应用 | 部分覆盖 | 模板 family | ✔ | ✔ | - | 已覆盖 |
| product_compare, feature_breakdown | 对比/拆解 | 已覆盖 | 模板 family | ✔ | ✔ | - | 已覆盖 |

### 2.9 Anime / Animation（动漫 / 动画）

| canonical_id | 行业手法 | 当前系统状态 | 当前入口 | 是否进 prompt | 是否进模板 | 是否进规则 | 结论 |
|--------------|----------|--------------|----------|---------------|------------|------------|------|
| dramatic_pose | 戏剧性 pose | 部分覆盖 | camera_language (anime_dramatic) | ✖ | ✔ | - | 部分覆盖 |
| anime_hero_entry, hero_entry | 英雄出场 | 已覆盖 | template camera_language + Video Classic | ✔ | ✔ | - | 已覆盖 |
| battle_reveal, expression_shift 等 | 战斗/表情/冲击 | 部分覆盖 | pro_plus_motion + anime continuity 模板 | ✔ | ✔ | - | 部分覆盖 |
| manga_panel_rhythm | 漫画分镜节奏 | 缺失 | 无 | - | - | - | 缺失 |
| speed_line_equivalent | 速度线等效 | 缺失 | 无 | - | - | - | 缺失 |

---

## 3. 当前“看起来有，实际上没打通”的项

| 项目 | 现状 | 问题 |
|------|------|------|
| **camera_language** | 有 UI、有 marker、有 L1/L2 定义 | 未进 formatScenePrompt / compileV2 / resolveSceneStrategy，**完全不进 prompt** |
| **directorPack in payload** | director_pack 有 UI、进 prompt | 模板 payload 未写入；仅用户可设 |
| **lightingPack in payload** | lightingProfile 经 classic/director 间接 | 模板未显式写入 lightingSetup / lightingProfile |
| **payload.continuity to project** | continuity 在 payload 中定义 | applyPayloadToProject 未写入 project 顶层 |
| **applyMode** | 有 UI 三档 | 未按 layout_only / layout_plus_style / full_workflow 区分 apply 逻辑 |
| **movement vs pro motion** | 两者并存 | 有 pro_motion 时 movement 被置空，逻辑正确但易混淆；无 UI 提示 |
| **notes marker 过载** | 10+ marker 存于 notes | 承担 media, genmode, bg, camera_language, director_pack, video_classic_mode, image_classic_mode, image_pro_effects, pro_basic_motion, pro_plus_motion 等，维护负担大 |

---

## 4. 当前“重复 / 冲突 / 多入口”的项

| 维度 | 问题 | 入口 |
|------|------|------|
| **背景** | bg: marker vs 背景预设 vs backgroundRef | Scene Background 预设、自定义、参考图；notes 中 bg: |
| **导演/风格** | director_pack vs classic_mode vs camera_language | 三者并存，层级重叠，均写入 notes |
| **镜头** | shot + movement vs pro_basic_motion vs pro_plus_motion vs camera_language | 四层可同时生效，pro_motion 覆盖 movement，camera_language 未进 prompt |
| **对象内容** | notes vs externalPrompt vs look | 三者均可写对象描述，冲突规则有检测无执行 |
| **continuity** | project 无 continuity 对象 vs scenes 内 entryDir/exitDir/inheritFromPrevious | 视图有，payload 有，project 无顶层字段 |
| **平台导出** | prompt_only vs package vs scope | 多个概念交叉，PlatformModeViewModel 推导 |

---

## 5. 行业有但系统完全没有的项

### Phase 1 必补

| canonical_id | 行业手法 | 说明 |
|--------------|----------|------|
| camera_language 进 prompt | - | 将 camera_language 接入 formatScenePrompt / compileV2 |
| mcu, mls, fs 景别细化 | 中近景/中远景/全景 | 可选：或保持 medium/wide 覆盖 |
| symmetry, rule_of_thirds | 对称/三分法 | 构图基础项 |
| white_bg_ecommerce | 白底电商 | 独立 lighting/背景方案 |
| lightingProfile 独立选择器 | - | 不依赖 classic/director |
| payload.continuity → project | - | apply 时写入 project |
| applyMode 区分逻辑 | - | 按 mode 控制写入范围 |

### Phase 2 可补

| canonical_id | 说明 |
|--------------|------|
| cta_visual_close | CTA 视觉收束 |
| ecommerce_white, anime_high_contrast, neon_urban | 扩展 lighting 方案 |
| speed_line_equivalent | 动漫速度线等效 |
| manga_panel_rhythm | 漫画分镜节奏（advanced） |

### Phase 3 高级/隐藏

| canonical_id | 说明 |
|--------------|------|
| worm_eye | 虫眼视角 |
| Layer 3 camera_language | 底层完整库 50+ |

---

## 6. 行业有但应隐藏、不应给用户直接选的项

### advanced_hidden

| canonical_id | 说明 |
|--------------|------|
| dutch_angle | 作为 shot 混入易混淆，应归入 angle |
| worm_eye | 极端视角 |
| morph_cut, doorframe_wipe, light_dissolve | 已在 pro_plus，保持高级 |
| manga_panel_rhythm | 动漫高级 |
| crane_up | 可保留在 pro motion |
| xls | 可保留，establishing 已覆盖 |

### engine_only

| canonical_id | 说明 |
|--------------|------|
| camera_language Layer 3 全部 | 50+ 底层库 |
| 未展开的 lighting/composition 扩展 | 未来 engine 使用 |

---

## 输出摘要

### [行业总手法]

- Phase 1 展开：~163 项  
- 含 Layer 3：~213+ 项  

### [已覆盖]

- shot_size：ecu, cu, ms, ls, xls, insert_closeup, over_shoulder, pov  
- camera_angle：eye_level, low_angle, high_angle, top_down, aerial_rise  
- camera_movement：全部 18 项（含 pro motion）  
- composition：ImageProEffects 全部  
- lighting：time/key_dir/mood + 6 profiles（经 classic/director）  
- transition：cut, reverse_angle, camera_continues, dissolve, time_jump + pro_plus  
- continuity：entryDir, exitDir, inheritFromPrevious  
- commercial：hero_center, glossy_detail, packshot, product_compare 等  
- anime：hero_entry, 部分 battle/expression（经 pro motion + 模板）  

### [部分覆盖]

- camera_language：有 UI 和 marker，**未进 prompt**  
- mcu, mls, fs：无单独选项  
- lightingProfile：仅经 classic/director 间接  
- directorPack / lightingPack in payload：模板未写入  
- payload.continuity：未写 project  
- commercial：white_bg, cta_visual_close 等缺独立入口  
- anime：dramatic_pose 经 camera_language 间接  

### [完全缺失]

- camera_language 进 prompt  
- mls（中远景）单独选项  
- symmetry, rule_of_thirds  
- 独立 lightingProfile 选择器  
- cta_visual_close  
- speed_line_equivalent  
- manga_panel_rhythm  
- applyMode 区分逻辑  

### [重复冲突]

- 背景：预设 vs bg: vs backgroundRef  
- 导演/风格：director vs classic vs camera_language  
- 镜头：shot/movement vs pro_motion vs camera_language  
- dutch_angle：与景别混入  

### [Phase 1 必补]

1. camera_language 接入 prompt  
2. payload.continuity 写入 project  
3. applyMode 区分 apply 逻辑  
4. lightingProfile 独立选择器（或明确仅经 classic/director）  
5. 可选：mcu, mls, fs 景别细化；symmetry, rule_of_thirds  

### [必须隐藏]

- camera_language Layer 2（模板内使用，用户见 Layer 1 映射）  
- camera_language Layer 3 全部  
- dutch_angle, worm_eye（归入 angle 或隐藏）  
- morph_cut, doorframe_wipe, light_dissolve（保持 pro_plus）  
- manga_panel_rhythm  
