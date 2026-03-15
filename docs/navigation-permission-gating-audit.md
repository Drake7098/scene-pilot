# ScenePilot｜全项目跳转与权限门控审计（只读）

**目标**：排查所有与登录/注册、升级/充值、账户中心、生成、导出、Pro 工作台及未登录/无权限/余额不足 fallback 相关的跳转与门控路径。  
**禁止**：改代码、优化、重构、生成 patch。未确认处标注 unknown；旧逻辑/已废弃仍被调用的明确标注。

---

## 1. Global navigation entry points

### 1.1 window.location.assign

| 文件 | 位置/上下文 | 触发条件 | 最终去向 |
|------|--------------|----------|----------|
| src/services/authService.ts | signInWithGoogle() 内 | 用户点击 Google 登录 | Supabase auth 授权 URL，redirect 回当前页带 `?auth_provider=google` |
| src/App.tsx | post-auth redirect useEffect | accountUser 存在且 postAuthRedirect 非空 | postAuthRedirect 规范化后的 URL（如 /app） |
| src/App.tsx | 账户菜单 "用户管理" | 已登录用户点击 | /account |
| src/App.tsx | 账户菜单 "升级会员" | 已登录或未登录用户点击 | /pricing |
| src/App.tsx | 未登录时账户菜单 "升级会员" | 未登录用户点击 | /pricing |

### 1.2 openBillingPage(page: "upgrade" \| "credits")

**定义**：App.tsx ~1457，`setBillingPage(page)`，无路由跳转；打开 BillingOverlay 的 upgrade 或 credits 标签。

| 调用文件 | 函数/上下文 | 触发条件 | 最终去向 |
|----------|-------------|----------|----------|
| App.tsx | generateProAsset (hosted) | requestedSource === "hosted" && !canUseHostedGeneration(accountUser) | BillingOverlay upgrade（**未先判断 accountUser，未登录也会进**） |
| App.tsx | generateProAsset (hosted, credits) | accountUser 存在且 accountCredits < cost | BillingOverlay credits |
| App.tsx | handleUseTemplateFromWorkspace | !canUseProConsole(accountUser) && 模板需 pro_credits | BillingOverlay upgrade（**未登录也会进**） |
| App.tsx | handleUseTemplateFromWorkspace | 模板需扣费且 accountCredits < 价格 | 先 setTemplateCreditsInsufficientOpen，用户点「购买」→ openBillingPage("credits") |
| App.tsx | handlePurchaseCredits | !accountUser → openAccountCenter("auth"); !billingRuntimeEnabled 或 !billingLegalAccepted | openBillingPage("credits") |
| App.tsx | handleUpgradePro | !accountUser → openAccountCenter("auth"); 否则同上 | openBillingPage("upgrade") |
| App.tsx | handleOpenCustomerPortal | !accountUser → auth; !canOpenCustomerPortal 或 !billingRuntimeEnabled 或 catch | openBillingPage("upgrade") |
| App.tsx | generateResultPlan | !canUseHostedGeneration(accountUser) | BillingOverlay upgrade（**未先判断 accountUser**） |
| App.tsx | generateResultPlan | accountCredits < cost | openNotEnoughCredits + BillingOverlay credits |
| App.tsx | refineResultPlan | 同上两段 | 同上 |
| App.tsx | 账户菜单 "充值 Credits" | 已登录用户点击 | BillingOverlay credits |
| App.tsx | 未登录账户菜单 | 无「充值」项（仅升级/帮助） | — |
| App.tsx | BillingOverlay onOpenUpgrade/onOpenCredits | 切换 tab | 仅切 BillingOverlay 内 tab |
| App.tsx | insufficientCredits 弹窗 "Buy credits" | 用户点击 | BillingOverlay credits |
| App.tsx | templateCreditsInsufficient 弹窗 "购买 Credits" | 用户点击 | BillingOverlay credits |
| App.tsx | Pro 右栏 "升级" 按钮 | onClick | BillingOverlay upgrade |
| App.tsx | BillingOverlay 传入 | onOpenUpgrade / onOpenCredits | 同上 |
| App.tsx | InsufficientCreditsModal 等 | 见上 | 同上 |

