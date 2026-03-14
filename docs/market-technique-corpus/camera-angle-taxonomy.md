# 镜头角度分类学（Camera Angle Taxonomy）

## 1. 大类定义

镜头角度是摄影机相对于主体的物理高度与方向，直接影响权力关系、情绪和空间感。低角度强化力量与压迫，高角度强化脆弱与观察感；正面/侧面/背面则影响观众与主体的心理距离。它是叙事语义的核心载体之一。

## 2. 一级分类

- angle_height（高度角：仰/平/俯）
- angle_direction（方向角：正面/侧面/背面）
- perspective（透视类型）

## 3. 二级手法项

| canonical_id | zh_name | en_name | 别名/近义词 | 一级分类 | 适用媒体 | 适用场景 | 主要效果 | 常见搭配 | 用户层 | 模板带入 | 隐藏 | 风险 |
|--------------|----------|----------|------------|----------|----------|----------|----------|----------|--------|----------|------|------|
| eye_level | 眼平视角 | Eye Level | neutral, 平视 | angle_height | hybrid | film/tv/commercial | narrative | shot, movement | ✔ | ✔ | - | - |
| low_angle | 低机位仰拍 | Low Angle | 仰拍, 英雄角 | angle_height | hybrid | film/tv | power, dominance | shot, lighting | ✔ | ✔ | - | 与 high_angle 互斥 |
| high_angle | 高机位俯拍 | High Angle | 俯拍 | angle_height | hybrid | film/tv | vulnerability | shot | ✔ | ✔ | - | 与 low_angle 互斥 |
| top_down | 顶拍 | Top Down | bird's eye, 鸟瞰 | angle_height | hybrid | product/social | structure, layout | composition | ✔ | ✔ | - | - |
| aerial_rise | 升空俯看 | Aerial Rise | 航拍上升 | angle_height | video | film/tv | epic, scale | movement | - | ✔ | ✔ | 仅 video |
| dutch_angle | 荷兰角 | Dutch Angle | canted | perspective | hybrid | suspense/anime | tension, disorientation | composition | - | - | ✔ | 易过度使用 |
| worm_eye | 虫眼视角 | Worm's Eye | 极低仰 | angle_height | hybrid | film/anime | extreme power | lighting | - | - | ✔ | 极端 |

## 4. Phase 1 推荐收录级别

| canonical_id | 级别 | 说明 |
|--------------|------|------|
| eye_level, low_angle, high_angle, top_down | core_user | 常用四档 |
| aerial_rise | template_default | 模板/高级模板 |
| dutch_angle, worm_eye | advanced_hidden | 高级/engine |
