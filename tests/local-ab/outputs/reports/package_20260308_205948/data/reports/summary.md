# ScenePilotix 本地生成验证总结

## 测试背景
- 本轮是图片阶段（不含视频），对比 `plain prompt` 与 `ScenePilotix 产品真实导出 prompt`。
- Plain：Drake-DS 基于用户自然语言生成；Structured：ScenePilotix 导出链路（runPromptPipeline）。
- 工具分开统计：Draw Things 与 ComfyUI 不混算。

## Draw Things 最小验证结果
- 已评分样本：0
- 可用率：0
- 平均可用分：0

## ComfyUI 批量回归结果
- 已评分样本：4
- 可用率：0
- 平均可用分：0

## Plain vs Structured 对比
- Plain 可用率：0
- Structured 可用率：0
- Plain 平均可用分：0
- Structured 平均可用分：0

## 结论门槛（判定规则）
- structured usableRate 相对 plain 提升 >= 10%。
- Draw Things 与 ComfyUI 两侧都不为负提升。
- 提升不应只集中在 1-2 个 case。
- 多对象/复杂构图 case 应体现更明显优势。

## 提升最大的场景

## 仍不稳定的场景
- single_001

## 是否建议继续接外部 API
- 当前建议：先继续打磨本地 structured prompt，再考虑外部 API