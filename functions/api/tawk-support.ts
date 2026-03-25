/**
 * Tawk AI Assist Support API
 * 为 Tawk AI 客服提供只读查询接口
 * 
 * 安全边界：
 * - 只读接口，不提供写操作
 * - 不返回敏感信息（支付卡号、密钥等）
 * - 使用 API Key 认证
 * - 当前所有数据均为 MOCK，已明确标注
 */

// Cloudflare Pages Functions 类型声明
declare type PagesFunction = (context: {
  request: Request;
  env: any;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
}) => Promise<Response>;

import { json, corsOptions } from "./_shared/http";
import {
  findFAQTopic,
  getAvailableTopics,
  findMockUser,
  getCurrentMockSystemStatus
} from "../_data/tawkSupportMock";

// ============================================================================
// 类型定义
// ============================================================================

type SupportAction =
  | "getUserPlan"
  | "getUserCredits"
  | "getBillingStatus"
  | "getCommonSupportInfo"
  | "getSystemStatus";

interface SupportResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  mock: boolean; // 明确标记是否为 mock 数据
  meta: {
    timestamp: string;
    action: string;
    message?: string;
  };
}

// ============================================================================
// 认证逻辑
// ============================================================================

/**
 * 验证 Tawk API Key
 * 从环境变量 TAWK_SUPPORT_API_KEY 读取允许的密钥
 */
function validateTawkApiKey(request: Request, env: any): boolean {
  const expectedKey = String(env?.TAWK_SUPPORT_API_KEY || "").trim();
  
  // 如果没有配置密钥，拒绝所有请求（安全默认）
  if (!expectedKey) {
    return false;
  }
  
  const providedKey = request.headers.get("x-api-key") || "";
  return providedKey === expectedKey;
}

// ============================================================================
// API 处理函数 - 全部使用 MOCK 数据
// ============================================================================

/**
 * 获取用户计划信息
 */
async function getUserPlan(
  userId?: string,
  email?: string
): Promise<SupportResponse> {
  const targetId = userId || email;
  
  if (!targetId) {
    return {
      success: false,
      error: "Missing required parameter: userId or email",
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getUserPlan",
        message: "Validation failed"
      }
    };
  }

  const user = findMockUser(userId, email);
  
  if (!user) {
    return {
      success: false,
      error: `User not found: ${targetId}`,
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getUserPlan",
        message: "User lookup returned no results from mock database"
      }
    };
  }

  return {
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      plan: user.plan,
      planStatus: user.planStatus
    },
    mock: true,
    meta: { 
      timestamp: new Date().toISOString(), 
      action: "getUserPlan",
      message: "Data from mock database"
    }
  };
}

/**
 * 获取用户积分信息
 */
async function getUserCredits(
  userId?: string,
  email?: string
): Promise<SupportResponse> {
  const targetId = userId || email;
  
  if (!targetId) {
    return {
      success: false,
      error: "Missing required parameter: userId or email",
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getUserCredits",
        message: "Validation failed"
      }
    };
  }

  const user = findMockUser(userId, email);
  
  if (!user) {
    return {
      success: false,
      error: `User not found: ${targetId}`,
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getUserCredits",
        message: "User lookup returned no results from mock database"
      }
    };
  }

  return {
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      creditsBalance: user.creditsBalance
    },
    mock: true,
    meta: { 
      timestamp: new Date().toISOString(), 
      action: "getUserCredits",
      message: "Data from mock database"
    }
  };
}

/**
 * 获取用户账单状态
 */
async function getBillingStatus(
  userId?: string,
  email?: string
): Promise<SupportResponse> {
  const targetId = userId || email;
  
  if (!targetId) {
    return {
      success: false,
      error: "Missing required parameter: userId or email",
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getBillingStatus",
        message: "Validation failed"
      }
    };
  }

  const user = findMockUser(userId, email);
  
  if (!user) {
    return {
      success: false,
      error: `User not found: ${targetId}`,
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getBillingStatus",
        message: "User lookup returned no results from mock database"
      }
    };
  }

  return {
    success: true,
    data: {
      userId: user.userId,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      latestPaymentStatus: user.latestPaymentStatus
    },
    mock: true,
    meta: { 
      timestamp: new Date().toISOString(), 
      action: "getBillingStatus",
      message: "Data from mock database. No payment card info included."
    }
  };
}

