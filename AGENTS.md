# ScenePilot Global Rules

## Mission
- 所有新线程开工前，先读本文件，再读 `docs/live-development-strategy.md`。
- 目标不是堆功能，而是让用户在最短路径内完成任务。
- 当前主产品方向：`共鸣 -> 选任务 -> 选模板 -> 进工作台 -> 复制提示词或生成 -> 分享复用`。
- 任何实现如果"技术上接通了"但用户仍然不知道该点哪里、下一步去哪，视为未完成。

## Testing Priority
- 测试第一目标是优化提示词生成引擎，不是单纯验证是否生成成功。
- 评测链路必须拆分并记录：`userInputRaw -> userIntentNormalized -> generatedPrompt -> generatedImageOrVideo`。
- 每轮测试都要先看提示词结构，再看生成结果，最后再提引擎修改方案。

## Prompt Engines
- 工作台图片引擎：`IM V5P`
- 工作台视频引擎：`VI V5P`
- 场景级 genMode `quick` 仍保留，对应短结构引擎（`IM v5` / `VI V5`）；`pro` 对应完整结构引擎。
- 图片引擎不得输出视频骨架语言，例如 `Camera Contract`、`T1 Frame Spec`、整段镜头运动说明。

## Thread-Wide Reporting
- 所有测试、导出、报告必须标记 `workspace`、`mediaMode`、`engineId`。
- 汇报时必须明确指出问题出在用户输入、意图归一化、提示词引擎还是底层模型。
- 不允许把来源标记写入真实 prompt 文本；来源追踪只能放在元数据、sidecar JSON、文件名或 DOM 属性里。
- 不允许用零宽字符、细微字体差异、隐藏 Unicode 等方式给 prompt 做隐式标记。

## Test Mix
- 正式提示词稳定性测试默认配比：
- 图片结构样本 `30%`
- 视频结构样本 `40%`
- 冲突/脏输入/对抗样本 `30%`
- 冲突样本必须覆盖：字段冲突、对象冲突、镜头冲突、用户原话噪声词。

## Iteration Rule
- 工作台（Pro）先做至少三轮：生成、评分、修改、复测。
- 每轮必须产出：
- 综合评分
- 结构问题清单
- 修改方案
- 与上一轮对比是否增强

## Product UI Guardrails
- 涉及用户可见交互时，必须先使用仓库内 skill：`/Users/dk/scene-pilot/.codex/skills/product-ui-guardrails/SKILL.md`
- UI 布局、间距、配色、组件结构以设计稿为单一事实源，必须使用 skill：`/Users/dk/scene-pilot/.codex/skills/ui-design-reference/SKILL.md`，设计稿文件：`src/design-reference/figma/app.tsx`
- 适用范围包括：Landing、任务入口、模板选择、快速生成、菜单、顶部栏、保存/导出、项目库、命名、状态记忆、成功提示、帮助中心与页面文案边界。
- 这类任务不能只做到"功能可用"，必须额外做一轮"交互一致性复核"。

## Landing and Entry Hard Rules
- 首屏主入口必须是视觉最重区域，不允许 CTA 抢过任务入口。
- 当前 Landing 主入口固定为：`5 个大众任务 + 1 个更多专业任务`。
- 大众任务：`卖货出图 / 人物出图 / 封面海报 / 视频口播 / 剧情短视频`
- `更多专业任务` 只承接专业工作流，不与大众任务平级扩散。
- 任务入口在桌面端必须默认 `3 x 2` 栅格，不允许对关键入口使用 `auto-fit` / `auto-fill` 造成尺寸漂移。
- 任务入口卡必须具备明确可点击感：强调色背景或强调色边框、hover、active、阴影层级缺一不可。
- 每张任务入口卡只允许：图标、主标题、两行以内说明；不要在主入口卡里堆太多标签、说明块或运营文案。
- 首屏不允许先讲系统结构、模板运营、推荐逻辑、价格分发或内部策略。
- 首屏文案优先顺序固定为：`共鸣 -> 结果承诺 -> 当前动作`。
- "直接进入工作台"是 Landing 的次级动作，但不能做得太弱；它必须仍然是一个明确按钮，不是纯文字链接。

