# Pro 工作台 · Current Template 模块

---

## 一、为什么 Pro 工作台需要 Current Template

用户在模板工作台选择并应用模板后，会回到 Pro 工作台继续编辑项目。此时，用户需要明确知道：

- **当前项目是否来自模板**：避免误以为项目是“空白创建”的
- **当前使用的是哪个模板**：便于记忆、沟通、更换
- **模板的 family / variant / category / domain**：理解模板来源和适用场景
- **tier / cost / apply mode**：了解计费和应用粒度
- **是否已计费**：与 `appliedTemplateIds` 联动，避免重复扣点疑虑

如果没有 Current Template 模块，用户只能靠记忆或在模板工作台中重新查找，体验断裂。Current Template 提供**持久化的模板上下文**，让 Pro 工作台与模板工作台形成闭环。

---

## 二、当前模板上下文字段（CurrentTemplateContext）

定义在 `src/model.ts`，位于 `project.meta.currentTemplate`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `templateId` | string | 模板 ID |
| `familyId` | string | 模板族 ID |
| `familyNameZh` / `familyNameEn` | string | 族名称 |
| `variantId` | string | 变体 ID |
| `variantNameZh` / `variantNameEn` | string | 变体名称（可选） |
| `titleZh` / `titleEn` | string | 模板标题 |
| `category` | string | 分类 |
| `domain` | string | 领域 |
| `tier` | string | 档位（可选） |
| `cost` | number | 费用（积分） |
| `isFree` | boolean | 是否免费 |
| `applyMode` | "layout_only" \| "layout_plus_style" \| "full_workflow" | 应用模式 |
| `appliedAt` | number | 应用时间戳（可选） |
| `fromTemplateWorkspace` | boolean | 是否从模板工作台应用（可选） |

要求：

- 可序列化
- 能随项目保存到磁盘 / 平台
- 不依赖仅内存态
- 旧项目无 `currentTemplate` 时仍可正常读取（`sanitizeProject` 会处理）

---

## 三、当前模板信息写入项目的时机

在 `handleUseTemplateFromWorkspace`（`src/App.tsx`）中，**模板应用成功后**：

1. 构造 `CurrentTemplateContext` 对象
2. 写入 `project.meta.currentTemplate`
3. 与 `appliedTemplateIds` 分开维护：`appliedTemplateIds` 用于计费去重，`currentTemplate` 用于 UI 展示与回跳

同项目**更换模板**时：

- `currentTemplate` 被新模板覆盖
- `appliedTemplateIds` 按计费逻辑追加（不重复扣点）

---

## 四、Current Template 模块的 UI 职责

位置：Pro 工作台左侧 Sidebar → Templates 区域 → **Current Template**（位于 TemplateSidebarEntry 上方）

职责：

1. **有模板时**：展示标题、family/variant、category/domain、tier/cost、apply mode、是否已计费
2. **无模板时**：空状态 + 打开模板工作台按钮
3. **快捷操作**：
   - **查看详情 / 更换模板**：打开模板工作台并预选当前模板
   - **打开工作台**：打开模板工作台（不预选）
   - **恢复默认**：占位，当前禁用

不负责：

- 应用模板（在模板工作台完成）
- 计费逻辑（由 `appliedTemplateIds` 与后端处理）

---

## 五、与 Recent / Favorites 的区别

| 维度 | Current Template | Recent | Favorites |
|------|------------------|--------|-----------|
| 数据来源 | `project.meta.currentTemplate` | 最近使用记录（如 localStorage） | 用户收藏列表 |
|  scope | 当前项目 | 全局 | 全局 |
| 展示内容 | 当前项目正在使用的模板 | 最近 N 个使用过的模板 | 用户收藏的模板 |
| 操作 | 查看详情、更换、恢复默认 | 快速再次应用 | 快速再次应用 |
| 持久化 | 随项目保存 | 本地存储 | 本地存储 |

Current Template 回答“**这个项目现在用的是什么模板**”；Recent / Favorites 回答“**我之前用过/收藏过哪些模板，可以再选一个应用**”。

---

*文档生成时间：2026-03-14*
