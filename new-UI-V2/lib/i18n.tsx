"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export type Locale = "en" | "zh"

const translations = {
  en: {
    // Navbar
    "nav.pricing": "Pricing",
    "nav.templates": "Templates",
    "nav.features": "Features",
    "nav.login": "Log in",
    "nav.getStarted": "Get Started",
    "nav.dashboard": "Dashboard",
    "nav.workspace": "Workspace",
    "nav.generate": "Generate",
    "nav.history": "History",
    "nav.billing": "Billing",
    "nav.account": "Account",
    "nav.logout": "Log out",

    // Hero
    "hero.badge": "Professional AI Cinematic Generation",
    "hero.title": "Create Cinematic Content with AI",
    "hero.subtitle": "Professional-grade visual effects and scene creation. Build stunning cinematic sequences with our AI-powered workspace.",
    "hero.cta": "Start Creating",
    "hero.demo": "Watch Demo",
    "hero.workspace": "ScenePilotix Workspace",
    "hero.flowControl": "Flow Control",
    "hero.canvasPreview": "Canvas Preview",
    "hero.entityEdit": "Entity Edit",

    // Features
    "features.title": "Professional Features",
    "features.subtitle": "Everything you need to create studio-quality cinematic content with AI.",
    "feature.sceneComposition": "Scene Composition",
    "feature.sceneCompositionDesc": "Build complex scenes with layered elements, backgrounds, and subjects with precise control.",
    "feature.realTimeGeneration": "Real-time Generation",
    "feature.realTimeGenerationDesc": "Generate cinematic content instantly with our optimized AI pipeline.",
    "feature.professionalWorkspace": "Professional Workspace",
    "feature.professionalWorkspaceDesc": "Industry-standard 3-panel layout with flow control, canvas, and edit panels.",
    "feature.styleControl": "Style Control",
    "feature.styleControlDesc": "Fine-tune lighting, color grading, and visual style for perfect results.",
    "feature.shotManagement": "Shot Management",
    "feature.shotManagementDesc": "Organize and manage multiple shots with comprehensive project tools.",
    "feature.aiDirector": "AI Director",
    "feature.aiDirectorDesc": "Let AI assist with camera angles, composition, and cinematic techniques.",

    // Video Section
    "video.title": "See It In Action",
    "video.subtitle": "Watch how professionals create stunning cinematic content with ScenePilotix.",

    // Pricing
    "pricing.title": "Simple Pricing",
    "pricing.subtitle": "Choose the plan that fits your creative needs.",
    "pricing.starter": "Starter",
    "pricing.starterDesc": "For individual creators",
    "pricing.pro": "Pro",
    "pricing.proDesc": "For professional creators",
    "pricing.enterprise": "Enterprise",
    "pricing.enterpriseDesc": "For teams and studios",
    "pricing.perMonth": "/month",
    "pricing.custom": "Custom",
    "pricing.startTrial": "Start Free Trial",
    "pricing.getStarted": "Get Started",
    "pricing.contactSales": "Contact Sales",
    "pricing.feature.generations100": "100 generations/month",
    "pricing.feature.720p": "720p export",
    "pricing.feature.basicTemplates": "Basic templates",
    "pricing.feature.emailSupport": "Email support",
    "pricing.feature.unlimitedGen": "Unlimited generations",
    "pricing.feature.4k": "4K export",
    "pricing.feature.allTemplates": "All templates",
    "pricing.feature.prioritySupport": "Priority support",
    "pricing.feature.apiAccess": "API access",
    "pricing.feature.everythingPro": "Everything in Pro",
    "pricing.feature.customModels": "Custom models",
    "pricing.feature.dedicatedSupport": "Dedicated support",
    "pricing.feature.sla": "SLA guarantee",
    "pricing.feature.onPremise": "On-premise option",

    // CTA
    "cta.title": "Ready to Create?",
    "cta.subtitle": "Join thousands of creators using ScenePilotix to produce professional cinematic content.",
    "cta.button": "Start Creating Now",

    // Footer
    "footer.docs": "Documentation",
    "footer.rights": "All rights reserved.",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.projects": "Projects",
    "dashboard.newProject": "New Project",
    "dashboard.recentShots": "Recent Shots",
    "dashboard.viewAll": "View All",
    "dashboard.quickTemplates": "Quick Templates",
    "dashboard.usage": "Usage",
    "dashboard.generationsUsed": "generations used",
    "dashboard.upgrade": "Upgrade Plan",

    // Workspace
    "workspace.shot": "Shot",
    "workspace.director": "Director",
    "workspace.camera": "Camera",
    "workspace.scene": "Scene",
    "workspace.subject": "Subject",
    "workspace.background": "Background",
    "workspace.lighting": "Lighting",
    "workspace.style": "Style",
    "workspace.generate": "Generate",
    "workspace.preview": "Preview",
    "workspace.settings": "Settings",

    // Generate
    "generate.title": "Generate",
    "generate.prompt": "Describe your scene...",
    "generate.negativePrompt": "Negative prompt (optional)",
    "generate.aspectRatio": "Aspect Ratio",
    "generate.style": "Style",
    "generate.quality": "Quality",
    "generate.generateBtn": "Generate",
    "generate.generating": "Generating...",

    // History
    "history.title": "Generation History",
    "history.search": "Search history...",
    "history.filter": "Filter",
    "history.delete": "Delete",
    "history.download": "Download",
    "history.regenerate": "Regenerate",
    "history.empty": "No generations yet",
    "history.emptyDesc": "Start creating to see your history here.",

    // Templates
    "templates.title": "Templates",
    "templates.search": "Search templates...",
    "templates.all": "All",
    "templates.cinematic": "Cinematic",
    "templates.product": "Product",
    "templates.portrait": "Portrait",
    "templates.landscape": "Landscape",
    "templates.abstract": "Abstract",
    "templates.use": "Use Template",

    // Billing
    "billing.title": "Billing",
    "billing.currentPlan": "Current Plan",
    "billing.changePlan": "Change Plan",
    "billing.cancelPlan": "Cancel Plan",
    "billing.invoices": "Invoice History",
    "billing.paymentMethod": "Payment Method",
    "billing.addPayment": "Add Payment Method",
    "billing.nextBilling": "Next billing date",

    // Account
    "account.title": "Account Settings",
    "account.profile": "Profile",
    "account.email": "Email",
    "account.name": "Name",
    "account.avatar": "Avatar",
    "account.security": "Security",
    "account.password": "Password",
    "account.changePassword": "Change Password",
    "account.twoFactor": "Two-Factor Authentication",
    "account.enable2FA": "Enable 2FA",
    "account.notifications": "Notifications",
    "account.emailNotifications": "Email Notifications",
    "account.marketingEmails": "Marketing Emails",
    "account.save": "Save Changes",

    // Auth
    "auth.login": "Log in",
    "auth.register": "Create Account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.signUp": "Sign up",
    "auth.signIn": "Sign in",
    "auth.continueWith": "Or continue with",
    "auth.google": "Google",
    "auth.github": "GitHub",
    "auth.terms": "By continuing, you agree to our Terms of Service and Privacy Policy.",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.export": "Export",
    "common.import": "Import",
    "common.settings": "Settings",
    "common.help": "Help",
    "common.back": "Back",
    "common.next": "Next",
    "common.previous": "Previous",
    "common.close": "Close",
  },
  zh: {
    // Navbar
    "nav.pricing": "定价",
    "nav.templates": "模板",
    "nav.features": "功能",
    "nav.login": "登录",
    "nav.getStarted": "开始使用",
    "nav.dashboard": "控制台",
    "nav.workspace": "工作区",
    "nav.generate": "生成",
    "nav.history": "历史",
    "nav.billing": "账单",
    "nav.account": "账户",
    "nav.logout": "退出登录",

    // Hero
    "hero.badge": "专业 AI 电影级内容生成",
    "hero.title": "用 AI 创作电影级内容",
    "hero.subtitle": "专业级视觉特效与场景创作。使用我们的 AI 工作区构建令人惊叹的电影级画面。",
    "hero.cta": "开始创作",
    "hero.demo": "观看演示",
    "hero.workspace": "ScenePilotix 工作区",
    "hero.flowControl": "流程控制",
    "hero.canvasPreview": "画布预览",
    "hero.entityEdit": "实体编辑",

    // Features
    "features.title": "专业功能",
    "features.subtitle": "创作影视级 AI 内容所需的一切工具。",
    "feature.sceneComposition": "场景构图",
    "feature.sceneCompositionDesc": "使用分层元素、背景和主体精确控制，构建复杂场景。",
    "feature.realTimeGeneration": "实时生成",
    "feature.realTimeGenerationDesc": "使用优化的 AI 管线即时生成电影级内容。",
    "feature.professionalWorkspace": "专业工作区",
    "feature.professionalWorkspaceDesc": "行业标准三面板布局，包含流程控制、画布和编辑面板。",
    "feature.styleControl": "风格控制",
    "feature.styleControlDesc": "微调光照、调色和视觉风格，获得完美效果。",
    "feature.shotManagement": "镜头管理",
    "feature.shotManagementDesc": "使用全面的项目工具组织和管理多个镜头。",
    "feature.aiDirector": "AI 导演",
    "feature.aiDirectorDesc": "让 AI 协助处理镜头角度、构图和电影技法。",

    // Video Section
    "video.title": "实际演示",
    "video.subtitle": "观看专业人士如何使用 ScenePilotix 创作令人惊叹的电影级内容。",

    // Pricing
    "pricing.title": "简单定价",
    "pricing.subtitle": "选择适合您创作需求的方案。",
    "pricing.starter": "入门版",
    "pricing.starterDesc": "适合个人创作者",
    "pricing.pro": "专业版",
    "pricing.proDesc": "适合专业创作者",
    "pricing.enterprise": "企业版",
    "pricing.enterpriseDesc": "适合团队和工作室",
    "pricing.perMonth": "/月",
    "pricing.custom": "定制",
    "pricing.startTrial": "开始免费试用",
    "pricing.getStarted": "立即开始",
    "pricing.contactSales": "联系销售",
    "pricing.feature.generations100": "每月 100 次生成",
    "pricing.feature.720p": "720p 导出",
    "pricing.feature.basicTemplates": "基础模板",
    "pricing.feature.emailSupport": "邮件支持",
    "pricing.feature.unlimitedGen": "无限生成",
    "pricing.feature.4k": "4K 导出",
    "pricing.feature.allTemplates": "所有模板",
    "pricing.feature.prioritySupport": "优先支持",
    "pricing.feature.apiAccess": "API 访问",
    "pricing.feature.everythingPro": "包含专业版所有功能",
    "pricing.feature.customModels": "自定义模型",
    "pricing.feature.dedicatedSupport": "专属支持",
    "pricing.feature.sla": "SLA 保障",
    "pricing.feature.onPremise": "本地部署选项",

    // CTA
    "cta.title": "准备好创作了吗？",
    "cta.subtitle": "加入数千名使用 ScenePilotix 制作专业电影级内容的创作者。",
    "cta.button": "立即开始创作",

    // Footer
    "footer.docs": "文档",
    "footer.rights": "保留所有权利。",

    // Dashboard
    "dashboard.welcome": "欢迎回来",
    "dashboard.projects": "项目",
    "dashboard.newProject": "新建项目",
    "dashboard.recentShots": "最近镜头",
    "dashboard.viewAll": "查看全部",
    "dashboard.quickTemplates": "快速模板",
    "dashboard.usage": "使用量",
    "dashboard.generationsUsed": "次生成已使用",
    "dashboard.upgrade": "升级方案",

    // Workspace
    "workspace.shot": "镜头",
    "workspace.director": "导演",
    "workspace.camera": "摄像机",
    "workspace.scene": "场景",
    "workspace.subject": "主体",
    "workspace.background": "背景",
    "workspace.lighting": "光照",
    "workspace.style": "风格",
    "workspace.generate": "生成",
    "workspace.preview": "预览",
    "workspace.settings": "设置",

    // Generate
    "generate.title": "生成",
    "generate.prompt": "描述您的场景...",
    "generate.negativePrompt": "负面提示词（可选）",
    "generate.aspectRatio": "宽高比",
    "generate.style": "风格",
    "generate.quality": "质量",
    "generate.generateBtn": "生成",
    "generate.generating": "生成中...",

    // History
    "history.title": "生成历史",
    "history.search": "搜索历史...",
    "history.filter": "筛选",
    "history.delete": "删除",
    "history.download": "下载",
    "history.regenerate": "重新生成",
    "history.empty": "暂无生成记录",
    "history.emptyDesc": "开始创作以查看您的历史记录。",

    // Templates
    "templates.title": "模板",
    "templates.search": "搜索模板...",
    "templates.all": "全部",
    "templates.cinematic": "电影级",
    "templates.product": "产品",
    "templates.portrait": "人像",
    "templates.landscape": "风景",
    "templates.abstract": "抽象",
    "templates.use": "使用模板",

    // Billing
    "billing.title": "账单",
    "billing.currentPlan": "当前方案",
    "billing.changePlan": "更改方案",
    "billing.cancelPlan": "取消方案",
    "billing.invoices": "发票历史",
    "billing.paymentMethod": "支付方式",
    "billing.addPayment": "添加支付方式",
    "billing.nextBilling": "下次账单日期",

    // Account
    "account.title": "账户设置",
    "account.profile": "个人资料",
    "account.email": "邮箱",
    "account.name": "姓名",
    "account.avatar": "头像",
    "account.security": "安全",
    "account.password": "密码",
    "account.changePassword": "修改密码",
    "account.twoFactor": "双因素认证",
    "account.enable2FA": "启用 2FA",
    "account.notifications": "通知",
    "account.emailNotifications": "邮件通知",
    "account.marketingEmails": "营销邮件",
    "account.save": "保存更改",

    // Auth
    "auth.login": "登录",
    "auth.register": "创建账户",
    "auth.email": "邮箱",
    "auth.password": "密码",
    "auth.confirmPassword": "确认密码",
    "auth.forgotPassword": "忘记密码？",
    "auth.noAccount": "还没有账户？",
    "auth.hasAccount": "已有账户？",
    "auth.signUp": "注册",
    "auth.signIn": "登录",
    "auth.continueWith": "或通过以下方式继续",
    "auth.google": "Google",
    "auth.github": "GitHub",
    "auth.terms": "继续即表示您同意我们的服务条款和隐私政策。",

    // Common
    "common.loading": "加载中...",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.delete": "删除",
    "common.edit": "编辑",
    "common.search": "搜索",
    "common.filter": "筛选",
    "common.sort": "排序",
    "common.export": "导出",
    "common.import": "导入",
    "common.settings": "设置",
    "common.help": "帮助",
    "common.back": "返回",
    "common.next": "下一步",
    "common.previous": "上一步",
    "common.close": "关闭",
  },
}

type TranslationKey = keyof typeof translations.en

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en")

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}
      className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary"
    >
      <span className="text-xs">{locale === "en" ? "EN" : "中"}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-xs text-muted-foreground">{locale === "en" ? "中" : "EN"}</span>
    </button>
  )
}
