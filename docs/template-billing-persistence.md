# 模板计费持久化说明

## 一、原先如何去重扣点

- 使用 `appliedTemplateIdsForBillingRef`（`useRef<Set<string>>`）在内存中记录当前项目内已扣费的模板 ID
- 判断逻辑：`if (appliedTemplateIdsForBillingRef.current.has(meta.id))` → 跳过扣费，直接 apply
- 扣费成功后：`appliedTemplateIdsForBillingRef.current.add(meta.id)`
- 切换/新建项目时：`appliedTemplateIdsForBillingRef.current.clear()`

## 二、为什么不稳定

- 仅在内存中，刷新页面后 `useRef` 被重置
- 刷新后再次使用同一模板会被重复扣费
- 依赖 App 层在「新建项目」「打开项目」时手动 clear，容易遗漏

## 三、现在写到哪里

- 写入 `project.meta.appliedTemplateIds: string[]`
- 与项目一起序列化（保存、导出、打开）
- 仅记录**已扣费**的模板 ID（免费/unlimited 不写入）
- `ProjectMeta` 类型：`{ appliedTemplateIds?: string[] }`
- `sanitizeProject` 会校验并清洗该字段

## 四、计费顺序

1. **解析 cost**：`meta.cost`（免费为 0）
2. **判断 entitlement / unlimited**：`canUseUnlimitedTemplates(accountUser)` → 是则直接 apply，不扣费
3. **判断当前项目是否已应用过**：`project.meta?.appliedTemplateIds?.includes(meta.id)` → 是则直接 apply，不扣费
4. **检查 credits**：`accountCredits >= cost`，不足则弹窗，不继续
5. **reserve**：`reserveCredits(accountUser.id, cost, \`template_${meta.id}\`)`
6. **apply**：`applyTemplateFromIndex(index, project, true)`
7. **成功后**：`finalizeReservedCredits` + 将 `meta.id` 写入 `project.meta.appliedTemplateIds`，调用 `updateProject`
8. **失败**：不写入 appliedTemplateIds，不 finalize（reserve 需按现有流程处理）

## 五、未来对接后端账本

- `project.meta.appliedTemplateIds` 可作为本地缓存，与后端「项目已扣费模板」对账
- 后端可维护 `project_id -> [template_id, ...]` 或等价结构
- 扣费时：先查后端是否已扣，再 reserve；或由后端幂等处理
- 建议：保留 `appliedTemplateIds` 为可选同步字段，后端返回已扣费列表时可合并更新

## 六、回归验证

| 验证项 | 预期 | 状态 |
|--------|------|------|
| base 模板首次使用 | 正常扣点 | 待手动验证 |
| 同项目再次使用同一模板 | 不重复扣点 | 待手动验证 |
| 刷新后同项目再次使用 | 仍不重复扣点 | 待手动验证 |
| continuity 模板逻辑 | 不受影响 | 待手动验证 |
| studio / unlimited 判断 | 未被破坏 | 待手动验证 |
| 模板工作台基本交互 | 未被破坏 | 待手动验证 |
