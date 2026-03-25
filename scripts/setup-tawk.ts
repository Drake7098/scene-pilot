#!/usr/bin/env node

/**
 * Tawk.to 配置脚本
 * 自动创建 FAQ/Bot/Trigger
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const TAWK_API_KEY = String(process.env.TAWK_API_KEY || "").trim();
const TAWK_PROPERTY_ID = String(process.env.TAWK_PROPERTY_ID || "").trim();
const TAWK_WIDGET_ID = String(process.env.TAWK_WIDGET_ID || "").trim();

const TAWK_API_BASE = "https://api.tawk.to/v1";

function log(message: string, level: "info" | "error" | "success" = "info") {
  const prefix = level === "error" ? "[ERROR]" : level === "success" ? "[SUCCESS]" : "[INFO]";
  console.log(`${prefix} ${message}`);
}

async function tawkRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${TAWK_API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "X-Access-Token": TAWK_API_KEY,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    log(`Tawk API request failed: ${(error as Error).message}`, "error");
    throw error;
  }
}

async function createShortcut(params: {
  name: string;
  message: string;
}) {
  log(`Creating shortcut: ${params.name}`);
  return await tawkRequest("/shortcuts", {
    method: "POST",
    body: JSON.stringify({
      propertyId: TAWK_PROPERTY_ID,
      widgetId: TAWK_WIDGET_ID,
      name: params.name,
      message: params.message,
    }),
  });
}

async function createTrigger(params: {
  name: string;
  conditions: Array<{
    type: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    value: string;
  }>;
}) {
  log(`Creating trigger: ${params.name}`);
  return await tawkRequest("/triggers", {
    method: "POST",
    body: JSON.stringify({
      propertyId: TAWK_PROPERTY_ID,
      widgetId: TAWK_WIDGET_ID,
      name: params.name,
      conditions: params.conditions,
      actions: params.actions,
      enabled: true,
    }),
  });
}

async function createBotRule(params: {
  name: string;
  keywords: string[];
  response: string;
}) {
  log(`Creating bot rule: ${params.name}`);
  return await tawkRequest("/bot/rules", {
    method: "POST",
    body: JSON.stringify({
      propertyId: TAWK_PROPERTY_ID,
      widgetId: TAWK_WIDGET_ID,
      name: params.name,
      keywords: params.keywords,
      response: params.response,
      enabled: true,
    }),
  });
}

async function setupDefaultRules() {
  log("=== Starting Tawk.to configuration setup ===");

  if (!TAWK_API_KEY) {
    log("TAWK_API_KEY not found in environment variables", "error");
    process.exit(1);
  }

  if (!TAWK_PROPERTY_ID) {
    log("TAWK_PROPERTY_ID not found in environment variables", "error");
    process.exit(1);
  }

  if (!TAWK_WIDGET_ID) {
    log("TAWK_WIDGET_ID not found in environment variables", "error");
    process.exit(1);
  }

  log(`Property ID: ${TAWK_PROPERTY_ID}`);
  log(`Widget ID: ${TAWK_WIDGET_ID}`);

  try {
    await createBotRule({
      name: "Price Inquiry",
      keywords: ["价格", "price", "费用", "cost", "多少钱", "how much"],
      response:
        "您好！我们提供多种套餐选项：\n" +
        "• 基础版：适合个人使用\n" +
        "• 专业版：适合专业创作者\n" +
        "• 企业版：适合团队使用\n\n" +
        "您可以访问定价页面了解更多详情，或告诉我您的使用场景，我可以帮您推荐！",
    });

    await createBotRule({
      name: "Credits Inquiry",
      keywords: ["积分", "credits", "点数", "积分不够", "out of credits"],
      response:
        "您好！关于积分问题：\n" +
        "• 积分用于生成图片和视频\n" +
        "• 您可以在账户中心查看积分余额\n" +
        "• 积分不足时可以购买套餐补充\n\n" +
        "如果有购买问题，请告诉我，我会帮您解答！",
    });

    await createBotRule({
      name: "Login Issue",
      keywords: ["登录", "login", "无法登录", "can't login", "密码", "password"],
      response:
        "您好！关于登录问题：\n" +
        "• 请检查网络连接\n" +
        "• 请确认用户名和密码正确\n" +
        "• 如果忘记密码，可以点击忘记密码重置\n" +
        "• 也可以尝试使用 Google 登录\n\n" +
        "如果问题仍然存在，请告诉我具体的错误信息！",
    });

    await createBotRule({
      name: "Error Issue",
      keywords: ["错误", "error", "报错", "崩溃", "crash", "bug", "问题", "problem"],
      response:
        "您好！抱歉遇到问题了！\n" +
        "• 请尝试刷新页面重试\n" +
        "• 请检查浏览器控制台是否有错误信息\n" +
        "• 请告诉我具体在哪个操作时出现的问题\n\n" +
        "我会帮您联系技术支持，或者您也可以通过帮助中心提交工单！",
    });

    await createBotRule({
      name: "API Issue",
      keywords: ["API", "api", "密钥", "key", "生成", "generate", "渲染", "render"],
      response:
        "您好！关于 API 和生成问题：\n" +
        "• 请检查 API 密钥是否正确配置\n" +
        "• 请检查网络连接是否正常\n" +
        "• 请确认积分余额是否充足\n" +
        "• 如果生成失败，请尝试重新生成\n\n" +
        "如果问题持续存在，请告诉我具体的错误信息！",
    });

    await createShortcut({
      name: "欢迎问候",
      message: "您好！欢迎使用 ScenePilot！有什么我可以帮助您的吗？",
    });

    await createShortcut({
      name: "定价页面链接",
      message: "您可以访问定价页面了解套餐详情：[点击查看定价](/pricing)",
    });

    await createShortcut({
      name: "帮助中心链接",
      message: "您可以访问帮助中心查看更多教程：[点击查看帮助](/help)",
    });

    log("=== Tawk.to configuration completed successfully ===", "success");
  } catch (error) {
    log(`Setup failed: ${(error as Error).message}`, "error");
    process.exit(1);
  }
}

setupDefaultRules();
