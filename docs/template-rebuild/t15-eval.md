# T1.5 Control Evaluation

AB 测试数：8
平均提升比：0.71

## Metric Lift

| metric | totalDelta |
|---|---|
| spaceStability | 8 |
| compositionStability | 8 |
| subjectStability | 0 |
| layerStability | 8 |
| lightingStability | 8 |
| styleStability | 0 |
| detailConsistency | 8 |

## Top Improved Templates

1. exp_cam_comp_light_01 (ratio=0.71)
2. exp_space_layer_01 (ratio=0.71)
3. exp_material_detail_01 (ratio=0.71)

## Conclusion

1. 结构化分段对空间、构图、层级和细节一致性提升最明显。
2. baseline 在镜头与语义控制上可用，但跨维度控制显著弱于增强结构。
3. 高冲突字段需先裁决后输出，否则增强结构会把冲突显性化。
4. 本轮为实验链路，不影响正式 prompt builder。
5. 下一阶段可将冲突裁决器做成可插拔预处理层。
