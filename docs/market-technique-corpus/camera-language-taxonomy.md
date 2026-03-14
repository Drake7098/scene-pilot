# 镜头语言分类学（Camera Language Taxonomy）

## 1. 大类定义

镜头语言是景别、角度、运动、光影、节奏组合而成的整体“电影感”风格标签。它高于单字段，用于快速表达“写实”“商业”“电影叙事”“悬疑”等高层意图。分三层：用户层（~10–12）、模板层（~25）、底层完整库（50+）。

## 2. 一级分类

- user_layer（用户可选风格）
- template_layer（模板自动带入，UI 隐藏）
- engine_layer（底层完整，engine/future pro 使用）

## 3. 用户层（Layer 1）

| canonical_id | zh_name | en_name | 别名 | 适用媒体 | 适用场景 | 主要效果 | 常见搭配 | Phase 1 |
|--------------|----------|----------|------|----------|----------|----------|----------|---------|
| realistic_restrained | 写实克制 | Restrained Realistic | documentary-like | hybrid | film/tv | narrative | shot, lighting | core_user |
| commercial_ad | 商业广告 | Commercial Ad | 商业感 | hybrid | commercial | product clarity | shot, lighting | core_user |
| cinematic_narrative | 电影叙事 | Cinematic Narrative | 电影感 | hybrid | film/tv | emotion | shot, lighting | core_user |
| dialogue_cover | 对话覆盖式 | Dialogue Cover | 对话感 | video | film/tv | narrative | shot, OTS | core_user |
| product_quality | 产品质感 | Product Quality | 产品感 | hybrid | commercial/product | product clarity | shot, lighting | core_user |
| social_direct | 社媒直给 | Social Direct | 社媒感 | hybrid | social | speed | shot | core_user |
| emotional_pressure | 情绪压迫 | Emotional Pressure | 戏剧感 | hybrid | film/tv | emotion | shot, lighting | core_user |
| suspense_atmosphere | 悬疑氛围 | Suspense Atmosphere | 悬疑感 | hybrid | film/suspense | tension | shot, lighting | core_user |
| anime_dramatic | 动漫戏剧化 | Anime Dramatic | 动漫感 | hybrid | anime | drama | shot, composition | core_user |
| premium_blockbuster | 高级大片感 | Premium Blockbuster | 大片感 | hybrid | film/commercial | spectacle | shot, lighting | core_user |

## 4. 模板层（Layer 2）- 映射到 Layer 1 显示

| canonical_id | zh_name | en_name | mapsToUser | 适用场景 | Phase 1 |
|--------------|----------|----------|------------|----------|---------|
| cinematic_soft | (电影柔和) | (Cinematic Soft) | cinematic_narrative | film | template_default |
| cinematic_dark | (电影暗调) | (Cinematic Dark) | cinematic_narrative | film | template_default |
| cinematic_wide | (电影宽幅) | (Cinematic Wide) | cinematic_narrative | film | template_default |
| ad_luxury | (广告奢感) | (Ad Luxury) | commercial_ad | commercial | template_default |
| ad_clean | (广告洁净) | (Ad Clean) | commercial_ad | commercial | template_default |
| drama_tension | (戏剧张力) | (Drama Tension) | emotional_pressure | film/tv | template_default |
| drama_close | (戏剧特写) | (Drama Close) | emotional_pressure | film | template_default |
| suspense_observe | (悬疑观察) | (Suspense Observe) | suspense_atmosphere | suspense | template_default |
| thriller_lowkey | (惊悚低调) | (Thriller Lowkey) | suspense_atmosphere | thriller | template_default |
| noir_shadow | (黑色电影) | (Noir Shadow) | suspense_atmosphere | noir | template_default |
| product_glossy | (产品光泽) | (Product Glossy) | product_quality | product | template_default |
| product_dark | (产品暗调) | (Product Dark) | product_quality | product | template_default |
| anime_dynamic | (动漫动态) | (Anime Dynamic) | anime_dramatic | anime | template_default |
| anime_pose | (动漫 pose) | (Anime Pose) | anime_dramatic | anime | template_default |
| anime_battle | (动漫战斗) | (Anime Battle) | anime_dramatic | anime | template_default |
| hero_entry | (英雄出场) | (Hero Entry) | premium_blockbuster | film | template_default |
| reveal_focus | (揭示聚焦) | (Reveal Focus) | cinematic_narrative | film | template_default |
| emotional_peak | (情绪巅峰) | (Emotional Peak) | emotional_pressure | film | template_default |
| handheld_real | (手持纪实) | (Handheld Real) | realistic_restrained | documentary | template_default |
| documentary | (纪录片) | (Documentary) | realistic_restrained | documentary | template_default |
| neon_city | (霓虹都市) | (Neon City) | social_direct | social | template_default |
| studio_highkey | (棚拍高调) | (Studio Highkey) | commercial_ad | commercial | template_default |
| studio_lowkey | (棚拍低调) | (Studio Lowkey) | commercial_ad | commercial | template_default |
| luxury_light | (奢华光感) | (Luxury Light) | premium_blockbuster | commercial | template_default |
| rim_light_focus | (边缘光聚焦) | (Rim Light Focus) | product_quality | product | template_default |

## 5. 底层完整库（Layer 3）- engine_only

扩展方向：horror_creep, vintage_film, vlog_casual, game_cinematic, music_video, fashion_editorial 等 30+ 项。Phase 1 不展开。

## 6. Phase 1 推荐收录级别

| 层级 | 数量 | 级别 |
|------|------|------|
| Layer 1 | 10 | core_user |
| Layer 2 | 25 | template_default |
| Layer 3 | 50+ | engine_only |
