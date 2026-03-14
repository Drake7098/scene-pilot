# Stage 安全编辑模型

> Stage 允许/禁止的能力、Guard 工作方式、对象状态分类

---

## 一、Stage 允许编辑什么

| 能力 | 说明 | 约束 |
|------|------|------|
| 对象选择 | 点击对象选中，同步 PropsPanel | - |
| 对象安全移动 | 拖拽位置，受 WORLD_MIN/MAX 限制 | 锁定对象禁止 |
| 对象受限缩放 | 拖拽 handles，受 SIZE_MIN/MAX 限制 | 锁定对象禁止 |
| 对象受限旋转 | 仅输入式或离散步进（首轮不做自由旋钮） | - |
| t0 / t1 切换 | 视频模式下切换关键帧 | 图片模式 t1 锁定 |
| 关键帧复制 / 同步 | Copy T0→T1，明确的关键帧关系 | 禁止自由路径 |
| 对象锁定 | 防误拖、防误改 | - |
| slot 绑定 | 将对象绑定为 slot 承载对象 | 受控 action，不允许多绑 |
| anchor 标记 | 标记 continuity anchor | 仅 continuity 模板 |
| 居中 / 对齐 | 水平居中（优先） | - |
| 查看 reference 缩略图 | 只读 | - |
| 查看对象来源状态 | template / slot-derived / user-added / inherited | 只读 |

---

## 二、Stage 禁止编辑什么

| 禁止项 | 说明 |
|--------|------|
| 自由路径动画 | 曲线贝塞尔运动 |
| group / group transform | 首轮不做 |
| 任意多选变形 | 首轮不做 |
| warp / skew / perspective | 任意变形 |
| 非受控的自由旋转 | 旋钮式自由拖 |
| 任意 scene 批量同步 | 破坏 continuity 继承链 |
| 任意解除 slot 绑定 | 不经安全确认 |
| 直接编辑导出 prompt 结构字段 | 只能通过结构层修改 |

---

## 三、为什么 Stage 不是自由设计工具

Stage 是：

- **结构化布局编辑器**：对象有 x/y/w/h/rot，受规则约束
- **模板可视化编辑器**：来自模板的对象有默认值，可 reset
- **t0/t1 关键帧编辑器**：视频模式支持起止帧，不做自由路径
- **Prompt 结构映射前端**：改的是 project/scene/layer，prompt 由编译层生成
- **continuity / slots / strategy 的可视控制层**：不绕过这些模块

因此不能做成 Figma/PS/AE 式的自由设计工具。

---

## 四、Guard 如何工作

### 4.1 统一 Guard 层

所有 Stage 上的可写动作必须经过 `stageActionGuard.ts`：

- 禁止在组件里直接 `setState` 改 project
- 禁止在 Work Bar 按钮里直接改 layer kf
- 禁止在拖拽回调里直接写任意字段且不经过 guard

### 4.2 Guard 检查内容

每次 Stage action 至少检查：

1. 当前对象是否锁定
2. 当前对象是否为 template-derived protected object
3. 当前对象是否绑定 slot
4. 当前对象是否为 continuity anchor
5. 当前 scene 是否为 continuity scene
6. 当前项目是否允许该类操作
7. 当前操作是否破坏 slot mapping、continuity chain、strategy defaults、template defaults、export structure

### 4.3 Guard 处理结果

| 结果 | 说明 |
|------|------|
| `allow` | 完全允许执行 |
| `allow-with-normalize` | 允许，但做自动规范化（坐标吸附、rot 离散化、size 限制等） |
| `deny` | 禁止，不弹 warning，轻量反馈或静默禁用 |
| `reroute-to-panel` | 引导到 Template Slots / Scene Strategy / Object Properties 等 |

### 4.4 优先禁用，不优先提醒

- 高风险能力：直接禁用按钮或不显示
- 不依赖 endless warning 弥补设计缺陷

---

## 五、对象状态分类与权限

| 状态 | 说明 | 允许 | 禁止 |
|------|------|------|------|
| template-derived | 来自模板 | move（受限）、resize、reset、lock、assign slot（受控） | 任意解除来源、任意改 type |
| slot-bound | 绑定 slot | move、reset、lock | 绕过 Template Slots 改语义字段 |
| anchor-bound | continuity anchor | 小范围 move（guard 允许）、lock、view | 大幅位移、任意解绑 |
| inherited | 继承自前一镜 | 查看来源、本镜局部调整 | 静默破坏继承 |
| user-added | 用户手动添加 | 同 template-derived，略宽松 | - |
| locked | 已锁定 | select、focus、view、unlock | move、resize、其他写操作 |
| protected-layout | 布局保护 | select、view、reset（受控）、lock | 其他写操作 |

---

*文档版本：基于 Stage 结构安全化重构方案*
