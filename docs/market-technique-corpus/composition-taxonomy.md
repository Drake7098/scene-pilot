# 构图分类学（Composition Taxonomy）

## 1. 大类定义

构图是画面内主体、背景、前景的空间组织方式，决定视觉重心、节奏和情绪导向。与景别、角度协同，是“先结构后风格”的核心层。

## 2. 一级分类

- composition_type（构图类型）
- space_depth（空间层次）
- relation（关系表达）
- material_mood（材质/氛围）

## 3. 二级手法项（结合 ImageProEffects）

| canonical_id | zh_name | en_name | 一级分类 | 适用媒体 | 适用场景 | 主要效果 | Phase 1 |
|--------------|----------|----------|----------|----------|----------|----------|---------|
| center_pressure | 居中压迫 | Center Pressure | composition | hybrid | poster, product | focus | core_user |
| left_right_standoff | 左右对峙 | Left-Right Standoff | relation | hybrid | dialogue, tension | tension | core_user |
| foreground_occlusion | 前景遮挡 | Foreground Occlusion | space | hybrid | film | depth | template_default |
| environment_wrap | 环境包围 | Environment Wrap | space | hybrid | film | atmosphere | template_default |
| depth_split | 前后分离 | Depth Split | space | hybrid | film/product | clarity | core_user |
| clean_layering | 干净层次 | Clean Layering | space | hybrid | product | clarity | core_user |
| eyeline_tension | 视线张力 | Eyeline Tension | relation | hybrid | dialogue | relation | core_user |
| subject_env_link | 主体与环境呼应 | Subject-Environment Link | relation | hybrid | film | narrative | template_default |
| material_focus | 材质强调 | Material Focus | material | image | product | product clarity | core_user |
| glass_glow | 玻璃光感 | Glass Glow | material | image | product | premium | template_default |
| dream_haze | 梦境雾感 | Dream Haze | material | hybrid | dream | mood | template_default |
| silhouette_rim | 剪影边缘光 | Silhouette Rim | material | hybrid | portrait | mood | template_default |
| cinematic_air | 电影空气感 | Cinematic Air | material | hybrid | film | narrative | core_user |
| suspense_cold | 冷悬疑氛围 | Suspense Cold | material | hybrid | suspense | tension | template_default |
| symmetry | 对称构图 | Symmetry | composition | hybrid | commercial | order | core_user |
| rule_of_thirds | 三分法 | Rule of Thirds | composition | hybrid | general | balance | core_user |
| asymmetry | 不对称构图 | Asymmetry | composition | hybrid | film | dynamic | core_user |

## 4. Phase 1 推荐收录级别

| canonical_id | 级别 |
|--------------|------|
| center_pressure, depth_split, clean_layering, eyeline_tension, material_focus, cinematic_air, symmetry, rule_of_thirds | core_user |
| left_right_standoff, asymmetry | core_user |
| foreground_occlusion, environment_wrap, subject_env_link, glass_glow, dream_haze, silhouette_rim, suspense_cold | template_default |
