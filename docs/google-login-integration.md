# Google 登录对接清单（ScenePilot）

## 1) 平台侧必须准备
- Google Cloud 项目（可用于 OAuth 认证）。
- OAuth consent screen（外部应用需提交品牌与隐私链接）。
- Web Client ID（供前端 GIS 使用）。
- Authorized JavaScript origins（至少包含生产域名与本地调试域名）。

## 2) 应用配置项
- 前端环境变量：`VITE_GOOGLE_CLIENT_ID`
- 后端环境变量：`GOOGLE_CLIENT_ID`（单个）或 `GOOGLE_CLIENT_IDS`（逗号分隔多个）
- CORS 白名单：`CORS_ALLOW_ORIGINS` 需覆盖前端来源域名

## 3) 后端安全要求
- 必须在服务端校验 Google credential，不在前端直接信任。
- 最低校验项：
- `aud` 命中配置的 client id
- `iss` 为 `accounts.google.com` 或 `https://accounts.google.com`
- `exp` 未过期
- `email_verified=true` 且 `email`/`sub` 存在

## 4) 当前代码落地状态
- 后端接口：`/api/auth/google`
- 文件：
- `functions/api/auth/google.ts`
- `functions/api/_shared/google-auth.ts`
- 前端服务：
- `src/services/googleIdentityService.ts`
- `src/services/authService.ts`（新增 `signInWithGoogle`）
- 账号中心 UI：
- `src/components/AccountCenterModal.tsx`
- `src/App.tsx`

## 5) 上线前还需确认
- Google 品牌审核与发布状态（若涉及公开用户）。
- 生产域名 HTTPS 与 origin 一致性。
- 登录失败场景文案与埋点（网络失败、配置缺失、用户关闭弹窗）。
