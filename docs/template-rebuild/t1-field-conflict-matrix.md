# T1 Field Conflict Matrix

冲突对数量：24

| fieldA | fieldB | conflictType | conflictReason | severity | canCoexist | resolutionRule | priorityField | fallbackStrategy | notes |
|---|---|---|---|---|---|---|---|---|---|
| cameraCarryOver | entryDirection | 镜头冲突 | 镜头延续方向与空间入场方向冲突 | high | yes | 以镜头主叙事为主，重写空间方向词 | cameraCarryOver | 降级 entryDirection 为相对方位 | experimental-only |
| cameraCarryOver | exitDirection | 镜头冲突 | 镜头推进与退场方向冲突 | high | yes | 保留镜头运动，退场词转为补充句 | cameraCarryOver | exitDirection 移到 details | experimental-only |
| entryDirection | exitDirection | 空间冲突 | 入场与离场同一时刻指向矛盾 | high | no | 按时间先后拆分句段 | entryDirection | 将 exitDirection 绑定后续动作 | experimental-only |
| objectInheritance | objects | 语义冲突 | 继承对象与显式对象定义不一致 | high | yes | 显式对象优先 | objects | 继承字段只补缺失属性 | experimental-only |
| storyPlan | sceneDurations | 语义冲突 | 叙事节奏与时长分配矛盾 | medium | yes | 时长服从关键剧情节点 | storyPlan | 压缩非关键段时长 | experimental-only |
| referencePolicy | localRefs | 构图冲突 | 外部参考策略与本地参考冲突 | medium | yes | 同类来源合并，保留置信更高来源 | referencePolicy | localRefs 仅补充材质 | experimental-only |
| keyframes | sceneDurations | 镜头冲突 | 关键帧密度与总时长不匹配 | high | yes | 按时长重采样关键帧 | sceneDurations | 低权重关键帧合并 | experimental-only |
| bgCarryOver | objects | 空间冲突 | 背景延续与对象重定位冲突 | medium | yes | 对象重定位优先，背景降级为风格描述 | objects | 保留背景色调不保留坐标 | experimental-only |
| directionCarryOver | pose | 姿态冲突 | 动作方向与姿态方向冲突 | high | yes | 动作语义优先 | pose | directionCarryOver 改为镜头运动 | experimental-only |
| material | style | 风格冲突 | 材质真实感与风格化程度冲突 | medium | yes | 保留材质约束，风格降抽象度 | material | style 添加兼容限定词 | experimental-only |
| semantic | objects | 语义冲突 | 抽象语义与对象语义不一致 | high | yes | 对象语义锚定优先 | objects | semantic 转氛围词 | experimental-only |
| projectDefaults | storyPlan | 语义冲突 | 项目默认策略与叙事策略冲突 | medium | yes | 叙事策略优先 | storyPlan | projectDefaults 仅保留非冲突项 | experimental-only |
| referenceSlots | objects | 构图冲突 | 参考槽位与对象数量不匹配 | medium | yes | 对象主数量优先 | objects | 自动裁剪 referenceSlots | experimental-only |
| characterCarryOver | objects | 语义冲突 | 角色延续与当前对象列表不一致 | high | yes | 当前对象列表优先 | objects | 角色延续转 continuity 注释 | experimental-only |
| localRefs | referenceSlots | 材质冲突 | 参考来源重复导致材质过拟合 | low | yes | 去重后按优先级拼接 | referenceSlots | localRefs 仅保留 top1 | experimental-only |
| material | lighting | 光线冲突 | 高反材质与漫反射布光矛盾 | medium | yes | 材质物理性质优先 | material | 光线词降级到氛围 | experimental-only |
| pose | cameraCarryOver | 镜头冲突 | 姿态主体方向与镜头角度冲突 | medium | yes | 主体可读性优先 | pose | 镜头角度改为次优角 | experimental-only |
| bgCarryOver | storyPlan | 语义冲突 | 叙事场景切换要求与背景延续冲突 | high | yes | 叙事切换优先 | storyPlan | 背景延续仅保留色温 | experimental-only |
| sceneDurations | totalDuration | 语义冲突 | 分段时长与总时长不一致 | high | no | 总时长硬约束 | totalDuration | 按比例缩放 sceneDurations | experimental-only |
| entryDirection | layout | 空间冲突 | 入场方向与布局锚点冲突 | medium | yes | 布局锚点优先 | layout | entryDirection 改描述词 | experimental-only |
| exitDirection | anchor | 空间冲突 | 退场方向与锚点锁定冲突 | medium | yes | 锚点锁定优先 | anchor | exitDirection 变为镜头运动 | experimental-only |
| style | semantic | 风格冲突 | 风格标签与语义目标冲突 | medium | yes | 语义可识别性优先 | semantic | style 降强度 | experimental-only |
| detail | sceneDurations | 细节冲突 | 细节密度超过镜头时长承载 | medium | yes | 时长容量优先 | sceneDurations | detail 转关键清单 | experimental-only |
| atmosphere | lighting | 光线冲突 | 氛围色调与光线主方向冲突 | low | yes | 光线主方向优先 | lighting | atmosphere 转后期词 | experimental-only |