## Chinese Typography Rules
- 中文主标题默认不使用标点，除非用户明确要求。
- 中文主标题不得手动拆成多行 `span`；必须依赖容器宽度自然换行。
- 不允许出现"第一行过长、第二行只剩一个字"的断行；实现后必须主动检查标题宽度与断行效果。
- 长中文标题必须先缩短，再调字号和宽度；不能靠硬换行掩盖文案问题。
- 首屏标题、按钮、卡片说明都必须先按中文排版检查，再视情况适配英文。

## User-Facing Copy Rules
- 页面文案只允许讲：用户问题、结果承诺、当前动作。
- 严禁把内部策略写到用户页面，例如：推荐逻辑、免费排序、计费分发、流量策略、模板运营规则。
- 页面文案只允许短标签、短状态、短按钮文案；教程式、解释式、步骤式长句进入帮助中心，不进入主页面。
- 同一用户事件只能保留一个规范名称；改名时必须同步按钮、菜单项、成功提示、帮助中心标题。

## Task-Driven Flow Rules
- 当前用户主链路固定为：`共鸣 -> 选任务 -> 选模板 -> 进工作台 -> 复制提示词或生成`。
- 点任务后，不允许先把用户扔进"通用模板库心智"；必须先承接到该任务对应的模板选择层。
- 模板选择层当前采用三级结构：`任务 -> 子任务 -> 模板`。前端不直接暴露 family 概念，family 只用于内部配置与排序。
- 点模板后应直接进入工作台；不允许再要求用户多做一轮无意义的"使用模板"确认，除非存在真实覆盖风险。
- 模板套用后默认显示 `快速生成` 面板，不先把完整复杂编辑器摊给用户。
- `快速生成` 面板第一屏只保留最少必要字段与主动作；高级设置必须渐进披露。
- 如果存在 onboarding、认证弹层或其他流程打断 UI，不得抢占 `任务 -> 模板选择` 主路径。

## Generation Strategy Rules
- 免费主路径是：`复制结构化提示词`，不是"大额免费补贴生成"。
- 用户侧生成决策当前为三出口：
- `复制提示词`：免费主路径
- `站内托管生成`：积分路径
- `本地生成`：Pro + 已连接本地工具
- 本地生成属于 Pro 专属工作流能力，不是大众首屏主路径。
- 托管生成收费是合理能力，不要伪装成"本应免费"。

## Sharing Rules
- 分享对象不是单张图片，而是：`任务 + 子任务 + 模板 + 提示词 + 主要参数`。
- 分享页允许未登录预览和复制提示词。
- 需要登录的动作：站内生成、保存到项目、本地接口配置、托管付费生成。
- 分享链路必须服务复用，不只是展示结果。

## Basic UI Failure Prevention
- 不允许使用 `split("\n").map(...)` 强制拆主标题，除非用户明确要求逐行排版。
- 不允许对关键首屏入口使用会导致列数漂移的自适应栅格策略。
- 不允许让主入口卡与普通面板只有极弱颜色差异。
- 不允许把"功能已经存在"误判为"产品链路已经成立"。
- 不允许在未验证实际点击通路前宣称"已经接上流程"。
- 不允许把主路径页面做成"内部工具后台感"而不是"明确任务入口感"。

## Mandatory UI Self-Review Before Final Answer
涉及 Landing、任务入口、模板流、快速生成、主按钮时，提交前必须逐项自检：
1. 首屏最重的视觉是不是用户主任务入口
2. 主按钮和次按钮是否一眼可分
3. 中文标题是否自然换行，有无孤字断行
4. 用户点击任务后是否直接进入对应模板选择路径
5. 用户点击模板后是否直接进入工作台
6. 页面文案是否泄漏了内部实现逻辑
7. 当前页面是否更像"主路径入口"而不是"通用后台"
8. 桌面端是否无需滚动即可看到完整主入口区
9. 是否只是"技术上接通"，但用户仍然不知道下一步
10. 如果以上任一项不满足，不得宣称完成

