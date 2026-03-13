## 变更说明
- 目标：
- 主要改动：
- 风险点：

## 必过检查
- [ ] `npm run engine:lock:check`
- [ ] `npm run build`
- [ ] PR Gate 工作流全绿（`build-gate` + `auth-billing-smoke`）

## 人工回归（测试服）
- [ ] 登录主路径可用（邮箱密码 / Google）
- [ ] 会员与点数页可打开
- [ ] 关键导出与保存不回归

## 发布确认
- [ ] 本 PR 目标分支正确（功能到 `develop`，发布到 `main`）
- [ ] 已更新必要文档（如流程、命名、规则变更）
