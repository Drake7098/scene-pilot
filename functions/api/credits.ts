/**
 * Credits Query API with Redis Cache
 * 
 * 只读接口，用于快速查询用户积分
 * 优先从 Redis 缓存读取，缓存未命中时从 Supabase 读取并写入缓存
 * 
 * 复用项目现有 credits 读取路径：functions/api/_shared/credits-service.ts 中的 loadWalletState
 */

import { createUpstashClient } from "../_lib/upstashRedis";
import { getCachedCredits, setCachedCredits } from "../_lib/creditsCache";
import { loadWalletState } from "./_shared/credits-service";
import { json } from "./_shared/http";

declare type PagesFunction = (context: {
  request: Request;
  env: any;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;

interface CreditsResponse {
  ok: boolean;
  source?: "redis" | "supabase";
  credits?: number;
  error?: string;
}

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 从 query 读取参数
  const userId = url.searchParams.get("userId");
  const email = url.searchParams.get("email");
  
  // 参数校验：至少需要一个
  if (!userId && !email) {
    return json(
      { ok: false, error: "Missing required parameter: userId or email" } as CreditsResponse,
      400,
      request,
      env
    );
  }
  
  // 优先使用 userId，否则使用 email
  const userKey = userId || email!;
  
  try {
    // 初始化 Redis 客户端
    const redis = createUpstashClient(env);
    
    // 1. 先查 Redis 缓存
    const cachedCredits = await getCachedCredits(redis, userKey);
    
    if (cachedCredits !== null) {
      // 缓存命中，直接返回
      return json(
        { ok: true, source: "redis", credits: cachedCredits } as CreditsResponse,
        200,
        request,
        env
      );
    }
    
    // 2. 缓存未命中，从 Supabase 读取
    // 注意：loadWalletState 需要 userId，如果只有 email 需要额外处理
    let targetUserId = userId;
    
    if (!targetUserId && email) {
      // 只有 email，需要通过 email 查找 userId
      // 复用项目中已有的用户查找逻辑
      const { supabaseAdminRequest } = await import("./_shared/supabase-admin");
      const userRes = await supabaseAdminRequest<Array<{ id: string }>>(
        env,
        `/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
      );
      
      if (!userRes.ok || !userRes.data || userRes.data.length === 0) {
        return json(
          { ok: false, error: "User not found" } as CreditsResponse,
          404,
          request,
          env
        );
      }
      
      targetUserId = userRes.data[0].id;
    }
    
    if (!targetUserId) {
      return json(
        { ok: false, error: "User not found" } as CreditsResponse,
        404,
        request,
        env
      );
    }
    
    // 从 Supabase 读取积分
    const wallet = await loadWalletState(env, targetUserId);
    const credits = wallet.creditsBalance;
    
    // 3. 写入 Redis 缓存（异步，不阻塞响应）
    // 使用原始查询参数作为缓存 key，保持一致性
    await setCachedCredits(redis, userKey, credits, 300);
    
    return json(
      { ok: true, source: "supabase", credits } as CreditsResponse,
      200,
      request,
      env
    );
    
  } catch (error) {
    // 出错时返回 500
    const message = error instanceof Error ? error.message : "Internal server error";
    return json(
      { ok: false, error: message } as CreditsResponse,
      500,
      request,
      env
    );
  }
};

export const onRequestPost: PagesFunction = async () => {
  return new Response("Method Not Allowed", { status: 405 });
};
