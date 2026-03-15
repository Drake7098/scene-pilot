# 发布流程速查

## 当前部署拓扑（快捷优先，2026-03-15）

- **删除了 test**（scene-pilot-test）；保留 **develop 服务器** + **prod 正式服**。
- **允许直接 push**，不要求必须 PR 合并；安全闸门以后再加。

| 项目 | 部署分支 | 地址 | 说明 |
|------|----------|------|------|
| scene-pilot-test | develop | https://scene-pilot-test.pages.dev | 先更新这里 |
| scene-pilot-prod | main | https://scene-pilot-prod.pages.dev / www.scenepilotix.com | 确认 develop 后再更新 |

## 标准发布步骤

### 第一步：更新 develop 服务器

```bash
git checkout develop
git pull origin develop
# 合并你的改动（或直接在本分支开发）
git push origin develop
```

→ Cloudflare 自动构建并部署到 **scene-pilot-test**（develop 服务器，域名 scene-pilot-test.pages.dev）。

### 第二步：确认 develop 后，再更新正式服

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

→ Cloudflare 自动构建并部署到 **scene-pilot-prod**（正式服）。

- **不要求 PR**：可直接 push main；若你习惯用 PR 再合并也可以。
- 推荐顺序：先 push develop，等 develop 服务器更新并确认无误后，再 push main 更新 prod。

## 一键发布（secrets 同步，不自动 push）

```bash
# 仅 develop 服务器
npm run release:safe -- --target test --skip-readiness

# 仅正式服
npm run release:safe -- --target prod --skip-readiness
```

说明：`--target test` 对应 **develop 服务器**（scene-pilot-test）。发布仍需手动 push develop / main。

## 未更新时检查

- **develop 服务器**：Cloudflare Pages → scene-pilot-test → Deployments，确认有最新 deploy（若已连 Git 则看 Production branch = develop；若为 Direct Upload 则看是否由 GitHub Actions 触发）。
- **正式服**：同上，scene-pilot-prod / main。

**若当前为 Direct Upload（push 不触发部署）**：见 **docs/cloudflare-deploy-options.md** — 可选「改为 Git 连接」或「保留 Direct Upload + GitHub Actions 部署」。
