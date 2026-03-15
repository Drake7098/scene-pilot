# Help Rewrite Plan V2

基于 `docs/help-system-status.md` 与相关产品/计费/模板/规则文档，重新设计 Help 系统结构，用于支持：template system、credits、billing、advanced template、workspace、rule engine、prompt engine、export、platform、future generation。

**本任务只生成重构方案，不修改代码。**

---

## 参考文档

| 文档 | 用途 |
|------|------|
| docs/help-system-status.md | 当前 Help 结构、组件、章节、来源、语言、问题 |
| docs/credits-pricing-page-spec.md | 价格方案、Credit 包、模板费用、FAQ |
| docs/template-billing-rules.md | 模板计费规则、applyMode 与 cost、无永久解锁 |
| docs/billing-system-v1.md | 计费概览、按次扣费、项目 billing meta、生成扣费预留 |
| docs/template-spec-schema-v1.md | 模板规格 familyId/variantId、sceneSpec、continuity、applyMode |
| docs/template-payload-schema-v2.md | spec→payload 映射、cameraLanguage、continuity、apply 范围 |
| docs/rule-matrix-v1.md | 规则引擎互斥、层级、模板约束、自动规范化 |
| docs/advanced-template-capability-policy.md | 5 credits 能力、高级模板定义、L2 不直接暴露 |
| docs/phase-1-template-authoring-policy.md | 模板编写规则、规范字段、引擎编译、L2 映射 |

---

## 1. 新 Help 结构

建议 **section 列表**（全部）：

| 顺序 | section id | 中文 label（建议） | 英文 label（建议） | 说明 |
|------|------------|-------------------|--------------------|------|
| 1 | intro | 简介 | Introduction | 产品目标、4 步概览、与旧 quick_start 合并 |
| 2 | workspace | 工作台 | Workspace | Pro 工作台、项目/分镜/对象层级、侧栏与顶栏 |
| 3 | templates | 模板 | Templates | 模板库、family/variant、选用与费用概念 |
| 4 | advanced_templates | 高级模板 | Advanced Templates | 5 credits 能力、L2/continuity/director、标签含义 |
| 5 | credits | 积分 | Credits | 积分获取、充值包、用途（模板+未来生成） |
| 6 | billing | 计费 | Billing | 按次计费、同项目不重复扣、免费模板、订阅与充值入口 |
| 7 | generation | 生成 | Generation | 当前图片/视频生成入口、未来生成费用预留说明 |
| 8 | camera | 镜头与运镜 | Camera | 景别、基础运镜、经典模式、PRO+ 与镜头语言概念 |
| 9 | lighting | 布光 | Lighting | 时间/主光方向/氛围、经典与导演包携带的布光 |
| 10 | director | 导演与风格 | Director | 导演包、与镜头/布光分工、经典模式 |
| 11 | continuity | 连续性 | Continuity | 多镜衔接、entryDir/exitDir、continuityId、导出连续序列 |
| 12 | export | 导出 | Export | 提示词 TXT、Package、当前分镜/连续序列、目标模型 |
| 13 | platform | 平台与模型 | Platform | 目标模型、平台适配、结构强度与文案差异 |
| 14 | faq | 常见问题 | FAQ | 排错顺序、反馈入口、关于与联系方式（合并旧 troubleshoot + feedback + about） |

**合计：14 个 section。**

---

## 2. 删除旧 section

| 旧 section id | 处理 | 说明 |
|---------------|------|------|
| **quick_start** | **合并 → intro** | 4 步内容并入 intro；intro 增加产品一句话目标，保留“创建项目→搭结构→编对象→导出验证” |
| **pro_motion_beginner** | **重写并拆分** | 内容拆入 **camera**（经典模式、新手先调基础）、**director**（导演包与镜头分工）、**workspace**（创作输入放哪里）；不再保留独立“新手教程”section |
| **pro_motion_advanced** | **重写并拆分** | PRO+ 与专业图片说明并入 **camera**（PRO+ 只放基础层没有的语法）、**director**（导演包与镜头语言分工）、**lighting**（专业图片效果）；冲突项说明并入 **faq** 或 **camera** |
| **export** | **保留并扩展** | 保留为 **export**；补充 Package、Current Scene、Continuity Sequence、Target Model 的清晰说明，与 continuity、platform 交叉引用 |
| **troubleshoot** | **合并 → faq** | 排错顺序（先冲突→对象数量/位置→风格光照）作为 FAQ 第一条或“排错”子块 |
| **feedback** | **合并 → faq** | 反馈渠道、模板、发送/复制保留在 faq 底部或独立“反馈”子块 |
| **about** | **合并 → faq** | 关于 ScenePilotix、版本、客服/商务/系统通知放入 faq 末尾 |

