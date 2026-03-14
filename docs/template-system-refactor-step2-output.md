# 模板系统重构 Step 2 输出说明

## 1. 实际生成的模板总数

**400** 个模板（40 家族 × 10 变体）

## 2. 免费模板总数

**40** 个（每家族 1 个 Free Starter）

## 3. familyBases 数量

**40** 个（每家族 1 个 base，以 free_starter 为基底）

## 4. variantPatches 数量

**400** 个（每 (familyId, variant) 一对一个 patch；free_starter 的 patch 为空对象 `{}`）

## 5. buildTemplatePayload 的实现说明

1. **入口**：`buildTemplatePayload(familyId, variant)` 或 `loadTemplatePayload(familyId, variant)`
2. **流程**：
   - 调用 `getFamilyBase(familyId)` 获取家族基底
   - 调用 `getVariantPatch(familyId, variant)` 获取变体补丁
   - 若存在 base：用 `deepMerge(base, patch)` 合并后返回
   - 若无 base：fallback 到 `buildPayloadFromUnifiedTemplate`（从 templateLibrary400 读取）
3. **基底内容**：`projectDefaults`（mediaType, storyPlan, aspectRatio）+ `scenes[0]`（含 `raw` Scene）
4. **补丁内容**：free_starter 为 `{}`；其它变体为 `projectDefaults` + `scenes` 覆盖
5. **注册时机**：首次调用 `getTemplateIndex()` 或 `loadTemplatePayload()` 时执行 `registerTemplate400BasesAndPatches()`

## 6. 搜索与筛选接入说明

### 搜索 (matchesSearch)

支持字段：

- `nameZh` / `nameEn`
- `familyId` / `familyNameEn` / `familyNameZh`
- `descriptionZh` / `descriptionEn`
- `tags`
- `category`

### 分类 (TemplateCategoryNav)

- 全部 / 推荐 / 免费 / 最近 / 收藏 / 我的模板
- 产品 / 对话 / 广告 / 短视频 / 社媒 / 镜头运动 / 构图骨架 / 连续调度 / 封面海报

### 筛选 (TemplateWorkspaceFilters)

- **媒体类型**：all / image / video
- **场景计划**：all / single / continuous / multi_cam / edited
- **比例**：all / 16:9 / 9:16 / 1:1
- **免费/付费**：all / free / paid

### 成本规则

- Free Starter：cost = 0
- Multi-object / Advanced Motion：cost = 5
- 连续调度家族（continuous）：cost = 5
- 其余：cost = 3

## 7. Template Workspace 截图

请手动在 Pro 工作台打开模板库，验证：

- **全部**：约 400 个模板
- **免费模板**：40 个（均为 Free Starter）
- **某分类**（如「产品」）：约 80 个（8 家族 × 10 变体）

## 修改文件列表

- `src/data/templateLibrary400.ts`：cost 规则加入 continuous=5，isFeatured 仅 free_starter
- `src/features/template-workspace/data/families/register400.ts`：新增，注册 40 base + 400 patch
- `src/features/template-workspace/data/templateIndexData.ts`：在 getTemplateIndex 时触发注册
- `src/features/template-workspace/model/templateIndex.ts`：增加 familyNameEn / familyNameZh
- `src/features/template-workspace/data/families/indexAdapter.ts`：填充 familyNameEn / familyNameZh
- `src/features/template-workspace/services/templateSearchService.ts`：搜索支持 familyName
- `src/features/template-workspace/components/TemplateCard.tsx`：展示 familyName
- `src/features/template-workspace/components/TemplateWorkspaceDetail.tsx`：展示 familyName
