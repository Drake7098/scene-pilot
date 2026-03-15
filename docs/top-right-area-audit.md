# ScenePilot｜右上角用户 / 登录 / 收费 / 帮助区域现状收集（只读）

**目标**：在继续改“画布下方生成导出控制台”之前，完整确认右上角区域当前真实结构与职责。  
**规则**：只输出结构信息；未改代码；不猜；无则写 unknown；规划未实现则标注 planned / not implemented。

---

## 1. Top-right UI Structure

### 1.1 组成与挂载

- **谁渲染**：`App.tsx` 根 return 内直接渲染，无独立 Layout 组件包裹“整页”。
- **挂载位置**：`<div data-top style={styles.top}>` 为全站顶部一条横条（height: 56px），位于 `workspaceSwitchShield` 之下、主内容之上；与 ProWorkspace / 中间列 / 侧栏同级，同属 App 子节点。
- **文件路径**：`src/App.tsx`（约 3471–3513 行：top 条；3523–3540 行：下拉菜单）。

### 1.2 组件与“组件名”

- 顶部条**不是**独立组件，而是 App 内联 JSX：
  - 左上：`<div style={styles.brand}>`（Logo：ScenePilotix + 场景领航）。
  - 中间：`<div style={{ flex: 1, minWidth: 0 }} />`（占位）。
  - 右上：`<button style={styles.topBtn} onClick={toggleLang}>`（语言切换）；`<button data-testid="top-account-trigger" style={styles.topAccountBtn} onClick={() => setAccountMenuOpen(...)}>`（账户入口）。
- 下拉菜单：`accountMenuOpen === true` 时渲染：
  - 遮罩：`<div style={styles.menuMask} onMouseDown={() => setAccountMenuOpen(false)} />`。
  - 菜单容器：`<div style={styles.helpMenu} data-testid="top-account-menu">`，内层用 `helpMenuItems.map` 渲染多个 `<button>`（无单独“AccountMenu”组件名）。

### 1.3 调用链（简化）

```
App (state: accountMenuOpen, accountUser, lang, …)
  → <div data-top style={styles.top}>
      → brand (Logo)
      → spacer
      → Language button (toggleLang)
      → Account button (setAccountMenuOpen)
  → accountMenuOpen ? menuMask + helpMenu(helpMenuItems) : null
```

- **styles 定义**：同文件内 `styles.top`（约 4936 行）、`styles.helpMenu`（约 5621 行）、`styles.helpMenuItem` 等。

### 1.4 当前右上角可见入口（按视觉顺序）

1. **语言切换**：按钮，图标 Languages + 文案「EN」或「中文」。
2. **账户入口**：按钮，圆形头像（或 UserRound 图标）+ 文案：
   - 已登录：`accountEntryLabel` = “账户” / “Account”；
   - 未登录：`accountEntryLabel` = “登录 / 注册” / “Sign In / Sign Up”。
3. **无**其他常驻可见按钮（无独立 Upgrade / Credits / Help 图标）。
4. 点击“账户”后**下拉菜单**内（自上而下）：
   - 账户与会员 / 登录（Account & Plan 或 Sign In）→ `openAccountCenter(accountUser ? "overview" : "auth")`。
   - 用户管理页面（仅已登录）→ `window.location.assign("/account")`。
   - 升级会员（Upgrade）→ `window.location.assign("/pricing")`。
   - 充值 Credits（Buy Credits）→ `openBillingPage("credits")`。
   - 管理订阅（Manage Billing）→ 未登录则 `openAccountCenter("auth")`，已登录则 `handleOpenCustomerPortal()`。
   - 自带 API（仅 BYO 可用时）→ `openAccountCenter("api")`。
   - 帮助中心（Help Center）→ `setHelpCenterOpen(true)`，section 默认 `quick_start`。
   - 退出登录（仅已登录）→ `handleLogout()`。

---

## 2. Login / Account Status

### 2.1 当前是否显示

- **登录按钮**：是。未登录时，右上角主按钮文案为“登录 / 注册” / “Sign In / Sign Up”，点击打开账户中心 auth。
- **用户头像**：是。已登录时显示 `accountUser.avatarUrl` 或占位（UserRound + `accountAvatarColor` 背景）。
- **用户名**：否。仅显示“账户”/“Account”，不显示 email 或 displayName。
- **Account menu**：是。即上述下拉 `helpMenuItems`（样式名 `helpMenu`）。
- **Account center**：是。通过 `openAccountCenter(section)` 打开 `AccountCenterModal`，section ∈ { auth | overview | credits | pro | api }。
- **登出**：是。在下拉中“退出登录”项，调用 `handleLogout()`。
- **当前 plan**：不在右上角条上显示；在 AccountCenterModal 的 overview / pro 等 section 内显示（如 tier、Pro 状态）。

