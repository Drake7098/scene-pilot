# 布光分类学（Lighting Taxonomy）

## 1. 大类定义

布光是时间、主光方向、氛围强度的组合，决定画面情绪、材质可读性和空间层次。不能只有 time/key_dir/mood 三个标量，需建立“方案库”：布光结构、氛围方案、商业布光、叙事布光、产品高光、轮廓分离、动漫高对比、低照度/noir/suspense/premium 等。

## 2. 一级分类

- time_of_day（时间氛围）
- key_direction（主光方向）
- mood（氛围强度）
- lighting_structure（布光结构）
- lighting_profile（布光方案）
- commercial_lighting（商业布光）
- narrative_lighting（叙事布光）
- anime_lighting（动漫布光）

## 3. 时间 / 主光 / 氛围（基础三件套）

| canonical_id | zh_name | en_name | 类型 | 适用 | Phase 1 |
|--------------|----------|----------|------|------|---------|
| day | 白天 | Day | time | hybrid | core_user |
| sunset | 日落 | Sunset | time | hybrid | core_user |
| golden_hour | 黄金时刻 | Golden Hour | time | hybrid | core_user |
| blue_hour | 蓝调时刻 | Blue Hour | time | hybrid | core_user |
| night | 夜晚 | Night | time | hybrid | core_user |
| top_left, top_right | 左上/右上主光 | Top Left/Right | key_dir | hybrid | core_user |
| backlight | 背光 | Backlight | key_dir | hybrid | core_user |
| rim_light | 轮廓光 | Rim Light | key_dir | hybrid | core_user |
| warm | 暖调 | Warm | mood | hybrid | core_user |
| cold | 冷调 | Cold | mood | hybrid | core_user |
| bright | 明亮 | Bright | mood | hybrid | core_user |
| cinematic | 电影感 | Cinematic | mood | hybrid | core_user |
| mysterious | 神秘 | Mysterious | mood | hybrid | core_user |

## 4. 布光方案库（Lighting Profiles）

| canonical_id | zh_name | en_name | 结构说明 | 适用场景 | Phase 1 |
|--------------|----------|----------|----------|----------|---------|
| natural_skin_readability | 自然皮肤可读 | Natural Skin Readability | 主光贴近皮肤，脸部可读 | dialogue, portrait | core_user |
| low_key_edge_separation | 低调边缘分离 | Low-Key Edge Separation | 低调对比，边缘可读 | suspense, noir | core_user |
| rim_scale_separation | 边缘光尺度分离 | Rim Scale Separation | 轮廓光拉开主体与环境 | product, epic | core_user |
| action_path_readability | 动作路径可读 | Action Path Readability | 光服务动作方向 | video, chase | template_default |
| soft_layered_breathing | 柔和层次呼吸感 | Soft Layered Breathing | 柔和分层，留白 | dream, portrait | core_user |
| premium_focal_highlights | 高级焦点高光 | Premium Focal Highlights | 主光服务卖点 | commercial, product | core_user |
| noir_shadow | 黑色电影暗调 | Noir Shadow | 强阴影，压黑 | noir, suspense | template_default |
| studio_highkey | 棚拍高调 | Studio Highkey | 平光，少阴影 | commercial, product | template_default |
| studio_lowkey | 棚拍低调 | Studio Lowkey | 主光明确，阴影结构 | portrait, product | template_default |
| ecommerce_white | 电商白底 | E-Commerce White | 纯白背景，均匀光 | product | template_default |
| anime_high_contrast | 动漫高对比 | Anime High Contrast | 强对比，清晰边缘 | anime | template_default |
| neon_urban | 霓虹都市 | Neon Urban | 霓虹色光，城市感 | social | template_default |

## 5. Phase 1 推荐收录级别

| 类型 | 数量 | 级别 |
|------|------|------|
| time/key_dir/mood | 15 | core_user |
| lighting_profile | 6 | core_user（现有 6 个） |
| 扩展方案 | 6 | template_default |
