/**
 * Credits Redis Cache Layer
 * 
 * 为 ScenePilot 积分系统提供 Redis 缓存层
 * 缓存键格式: spx:credits:{userIdOrEmail}
 * 默认 TTL: 300 秒
 * 
 * 注意：Supabase 仍是积分最终真实来源，Redis 仅作为缓存层
 */

import type { UpstashClient } from "./upstashRedis";

const DEFAULT_TTL_SECONDS = 300;
const KEY_PREFIX = "spx:credits:";

/**
 * 生成积分缓存键
 */
export function getCreditsCacheKey(userIdOrEmail: string): string {
  return `${KEY_PREFIX}${userIdOrEmail}`;
}

/**
 * 从 Redis 获取缓存的积分
 * @returns 积分数值，或 null（缓存未命中或出错）
 */
export async function getCachedCredits(
  redis: UpstashClient,
  userIdOrEmail: string
): Promise<number | null> {
  try {
    const key = getCreditsCacheKey(userIdOrEmail);
    const value = await redis.get(key);
    if (value === null) return null;
    const credits = parseInt(value, 10);
    return isNaN(credits) ? null : credits;
  } catch {
    // Redis 出错时返回 null，让调用方 fallback 到数据库
    return null;
  }
}

/**
 * 将积分写入 Redis 缓存
 */
export async function setCachedCredits(
  redis: UpstashClient,
  userIdOrEmail: string,
  credits: number,
  exSeconds: number = DEFAULT_TTL_SECONDS
): Promise<boolean> {
  try {
    const key = getCreditsCacheKey(userIdOrEmail);
    return await redis.set(key, String(credits), exSeconds);
  } catch {
    return false;
  }
}

/**
 * 删除积分缓存
 */
export async function deleteCachedCredits(
  redis: UpstashClient,
  userIdOrEmail: string
): Promise<boolean> {
  try {
    const key = getCreditsCacheKey(userIdOrEmail);
    return await redis.del(key);
  } catch {
    return false;
  }
}

/**
 * 原子性增加/减少缓存积分（用于扣减前的快速检查）
 * @param delta 正数为增加，负数为减少
 * @returns 操作后的积分值，或 null（操作失败）
 */
export async function bumpCachedCredits(
  redis: UpstashClient,
  userIdOrEmail: string,
  delta: number,
  exSeconds: number = DEFAULT_TTL_SECONDS
): Promise<number | null> {
  try {
    const key = getCreditsCacheKey(userIdOrEmail);
    
    // 先获取当前值
    const current = await redis.get(key);
    if (current === null) {
      // 缓存未命中，无法 bump
      return null;
    }
    
    const currentCredits = parseInt(current, 10);
    if (isNaN(currentCredits)) return null;
    
    const newCredits = currentCredits + delta;
    if (newCredits < 0) {
      // 积分不足
      return null;
    }
    
    // 写入新值
    await redis.set(key, String(newCredits), exSeconds);
    return newCredits;
  } catch {
    return null;
  }
}