### 2.2 对应组件、路径、handler

- 账户状态与登录：App 内 `accountUser`（useState）、`refreshAccountState`（getCurrentUser + getWalletState + getCreditLedger + getBillingSnapshot）。
- 打开账户中心：`openAccountCenter(section)` → `setAccountCenterSection(section)` + `setAccountCenterOpen(true)`。
- AccountCenterModal：`src/components/AccountCenterModal.tsx`；由 App 传入 user、creditsBalance、ledger、section、各种 on*。
- 登出：`handleLogout()`（App 内）→ 清 session / 状态并调用 logout 等。

### 2.3 登录状态来源

- **accountUser**：App 内 `useState<UserState | null>(null)`；通过 `refreshAccountState()` 赋值为 `getCurrentUser()` 的返回值。
- **getCurrentUser**：来自 `src/services/authService`（未在本次审计内逐行确认 mock vs 真实 API）。
- **accountCredits**：App 内 `useState(0)`，在 `refreshAccountState` 中由 `getWalletState(user.id)` 的 `creditsBalance` 更新。
- **session / auth state**：由 authService 与 App 的 accountUser / refreshAccountState 联动；无单独“session”组件。
- **相关文件**：`src/App.tsx`（state 与调用）、`src/services/authService`、`src/services/creditService`（getWalletState）。

### 2.4 登录前后右上角 UI 差异

- **未登录**：主按钮文案“登录 / 注册”/“Sign In / Sign Up”；头像为默认渐变 + UserRound 图标。下拉中无“用户管理页面”“退出登录”；有“登录/注册”“升级会员”“充值 Credits”“管理订阅”“帮助中心”；无“自带 API”（除非 canUseBringYourOwnApi 对未登录为 true，当前应为 false）。
- **已登录**：主按钮文案“账户”/“Account”；头像为 accountAvatarColor + 若有 avatarUrl 则显示图片。下拉增加“用户管理页面”“退出登录”；“账户与会员”打开 overview；“自带 API”仅当 `canUseBringYourOwnApi(accountUser)` 为 true 时显示。

### 2.5 Account center / modals

- **Account center**：有。`AccountCenterModal`，入口为右上角下拉“账户与会员”或“登录/注册”，以及多处 `openAccountCenter("auth"|"overview"|"credits"|"pro"|"api")`。
- **展示内容**：section 切换 — auth（登录/注册）、overview（概览、credits 摘要、Pro 入口）、credits（点数与充值、流水）、pro（Pro 方案与升级）、api（AI Providers，Pro 可配置 fal/runway）。
- **与 billing / API / settings**：合并。同一 Modal 内通过 section 切换“会员/升级”“点数/充值”“管理订阅”“API 配置”；法律同意、升级、充值、客户门户、保存 API 等均在该 Modal 内完成。BillingOverlay 为**另一层**（upgrade / credits 全屏 overlay），由 `openBillingPage("upgrade"|"credits")` 打开。
- **User management**：有独立页面 `/account`（UserManagementPage），入口为下拉“用户管理页面”，非 Modal。

---

## 3. Pricing / Credits Entry Points

### 3.1 右上角与收费相关的可见入口

- **Upgrade**：有。下拉“升级会员”→ 跳转 `/pricing`（PricingPage）。
- **Pricing**：同上，即“升级会员”跳转 `/pricing`。
- **Credits 余额**：**不在**右上角条或下拉列表中显示；仅在 AccountCenterModal（overview / credits section）和 BillingOverlay 中显示。
- **当前 plan badge**：不在 top 条显示；在 AccountCenter 内显示 tier / Pro 状态。
- **Billing**：有。下拉“管理订阅”→ 客户门户或先打开 auth。
- **Checkout**：不直接出现在右上角；由 BillingOverlay / PricingPage / AccountCenter 内操作触发。
- **Account/billing center**：有。下拉“账户与会员”打开 AccountCenter；“充值 Credits”打开 BillingOverlay(credits)；“管理订阅”走客户门户。

### 3.2 每个入口的组件、路径、handler、打开对象