**总结**

- **保留并扩展**：export → 新 export。
- **合并**：quick_start → intro；troubleshoot、feedback、about → faq。
- **重写并拆分**：pro_motion_beginner、pro_motion_advanced → camera、lighting、director、workspace、faq。

---

## 3. 新模板帮助

**必须新增的 section 及内容目录：**

### templates（模板）

- 什么是模板：一键带入分镜结构、镜头、布光、对象骨架。
- **Template family**：模板家族（如 dialogue_duo、crane_motion），同一 family 下多 variant。
- **Variant**：变体（如 free_starter、basic_close、advanced_motion、cinematic），决定能力与费用档位。
- 从哪里选模板：模板库入口、筛选（图片/视频、家族、变体）。
- **applyMode**（应用模式）：layout_only / layout_plus_style / full_workflow；只影响写入范围，**不改变单次费用**（同 template-billing-rules）。
- 应用后：新项目创建，同一项目内重复应用同一模板不重复扣费。

### advanced_templates（高级模板）

- 什么是高级模板：5 credits、含 advanced_camera / continuity / director_preset / cinematic_mode / drama_mode 等能力。
- **Advanced template** 定义：variant 为 multi_object 或 advanced_motion，或 category=continuous；可写入 L2 camera_language、pro_plus、directorPack。
- 高级标签含义：advanced_camera、advanced_lighting、director_preset、continuity、multi_scene、cinematic_mode、drama_mode、anime_mode（与 advanced-template-capability-policy 一致）。
- L2 镜头语言：模板带入，用户只看到 L1 映射标签，不直接暴露 L2 id。

### continuity（连续性）

- 多镜连续性：entryDir/exitDir、继承上一镜、转场类型。
- **Continuity** 模板：domain=webdrama 或 anime，entryDir/exitDir、@continuityId 锚点；不可随意删除 continuityId。
- 导出：Continuity Sequence 导出当前镜及后续连续镜，用于验证衔接。

### credits（积分）— 见下节“新收费帮助”

- **Credits usage**：模板应用（按 template cost）；未来生成（图片/视频）按次扣费；同项目同模板不重复扣。

**新模板帮助内容目录汇总**

| 主题 | 所在 section | 内容要点 |
|------|--------------|----------|
| template | templates | 定义、family、variant、从哪里选、应用结果 |
| template family | templates | 家族与变体关系 |
| variant | templates + advanced_templates | 变体决定能力与费用；高级变体 multi_object/advanced_motion |
| applyMode | templates | layout_only / layout_plus_style / full_workflow，不改变费用 |
| continuity | continuity | 多镜衔接、entryDir/exitDir、continuityId、连续模板 |
| advanced template | advanced_templates | 5 credits 能力、标签、L2 不暴露 |
| credits usage | credits | 模板扣费 + 未来生成扣费、同项目不重复 |

---

## 4. 新收费帮助

**必须新增的 section 及内容目录：**

### credits（积分）

- 积分是什么：用于模板应用与（未来）图片/视频生成。
- 如何获取：充值购买；Pro 订阅可能含额度（依产品）。
- 充值包：Starter $3/20、Standard $8/60、Creator $18/160（与 credits-pricing-page-spec 一致）。
- **Credits usage**：模板按次（3 或 5）；生成（未来）；同项目同模板不重复扣。

### billing（计费）

- **Pricing** 概览：Free / Pro / Enterprise 分层（与 credits-pricing-page-spec 一致）。
- **Template cost**：免费 0、Standard 3、Premium/continuous/advanced 5；从模板元数据读取，不写死。
- **Generation cost**：未来生成费用说明（预留，与 billing-system-v1 一致）。
- **Pro plan**：Pro 权益、额度、升级入口。
- **Enterprise**：团队协作、定制，联系商务。

