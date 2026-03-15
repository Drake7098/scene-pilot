# ScenePilot｜收费方案 / 导出设计 / API 接入现状收集（只读）

**目标**：为“画布下方生成导出控制台”方案提供真实代码与结构依据。  
**规则**：只输出结构信息；未改代码；未优化/未重构/未生成 patch；不猜；无则写 unknown；规划未实现则标注 "planned / not implemented"。

---

## 1. Pricing Status

### 1.1 套餐/用户层级（真实存在）

- **free**：已实现。`UserTier = "free" | "member" | "pro"`（`src/types/account.ts`）。默认未订阅为 free。
- **member**：类型存在，`mockAccountStore` 可持久化 `tier === "member"`；UI 仅 `UserManagementPage` 显示“会员”；无独立 member 定价或权益逻辑。**部分实现（类型+展示，无独立套餐逻辑）**。
- **pro**：已实现。`billingService.ts` 中 `PRO_PLAN`（pro_monthly）、`completeMockCheckout` 将 tier 置为 pro、开通 `proConsoleEnabled` 与 `bringYourOwnApiEnabled`，并发放 `monthlyCredits`。
- **enterprise**：未发现。**未实现**。

### 1.2 Credits 体系

- **Credits 是否已实现**：已实现。余额扣减、预留、回滚、发放、流水均有。
- **余额 state 在哪**：
  - 服务端/API：`getWalletState(userId)` → `/api/billing/me` 返回 `credits`；失败则回退 `getWallet(userId)`（`creditService.ts`）。
  - 前端展示：`accountCredits`（App 从 `accountUser.creditsBalance` 或 refresh 后 state）、`BillingOverlay`/`AccountCenterModal`/`PricingPage` 的 credits 展示。
- **扣费逻辑在哪**：
  - `src/services/creditService.ts`：`reserveCredits`、`finalizeReservedCredits`、`rollbackReservedCredits`；可走 API（`/api/billing/credits/reserve|finalize|rollback`）或本地 mock。
  - 模板扣费：`src/features/billing/templateBillingService.ts`（`applyTemplateCharge` 内 `reserveCredits` + `finalizeReservedCredits`）。
  - 提示词导出扣费：App 中 `preparePromptExport` 里 `reserveCredits(..., PROMPT_EXPORT_CREDITS_COST, 'prompt_export_...')`，`settlePromptExport` 里 finalize/rollback。
  - Pro 生成扣费：App `generateProAsset` 中当 `requestedSource === "hosted"` 时 `reserveCredits`，成功则 `finalizeReservedCredits`，失败则 `rollbackReservedCredits`。
- **会消耗 credits 的动作（已接）**：
  - 提示词导出（copy / export prompt）：7 天试用后 2 credits/次（`promptExportPolicy.ts`，`preparePromptExport`）。
  - Pro 工作台“生成”选 hosted：按 `creditCostForProfile` 扣（image_standard 3、image_hq 5、video 5/秒 或 12/秒）（`billingService.ts` HOSTED_ACTIONS）。
  - 使用市场模板（非免费/非 unlimited）：`templateBillingService` 按模板定价扣（0/3/5 等）。
- **仅预留/未真正接上的**：
  - 生成计费写入项目：`generationBillingService.applyGenerationCharge` 明确 “Reserved for backend integration”，return `success: false`。
  - 信用包购买：Paddle 价格 ID 依赖 env（如 `VITE_PADDLE_PRICE_*`）；若未配置则走 mock checkout。

### 1.3 能力受收费影响一览

