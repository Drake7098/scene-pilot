# Help Rewrite Stage 2 Report — 文案重写

**目标**：为 14 个 Help section 撰写完整正式帮助内容，替换 Stage 1 占位，并与模板系统 / billing / rule / prompt / export / template spec 一致。

**本阶段仅写新帮助文案，未改 UI 结构，未删旧内容。**

---

## 1. 已写 section

| # | section id | 中文标题 | 英文标题 | 状态 |
|---|------------|----------|----------|------|
| 1 | intro | 简介 | Introduction | ✅ 已写 |
| 2 | workspace | 工作台 | Workspace | ✅ 已写 |
| 3 | templates | 模板 | Templates | ✅ 已写 |
| 4 | advanced_templates | 高级模板 | Advanced Templates | ✅ 已写 |
| 5 | credits | 积分 | Credits | ✅ 已写 |
| 6 | billing | 计费 | Billing | ✅ 已写 |
| 7 | generation | 生成 | Generation | ✅ 已写 |
| 8 | camera | 镜头与运镜 | Camera | ✅ 已写 |
| 9 | lighting | 布光 | Lighting | ✅ 已写 |
| 10 | director | 导演与风格 | Director | ✅ 已写 |
| 11 | continuity | 连续性 | Continuity | ✅ 已写 |
| 12 | export | 导出 | Export | ✅ 已写 |
| 13 | platform | 平台与模型 | Platform | ✅ 已写 |
| 14 | faq | 常见问题 | FAQ | ✅ 已写 |

**合计：14 / 14 section 已写。**

---

## 2. 每个 section 的 block 数量

| section id | blocks 数量 | 说明 |
|------------|-------------|------|
| intro | 2 | ScenePilotix 是什么；四步流程 |
| workspace | 2 | 层级关系；主要区域 |
| templates | 4 | 什么是模板；family/variant；applyMode；同项目不重复扣费 |
| advanced_templates | 3 | 5 credits 与能力标签；advanced_camera 与 L2；continuity 与 director_preset |
| credits | 3 | 积分是什么；用在哪里；充值包 |
| billing | 3 | 模板费用档位；同项目不重复扣；Free/Pro/Enterprise |
| generation | 2 | 当前生成方式；未来内置生成 |
| camera | 3 | 景别与基础运镜；经典模式；PRO+ 与镜头语言分层 |
| lighting | 2 | time/keyDir/mood；经典模式与导演包 |
| director | 2 | directorPack；与 classicMode、cameraLanguage 关系 |
| continuity | 3 | entryDir/exitDir/inherit；continuityId；连续导出 |
| export | 4 | TXT；Package；Current Scene/Continuity Sequence；Target Model |
| platform | 2 | platformTarget；structureIntensity 与 prompt 格式 |
| faq | 5 | 结果不稳定；冲突；模板收费；生成失败；如何反馈 |

**总 block 数：40。**

---

## 3. 总字数（约）

- **源文件**：`helpContent.ts` 约 23 KB（含结构、键名与中英双语文案）。
- **中文**：约 4 200 字（仅正文 textZh，不含键名与标题）。
- **英文**：约 3 200 词（仅正文 textEn）。
- **块级**：40 个 block，每 block 含 titleZh、titleEn、textZh、textEn；无长段落，均分块。

---

## 4. 内容覆盖与规范对齐

- **intro**：产品定位为「结构化提示词工作台」；四步为创建项目、使用模板、编辑结构、导出提示词；未写生成承诺。
- **templates**：含 template、family、variant、applyMode；明确「模板创建新项目、不修改当前项目」「费用来自 template.cost」「同项目不重复扣费」。
- **advanced_templates**：含 5 credits、advanced_camera、continuity、director_preset、cinematic_mode、L2 camera language；说明高级模板带入隐藏能力、用户见映射标签。
- **credits / billing**：credits 用途（模板 + 未来生成）、充值包 Starter/Standard/Creator、模板 0/3/5 从元数据读取、同项目不重复、Free/Pro/Enterprise。
- **generation**：当前通过平台生成；未来内置生成会消耗 credits。
- **camera / lighting / director**：shot、movement、classic、pro+、camera language 分层；time、keyDir、mood、classic、director pack；directorPack 与 classicMode、cameraLanguage 关系。
- **continuity**：entryDir、exitDir、inheritFromPrevious、continuityId、连续导出。
- **export**：TXT、Package、Current Scene、Continuity Sequence、Target Model。
- **platform**：platformTarget、structureIntensity、prompt 格式。
- **faq**：为何结果不稳定、为何冲突、为何模板收费、为何生成失败、如何反馈；并保留 feedback form（由 HelpPanel 在 faq 下渲染）。

---

## 5. 风险

| 风险 | 说明 | 缓解 |
|------|------|------|
| 与实现细节偏差 | 部分术语（如 applyMode 取值、advancedTags 列表）若后续实现调整，需同步改文案 | 以 docs（template-billing-rules、advanced-template-capability-policy 等）为事实源；实现变更时同步更新 helpContent |
| 长度略长 | 部分 section（如 templates、faq）块数较多，小屏需滚动 | Stage 3 可考虑折叠/手风琴或分组 |
| 未走 i18n | 当前仍为 helpContent 内中英字段，未迁 i18n key | 若后续统一 i18n，可再拆 key 与文案迁移 |

---

## 6. 是否可进入 Stage 3

**可以进入 Stage 3（新 UI 重构）。**

- 14 个 section 的正式文案已全部落盘在 `helpContent.ts`，HelpPanel 已切换为使用 `getHelpContentForLang` 渲染 blocks，占位已替换。
- 内容与当前模板系统、billing、rule、export、template spec 一致；未删除旧内容（legacy 仍保留在 legacyHelpContent.ts）。
- Stage 3 可在此基础上做 UI 重构（Figma、组件拆分、路由预留等），无需再补文案即可验证新 UI。

---

## 7. 修改文件清单

| 文件 | 变更 |
|------|------|
| `src/features/help-center/helpContent.ts` | **新增**。14 section × blocks（titleZh/En, textZh/En），`getHelpContent` / `getHelpContentForLang`。 |
| `src/features/help-center/HelpPanel.tsx` | 改为使用 `getHelpContentForLang`，按 blocks 渲染 section 标题与块标题+正文；保留 faq 的 feedback form。 |
| `src/features/help-center/index.ts` | 导出 `getHelpContent`、`getHelpContentForLang`、`HelpContentBlock`、`HelpSectionContent`。 |
| `docs/help-rewrite-stage2-report.md` | **新增**。本报告。 |

**未删除**：`helpPlaceholders.ts` 仍保留（可作回退或 i18n 迁移前兼容）。

---

**完成时间**：Stage 2 仅完成文案重写与 HelpPanel 接入，未进入 UI 重构，未删除旧内容。
