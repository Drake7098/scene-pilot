# Shot Presets

实现文件：`src/shot-model/presets/shotPresets.ts`

## Preset Role

`ShotPreset` 只定义镜头意图，不直接输出最终 prompt 文本。

## Benchmark Presets

1. 体育动作冻结镜头
- id: `sports_action_freeze`
- 核心：爆发动作冻结 + 可读肢体 + 高对比轮廓光

2. 广告级产品高光镜头
- id: `product_highlight_commercial`
- 核心：单主体产品 + 高光材质可读 + 商业展示效率

3. 电影级空间氛围镜头
- id: `cinematic_space_atmosphere`
- 核心：空间关系优先 + 慢速推进 + 连续性承接

## Guardrails

每个 preset 都含硬约束，如：
- 保持对象数量
- 禁止无关叠加文本
- 保持连续方向与身份稳定