| 能力 | 是否受收费影响 | 说明 |
|------|----------------|------|
| 生成 | 是 | Pro 工作台 hosted 生成扣 credits；byo 不扣。Quick 结果台本地预览不扣。 |
| 导出 | 是 | 提示词复制/导出：7 天后 2 credits/次（preparePromptExport 预留+扣减）。 |
| 保存为模板 | 否 | 无扣费逻辑。 |
| 使用市场模板 | 是 | 按模板类型扣 0/3/5 credits（templateBillingService）。 |
| 平台适配 | 否 | 平台选择仅影响 prompt 与导出内容，不直接触发扣费。 |
| prompt 导出 | 是 | 同上“导出”。 |
| zip/project 导出 | 否 | 当前无 credits 扣减。 |
| API 调用 | 部分 | “生成”选 hosted 扣 credits；BYO 不扣（真实 API 未接）。 |
| batch | unknown | 结果台有 batchSize 等，未见 batch 单独扣费。 |
| 高级 engine | 否 | 未见按 engine 单独计费。 |

### 1.4 Entitlement / capability 判断位置

- **Plan 判断**：有。`user.tier === "pro"`、`user.proConsoleEnabled`、`user.bringYourOwnApiEnabled`、`user.unlimitedTemplatesEnabled`（`entitlement.ts`、各调用方）。
- **Capability tag**：无独立 tag 系统；能力由上述字段推导。
- **Feature gate**：有。`canUseProConsole`、`canUseHostedGeneration`、`canUseBringYourOwnApi`、`canUseUnlimitedTemplates`、`canPurchaseCredits`、`canOpenCustomerPortal`（`src/utils/entitlement.ts`）。另有 `VITE_PRO_CONSOLE_DEV` 开发覆盖。
- **文件路径**：`src/utils/entitlement.ts`；`src/services/promptExportPolicy.ts`（试用期+单次成本）；模板侧 `template-engine/entitlement/canUseTemplate.ts`、`features/billing/`。

### 1.5 UI 中已体现收费的位置

- **Pricing page**：有。`BillingOverlay`（upgrade / credits 双 tab）、`PricingPage`（积分包购买）。
- **Badge**：有。如 “Current plan” / “Upgrade to Pro”、credits 余额展示。
- **Paywall**：有。`requestProAccess` 会打开账户中心或 billing；进入 Pro 工作台/创建项目等前会调。
- **提示文案**：有。如“提示词导出 7 天免费，之后每次 2 credits”、“Not enough credits”等（BillingOverlay、AccountCenter、preparePromptExport 错误分支）。
- **Disabled 状态**：有。如余额不足时升级按钮、credits 不足时导出/生成引导至 billing。
- **升级引导**：有。Pro 工作台内“升级”入口、账户中心“Pro”/“Credits”tab。

### 1.6 仅文档/规划、未真正实现的收费逻辑

- **已实现**：Pro 订阅与月费积分发放、信用包购买（含 mock）、提示词导出扣费、Pro 生成 hosted 扣费、模板应用扣费。
- **部分实现**：member 层级（类型+展示，无独立套餐）；Paddle 价格 ID 依赖 env，未配置时仅 mock。
- **仅规划**：`applyGenerationCharge`（generationBillingService）；enterprise 层级；未见的“按 engine/batch 计费”等。
- **未实现**：真实 Paddle 生产环境扣款与 webhook 完整闭环（依赖后端与配置）。

---

## 2. Credits / Entitlement

- **Credits 余额**：来自 `getWalletState(userId)`（API 或 mock），前端用 `accountUser.creditsBalance` 及 refresh 后 state。
- **扣费链路**：reserve → 业务执行 → finalize（成功）或 rollback（失败）；prompt 导出、hosted 生成、模板应用均按此模式。
- **Entitlement 集中处**：`entitlement.ts`（canUseProConsole、canUseHostedGeneration、canUseBringYourOwnApi、canUseUnlimitedTemplates 等）；`promptExportPolicy.ts`（试用 7 天 + 2 credits/次）；模板侧 `canUseTemplate`、定价 `getTemplatePricingForTemplate`。

---

## 3. Export Types & Entry Points

### 3.1 当前支持的导出类型

