import type { Lang } from "../i18n";
import { CONTACT_CHANNELS } from "../config/contactChannels";

export type LegalDocId =
  | "terms"
  | "privacy"
  | "billing"
  | "refund"
  | "ip"
  | "integrations"
  | "aup"
  | "disclaimer";

type LocalizedText = {
  zh: string;
  en: string;
};

type LegalSection = {
  heading: LocalizedText;
  body: LocalizedText[];
};

export type LegalDoc = {
  id: LegalDocId;
  title: LocalizedText;
  version: string;
  updatedAt: string;
  summary: LocalizedText;
  sections: LegalSection[];
};

export const LEGAL_COMPANY_PROFILE = {
  brandName: "ScenePilotix",
  supportEmail: CONTACT_CHANNELS.support,
  businessEmail: CONTACT_CHANNELS.contact,
  noReplyEmail: CONTACT_CHANNELS.noreply
} as const;

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: "terms",
    title: {
      zh: "用户协议",
      en: "Terms of Service"
    },
    version: "v2.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明平台定位、账户使用、提示词复制、项目包导出、用户内容责任、第三方接入与责任边界。",
      en: "Covers platform scope, accounts, prompt copying, project export, user-content responsibility, third-party integrations, and liability boundaries."
    },
    sections: [
      {
        heading: {
          zh: "1. 适用范围与签约主体",
          en: "1. Scope and Contracting Entity"
        },
        body: [
          {
            zh: `${LEGAL_COMPANY_PROFILE.brandName}（以下简称“我们”）向全球用户提供结构化创作、项目编排、提示词整理、导出与接入辅助服务。你在注册、登录、访问或使用服务时，即表示你同意本协议。`,
            en: `${LEGAL_COMPANY_PROFILE.brandName} ("we", "us", or "our") provides structured creation, project orchestration, prompt organization, export, and integration-assistance services globally. By registering, signing in, accessing, or using the service, you agree to these Terms.`
          },
          {
            zh: `付费订单由结账页展示的支付服务商或商户主体处理。法定销售主体、注册地址、税费、账单与付款信息以下单页、发票和收据展示为准。客服联系方式：${LEGAL_COMPANY_PROFILE.supportEmail}。`,
            en: `Paid orders are processed by the payment provider or merchant entity shown at checkout. The legal seller entity, registered address, taxes, billing, and payment details are governed by the checkout page, invoice, and receipt. Support contact: ${LEGAL_COMPANY_PROFILE.supportEmail}.`
          }
        ]
      },
      {
        heading: {
          zh: "2. 资格与账户",
          en: "2. Eligibility and Accounts"
        },
        body: [
          {
            zh: "你必须具备签订具有法律约束力合同的能力；如未达到所在地区法定年龄，应在父母或监护人同意和监督下使用服务。你应提供真实、完整、最新的账户信息，并对账户下发生的活动负责。",
            en: "You must have the legal capacity to enter into a binding agreement. If you are below the age of majority where you live, you may use the service only with parental or guardian consent and supervision. You must provide accurate and current account information and are responsible for activity under your account."
          }
        ]
      },
      {
        heading: {
          zh: "3. 服务内容与 AI 限制",
          en: "3. Service Description and AI Limitations"
        },
        body: [
          {
            zh: "本平台是结构化创作与项目编排 SaaS，不是底层托管式图像/视频生成服务商。当前核心能力包括：复制提示词、导出项目包、用户自带 API 接入辅助，以及本地生成工作流接入辅助（如 ComfyUI、Draw Things）。",
            en: "The service is a structured-creation and project-orchestration SaaS, not a hosted image/video generation provider. Core capabilities currently include prompt copying, project-package export, bring-your-own API integration assistance, and local workflow integration assistance (such as ComfyUI and Draw Things)."
          },
          {
            zh: "我们不代用户购买、垫付或保证第三方模型推理资源，也不承诺任何第三方平台的生成结果、审核结果、商用结果、持续可用性或兼容性。",
            en: "We do not purchase, subsidize, or guarantee third-party inference resources for users, and we do not promise any third-party platform's output, review outcome, commercial usability, ongoing availability, or compatibility."
          }
        ]
      },
      {
        heading: {
          zh: "4. 用户内容、输出与许可",
          en: "4. User Content, Outputs, and License"
        },
        body: [
          {
            zh: "你保留你提交内容的权利。为提供服务，你授予我们一项非独占、全球范围、在服务运行所必需范围内的许可，用于托管、处理、缓存、传输和显示你的输入、项目数据、导出指令和接入配置元数据。",
            en: "You retain rights in content you submit. To operate the service, you grant us a non-exclusive, worldwide license to host, process, cache, transmit, and display your inputs, project data, export instructions, and integration metadata as necessary to provide the service."
          },
          {
            zh: "你复制、导出、修改、分享、再次分发或提交至第三方平台、本地工具、商业项目、电商平台、广告投放、影视制作等场景的行为，均由你自行决定并独立承担风险和责任。",
            en: "You independently decide and assume all risk for copying, exporting, modifying, sharing, redistributing, or submitting materials to third-party platforms, local tools, commercial projects, e-commerce channels, advertising, or production workflows."
          }
        ]
      },
      {
        heading: {
          zh: "5. 可接受使用",
          en: "5. Acceptable Use"
        },
        body: [
          {
            zh: "你不得利用服务从事违法、侵权、欺诈、骚扰、仇恨、剥削未成年人、侵犯隐私、传播恶意代码、规避安全限制、滥发垃圾信息、盗用或共享 API key、转售第三方调用、攻击接口或滥用本地网络暴露的行为。",
            en: "You may not use the service for unlawful, infringing, fraudulent, harassing, hateful, child exploitation, privacy-invasive, malware, security-evasion, spam, stolen/shared API keys, reselling third-party calls, interface attacks, or abuse of exposed local-network runtimes."
          },
          {
            zh: "你不得上传、复制、导出或处理你无权使用的个人数据、参考图、品牌素材、人物形象、声音或其他受保护内容，除非你已取得充分授权并遵守适用法律。",
            en: "You may not upload, copy, export, or process personal data, reference media, brand assets, likenesses, voices, or other protected content you are not authorized to use, unless you have adequate permission and comply with applicable law."
          }
        ]
      },
      {
        heading: {
          zh: "6. 费用、暂停与终止",
          en: "6. Fees, Suspension, and Termination"
        },
        body: [
          {
            zh: "部分功能需付费订阅或购买点数。你可通过账户中心的“管理订阅（Manage Subscription）”入口取消自动续费；除当地法律另有要求外，取消在当前计费周期结束时生效。",
            en: "Some features require a paid subscription or credits. You can cancel auto-renewal through the Account Center \"Manage Subscription\" entry; unless local law requires otherwise, cancellation takes effect at the end of the current billing period."
          },
          {
            zh: "若你违反本协议、存在欺诈或支付风险、或法律要求我们采取措施，我们可暂停或终止你的访问。终止后，已产生的付款义务、责任限制、争议解决和知识产权条款继续有效。",
            en: "If you violate these Terms, present fraud or payment risk, or law requires action, we may suspend or terminate access. Accrued payment obligations, liability limitations, dispute terms, and intellectual property provisions survive termination."
          }
        ]
      },
      {
        heading: {
          zh: "7. 免责声明与责任限制",
          en: "7. Disclaimers and Limitation of Liability"
        },
        body: [
          {
            zh: "在适用法律允许范围内，服务按“现状”和“可用”提供。我们不作任何明示或默示保证，包括适销性、特定用途适用性、不侵权、不中断或无错误保证。",
            en: "To the extent permitted by law, the service is provided on an 'as is' and 'as available' basis. We disclaim express and implied warranties, including merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, and error-free operation."
          },
          {
            zh: "除适用法律不得限制者外，我们不对第三方平台故障、封号、限流、模型下线、政策变化、审核拒绝、本地环境崩溃、插件恶意代码、设备损坏、数据丢失或任何间接、附带、惩罚性、特殊或后果性损失负责。",
            en: "Except where prohibited by law, we are not liable for third-party outages, account suspension, rate limits, model deprecations, policy changes, review denials, local runtime failures, malicious plugins, device damage, data loss, or any indirect, incidental, punitive, special, or consequential damages."
          }
        ]
      },
      {
        heading: {
          zh: "8. 适用法律与争议解决",
          en: "8. Governing Law and Dispute Resolution"
        },
        body: [
          {
            zh: `本协议遵循运营主体所在地法律并受当地冲突法规则约束，但不会限制你在所在地消费者保护法下享有的不可放弃权利。与计费相关争议可先联系 ${LEGAL_COMPANY_PROFILE.supportEmail} 处理。`,
            en: `These Terms are governed by the law of the operating entity's jurisdiction, excluding conflict-of-law principles, but do not limit non-waivable consumer rights under your local law. For billing disputes, contact ${LEGAL_COMPANY_PROFILE.supportEmail} first.`
          }
        ]
      },
      {
        heading: {
          zh: "9. 赔偿责任",
          en: "9. Indemnification"
        },
        body: [
          {
            zh: "在适用法律允许范围内，如你违反本协议、侵犯第三方权利或因你的内容/行为导致第三方主张、损失或监管处置，你同意对我们及关联方进行抗辩、赔偿并使其免责。",
            en: "To the extent permitted by law, if you breach these Terms, infringe third-party rights, or your content or actions lead to third-party claims, losses, or regulatory action, you agree to defend, indemnify, and hold us and our affiliates harmless."
          }
        ]
      },
      {
        heading: {
          zh: "10. 出口管制与制裁合规",
          en: "10. Export Controls and Sanctions Compliance"
        },
        body: [
          {
            zh: "你承诺不会在受制裁地区、受限主体或违反适用出口管制法律的场景下使用服务，也不会将服务用于任何被禁止的最终用途。",
            en: "You represent that you will not use the service in sanctioned territories, by restricted parties, or in violation of applicable export-control laws, and will not use the service for prohibited end uses."
          }
        ]
      },
      {
        heading: {
          zh: "11. 条款更新与通知",
          en: "11. Changes to Terms and Notices"
        },
        body: [
          {
            zh: "在适用法律允许范围内，我们可基于法律法规变化、监管要求、第三方服务规则变化、产品升级、安全需要、运营安排及用户体验优化，对本协议及相关规则作出更新、调整和合理解释。重大更新将通过站内公告、邮件或登录提示提供通知；更新生效后继续使用服务即表示你接受修订条款。",
            en: "To the extent permitted by law, we may update, adjust, and reasonably interpret these Terms and related rules due to legal or regulatory changes, third-party rule changes, product upgrades, security needs, operations, or user-experience improvements. Material changes will be notified through in-product notices, email, or sign-in prompts; continued use after the effective date constitutes acceptance."
          }
        ]
      },
      {
        heading: {
          zh: "12. 安全事件与服务完整性",
          en: "12. Security Incidents and Service Integrity"
        },
        body: [
          {
            zh: "我们采用合理的管理、技术与组织安全措施保护账户与服务完整性，包括访问控制、最小权限、日志审计、加密传输和风险监测；但任何系统都无法保证绝对安全。",
            en: "We apply reasonable administrative, technical, and organizational safeguards to protect account and service integrity, including access controls, least privilege, audit logging, encrypted transport, and risk monitoring; however, no system can guarantee absolute security."
          },
          {
            zh: "如发生可能影响你权益的安全事件，我们会在适用法律要求的时限内采取遏制、调查、修复与通知措施。",
            en: "If a security incident may affect your rights or interests, we will take containment, investigation, remediation, and notice actions within timelines required by applicable law."
          }
        ]
      },
      {
        heading: {
          zh: "13. 版权投诉与侵权通知",
          en: "13. IP Complaints and Infringement Notices"
        },
        body: [
          {
            zh: `若你认为服务中的内容侵犯你的知识产权，请将权利证明、侵权链接、联系方式和声明发送至 ${LEGAL_COMPANY_PROFILE.supportEmail}。我们会按适用法律处理有效通知，并在必要时限制相关内容或账户。`,
            en: `If you believe content in the service infringes your intellectual-property rights, send proof of rights, infringing links, contact details, and your statement to ${LEGAL_COMPANY_PROFILE.supportEmail}. We process valid notices under applicable law and may remove content or restrict accounts when required.`
          },
          {
            zh: "重复侵权或恶意投诉行为可能导致账户限制、内容下架或其他必要措施。",
            en: "Repeated infringement or abusive takedown behavior may result in account restrictions, content removal, or other necessary actions."
          }
        ]
      }
    ]
  },
  privacy: {
    id: "privacy",
    title: {
      zh: "隐私说明",
      en: "Privacy Notice"
    },
    version: "v2.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明账户、项目、导出、风险确认、API 接入元数据、第三方发送边界和数据保留规则。",
      en: "Explains account, project, export, risk acknowledgments, API integration metadata, third-party transfer boundaries, and retention rules."
    },
    sections: [
      {
        heading: {
          zh: "1. 我们收集的数据",
          en: "1. Data We Collect"
        },
        body: [
          {
            zh: "我们可能收集账户信息（如邮箱）、登录与设备信息、支付相关记录、项目结构、提示词、导出行为、协议接受记录、风险确认记录、API 接入配置元数据、客服沟通和防滥用信号。默认不要提交与服务无关的敏感个人信息。",
            en: "We may collect account information (such as email), login and device data, payment-related records, project structure, prompts, export activity, policy-acceptance records, risk-acknowledgment records, API integration metadata, support communications, and abuse-prevention signals. You should avoid submitting sensitive personal data unrelated to the service."
          }
        ]
      },
      {
        heading: {
          zh: "2. 使用目的与法律基础",
          en: "2. Purposes and Legal Bases"
        },
        body: [
          {
            zh: "我们处理数据是为了创建和管理账户、提供提示词复制与项目导出、处理订阅和付款、支持用户自带 API 与本地接入、记录法律同意和风险确认、防欺诈与防滥用、履行法律义务、改进产品和回应支持请求。对于不同法域，法律基础可能包括履行合同、合法利益、同意和法定义务。",
            en: "We process data to create and manage accounts, provide prompt-copy and project-export features, process subscriptions and payments, support bring-your-own API and local integrations, record legal consent and risk acknowledgments, prevent fraud and abuse, comply with legal obligations, improve the product, and respond to support requests. Depending on the jurisdiction, legal bases may include contract performance, legitimate interests, consent, and legal obligations."
          }
        ]
      },
      {
        heading: {
          zh: "3. 模型提供方与服务商",
          en: "3. Model Providers and Service Providers"
        },
        body: [
          {
            zh: "为提供服务，我们可能与云基础设施、支付服务商、分析服务商和邮件服务商共享必要数据。当你主动使用第三方 API 执行时，提示词、参考素材、结构参数及相关项目数据可能被发送至相应第三方服务商，其后续处理受该第三方自身政策约束。本地生成模式下，相关数据主要在你的设备与本地服务之间流转。",
            en: "To provide the service, we may share necessary data with cloud infrastructure providers, payment processors, analytics vendors, and email vendors. When you intentionally execute through a third-party API, prompts, reference materials, structured parameters, and related project data may be sent to that third party, and further processing is governed by that provider's own policies. In local-workflow mode, relevant data primarily flows between your device and your local runtime."
          }
        ]
      },
      {
        heading: {
          zh: "4. 保存期限与删除",
          en: "4. Retention and Deletion"
        },
        body: [
          {
            zh: "个人数据仅在实现收集目的所需期间内保留，之后删除、匿名化或隔离保存。协议接受记录、风险确认记录、支付记录、风控日志和支持工单会按合规、对账与安全需要保留相应期间。",
            en: "Personal data is retained only for as long as needed for the purposes collected, then deleted, anonymized, or isolated. Policy-acceptance records, risk acknowledgments, payment records, risk logs, and support tickets may be retained for compliance, reconciliation, and security purposes."
          }
        ]
      },
      {
        heading: {
          zh: "5. 你的权利",
          en: "5. Your Rights"
        },
        body: [
          {
            zh: "根据适用法律，你可能享有访问、更正、删除、限制处理、反对处理、数据可携带、撤回同意和申诉的权利。我们会根据所在地法律核实并处理请求。",
            en: "Depending on applicable law, you may have rights to access, correct, delete, restrict processing, object, port data, withdraw consent, and lodge complaints. We will verify and process requests as required by local law."
          }
        ]
      },
      {
        heading: {
          zh: "6. 联系方式",
          en: "6. Contact Information"
        },
        body: [
          {
            zh: `隐私与数据权利请求请联系 ${LEGAL_COMPANY_PROFILE.supportEmail}。商务联系请使用 ${LEGAL_COMPANY_PROFILE.businessEmail}。系统通知邮箱为 ${LEGAL_COMPANY_PROFILE.noReplyEmail}（不接收客服请求）。`,
            en: `For privacy and data-rights requests, contact ${LEGAL_COMPANY_PROFILE.supportEmail}. For business inquiries, use ${LEGAL_COMPANY_PROFILE.businessEmail}. System notifications are sent from ${LEGAL_COMPANY_PROFILE.noReplyEmail} (not monitored for support).`
          }
        ]
      },
      {
        heading: {
          zh: "7. 未成年人隐私",
          en: "7. Children and Minors"
        },
        body: [
          {
            zh: "我们不故意面向法定年龄以下儿童收集其个人数据。如你认为我们误收集了未成年人信息，请联系支持邮箱，我们会在核验后采取删除或限制处理措施。",
            en: "We do not knowingly collect personal data from children below the legal age of digital consent. If you believe we have collected minor data in error, contact support and we will verify and delete or restrict processing as required."
          }
        ]
      },
      {
        heading: {
          zh: "8. 跨境传输与安全措施",
          en: "8. Cross-Border Transfers and Security"
        },
        body: [
          {
            zh: "你的数据可能在不同国家/地区处理。我们将采取合理技术与组织措施（如访问控制、最小权限、日志审计、加密传输）保护数据，并在适用法要求时采用标准合同或等效保障机制。",
            en: "Your data may be processed across jurisdictions. We apply reasonable technical and organizational safeguards (including access controls, least privilege, audit logging, and encrypted transport) and, where required, use standard contractual clauses or equivalent transfer mechanisms."
          }
        ]
      },
      {
        heading: {
          zh: "9. 自动化处理与分析",
          en: "9. Automated Processing and Analytics"
        },
        body: [
          {
            zh: "我们可能使用自动化方式进行风控、反滥用和产品分析。该等处理旨在保护服务安全和可用性，不直接替代你应自行完成的法律或商业判断。",
            en: "We may use automated processing for risk control, abuse prevention, and product analytics. Such processing is intended to protect service security and availability and does not replace legal or business judgments you must make independently."
          }
        ]
      },
      {
        heading: {
          zh: "10. Cookie 与类似技术",
          en: "10. Cookies and Similar Technologies"
        },
        body: [
          {
            zh: "我们可能使用 Cookie、本地存储和类似技术实现登录态维持、安全校验、语言偏好、性能分析与故障排查。你可通过浏览器或设备设置管理相关偏好，但部分功能可能因此受限。",
            en: "We may use cookies, local storage, and similar technologies for session continuity, security checks, language preferences, performance analytics, and troubleshooting. You can manage these preferences in browser or device settings, though some functionality may be limited."
          }
        ]
      },
      {
        heading: {
          zh: "11. 区域性隐私补充",
          en: "11. Regional Privacy Disclosures"
        },
        body: [
          {
            zh: "对于欧盟/欧洲经济区、英国和瑞士用户，我们在适用范围内提供 GDPR/UK GDPR 相关权利支持；对于美国加州等地区用户，我们在适用范围内提供访问、更正、删除与申诉流程。当地强制性隐私法律优先。",
            en: "For users in the EU/EEA, UK, and Switzerland, we support rights under GDPR/UK GDPR where applicable. For users in California and similar jurisdictions, we provide applicable access, correction, deletion, and appeal workflows. Mandatory local privacy laws prevail."
          }
        ]
      },
      {
        heading: {
          zh: "12. 安全事件通知",
          en: "12. Security Incident Notifications"
        },
        body: [
          {
            zh: `如发生可能导致未授权访问、泄露或不可用的安全事件，我们会按适用法律采取调查、修复与通知流程。你可通过 ${LEGAL_COMPANY_PROFILE.supportEmail} 查询与隐私安全相关事项。`,
            en: `If a security incident may cause unauthorized access, disclosure, or unavailability, we follow legally required investigation, remediation, and notice procedures. You may contact ${LEGAL_COMPANY_PROFILE.supportEmail} for privacy and security matters.`
          }
        ]
      }
    ]
  },
  billing: {
    id: "billing",
    title: {
      zh: "付费、订阅与点数条款",
      en: "Billing, Subscription, and Credits Terms"
    },
    version: "v2.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明价格展示、支付处理、自动续费、取消时点、点数规则、税费、风控、主动同意与争议处理路径。",
      en: "Explains pricing display, payment processing, auto-renewal, cancellation timing, credits rules, taxes, risk controls, affirmative consent, and dispute workflows."
    },
    sections: [
      {
        heading: {
          zh: "1. 价格与税费",
          en: "1. Pricing and Taxes"
        },
        body: [
          {
            zh: "价格、计费周期、包含权益和点数数量会在结账前展示。适用税费、汇率差额、银行费用或平台附加费用会按结账页面规则显示。",
            en: "Pricing, billing cycle, included benefits, and credits amounts are shown before checkout. Applicable taxes, exchange-rate differences, bank fees, or platform surcharges are displayed according to checkout rules."
          }
        ]
      },
      {
        heading: {
          zh: "2. 结账与订阅",
          en: "2. Checkout and Subscription"
        },
        body: [
          {
            zh: "结账由产品当时接入的支付服务商或商户主体托管或处理。法定销售主体、税费、发票和收据以下单页与支付凭证展示为准。Pro 为自动续费订阅，直到你取消为止。",
            en: "Checkout is hosted or processed by the payment provider or merchant entity integrated at the time. The legal seller, taxes, invoice, and receipt details are governed by the checkout page and payment records. Pro is an auto-renewing subscription until cancelled."
          },
          {
            zh: "我们会在结账前明确展示自动续费、计费周期、价格、如何取消和退款规则。你可通过账户中心“管理订阅”入口或结账页提示的客户门户管理续费。",
            en: "Before checkout, we clearly disclose auto-renewal, billing cycle, pricing, how to cancel, and refund rules. You can manage renewal through the Account Center Manage Subscription entry or the customer portal shown at checkout."
          }
        ]
      },
      {
        heading: {
          zh: "3. 点数",
          en: "3. Credits"
        },
        body: [
          {
            zh: "点数是用于解锁模板、高级功能和未来站内能力的账户内使用额度，不是法定货币、储值支付工具、证券或可自由转让财产。除非我们明确允许，点数不得转让、出售、质押或兑换现金。",
            en: "Credits are account-based usage units for unlocking templates, advanced features, and future in-product capabilities. They are not legal tender, stored-value payment instruments, securities, or freely transferable property. Unless we expressly allow it, credits may not be transferred, sold, pledged, or redeemed for cash."
          },
          {
            zh: "购买点数与订阅赠送点数应在产品界面中区分显示。赠送、促销或补偿性点数不可退款，除非适用法律另有要求。",
            en: "Purchased credits and subscription-included credits should be displayed separately in the product. Promotional, complimentary, or compensation credits are non-refundable unless required by law."
          }
        ]
      },
      {
        heading: {
          zh: "4. 风险控制与异常订单",
          en: "4. Risk Controls and Exceptional Orders"
        },
        body: [
          {
            zh: "若交易存在欺诈、盗刷、滥用退款、制裁合规、身份异常或系统故障风险，我们可以延迟、限制、撤销或拒绝订单，并在适用法律允许范围内回收相关权益。涉嫌滥用的账户可能被临时限制支付能力。",
            en: "If a transaction presents fraud, stolen-payment use, refund abuse, sanctions risk, identity anomalies, or system-failure risk, we may delay, limit, reverse, or refuse the order and, where permitted by law, reclaim related benefits. Accounts suspected of abuse may be temporarily restricted from further payments."
          }
        ]
      },
      {
        heading: {
          zh: "5. 支持与争议处理",
          en: "5. Support and Dispute Handling"
        },
        body: [
          {
            zh: `账单、订阅、扣款和退款问题请联系 ${LEGAL_COMPANY_PROFILE.supportEmail}。商务合作请联系 ${LEGAL_COMPANY_PROFILE.businessEmail}。系统通知由 ${LEGAL_COMPANY_PROFILE.noReplyEmail} 发出（不接收回复）。`,
            en: `For billing, subscription, charge, or refund issues, contact ${LEGAL_COMPANY_PROFILE.supportEmail}. For business inquiries, contact ${LEGAL_COMPANY_PROFILE.businessEmail}. System notifications are sent from ${LEGAL_COMPANY_PROFILE.noReplyEmail} (no support replies).`
          }
        ]
      },
      {
        heading: {
          zh: "6. 拒付与争议扣款",
          en: "6. Chargebacks and Payment Disputes"
        },
        body: [
          {
            zh: "如发生拒付、争议扣款或支付网络逆转，我们有权在调查期间临时限制相关账户的部分付费能力，并在核验后恢复或采取必要调整。",
            en: "If a chargeback, payment dispute, or network reversal occurs, we may temporarily limit related paid capabilities during investigation and restore access or apply necessary adjustments after verification."
          }
        ]
      },
      {
        heading: {
          zh: "7. Pro 与 Credits 的关系",
          en: "7. Distinction Between Pro and Credits"
        },
        body: [
          {
            zh: "Pro 订阅用于解锁高级编辑能力并按月赠送点数，不代表无限生成。图片和视频生成按点数消耗执行；点数可通过订阅赠送或单独购买获得。",
            en: "Pro subscription unlocks advanced editing capabilities and provides monthly credits, but does not mean unlimited generation. Image and video generation consume credits; credits can come from subscription grants or standalone purchases."
          }
        ]
      },
      {
        heading: {
          zh: "8. 价格变更与生效",
          en: "8. Pricing Changes"
        },
        body: [
          {
            zh: "我们可在未来调整价格、点数包规格或订阅权益。调整通常不追溯既往订单，并会在生效前通过产品页面或结账页公示。",
            en: "We may adjust prices, credit-pack configurations, or subscription benefits in the future. Changes generally do not retroactively alter completed orders and will be disclosed in product or checkout pages before taking effect."
          }
        ]
      },
      {
        heading: {
          zh: "9. 主动同意与下单前确认",
          en: "9. Affirmative Consent Before Payment"
        },
        body: [
          {
            zh: "在你付款前，系统会要求你主动勾选并确认已阅读适用的付费条款、退款政策、服务协议与隐私说明。未完成勾选前，系统不会执行下单。",
            en: "Before payment, the product requires you to actively check and confirm the applicable Billing Terms, Refund Policy, Terms of Service, and Privacy Notice. No order is executed before this consent is completed."
          }
        ]
      },
      {
        heading: {
          zh: "10. 支付授权与强认证",
          en: "10. Payment Authorization and Strong Authentication"
        },
        body: [
          {
            zh: "你授权支付服务商按结账页面展示的金额、税费和周期进行扣款。针对部分地区或发卡行，支付可能触发 3DS/SCA 等强认证；认证失败将导致交易未完成。",
            en: "You authorize the payment processor to charge the amount, taxes, and cycle displayed at checkout. In some regions or by issuer policy, payments may require 3DS/SCA or similar strong customer authentication; failed authentication means the transaction is not completed."
          }
        ]
      },
      {
        heading: {
          zh: "11. 续费提醒与条款更新通知",
          en: "11. Renewal and Terms-Change Notices"
        },
        body: [
          {
            zh: "在适用法律要求的地区，我们会按要求提供续费或价格调整通知。继续使用或续费后的条款适用以通知与结账展示为准，且不影响当地不可放弃消费者权利。",
            en: "Where required by law, we provide renewal or pricing-change notices. The terms applicable after continued use or renewal follow the notices and checkout disclosures, without limiting non-waivable local consumer rights."
          }
        ]
      }
    ]
  },
  refund: {
    id: "refund",
    title: {
      zh: "退款政策",
      en: "Refund Policy"
    },
    version: "v2.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "首购订阅 7 天可退；单独充值点数在整包未使用时可退；并明确原路退回与风控复核规则。",
      en: "First-time subscriptions are refundable within 7 days; standalone purchased credits are refundable when the purchased pack remains unused; with clear original-payment return and risk-review rules."
    },
    sections: [
      {
        heading: {
          zh: "1. 订阅退款",
          en: "1. Subscription Refunds"
        },
        body: [
          {
            zh: "首次购买 Pro 订阅的用户，可在首笔订阅扣款后的 7 个自然日内申请退款。该 7 天退款不以你是否已使用订阅内包含的点数、功能或生成次数为前提。",
            en: "A user making a first-time Pro subscription purchase may request a refund within 7 calendar days after the initial subscription charge. This 7-day refund is not conditioned on whether you used any included subscription credits, features, or generations."
          },
          {
            zh: "若退款获批，订阅将在退款处理后终止，后续订阅权益可被停止；适用法律要求保留的权利除外。续费订阅、升级差价或企业定制方案是否退款，以结账页和订单页披露为准。",
            en: "If a refund is granted, the subscription will terminate after refund processing and future subscription benefits may stop, except where local law requires otherwise. Renewals, upgrade prorations, and enterprise-plan refund treatment follow checkout and order-page disclosures."
          }
        ]
      },
      {
        heading: {
          zh: "2. 点数退款",
          en: "2. Credits Refunds"
        },
        body: [
          {
            zh: "用户单独购买的点数包，如该次购买对应的点数整包未被使用，可申请退款。已经部分使用、混合消耗或无法识别为未使用整包的购买点数，不支持按比例退款，除非适用法律另有要求。",
            en: "A separately purchased credits pack may be refunded if the credits associated with that purchase remain entirely unused. If the purchased credits have been partially used, blended into mixed consumption, or can no longer be identified as a wholly unused pack, pro-rata refunds are not offered unless required by law."
          },
          {
            zh: "赠送点数、促销点数、客服补偿点数和订阅附带点数不属于“单独购买点数包未使用可退”范围。第三方 API 服务商直接向你收取的费用、税费、订阅费或 API 消耗，不适用本平台退款政策。",
            en: "Complimentary, promotional, support-compensation, and subscription-included credits are not part of the 'unused purchased credits pack refundable' rule. Charges, taxes, subscriptions, or API consumption billed directly by third-party providers are outside this platform refund policy."
          }
        ]
      },
      {
        heading: {
          zh: "3. 不影响法定消费者权利",
          en: "3. No Waiver of Mandatory Consumer Rights"
        },
        body: [
          {
            zh: "本政策不限制你根据所在地适用消费者保护法享有的不可放弃权利。若本政策与强制性法律冲突，以该等法律为准。",
            en: "This policy does not limit non-waivable rights you may have under applicable consumer protection law. If this policy conflicts with mandatory law, that law controls."
          }
        ]
      },
      {
        heading: {
          zh: "4. 申请方式",
          en: "4. How to Request a Refund"
        },
        body: [
          {
            zh: `退款申请请发送至 ${LEGAL_COMPANY_PROFILE.supportEmail}，并附上账户邮箱、订单号、购买日期和退款原因。我们通常在 2 个工作日内回复并在 5-10 个工作日内完成审核与退回（具体到账时间受支付渠道影响）。`,
            en: `Submit refund requests to ${LEGAL_COMPANY_PROFILE.supportEmail} with your account email, order number, purchase date, and refund reason. We usually reply within 2 business days and complete review/refund in 5-10 business days (final settlement timing depends on payment rails).`
          }
        ]
      },
      {
        heading: {
          zh: "5. 数字服务即时履行说明",
          en: "5. Immediate Digital-Service Fulfillment"
        },
        body: [
          {
            zh: "你确认在付款后可立即访问数字服务功能与点数能力。对适用法允许的地区，若你在结账中明确同意即时履行并确认可能影响冷静期权利，我们将按结账页披露执行。",
            en: "You acknowledge that digital-service functionality and credits access may begin immediately after payment. In jurisdictions where permitted, if you explicitly consent to immediate performance and acknowledge potential cooling-off implications at checkout, the disclosure shown at checkout will apply."
          }
        ]
      },
      {
        heading: {
          zh: "6. 退款处理与风控复核",
          en: "6. Refund Processing and Risk Review"
        },
        body: [
          {
            zh: "退款申请可能进行订单真实性、支付风险和账户异常复核。若发现欺诈、盗刷、滥用退款或严重违反条款行为，我们可依法拒绝退款或暂停相关权益。",
            en: "Refund requests may be reviewed for order authenticity, payment risk, and account anomalies. If fraud, unauthorized payment use, refund abuse, or serious Terms violations are detected, we may reject refunds or suspend related benefits as permitted by law."
          }
        ]
      },
      {
        heading: {
          zh: "7. 退款路径与到账方式",
          en: "7. Return Channel and Settlement Method"
        },
        body: [
          {
            zh: "退款默认退回至原支付路径和原币种（如支付渠道支持）。若原路径不可用，可能改由支付服务商提供的替代路径处理。到账时间受发卡行、支付网络和地区结算规则影响。",
            en: "Refunds are returned to the original payment rail and currency by default (where supported). If the original route is unavailable, an alternative route provided by the payment processor may be used. Settlement timing depends on issuer, payment network, and regional clearing rules."
          }
        ]
      }
    ]
  },
  ip: {
    id: "ip",
    title: {
      zh: "知识产权与用户内容政策",
      en: "IP and User Content Policy"
    },
    version: "v1.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明用户素材、参考图、导出内容、权利保证、侵权处理和平台边界。",
      en: "Explains user materials, references, exported content, rights warranties, infringement handling, and platform boundaries."
    },
    sections: [
      {
        heading: { zh: "1. 用户素材与授权保证", en: "1. User Materials and Authorization" },
        body: [
          {
            zh: "你上传、粘贴、引用、链接、导出或提交给第三方服务的所有素材，包括参考图、视频、商品图、人物照片、Logo、包装、文案、角色设定和其他内容，均由你保证来源合法并已取得必要授权。",
            en: "You warrant that all materials you upload, paste, reference, link, export, or submit to third-party services — including reference images, video, product shots, portraits, logos, packaging, copy, character settings, and other content — come from lawful sources and have the necessary authorization."
          },
          {
            zh: "对于真实人物形象、声音、品牌、包装、影视角色、动漫角色、商标标识、摄影作品和其他高风险内容，你应在使用前自行确认是否已取得充分、明确、有效的授权或其他合法基础。",
            en: "For real-person likenesses, voices, brands, packaging, film or animation characters, trademarks, photographs, and other high-risk content, you must independently confirm that you have adequate, explicit, valid authorization or another lawful basis before use."
          }
        ]
      },
      {
        heading: { zh: "2. 平台边界", en: "2. Platform Boundary" },
        body: [
          {
            zh: "平台不会因为素材经过上传、组织、复制、导出、打包或经由平台接入第三方服务，即取得该等素材的权利，也不因此对其合法性、可商用性或不侵权作任何保证。",
            en: "The platform does not obtain rights in materials merely because they are uploaded, organized, copied, exported, packaged, or sent through platform-assisted integrations, and we do not guarantee their legality, commercial usability, or non-infringement."
          }
        ]
      },
      {
        heading: { zh: "3. 投诉与处理", en: "3. Complaints and Handling" },
        body: [
          {
            zh: `如因你的素材、导出内容或后续使用引发投诉、下架、索赔、争议或监管调查，你应自行承担责任；如因此给平台造成损失，你应负责赔偿。权利投诉可发送至 ${LEGAL_COMPANY_PROFILE.supportEmail}。`,
            en: `If your materials, exported content, or subsequent use leads to complaints, takedowns, claims, disputes, or regulatory inquiries, you are responsible for those consequences and must indemnify the platform for related losses. Rights complaints may be sent to ${LEGAL_COMPANY_PROFILE.supportEmail}.`
          }
        ]
      }
    ]
  },
  integrations: {
    id: "integrations",
    title: {
      zh: "第三方 API 与本地工作流接入条款",
      en: "Third-Party API and Local Workflow Terms"
    },
    version: "v1.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明用户自带 API、第三方费用、封号风险、本地环境风险、端口暴露和兼容性边界。",
      en: "Explains bring-your-own API use, third-party costs, suspension risk, local-runtime risk, exposed ports, and compatibility boundaries."
    },
    sections: [
      {
        heading: { zh: "1. 用户自带 API", en: "1. Bring-Your-Own API" },
        body: [
          {
            zh: "你应自行向第三方服务商申请、开通、充值、维护和合法使用 API 账户及凭证。账户、账单、税费、自动续费、超额费用、限流、封号、冻结、地区限制、模型下线及争议处理均由你自行承担。",
            en: "You must independently apply for, activate, fund, maintain, and lawfully use third-party API accounts and credentials. Accounts, billing, taxes, renewals, overage charges, rate limits, suspension, freezes, regional restrictions, model deprecations, and disputes are your responsibility."
          },
          {
            zh: "你保证对所接入的 API key 或凭证拥有合法使用权，不使用盗用、共享、倒卖、灰产或其他非法来源的凭证。",
            en: "You represent that you have lawful authority to use the API keys or credentials you connect and will not use stolen, shared, resold, abusive, or otherwise unlawful credentials."
          }
        ]
      },
      {
        heading: { zh: "2. 第三方规则同时适用", en: "2. Third-Party Rules Also Apply" },
        body: [
          {
            zh: "当你使用 fal、Runway 或其他第三方服务商 API 时，除遵守本平台协议外，还应同时遵守相应第三方服务条款、API 条款、可接受使用政策、隐私政策、计费规则和组织规则。",
            en: "When you use fal, Runway, or any other third-party API through the platform, you must comply not only with our policies but also with the applicable third-party terms, API terms, acceptable-use policies, privacy policies, billing rules, and organizational rules."
          }
        ]
      },
      {
        heading: { zh: "3. 本地工作流与设备安全", en: "3. Local Workflows and Device Security" },
        body: [
          {
            zh: "对于 ComfyUI、Draw Things 或其他本地软件、节点、插件、模型、LoRA、脚本、API Server、驱动、局域网配置和硬件环境，你应自行安装、维护并承担安全和兼容性风险。",
            en: "For ComfyUI, Draw Things, and other local software, nodes, plugins, models, LoRAs, scripts, API servers, drivers, LAN settings, and hardware environments, you are responsible for installation, maintenance, security, and compatibility risks."
          },
          {
            zh: "如你将本地服务暴露至公网、局域网或团队网络环境，相关访问控制、数据泄露、未授权调用、结果泄露或设备安全风险均由你自行承担。",
            en: "If you expose a local service to the public internet, LAN, or team network, all related access-control, data-exposure, unauthorized-call, output-leakage, and device-security risks are your responsibility."
          }
        ]
      }
    ]
  },
  aup: {
    id: "aup",
    title: {
      zh: "可接受使用政策",
      en: "Acceptable Use Policy"
    },
    version: "v1.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明禁止的内容、技术滥用、API 滥用、深度伪造欺诈和网络攻击行为。",
      en: "Explains prohibited content, technical abuse, API abuse, deepfake fraud, and network attacks."
    },
    sections: [
      {
        heading: { zh: "1. 禁止内容与行为", en: "1. Prohibited Content and Conduct" },
        body: [
          {
            zh: "你不得利用服务从事违法、侵权、冒充、深度伪造欺诈、骚扰、仇恨、未成年人不当内容、侵犯隐私或其他不当活动。",
            en: "You may not use the service for unlawful acts, infringement, impersonation, deepfake fraud, harassment, hate, improper minor-related content, privacy invasion, or other abusive activity."
          }
        ]
      },
      {
        heading: { zh: "2. 技术滥用", en: "2. Technical Abuse" },
        body: [
          {
            zh: "你不得盗用、共享、转售或批量滥用 API key，不得规避限制、攻击接口、滥用本地网络暴露或利用平台从事自动化滥刷。",
            en: "You may not steal, share, resell, or massively abuse API keys, circumvent restrictions, attack interfaces, abuse exposed local runtimes, or use the platform for abusive automation."
          }
        ]
      }
    ]
  },
  disclaimer: {
    id: "disclaimer",
    title: {
      zh: "免责声明与风险提示",
      en: "Disclaimer and Risk Disclosure"
    },
    version: "v1.0",
    updatedAt: "2026-03-29",
    summary: {
      zh: "说明提示词复制、项目包导出、素材授权、第三方 API 与本地工作流的风险边界。",
      en: "Explains risk boundaries for prompt copying, project export, source authorization, third-party APIs, and local workflows."
    },
    sections: [
      {
        heading: { zh: "1. 提示词复制", en: "1. Prompt Copying" },
        body: [
          {
            zh: "平台提供的提示词、模板、结构化字段和编译结果仅作为创作辅助与表达参考，不构成对任何第三方平台生成结果、审核结果、商用结果或法律结果的承诺。",
            en: "Prompts, templates, structured fields, and compiled outputs provided by the platform are creative aids and reference materials only. They do not constitute a promise regarding any third-party platform's output, review result, commercial use, or legal outcome."
          }
        ]
      },
      {
        heading: { zh: "2. 项目包导出", en: "2. Project Export" },
        body: [
          {
            zh: "项目包导出仅为便于你备份、迁移、复用或继续在第三方工具中创作。导出后的存储、传输、分享、二次编辑、兼容性和后续使用均由你自行负责。",
            en: "Project-package export is provided only to help you back up, migrate, reuse, or continue your work in third-party tools. Storage, transfer, sharing, editing, compatibility, and subsequent use after export are your responsibility."
          }
        ]
      },
      {
        heading: { zh: "3. 第三方与本地风险", en: "3. Third-Party and Local Risks" },
        body: [
          {
            zh: "第三方 API 的可用性、价格、额度、审核政策、封号决定和结果质量，以相应平台规则为准。本地环境中的插件、节点、模型、LoRA、脚本、端口暴露、日志记录和系统安全风险，由你自行承担。",
            en: "Third-party API availability, pricing, quotas, review policies, suspension decisions, and output quality are governed by the applicable provider rules. Plugins, nodes, models, LoRAs, scripts, exposed ports, logging, and system-security risks in your local environment are your responsibility."
          }
        ]
      }
    ]
  }
};

export function legalText(lang: Lang, text: LocalizedText) {
  return lang === "zh" ? text.zh : text.en;
}
