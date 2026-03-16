# 发布流程：develop（测试服）与 main（正式服）

本文档是「本地开发 → 测试站 → 正式站」的单一事实源。核心原则：**develop 只更新测试服，正式服必须通过发布命令更新**。

---

## 1. 自动化部署整体流程

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            代码从本机到两个站点的流向                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [ 场景二：发布正式 ]                     [ 场景一：日常开发与测试 ]                │
│                                                                                 │
│  本地 develop 测试通过                    本地 develop 分支开发                    │
│         │                                        │                               │
│         ▼                                        ▼                               │
│  npm run deploy:prod                     git push origin develop                  │
│         │                                        │                               │
│         ▼                                        ▼                               │
│  脚本自动：checkout main                  GitHub 收到 develop 更新                  │
│  → merge develop                                         │                       │
│  → push origin main                                      ▼                       │
│         │                                Cloudflare 测试项目 监测 develop          │
│         ▼                                        │                               │
│  GitHub 收到 main 更新                             ▼                               │
│         │                                scenepilotix 自动构建并部署            │
│         ▼                                        │                               │
│  Cloudflare 正式项目 监测 main                      ▼                               │
│         │                                scenepilotix.pages.dev 更新           │
│         ▼                                        （正式站不受影响）                 │
│  scenepilotix1-prod 自动构建并部署                                                    │
│         │                                                                         │
│         ▼                                                                         │
│  正式域名 更新                                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 场景一：日常开发与测试（只更新测试服）

**目标**：新功能只在测试站验证，正式站不受影响。

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 在本地确保处于 **develop** 分支 | `git checkout develop`，在此分支改代码 |
| 2 | 推送 | `git push origin develop` |
| 3 | 测试站自动构建 | Cloudflare 测试项目（或 GitHub Actions）监测到 **develop** 更新，自动拉代码并执行 `npm run build` |
| 4 | 测试站更新 | 构建完成后，**scenepilotix.pages.dev** 上线新版本，可在此验证 |
| 注意 | 正式站 | 此时 **正式站完全不受影响**，仅 develop 分支被更新 |

**约定**：以后在 develop 开发，**push 只更新测试服**；不要直接 push main（正式服更新走场景二）。

---

## 3. 场景二：发布到正式环境

**目标**：测试站验证通过后，将同一套代码发布到正式站。

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 确认测试站 | 在 scenepilotix.pages.dev 确认功能正常 |
| 2 | 执行发布命令 | 在仓库根目录执行：**`npm run deploy:prod`** |
| 3 | 脚本自动完成 | 脚本会：切换到 main → 合并 develop → 推送 main → 切回 develop |
| 4 | 正式站自动构建 | Cloudflare 正式项目（或 GitHub Actions）监测到 **main** 更新，自动构建并部署 |
| 5 | 正式站更新 | 构建完成后，正式域名（如 www.scenepilotix.com / scenepilotix1-prod.pages.dev）上线 |

**约定**：**要更新正式服，必须推 prod 发布**，即执行 `npm run deploy:prod`（或等价：手动 merge develop 到 main 再 push main）。不要在日常开发时直接改 main 或 push main。

---

## 4. 当前状态与缺失项

### 4.1 Git 侧（已就绪）

| 项目 | 状态 | 说明 |
|------|------|------|
| 分支 | ✅ | `develop`、`main` 存在，日常在 develop 开发 |
| 推送测试服 | ✅ | `git push origin develop` 即只更新测试服 |
| 发布正式服 | ✅ | `npm run deploy:prod` 已配置（package.json）：切 main → merge develop → push main → 切回 develop |

### 4.2 Cloudflare 侧（待补足）

| 项目 | 状态 | 说明 |
|------|------|------|
| scenepilotix | ⚠️ 无 Git 连接 | 当前为 Direct Upload，push develop **不会**自动触发构建 |
| scenepilotix1-prod | ⚠️ 无 Git 连接 | 当前为 Direct Upload，push main **不会**自动触发构建 |

要使「push develop → 测试站自动部署」「push main → 正式站自动部署」生效，须二选一完成下列之一。

---

## 5. 补足清单（任选一种）

### 方案 A：Cloudflare 连接 Git（推荐）

**按步操作**：打开 **docs/cloudflare-connect-git-runbook.md**，在浏览器中按清单完成以下两项即可。

- [ ] **scenepilotix**：Connect to Git → 仓库 `Drake7098/scene-pilot`，**Production branch = develop**，Build command: `npm run build`，Output: `dist`，并配置 Production 的 `VITE_*` 等变量（见 runbook 与 `docs/supabase-env-matrix.md`）。
- [ ] **scenepilotix1-prod**：同上，**Production branch = main**，环境变量用正式环境（见 runbook 与矩阵）。

完成后：push develop 自动部署测试站，push main（或 `npm run deploy:prod`）自动部署正式站，无需在 GitHub 配置 Token。

### 方案 B：保留 Direct Upload，用 GitHub Actions

- [ ] 在 Cloudflare 创建 API Token（权限：Account → Cloudflare Pages → Edit）
- [ ] GitHub 仓库 → Settings → Secrets and variables → Actions → 新增 **CLOUDFLARE_API_TOKEN**、**CLOUDFLARE_ACCOUNT_ID**
- [ ] 已存在 `.github/workflows/deploy-pages.yml`：push develop 会构建并部署到 scenepilotix，push main 会部署到 scenepilotix1-prod

完成后：不改 Cloudflare 的「无 Git 连接」状态，由 Actions 在 push 时构建并用 Wrangler 上传到对应 Pages 项目。

---

## 6. 相关文档

- **速查**：`docs/release-flow-quick.md`
- **部署方案对比**：`docs/cloudflare-deploy-options.md`
- **Git + CF 操作步骤**：`docs/git-workflow-and-cloudflare-setup.md`
- **策略与拓扑**：`docs/live-development-strategy.md`（发布拓扑一节）