- **copy prompt**：复制当前（或连续序列）最终提示词到剪贴板。已实现。
- **export txt**：下载单文件 prompt.txt。已实现（`downloadQuickPromptFile`）。
- **export zip**：下载“提示词 + 参考图”ZIP（prompt + refs + 说明文件）。已实现（`downloadFlowZipPackage(promptPlusRefsBundle)` 或 同函数 flowBundle）。
- **export project (package)**：目录保存或 ZIP 形式“完整项目包”（含 prompt、README、refs-manifest、参考图等）。已实现（`exportFlowPackage` 或 `downloadFlowZipPackage`）。
- **prompt + refs**：即“导出提示词 + 参考图”，对应上述 ZIP。已实现。
- **其他**：无其他独立导出类型； “Manual workflow copied” 为复制文本流程说明，算复制类。

### 3.2 触发入口

- **Sidebar**：通过 App 传入的 handler（如 onCopyPrompt、onExport 等），最终多落到 `openExportPanel(action)` 或直接 copy/export。
- **ExportPanel**：主逻辑所在；入口为 `openExportAction` + `openExportNonce` 驱动；内部“复制提示词”“导出提示词+参考图”“更多导出” → 下载 prompt.txt / 完整项目包。
- **Pro Workspace**：`handleCopyPrompt`、`onOpenExport`（打开导出）等，均指向同一 ExportPanel 或 openExportPanel("open"|"copy"|"prompt_txt"|"prompt_plus_refs")。
- **Output area**：当前无独立“输出控制台”实体；画布下方为 FeedbackBar + OutputConsolePlaceholder（占位）。无导出按钮在“输出控制台”内。
- **快捷键**：`shortcutActionsRef` 含 copyPrompt、exportProject 等，具体绑定在 App 内；未单独查全键位。
- **其他**：PricingPage、AccountCenter 等有“充值/升级”，无导出类型入口。

### 3.3 每种导出的真实调用链（简要）

- **Copy prompt**：  
  入口：handleCopyPrompt → openExportPanel("copy")。  
  ExportPanel 内：openExportAction===copy 时 guardBeforeExport("copy") → runCopyPrompt（弹复制确认）→ confirmCopyPrompt → copy(quickCopyPrompt)，onPreparePromptExport("pro_copy") 预留 credits，onSettlePromptExport finalize/rollback。  
  最终：clipboard + creditService reserve/settle。

- **Export txt**：  
  入口：handleExportTxt → openExportPanel("prompt_txt")；或 ExportPanel “更多导出” → “下载 prompt.txt” → runOpenSaveModal("prompt_only")，提交时 runExportTxt。  
  ExportPanel：runExportTxt → downloadQuickPromptFile()（Blob prompt.txt 下载），preparePromptExport + settle 同 copy。  
  最终：downloadQuickPromptFile + creditService（若走 prompt export 预留）。

- **Export zip（prompt+refs）**：  
  入口：handleExportZip → openExportPanel("prompt_plus_refs")；或 ExportPanel 主按钮“导出提示词+参考图”。  
  ExportPanel：runExportPromptPlusRefs → downloadFlowZipPackage(promptPlusRefsBundle)。  
  最终：buildZipStored + 下载；当前未对 ZIP 单独扣 credits。

- **Export project (package)**：  
  入口：openExportPanel("open") 打开 ExportPanel，用户选“完整项目包”或由 exportMode 进入 runOpenSaveModal("package")，提交后 exportFlowPackage() 或 downloadFlowZipPackage()。  
  最终：showDirectoryPicker 写目录 或 ZIP 下载；无 credits。

### 3.4 exportScope 当前值

