# Help System — 正式架构（冻结）

Help 重构 V2 完成后的正式架构定义。禁止回退到 App 内联 / placeholder / 旧 section id。

---

## 当前 Help 架构

### 组件（`src/features/help-center/`）

| 组件 | 职责 |
|------|------|
| **HelpModal** | 遮罩、modal 容器、标题栏、关闭；唯一入口由 App 渲染。 |
| **HelpLayout** | 桌面：Sidebar + Panel；窄屏：section 下拉 + Panel。 |
| **HelpSidebar** | 分组导航；HELP_GROUPS + section 高亮。 |
| **HelpPanel** | 按 sectionId 渲染 helpContent；section 标题 + block 卡片；faq 含 feedback 区块。 |

### 数据

| 文件 | 用途 |
|------|------|
| **helpSections.ts** | HELP_SECTIONS（14 section id + labelZh/labelEn）、getHelpSections(lang)。 |
| **helpGroups.ts** | HELP_GROUPS（分组 + sections 顺序）。 |
| **helpContent.ts** | 14 section 正文；getHelpContentForLang(sectionId, lang) → title + blocks。 |
| **helpStyles.ts** | Figma 对齐的色板与布局样式。 |

### 入口

- **App → HelpModal**：唯一入口。账户菜单「帮助中心」→ `setHelpCenterOpen(true)`、`setHelpCenterSection(DEFAULT_HELP_SECTION)`。
- 默认 section：**intro**（DEFAULT_HELP_SECTION）。

---

## 禁止写法

- 在 **App.tsx** 内写 Help 内容或 Help 专用 JSX（如 `helpCenterSection === "…"` 分支）。
- 使用 **placeholder** 式 Help（无 getPlaceholderContent、无占位 section）。
- 恢复旧 section id：**quick_start**、**pro_motion_beginner**、**pro_motion_advanced**、troubleshoot、feedback、about 作为主 Help 内容来源。
- 在 App 中增加 helpCenterNav、helpCenterPanel 等 Help 专用样式或内联 Help 布局。

---

## i18n 预留

- **helpContent** 可迁移到 i18n（如 `help.section.*`, `help.block.*`），由 HelpPanel 通过 `t()` 取文案。
- **当前不做**：仍使用 helpContent.ts 内 titleZh/En、block title/text；迁移为后续可选任务。

---

## 文档导出预留

- **helpContent** 可导出为：
  - 项目内 **docs**（如 `docs/help-*.md` 按 section 生成）；
  - **Markdown** 单文件或按 section 分文件；
  - 对外 **网站文档** 或静态站点。
- 当前不实现；仅为扩展点说明。