## Core Product Rules
- 工作台统一为 Pro，不再有 Quick/Pro 双工作台切换。
- 模板驱动工作流为主体验。
- 同一用户事件默认只保留一个主入口；如保留多个入口，必须有明确主入口和镜像入口，不允许并列重复入口。
- 首次选择后应记忆的状态必须持久化，后续不要重复询问；只有明确创建"另一个文件 / 另一个项目"时才允许重新选择。
- 下载、导出、复制完成后，默认只保留短 hint / toast；不要堆大块"成功教学卡片"，除非用户下一步会被真实阻塞。
- 下拉宽度、选中态长度、坐标框宽度、按钮显示长度等基础 UI 应优先固定并可控；除非用户明确要求，否则不要做会随内容波动的长度策略。
- 关键系统状态必须尽量可见，不要让用户靠记忆；至少要考虑：未保存状态、当前保存平台、当前导出范围、覆盖风险。
- 需要额外输入、二次选择、文件选择器、目录选择器或确认步骤的动作，默认应使用省略号；立即执行的动作默认不用省略号。
- 对 Pro 表面，优先优化专家效率而不是教程感；减少打断、减少重复确认、保留快捷键与稳定位置。
- 进阶能力必须走渐进披露；不要把高级设置长期摊平在主界面。
- 无效入口要区分"隐藏"和"禁用"：会制造混乱的入口直接移除；对理解产品有价值但当前不可用的入口，可保留但禁用。
- 菜单过长时必须分组、下沉或拆分；不能因为实现方便就把所有动作堆在一个列表里。

## Data and Structure Rules
- 场景级、对象级、分镜级职责必须分开：场景调度不替代对象属性，分镜骨架不替代场景调度，对象备注不偷改全局策略。
- 任何自动继承或自动分配都必须遵守"只继承确定项，不继承模糊自由文本"；无法确定归属时宁可不自动分配。
- 项目库只保存项目，不保存单分镜；单分镜不进入项目库。
- 项目库、模板库、导出文件必须是三套不同概念；不要把单镜导出伪装成项目。
- 项目库默认采用单文件 JSON 作为主存储格式；除非有明确技术理由，否则不要退回多目录分镜项目结构。
- 导出逻辑必须明确区分：保存项目、复制提示词、导出项目包；不能把项目保存、单镜导出、跨平台交付包混成一个动作。
- 复制提示词默认是纯文本动作，不负责携带参考图文件；参考图应通过项目包 / 参考包导出。
- 限制数量属于产品质量控制，不只是性能控制；分镜、对象等上限应优先服务于结构清晰度和操作流畅度。

## Template Workflow Rules
- 模板系统属于主产品链路，不是素材堆放区；任何模板改动都必须按标准流程执行，禁止只改一层就宣称完成。
- 新增或修改模板前，必须先明确 5 件事：所属大类、所属子任务、免费或积分、图片或视频、单对象还是多对象。
- 新增或修改模板时，必须同步检查以下层级：`templateIndex`、`payloads`、`loader/apply`、`intentConfig.familyIds`、前台分类显示映射。
- 模板只在“全部”里可见，或只在任务流里可见，都视为错误；正确状态必须同时满足：可在模板库找到、可在对应大类找到、可在对应子任务找到。
- 模板新增后，必须验证 6 项：模板库可见、对应大类可见、对应子任务可见、点击后能进入工作台、复制提示词有内容、免费/积分状态正确。
- 多对象模板必须额外验证：工作台内确实出现多个独立对象，不能把多个对象退化成一个对象里的长描述。
- 多对象模板中的每个对象必须具备独立职责；至少要检查 `look / detail / imperfection / t0 / z` 是否分别存在，不允许只在 scene 或 notes 中混写替代。
- 背景和空间锚点如果对结果稳定性重要，应优先作为独立对象或明确场景锚点处理；不能仅靠一句宽泛背景描述承担全部结构职责。
- 模板命名必须统一包含：大类语义、中文名、英文名、familyId、variantId、简短说明；禁止临时命名、随意缩写、今天一套明天一套。
- 模板名改动时，必须同步检查：模板库名称、family 名称、payload 对应关系、分类入口、搜索关键词和帮助文案是否受影响。
- 免费模板不是低配试玩模板；免费模板也必须具备明确结果感、复用价值和商业展示价值，不能用“占位模板”充数。
- 积分模板的价值必须来自更复杂的结构、更高稳定性或更强商业质感；不允许只靠改名字或堆形容词抬价。
- 模板内容优先服务“用户替换少量对象即可复用”；如果模板必须大改才能用，视为模板设计不合格。
- 模板改动后的汇报必须固定包含：修改文件清单、模板名称清单、所属大类/子任务、免费或积分、是否验证分类可见、是否验证工作台加载。
- 涉及模板分类、任务归属、family 路由、模板主流程变化时，必须先参考 `docs/live-development-strategy.md`，并在必要时同步更新其中的模板策略说明。