### 1.3 openAccountCenter(section)

**定义**：App.tsx ~1446，若 !accountUser 会重置 auth 相关 state，然后 setAccountCenterSection(section)、setAccountCenterOpen(true)。最终打开 AccountCenterModal。

| 调用文件 | 函数/上下文 | 触发条件 | 最终去向 |
|----------|-------------|----------|----------|
| App.tsx | generateProAsset (BYO) | !accountUser | AccountCenterModal section "auth" |
| App.tsx | generateProAsset (BYO) | !canUseBringYourOwnApi(accountUser) 或 !resolveByoProviderForMedia | AccountCenterModal section "api" |
| App.tsx | handlePurchaseCredits / handleUpgradePro | !accountUser | AccountCenterModal "auth" |
| App.tsx | handleOpenCustomerPortal | !accountUser | AccountCenterModal "auth" |
| App.tsx | preparePromptExport | !accountUser | AccountCenterModal "auth" |
| App.tsx | requestProAccess | !canUseProConsole(accountUser) | AccountCenterModal section（默认 "pro"） |
| App.tsx | enterProWorkspace | !canUseProConsole(accountUser) | AccountCenterModal "pro" |
| App.tsx | BillingOverlay onRequireAuth | 由 BillingOverlay 内部调用 | AccountCenterModal "auth" |
| App.tsx | BillingOverlay onManageBilling | !accountUser | AccountCenterModal "auth" |
| App.tsx | 账户菜单 "账户中心" | 已登录点击 | AccountCenterModal "overview" |
| App.tsx | 账户菜单 "登录/注册" | 未登录点击 | AccountCenterModal "auth" |
| App.tsx | 账户菜单 "自带 API" | 已登录且 canUseBringYourOwnApi 点击 | AccountCenterModal "api" |

### 1.4 requestProAccess(section?)

**定义**：App.tsx ~1691。若 canUseProConsole(accountUser) 则 enterProWorkspace() 并返回 true；否则 openAccountCenter(section ?? "pro")，返回 false。

| 调用文件 | 位置 | 触发条件 | 最终去向 |
|----------|------|----------|----------|
| App.tsx | requestNewProject | 无未保存库变更且 !requestProAccess("pro") | AccountCenterModal "pro" |
| App.tsx | createNewProjectAfterSave | 保存成功后 !requestProAccess("pro") | AccountCenterModal "pro" |
| App.tsx | openProWizardFromResults | !requestProAccess("pro") | AccountCenterModal "pro" |

### 1.5 handleOpenCustomerPortal()

**定义**：App.tsx ~1870。若 !accountUser → openAccountCenter("auth")；若 !canOpenCustomerPortal(accountUser) 或 !billingRuntimeEnabled 或 openCustomerPortal 抛错 → openBillingPage("upgrade")；成功则 window.open(portal.url)。

| 调用文件 | 位置 | 触发条件 | 最终去向 |
|----------|------|----------|----------|
| App.tsx | 账户菜单 "管理订阅" | 已登录用户点击 | 上述逻辑（未登录→auth；无权限/异常→upgrade；成功→新开 Paddle portal） |
| App.tsx | BillingOverlay onManageBilling | 同上（内部先判 accountUser） | 同上 |

### 1.6 setBillingOpen / setAccountCenterOpen / setHelpCenterOpen / setAccountMenuOpen

- **setBillingOpen**：未在代码库中搜索到（仅存在 setBillingPage）。
- **setAccountCenterOpen**：App.tsx 定义，仅通过 openAccountCenter 等间接设为 true；关闭在 AccountCenterModal/onClose 等处设为 false。
- **setHelpCenterOpen**：App.tsx 定义，账户菜单「帮助中心」点击设为 true。
- **setAccountMenuOpen**：App.tsx 定义，顶部账户按钮点击切换；各菜单项 onClick 内 close 并执行对应跳转/打开。

### 1.7 navigate(

未在 src 中发现 React Router 式 `navigate(` 调用；路由级跳转主要依赖 window.location.assign / replace（main.tsx 中为 window.location.replace）。

