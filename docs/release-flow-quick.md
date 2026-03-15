# 发布流程速查

**约定**：在 develop 开发，**push 只更新测试服**；要更新正式服必须执行 **`npm run deploy:prod`**（推 prod 发布）。详见 **docs/deploy-flow-develop-main.md**。

## 当前部署拓扑（2026-03-15）

| 项目 | 部署分支 | 地址 | 说明 |
|------|----------|------|------|
| scene-pilot-test | develop | https://scene-pilot-test.pages.dev | 日常 push develop 只更新这里 |
| scene-pilot-prod | main | https://scene-pilot-prod.pages.dev / www.scenepilotix.com | 仅通过 `npm run deploy:prod` 或 push main 更新 |

- 允许直接 push，不要求 PR；推荐先 push develop，确认测试站后再发布正式。

## 日常：只更新测试服

```bash
git checkout develop
git pull origin develop   # 可选，拉最新
# 在 develop 上开发...
git push origin develop
```

→ 仅 **scene-pilot-test** 会随 develop 更新（需 Cloudflare 已连 Git 或已配 GitHub Actions，见下文）。

## 发布正式服

```bash
npm run deploy:prod
```

→ 脚本会：切到 main → merge develop → push main → 切回 develop；**scene-pilot-prod** 随 main 更新。

（等价手动：`git checkout main && git pull origin main && git merge develop && git push origin main && git checkout develop`。）

## 其他发布相关命令（secrets / 审计，不自动 push）

```bash
# 仅同步 develop 服务器相关 secrets
npm run release:safe -- --target test --skip-readiness

# 仅正式服
npm run release:safe -- --target prod --skip-readiness
```

发布仍依赖上述 push develop / `deploy:prod` 触发实际部署。

## 未更新时检查

- **测试站**：Cloudflare Pages → scene-pilot-test → Deployments，看是否有最新 deploy（Git 连接则看 Production branch = develop；Direct Upload 则看是否由 GitHub Actions 触发）。
- **正式站**：同上，scene-pilot-prod，对应 main。

**若两项目均为「无 Git 连接」**：push 不会触发部署。须在 **docs/deploy-flow-develop-main.md** 的「补足清单」中任选一种完成：**方案 A** 在 Cloudflare 连 Git，或 **方案 B** 在 GitHub 配好 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。详见 **docs/cloudflare-deploy-options.md**。