## Cross-Thread Sync
- 跨线程开发必须使用共享策略文档：`/Users/dk/scene-pilot/docs/live-development-strategy.md`
- 涉及跨线程一致性、主流程变化、命名变化、保存/导出规则变化时，必须先使用仓库内 skill：`/Users/dk/scene-pilot/.codex/skills/live-dev-sync/SKILL.md`
- 任何涉及产品流程、主入口、命名、保存/导出规则、提示词引擎策略、平台执行策略的任务，开工前必须先读这份文档。
- 如果本次开发改变了上述任何一项，收尾时必须同步更新这份文档。
- 当线程之间出现"这边不知道那边改了什么"的风险时，以该文档为单一事实源，不以聊天上下文为准。

## Release + Billing Sync
- 涉及登录/注册、会员、扣点、Paddle、发布流程、测试服/正式服环境变量、PR gate、分支策略时，必须先使用仓库内 skill：`/Users/dk/scene-pilot/.codex/skills/release-billing-sync/SKILL.md`
- 这类任务必须先对齐三份文档：`live-development-strategy.md`、`supabase-env-matrix.md`、`supabase-cloudflare-stage1-runbook.md`
- 这类任务收尾必须至少执行并通过：
- `npm run engine:lock:check`
- `npm run build`
- 若改动了支付边界，必须保证前后端双端策略一致（禁止只改一端）。
- 测试服与正式服支付配置必须隔离；不允许测试服 live 扣费链路。

## Prompt Engine Architecture
- 涉及提示词生成、场景调度、平台适配、genMode quick/pro 提示词差异、creative context 路由、provider 路由时，必须先使用仓库内 skill：`/Users/dk/scene-pilot/.codex/skills/prompt-engine-architecture/SKILL.md`
- 这类任务必须先判断改动属于：结构层、适配层还是执行层。
- 不允许把平台适配、provider 执行、UI 文案和 prompt 结构改动混在一起不加区分。

## Help System
- Help 架构已冻结；见 `docs/help-system-final.md`、`docs/help-ui-structure-v1.md`。
- **不允许**在 App.tsx 中写 Help 内容或 Help 专用 JSX（如按 helpCenterSection 分支渲染正文）。
- Help **内容**必须写在 `src/features/help-center/helpContent.ts`；不得用 placeholder 或临时占位正文。
- **Section** 必须在 `helpSections.ts` 定义（id + labelZh/labelEn）；不得恢复 quick_start、pro_motion_beginner、pro_motion_advanced 等旧 id 作为主 Help 来源。
- Help **UI** 必须在 `src/features/help-center`（HelpModal、HelpLayout、HelpSidebar、HelpPanel、helpStyles）；不得在 App 中增加 help 专用样式或内联 Help 布局。
- **不允许** placeholder 式 Help（无 getPlaceholderContent、无占位 section）。
- **不允许** legacy Help JSX 或 quick_start 写回。


# ===============================
# AGENT EXECUTION RULES (STRICT)
# ===============================

## 🚫 Git 操作限制

Agent 禁止执行以下命令，除非用户明确逐字授权：

- git restore
- git reset
- git checkout
- git clean
- git rebase
- git stash
- git pull --rebase
- git push --force
- git branch -D
- git switch
- git revert

禁止自动执行任何 git 修改历史的操作。

只有以下命令允许：

- git status
- git diff
- git add <file>
- git commit
- git push

且必须用户明确要求。


## 🚫 文件修改范围限制

Agent 不得修改未被用户明确指定的文件。

禁止行为：

- 修改多个文件但未逐个列出
- 修改配置文件（vite / tsconfig / package.json / env / auth / supabase / cf）
- 修改部署配置
- 修改登录系统
- 修改支付系统
- 修改 API key / env / secret
- 修改 CI / build / cloudflare / workers / functions

除非用户明确写出：

允许修改文件：
- file1
- file2