- **current_scene**：已实现。`PromptExportScope = "current_scene" | "continuous_sequence"`（`src/types/export.ts`）。导出/复制仅当前分镜。
- **continuous_sequence**：已实现。仅当 shotPlan === "continuous" 且多镜头时可选（`exportViewModel.availableExportScopes`）；复制/导出为当前镜及后续连续衔接。
- **project**：在 `exportViewModel.buildExportConfigRows` 中作“项目级”展示用；类型上为 "current_scene" | "project" 的 scope 参数；未作为独立 PromptExportScope 枚举值。
- **batch**：未发现作为 exportScope。**未实现**。

### 3.5 平台选择对导出的影响

- **只影响 prompt 文本**：是。平台 preset（platformId）参与 runPromptEngine / buildPromptForScene，决定措辞与结构。
- **影响导出文件结构**：部分。ZIP/目录内文件名含平台名（如 platformForFile）；目录结构一致。
- **影响 zip 内容**：同上；prompt 内容、refs-manifest 与平台相关。
- **影响 refs**：是。maxRefsPerObject、策略等由 platform preset 决定，影响导出 ref 数量与清单。
- **影响命名**：是。zip/目录名含平台 label。
- **影响 engine route**：是。platformId/baseProfile 参与 pipeline，决定 engineId 等；不改变“导出”是否扣费（仅 prompt 复制/导出扣费）。

### 3.6 ExportPanel UI 内容（按区域）

- **整体**：ExportPanel 根节点为 `styles.wrap` 的 div，内为 actionHint + splitLayout；该整块挂在 App 的**隐藏 div**（position:fixed; width:0; overflow:hidden）内，**平时不可见**。仅通过 createPortal 渲染到 body 的 **modal** 可见。
- **左侧（leftColumn）**：标题“结构化提示词展示区”；冲突 badge（冲突数）；只读 prompt 预览（可展开/收起）；Help 图标与说明。
- **右侧（rightColumn）**：标题“生成与导出”；主按钮“复制提示词”“导出提示词+参考图”；“更多导出”下拉 → “下载 prompt.txt”“完整项目包”；PlatformModePanel（平台 + export mode：prompt_only / package）可折叠。
- **Modal**：  
  - 复制确认 modal：复制提示词说明、预览、复制/关闭。  
  - 导出 modal：导出范围（当前分镜/连续序列）、导出方式（prompt_only vs package）、目录/ZIP 说明、提交/关闭；不支持目录时的“复制手动建目录流程”。  
  - 冲突 modal：冲突列表、定位、忽略并继续导出。
- **Conflict 提示**：左侧 conflict badge 点击打开冲突 modal；导出前 guard 检测 sceneConflicts，有冲突则先弹冲突 modal 再继续。

### 3.7 导出动作主次（从代码与入口）

- **最主**：复制提示词（Copy prompt）、导出提示词+参考图（ZIP）。
- **次主**：下载 prompt.txt、完整项目包（目录或 ZIP）。
- **低频/高级**：复制手动建目录流程、冲突后“忽略并继续”。

### 3.8 导出体系中的重复/冲突/历史包袱

- **多入口**：同一动作可从 Sidebar、Pro 工作台、ExportPanel 内多处触发（如 copy、open export、prompt_txt、prompt_plus_refs），但最终汇聚到 ExportPanel 与 openExportPanel。
- **文案重叠**：BillingOverlay、AccountCenter、preparePromptExport 等均有“7 天免费、之后 2 credits”类文案，需保持一致。
- **Old shell**：ExportPanel 主体内容在隐藏 div 中渲染，仅 modal 通过 createPortal 可见，相当于“隐藏挂载、仅弹窗可用”。
- **重复调用**：preparePromptExport 在 copy 与 export txt 都会调，逻辑统一；未发现重复扣费。
- **旧 UI 未清理**：未做全量比对；已知 FeedbackBar 已替代原占位，OutputConsole 仍为占位。

---

## 4. Export Flow Map

