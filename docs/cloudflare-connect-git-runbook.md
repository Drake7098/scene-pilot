# 方案 A 操作清单：Cloudflare 连 Git（按步执行）

在 Cloudflare Dashboard 里把 **scenepilotix** 和 **scenepilotix1-prod** 改为「连接 GitHub」，实现 push 后自动构建部署。请按顺序在浏览器中完成，完成一项勾一项。

**仓库**：`Drake7098/scene-pilot`  
**构建**：Build command `npm run build`，Build output directory `dist`，Root 留空或 `/`

---

## 一、测试站 scenepilotix（对应 develop）

- [ ] 1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) 并登录。
- [ ] 2. 左侧 **Workers & Pages**，在列表里点击 **scenepilotix**。
- [ ] 3. 顶部 **Settings**，左侧 **Builds & deployments**（或 **Build configuration**）。
- [ ] 4. 若显示 **Direct Upload**：找到 **Connect to Git** 或 **Change source**，点击。
- [ ] 5. 选择 **GitHub**；若首次使用，按提示授权 Cloudflare 访问 GitHub。
- [ ] 6. 选择仓库：**Drake7098 / scene-pilot**。
- [ ] 7. **Production branch** 填：**`develop`**（必须小写、无空格）。
- [ ] 8. 保存后，在 **Build configuration** 中确认或填写：
  - **Framework preset**：None 或 Vite（若可选）
  - **Build command**：`npm run build`
  - **Build output directory**：`dist`
  - **Root directory**：留空或 `/`
- [ ] 9. **Settings → Environment variables**（或同页的 Environment variables）：
  - 选择 **Production**（或 Production + Preview 若需一致）。
  - 添加变量（值来自 `docs/supabase-env-matrix.md`「develop 服务器」前端部分，以下为必填示例，其余按需从矩阵复制）：
    - `VITE_SUPABASE_URL` = `https://sampclwsqputkeswqbbu.supabase.co`
    - `VITE_SUPABASE_ANON_KEY` = \<你的 Supabase anon key\>
    - `VITE_APP_BASE_URL` = `https://scenepilotix.pages.dev`
    - `VITE_BILLING_ENABLED` = `0`
    - `VITE_BILLING_MODE` = `sandbox`
    - `VITE_BILLING_LIVE_ALLOWED` = `0`
    - `VITE_BILLING_ALLOW_MOCK_FALLBACK` = `0`
    - `VITE_AUTH_MOCK_FALLBACK` = `0`
  - 保存。
- [ ] 10. 回到 **Deployments**，若已连 Git，可点 **Retry deployment** 或等下次 push develop 触发；或本地执行 `git push origin develop` 验证。

---

## 二、正式站 scenepilotix1-prod（对应 main）

- [ ] 1. 在 **Workers & Pages** 列表点击 **scenepilotix1-prod**。
- [ ] 2. **Settings** → **Builds & deployments**（或 **Build configuration**）。
- [ ] 3. 若为 **Direct Upload**：**Connect to Git** / **Change source** → **GitHub** → 仓库 **Drake7098/scene-pilot**。
- [ ] 4. **Production branch** 填：**`main`**（必须小写）。
- [ ] 5. **Build configuration** 同测试站：Build command `npm run build`，Build output directory `dist`，Root 留空或 `/`。
- [ ] 6. **Environment variables** → **Production**，添加正式环境变量（见 `docs/supabase-env-matrix.md`「正式环境」前端部分），例如：
  - `VITE_SUPABASE_URL` = `https://sampclwsqputkeswqbbu.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = \<你的 Supabase anon key\>
  - `VITE_APP_BASE_URL` = `https://www.scenepilotix.com`
  - `VITE_BILLING_ENABLED` = `0`
  - `VITE_BILLING_MODE` = `live`
  - `VITE_BILLING_LIVE_ALLOWED` = `1`
  - `VITE_BILLING_ALLOW_MOCK_FALLBACK` = `0`
  - `VITE_AUTH_MOCK_FALLBACK` = `0`
  - （Paddle 等按矩阵补全）
  - 保存。

---

## 三、验证

- [ ] 本地执行：`git push origin develop`  
  → 到 **scenepilotix** 的 **Deployments** 页，应出现新构建；完成后访问 https://scenepilotix.pages.dev 确认。
- [ ] 本地执行：`npm run deploy:prod`  
  → 到 **scenepilotix1-prod** 的 **Deployments** 页，应出现新构建；完成后访问 https://scenepilotix1-prod.pages.dev 或正式域名确认。

---

## 若界面与上述不一致

- **Connect to Git** 可能在 **Builds & deployments**、**Source** 或 **Configuration** 下；新版本可能叫 **Link repository** 等，选 GitHub 并选仓库即可。
- 若项目原本是 **Create with Git** 创建的，则已连 Git，只需核对 **Production branch**（test=develop，prod=main）和 **Build configuration**、**Environment variables**。
- 完整环境变量列表与说明：**docs/supabase-env-matrix.md**。

完成上述后，方案 A 即生效：push develop 只更新测试站，`npm run deploy:prod` 更新正式站。
