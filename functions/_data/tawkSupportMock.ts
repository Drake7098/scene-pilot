/**
 * Tawk Support API Mock Data
 * 
 * 此文件包含 Tawk AI Assist Support API 的所有模拟数据
 * 包括：FAQ topics、mock user data、mock system status
 * 
 * 注意：所有数据均为 MOCK，用于开发和测试
 * 生产环境应连接真实数据源
 */

// ============================================================================
// FAQ Topics 数据结构
// ============================================================================

export interface FAQTopic {
  id: string;
  title: string;
  aliases: string[]; // 用于模糊匹配的关键词
  contentEn: string;
  contentZh: string;
  cta?: {
    labelEn: string;
    labelZh: string;
    url: string;
  };
  safeNotes?: string; // 给 AI 的额外提示
}

export const faqTopics: FAQTopic[] = [
  {
    id: "pricing",
    title: "Pricing & Plans",
    aliases: ["price", "plan", "cost", "fee", "subscription", "upgrade", "付费", "价格", "套餐", "订阅"],
    contentEn: "ScenePilot offers three plans:\n\n• Free: 50 credits/month, basic templates\n• Pro: 500 credits/month, all templates, priority generation\n• Enterprise: Custom credits, API access, dedicated support\n\nCredits are used for image and video generation. Different operations consume different amounts of credits.",
    contentZh: "ScenePilot 提供三种套餐：\n\n• 免费版：每月50积分，基础模板\n• 专业版：每月500积分，全部模板，优先生成\n• 企业版：自定义积分，API访问，专属支持\n\n积分用于图片和视频生成，不同操作消耗不同积分。",
    cta: {
      labelEn: "View Pricing",
      labelZh: "查看定价",
      url: "/pricing"
    },
    safeNotes: "If user asks about specific pricing, direct them to the pricing page for latest rates."
  },
  {
    id: "credits",
    title: "Credits System",
    aliases: ["credit", "points", "balance", "积分", "点数", "余额"],
    contentEn: "About Credits:\n\n• Credits are consumed when generating images/videos\n• Free users receive 50 credits monthly\n• Paid users receive credits based on their plan\n• Credit packs can be purchased to top up\n• Credits expire based on plan type\n\nCheck your balance in the Account Center.",
    contentZh: "关于积分：\n\n• 生成图片/视频时消耗积分\n• 免费用户每月获得50积分\n• 付费用户根据套餐获得相应积分\n• 积分不足时可购买积分包补充\n• 积分有效期根据套餐类型不同\n\n在账户中心查看积分余额。",
    cta: {
      labelEn: "Buy Credits",
      labelZh: "购买积分",
      url: "/pricing"
    },
    safeNotes: "Do not promise free credits or refunds without verification."
  },
  {
    id: "login",
    title: "Login Issues",
    aliases: ["login", "signin", "password", "auth", "access", "登录", "密码", "无法登录"],
    contentEn: "Troubleshooting Login Issues:\n\n1. Check your internet connection\n2. Verify email and password are correct\n3. Use 'Forgot Password' to reset if needed\n4. Try Google Sign-In as alternative\n5. Clear browser cache and retry\n\nIf issues persist, provide the specific error message.",
    contentZh: "登录问题排查：\n\n1. 检查网络连接是否正常\n2. 确认邮箱和密码正确\n3. 忘记密码可使用重置功能\n4. 尝试 Google 登录\n5. 清除浏览器缓存后重试\n\n如果问题持续，请提供具体错误信息。",
    cta: {
      labelEn: "Reset Password",
      labelZh: "重置密码",
      url: "/forgot-password"
    },
    safeNotes: "Never ask for user's password. Direct them to official reset flow."
  },
  {
    id: "templates",
    title: "Templates",
    aliases: ["template", "preset", "scene", "模板", "预设", "场景"],
    contentEn: "About Templates:\n\n• Hundreds of professionally designed templates\n• Categories: Image templates, Video templates\n• Each template includes detailed usage instructions\n• Create content quickly based on templates\n• Some advanced templates require Pro or Enterprise\n\nBrowse the template library to find what you need.",
    contentZh: "关于模板：\n\n• 数百个专业设计的模板\n• 分类：图片模板、视频模板\n• 每个模板都有详细使用说明\n• 可基于模板快速创建内容\n• 部分高级模板需要专业版或企业版\n\n浏览模板库找到适合您的模板。",
    cta: {
      labelEn: "Browse Templates",
      labelZh: "浏览模板",
      url: "/templates"
    },
    safeNotes: "Template availability depends on user's plan tier."
  },
  {
    id: "export",
    title: "Export & Download",
    aliases: ["export", "download", "save", "output", "导出", "下载", "保存"],
    contentEn: "About Export:\n\n• Content can be exported in multiple formats\n• Images: PNG, JPG, WebP\n• Videos: MP4\n• Choose different resolutions when exporting\n• HD export may consume extra credits\n\nDownloaded files can be found in Download History.",
    contentZh: "关于导出：\n\n• 内容可导出为多种格式\n• 图片：PNG、JPG、WebP\n• 视频：MP4\n• 导出时可选择不同分辨率\n• 高清导出可能消耗额外积分\n\n导出的文件可在下载历史中查看。",
    cta: {
      labelEn: "Download History",
      labelZh: "下载历史",
      url: "/account/downloads"
    },
    safeNotes: "Remind users that HD exports cost more credits."
  },
  {
    id: "refund",
    title: "Refund Policy",
    aliases: ["refund", "money back", "cancel", "退款", "退费", "取消"],
    contentEn: "Refund Policy:\n\n• Refunds can be requested within 7 days of subscription\n• Used credits will be deducted from refund\n• Credit pack purchases are non-refundable\n• Refunds processed within 5-10 business days\n\nTo request a refund, contact support with your order number.",
    contentZh: "退款政策：\n\n• 订阅后7天内可申请退款\n• 已使用的积分将从退款中扣除\n• 积分包购买后不支持退款\n• 退款将在5-10个工作日内处理\n\n如需退款，请联系客服并提供订单号。",
    cta: {
      labelEn: "Contact Support",
      labelZh: "联系客服",
      url: "/support"
    },
    safeNotes: "Refund decisions require human review. Do not promise refunds."
  },
  {
    id: "generation",
    title: "Generation Issues",
    aliases: ["generate", "render", "fail", "error", "生成", "渲染", "失败"],
    contentEn: "Generation Troubleshooting:\n\n• Check your credit balance\n• Verify prompt follows content guidelines\n• Try with simpler prompts\n• Check system status for outages\n• Retry after a few minutes\n\nIf generation keeps failing, check your prompt for policy violations.",
    contentZh: "生成问题排查：\n\n• 检查积分余额\n• 确认提示词符合内容规范\n• 尝试使用更简单的提示词\n• 检查系统状态是否有故障\n• 几分钟后重试\n\n如果生成持续失败，检查提示词是否违反政策。",
    cta: {
      labelEn: "System Status",
      labelZh: "系统状态",
      url: "/status"
    },
    safeNotes: "Do not debug specific generation failures without seeing the actual error."
  },
  {
    id: "api",
    title: "API Access",
    aliases: ["api", "developer", "integration", "接口", "开发者"],
    contentEn: "API Access:\n\n• Available for Enterprise plan users\n• RESTful API for generation and management\n• API documentation available in Developer Portal\n• Rate limits apply based on plan\n\nContact sales for API access upgrade.",
    contentZh: "API 访问：\n\n• 企业版用户可用\n• 用于生成和管理的 RESTful API\n• 开发者门户提供 API 文档\n• 根据套餐有不同速率限制\n\n联系销售升级 API 访问权限。",
    cta: {
      labelEn: "Contact Sales",
      labelZh: "联系销售",
      url: "/contact-sales"
    },
    safeNotes: "API is Enterprise-only feature."
  }
];

