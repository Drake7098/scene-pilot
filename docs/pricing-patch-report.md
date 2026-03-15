# Pricing Patch Report — 积分包 + 模板 cost 档位

**范围**：仅改价格配置与默认 cost 数值；未改 UI 结构、billing 逻辑、help、template schema。

---

## 1. Credits 新价格

| Product id | USD | Credits | 说明 |
|------------|-----|---------|------|
| pack_3     | $3  | 150     | 原 pack_150 → 改 id 为 pack_3，积分数已为 150 |
| pack_8     | $8  | 420     | 原 pack_420 → 改 id 为 pack_8，积分数已为 420 |
| pack_15    | $15 | 800     | 原 pack_800 → 改 id 为 pack_15，积分数已为 800 |

- 前端：`PRICING_FINAL_CREDIT_PACKS`（billingService.ts）id 改为 pack_3 / pack_8 / pack_15；priceId 环境变量改为 `VITE_PADDLE_PRICE_PACK_3` / `_PACK_8` / `_PACK_15`。
- 后端：`functions/api/_shared/billing-db.ts` 中 products 的 code 改为 pack_3 / pack_8 / pack_15；priceId 环境变量改为 `PADDLE_PRICE_PACK_3` / `_PACK_8` / `_PACK_15`。
- Pro 月度积分（700）未改。

---

## 2. 模板 cost 档位

| cost | 含义 |
|------|------|
| 0 | 免费 |
| 1 | 基础模板 |
| 2 | 高级模板（multi_object, advanced_motion） |
| 3 | 导演级 / 多镜 / 连续 / 隐藏语言（continuous category） |

- `src/data/templateLibrary600.ts`：`templateCost()` 由原 0/3/5 改为 0/1/2/3；free_starter→0，continuous→3，multi_object/advanced_motion→2，其余→1。
- `computeAdvancedTags()`：原 `cost >= 5` 改为 `cost >= 2`，使 tier 2/3 仍带 advanced_camera 等标签。
- 未改 template schema 字段名；未改 billing 扣费逻辑（仍按 template.cost 数值扣）。

---

## 3. 修改文件

| 文件 | 变更 |
|------|------|
| `src/services/billingService.ts` | PRICING_FINAL_CREDIT_PACKS：id → pack_3/pack_8/pack_15，priceId env → VITE_PADDLE_PRICE_PACK_3/8/15 |
| `functions/api/_shared/billing-db.ts` | seedDefaultProducts：code → pack_3/pack_8/pack_15，priceId env → PADDLE_PRICE_PACK_3/8/15 |
| `src/data/templateLibrary600.ts` | templateCost() 返回 0/1/2/3；computeAdvancedTags cost >= 2 |
| `docs/credits-pricing-page-spec.md` | 更新 Credit packs 表与 Template cost 说明 |

**未改**：helpContent.ts、billing 扣费逻辑、applyMode、projectBilling、template schema 字段、UI 结构。

---

## 4. 风险

- **环境变量**：部署需配置 `VITE_PADDLE_PRICE_PACK_3`、`VITE_PADDLE_PRICE_PACK_8`、`VITE_PADDLE_PRICE_PACK_15`（前端）与 `PADDLE_PRICE_PACK_3`、`PADDLE_PRICE_PACK_8`、`PADDLE_PRICE_PACK_15`（后端）；若仍用旧名 PACK_150/420/800，需在环境侧改为新 key 或做兼容映射。
- **Paddle 后台**：若当前 price 的 product id 或 metadata 与 pack_150/420/800 绑定，webhook/checkout 需能解析 pack_3/8/15 或需在 Paddle 中新增/调整产品与价格 id 并写入上述 env。
- **Help 文案**：helpContent 中「Starter $3/20、Standard $8/60、Creator $18/160」未改，与当前 150/420/800 不一致；若需统一需单独改 help 文案（本次未做）。

---

**Build**：`npm run build` 已通过。
