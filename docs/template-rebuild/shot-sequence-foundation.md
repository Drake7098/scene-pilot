# Shot Sequence Foundation

实现文件：

- `src/shot-model/sequence/types.ts`
- `src/shot-model/sequence/buildShotSequence.ts`

## Scope

本阶段只做最小结构，不做完整视频系统重构。

## Supported

- 3~5 个镜头节点（当前 builder 截断到最多 5）
- continuity carry-over：identity/camera/direction
- entry/exit direction
- motion relation：`hold | accelerate | decelerate | switch`
- shot duration 聚合

## Sequence Output

- `nodes`: 每镜头的时间、方向、相机、carry-over
- `edges`: 镜头间承接关系与动势关系
- `durationSec`: 序列总时长
- `entryDirection/exitDirection`: 序列级方向锚点
