# Help Rewrite Stage 4 Report — 删除旧 Help + 清理 legacy + App 收口

**目标**：完成 Help 重构收口；只做清理，不做新功能。执行后停止，不进入 Stage 5。

---

## 1. 删除

| 项 | 说明 |
|----|------|
| **helpPlaceholders.ts** | 文件已删除；getPlaceholderContent、PlaceholderContent 已移除。 |
| **getPlaceholderContent / PlaceholderContent 导出** | 从 `features/help-center/index.ts` 移除；HelpPanel 仅使用 helpContent.ts。 |
| **LEGACY_SECTION_IDS / LEGACY_CONTENT_SNIPPETS / LegacyHelpSectionId 导出** | 从 index 移除；不再对外暴露 legacy。 |
| **App 中 6 个 help 样式键** | helpCenterHead、helpCenterBody、helpCenterNav、helpCenterNavBtn、helpCenterNavBtnOn、helpCenterPanel 已从 `styles` 对象中删除。 |

**旧 Help JSX**：App 中未发现旧的 createPortal Help 块或 `helpCenterSection === "quick_start"` 等分支；Help 仅通过 `<HelpModal />` 渲染，无需再删。

**旧 helpSections 定义**：唯一 section 定义在 `helpSections.ts`（14 section：intro, workspace, …）；无其他旧数组或 quick_start/pro_motion 等旧 id 定义需删除。

---

## 2. 保留

| 项 | 说明 |
|----|------|
| **legacyHelpContent.ts** | 文件保留，作为历史参考；**不允许任何 import**；文件头已注明 “Do not import”。 |
| **helpContent.ts** | 14 section 正式文案，HelpPanel 唯一内容源。 |
| **helpSections.ts** | 14 section id 与 label，HELP_SECTIONS、getHelpSections。 |
| **helpGroups.ts / helpStyles.ts** | Stage 3 分组与样式。 |
| **HelpModal / HelpLayout / HelpSidebar / HelpPanel** | 新 Help UI 组件。 |
| **App 中 modal 相关样式** | modalMask、modal、modalTitle、modalIconBtn、modalText、modalBtns、modalBtn、modalBtnGhost 等未删。 |

---

## 3. App 清理

- **已删除**：helpCenterHead、helpCenterBody、helpCenterNav、helpCenterNavBtn、helpCenterNavBtnOn、helpCenterPanel（6 个未使用样式）。
- **保留**：Help 状态与入口（helpCenterOpen、helpCenterSection、setHelpCenterSection）、feedback 状态（feedbackText、feedbackSending、feedbackSent、submitFeedback）、`<HelpModal />` 及 feedbackProps 传入。账户菜单「帮助中心」仍调用 `setHelpCenterSection(DEFAULT_HELP_SECTION)` 与 `setHelpCenterOpen(true)`。

---

## 4. Help 状态

- **入口**：账户菜单 → 「帮助中心」→ 打开 HelpModal，默认 section = intro（DEFAULT_HELP_SECTION）。
- **内容**：仅来自 helpContent.ts；14 section 正常；无 placeholder、无 legacy 引用。
- **FAQ + feedback**：faq section 仍包含 FAQ blocks + 独立 feedback 区块（textarea、复制、发送）；feedbackProps 由 App 传入，行为未改。

---

## 5. Build

- `npm run build` 已通过（tsc -b && vite build）。
- 无 unused import、missing type、undefined section、invalid id 报错。

---

## 6. 风险

- 若有外部或测试代码曾依赖 `getPlaceholderContent` 或 `LEGACY_*` / `LegacyHelpSectionId` 的导出，需改为使用 helpContent / HelpSectionId；当前仓库内无此类引用。
- legacyHelpContent.ts 仍存在，若有人误 import 会恢复 legacy 依赖；仅通过注释与文档约束“不引用”。

---

## 7. 下一步建议

- **Stage 5**：可按需接入 i18n、/help 路由、Figma Help 稿同步等。
- 若需彻底避免误用 legacy，可后续将 legacyHelpContent.ts 移入 `docs/` 或 `archive/` 仅作参考，并从源码树中移除（需评估是否有脚本或文档引用路径）。

---

**完成标准**：旧 JSX 不存在、旧 helpSections 仅剩 helpSections.ts、placeholder 已删、App 无 help 样式残留、HelpModal 与 faq 正常、build 通过、本报告已生成。
