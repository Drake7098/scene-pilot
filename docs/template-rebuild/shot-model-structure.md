# Shot Model Structure

## Core

新结构：`Template Fields -> Shot Model -> Visual Description -> Prompt Engine -> Final Prompt`

`ShotModel`（`src/shot-model/types.ts`）包含以下关系层，而不是字段平铺：

- `subject`: 主体节点 + 主次角色 + 主体关系边
- `action`: 主动作 + 辅助动作 + 被裁决动作
- `camera`: 景别/运动/转场 + hidden camera language/director pack/pro motion
- `composition`: 焦点策略 + 构图反规则
- `space`: 背景、进出方向、空间叙事、深度顺序
- `layer`: z 顺序与锚点摘要
- `lighting`: 时间/主光/氛围 + lighting profile cues
- `material`: 表面材质线索 + style cues
- `detail`: shotNote / sceneNotes / 局部提示词 / 参考链接
- `mood`: 情绪语气 + 动能级别
- `style`: image/video classic mode + image pro effects
- `semantic`: hard/soft constraints（裁决后）
- `motion`: static/kinetic + 路径摘要 + continuity hints
- `continuity`: carry-over 策略与 bridge
- `metadata`: consumed fields / unresolved fields / conflict decisions

## Capability Coverage

- 支持图像与视频：由 `context.mediaMode` 和 `camera/motion/continuity` 区分
- 支持单镜头与连续镜头：`context.shotPlan` + `continuity`
- 支持主次关系表达：`subject.primary/secondary/environment + relations`
