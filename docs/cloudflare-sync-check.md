# Cloudflare Pages 未同步检查清单

Updated: 2026-03-15（develop 服务器 + prod，删除了 test）

## 当前部署拓扑

- **删除了 test**（scene-pilot-test）。
- 保留 **develop 服务器**（Cloudflare 项目名 scene-pilot-test，域名 scene-pilot-test.pages.dev）+ **正式服**（scene-pilot-prod）。

| 环境 | Cloudflare 项目 | 部署分支 | 地址 |
|------|-----------------|----------|------|
| develop 服务器 | scene-pilot-test | **develop** | https://scene-pilot-test.pages.dev |
| 正式服 | scene-pilot-prod | **main** | https://scene-pilot-prod.pages.dev / www.scenepilotix.com |

## develop 服务器未更新

- push **develop** 后应触发 scene-pilot-test 的部署。
- 检查：Cloudflare Pages → scene-pilot-test → Deployments，确认 Production branch = `develop`，有最新提交的 deploy；若没有则检查 Git 连接或手动 **Create deployment** 选 develop。

## 正式服未更新

- push **main** 后应触发 scene-pilot-prod 的部署。
- 检查：Cloudflare Pages → scene-pilot-prod → Deployments，确认 Production branch = `main`，有最新提交的 deploy；若没有则检查 Git 连接或手动 **Create deployment** 选 main。

## 本地验证

- 审计（需 CF_API_TOKEN、CF_ACCOUNT_ID）：`CF_API_TOKEN=... CF_ACCOUNT_ID=... npm run release:cloudflare:audit`  
  （脚本里 test 对应 develop 服务器，默认项目名 scene-pilot-test；prod 对应 scene-pilot-prod。）
- Smoke：  
  - develop：`APP_URL=https://scene-pilot-test.pages.dev npm run smoke:release`  
  - prod：`APP_URL=https://scene-pilot-prod.pages.dev npm run smoke:release` 或 `APP_URL=https://www.scenepilotix.com npm run smoke:release`