| 入口           | 组件/位置           | 文件        | Handler / 行为                    | 打开对象                          |
|----------------|---------------------|-------------|-----------------------------------|-----------------------------------|
| 升级会员       | 下拉菜单项          | App.tsx     | `window.location.assign("/pricing")` | PricingPage（整页）               |
| 充值 Credits   | 下拉菜单项          | App.tsx     | `openBillingPage("credits")`      | BillingOverlay page=credits       |
| 管理订阅       | 下拉菜单项          | App.tsx     | `handleOpenCustomerPortal()` 或 auth | 客户门户或 AccountCenter(auth)    |
| 账户与会员     | 下拉菜单项          | App.tsx     | `openAccountCenter(overview/auth)`| AccountCenterModal                |
| Pro 工作台内升级 | 文案旁按钮          | App.tsx     | `openBillingPage("upgrade")`      | BillingOverlay page=upgrade       |

### 3.3 随用户 tier 变化的右上角信息

- **free**：下拉有升级、充值、管理订阅、帮助；无“自带 API”；未登录时无“用户管理”“退出”。
- **member**：类型存在；UI 上未单独区分 member 与 free 的 top 条表现（未查是否 elsewhere 有 member 专属入口）。
- **pro**：下拉多“自带 API”（openAccountCenter("api")）；“管理订阅”可用客户门户；Pro 工作台内“升级”按钮仍存在（引导非 Pro 或补充升级）。

### 3.4 Credits 在右上角是否显示

- **不显示**。余额未在 top 条或下拉列表中展示。
- **显示位置**：AccountCenterModal（overview 与 credits section）、BillingOverlay。
- **State**：App 内 `accountCredits`，由 `refreshAccountState` 从 `getWalletState(user.id).creditsBalance` 更新。
- **实时刷新**：在打开 AccountCenter / BillingOverlay 或 refreshAccountState 调用后更新；无轮询或 WebSocket。

### 3.5 收费入口与其他区域是否重复

- **左边栏**：未发现 Sidebar 内有“升级/价格/Credits”入口（grep 无匹配）。
- **账户中心**：与右上角重复。下拉“账户与会员”= AccountCenter；“充值 Credits”打开 BillingOverlay，AccountCenter 内也有 credits section 与充值。
- **BillingOverlay**：由右上角“充值 Credits”和 App 内多处 `openBillingPage("credits"|"upgrade")` 打开；与 AccountCenter 的“Pro/credits”有功能重叠但 BillingOverlay 偏全屏计费/升级页。
- **PricingPage**：独立路由 `/pricing`，入口为右上角“升级会员”跳转；与 BillingOverlay(upgrade) 功能重叠（一个整页一个 overlay）。
- **Pro 工作台内部**：有“升级”按钮（openBillingPage("upgrade")），与右上角“升级会员”和 BillingOverlay 重复。

---

## 4. Help / Docs Entry Points

### 4.1 是否存在

- **Help**：有。下拉“帮助中心”→ `setHelpCenterOpen(true)`。
- **Docs**：帮助中心内为教程/说明类内容，无独立“Docs”站或链接（未全面检索）。
- **FAQ**：帮助中心有“排错”等 section，是否标为 FAQ 未逐条确认。
- **教程**：有。帮助中心 section：quick_start、pro_motion_beginner、pro_motion_advanced、export、troubleshoot、feedback、about。
- **引导**：有 quick_start 等；是否有“首次进入”浮层引导未确认。
- **联系我们**：帮助中心与 AccountCenter 等处可能有联系渠道（如 PUBLIC_CONTACT_CHANNELS）；未逐处核对。
- **反馈**：有。帮助中心 section “反馈”，`submitFeedback` 等。
- **issue/report**：以反馈表单形式存在，未发现单独“Report bug”入口（可能合并在反馈中）。

### 4.2 对应组件、路径、handler、打开位置

- **帮助中心**：App.tsx 内 `helpCenterOpen && createPortal(..., document.body)`，样式 `styles.modalMask` + `styles.modal`，标题“帮助中心”/“Help Center”，左侧 `helpSections` 导航，右侧内容按 `helpCenterSection` 切换。
- **Handler**：下拉“帮助中心”项 → `setHelpCenterSection("quick_start")` + `setHelpCenterOpen(true)`。
- **关闭**：`setHelpCenterOpen(false)`（遮罩点击或关闭按钮）。

### 4.3 是否已有

