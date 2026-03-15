# 导演控制 / 镜头控制 / 光与氛围 — 字段清单（含隐藏与未公开）

以下为侧栏三个模块的全部字段，包括 UI 可见、隐藏、以及存在 `scene.notes` 中的未公开设置。

---

## 一、导演控制（Director Control）

### 1. 可见字段（Sidebar UI）

| 字段 key | 中文标签 | 英文标签 | 存储位置 | 可选值 / 说明 |
|----------|----------|----------|----------|----------------|
| `entryDir` | 入镜方向 | Entry | `scene.entryDir` | 仅当 `projectShotPlan === "continuous"` 时显示。空串 = 自动；或 `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` |
| `exitDir` | 出镜方向 | Exit | `scene.exitDir` | 同上 |
| `inheritFromPrevious` | 对象继承 | Inherit Objects | `scene.inheritFromPrevious` | 仅当视频且 `projectShotPlan !== "single"`。`true`=开启, `false`=关闭；continuous 时强制 true 且禁用 |
| 导演预设 | 导演预设 | Director Preset | 见下「导演预设」 | 视频用 `video_classic_mode:`，图片用 `image_classic_mode:`，存于 `scene.notes` |
| 导演级风格包 | 导演级风格包 | Directing Pack | `scene.notes` marker `director_pack:` | 见「导演级风格包可选值」 |

### 2. 导演预设 — 视频（Video Classic Mode）

- **Marker**: `video_classic_mode:`（存于 `scene.notes`）
- **可选 id 列表**（`VIDEO_CLASSIC_MODES`）：

| id | 中文名 | 英文名 |
|----|--------|--------|
| `steady_dialogue` | 平稳对话 | Steady Dialogue |
| `emotion_push` | 情绪逼近 | Emotion Push |
| `suspense_watch` | 悬疑窥视 | Suspense Watch |
| `hero_entry` | 英雄出场 | Hero Entry |
| `dream_memory` | 梦境回忆 | Dream Memory |
| `truth_reveal` | 顿悟真相 | Truth Reveal |
| `premium_commercial` | 高级广告质感 | Premium Commercial |
| `character_trail` | 人物尾随 | Character Trail |
| `rhythm_transition` | 节奏转场 | Rhythm Transition |
| `relationship_standoff` | 关系对峙 | Relationship Standoff |
| `first_person_impact` | 第一人称冲击 | First-Person Impact |
| `mystery_reveal` | 神秘揭示 | Mystery Reveal |

- UI 还会显示「未选择」「手动设置」（当已手动改景别/运动/专业运镜时）。

### 3. 导演预设 — 图片（Image Classic Mode）

- **Marker**: `image_classic_mode:`（存于 `scene.notes`）
- **可选 id 列表**（`IMAGE_CLASSIC_MODES`）：

| id | 中文名 | 英文名 |
|----|--------|--------|
| `poster_center` | 海报式中心主体 | Poster Center |
| `premium_product` | 高级产品质感 | Premium Product |
| `duo_tension` | 双人关系张力 | Duo Tension |
| `lonely_env` | 孤独环境感 | Lonely Environment |
| `cinematic_still` | 电影剧照感 | Cinematic Still |
| `dream_portrait` | 梦境肖像 | Dream Portrait |

### 4. 导演级风格包（Directing Pack）

- **Marker**: `director_pack:`（存于 `scene.notes`）
- **类型**: `DirectorStylePackId`

| id | 中文名 | 英文名 |
|----|--------|--------|
| （空） | 自动 | Auto |
| `architectural_tension` | 建筑悬疑 | Architectural Tension |
| `intimate_observation` | 贴身观察 | Intimate Observation |
| `industrial_epic` | 工业史诗 | Industrial Epic |
| `kinetic_pursuit` | 高速追踪 | Kinetic Pursuit |
| `poetic_restraint` | 诗性克制 | Poetic Restraint |
| `commercial_spectacle` | 商业大片 | Commercial Spectacle |

---

## 二、镜头控制（Camera & Lighting）

### 1. 可见字段

