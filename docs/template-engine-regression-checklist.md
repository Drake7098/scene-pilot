# 模板系统回归检查清单

## 一、工作台

| 测试项 | 操作 | 预期 | 结果 | 备注 |
|--------|------|------|------|------|
| 打开模板工作台 | 点击入口打开 | 工作台正常展示，推荐/免费等 scope 可选 | 待验证 | |
| 搜索 | 输入关键词（中/英） | 结果按 name/family/tags/description 匹配 | 待验证 | |
| 分类筛选 | 选择 category | 列表仅显示该分类模板 | 待验证 | |
| pricing 筛选 | 选择 free / paid | 列表按定价筛选 | 待验证 | |
| domain 筛选 | 选择 domain | 列表按 domain 筛选 | 待验证 | |
| mediaType 筛选 | 选择 image / video | 列表按媒体类型筛选 | 待验证 | |
| ratio 筛选 | 选择比例 | 列表按比例筛选 | 待验证 | |
| storyPlan 筛选 | 选择 storyPlan | 列表按 storyPlan 筛选 | 待验证 | |
| grid/list 切换 | 切换视图 | 布局正确切换 | 待验证 | |
| 收藏/最近 | 切换 scope | 展示收藏或最近使用 | 待验证 | |

## 二、Base 模板

| 测试项 | 操作 | 预期 | 结果 | 备注 |
|--------|------|------|------|------|
| 查看详情 | 点击 base 模板 | 右侧详情展示正确 | 待验证 | |
| 点击使用 | 点击使用 | 进入 apply 流程 | 待验证 | |
| 正常应用到项目 | 应用 base 模板 | scenes 正确追加到项目 | 待验证 | |
| 重复使用不重复扣点 | 同项目再次使用同一 base 模板 | 不扣费，直接 apply | 待验证 | |
| 刷新后不重复扣点 | 刷新页面，同项目再次使用同一 base | 仍不扣费 | 待验证 | |

## 三、Continuity / Webdrama / Anime

| 测试项 | 操作 | 预期 | 结果 | 备注 |
|--------|------|------|------|------|
| 查看详情 | 点击 continuity 模板 | 详情正确展示多 scene 信息 | 待验证 | |
| 点击使用 | 点击使用 | 进入 apply 流程 | 待验证 | |
| scenes 合并 | 应用 continuity 模板 | 多 scene 正确合并到项目 | 待验证 | |
| 扣点逻辑 | 首次应用收费模板 | 按 cost 扣点 | 待验证 | |
| unlimited 判断 | unlimited 账号使用 | 不扣点 | 待验证 | |

## 四、架构

| 测试项 | 检查方式 | 预期 | 结果 | 备注 |
|--------|----------|------|------|------|
| 主流程走 engine / payload | 调用链 | handleUseTemplate → applyTemplateFromIndex → loadTemplatePayloadById → applyPayloadToProject | 待验证 | |
| 不走 snapshot | grep applyTemplateSnapshot | 主流程无调用 | 待验证 | |
| 不依赖 legacyAdapter 主路径 | grep getTemplateWorkspaceItemFromIndex | 主 apply 链未使用 | 待验证 | |
| Grid 策略切换 | items >= 400 | 使用 TemplateWorkspaceGridVirtual | 待验证 | |

## 五、已知问题

- 无（待回归后补充）

## 六、可接受风险

- 虚拟化当前为 passthrough，1000+ 时仍会全量渲染，需后续接入 react-window
- continuity builder 与 base 的 variant 机制仍部分独立
- 旧 TemplatesPanel（backup）仍依赖 applyTemplateSnapshot