---

## 2. Generate click chains

### 2.1 生成按钮入口与真实点击链路

| 入口 | 文件/组件 | 绑定 | 点击后调用链 |
|------|------------|------|--------------|
| OutputConsole 生成按钮 | OutputConsole.tsx | onGenerate() | App 传入 generateProAsset → generateProAsset() |
| 右栏旧生成按钮 (ProWorkspaceShell bottomSlot) | App.tsx | onClick={() => void generateProAsset()} | generateProAsset() |
| 右栏旧生成按钮 (非 Pro 布局) | App.tsx | onClick={() => void generateProAsset()} | generateProAsset() |
| ProWorkspaceShell → ExportControlPanel → ExportGenerateSection | ExportGenerateSection.tsx | onGenerate | App 传入 onGenerate → generateProAsset |
| 资产卡片「继续生成」 | App.tsx | onClick → generateProAsset(currentSceneActiveAsset.source) | generateProAsset(hosted \| byo) |

所有上述入口最终都进入 **generateProAsset(requestedSource?)**（App.tsx ~1184）。

### 2.2 generateProAsset 内门控与跳转

- **requestedSource === "hosted"**
  - 若 `!canUseHostedGeneration(accountUser)` → **openBillingPage("upgrade")** 并 return。  
    - `canUseHostedGeneration(user)` = Boolean(user && user.tier === "pro")（entitlement.ts）。  
    - **未登录时 accountUser 为 null，条件为 true，直接进 upgrade，未先去登录。**
  - 若已登录且 accountCredits < cost → openNotEnoughCredits(...) + **openBillingPage("credits")**，return。
  - 否则继续执行（预留 credits、调用本地预览等）。

- **requestedSource === "byo"（或默认走 BYO 分支）**
  - 若 `!accountUser` → **openAccountCenter("auth")**，return。
  - 若 `!canUseBringYourOwnApi(accountUser)` → **openAccountCenter("api")**，return。
  - 若 `!resolveByoProviderForMedia(mediaMode)` → **openAccountCenter("api")**，return。
  - 否则继续执行。

### 2.3 其他生成相关入口（非 Pro 画布「生成」）

- **generateResultPlan**（结果页生成）：若 `!canUseHostedGeneration(accountUser)` → openBillingPage("upgrade")（**同样未先判 accountUser**）；若 accountCredits < cost → openNotEnoughCredits + openBillingPage("credits")。
- **refineResultPlan**：同上。
- **generateResultPlanLocalTest**：不查 accountUser / credits，仅本地引擎状态。

### 2.4 不符合规则处（生成）

- **未登录应优先去登录/注册**  
  - **违反**：hosted 路径下未判断 accountUser，直接 `openBillingPage("upgrade")`（generateProAsset、generateResultPlan、refineResultPlan）。
- **不应直接跳旧会员充值页**  
  - 当前「upgrade」为 BillingOverlay（应用内 overlay），非独立 /pricing 页；但从语义上未登录时应去 auth，而不是 upgrade。
- **不应绕过登录直接去升级/充值**  
  - 未登录点「生成」会打开 BillingOverlay upgrade，属于「绕过登录先看到升级」。

---

## 3. Login / auth standard entry

- **标准入口**：**openAccountCenter("auth")**（App.tsx）。打开 AccountCenterModal，section = "auth"，展示邮箱/验证码/密码/Google 登录等。
- **独立登录页**：main.tsx 中 isAuthEntryRoute 对应 `/login`、`/signin`、`/register`、`/signup`，渲染 AuthEntryPage；/app 通过 AppAuthGate 在未登录时重定向到 `/signin?redirect=/app`（appAuthRedirectUrl）。
- **当前本该走 auth 却未走的**：
  - 未登录用户点击 **生成（hosted）**：应 openAccountCenter("auth")，实际为 openBillingPage("upgrade")。
  - 未登录用户点击 **结果页生成/refine**：同上。
  - 未登录用户使用 **需 pro_credits 的模板** 且 !canUseProConsole：应 auth，实际 openBillingPage("upgrade")。
  - 未登录用户从 **模板 credits 不足弹窗** 点「购买 Credits」：会打开 BillingOverlay credits；在 BillingOverlay 内点实际购买时才 onRequireAuth → auth（应先进入 auth 再考虑充值）。