| 字段 key | 中文标签 | 英文标签 | 存储位置 | 可选值 / 说明 |
|----------|----------|----------|----------|----------------|
| 景别 | 景别 / 构图景别 | Shot / Framing | `scene.camera.shot` | 见「景别可选值」 |
| 运动 | 运动 | Movement | `scene.camera.movement` | 仅视频；见「运动可选值」 |
| 镜头语言 | 镜头语言 | Camera Language | `scene.notes` marker `camera_language:` | 见「镜头语言 Layer1 用户可见」 |
| 画面语言 | 画面语言 | Visual Language | `scene.notes` marker `image_pro_effects:` | 仅图片项目；为图片 Pro 效果多选，见「画面语言（Image Pro Effects）」 |
| 衔接方式 | 衔接方式 | Transition | `scene.transitionType` | 仅视频且 `projectShotPlan !== "single"`；见「衔接方式」 |

### 2. 景别（Shot）

- **存储**: `scene.camera.shot`
- **可选 value**（`shotOptions`）：

| value | 中文 | 英文 |
|-------|------|------|
| （空） | （未选择） | (unset) |
| `wide` | 全景 | Wide |
| `medium` | 中景 | Medium |
| `close` | 特写 | Close |
| `extreme_close` | 大特写 | Extreme Close |
| `over_shoulder` | 过肩镜头 | Over-Shoulder |
| `pov` | 主观视角 (POV) | POV |
| `insert_closeup` | 插入特写 | Insert close-up |
| `establishing` | 建立镜头 | Establishing shot |
| `dutch_angle` | 倾斜镜头 | Dutch Angle |

### 3. 运动（Movement，仅视频）

- **存储**: `scene.camera.movement`

| value | 中文 | 英文 |
|-------|------|------|
| （空） | （未选择） | (unset) |
| `static` | 固定 | Static |
| `slow_push_in` | 缓慢推近 | Push In |
| `slow_pull_out` | 缓慢拉远 | Pull Out |
| `pan_left` | 左移 | Pan Left |
| `pan_right` | 右移 | Pan Right |
| `tilt_up` | 上摇 | Tilt Up |
| `tilt_down` | 下摇 | Tilt Down |
| `handheld` | 手持 | Handheld |
| `orbit` | 环绕 | Orbit |

### 4. 镜头语言（Camera Language）

- **Marker**: `camera_language:`（存于 `scene.notes`）
- **用户可见（Layer 1）** — 侧栏下拉仅展示以下 10 个：

| id | 中文 | 英文 |
|----|------|------|
| `realistic_restrained` | 写实克制 | Restrained Realistic |
| `commercial_ad` | 商业广告 | Commercial Ad |
| `cinematic_narrative` | 电影叙事 | Cinematic Narrative |
| `dialogue_cover` | 对话覆盖式 | Dialogue Cover |
| `product_quality` | 产品质感 | Product Quality |
| `social_direct` | 社媒直给 | Social Direct |
| `emotional_pressure` | 情绪压迫 | Emotional Pressure |
| `suspense_atmosphere` | 悬疑氛围 | Suspense Atmosphere |
| `anime_dramatic` | 动漫戏剧化 | Anime Dramatic |
| `premium_blockbuster` | 高级大片感 | Premium Blockbuster |

- **隐藏（Layer 2 模板用）** — UI 不可选，仅模板/引擎使用，显示时会映射到 Layer 1：

