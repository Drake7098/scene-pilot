# Session Primer / 新会话引导

**用途**：复制本文件内容到新聊天，或让 Agent 读取本文件 + `session-continuity` skill，快速建立上下文。

---

## 请先加载上下文

请使用 `session-continuity` skill：
- 读取 `/Users/dk/scene-pilot/.codex/skills/session-continuity/SKILL.md`
- 按其中 Required Reads 加载 AGENTS.md、live-development-strategy.md、本 session-primer

---

## 近期完成（2026-03-14 附近）

### 模板系统重构 Step 3
- 新增 200 个连续叙事模板（100 网剧 + 100 动漫）
- 网剧 20 家族×5 变体，动漫 20 家族×5 变体
- continuity payload：scenes>=2，continuity.enabled，characterCarryOver 等
- 模板按次扣点：Free=0，普通=3，连续/复杂=5
- 同项目内不重复扣点，新项目重新扣
- canUseUnlimitedTemplates 预留 Studio/Pro+
- 详见 `docs/template-system-refactor-step3-output.md`

### 模板系统重构 Step 2
- 40 家族 × 10 变体 = 400 模板接入 familyBases + variantPatches
- 40 免费模板（Free Starter）cost=0，可筛选、可推荐
- 成本规则：multi_object/advanced_motion/continuous=5，其余=3
- 搜索支持 nameZh/nameEn/family/description/tags
- 筛选支持 分类/媒体类型/场景计划/比例/免费付费
- 详见 `docs/template-system-refactor-step2-output.md`

### 模板系统重构 Step 1
- 新建 `src/features/template-workspace/` 独立 feature 模块
- 数据分层：TemplateIndex（轻量）、TemplatePayload、FamilyBase、VariantPatch
- 模板工作台从 App 剥离，App 仅保留 `isTemplateWorkspaceOpen` + 入口
- 兼容层：`getTemplateWorkspaceItemFromIndex` 适配旧 TemplateWorkspaceItem
- 详见 `docs/template-system-refactor-step1-output.md`

## 近期完成（2026-03-13 附近）

### 模板工作台 Step 3（闭环）
- 模板应用：`layout_only` / `layout_plus_style` / `full_workflow`，接入 applyTemplateSnapshot
- Credits 扣点：免费直接使用；付费模板 reserveCredits → apply → finalize；不足时弹层
- 最近使用：localStorage，最多 20 个
- 收藏：toggleFavorite，本地存储
- 左侧入口：最近 2-3、收藏 2-3，点击走同一 credits 流程
- 弹层：模板积分不足时显示「需要 X、剩余 Y、去购买点数」

### 模板体系 V1.5（400 模板）
- 40 家族 × 10 变体，familyId / 中英文名对齐规范
- 40 个免费模板：每家族 free_starter，带 descriptionZh/descriptionEn
- 变体定价：free=0，basic*=3，multi_object/advanced_motion=5
- 双语展示：nameZh、familyZh、descriptionZh 已接入模板工作台

### 关键文件
- 模板库：`src/data/templateLibrary400.ts`
- 模板数据/过滤：`src/data/templateWorkspaceData.ts`
- 模板应用：`src/rules/applyTemplate.ts`、`handleUseTemplateFromWorkspace` in App.tsx
- Credits：`creditService.reserveCredits`、`finalizeReservedCredits`

---

## 当前进行中 / 待办

见 `docs/development-tracker.json`：
- `npm run tracker:summary` 查看摘要
- `npm run tracker:list` 按状态列出

近期 tracker 中的高优：fal provider 接入、Runway provider 接入、等。

---

## 接下来做（在此追加）

_在此粘贴你接下来要做的任务描述，例如：_

- 我们接下来做 XXX
- 继续完善模板工作台的 XXX
- 请检查 XXX 是否有遗漏
