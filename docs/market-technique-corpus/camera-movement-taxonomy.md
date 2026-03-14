# 镜头运动分类学（Camera Movement Taxonomy）

## 1. 大类定义

镜头运动描述摄影机在时间中的位移与变化，是视频区别于静态画面的核心维度。运动速度、方向、轨迹直接影响节奏、情绪和叙事焦点。与景别、角度结合后形成完整运镜语法。

## 2. 一级分类

- push_pull（推拉）
- pan_tilt（摇移）
- follow_orbit（跟拍/环绕）
- angle_height（升降）
- static（静止）

## 3. 二级手法项

基于 `proCameraPresets` 与行业标准整理。

| canonical_id | zh_name | en_name | 别名/近义词 | 一级分类 | 适用媒体 | 适用场景 | 主要效果 | 常见搭配 | 用户层 | 模板带入 | 隐藏 | 风险 |
|--------------|----------|----------|------------|----------|----------|----------|----------|----------|--------|----------|------|------|
| static | 静止机位 | Locked Static | locked-off | static | video | film/tv/commercial | stability | shot | ✔ | ✔ | - | - |
| slow_push_in | 缓慢推进 | Slow Push In | dolly in | push_pull | video | film/tv | emotion, focus | shot | ✔ | ✔ | - | - |
| slow_pull_out | 缓慢拉远 | Slow Pull Out | dolly out | push_pull | video | film/tv | reveal | shot | ✔ | ✔ | - | - |
| fast_push | 快速逼近 | Fast Push | 冲镜 | push_pull | video | film/social | impact | shot | ✔ | ✔ | - | - |
| fast_pull | 快速退出 | Fast Pull | 退镜 | push_pull | video | film | exposure | shot | - | ✔ | - | - |
| pan_left, pan_right | 摇镜 | Pan | 横摇 | pan_tilt | video | film/tv | reveal | shot | ✔ | ✔ | - | - |
| tilt_up, tilt_down | 俯仰摇镜 | Tilt | 纵摇 | pan_tilt | video | film/tv | reveal | shot | ✔ | ✔ | - | - |
| move_left, move_right | 平移 | Tracking | dolly lateral | pan_tilt | video | film/tv | follow | shot | ✔ | ✔ | - | - |
| follow_front | 正面跟拍 | Front Follow | - | follow_orbit | video | film/social | immersion | shot | ✔ | ✔ | - | - |
| follow_back | 尾随跟拍 | Back Follow | 背后跟 | follow_orbit | video | film | journey | shot | ✔ | ✔ | - | - |
| side_follow | 侧向跟拍 | Side Follow | - | follow_orbit | video | film | parallel | shot | ✔ | ✔ | - | - |
| orbit_left, orbit_right | 环绕 | Orbit | 360, 环绕 | follow_orbit | video | film/product | rotation | shot | ✔ | ✔ | - | - |
| handheld | 手持机感 | Handheld | 手持 | follow_orbit | video | film/social | documentary | shot | ✔ | ✔ | - | 与 static 互斥 |
| crane_up | 升镜 | Crane Rise | 升降 | angle_height | video | film | epic | shot | - | ✔ | ✔ | - |

## 4. Phase 1 推荐收录级别

| canonical_id | 级别 | 说明 |
|--------------|------|------|
| static, slow_push_in, slow_pull_out | core_user | 最常用 |
| pan_*, tilt_*, follow_*, orbit_*, handheld | core_user | 基础运镜 |
| fast_push, fast_pull | template_default | 模板带入 |
| crane_up | template_default / advanced_hidden | 高级模板 |