| id | 中文 | 英文 | 映射到用户层 |
|----|------|------|--------------|
| `cinematic_soft` | (电影柔和) | (Cinematic Soft) | cinematic_narrative |
| `cinematic_dark` | (电影暗调) | (Cinematic Dark) | cinematic_narrative |
| `cinematic_wide` | (电影宽幅) | (Cinematic Wide) | cinematic_narrative |
| `ad_luxury` | (广告奢感) | (Ad Luxury) | commercial_ad |
| `ad_clean` | (广告洁净) | (Ad Clean) | commercial_ad |
| `drama_tension` | (戏剧张力) | (Drama Tension) | emotional_pressure |
| `drama_close` | (戏剧特写) | (Drama Close) | emotional_pressure |
| `suspense_observe` | (悬疑观察) | (Suspense Observe) | suspense_atmosphere |
| `thriller_lowkey` | (惊悚低调) | (Thriller Lowkey) | suspense_atmosphere |
| `noir_shadow` | (黑色电影) | (Noir Shadow) | suspense_atmosphere |
| `product_glossy` | (产品光泽) | (Product Glossy) | product_quality |
| `product_dark` | (产品暗调) | (Product Dark) | product_quality |
| `anime_dynamic` | (动漫动态) | (Anime Dynamic) | anime_dramatic |
| `anime_pose` | (动漫pose) | (Anime Pose) | anime_dramatic |
| `anime_battle` | (动漫战斗) | (Anime Battle) | anime_dramatic |
| `hero_entry` | (英雄出场) | (Hero Entry) | premium_blockbuster |
| `reveal_focus` | (揭示聚焦) | (Reveal Focus) | cinematic_narrative |
| `emotional_peak` | (情绪巅峰) | (Emotional Peak) | emotional_pressure |
| `handheld_real` | (手持纪实) | (Handheld Real) | realistic_restrained |
| `documentary` | (纪录片) | (Documentary) | realistic_restrained |
| `neon_city` | (霓虹都市) | (Neon City) | social_direct |
| `studio_highkey` | (棚拍高调) | (Studio Highkey) | commercial_ad |
| `studio_lowkey` | (棚拍低调) | (Studio Lowkey) | commercial_ad |
| `luxury_light` | (奢华光感) | (Luxury Light) | premium_blockbuster |
| `rim_light_focus` | (边缘光聚焦) | (Rim Light Focus) | product_quality |

### 5. 画面语言（图片项目，Image Pro Effects）

- **Marker**: `image_pro_effects:`（存于 `scene.notes`），值为 id 列表（如 `center_pressure,clean_layering`）
- **分类**: composition / relation / space / material / mood
- **全部 effect id**（`IMAGE_PRO_EFFECTS`）：

| id | 中文 | 英文 | 分类 |
|----|------|------|------|
| `center_pressure` | 居中压迫 | Center Pressure | composition |
| `left_right_standoff` | 左右对峙 | Left-Right Standoff | composition |
| `foreground_occlusion` | 前景遮挡 | Foreground Occlusion | space |
| `environment_wrap` | 环境包围 | Environment Wrap | space |
| `depth_split` | 前后分离 | Depth Split | space |
| `clean_layering` | 干净层次 | Clean Layering | space |
| `eyeline_tension` | 视线张力 | Eyeline Tension | relation |
| `subject_env_link` | 主体与环境呼应 | Subject-Environment Link | relation |
| `material_focus` | 材质强调 | Material Focus | material |
| `glass_glow` | 玻璃光感 | Glass Glow | material |
| `dream_haze` | 梦境雾感 | Dream Haze | mood |
| `silhouette_rim` | 剪影边缘光 | Silhouette Rim | mood |
| `cinematic_air` | 电影空气感 | Cinematic Air | mood |
| `suspense_cold` | 冷悬疑氛围 | Cold Suspense | mood |

### 6. 衔接方式（Transition）

- **存储**: `scene.transitionType`
- **类型**: `TransitionType`

| value | 中文 | 英文 |
|-------|------|------|
| `cut` | 切换 (cut) | Cut |
| `reverse_angle` | 反打 (reverse angle) | Reverse angle |
| `camera_continues` | 连续推进 (camera continues) | Camera continues |
| `dissolve` | 叠化 (dissolve) | Dissolve |
| `time_jump` | 时间跳转 (time jump) | Time jump |

### 7. 镜头隐藏字段（未在侧栏编辑）

- **`scene.camera.keyframes`**: 数组 `{ t: 0|1, x, y, zoom, rot }[]`，一般仅 t=0、t=1 两个关键帧，用于引擎/画布，侧栏不暴露编辑。

---

## 三、光与氛围（Lighting / Atmosphere）

### 1. 可见字段

| 字段 key | 中文标签 | 英文标签 | 存储位置 | 可选值 |
|----------|----------|----------|----------|--------|
| `lighting.time` | 时间段 | Time | `scene.lighting.time` | 见「时间段」 |
| `lighting.key_dir` | 主光方向 | Key Dir | `scene.lighting.key_dir` | 见「主光方向」 |
| `lighting.mood` | 氛围 | Mood | `scene.lighting.mood` | 见「氛围」 |

### 2. 时间段（Time）

| value | 中文 | 英文 |
|-------|------|------|
| （空） | （未选择） | (unset) |
| `day` | 白天 | Day |
| `dawn` | 黎明 | Dawn |
| `sunset` | 黄昏 | Sunset |
| `golden_hour` | 金色时刻 | Golden Hour |
| `blue_hour` | 蓝调时刻 | Blue Hour |
| `night` | 夜晚 | Night |