## 🚫 禁止自动重构

Agent 禁止：

- 重构整个模块
- 重写 auth
- 重写 supabase
- 重写 build
- 重写 project system
- 重写 template system
- 重写 prompt engine

除非用户明确写：

允许重构


## 🚫 禁止自动恢复旧代码

禁止：

- git restore
- checkout old commit
- reset 到旧版本
- 自动回滚
- 自动 merge

除非用户明确写：

允许回滚


## 🚫 禁止修改环境变量相关代码

以下文件默认禁止修改：

- authService.ts
- googleIdentityService.ts
- supabase-admin.ts
- vite.config.ts
- package.json
- wrangler.toml
- cloudflare config
- env 读取代码

除非用户明确允许。


## 🚫 禁止跨文件修改

一次任务最多允许修改：

<= 2 个文件

否则必须请求确认。


## 🚫 必须先说明再修改

Agent 必须先输出：

将修改文件：
- xxx
- xxx

等待确认后才能改。


## 🚫 禁止隐式执行命令

禁止自动执行：

- npm install
- npm ci
- npm build
- git commit
- git push

除非用户明确要求。


## 🚫 优先稳定原则

当前项目处于上线阶段：

必须遵守：

- 不破坏已有功能
- 不重构已有模块
- 不改变架构
- 不改变登录系统
- 不改变支付系统
- 不改变部署方式

只允许小范围修复。


## ✅ Agent 必须遵守

违反以上规则视为错误执行。


# ===============================
# RELEASE LOCK MODE (STAGE 1)
# ===============================

当前项目处于上线临界阶段。

所有 Agent 必须进入 Release Lock 模式。

目标优先级：

1. 不破坏已有功能
2. 不改变认证系统
3. 不改变 Supabase
4. 不改变 Cloudflare
5. 不改变 Billing / Paddle / Whop
6. 不改变 Prompt Engine 架构
7. 不改变 Template Engine 架构
8. 不改变 Project / Save / Export 结构
9. 不改变 Env 读取逻辑
10. 不改变 Build / CI / Deploy 行为

除非用户明确写：

允许修改核心系统


# ===============================
# CRITICAL FILE FREEZE
# ===============================

以下文件默认冻结：

- src/services/authService.ts
- src/services/googleIdentityService.ts
- src/services/supabase-admin.ts
- src/services/posthog.ts
- src/services/sentry.ts
- vite.config.ts
- package.json
- wrangler.toml
- functions/*
- supabase/*
- cloudflare/*
- docs/supabase-env-matrix.md
- docs/live-development-strategy.md
- docs/help-system-final.md

禁止修改，除非用户逐字授权。


# ===============================
# GIT SAFETY MODE
# ===============================

禁止执行：

git restore
git reset
git checkout
git clean
git rebase
git stash
git pull --rebase
git push --force
git branch -D
git revert

禁止自动回滚代码。

禁止自动切换分支。

禁止自动合并。

禁止自动恢复旧版本。


允许：

git status
git diff

只有用户明确要求时允许：

git add
git commit
git push


# ===============================
# FILE CHANGE LIMIT
# ===============================

一次任务最多允许修改：

<= 2 个文件

超过必须先询问。


# ===============================
# NO AUTO REFACTOR
# ===============================

禁止自动重构：

- auth
- supabase
- prompt engine
- template engine
- project system
- export system
- save system
- billing
- login
- env
- build

除非用户写：

允许重构


# ===============================
# ENV + AUTH + BILLING LOCK
# ===============================

涉及以下内容必须二次确认：

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_CLIENT_ID
- Paddle
- Whop
- Webhook
- Functions
- Cloudflare Pages
- Workers

Agent 必须先输出：

即将修改核心配置

等待确认。


# ===============================
# UI / PROMPT / TEMPLATE SAFE MODE
# ===============================

允许修改：

UI
Prompt 微调
Template 内容
文案
布局
样式
小 bug

禁止修改：

结构层
执行层
认证层
部署层
支付层


# ===============================
# RELEASE MODE RULE
# ===============================

当前阶段目标：

稳定上线 > 新功能 > 重构

Agent 必须优先保证：

能 build
能 deploy
能登录
能生成
能保存
能复制提示词

任何破坏以上能力的修改都是错误执行。
