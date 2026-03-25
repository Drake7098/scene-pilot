# Tawk AI Assist API 集成指南

本文档说明如何将 ScenePilot 的 Support API 接入 Tawk AI Assist，让 AI 客服能够查询用户信息、计划、积分、支付状态等。

**⚠️ 重要提示：当前所有 API 返回的数据均为 MOCK 数据，仅用于开发和测试。**

---

## 快速配置

### 1. API Base URL

在 Tawk 后台配置时填写：

```
生产环境: https://scenepilot.com
测试环境: https://staging.scenepilot.com
```

### 2. OpenAPI Schema URL

```
https://scenepilot.com/openapi/tawk-support-openapi.json
```

### 3. 认证方式

- **类型**: API Key
- **Header 名称**: `x-api-key`
- **密钥值**: 从环境变量 `TAWK_SUPPORT_API_KEY` 获取

---

## Tawk 后台配置步骤

### 步骤 1: 进入 AI Assist 设置

1. 登录 [Tawk.to Dashboard](https://dashboard.tawk.to)
2. 选择你的 Property
3. 进入 **AI Assist** → **Custom Tools** (或 **OpenAPI Server**)

### 步骤 2: 添加 OpenAPI Server

1. 点击 **Add OpenAPI Server** 或 **Add Custom Tool**
2. 填写以下信息：

| 字段 | 值 |
|------|-----|
| Name | ScenePilot Support API |
| Description | 查询用户信息、计划、积分、账单状态（当前为 MOCK 数据） |
| Base URL | `https://scenepilot.com` |
| OpenAPI Schema URL | `https://scenepilot.com/openapi/tawk-support-openapi.json` |

### 步骤 3: 配置认证

选择认证类型：**API Key**

- **Key**: `x-api-key`
- **Value**: 你的 `TAWK_SUPPORT_API_KEY` 值
- **Add to**: Header

### 步骤 4: 测试连接

Tawk 会自动读取 OpenAPI Schema 并展示可用接口。你可以测试以下查询：

```
GET /api/tawk-support?action=getSystemStatus
```

预期返回：
```json
{
  "success": true,
  "data": {
    "systemOk": true,
    "generationOk": true,
    "billingOk": true,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0-mock"
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getSystemStatus",
    "message": "Static mock status; future: connect to health checks"
  }
}
```

---

## 可用接口说明

### 1. getUserPlan - 查询用户计划

**用途**: 获取用户的计划和等级信息

**参数**:
- `userId` (可选): 用户ID
- `email` (可选): 用户邮箱

**示例**:
```
GET /api/tawk-support?action=getUserPlan&userId=user_demo_001
```

**返回**:
```json
{
  "success": true,
  "data": {
    "userId": "user_demo_001",
    "email": "demo@scenepilot.com",
    "plan": "pro",
    "planStatus": "active"
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getUserPlan",
    "message": "Data from mock database"
  }
}
```

**⚠️ Mock 数据边界**:
- 当前只有 4 个预置的 mock 用户
- 可用用户ID: `user_demo_001`, `user_demo_002`, `user_demo_003`, `user_demo_004`
- 可用邮箱: `demo@scenepilot.com`, `free@scenepilot.com`, `expired@scenepilot.com`, `enterprise@scenepilot.com`
- 其他用户ID/邮箱会返回 404

---

### 2. getUserCredits - 查询用户积分

**用途**: 获取用户的积分余额

**参数**:
- `userId` (可选): 用户ID
- `email` (可选): 用户邮箱

**示例**:
```
GET /api/tawk-support?action=getUserCredits&email=demo@scenepilot.com
```

**返回**:
```json
{
  "success": true,
  "data": {
    "userId": "user_demo_001",
    "email": "demo@scenepilot.com",
    "creditsBalance": 350
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getUserCredits",
    "message": "Data from mock database"
  }
}
```

**⚠️ Mock 数据边界**:
- 积分数据来自 mock 数据库，非真实数据
- 不同 mock 用户有不同的预置积分余额

---

### 3. getBillingStatus - 查询账单状态

**用途**: 获取用户的订阅和支付状态

**参数**:
- `userId` (可选): 用户ID
- `email` (可选): 用户邮箱

**示例**:
```
GET /api/tawk-support?action=getBillingStatus&userId=user_demo_001
```

**返回**:
```json
{
  "success": true,
  "data": {
    "userId": "user_demo_001",
    "email": "demo@scenepilot.com",
    "subscriptionStatus": "active",
    "latestPaymentStatus": "succeeded"
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getBillingStatus",
    "message": "Data from mock database. No payment card info included."
  }
}
```

**⚠️ Mock 数据边界**:
- 账单状态为预置的 mock 数据
- **绝不返回支付卡信息**（卡号、CVV等）
- 不同 mock 用户有不同的订阅状态（active/inactive/past_due）

---

### 4. getCommonSupportInfo - 查询常见支持信息

**用途**: 获取常见问题的标准答案

**参数**:
- `topic` (可选): 主题，可选值：
  - `pricing` - 定价与套餐
  - `credits` - 积分系统
  - `login` - 登录问题
  - `templates` - 模板使用
  - `export` - 导出与下载
  - `refund` - 退款政策
  - `generation` - 生成问题
  - `api` - API 访问

**示例**:
```
GET /api/tawk-support?action=getCommonSupportInfo&topic=pricing
```

**返回**:
```json
{
  "success": true,
  "data": {
    "id": "pricing",
    "title": "Pricing & Plans",
    "contentEn": "ScenePilot offers three plans...",
    "contentZh": "ScenePilot 提供三种套餐...",
    "cta": {
      "labelEn": "View Pricing",
      "labelZh": "查看定价",
      "url": "/pricing"
    },
    "safeNotes": "If user asks about specific pricing, direct them to the pricing page..."
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getCommonSupportInfo",
    "message": "FAQ content from mock database"
  }
}
```

**⚠️ Mock 数据边界**:
- FAQ 内容为写死的静态内容
- 支持通过 aliases 模糊匹配（如 "price", "费用" 都能匹配到 pricing）
- 不存在的 topic 返回 404

**不指定 topic 时**: 返回所有可用主题列表

---

### 5. getSystemStatus - 查询系统状态

**用途**: 获取系统整体运行状态

**参数**: 无

**示例**:
```
GET /api/tawk-support?action=getSystemStatus
```

**返回**:
```json
{
  "success": true,
  "data": {
    "systemOk": true,
    "generationOk": true,
    "billingOk": true,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "lastIncident": null,
    "maintenanceMode": false,
    "version": "1.0.0-mock"
  },
  "mock": true,
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "getSystemStatus",
    "message": "Static mock status; future: connect to health checks"
  }
}
```

**⚠️ Mock 数据边界**:
- 系统状态为静态 mock 值
- 时间戳为实时生成，但状态值固定
- 后续可接入真实健康检查

---

## Mock 数据详情

### 预置 Mock 用户

| 用户ID | 邮箱 | 套餐 | 状态 | 积分余额 | 订阅状态 |
|--------|------|------|------|----------|----------|
| user_demo_001 | demo@scenepilot.com | pro | active | 350 | active |
| user_demo_002 | free@scenepilot.com | free | active | 25 | inactive |
| user_demo_003 | expired@scenepilot.com | pro | inactive | 0 | past_due |
| user_demo_004 | enterprise@scenepilot.com | enterprise | active | 5000 | active |

### 可用 FAQ Topics

| ID | 标题 | Aliases |
|----|------|---------|
| pricing | Pricing & Plans | price, plan, cost, 付费, 价格, 套餐 |
| credits | Credits System | credit, points, 积分, 点数 |
| login | Login Issues | login, password, 登录, 密码 |
| templates | Templates | template, preset, 模板, 预设 |
| export | Export & Download | export, download, 导出, 下载 |
| refund | Refund Policy | refund, cancel, 退款, 取消 |
| generation | Generation Issues | generate, render, 生成, 渲染 |
| api | API Access | api, developer, 接口, 开发者 |

---

## 环境变量配置

在项目的 `.env.local` 或 Cloudflare Pages 环境变量中添加：

```bash
# Tawk Support API Key（用于认证 Tawk AI 的请求）
TAWK_SUPPORT_API_KEY=your_secure_random_key_here
```

**生成安全密钥建议**:
```bash
# 使用 openssl 生成随机密钥
openssl rand -hex 32
```

---

## 响应格式说明

### 成功响应

所有成功响应都包含以下字段：
- `success`: `true`
- `data`: 响应数据（根据 action 不同）
- `mock`: `true`（明确标记为 mock 数据）
- `meta`: 元数据，包含时间戳、action 类型和说明信息

### 错误响应

错误响应格式统一：
- `success`: `false`
- `error`: 错误描述
- `mock`: `true`
- `meta`: 元数据

HTTP 状态码：
- `200`: 成功
- `400`: 参数错误
- `401`: 认证失败（API Key 无效）
- `404`: 资源未找到（用户或 topic 不存在）
- `500`: 服务器内部错误

---

## 安全边界

1. **只读接口**: 所有接口均为 GET 请求，不提供写操作
2. **无敏感信息**: 不返回支付卡号、密钥、密码等敏感信息
3. **API Key 认证**: 必须通过 `x-api-key` Header 认证
4. **安全默认**: 未配置密钥时拒绝所有请求
5. **CORS 限制**: 遵循项目现有的 CORS 策略
6. **明确标记**: 所有响应都包含 `mock: true` 字段

---

## 后续扩展计划

### 阶段 1: 接入真实数据（短期）

1. **用户数据**
   - 连接 Supabase 用户表
   - 支持查询真实用户信息
   - 保留 mock 作为 fallback

2. **账单数据**
   - 连接订阅和支付表
   - 返回真实账单状态

3. **积分数据**
   - 连接钱包表
   - 返回真实积分余额

### 阶段 2: 增强功能（中期）

1. **FAQ 外部化**
   - 将 FAQ 内容移到数据库
   - 支持动态更新
   - 支持多语言

2. **系统状态监控**
   - 接入真实健康检查
   - 监控生成队列
   - 监控账单服务

3. **用户活动查询**
   - 最近生成记录
   - 登录历史

### 阶段 3: 写操作（长期，需严格评估）

1. **用户管理**
   - 重置密码
   - 修改用户信息

2. **积分管理**
   - 手动调整积分（管理员权限）

---

## 故障排查

### 401 Unauthorized

- 检查 `x-api-key` Header 是否正确
- 检查环境变量 `TAWK_SUPPORT_API_KEY` 是否配置
- 检查密钥值是否匹配

### 400 Bad Request

- 检查 `action` 参数是否正确
- 检查用户相关接口是否提供了 `userId` 或 `email`
- 检查 `topic` 参数是否在允许列表中

### 404 Not Found

- **用户不存在**: 检查是否使用了预置的 mock 用户ID/邮箱
- **Topic 不存在**: 检查 topic 是否在可用列表中

### 500 Internal Server Error

- 查看 Cloudflare Pages Functions 日志
- 检查代码是否有运行时错误

---

## 相关文件

- **API 实现**: `functions/api/tawk-support.ts`
- **Mock 数据**: `functions/_data/tawkSupportMock.ts`
- **OpenAPI Schema**: `public/openapi/tawk-support-openapi.json`
- **本文档**: `docs/tawk-ai-api-setup.md`
- **环境变量**: `.env.local` (或 Cloudflare Pages 环境变量)

---

## 更新记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2024-01-15 | 1.0.0-mock | 初始版本，5个只读接口，全部使用 mock 数据 |
