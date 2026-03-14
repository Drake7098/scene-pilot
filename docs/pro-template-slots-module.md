# Pro 工作台 · Template Slots 模块

> **已弃用**：模板槽位功能已移除。本文档仅供历史参考。

---

## 一、为什么模板工作流必须有 Slots

用户应用模板后，项目结构（分镜、对象、背景、镜头等）已经就位，但内容往往是“占位”的。若每次都要进入 Object Properties 逐个对象查找字段修改，效率低、易遗漏。

Template Slots 提供**模板级快速编辑入口**：

- 把“主体 / 产品 / 背景 / 文案 / 风格 / 镜头”等核心内容集中在一个模块
- 一次修改，自动同步到项目结构中
- 适用于“快速复用模板、批量替换关键内容”的场景

---

## 二、Slot 运行态结构（TemplateSlotRuntime）

定义在 `src/model.ts`，位于 `project.meta.templateSlots`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `slotId` | string | 槽位 ID（subject / product / background / copy / style / camera） |
| `slotType` | "text" \| "enum" \| "boolean" | 输入类型 |
| `labelZh` / `labelEn` | string | 展示标签 |
| `currentValue` | string | 当前值 |
| `defaultValue` | string | 模板默认值 |
| `required` | boolean | 是否必填 |
| `source` | "template-default" \| "user-edited" | 是否被用户修改 |
| `bindingTarget` | "project" \| "scene" \| "layer" | 绑定目标 |
| `sceneId` | string | 绑定的分镜 ID（scene / layer 时） |
| `layerId` | string | 绑定的图层 ID（layer 时） |
| `enumOptions` | string[] | 枚举选项（slotType 为 enum 时） |

要求：

- 可序列化
- 随项目保存
- 不依赖仅内存态
- 旧项目无 `templateSlots` 时可正常读取

---

## 三、Slot 与 project / scene / object 的关系

| bindingTarget | 典型 slot | 映射目标 |
|---------------|----------|----------|
| layer | subject, product | layer.look |
| scene | background | scene.notes 中的 `bg:` |
| scene | copy | scene.name |
| scene | style | scene.notes 中的 `pro_director_style:` |
| scene | camera | scene.camera.shot / movement |
| project | （预留） | project 级字段 |

当前实现以**第一镜**为主数据源，所有 slots 均绑定到第一镜或其图层。多镜/跨镜 slots 为后续扩展。

---

## 四、当前支持的 Slot 映射

| slotId | 映射 | 说明 |
|--------|------|------|
| subject | 第一个主体类图层 look | 类型含 主体/Subject/人物/角色 |
| product | 第一个产品类图层 look | 类型含 产品/Product/道具/Object |
| background | scene.notes `bg:` | 分镜背景描述 |
| copy | scene.name | 文案/标题 |
| style | scene.notes `pro_director_style:` | 导演风格 |
| camera | scene.camera.shot + movement | 景别/镜头运动 |

映射逻辑集中在 `src/utils/templateSlots.ts`：`extractSlotsFromProject`、`syncSlotToProject`。

---

## 五、为什么不直接只用 Object Properties

| 维度 | Template Slots | Object Properties |
|------|----------------|-------------------|
| 定位 | 模板级快速替换 | 对象级精细编辑 |
| 粒度 | 按语义聚合（主体、产品、背景等） | 按对象、按字段 |
| 使用场景 | 应用模板后快速改核心内容 | 调整布局、参考图、备注等 |
| 层级 | 在 PropsPanel 顶部，Scene Background 之上 | 在 Object Properties 区域 |

两者不冲突：Template Slots 修改后，Object Properties 会反映变化；Object Properties 修改不会回写 slot，除非已有明确映射。

---

*文档生成时间：2026-03-14*
