# 模板系统重构 Step 3 输出说明

## 1. 连续叙事模板总数统计

**200** 个（100 网剧 + 100 动漫）

- 基础模板：400
- 连续叙事：200
- **总计：600**

## 2. 网剧模板家族数 / 变体数

- **家族数**：20
- **变体数**：5（Starter / Close Emotion / Multi Angle / High Tension / Advanced Continuity）
- **小计**：100

目录：`src/features/template-workspace/data/families/continuity-webdrama/`

## 3. 动漫模板家族数 / 变体数

- **家族数**：20
- **变体数**：5（Starter / Vertical Short / Battle Motion / Cinematic Anime / Advanced Continuity）
- **小计**：100

目录：`src/features/template-workspace/data/families/continuity-anime/`

## 4. continuity payload 设计说明

每个连续模板的 payload 包含：

- **scenes**：>= 2 个分镜，带 entryDirection / exitDirection / inheritFromPrevious
- **continuity**：
  - `enabled: true`
  - `characterCarryOver`, `directionCarryOver`, `cameraCarryOver`, `bgCarryOver`
  - `referenceSlots` 预留给角色参考图
- **objects**：layers 通过 `notes: @continuityId:xxx` 做跨 scene 延续
- **projectDefaults**：`storyPlan: "continuous"`, `sceneCount`, `totalDuration`, `sceneDurations`

## 5. credits 扣点逻辑说明

- **Free 模板**（cost = 0）：直接使用，不扣点
- **普通基础模板**（cost = 3）：扣 3 credits
- **连续叙事 / 高复杂模板**（cost = 5）：扣 5 credits
- **同项目不重复扣点**：`appliedTemplateIdsForBillingRef` 记录本项目中已扣过费的模板 ID，再次使用不重复扣
- **新项目**：新建或打开项目时清空记录，再次使用同一模板会重新扣点
- **Studio/Pro+**：`canUseUnlimitedTemplates(user)` 为 true 时不扣点

## 6. Studio / unlimitedTemplates 预留说明

- **`canUseUnlimitedTemplates(user)`**：`utils/entitlement.ts`
- **UserState**：新增可选字段 `unlimitedTemplatesEnabled?: boolean`
- **用途**：未来 Studio/Pro+（如 $68/月）无限模板使用
- **当前**：始终为 false，需在后端/账号体系中配置

## 7. Template Workspace 截图

请手动验证：

- **连续模板域**：筛选「网剧连续」或「动漫连续」
- **credits 提示**：积分不足时弹出购买点数弹层

## 修改/新增文件列表

**新增**：
- `data/families/continuity-webdrama/families.ts`
- `data/families/continuity-webdrama/buildPayload.ts`
- `data/families/continuity-webdrama/indexBuilder.ts`
- `data/families/continuity-anime/families.ts`
- `data/families/continuity-anime/buildPayload.ts`
- `data/families/continuity-anime/indexBuilder.ts`
- `services/templateContinuityLoader.ts`

**修改**：
- `model/templateTypes.ts`：TemplateDomain, ContinuityVariantWebdrama, ContinuityVariantAnime
- `model/templateIndex.ts`：domain
- `model/templateFilter.ts`：domain 筛选
- `model/templateCategory.ts`：TEMPLATE_DOMAIN_OPTIONS
- `state/templateWorkspaceState.ts`：filters.domain
- `data/templateIndexData.ts`：合并 200 条连续模板索引
- `services/templateLoader.ts`：支持 tpl600_*
- `services/templateApplyService.ts`：applyTemplateFromIndex, applyPayloadToProject 多分镜
- `services/templateSearchService.ts`：domain 筛选
- `components/TemplateWorkspaceHeader.tsx`：domain 下拉
- `utils/entitlement.ts`：canUseUnlimitedTemplates
- `types/account.ts`：unlimitedTemplatesEnabled
- `App.tsx`：handleUseTemplateFromWorkspace 支持连续性模板与同项目不重复扣点
- `Sidebar.tsx`：使用 TemplateQuickEntry，支持 600 模板的最近/收藏
