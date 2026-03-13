# 发布流程速查

## 安全策略（Codex）

1. **先更新测试服**：push 到 `develop`
2. **测试全过**：在测试服跑 smoke
3. **再更新正式服**：把 `develop` 合并到 `main`

## Cloudflare Pages 分支绑定

| 项目 | 部署分支 | 地址 |
|------|----------|------|
| scene-pilot-test | develop | https://scene-pilot-test.pages.dev |
| scene-pilot-prod | main | https://scene-pilot-prod.pages.dev / www.scenepilotix.com |

## 标准发布步骤

### 第一步：更新测试服

```bash
git checkout develop
git pull origin develop
# 若在 feature 分支开发完，先 merge 到 develop
git merge <your-feature-branch>
git push origin develop
```

→ Cloudflare 自动构建并部署到 scene-pilot-test

### 第二步：在测试服跑 smoke

```bash
APP_URL=https://scene-pilot-test.pages.dev npm run smoke:release
```

全通过再继续。

### 第三步：合并到 main，更新正式服

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

→ Cloudflare 自动构建并部署到 scene-pilot-prod

### 推荐：使用 PR

1. 创建 PR：`develop` → `main`
2. CI 检查通过
3. 合并 PR
4. main 自动部署到正式服

## 一键发布（含 secrets 同步）

```bash
# 仅测试服（sync secrets + smoke）
npm run release:safe -- --target test --skip-readiness

# 仅正式服（sync secrets + smoke）
npm run release:safe -- --target prod --skip-readiness
```

注意：`release:safe` 会 sync 环境变量、跑 audit 和 smoke，**不会**自动 push/merge。  
发布仍需按上面步骤手动 push 或通过 PR 合并。

## 当前状态（你之前 push 的）

- `main` 和 `develop` 都有 `e002438`（登录按钮统一等 UI 改动）
- 若正式服仍是旧版，检查：
  1. scene-pilot-prod 的 Production 分支是否设为 `main`
  2. 是否已触发过 main 的 deploy（Cloudflare Deployments 里看）
  3. 手动 Retry 一次最新 deploy
