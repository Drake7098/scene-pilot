/**
 * billingFlags.ts
 *
 * Paddle 已完全关闭，当前结账走 Whop。
 * BILLING_ENABLED / BILLING_LIVE_BLOCKED 仍保留，供 App.tsx 内剩余引用编译通过，
 * 但 billingService.ts 已不再依赖它们。
 *
 * develop 构建：VITE_BILLING_ENABLED=1, VITE_BILLING_LIVE_BLOCKED=1  → 可测试 UI，不真实扣费
 * main 构建：   VITE_BILLING_ENABLED=1, VITE_BILLING_LIVE_BLOCKED=0  → 正式走 Whop 链接
 */

/** true = 计费 UI 可见；false = 计费入口全部隐藏 */
export const BILLING_ENABLED: boolean =
  String(import.meta.env.VITE_BILLING_ENABLED ?? "1").trim() !== "0";

/**
 * true = live 扣费被拦截（develop/sandbox 保护）
 * false = 正常走 Whop 链接（production）
 *
 * 注意：billingService.ts 已移除所有 Paddle 调用，
 * launchCheckout 直接 window.open Whop URL，不受此 flag 影响。
 * 此 flag 保留仅用于 App.tsx 中的 billingRuntimeEnabled 计算。
 */
export const BILLING_LIVE_BLOCKED: boolean =
  String(import.meta.env.VITE_BILLING_LIVE_BLOCKED ?? "0").trim() === "1";

/** Paddle mock fallback — 已废弃，保留防止旧引用编译报错 */
export const BILLING_ALLOW_MOCK_FALLBACK: boolean = false;

/** 计费模式标识 — 已废弃，保留防止旧引用编译报错 */
export const BILLING_MODE: "sandbox" | "live" = "live";
