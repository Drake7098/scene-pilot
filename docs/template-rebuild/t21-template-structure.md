# T2.1 Template Freeze & Isolation

## Directory Structure

- `templates-old/`
  - `families/`
  - `payloads/`
  - `variants/`
- `templates-experiment/`
- `templates-benchmark/`
- `templates-final/`
- `templates-online/`

## Catalog Structure

Template catalog (`TemplateIndex`) now includes status fields:

- `isLegacy`
- `isEnabled`
- `isOnline`
- `isExperiment`
- `isBenchmark`

Status policy:

- 旧模板（legacy pool）
  - `isLegacy = true`
  - `isEnabled = false`
  - `isOnline = false`
  - `isExperiment = false`
  - `isBenchmark = false`
- 标杆模板（benchmark pool）
  - `isLegacy = false`
  - `isEnabled = true`
  - `isOnline = false`
  - `isExperiment = false`
  - `isBenchmark = true`

## UI Filtering Rules

- 模板工作台列表只使用 `isEnabled === true` 的模板。
- 最近/收藏/推荐均只读取 `isEnabled === true` 模板池。
- 搜索只在启用模板池中执行，因此 legacy 模板不可见、不可搜。

## Generation Rules

- 模板应用入口增加硬校验：`if (index.isEnabled !== true) reject`。
- 引擎 `applyTemplateFromIndex` 同步增加 `template_disabled` 拦截，防止绕过 UI 直接应用旧模板。

## Legacy Keep-for-Audit Rules

`templates-old/` 仅用于：

- AB 测试
- 字段统计
- prompt 对比
- 回归测试

legacy 模板不参与：

- UI 展示
- UI 搜索
- 正式应用与生成主链
- 收费可用模板池
