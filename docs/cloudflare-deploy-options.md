# Cloudflare 双环境部署方案（当前为 Direct Upload）

**问题**：scenepilotix 与 scenepilotix1-prod 均为 **Direct Upload**，push Git 不会触发自动构建/部署。

**目标**：在安全前提下实现「push 后自动部署」或「可重复的一键部署」。

---

## 方案 A：改为 Git 连接（推荐，最省心）

**做法**：在 Cloudflare Dashboard 把两个 Pages 项目改为「连接 GitHub」，由 CF 在 push 时自动构建并部署。

**步骤**：

1. Cloudflare Dashboard → **Workers & Pages** → **scenepilotix** → **Settings** → **Builds & deployments**。
2. 若当前为 **Direct Upload**，找到 **Connect to Git**（或 **Create with Git** 若需重建）。
3. 连接仓库 `Drake7098/scene-pilot`，**Production branch** 设为 **develop**，保存。
4. 对 **scenepilotix1-prod** 重复，**Production branch** 设为 **main**。

**安全与行为**：

- 构建在 Cloudflare 侧执行，**无需**在仓库或 CI 里存 Cloudflare API Token。
- 只有有权限改 CF 项目的人能改连接分支；谁 push 了 develop/main 在 Git 可见。
- 环境变量、Build 配置仍在 CF 项目里配置，不进入 Git。

**注意**：改为 Git 后，原有 Direct Upload 的「当前部署」会被新的 Git 构建替代；若 Build 配置（根目录、build 命令、输出目录）没配过，需在 CF 里设一次（例如 Build command: `npm run build`，Output directory: `dist`，Root: 空或 `/`）。

---

## 方案 B：保留 Direct Upload + GitHub Actions 部署

**做法**：不接 Git，保留 Direct Upload；用 GitHub Actions 在 push 时本地构建，再用 Wrangler 把产物推到 Cloudflare Pages。

**安全要点**：

- 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 里新增 Secret：**CLOUDFLARE_API_TOKEN**（或 **CF_PAGES_DEPLOY_TOKEN**）。
- Token 建议在 Cloudflare 创建 **API Token**，权限仅勾选 **Account** → **Cloudflare Pages** → **Edit**，不勾选其他。
- 不要将 Token 写进代码或日志；Actions 里用 `${{ secrets.CLOUDFLARE_API_TOKEN }}`。
- 若希望 prod 更谨慎：可为 **main** 配置 **Environment protection rules**（如需审批再跑），或仅允许从 **develop** merge 到 main 后自动部署。

**仓库内改动**：

- 新增 workflow：`.github/workflows/deploy-pages.yml`（见下节）。
- 每次 push **develop** 会构建并部署到 **scenepilotix**；每次 push **main** 会构建并部署到 **scenepilotix1-prod**。

**与方案 A 的取舍**：

- A：构建在 CF，不占 GitHub 配额，不暴露 Token 给 CI（仅 CF 与 GitHub 的 OAuth）。
- B：构建在 GitHub，需要 Token；适合必须用 Direct Upload 或希望构建完全在己方 CI 控制的场景。

---

## 方案 B 的 Workflow 示例

已在本仓库添加 `.github/workflows/deploy-pages.yml`（见该文件）。逻辑概要：

- **develop** push → `npm run build` → `wrangler pages deploy dist --project-name=scenepilotix`
- **main** push → `npm run build` → `wrangler pages deploy dist --project-name=scenepilotix1-prod`
- 使用 Secret：**CLOUDFLARE_API_TOKEN**；并需 **CLOUDFLARE_ACCOUNT_ID**（可 Secret 或 workflow 内变量）。

**首次使用**：

1. 在 Cloudflare 创建 API Token（Pages Edit）。
2. 在 GitHub 仓库 Secrets 中新增 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
3. push 到 develop 或 main 触发对应部署。

---

## 建议

- **优先尝试方案 A**：在 CF 里把两个项目都改成连 GitHub，Production branch 分别设为 develop / main。无需改代码、无需 Token，push 即自动部署。
- 若因账号/权限或历史原因必须保留 Direct Upload，再用 **方案 B**，并严格限制 Token 权限与 Environment 保护（尤其 main）。

---

## 文档与流程同步

- 若采用方案 A：`docs/release-flow-quick.md`、`docs/cloudflare-sync-check.md` 中「push 后 Cloudflare 自动构建」的表述与事实一致，无需改。
- 若采用方案 B：可在上述文档中注明「自动部署由 GitHub Actions 执行（Direct Upload）」，避免误以为 CF 已连 Git。
