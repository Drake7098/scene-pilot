# Help System Status

> 当前项目中 Help / Guide / Tutorial / Docs / HelpPanel / HelpPage 的完整结构，用于重写帮助内容。  
> 仅结构梳理，未修改代码。

---

## 1. Help 页面入口

| 类型 | 存在 | 路径/说明 |
|------|------|------------|
| **help route** | ❌ 无 | 无独立 `/help` 路由；`main.tsx` 中无 help 相关路由 |
| **help component** | ⚠️ 内联 | 无独立 Help 页面组件；逻辑与 UI 均在 `src/App.tsx` |
| **help panel** | ✅ 有 | 以 **Modal 内右侧面板** 形式存在，样式键 `helpCenterPanel`，在 `App.tsx` 约 4726 行 |
| **help modal** | ✅ 有 | `App.tsx` 中 `helpCenterOpen && createPortal(...)`，约 4678–4926 行；`data-testid`: `help-center-mask`, `help-center-modal` |
| **help sidebar** | ❌ 无 | 无独立 Help Sidebar；仅有 Modal 内左侧 **导航区** `helpCenterNav`（180px 宽，<760px 时单列） |

**触发入口**

- 账户菜单「帮助中心」：`setHelpCenterOpen(true)`、`setHelpCenterSection("quick_start")`  
- 位置：`App.tsx` 约 3403–3404、3437–3438（两处入口）

**相关文件**

- `src/App.tsx`（Help 状态、Modal、导航、各 section 内容与样式）

---

## 2. Help UI 使用的组件

| 名称 | 存在 | 说明 |
|------|------|------|
| **HelpPage** | ❌ | 不存在独立页面组件 |
| **HelpPanel** | ⚠️ | 无独立组件；Modal 内右侧内容区使用 style 键 `helpCenterPanel` |
| **HelpModal** | ⚠️ | 无独立组件；通过 `createPortal(..., document.body)` 渲染，使用 `modalMask` + `modal` |
| **HelpSidebar** | ❌ | 无；仅有 `helpCenterNav` 作为 Modal 内左侧导航 |
| **HelpContent** | ❌ | 无独立组件；内容按 `helpCenterSection` 分支直接写在 App 中 |
| **HelpSection** | ❌ | 无；section 以条件块 `helpCenterSection === "xxx"` 渲染 |
| **HelpItem** | ❌ | 无 |

**实际使用的样式键（均在 `App.tsx` `styles` 对象中）**

- `helpCenterHead`、`helpCenterBody`、`helpCenterNav`、`helpCenterNavBtn`、`helpCenterNavBtnOn`、`helpCenterPanel`
- `tutBlockTitle`、`tutText`、`tutSectionBlock`、`tutSectionTitle`、`tutMotionGrid`、`tutMotionItem`、`tutMotionTitle`、`tutMotionText`
- `modalMask`、`modal`、`modalTitle`、`modalIconBtn`、`modalText`、`modalBtns`、`modalBtn`、`modalBtnGhost`
- `feedbackTpl`、`feedbackTplLine`、`feedbackArea`

---

## 3. Help 内容来源

| 来源 | 使用情况 | 路径 |
|------|----------|------|
| **hardcoded** | ✅ 主要 | `App.tsx` 内联中英字符串：quick_start、export、troubleshoot、feedback、about 全文；以及各 section 标题 |
| **markdown** | ❌ | 未使用 |
| **json** | ❌ | 未使用 |
| **ts config** | ❌ | 未使用 |
| **cms** | ❌ | 未使用 |
| **docs folder** | ❌ | `docs/` 为项目文档，Help 未引用 |

**TS 内容模块（非 hardcoded 的“数据”来源）**

- `src/content/proCreativeModes.ts`
  - `beginnerCreativeTutorialBlocks(lang)`：新手教程 3 条
  - `advancedCreativeTutorialBlocks(lang)`：进阶教程 3 条
  - `getVideoClassicModes()`：视频经典模式列表（约 12 条）
  - `getImageClassicModes()`：图片经典模式列表（约 6 条）
  - `IMAGE_PRO_CATEGORIES`、`getImageProEffectsByCategory(category)`：专业图片分类与效果
- `src/content/proCameraPresets.ts`
  - `PRO_PLUS_MOTION_CATEGORIES`、`getVisibleVideoProPlusPresets(category)`：PRO+ 镜头分类与预设

---

## 4. 当前 Help 文案结构（章节标题）

**Section ID 与导航标签（`helpSections`，App.tsx 约 3494–3501）**

| 顺序 | id | 中文 label | 英文 label |
|------|-----|------------|------------|
| 1 | quick_start | 快速开始 | Quick Start |
| 2 | pro_motion_beginner | 新手教程 | Beginner Motion |
| 3 | pro_motion_advanced | 进阶专业教程 | Advanced Motion |
| 4 | export | 导出说明 | Export Guide |
| 5 | troubleshoot | 排错 | Troubleshooting |
| 6 | feedback | 反馈 | Feedback |
| 7 | about | 关于 | About |

**各 section 内容块标题（正文内）**

