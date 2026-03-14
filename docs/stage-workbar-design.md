# Stage Work Bar 设计文档

> Stage 可移动 Work Bar + 画布功能重构｜设计说明

---

## 一、为什么要做可移动 Work Bar

1. **减少面板切换成本**：用户在 Stage 上选中对象后，最常用的是 move、center、reset、lock 等动作。若每次都去右侧 PropsPanel 找，效率低。
2. **贴近操作点**：Work Bar 浮在画布上、可拖动，用户可将工具条移到不遮挡内容的位置，保持“操作即所见”。
3. **只做高频安全动作**：Work Bar 不是万能属性栏，不取代 PropsPanel / Template Slots / Scene Strategy，只负责快速执行结构安全动作。

---

## 二、为什么只能开放结构安全动作

Stage 的本质是：

- 结构化布局编辑器
- 模板可视化编辑器
- t0 / t1 关键帧编辑器
- Prompt 结构映射前端
- continuity / slots / strategy 的可视控制层

因此：

- **允许**：move、resize（受限）、center、reset、t0/t1 同步、lock、slot 绑定、anchor 标记
- **禁止**：自由路径动画、warp/skew/透视、任意布尔、无边界的自由旋转、破坏 continuity 的 scene 级联编辑、破坏 slots 映射的自由覆盖

Work Bar 上的每个按钮都必须经过 Stage Action Guard 校验，确保不破坏：

- slot mapping
- continuity chain
- strategy defaults
- template defaults recovery
- export structure expectations

---

## 三、Work Bar 按钮列表与显示规则

### 3.1 首轮 8 类按钮

| 按钮 | 作用 | 显示条件 | 禁用条件 |
|------|------|----------|----------|
| Select / Focus | 聚焦当前对象，同步 PropsPanel | 始终显示 | - |
| Move | 进入安全移动态 | 未锁定时 | 对象已锁定 |
| Center / Snap Center | 水平居中到画布 | 未锁定时 | 对象已锁定 |
| Reset Transform | 恢复模板默认布局 | 未锁定时 | 对象已锁定 |
| Copy T0 → T1 | 复制 t0 布局到 t1 | 仅视频模式 | 图片模式、对象已锁定 |
| Lock / Unlock | 锁定/解锁对象 | 始终显示 | - |
| Assign Slot | 绑定模板 slot | 有 currentTemplate 时 | base 无 slot 时不显示 |
| Mark Anchor | 标记 continuity anchor | 仅 continuity 模板 | base 模板隐藏 |

### 3.2 显示规则

- **选中单个对象时**：Work Bar 出现
- **未选中**：隐藏
- **多选**：首轮不开放，可后续扩展
- **图片模式**：Copy T0→T1 隐藏或禁用
- **非 continuity 模板**：Mark Anchor 隐藏
- **protected-layout 对象**：只显示 Select、View、Reset（受控）、Lock

### 3.3 形态要求

- 浮在 Stage 上
- 可在画布范围内拖动
- 默认吸附到选中对象附近
- 靠近边缘时自动避让
- 缩略图标，无文字，支持 tooltip
- 不做大而重的工具箱

---

## 四、为什么 Work Bar 不是万能工具条

| 能力 | Work Bar | PropsPanel | Scene Strategy |
|------|----------|------------|----------------|
| 快速 move/center/reset | ✓ | - | - |
| 锁/解锁 | ✓ | ✓ | - |
| 细节属性（look、参考图等） | - | ✓ | - |
| camera / movement / shot | - | - | ✓ |
| anchor 标记 | Mark Anchor | - | - |

Work Bar 负责**快操作**，PropsPanel 负责**细节编辑**，Scene Strategy 负责**镜头策略**。职责不重叠，不替代。

---

*文档版本：基于 Stage 结构安全化重构方案*
