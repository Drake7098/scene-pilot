# Git 工作流与 Cloudflare 自动化部署准备

## 1. 分支初始化（当前状态）

- **本地**：已有 `main`、`develop`，当前分支为 `develop`。
- **远程**：`origin/main`、`origin/develop` 已存在。
- **若需同步**：有未推送提交时，先 `git add` / `git commit`，再 `git push origin develop` 或 `git push origin main`。若希望从当前 main 新建 develop 并推送，可执行：
  ```bash
  git checkout main && git pull origin main
  git branch develop && git checkout develop
  git push -u origin develop
  ```

## 2. 本地快捷命令

已在 **package.json** 中添加：

```json
"deploy:prod": "git checkout main && git merge develop && git push origin main && git checkout develop"
```

**用法**：在 develop 测试通过后，在仓库根目录执行：

```bash
npm run deploy:prod
```

会依次：切到 main → 合并 develop → 推 main（触发正式站部署）→ 切回 develop。

## 3. 构建配置核对

### 3.1 输出目录

- **vite.config.ts**：未设置 `build.outDir`，Vite 默认输出目录为 **`dist`**。
- **tsconfig.json**：`noEmit: true`，TypeScript 不产出文件；`npm run build` 实际执行 `tsc -b && vite build`，产物由 Vite 写入 **`dist`**。
- **结论**：`npm run build` 生成目录为 **`dist`**，与 Cloudflare Pages（及 GitHub Actions 中的 `pages deploy dist`）一致。

### 3.2 环境变量（测试站 vs 正式站）

- 前端使用 **`import.meta.env.VITE_*`**，构建时由 Vite 内联。
- **Cloudflare Pages 连 Git 时**：测试站与正式站的环境变量在 **Cloudflare Dashboard** 分别配置，而不是用仓库里的 `.env`：
  - **scene-pilot-test**：在项目 **Settings → Environment variables** 中为 **Production**（或 Preview）配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`VITE_APP_BASE_URL` 等，指向测试环境。
  - **scene-pilot-prod**：同上，为 **Production** 配置正式环境变量（如 `VITE_APP_BASE_URL=https://www.scenepilotix.com`）。
- 同一套代码、不同 CF 项目、不同环境变量，即可区分测试站与正式站；无需在仓库维护多份 `.env`。

## 4. Cloudflare Dashboard 操作步骤（关联 Git）

按以下步骤在 Cloudflare 中把两个 Pages 项目**关联到 GitHub**，实现 push 后自动构建与部署。

### 4.1 准备

- 使用有 **Cloudflare 账户** 和 **GitHub 仓库访问权限** 的浏览器。
- 确认 GitHub 仓库为 **Drake7098/scene-pilot**（或你的实际仓库名）。

### 4.2 测试站（scene-pilot-test）— 关联 develop

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2. 左侧选择 **Workers & Pages**。
3. 在项目列表中点击 **scene-pilot-test**（若尚未创建，先 **Create application** → **Pages** → **Connect to Git** 创建并跳过下面“改为连接”的步骤）。
4. 进入项目后，顶部切到 **Settings**。
5. 左侧找到 **Builds & deployments**（或 **Build configuration**）。
6. 若当前为 **Direct Upload**：
   - 找到 **Connect to Git** 或 **Change source** 之类入口；
   - 点击后选择 **GitHub**，按提示授权 Cloudflare 访问 GitHub（若未授权过）；
   - 选择 **账户/组织** 和 **仓库**：`Drake7098/scene-pilot`；
   - **Production branch** 设为 **`develop`**；
   - 保存。
7. **Build configuration**（若可编辑）建议为：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - **Root directory**：留空（或 `/`）
8. **Environment variables**（同上页或 **Settings → Environment variables**）：为 **Production** 配置测试站所需变量（如 `VITE_APP_BASE_URL=https://scene-pilot-test.pages.dev` 等），保存。

### 4.3 正式站（scene-pilot-prod）— 关联 main

1. 在 **Workers & Pages** 项目列表中点击 **scene-pilot-prod**。
2. **Settings** → **Builds & deployments**（或 **Build configuration**）。
3. 若当前为 **Direct Upload**：同样通过 **Connect to Git** / **Change source** 连接 **GitHub**，选择仓库 **Drake7098/scene-pilot**。
4. **Production branch** 设为 **`main`**。
5. **Build configuration** 建议与上相同：Build command `npm run build`，Build output directory `dist`。
6. **Environment variables**：为 **Production** 配置正式站变量（如 `VITE_APP_BASE_URL=https://www.scenepilotix.com` 等），保存。

### 4.4 验证

- 在 GitHub 上对 **develop** 做一次 push（或合并 PR 到 develop），到 Cloudflare **scene-pilot-test** 的 **Deployments** 页查看是否出现新部署。
- 对 **main** 做一次 push（或执行 `npm run deploy:prod`），到 **scene-pilot-prod** 的 **Deployments** 查看是否出现新部署。

### 4.5 若界面与上述不一致

- Cloudflare 控制台可能随版本调整菜单名称；若找不到 **Connect to Git**，可在 **Builds & deployments** 或 **Source** 相关区域查找“连接 Git / GitHub”的入口。
- 若项目一开始就是用 **Create with Git** 创建的，则已连 Git，只需核对 **Production branch** 与 **Build configuration** 即可。

---

**相关文档**：`docs/cloudflare-deploy-options.md`（Git 连接 vs Direct Upload + CI）、`docs/release-flow-quick.md`（发布流程）。