### 新收费帮助内容目录汇总

| 主题 | 所在 section | 内容要点 |
|------|--------------|----------| 
| credits | credits | 定义、获取、充值包、用途 |
| pricing | billing | Free/Pro/Enterprise、价格页入口 |
| template cost | billing + credits | 0/3/5、按模板元数据、同项目不重复 |
| generation cost | billing + generation | 未来按次、与模板分开 |
| pro plan | billing | Pro 权益、升级 |
| enterprise | billing | 企业方案、联系 |

---

## 5. UI 结构

新 Help UI **必须支持**以下能力：

| 能力 | 说明 | 实现要点 |
|------|------|----------|
| **Sidebar sections** | 左侧为 section 导航，可分组 | 14 个 section 可分组：入门(intro, workspace)、模板(templates, advanced_templates)、计费(credits, billing)、创作(camera, lighting, director, continuity)、导出与平台(export, platform)、其他(faq)。或扁平列表；宽度建议 180–200px，与现有 helpCenterNav 一致或略增。 |
| **Scroll panel** | 右侧内容区可独立滚动 | 单一面板，按当前选中的 section 渲染内容；内容区 overflow-y: auto，最大高度受 modal 约束；支持锚点或子标题（为 future route 预留）。 |
| **Modal** | 当前入口仍为 modal | 保留 createPortal 到 body 的 modal；尺寸建议 min(860px, 100vw-32px)，maxHeight min(85vh, 800px)；内部布局：header + (sidebar + scroll panel)。 |
| **Future route support** | 为后续独立路由预留 | section id 与 URL 可映射，例如 `/help`, `/help#templates`；当前可先不实现路由，但 **数据结构与 section id 稳定**，便于后续加 Router 与 history 同步；组件化后便于在独立页面复用手风琴或同布局。 |

**建议组件拆分（供 Step3 实现）**

- `HelpModal`：遮罩 + 容器 + 关闭，内部包含 `HelpLayout`。
- `HelpLayout`：左侧 `HelpSidebar`（sections 列表/分组）+ 右侧 `HelpPanel`（scroll 容器）。
- `HelpPanel`：接收 `sectionId`，渲染对应 `HelpSectionContent`。
- `HelpSectionContent`：按 section id 映射到 14 个内容组件或一份 content 配置 + 通用渲染器；内容来源见“内容长度控制”与“多语言策略”。

---

## 6. Figma 对齐

| 选项 | 建议 | 说明 |
|------|------|------|
| **新增 Help layout** | 建议 **新增** | 当前 `src/design-reference/figma/app.tsx` 无 Help 区块；重做 Help 时应在 Figma 中新增 Help Center 布局（含 sidebar + 内容区、标题层级、正文/列表样式），并同步到 `design-reference/figma/app.tsx` 或单独 `help.tsx`，作为单一事实源。 |
| **沿用当前 modal** | 可沿用 **交互形式** | 仍为 modal 弹出、左侧 nav + 右侧 panel；尺寸与层级可微调，但不必推翻 modal 形态。 |

**结论**：**沿用当前 modal 交互形态**，但 **在 Figma 中新增 Help 专用 layout**，并在设计参考中体现，避免继续“无设计稿”状态。

---

## 7. 多语言策略

| 选项 | 建议 | 说明 |
|------|------|------|
| **继续 lang === "zh"** | 短期可保留 | 实现快，与现有 App 一致；缺点：扩展语言难、文案散落、与 i18n 其余 key 不统一。 |
| **迁移 i18n** | **推荐** | 将 14 个 section 的 label 与正文迁入 i18n（如 `help.section.intro`, `help.content.intro.title`, `help.content.intro.body`）；zh/en 两套；后续加语言只加文件。与 AGENTS.md“页面文案只允许短标签…解释式内容进帮助中心”一致，且帮助中心即解释式内容，适合集中用 i18n 管理。 |

**结论**：**推荐迁移 i18n**。Step2 新文案产出时按 i18n key 产出，Step5 接入时用 `t('help.section.templates')` 等；若资源紧张，可 Step2 先写死中英，Step5 再抽 key 迁入 i18n。

---

## 8. 内容长度控制