// ============================================================================
// Mock User Data
// ============================================================================

export interface MockUser {
  userId: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
  planStatus: "active" | "inactive" | "suspended";
  creditsBalance: number;
  subscriptionStatus: "active" | "inactive" | "past_due" | "canceled";
  latestPaymentStatus: "succeeded" | "failed" | "pending" | "unknown";
  periodStart: string | null;
  periodEnd: string | null;
}

export const mockUsers: MockUser[] = [
  {
    userId: "user_demo_001",
    email: "demo@scenepilot.com",
    plan: "pro",
    planStatus: "active",
    creditsBalance: 350,
    subscriptionStatus: "active",
    latestPaymentStatus: "succeeded",
    periodStart: "2024-01-01T00:00:00Z",
    periodEnd: "2024-02-01T00:00:00Z"
  },
  {
    userId: "user_demo_002",
    email: "free@scenepilot.com",
    plan: "free",
    planStatus: "active",
    creditsBalance: 25,
    subscriptionStatus: "inactive",
    latestPaymentStatus: "unknown",
    periodStart: null,
    periodEnd: null
  },
  {
    userId: "user_demo_003",
    email: "expired@scenepilot.com",
    plan: "pro",
    planStatus: "inactive",
    creditsBalance: 0,
    subscriptionStatus: "past_due",
    latestPaymentStatus: "failed",
    periodStart: "2023-12-01T00:00:00Z",
    periodEnd: "2024-01-01T00:00:00Z"
  },
  {
    userId: "user_demo_004",
    email: "enterprise@scenepilot.com",
    plan: "enterprise",
    planStatus: "active",
    creditsBalance: 5000,
    subscriptionStatus: "active",
    latestPaymentStatus: "succeeded",
    periodStart: "2024-01-01T00:00:00Z",
    periodEnd: "2024-07-01T00:00:00Z"
  }
];

