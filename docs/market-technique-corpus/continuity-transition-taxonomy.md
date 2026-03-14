# 连续性与转场分类学（Continuity & Transition Taxonomy）

## 1. 大类定义

连续性描述多镜之间的时空、身份、方向继承；转场描述镜头切换方式。两者共同决定叙事节奏和观众认知负担，是视频多镜模式的核心维度。

## 2. 一级分类

- transition_type（转场类型）
- continuity_rule（连续性规则）
- direction_inheritance（方向继承）
- object_inheritance（对象继承）

## 3. 转场类型

| canonical_id | zh_name | en_name | 别名 | 适用 | 主要效果 | Phase 1 |
|--------------|----------|----------|------|------|----------|---------|
| cut | 切 | Cut | 硬切 | video | 节奏 | core_user |
| dissolve | 叠化 | Dissolve | 淡入淡出 | video | 时间过渡 | core_user |
| reverse_angle | 反打 | Reverse Angle | 同场景换向 | video | 对话 | core_user |
| camera_continues | 镜头连续 | Camera Continues | 单镜头推进 | video | 连贯 | template_default |
| time_jump | 时间跳切 | Time Jump | - | video | 时间推进 | template_default |
| match_cut | 匹配剪辑 | Match Cut | 动作/形状匹配 | video | 流畅 | template_default |
| same_space_shift | 同空间切换 | Same Space Shift | - | video | 节奏 | template_default |
| morph_cut | 形变转场 | Morph Cut | - | video | 超现实 | advanced_hidden |
| doorframe_wipe | 门框擦切 | Doorframe Wipe | - | video | 自然过渡 | advanced_hidden |
| light_dissolve | 光线溶解 | Light Dissolve | - | video | 情绪 | advanced_hidden |

## 4. 连续性规则

| canonical_id | zh_name | en_name | 说明 | Phase 1 |
|--------------|----------|----------|------|---------|
| character_carry_over | 角色延续 | Character Carry Over | 身份不变 | template_default |
| direction_carry_over | 方向延续 | Direction Carry Over | 入场/离场方向 | template_default |
| camera_carry_over | 镜头延续 | Camera Carry Over | 运动/景别延续 | template_default |
| bg_carry_over | 背景延续 | Background Carry Over | 环境延续 | template_default |
| identity_only | 仅身份 | Identity Only | 对象继承仅身份 | template_default |

## 5. 方向字段

| canonical_id | zh_name | en_name | 说明 | Phase 1 |
|--------------|----------|----------|------|---------|
| entry_dir | 入场方向 | Entry Direction | N/NE/E/SE/S/SW/W/NW | core_user |
| exit_dir | 离场方向 | Exit Direction | 同上 | core_user |
| inherit_from_previous | 继承上一镜 | Inherit From Previous | 是否继承 | core_user |

## 6. Phase 1 推荐收录级别

| 类型 | 级别 |
|------|------|
| cut, dissolve, reverse_angle | core_user |
| camera_continues, time_jump, match_cut, same_space_shift | template_default |
| morph_cut, doorframe_wipe, light_dissolve | advanced_hidden |
| 连续性规则 | template_default |
