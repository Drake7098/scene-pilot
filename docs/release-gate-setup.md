# PR 合并闸门设置（develop / main）

目标：保证代码必须通过自动检查后才能合并，避免“没测完直接进主线”。

## 1) GitHub 分支保护

在仓库 `Settings -> Branches -> Add branch protection rule` 中分别给 `develop`、`main` 添加规则：

- `Require a pull request before merging`
- `Require approvals`：至少 `1`
- `Dismiss stale pull request approvals when new commits are pushed`
- `Require status checks to pass before merging`
- `Require branches to be up to date before merging`
- `Do not allow bypassing the above settings`
- （可选）`Require conversation resolution before merging`

## 2) 必选状态检查（勾选）

来自 `.github/workflows/pr-gate.yml`：

- `build-gate`
- `auth-billing-smoke`

说明：这两个检查必须全绿，PR 才允许合并。

## 3) 环境流转规则（三层）

1. 本地开发：功能开发 + 本地验证
2. 测试服：`develop` 自动部署，做联调与回归
3. 正式服：仅 `main` 部署

推荐发布路径：

- 功能 PR：`feature/* -> develop`
- 发布 PR：`develop -> main`

## 4) 操作约束

- 禁止直接 push 到 `main`
- 禁止直接 push 到 `develop`
- 任何流程、命名、策略变更必须在 PR 描述中写明影响范围

## 5) 并行开发隔离（上线前必跑）

当其他线程仍在优化时，发布线程必须先做“隔离检查”：

- `npm run release:readiness -- --target test`
- `npm run release:readiness -- --target prod`

默认会拦截以下风险：

- 分支不匹配（test 期望 `develop`，prod 期望 `main`）
- 工作区有未提交改动（dirty worktree）
- tracker 中存在活跃的非发布 P0/P1 任务（并行线程污染风险）

如需临时放行（不建议）：

- `--allow-dirty`
- `--allow-parallel`
- `--allow-branch-mismatch`

## 6) 独立发布工作区（推荐）

当主工作区仍在并行开发时，发布线程建议在独立 worktree 完成：

1. `git worktree add -b codex/release-snapshot-YYYYMMDD /tmp/scene-pilot-release main`
2. `cd /tmp/scene-pilot-release`
3. 在该目录执行发布验证与发版流程（避免被主工作区未提交改动污染）。

说明：

- 该 snapshot 代表“切分时刻”的稳定基线；
- 之后只把发布必须的提交按计划合入，不跟随并行优化线程自动漂移。
