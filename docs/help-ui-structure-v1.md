# Help UI Structure V1（Stage 3 后）

帮助中心 UI 组件与数据边界，便于后续 /help 路由与 i18n 接入。

---

## 1. 新分组

定义于 `src/features/help-center/helpGroups.ts`。

```
getting_started     → intro, workspace
templates_billing   → templates, advanced_templates, credits, billing
creative_controls   → camera, lighting, director, continuity
output_platform     → generation, export, platform
other               → faq
```

- **groupId**：唯一标识，用于 testid `help-center-group-<id>`。
- **labelZh / labelEn**：分组标题。
- **sections**：`HelpSectionId[]`，顺序即 sidebar 与窄屏下拉顺序。

---

## 2. 新布局

- **HelpModal**：createPortal 到 body；mask + modal 容器；宽度 880–980px（min(980, max(880, 100vw-32))），maxHeight 85vh。
- **HelpLayout**：flex 行；左侧 HelpSidebar（桌面 200px 固定），右侧 HelpPanel（flex:1，overflow:auto）。窄屏（<760px）不渲染 Sidebar，顶部 section `<select>` + Panel。
- **HelpSidebar**：按 HELP_GROUPS 渲染 group title + section 按钮；当前 sectionId 高亮。
- **HelpPanel**：单 section 内容；section 标题 + block 列表（每 block 一卡片）；faq 时先 FAQ blocks 再 feedback 区块（独立 testid `help-center-feedback`）。

---

## 3. 组件职责

| 组件 | 职责 |
|------|------|
| HelpModal | 遮罩、modal 容器、标题栏、关闭按钮；注入 HelpLayout。 |
| HelpLayout | 决定 sidebar vs 下拉；渲染 HelpSidebar（桌面）+ HelpPanel。 |
| HelpSidebar | 分组导航；group title + section 按钮；onSelect(sectionId)。 |
| HelpPanel | 根据 sectionId 取 helpContent；渲染 section 标题 + block 卡片；faq 时追加 feedback 区块。 |

**数据**：

- `helpSections.ts`：HELP_SECTIONS、getHelpSections(lang) → section 列表与标签。
- `helpGroups.ts`：HELP_GROUPS → 分组与 section 顺序。
- `helpContent.ts`：getHelpContentForLang(sectionId, lang) → title + blocks（不修改文案）。
- `helpStyles.ts`：Figma 对齐的色板与布局样式。

---

## 4. Testid 约定

- `help-center-mask`, `help-center-modal`, `help-center-close-top`
- `help-center-group-<groupId>`
- `help-center-tab-<sectionId>`
- `help-center-section-<sectionId>`
- `help-center-block-<sectionId>-<index>`（faq 为 `help-center-block-faq-<index>`）
- `help-center-feedback`
- 窄屏：`help-center-section-select`

---

## 5. App 与入口

- **Stage 4 后**：App 中已无 help 专用样式残留；Help 状态与入口：helpCenterOpen, helpCenterSection, setHelpCenterSection；HelpModal 由 App 渲染并传入 feedbackProps/lang/viewportWidth。
- **唯一入口**：App → HelpModal（账户菜单「帮助中心」）。

---

## 6. Future Route（预留，当前不实现）

可支持以下形式，当前**不实现**：

- `/help` — 独立帮助页，默认 section = intro
- `/help?section=templates` — 通过 searchParams 指定 section
- `/help#billing` — 通过 hash 指定 section（可选）

实现时：新路由渲染同一 HelpLayout，sectionId 从 URL 解析；组件与 helpContent/helpSections 复用，无需改 Help 逻辑。

---

## 7. 未来扩展

- **/help 路由**：见上节 Future Route；不实现时入口仍仅为 App → HelpModal。
- **i18n**：将 helpContent 的 titleZh/En、block title/text 迁为 i18n key，HelpPanel 用 t() 取文案。
- **Figma**：在 design-reference 中新增 Help 专用 layout，与 helpStyles 保持同步。