/**
 * 获取常见支持信息
 */
async function getCommonSupportInfo(topic?: string): Promise<SupportResponse> {
  // 如果没有指定 topic，返回所有可用 topics
  if (!topic) {
    return {
      success: true,
      data: {
        availableTopics: getAvailableTopics(),
        hint: "Specify a 'topic' parameter to get detailed content"
      },
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getCommonSupportInfo",
        message: "Returning list of available topics from mock FAQ database"
      }
    };
  }

  const faq = findFAQTopic(topic);
  
  if (!faq) {
    return {
      success: false,
      error: `Topic not found: ${topic}`,
      mock: true,
      meta: { 
        timestamp: new Date().toISOString(), 
        action: "getCommonSupportInfo",
        message: `No FAQ entry found for topic: ${topic}`
      }
    };
  }

  return {
    success: true,
    data: {
      id: faq.id,
      title: faq.title,
      contentEn: faq.contentEn,
      contentZh: faq.contentZh,
      cta: faq.cta,
      safeNotes: faq.safeNotes
    },
    mock: true,
    meta: { 
      timestamp: new Date().toISOString(), 
      action: "getCommonSupportInfo",
      message: "FAQ content from mock database"
    }
  };
}

/**
 * 获取系统状态
 */
async function getSystemStatus(): Promise<SupportResponse> {
  const status = getCurrentMockSystemStatus();
  
  return {
    success: true,
    data: {
      systemOk: status.systemOk,
      generationOk: status.generationOk,
      billingOk: status.billingOk,
      timestamp: status.timestamp,
      lastIncident: status.lastIncident,
      maintenanceMode: status.maintenanceMode,
      version: status.version
    },
    mock: true,
    meta: { 
      timestamp: new Date().toISOString(), 
      action: "getSystemStatus",
      message: "Static mock status; future: connect to health checks"
    }
  };
}

// ============================================================================
// 主处理函数
// ============================================================================

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get("action") as SupportAction | null;

    // API Key 认证
    if (!validateTawkApiKey(request, env)) {
      return json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing API key",
          mock: true,
          meta: { 
            timestamp: new Date().toISOString(), 
            action: action || "unknown",
            message: "Authentication failed. Check x-api-key header."
          }
        },
        401,
        request,
        env
      );
    }

    // 参数解析
    const userId = url.searchParams.get("userId") || undefined;
    const email = url.searchParams.get("email") || undefined;
    const topic = url.searchParams.get("topic") || undefined;

    // 路由到对应处理函数
    let response: SupportResponse;

    switch (action) {
      case "getUserPlan":
        response = await getUserPlan(userId, email);
        break;

      case "getUserCredits":
        response = await getUserCredits(userId, email);
        break;

      case "getBillingStatus":
        response = await getBillingStatus(userId, email);
        break;

      case "getCommonSupportInfo":
        response = await getCommonSupportInfo(topic);
        break;

      case "getSystemStatus":
        response = await getSystemStatus();
        break;

      default:
        response = {
          success: false,
          error: `Unknown or missing action. Valid actions: getUserPlan, getUserCredits, getBillingStatus, getCommonSupportInfo, getSystemStatus`,
          mock: true,
          meta: { 
            timestamp: new Date().toISOString(), 
            action: action || "unknown",
            message: "Invalid action parameter"
          }
        };
        return json(response, 400, request, env);
    }

    // 确定 HTTP 状态码
    let statusCode = 200;
    if (!response.success) {
      // 根据错误类型返回不同状态码
      if (response.error?.includes("not found")) {
        statusCode = 404;
      } else if (response.error?.includes("Missing required")) {
        statusCode = 400;
      } else {
        statusCode = 400;
      }
    }

    return json(response, statusCode, request, env);
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        mock: true,
        meta: { 
          timestamp: new Date().toISOString(), 
          action: "unknown",
          message: "Unexpected error occurred"
        }
      },
      500,
      context.request,
      context.env
    );
  }
};

// CORS 支持
export const onRequestOptions: PagesFunction = async (context) =>
  corsOptions("GET, OPTIONS", context.request, context.env);