- **Copy**：App handleCopyPrompt → openExportPanel("copy") → ExportPanel 根据 openExportAction 触发 guardBeforeExport("copy") → runCopyPrompt → confirmCopyPrompt → copy(quickCopyPrompt) + preparePromptExport + settlePromptExport.
- **Export TXT**：openExportPanel("prompt_txt") 或 更多导出→下载 prompt.txt → runExportTxt → downloadQuickPromptFile + prepare/settle.
- **Export ZIP (prompt+refs)**：主按钮或 openExportPanel("prompt_plus_refs") → runExportPromptPlusRefs → downloadFlowZipPackage(promptPlusRefsBundle).
- **Export project**：openExportPanel("open") 或 更多导出→完整项目包 → runOpenSaveModal("package")，提交后 exportFlowPackage() 或 downloadFlowZipPackage()（无目录时）。

---

## 5. API / Generation Status

### 5.1 是否真的接了外部生成 API

- **已真实接入**：无。Pro 工作台“生成”当前调用 `runPreferredLocalImage` / `runComfyUiVideoPreview`（ComfyUI / Draw Things 本地），未调用 fal/Replicate 等远程 API。
- **仅 preset / 文本适配**：全部平台 preset（universal、fal、midjourney、runway、pika、luma、krea、jimeng、keling、vidu、hailuo、wanx）均用于 prompt 构建与导出内容适配，无对应远程生成调用。
- **未来规划**：hosted 路径已预留扣费与 profile 成本，但实际执行仍是本地；BYO 为 UI 与 flag，无真实“用户 key 调第三方 API”。

### 5.2 “生成”按钮真实行为

- **Pro 工作台**：点击生成 → `generateProAsset(requestedSource)`。若 hosted：先 reserve credits，再执行 `runPreferredLocalImage`（图）或 `runComfyUiVideoPreview`（视频），成功则 finalize，失败则 rollback。若 byo：不扣费，同样跑本地 ComfyUI/Draw Things。即：**均为本地流程，hosted 仅多一步扣费**。
- **Quick 结果台**：本地预览（ComfyUI/Draw Things）或 handoff 包，无远程 API。
- **调用链**：App generateProAsset → credit reserve（hosted）→ runPreferredLocalImage / runComfyUiVideoPreview → appendProAsset → finalize/rollback（hosted）。

### 5.3 平台 preset / adapter

- **全部平台**（platformPresets.ts）：universal, fal, midjourney, runway, pika, luma, krea, jimeng, keling, vidu, hailuo, wanx。
- **说明**：均为 prompt 策略与上传方式（upload-first/prompt-first）、promptStyle（short/long）、maxRefsPerObject、patchId 等；**无真实 API 能力**。
- **图/视频差异**：由 mediaMode 与 engine 决定；平台仅影响 prompt 与导出内容，不区分图/视频 API。
- **与 workspace / mediaMode**：与 Pro/Quick、image/video 在 pipeline 中结合，不改变“无远程 API”的事实。

### 5.4 用户自带 API key

- **State / settings / storage**：有。`ApiCredentialState`（fal、runway 等）、`getApiCredentials` / `setApiCredentials`（mockAccountStore）；`user.bringYourOwnApiEnabled`。
- **UI**：AccountCenterModal section "api"：Pro 用户可填 fal/runway 等配置；非 Pro 显示升级引导。App 内 Pro 工作台有“我的 API”与“费用预览”等 UI。
- **真实使用**：未发现用这些 key 发起生成请求；**仅规划/预留**。

### 5.5 API / generation 与收费耦合

- **生成**：hosted 扣 credits；byo 不扣；本地 ComfyUI/Draw Things 不扣。
- **官方额度 vs 用户 key**：逻辑上“hosted=用官方额度、byo=用户自带”，但 byo 未接真实 API，故未实现区分计费。
- **平台切换**：不影响扣费；仅影响 prompt 与导出。
- **模板使用**：影响；非免费/非 unlimited 模板扣 credits。

### 5.6 预留未完成内容