- **新手引导**：有 quick_start、pro_motion_beginner 等 section。
- **Pro 工作台帮助**：有 pro_motion_advanced 等；是否单独“Pro 工作台”标题未逐字核对。
- **导出帮助**：有 section “导出说明”/“Export Guide”。
- **API 帮助**：帮助中心内未单独看到“API 帮助”section；AccountCenter API section 有说明文案。
- **模板帮助**：未单独列出“模板帮助”section；可能合并在教程或 about 中。

### 4.4 帮助入口是否分散

- **右上角**：下拉“帮助中心”唯一入口，打开统一 Help 弹层。
- **ExportPanel**：有 HelpCircle 图标 + `readonlyHelpText`（说明“结构化提示词只读”等），**不**打开帮助中心，为就地 tooltip/popover。
- **账户中心**：各 section 有说明文案，非“帮助中心”同一面板。
- **各 section 内 help icon**：如 ExportPanel 的 HelpCircle；EditorSection 等若有类似图标则为局部说明。
- **重复/冲突**：帮助中心与 ExportPanel 的 help 职责不同（全局教程 vs 导出区说明），不冲突；但“帮助”的入口仅右上角一处，其余为局部 icon。

---

## 5. API / Settings Entry Points

### 5.1 右上角是否有

- **API**：有。下拉“自带 API”（Bring Your Own API），仅当 `canUseBringYourOwnApi(accountUser)` 为 true 时显示。
- **Settings**：无独立“Settings”入口；账户/API/法律同意等在 AccountCenter 内。
- **Advanced**：无独立“Advanced”入口。
- **Provider settings**：即 AccountCenter section “api”（AI Providers），fal/runway 配置。
- **自带 API / BYO API**：即下拉“自带 API”→ `openAccountCenter("api")`。
- **模型说明 / 费用预览**：不在右上角；费用预览在 Pro 工作台生成区（hosted 时显示 Credits 预览）。

### 5.2 这些入口当前在哪

- **右上角**：仅“自带 API”一项，打开 AccountCenter(api)。
- **Account center**：section api = AI Providers 配置（fal、runway、default provider、key 等）。
- **Pro workspace**：生成区有“费用预览”、hosted/byo 说明、“Pro 可连接自己的 API”+“升级”按钮；无单独 API 配置面板。
- **Modal**：AccountCenterModal(api)。
- **Page**：无独立 /api 或 /settings 页面。

### 5.3 已实现 / 部分 / planned

- **已实现**：右上角“自带 API”入口（Pro-gated）、AccountCenter API section（表单、default provider、fal/runway 占位）、保存到 mockAccountStore；Pro 工作台 hosted/byo 切换与费用预览。
- **部分实现**：API 配置 UI 与状态持久化有；真实用用户 key 调第三方 API 未实现（见 pricing-export-api-audit）。
- **planned / not implemented**：真实 BYO 调用、Settings 页、Advanced 页。

### 5.4 与未来“生成控制台”的重复职责风险

- **重复**：若下方输出控制台再放“平台 / provider / 自带 API / 费用预览”，会与 (1) 右上角“自带 API”入口、(2) Pro 工作台内“平台模式 / 我的 API”“费用预览”“升级”形成重复。
- **建议**：平台/provider/费用/升级中，**入口**可保留在右上或 Pro 区一处；“当前选择/费用预览”在工作流附近（如生成按钮旁）保留一处即可，避免两处都做“配置 API + 升级”的完整流程。

---

## 6. Current UX Problems

- **登录/套餐/credits/帮助/API 混在一起**：是。单一“账户”按钮 + 一个下拉，内含账户、升级、充值、管理订阅、API、帮助、登出；用户需在长列表中区分“去登录”“去充值”“去改 API”“去看帮助”。
- **同一能力多入口**：升级/定价有“升级会员”（/pricing）、Pro 工作台内“升级”（BillingOverlay）、AccountCenter 的 Pro section；充值有下拉“充值 Credits”（BillingOverlay）与 AccountCenter credits；管理订阅与 AccountCenter 的 Pro/门户也有重叠。
- **收费信息展示**：Credits 与 plan 不在 top 条展示，用户不点开账户/计费看不到余额与当前套餐。
- **用户看不懂该去哪里升级**：升级有 /pricing、BillingOverlay(upgrade)、AccountCenter(pro)，且“升级会员”跳转定价页、“管理订阅”走门户，路径不统一。
- **Plan / credits / API 状态**：均需进入 AccountCenter 或 BillingOverlay 才能看清；右上角无摘要。
- **Help 与 Account / Billing 混杂**：帮助中心与账户/计费同在下拉，无视觉分组，易混淆。
- **与未来下方控制台**：若控制台再放“升级/充值/API/费用”，与右上角及 Pro 区重复，需明确“入口 vs 工作流内快捷”的边界。

