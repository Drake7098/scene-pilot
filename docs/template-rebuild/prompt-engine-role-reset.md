# Prompt Engine Role Reset

## New Role

Prompt Engine 保留职责：

- 分段组织
- 顺序编排
- flags / platform profile
- provider 参数适配
- 规范化和输出拼接

Prompt Engine 不再承担职责：

- 直接从零散字段拼主视觉语言

## Current Integration

已接入：

- `src/utils/prompt.ts`
  - `formatScenePrompt` 主描述改为：`buildShotModel -> describeShot`
- `hasV2` 分支
  - v2 编译内容前置 ShotDescription 段，确保主描述来源一致
- `continuous/multicam/edit/single` 分支
  - 统一使用 ShotDescription 作为分镜主描述

## Result

主链路从：
- `Template Fields -> Final Prompt`

改为：
- `Template Fields -> Shot Model -> Shot Description -> Prompt Engine -> Final Prompt`