- **fal**：preset + 账户 API 配置存在；无调用。**planned / not implemented**。
- **replicate**：未发现。**unknown**。
- **comfy / custom**：已实现本地 ComfyUI 调用；custom 未单独区分。**已实现（本地）**。
- **self API**：未发现。**unknown**。
- **BYO API key**：UI 与状态有；未用于真实请求。**planned / not implemented**。
- **batch generation**：结果台有 batchSize；未见 batch 专用 API 或扣费。**部分实现（UI/本地）**。
- **queue / job status**：localGeneration 有 queue handoff JSON；无服务端 job 状态。**仅 handoff 文件，无 job API**。

---

## 6. Platform Adapter Status

- 所有 platform presets 均为 **prompt 适配 + 导出内容/命名**，无远程调用。
- 策略层：nativeStrategy、patchId、baseProfile、uploadMode、promptStyle、maxRefsPerObject 等均作用于 prompt 与导出，不作用于真实 API。

---

## 7. BYO API / User Key Status

- **State**：ApiCredentialState、ProviderApiConfig（fal、runway）、getApiCredentials/setApiCredentials（mockAccountStore）；bringYourOwnApiEnabled。
- **UI**：AccountCenter “AI Providers”；Pro 工作台“我的 API”选项与费用说明。
- **真实调用**：无。**planned / not implemented**。

---

## 8. What will affect OutputConsole

- **画布下“输出控制台”未来一定会受收费影响的按钮/动作**：  
  **Generate**（若接 hosted API）、**Export**（若把“导出”统一进控制台且继续扣 prompt 导出费）、**Copy prompt**（已扣费）、**TXT 导出**（已扣费）、**ZIP/项目包**（当前不扣，若未来计费则受影响）、**Template 使用**（已扣）、**Platform switch**（当前不影响收费）、**Batch**（若未来按次/按量计费则受影响）、**API related**（BYO vs hosted 区分）。
- **必须区分的用户类型**：  
  **免费用户**：提示词导出 7 天后 2 credits/次；无 Pro 工作台/无 hosted 生成。  
  **Pro 用户**：Pro 工作台、hosted 生成扣 credits、BYO 入口、可选 unlimited templates。  
  **企业/定制**：未实现。  
  **用户自带 API**：当前仅 flag；若接入则需“不扣官方 credits”的路径与提示。

---

## 9. Safe to implement now

- **可先做的（UI 先行、逻辑后接）**：  
  - 输出控制台占位内的**静态布局**与**按钮占位**（Generate、Copy、Export TXT/ZIP/Project、Platform、Scope）。  
  - 将现有 **Copy / Export 入口** 从 Sidebar/Pro 工作台**转发**到同一套 handler（不新增扣费逻辑）。  
  - **Platform / Scope** 只读展示（与现有 ExportPanel 状态一致）。  
  - **冲突数量/跳转** 仅展示与跳转，不新增计费。  
  - FeedbackBar 已有“最近操作”与状态行，可继续沿用。

---

## 10. Dangerous to hardcode now

- **不适合先做死的**：  
  - **Generate 按钮**：若写死为“调用 hosted API”或“一定扣 credits”，会与当前本地生成 + hosted 仅扣费逻辑冲突；需保留“hosted vs byo vs 本地”分支。  
  - **统一“导出”扣费**：若在 OutputConsole 把 TXT/ZIP/Project 都做成“一次 2 credits”，会与当前仅 prompt 复制/导出扣费不一致，且 ZIP/package 当前未计费。  
  - **Batch/队列**：若在控制台写死“批量生成扣 N credits”或固定 job 状态 UI，后端与计费未就绪。  
  - **BYO 与 Hosted 文案**：若写死“仅 Pro 可用”或“仅 hosted 扣费”，需与 entitlement 与未来 BYO 接入一致。  
  - **新套餐/新价格**：避免在 UI 写死价格或套餐名；应从 billingService / config 读取。

---

**结束**