---

## 4. Upgrade / credits / billing entry map

| 入口名称 | 实现 | 意图 | 状态说明 |
|----------|------|------|----------|
| 升级会员 | 账户菜单「升级会员」| window.location.assign("/pricing") | 跳转独立定价页 | 仍在使用；与 BillingOverlay upgrade 并存 |
| 升级会员 (未登录) | 账户菜单「升级会员」| window.location.assign("/pricing") | 同上 | 未登录也可点，直接看定价页 |
| 充值 Credits | 账户菜单「充值 Credits」| openBillingPage("credits") | 打开 BillingOverlay credits 标签 | still active |
| 管理订阅 | 账户菜单「管理订阅」| handleOpenCustomerPortal() | 开 Paddle customer portal | still active |
| AccountCenter(pro) | requestProAccess / enterProWorkspace | openAccountCenter("pro") | 展示 Pro 说明/升级入口（在 AccountCenterModal 内） | still active |
| BillingOverlay(upgrade) | openBillingPage("upgrade") | 应用内 overlay，Upgrade 标签 | 被生成/模板/账户等多处调用 | still active |
| BillingOverlay(credits) | openBillingPage("credits") | 应用内 overlay，Credits 标签 | still active |
| /pricing | 路由 + PricingPage | 独立定价页；PricingPage 内 CTA 为 /account?section=pro 或 APP_SIGNIN_HREF | 仍被菜单与 Landing 等引用 | still active |
| customer portal | handleOpenCustomerPortal → openCustomerPortal(userId) | 新开 Paddle 管理订阅页 | still active |

**过时/重复/不适合作为默认 fallback 的**：  
- **未登录时** 任何「升级会员」或「充值」入口若直接打开 **BillingOverlay** 或 **/pricing**，而不先到 **openAccountCenter("auth")**，均不适合作为默认 fallback。  
- 当前「升级会员」菜单项统一用 **/pricing** 跳转，未区分登录态；若希望「未登录先登录」则需在菜单或路由层区分。

---

## 5. Wrong redirect findings

### 5.1 未登录用户点击动作，本该去登录，却去了别处

| 发现点 | 行为 | 当前去向 | 建议去向 |
|--------|------|----------|----------|
| generateProAsset (hosted) | 未登录点「生成」 | openBillingPage("upgrade") | openAccountCenter("auth") |
| generateResultPlan | 未登录点结果页生成 | openBillingPage("upgrade") | openAccountCenter("auth") |
| refineResultPlan | 未登录点 refine | openBillingPage("upgrade") | openAccountCenter("auth") |
| handleUseTemplateFromWorkspace | 未登录用 pro_credits 模板 | openBillingPage("upgrade") | openAccountCenter("auth") |
| 模板 credits 不足弹窗「购买 Credits」 | 未登录点购买 | openBillingPage("credits") | 先 openAccountCenter("auth") 或关闭弹窗并提示登录 |

### 5.2 已登录但无 Pro

- **requestProAccess / enterProWorkspace** 已正确使用 **openAccountCenter("pro")**，未误跳 /pricing 或 BillingOverlay。  
- 生成（hosted）时 **canUseHostedGeneration(accountUser)** 为 false 时去 **openBillingPage("upgrade")**，属于「去升级」，逻辑上可接受；若产品希望统一「无 Pro 先看 Account Center pro  section」则可改为 openAccountCenter("pro")。

### 5.3 已登录且有 Pro 但余额不足

- generateProAsset / generateResultPlan / refineResultPlan 中 **openNotEnoughCredits + openBillingPage("credits")**，未误去登录或旧页。  
- 未发现「余额不足却跳登录」的错误。

### 5.4 已登录且权限满足却仍被导向升级/充值

- 未发现「有权限仍被强制导向升级或充值」的路径；门控均基于 canUseHostedGeneration / accountCredits 等。