| 层级 | 建议最大长度 | 说明 |
|------|--------------|------|
| **单 section 正文** | **约 80–120 行等效**（或约 600–900 词中英） | 超过则拆子 section 或折叠“进阶说明”；避免单 section 如旧 pro_motion_advanced 过长。 |
| **子块/子标题** | 每块 **约 15–25 行** | 如“什么是模板”“applyMode 说明”各一小块。 |
| **列表项** | 每条 **1–2 句** | 如 FAQ 每条先结论再一句解释；避免长段。 |
| **全 Help** | **14 section × 约 80 行 ≈ 1120 行等效上限** | 实际可更短，intro/faq 等可 40–60 行。 |

**特别约束**

- **camera**：经典模式/PRO+ 可保留“网格/列表”展示，但单类下条目用“标题+一句描述”，总长控制在该 section 上限内；必要时“经典模式”与“PRO+ 与专业图片”拆成两个子 section 或折叠。
- **faq**：排错、反馈、关于合并后仍控制在一屏可扫完的条数（建议约 8–12 条）。

---

## 9. 重构顺序

| 步骤 | 名称 | 内容 | 产出 |
|------|------|------|------|
| **Step1** | 新结构 | 在代码中定义新 14 section id 与 label（可先写死或 i18n stub）；删除/重命名旧 section id；`helpSections` 或等价配置改为新列表；**不**删除旧内容块，仅切换为“按新 id 渲染空壳或占位”。 | 新 section 列表生效、入口仍打开 modal、新 section 可点但内容可为占位。 |
| **Step2** | 新文案 | 按 1–4 节撰写 14 个 section 的完整中英文案（含模板、计费、continuity、camera/lighting/director、export、platform、faq）；长度遵守 8 节；决定落盘形式（i18n 或 ts/markdown）。 | 新文案定稿与内容源文件。 |
| **Step3** | 新 UI | 抽离 HelpModal / HelpLayout / HelpSidebar / HelpPanel；sidebar 支持 14 section（及可选分组）；panel 按 sectionId 渲染；Figma 新增 Help layout 并同步设计参考。 | 可复用的 Help 组件、Figma 与 design-reference 更新。 |
| **Step4** | 删除旧 Help | 移除 App 内旧 7 section 的内容块与旧 id；删除对 beginnerCreativeTutorialBlocks / advancedCreativeTutorialBlocks 等在 Help 内的直接网格渲染（若不再需要）；保留或迁移 feedback 提交/复制逻辑到 faq。 | App 中无旧 help section 内容、无重复入口。 |
| **Step5** | 接入新 Help | 将 Step2 内容接入 Step3 组件；若选 i18n，则接入 t()；入口仍为账户菜单“帮助中心”，默认 section 建议 intro；可选 hash 支持如 `#templates` 便于日后路由。 | 新 Help 上线、14 section 全部可读、多语言若已迁则生效。 |

**依赖关系**：Step1 → Step2；Step1 可与 Step3 并行；Step3 不依赖 Step2 内容细节；Step4 依赖 Step1+Step3（新结构+新 UI 已存在）；Step5 依赖 Step2+Step3+Step4。

---

## 10. 输出总结

| 问题 | 结论 |
|------|------|
| **是否可以开始 Help 重构？** | **可以。** |

**理由简述**

- 当前 Help 问题已在 help-system-status 中厘清；新结构（14 section）覆盖 template、credits、billing、advanced template、workspace、rule engine（通过 faq/camera/director 解释）、prompt engine（通过 generation、export、platform）、export、platform、future generation。
- 旧 section 均有明确去向（合并/重写/拆分）；新模板与收费帮助目录已列出，且与 credits-pricing-page-spec、template-billing-rules、billing-system-v1、advanced-template-capability-policy、template-spec、rule-matrix 对齐。
- UI 保持 modal + sidebar + scroll panel，并预留路由；Figma 建议新增 Help layout；多语言建议迁 i18n；内容长度有上限，避免单 section 过长。
- 重构顺序清晰：先新结构 → 新文案 → 新 UI → 删旧 Help → 接入新 Help，可分批落地。

**建议**：先执行 Step1（新结构 + 占位），再 Step2（文案）与 Step3（组件 + Figma）并行，随后 Step4、Step5 收尾。

---

**文档版本**：V2  
**生成时间**：基于上述参考文档与 help-system-status 静态梳理，未修改任何代码。
