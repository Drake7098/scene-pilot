# Session Handoff — 新窗口继续工作

## 一、当前阶段总览

| 阶段 | 状态 | 说明 |
|------|------|------|
| Freeze | ✅ 已完成 | 见 `docs/freeze-patch-report.md` |
| Template600 第一批 | ✅ 已完成 | 10 家族 |
| Template600 Batch 2 | ✅ 已完成 | 20 家族，120 变体 |
| Template Workspace UI | ✅ 已完成 | 见 `docs/template-workspace-ui.md` |
| Pro Workspace UI v1 | ✅ 已完成 | 见 `docs/pro-workspace-ui-v1.md` |
| Pro Workspace Parity Patch | ✅ 已完成 | 见 `docs/pro-workspace-parity-patch.md` |
| Rule Engine UI | ⏳ 待进入 | 前置条件已满足 |
| Prompt UI | 🚫 未开始 | 禁止本阶段做 |
| Export UI | 🚫 未开始 | 禁止本阶段做 |
| Platform Adapt UI | 🚫 未开始 | 禁止本阶段做 |
| Template Authoring | 🚫 未开始 | 禁止本阶段做 |

---

## 二、关键文档与路径

### 必读规则（开工前必须看）

| 文档 | 用途 |
|------|------|
| `AGENTS.md` | 全局规则、测试优先、Prompt Engines、Product UI Guardrails |
| `docs/live-development-strategy.md` | 跨线程同步、主流程、命名、保存/导出 |
| `.codex/skills/product-ui-guardrails/SKILL.md` | 产品 UI 变更时 |
| `.codex/skills/prompt-engine-architecture/SKILL.md` | 提示词/引擎相关 |
| `.codex/skills/ui-design-reference/SKILL.md` | UI 布局、Figma 参考 |

### 设计参考（UI 必须对齐）

- **路径**：`src/design-reference/figma/app.tsx`
- **颜色**：`#1f2125` bg, `#24262b` panel, `#3a3f46` border, `#343942` hover, `#f59e0b` accent

### 架构与字段

| 文档 | 内容 |
|------|------|
| `docs/field-to-module-mapping-v2.md` | 字段归属、continuityId 单入口 |
| `docs/disabled-state-policy-v1.md` | 禁用态策略 |
| `docs/architecture-status-report.md` | 架构现状 |
| `docs/pro-workspace-modules.md` | Pro 工作台模块说明 |

### 最近完成报告

| 文档 | 内容 |
|------|------|
| `docs/pro-workspace-ui-v1.md` | Pro Workspace 壳层、Nav、Editor、StatusRail |
| `docs/pro-workspace-parity-patch.md` | 生成/复制/导出、refs、rename、冲突跳转等补齐 |

---

## 三、Pro Workspace 结构（已实现）

```
Header（沿用）
└── Main Workspace
    ├── Left: ProWorkspaceNav (Scene | Objects | Composition | Constraints | Prompt Preview)
    ├── Center: ProWorkspaceEditor（按 section 切换面板）
    └── Right: ProWorkspaceStatusRail
    + Bottom: utility bar（Generate + Copy + Export）
```

**目录**：`src/features/pro-workspace/`

**已恢复能力**：生成、复制/导出、backgroundRef、localRefs、rename、冲突跳转、type 预设、shapeDesc、referencePolicy/Links、layoutLocked、T1 锁定说明、背景 preset。

---

## 四、全局限制（不可违反）

- ❌ 禁止新增字段
- ❌ 禁止修改 schema / payload / template schema
- ❌ 禁止修改 template engine / prompt engine / rule engine / compileV2 / resolveSceneStrategy / applyPayloadToProject
- ❌ 禁止新建第二套 apply 逻辑、project model、rule 体系
- ❌ 禁止做 Export UI / Platform Adapt UI / Prompt 编辑器 / Template Authoring（除非进入对应阶段）
- ✅ 仅允许：UI 组件、复用现有更新入口、展示规则/禁用态

---

## 五、建议的下一步工作

### 1. Rule Engine UI（可进入）

- 在 ConstraintInspectorPanel 或单独面板中展示规则命中和冲突
- 不编辑 rule 本身，不新增 rule 类型
- 复用现有 `detectSceneConflicts`、`stageObjectState` 等

### 2. 验证 Parity Patch

- 在 Pro 模式下跑一遍：生成、复制、导出、背景/对象 ref、rename、冲突跳转
- 确认 ExportPanel modal 在 Pro 模式下正常弹出

### 3. Pro / 非 Pro 收敛（可选）

- 非 Pro 仍用旧 Stage+PropsPanel
- 若需统一体验，可将非 Pro 并入 ProWorkspaceShell，用能力可见性区分

---

## 六、常用命令

```bash
npm run dev          # 本地开发
npm run build        # 构建
npm run engine:lock:check   # 引擎锁定检查（发布前）
```

---

## 七、与新 Agent 的说明模板

可直接复制下面内容给新窗口的 Agent：

---

**Context**: ScenePilot Pro 工作台。Freeze、Template600、Template Workspace UI、Pro Workspace UI v1、Parity Patch 均已完成。

**必读**：`AGENTS.md`、`docs/live-development-strategy.md`。UI 变更需对齐 `src/design-reference/figma/app.tsx`。

**限制**：不改 schema、engine、payload；不新增字段；不做 Export/Prompt/Template Authoring UI（除非进入对应阶段）。

**当前可进入**：Rule Engine UI 或 Parity Patch 验证。

**参考**：`docs/pro-workspace-parity-patch.md`、`docs/pro-workspace-ui-v1.md`、`docs/session-handoff-continue.md`。

---
