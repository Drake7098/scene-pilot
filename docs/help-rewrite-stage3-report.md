# Help Rewrite Stage 3 Report — UI 重构 + 分组导航 + 布局正式化

**目标**：将帮助中心从临时面板升级为正式产品级帮助中心 UI；仅重构 UI/layout/sidebar/panel/styles，不删 legacy、不改 helpContent 文案、不进入 Stage 4。

**完成时间**：Stage 3 执行后停止。

---

## 1. 完成项

- [x] 保持 modal 形态
- [x] 使用 Stage2 文案（helpContent.ts）
- [x] 使用 Stage1 section（14 section）
- [x] 新增导航分组（helpGroups.ts）
- [x] 重构 panel 排版（block list + block card）
- [x] 优化 FAQ + feedback（FAQ blocks 先，feedback 区块后，独立 testid）
- [x] 对齐 Figma 风格（helpStyles.ts 对齐 design-reference/figma/app.tsx）
- [x] 为 future /help route 预留结构（section id 稳定、组件化、无 hash/route 变更）

---

## 2. 分组（helpGroups.ts）

| groupId | labelZh | labelEn | sections |
|---------|---------|---------|----------|
| getting_started | 入门 | Getting started | intro, workspace |
| templates_billing | 模板与计费 | Templates & billing | templates, advanced_templates, credits, billing |
| creative_controls | 创作控制 | Creative controls | camera, lighting, director, continuity |
| output_platform | 导出与平台 | Output & platform | generation, export, platform |
| other | 其他 | Other | faq |

---

## 3. UI 变化

- **Sidebar**：按分组展示；每组有 group title（小写+间距），其下为 section 按钮；当前 section 高亮（accent 边框+背景）。
- **Layout**：桌面：sidebar 固定 200px，panel 自适应并单独滚动；窄屏：section 下拉 + panel。
- **Modal**：宽度 min(980px, max(880px, 100vw-32px))，maxHeight 85vh；panel 内滚动，非 modal 整体滚动。
- **Panel**：section 标题 + block 列表；每个 block 为一张卡片（边框、圆角、内边距）；block 间距 12px。
- **FAQ**：先渲染所有 FAQ blocks（卡片），再渲染反馈区块（标题、渠道、模板框、textarea、复制/发送、系统邮箱说明）；反馈区块 testid `help-center-feedback`。

---

## 4. 样式变化

- **helpStyles.ts**：集中 Help 用色与布局，对齐 Figma（#1f2125 bg, #24262b panel, #3a3f46 border, #343942 hover, #e5e7eb text, #9ca3af muted, #f59e0b accent）；sidebar 选中态 accent 描边+浅色底；block 卡片 8px 圆角、panel 背景。
- **HelpSidebar / HelpLayout / HelpPanel / HelpModal**：均使用 helpStyles，无内联大段 style 对象；feedback 使用 helpFeedbackStyles。

---

## 5. App 残留

- **App.tsx** 仍保留样式键：`helpCenterHead`, `helpCenterBody`, `helpCenterNav`, `helpCenterNavBtn`, `helpCenterNavBtnOn`, `helpCenterPanel`（当前未被任何 JSX 引用，为历史残留）。
- Help 入口与状态不变：`helpCenterOpen`, `helpCenterSection`, `HelpModal` 调用方式未改。
- **未迁移**：未从 App 删除上述 key（避免动面过大）；Help 实际样式全部来自 features/help-center。

---

## 6. 文档

- 本报告：`docs/help-rewrite-stage3-report.md`
- 结构说明：`docs/help-ui-structure-v1.md`

---

## 7. 风险

- 窄屏下 section 切换为原生 `<select>`，样式与 Figma 一致度略低于桌面 sidebar。
- App 内未使用的 help 样式键仍存在，若后续统一清理样式表可一并移除。

---

## 8. 下一步建议

- Stage 4 前：如需 i18n，可将 helpContent 的 title/block 迁入 i18n key。
- 未来 /help 路由：复用 HelpLayout + HelpSidebar + HelpPanel，由 Router 提供 sectionId（如 searchParams 或 hash），无需改组件结构。
- 可选：在 Figma 中新增 Help Center 专用 layout，并同步到 design-reference，作为单一事实源。
