# 景别分类学（Shot Size Taxonomy）

## 1. 大类定义

景别是画面中主体与画面的比例关系，决定观众与主体的心理距离和叙事重点。它是影视/摄影语言的核心维度之一：不同景别承载不同信息密度和情绪强度，是构图、节奏、叙事重点的基础锚点。

## 2. 一级分类

- shot_size（景别）
- framing_depth（景深层级：前景/中景/后景）
- subject_scale（主体尺度）

## 3. 二级手法项

| canonical_id | zh_name | en_name | 别名/近义词 | 一级分类 | 适用媒体 | 适用场景 | 主要效果 | 常见搭配 | 用户层 | 模板带入 | 隐藏 | 风险 |
|--------------|----------|----------|------------|----------|----------|----------|----------|----------|--------|----------|------|------|
| ecu | 极特写 | Extreme Close-Up | macro, 微距 | shot_size | hybrid | film/tv/commercial | emotion, detail | lighting, movement | ✔ | ✔ | - | 与宽景冲突 |
| cu | 特写 | Close-Up | 近景（狭义） | shot_size | hybrid | film/tv/commercial | emotion, clarity | lighting, movement | ✔ | ✔ | - | - |
| mcu | 中近景 | Medium Close-Up | bust, 胸上 | shot_size | hybrid | film/tv/social | narrative, dialogue | shot, composition | ✔ | ✔ | - | - |
| ms | 中景 | Medium Shot | waist, 半身 | shot_size | hybrid | film/tv/social | narrative | shot, composition | ✔ | ✔ | - | - |
| mls | 中远景 | Medium Long Shot | 3/4, knee | shot_size | hybrid | film/tv | environment | composition | - | ✔ | - | - |
| fs | 全景 | Full Shot | full body | shot_size | hybrid | film/tv | scale, action | composition, lighting | ✔ | ✔ | - | - |
| ls | 远景 | Long Shot | wide, 广角 | shot_size | hybrid | film/tv | space, context | composition | ✔ | ✔ | - | - |
| xls | 极远景 | Extreme Long Shot | establishing | shot_size | hybrid | film/tv | scale, epic | lighting | - | ✔ | ✔ | 易与 movement 冲突 |
| insert_closeup | 插入特写 | Insert Close-Up | detail shot | shot_size | hybrid | commercial/product | product clarity | lighting, rim | ✔ | ✔ | - | - |
| over_shoulder | 过肩镜头 | Over-Shoulder | OTS | shot_size + angle | video | film/tv | dialogue, relation | reverse_angle | ✔ | ✔ | - | 需双主体 |
| pov | 主观视角 | POV | first-person | shot_size + angle | video | film/social | immersion | handheld | ✔ | ✔ | - | 易与 movement 混淆 |

## 4. Phase 1 推荐收录级别

| canonical_id | 级别 | 说明 |
|--------------|------|------|
| cu, mcu, ms, fs, ls | core_user | 用户必选景别 |
| ecu, insert_closeup | core_user | 产品/商业常用 |
| xls, mls | template_default | 模板带入，用户可改 |
| over_shoulder, pov | core_user | 对话/主观常用 |