- **quick_start**：快速开始 / Quick Start（单段 4 步）
- **pro_motion_beginner**：新手教程：先用经典模式；3 条 tutorial block 标题；视频经典模式（网格）；图片经典模式（网格）
- **pro_motion_advanced**：进阶专业教程：PRO+ 与专业图片；3 条 tutorial block 标题；PRO+ 各分类名（叙事语法、转场时空、心理效果、材质超现实、角色身体感）；专业图片各分类名（构图语法、关系表达、空间层次、材质效果、情绪氛围）
- **export**：导出说明 / Export Guide（单段：提示词 TXT、Package Export、Current Scene、Continuity Sequence、Target Model）
- **troubleshoot**：排错顺序 / Troubleshooting Order（3 条）
- **feedback**：反馈 / Feedback（说明 + 联系渠道 + 模板 + 输入框 + 复制/发送）
- **about**：关于 / About（ScenePilotix 简介、版本、客服/商务/系统通知）

---

## 5. 是否支持多语言

| 项目 | 情况 |
|------|------|
| **zh** | ✅ 有，通过 `lang === "zh"` 分支 |
| **en** | ✅ 有，同上 |
| **i18n** | ❌ Help 内容**不走** i18n；全部为 App 与 content 中的 `lang === "zh" ? "中文" : "English"` |
| **i18n 中与 Help 相关** | 仅有 `sidebar.showModeDiff`: "Mode Help"（`src/i18n.ts` / `src/i18n.js`），非帮助中心正文 |

---

## 6. Figma 参考

- **设计参考文件**：`/Users/dk/scene-pilot/src/design-reference/figma/app.tsx`
- **Help UI 是否使用该文件**：❌ **未使用**  
  - 该文件中无 Help Center / 帮助中心 / help 相关 layout 或 section；检索仅命中无关的 “Grid Helper”。
- **当前 Help 布局**：完全由 `App.tsx` 内 `styles`（如 `helpCenterHead`、`helpCenterBody`、`helpCenterNav`、`helpCenterPanel`）与内联 width/maxHeight 控制，无 Figma 设计稿对应。

---

## 7. Help 是否分模式

| 模式 | 是否存在 |
|------|----------|
| **quick mode help** | ❌ 无单独 quick 模式帮助 |
| **pro mode help** | ⚠️ 内容偏 Pro：新手/进阶教程均为 Pro 侧经典模式与 PRO+、专业图片；无“按工作台模式切换”的 UI |
| **template help** | ❌ 无模板专用章节 |
| **workspace help** | ❌ 无工作台/workspace 专用章节 |

当前为**单一帮助中心**，入口固定打开 `quick_start`，无按 quick/pro/template/workspace 切换的 tab 或内容分支。

---

## 8. 模板相关帮助是否存在

在 Help 内容中检索以下主题：

| 主题 | 存在 | 说明 |
|------|------|------|
| **template** | ❌ | 无“模板”章节或段落 |
| **family** | ❌ | 无 |
| **variant** | ❌ | 无 |
| **applyMode** | ❌ | 无 |
| **credits** | ❌ | 无 |
| **billing** | ❌ | 无 |
| **advanced template** | ❌ | 无 |
| **continuity** | ⚠️ 仅提及 | 仅在 **Export** 章节中作为导出范围选项：“Continuity Sequence（连续序列）” |
| **camera language** | ⚠️ 间接 | 无独立“镜头语言”章节；**进阶专业教程**中涉及“镜头语言和专业图片效果”“导演包和镜头语言”等表述，来自 `advancedCreativeTutorialBlocks` |

**结论**：无模板/计费/credits/家族/变体/应用模式等专门帮助；continuity 与 camera language 仅在导出与进阶教程中顺带出现。

---

## 9. 当前帮助是否过长

| 指标 | 数值 |
|------|------|
| **section 数量** | **7**（quick_start, pro_motion_beginner, pro_motion_advanced, export, troubleshoot, feedback, about） |
| **总行数（约）** | Help 内容与 UI 在 App.tsx 约 **4726–4922** 行（含 JSX），纯正文若按中英各算一段约 **200+ 行** 级别；按“可读段落+列表项”粗算约 **150–250 行** 等效正文 |
| **最大 section** | **pro_motion_advanced**：3 条 tutorial + 5 个 PRO+ 分类（每类多条预设）+ 5 个专业图片分类（每类多条效果），条目总数最多，滚动最长 |

**粗略体感**：quick_start、export、troubleshoot、about 较短；pro_motion_beginner 中等（经典模式两表）；pro_motion_advanced 明显最长，易造成单页信息量过大。

---

## 10. 问题列表（供重写参考）

1. **无独立路由**：Help 仅以 Modal 呈现，无法直接链接到某一 section，不利于分享与 SEO。
2. **无独立组件**：全部写在 App.tsx，难以复用、测试和按 section 拆分维护。
3. **内容来源混杂**：既有 App 内 hardcoded 长串，又有 content 模块的 TS 数据，重写时需统一来源策略（如 markdown/json/ts 之一）。
4. **未走 i18n**：中英通过 `lang === "zh"` 分支维护，扩展语言或修改文案成本高。
5. **Figma 未覆盖**：Help 布局无设计稿引用，重写时需补设计或明确以代码为准。
6. **无模式/场景拆分**：无 quick/pro/template/workspace 分层，无法按使用场景精简内容。
7. **模板/计费帮助缺失**：template、family、variant、applyMode、credits、billing 无专门说明；continuity 仅出现在导出说明中。
8. **进阶 section 过长**：pro_motion_advanced 条目多，建议拆段、折叠或分页以降低单屏负担。
9. **无障碍与测试**：仅有少量 data-testid（help-center-mask, help-center-modal, help-center-tab-*），section 内容区无 testid，重写时可一并补全。

---

**文档生成时间**：基于当前代码库静态梳理，未执行任何代码修改。
