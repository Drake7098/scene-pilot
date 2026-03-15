# PR 合并闸门设置（可选，安全以后再加）

目标：需要时再启用「必须通过自动检查才能合并」，避免未测完直接进主线。  
**当前策略（2026-03-15 起）**：快捷优先，**允许直接 push** develop 和 main；本页规则为可选，不强制。

## 1) GitHub 分支保护（可选）

若将来要启用，在仓库 `Settings -> Branches -> Add branch protection rule` 中给 `develop`、`main` 添加规则：

- `Require a pull request before merging`
- `Require approvals`：至少 `1`
- `Require status checks to pass before merging`
- 来自 `.github/workflows/pr-gate.yml` 的检查：`build-gate`、`auth-billing-smoke`

**当前**：不要求分支保护，可直接 push develop / main。

## 2) 环境与发布流程

- **develop 服务器**：push `develop` → Cloudflare scene-pilot-test（scene-pilot-test.pages.dev）自动部署。
- **正式服**：push `main` → Cloudflare scene-pilot-prod 自动部署。
- 推荐：先 push develop，确认 develop 服务器无误后再 merge 到 main 并 push，更新 prod。

详见：`docs/release-flow-quick.md`。

## 3) 并行开发隔离（可选）

上线前若需严格隔离，可跑：

- `npm run release:readiness -- --target test`（develop 服务器）
- `npm run release:readiness -- --target prod`

放行参数：`--allow-dirty`、`--allow-parallel`、`--allow-branch-mismatch`。

## 4) 独立发布工作区（可选）

- `git worktree add -b codex/release-snapshot-YYYYMMDD /tmp/scene-pilot-release main`
