# Help Rewrite Stage 5 Report — Help 系统冻结 + 架构完成标记

**最终阶段**：仅做冻结、文档、约束与未来扩展点；不修改 UI、文案、Help 逻辑。

---

## 1. 冻结

- **Help 架构**：已标记为正式系统；见 `docs/help-system-final.md`。
- **architecture-status-report.md**：新增 **§8 Help System**，状态 **FROZEN**；说明 Help 重构完成，不允许回退。
- **禁止回退**：不得恢复 App 内联 Help、placeholder、quick_start/pro_motion 等旧 section 或旧 JSX。

---

## 2. 规则（AGENTS.md）

已新增 **Help System** 规则：

- 不允许在 App.tsx 写 Help 内容或 Help 专用 JSX。
- Help 内容必须写在 helpContent.ts。
- Section 必须在 helpSections.ts 定义；不得恢复 quick_start、pro_motion_* 等旧 id 作为主 Help 来源。
- Help UI 必须在 features/help-center；不得在 App 中增加 help 专用样式或内联 Help 布局。
- 不允许 placeholder 式 Help、legacy Help JSX、quick_start 写回。
- 架构参考：docs/help-system-final.md、docs/help-ui-structure-v1.md。

---

## 3. 入口

- **唯一入口**：App → HelpModal（账户菜单「帮助中心」）。
- **默认 section**：intro（DEFAULT_HELP_SECTION）。
- **检查结果**：grep helpCenter / HelpModal / helpContent / helpSections — 仅 App 引用 HelpModal 与 state；helpContent/helpSections 仅在 features/help-center 内部使用；无其他入口。

---

## 4. 未来扩展

| 扩展点 | 说明 | 当前 |
|--------|------|------|
| **/help 路由** | 可支持 `/help`、`/help?section=templates`、`/help#billing`；见 help-ui-structure-v1.md §6 Future Route。 | 不实现；入口仅为 App → HelpModal。 |
| **i18n** | helpContent 可迁为 i18n key；见 help-system-final.md「i18n 预留」。 | 不做；仍用 helpContent.ts 中英字段。 |
| **文档导出** | helpContent 可导出为 docs、Markdown、网站文档；见 help-system-final.md「文档导出预留」。 | 不实现。 |

---

## 5. 风险

- 若新人在 App 中直接加 Help 相关 JSX 或样式，可能绕过规则；依靠 Code Review 与 AGENTS.md 约束。
- legacyHelpContent.ts 仍存在（不 import）；若有人误导入会重新引入旧 id；已通过文件头注释与文档说明「Do not import」。

---

## 6. 完成

- Help 结构固定；14 section、helpContent、helpGroups、HelpModal/Layout/Sidebar/Panel 为唯一正式实现。
- 文档：help-system-final.md（新建）、help-ui-structure-v1.md（更新 §5 入口、§6 Future Route、§7 未来扩展）、architecture-status-report.md（新增 §8 Help System）、help-rewrite-stage5-report.md（本报告）。
- AGENTS.md 已含 Help System 规则。
- architecture-status-report 已更新；Help 状态 FROZEN。
- 无旧系统引用（placeholder 已删、legacy 不导出、App 无 help 样式残留）。

**完成标准**：Help 结构固定、文档完整、AGENTS 有规则、architecture-status 已更新、无旧系统引用。 ✓
