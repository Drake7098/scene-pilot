# T1 Conflict Resolution Rules

## Priority Order

1. 主体语义
2. 镜头
3. 空间层级
4. 构图
5. 光线
6. 材质
7. 细节
8. 氛围

## Same-Class Conflicts

1. camera 类冲突：保留时间连续性最强的一条，另一条降级为补充描述。
2. space/layout 类冲突：保留锚点与主体关系，方向词按相对描述重写。
3. lighting 类冲突：保留主光方向和光质，氛围词下沉到 mood。
4. material/detail 类冲突：保留可验证材质特征，细节按镜头时长裁剪。

## Cross-Class Conflicts

1. 主体语义与风格冲突：主体语义优先，风格降权。
2. 镜头与姿态冲突：主体可读性优先，镜头角度做次优替换。
3. 空间与叙事冲突：叙事阶段优先，空间关系按阶段切片表达。

## Weak-Field Downgrade

1. enterPrompt=no 的字段默认降为 metadata，不直接写入主 prompt。
2. lossType=generalized 的字段进入 constrained line，避免语义漂移。
3. lossType=weakened 的字段以 key:value 结构化段输出，禁止口语化合并。

## Multi-Field Merge

1. 同维度多字段：先去重再按优先级输出。
2. 跨维度多字段：按 priority order 分段输出，禁止跨段混写。
3. 对冲突对先裁决后输出，不允许把冲突字段同时硬拼进同一句。

## Prompt Deconflict Policy

1. 先裁决、后编译：冲突字段先进入裁决器，再进入 prompt builder。
2. 保持显式分段：camera/composition/space/layer/lighting/material/detail/mood/style。
3. 仅实验模式启用本规则，不影响正式生成链路。
