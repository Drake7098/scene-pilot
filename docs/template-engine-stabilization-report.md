# 模板引擎稳定化总报告

## 1. 本轮前的状态

### 原先的双轨问题

- **Base 400**：`templateLibrary400` + `unifiedTemplateToSceneTemplate` → `applyTemplateSnapshot`
- **Continuity 200**：`loadTemplatePayloadById` → `applyPayloadToProject`
- 两套 apply 路径，维护成本高，行为易不一致

### 旧系统残留

- `applyTemplateSnapshot`、`cloneSceneFromTemplate` 仍在代码中
- `builtinTemplates`、`templateStore.listBuiltinTemplates` / `getAllTemplates` 仍存在
- `legacyAdapter.getTemplateWorkspaceItemFromIndex` 将 Index 转为 UnifiedTemplate，仅 base 使用
- TemplatesPanel（backup）仍依赖旧链

### 计费内存态问题

- `appliedTemplateIdsForBillingRef` 仅存内存
- 刷新后「同项目不重复扣点」失效

### Grid 扩展风险

- 600 条全量 `items.map()` 渲染
- 1000+ 时无虚拟化，存在性能风险

---

## 2. 本轮完成后的最终主结构

```
TemplateIndex → Engine → TemplatePayload → Apply → Project
```

| 阶段 | 说明 |
|------|------|
| **TemplateIndex** | 轻量元数据，600 条，getTemplateIndex() |
| **Engine** | template-engine：index、payload、apply、cost、entitlement |
| **TemplatePayload** | loadTemplatePayloadById(id)：完整 projectDefaults + scenes + objects + continuity |
| **Apply** | applyTemplateFromIndex(index, project, append) → applyPayloadToProject |
| **Project** | 合并后的 project，含 meta.appliedTemplateIds |

---

## 3. 当前架构边界

| 层 | 职责 |
|----|------|
| **template-workspace** | UI：工作台、Grid、Detail、Header、Sidebar、搜索/筛选、收藏/最近 |
| **template-engine** | 逻辑：index、payload 加载、apply、cost 解析、entitlement |
| **App 层** | 协调：handleUseTemplateFromWorkspace、计费 reserve/finalize、updateProject、appliedTemplateIds 持久化 |
| **billing / entitlement** | App 层调用，依赖 accountUser、credits、canUseUnlimitedTemplates |
| **backend 未来** | 建议接入：template-engine（index 拉取、payload 拉取）、App 层（扣费 API、项目 meta 同步） |

---

## 4. 已解决的问题

| 问题 | 解决方式 |
|------|----------|
| base payload 化 | 主流程统一为 loadTemplatePayloadById → applyPayloadToProject |
| snapshot 退出主流程 | 标记 @deprecated，主链不再调用 |
| legacyAdapter 退出主流程 | 主链直接用 TemplateIndex，不再转 UnifiedTemplate |
| billing 去重持久化 | project.meta.appliedTemplateIds，随项目序列化 |
| scaling 预留 | TemplateGridContainer、TemplateWorkspaceGridVirtual、useVirtualizedTemplateGrid |

---

## 5. 仍存在的剩余风险

| 风险 | 说明 |
|------|------|
| backend 未接 | 模板 index、payload、扣费均为前端本地逻辑 |
| payment 未接 | reserve/finalize 为本地模拟，未对接真实支付 |
| continuity builder 独立 | webdrama/anime 使用独立 builder，与 base variant 机制未完全统一 |
| 虚拟化为预留 | TemplateWorkspaceGridVirtual 当前 passthrough，未接入 react-window |
| 旧兼容层残留 | applyTemplateSnapshot、builtinTemplates 等仍保留，需后续清理 |

---

## 6. 下一阶段推荐顺序

1. **扩 family / variant 与 1000+ index**：在现有 index 结构上扩展，接入 TemplateGridContainer 虚拟化
2. **continuity / anime variant 机制再统一**：与 base 的 familyBases + variantPatches 对齐
3. **API 契约设计**：模板 index API、payload API、扣费/账本 API
4. **backend 模板索引 / entitlement / 账本**：index 拉取、payload 拉取、appliedTemplateIds 对账
5. **payment 接入**：reserve/finalize 对接真实支付
6. **studio / Pro / Pro+ 后端化**：unlimitedTemplatesEnabled 等由后端配置