// ============================================================================
// Mock System Status
// ============================================================================

export interface MockSystemStatus {
  systemOk: boolean;
  generationOk: boolean;
  billingOk: boolean;
  timestamp: string;
  lastIncident: string | null;
  maintenanceMode: boolean;
  version: string;
}

export const mockSystemStatus: MockSystemStatus = {
  systemOk: true,
  generationOk: true,
  billingOk: true,
  timestamp: new Date().toISOString(),
  lastIncident: null,
  maintenanceMode: false,
  version: "1.0.0-mock"
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 根据 ID 或 aliases 查找 FAQ topic
 */
export function findFAQTopic(query: string): FAQTopic | undefined {
  const normalizedQuery = query.toLowerCase().trim();
  
  return faqTopics.find(topic => {
    // 直接匹配 ID
    if (topic.id === normalizedQuery) return true;
    
    // 匹配 aliases
    return topic.aliases.some(alias => 
      alias.toLowerCase() === normalizedQuery ||
      normalizedQuery.includes(alias.toLowerCase())
    );
  });
}

/**
 * 获取所有可用的 topic IDs
 */
export function getAvailableTopics(): Array<{ id: string; title: string }> {
  return faqTopics.map(t => ({ id: t.id, title: t.title }));
}

/**
 * 根据 userId 或 email 查找用户
 */
export function findMockUser(userId?: string, email?: string): MockUser | undefined {
  if (!userId && !email) return undefined;
  
  return mockUsers.find(user => {
    if (userId && user.userId === userId) return true;
    if (email && user.email.toLowerCase() === email.toLowerCase()) return true;
    return false;
  });
}

/**
 * 获取当前系统状态（带实时时间戳）
 */
export function getCurrentMockSystemStatus(): MockSystemStatus {
  return {
    ...mockSystemStatus,
    timestamp: new Date().toISOString()
  };
}