---

## 6. Legacy / obsolete paths still in use

| 路径/逻辑 | 状态 | 说明 |
|------------|------|------|
| window.location.assign("/pricing") | still active | 账户菜单「升级会员」、未登录菜单「升级会员」均使用；与 BillingOverlay upgrade 并存 |
| window.location.assign("/account") | still active | 账户菜单「用户管理」 |
| BillingOverlay (upgrade | credits) | still active | 应用内主要升级/充值 UI；被生成、模板、账户、insufficient 弹窗等多处使用 |
| requestProAccess → openAccountCenter("pro") | still active | Pro 工作台/新建项目等门控，未改用 /pricing |
| openBillingPage("upgrade") 作为「无 hosted 权限」默认 | still active | 生成/结果/模板等多处；未登录时应为 auth |
| 旧「会员充值」页面 | unknown | 若存在独立「旧会员充值」URL，未在本次审计的 assign/菜单中发现 |
| requestProAccess 名称/语义 | legacy but still used | 实际做的是「无 Pro 则开 Account Center」，并非直接请求支付 |
| /pricing 与 BillingOverlay 双入口 | still active | 升级入口分散；可考虑统一为「未登录→auth，已登录无 Pro→Account pro 或 Billing upgrade」 |

---

## 7. Recommended unified gating rules（只分析，不改代码）

### A. 未登录点击受限动作

- **应去**：**openAccountCenter("auth")**（或 /signin?redirect=… 若希望整页登录）。  
- **不应**：openBillingPage("upgrade"/"credits")、window.location.assign("/pricing")、直接打开 BillingOverlay。

### B. 已登录但无 Pro

- **应去**：**openAccountCenter("pro")** 或 **openBillingPage("upgrade")** 之一并统一（当前 requestProAccess 用 "pro"；生成 hosted 用 "upgrade")。  
- 建议：统一为 **openAccountCenter("pro")**，由 Account Center 内再引导至升级/定价，避免多处直接打开 BillingOverlay。

### C. 已登录 + Pro 但 credits 不足

- **应去**：**openBillingPage("credits")** 或 openAccountCenter("credits")（若 Account Center 有 credits 区块）。  
- 当前：openNotEnoughCredits + openBillingPage("credits")，符合。

### D. 已登录 + Pro + 权限满足

- **应做**：直接执行动作（生成/导出/使用模板等），不跳转。  
- 当前：满足条件时无错误跳转。

### 生成按钮建议标准规则

1. **未登录**：先 **openAccountCenter("auth")**，不打开 upgrade/credits。  
2. **已登录、hosted、非 Pro**：**openAccountCenter("pro")** 或 openBillingPage("upgrade")（二选一并统一）。  
3. **已登录、hosted、Pro、credits 不足**：openNotEnoughCredits + **openBillingPage("credits")**。  
4. **已登录、BYO、未开通 BYO 或 provider 不可用**：**openAccountCenter("api")**。  
5. **以上均满足**：执行 generateProAsset，不跳转。

---

## 8. Highest-risk files/functions to fix first

| 优先级 | 文件 | 函数/位置 | 问题 |
|--------|------|-----------|------|
| 1 | App.tsx | generateProAsset (hosted 分支开头) | 未判 accountUser，未登录→openBillingPage("upgrade")；应改为未登录→openAccountCenter("auth") |
| 2 | App.tsx | generateResultPlan 开头 | 同上 |
| 3 | App.tsx | refineResultPlan 开头 | 同上 |
| 4 | App.tsx | handleUseTemplateFromWorkspace（pro_credits 且 !canUseProConsole） | 未登录→openBillingPage("upgrade")；应未登录→openAccountCenter("auth") |
| 5 | App.tsx | templateCreditsInsufficient 弹窗「购买 Credits」onClick | 未登录时直接 openBillingPage("credits")；可先 if (!accountUser) openAccountCenter("auth"); return; |
| 6 | App.tsx | 账户菜单「升级会员」| 未登录也跳 /pricing；若希望「未登录先登录」需在此或路由层区分 |

（以上为只读审计结论，未修改任何代码。）