---

## 7. Boundary with OutputConsole

### 7.1 应留在右上角、不宜下沉到输出控制台的

- **登录 / 注册**：全局身份，应保留在顶部。
- **账户**：账户中心入口、用户管理页面、登出，属账户级，保留在右上。
- **Plan**：当前套餐/权益的查看与升级入口，适合在账户/计费流中，右上可保留入口。
- **Credits**：余额查看与充值入口，适合在账户/计费流；右上可保留“充值”入口，不必在控制台再做一套完整充值。
- **帮助**：全局帮助中心入口，保留在右上。
- **API 设置**：BYO/Provider 配置为账户级设置，入口保留在右上（或 AccountCenter），控制台只做“当前使用哪个 provider/费用预览”的展示与切换。

### 7.2 可能同时出现在右上角和下方、需避免重复的

- **平台 / 适用模型**：导出/生成用；若控制台有“平台选择”，右上角不宜再重复平台选择器。
- **Provider（hosted / byo）**：生成用；控制台可有“当前模式 + 费用预览”；“配置 API”入口应只在右上/AccountCenter 一处。
- **费用**：控制台可保留“费用预览”；“充值/升级”以右上或 AccountCenter 为主，控制台至多短链“去充值”。
- **Pro 升级**：入口以右上/AccountCenter/BillingOverlay 为主；控制台内“升级”若保留，应明确为快捷入口而非第二套完整流程。
- **BYO API**：配置入口仅在右上（或 AccountCenter）；控制台只显示“当前为 My API”等状态与费用说明。

### 7.3 适合右上角做“入口”、不适合在工作区中央频繁显示的

- 账户中心、登录/注册、用户管理页面。
- 升级/定价页、充值、管理订阅（客户门户）。
- 自带 API 配置（AccountCenter api）。
- 帮助中心。
- 语言切换。

---

## 8. What should stay in top-right

**A. 必须放右上角**

- 登录/注册与账户入口（头像 + 账户/登录 文案）。
- 账户下拉（账户中心、用户管理、登出）。
- 帮助中心入口。
- 语言切换。

**B. 可放右上角，但也可能在其他地方出现**

- 升级/会员（入口）；充值 Credits（入口）；管理订阅（入口）。当前已在右上角下拉；BillingOverlay/PricingPage/AccountCenter 为打开后的承载，可保留。
- 自带 API（入口）：当前仅 Pro 在右上角显示；配置内容在 AccountCenter，可保留。

**C. 不应放右上角，应留在工作区/控制台/账户中心**

- 平台/导出范围选择（应在导出/生成流程旁）。
- 生成 provider 切换（hosted vs byo）与费用预览（应在生成按钮附近或下方控制台）。
- 完整 Credits 余额展示（可在 AccountCenter/控制台摘要二选一，不必顶条）。
- 导出/复制等操作（应在画布下方或导出面板）。

---

## 9. What should not stay in top-right

- **不要**在 top 条或下拉中再做一套“平台选择/导出范围/生成 provider 切换”的完整表单，以免与下方控制台重复。
- **不要**在 top 条堆叠多个独立图标（Credits、Help、API、Upgrade 各一个），当前单一点击“账户”展开已足够；若未来拆出，需与下方控制台职责划分清楚。
- **不要**把“当前生成费用预览”或“当前平台”的实时工作流信息迁到右上角，应留在生成/导出附近。

---

## 10. Risk of duplication

- **输出控制台若包含**：平台、provider（hosted/byo）、费用预览、升级/充值入口、API 配置入口 → 与右上角下拉、AccountCenter、Pro 工作台内“升级/费用预览”重复。
- **建议**：控制台只做“当前平台/当前 provider/费用预览/生成与导出操作”；“升级”“充值”“配置 API”仅作入口（如一次点击跳转 AccountCenter 或 BillingOverlay），不在控制台内再做一套完整账户/计费/API 配置 UI。
- **帮助**：控制台若有“导出说明”等局部帮助，应与右上角“帮助中心”区分（局部 vs 全局），避免两处都变成“大帮助中心”。

---

**结束**