### 3. 主光方向（Key Dir）

| value | 中文 | 英文 |
|-------|------|------|
| （空） | （未选择） | (unset) |
| `top_left` | 左上 | Top Left |
| `top_right` | 右上 | Top Right |
| `bottom_left` | 左下 | Bottom Left |
| `bottom_right` | 右下 | Bottom Right |
| `backlight` | 逆光 | Backlight |
| `rim_light` | 轮廓光 | Rim Light |

### 4. 氛围（Mood）

| value | 中文 | 英文 |
|-------|------|------|
| （空） | （未选择） | (unset) |
| `cinematic` | 电影感 | Cinematic |
| `mysterious` | 神秘 | Mysterious |
| `bright` | 明亮 | Bright |
| `dark` | 阴沉 | Dark |
| `noir` | 黑色电影 | Noir |
| `warm` | 暖色 | Warm |
| `cold` | 冷色 | Cold |

---

## 四、scene.notes 中的未公开 / 隐藏 Marker（全模块共用）

以下为写在 `scene.notes` 里的标记，部分由 UI 间接写入，部分仅由模板/引擎写入，侧栏无单独控件。

| Marker | 含义 | 可选值 / 说明 |
|--------|------|----------------|
| `media:` | 媒体模式 | `image` \| `video` |
| `@compiler:` | 编译器 | `v1` \| `v2` |
| `@scene_tier:` | 场景级别 | `indoor` \| `small_plaza` \| `open_space` |
| `@v2_mode:` | V2 模式 | `strict` \| `short` |
| `stability:` | 稳定性层 | `off` \| `standard` \| `strict` |
| `genmode:` | 生成模式 | 如 `pro`，用于引擎路由 |
| `bg:` | 背景描述（隐藏） | 自由文本，用于提示词背景行 |
| `director_pack:` | 导演级风格包 | 见上文 DirectorStylePackId |
| `video_classic_mode:` | 视频导演预设 | 见上文 VIDEO_CLASSIC_MODES id |
| `image_classic_mode:` | 图片导演预设 | 见上文 IMAGE_CLASSIC_MODES id |
| `camera_language:` | 镜头语言 | 见上文 Layer1/Layer2 id |
| `image_pro_effects:` | 图片画面语言 | id 逗号分隔列表 |
| 专业运镜（视频） | 已从侧栏移除 | 原存于 `scene.notes` 的 Pro Motion 选择，由 `parseProMotionSelection` 等解析 |

---

## 五、scene.config（未在侧栏暴露）

- **存储**: `scene.config`（也可由 notes marker 解析得到，见 `resolveSceneConfig`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `mediaMode` | `image` \| `video` | 媒体模式 |
| `compiler` | `v1` \| `v2` | 编译器 |
| `sceneTier` | `indoor` \| `small_plaza` \| `open_space` | 场景级别 |
| `v2Mode` | `strict` \| `short` | V2 提示词模式 |
| `stability` | `off` \| `standard` \| `strict` | 稳定性 |

---

## 六、数据源与代码位置

- 导演控制 / 镜头控制 / 光与氛围 UI：`src/components/Sidebar.tsx`
- 景别/运动/时间/主光/氛围选项与 i18n：`src/components/Sidebar.tsx`（shotOptions, moveOptions, timeOptions, dirOptions, moodOptions）、`src/i18n.ts`（camera.*, lighting.*, opt.*）
- 导演预设与风格包：`src/content/proCreativeModes.ts`（VIDEO_CLASSIC_MODES, IMAGE_CLASSIC_MODES）、`src/content/directorStylePacks.ts`（DIRECTOR_STYLE_PACKS）
- 镜头语言（含 Layer2 隐藏）：`src/content/cameraLanguageLayers.ts`
- 画面语言：`src/content/proCreativeModes.ts`（IMAGE_PRO_EFFECTS, IMAGE_PRO_CATEGORIES）
- scene 模型与 config/marker 解析：`src/model.ts`（Scene, Camera, Lighting, resolveSceneConfig, withSceneConfig）
- 策略与默认值：`src/utils/sceneStrategyResolver.ts`（resolveSceneStrategy）
