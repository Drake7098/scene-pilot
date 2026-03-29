/**
 * paddleClient.ts — DISABLED
 * Paddle 结账链路已关闭，当前所有付款走 Whop。
 * 保留导出签名以防止潜在的类型引用报错。
 */
import type { CheckoutResult } from "../types/billing";

export async function initializePaddleClient(): Promise<boolean> {
  return false;
}

export function canUsePaddleClient(): boolean {
  return false;
}

export async function openPaddleCheckout(_result: CheckoutResult): Promise<boolean> {
  console.warn("[paddleClient] Paddle is disabled. Use Whop checkout instead.");
  return false;
}
