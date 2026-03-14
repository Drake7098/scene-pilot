# 模板工作台综合完成报告

---

## 一、总体状态

| 维度 | 状态 | 说明 |
|------|------|------|
| **功能完整性** | ✅ 已完成 | 工作台打开、搜索、筛选、详情、应用、计费、收藏/最近 |
| **主流程架构** | ✅ 已统一 | TemplateIndex → Engine → Payload → Apply → Project |
| **计费持久化** | ✅ 已落地 | project.meta.appliedTemplateIds，同项目不重复扣点 |
| **历史路径清理** | ✅ 已退出主链 | snapshot / legacyAdapter 不再参与主流程 |
| **扩展预留** | ✅ 已就绪 | Grid 虚拟化、1000+ 结构预留 |
| **后端/支付** | ⏳ 未接入 | 当前均为前端本地逻辑 |

---

## 二、主流程与架构

### 2.1 数据流

```
TemplateIndex（600 条元数据）
    ↓
getTemplateIndex() → filterTemplateIndex(scope, category, filters, search)
    ↓
用户选择 → handleUseTemplateFromWorkspace(index)
    ↓
resolve cost / entitlement / appliedIds
    ↓
applyTemplateFromIndex(index, project, append)
    ↓
loadTemplatePayloadById(id) → TemplatePayload
    ↓
applyPayloadToProject(payload, project) → Project
    ↓
成功 → finalize + 写入 project.meta.appliedTemplateIds
```

### 2.2 架构分层

| 层 | 职责 | 位置 |
|----|------|------|
| **template-workspace** | UI：工作台、Grid、Detail、Header、Sidebar、搜索/筛选、收藏/最近 | `src/features/template-workspace/` |
| **template-engine** | 逻辑：index、payload 加载、apply、cost、entitlement | `src/template-engine/` |
| **App** | 协调：handleUseTemplateFromWorkspace、计费 reserve/finalize、updateProject | `src/App.tsx` |
| **billing / entitlement** | 扣费判断、unlimited 判断 | App 层调用 |

---

## 三、模板规模与分类

| 类型 | 数量 | 家族 | 变体 | 生成方式 |
|------|------|------|------|----------|
| Base | 400 | 40 | 10 | familyBases + variantPatches |
| 网剧连续 | 100 | 20 | 5 | buildWebdramaIndex / buildWebdramaPayload |
| 动漫连续 | 100 | 20 | 5 | buildAnimeIndex / buildAnimePayload |
| **合计** | **600** | - | - | - |

- **免费**：80 个（40 base starter + 40 连续 starter）
- **Index**：全量 600 条一次加载，轻量元数据
- **Payload**：按需 `loadTemplatePayloadById`，带 cache

---

## 四、UI 组件清单

| 组件 | 职责 | 数据 |
|------|------|------|
| TemplateWorkspace | 主容器 | ✅ 真数据 |
| TemplateWorkspaceHeader | 搜索、筛选、关闭 | ✅ |
| TemplateWorkspaceSidebar | 分类导航（CategoryNav） | ✅ |
| TemplateGridContainer | 根据 item 数选 normal / virtual | ✅ |
| TemplateWorkspaceGrid | 网格/列表渲染（<400 项） | ✅ |
| TemplateWorkspaceGridVirtual | 虚拟化 Grid 预留（≥400 项） | ✅ passthrough |
| TemplateWorkspaceDetail | 右侧详情 | ✅ |
| TemplateCard | 单卡片 | ✅ |
| TemplateSidebarEntry | 侧栏最近/收藏快捷入口 | ✅ |

**入口**：Pro 侧栏「打开模板工作台」、TemplateSidebarEntry 点击

---

## 五、筛选与 scope

| 筛选项 | 支持 |
|--------|------|
| scope | recommended / all / free / recent / favorites / mine |
| search | name / family / tags / description 模糊匹配 |
| mediaType | image / video / all |
| storyPlan | single / continuous / multi_cam / edited / all |
| ratio | 16:9 / 9:16 / 1:1 / all |
| pricing | free / paid / all |
| domain | base / webdrama_continuity / anime_continuity / all |

---

## 六、计费与持久化

### 6.1 计费顺序

1. 解析 `meta.cost`（免费为 0）
2. 判断 `canUseUnlimitedTemplates(accountUser)` → 是则直接 apply
3. 判断 `project.meta?.appliedTemplateIds?.includes(meta.id)` → 是则直接 apply
4. 检查 `accountCredits >= cost`
5. reserve → apply → 成功则 finalize + 写入 appliedTemplateIds

### 6.2 持久化

- **位置**：`project.meta.appliedTemplateIds: string[]`
- **写入时机**：扣费成功后
- **兼容**：`sanitizeProject` 校验、清洗、上限 500

### 6.3 未来对接

- 可与后端 `project_id -> [template_id]` 对账
- appliedTemplateIds 作为本地缓存

---

## 七、已完成的四轮稳定化

| 轮次 | 内容 |
|------|------|
| **1** | 模板应用主链统一为 payload apply |
| **2** | template-engine 建立，App / workspace / engine 边界厘清 |
| **3** | 计费去重持久化到 project.meta；snapshot / templateStore / builtinTemplates / legacyAdapter 退出主流程并废弃 |
| **4** | Grid 虚拟化预留（TemplateGridContainer、TemplateWorkspaceGridVirtual、useVirtualizedTemplateGrid）；回归清单与总报告产出 |

---

## 八、已退出主流程的历史逻辑

| 逻辑 | 状态 |
|------|------|
| applyTemplateSnapshot | @deprecated，主链不用 |
| cloneSceneFromTemplate | @deprecated，仅 applyTemplateSnapshot 依赖 |
| unifiedTemplateToSceneTemplate | @deprecated |
| builtinTemplates | @deprecated |
| legacyAdapter.getTemplateWorkspaceItemFromIndex | @deprecated，主链不用 |

---

## 九、剩余风险

| 风险 | 说明 |
|------|------|
| backend 未接 | index、payload、计费均为前端本地 |
| payment 未接 | reserve/finalize 为模拟 |
| 虚拟化为预留 | TemplateWorkspaceGridVirtual 当前 passthrough，需接入 react-window |
| continuity builder 独立 | 与 base variant 机制尚未统一 |
| 旧兼容层残留 | 可后续清理 |

---

## 十、回归验证（待执行）

| 类别 | 项目 |
|------|------|
| 工作台 | 打开、搜索、分类、pricing / domain / mediaType / ratio / storyPlan 筛选、grid/list 切换、收藏/最近 |
| Base 模板 | 详情、使用、应用、重复不扣点、刷新后仍不扣点 |
| Continuity | 详情、使用、scenes 合并、扣点、unlimited |
| 架构 | 主链走 engine/payload，不走 snapshot，不依赖 legacyAdapter |

---

## 十一、相关文档

| 文档 | 内容 |
|------|------|
| `docs/template-engine-stabilization-report.md` | 稳定化总报告 |
| `docs/template-billing-persistence.md` | 计费持久化说明 |
| `docs/template-grid-scaling-plan.md` | Grid 1000+ 扩展方案 |
| `docs/template-snapshot-deprecation-report.md` | Snapshot 废弃报告 |
| `docs/template-legacy-adapter-removal.md` | Legacy Adapter 移除说明 |
| `docs/template-engine-regression-checklist.md` | 回归检查清单 |

---

*报告生成时间：基于当前代码库与既有文档汇总*
