import type { Lang } from "../i18n";
import { CONTACT_CHANNELS } from "../config/contactChannels";

export type LegalDocId = "terms" | "privacy" | "billing" | "refund";

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
    version: "v1.3",
    updatedAt: "2026-03-13",
    summary: {
      zh: "规范账户、服务使用、内容责任、可接受使用、知识产权、AI 输出限制、全球合规与责任边界。",
      en: "Covers accounts, acceptable use, content responsibility, intellectual property, AI output limits, global compliance, and liability boundaries."
    },
    sections: [
      {
        heading: {
          zh: "1. 适用范围与签约主体",
          en: "1. Scope and Contracting Entity"
        },
        body: [
          {
            zh: `${LEGAL_COMPANY_PROFILE.brandName}（以下简称“我们”）向全球用户提供网站、应用、API、工作台及相关付费功能。你在注册、登录、访问或使用服务时，即表示你同意本协议。`,
            en: `${LEGAL_COMPANY_PROFILE.brandName} ("we", "us", or "our") provides the website, apps, APIs, workspace, and related paid features globally. By registering, signing in, accessing, or using the service, you agree to these Terms.`
          },
          {
            zh: `付费订单由 Paddle 处理；在 Paddle 托管结账页、发票和收据中会展示法定销售主体、注册地址、税费与付款信息。客服联系方式：${LEGAL_COMPANY_PROFILE.supportEmail}。`,
            en: `Paid orders are processed by Paddle. The legal seller entity, registered address, tax details, and payment information are shown on Paddle-hosted checkout, invoices, and receipts. Support contact: ${LEGAL_COMPANY_PROFILE.supportEmail}.`
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
            zh: "ScenePilot 帮助用户将自然语言、结构选择和画布编辑转化为图像或视频制作结构、提示词和预览。AI 生成结果可能不准确、不完整或不适合特定用途，不能替代专业法律、医疗、财务、安全或其他受监管建议。",
            en: "ScenePilot helps users convert natural language, structure selections, and canvas edits into image or video planning structures, prompts, and previews. AI outputs may be inaccurate, incomplete, or unsuitable for a specific purpose and do not replace professional legal, medical, financial, safety, or other regulated advice."
          },
          {
            zh: "我们可在不承担持续兼容义务的前提下更新、优化、暂停或停止部分功能。",
            en: "We may update, improve, suspend, or discontinue parts of the service without any obligation to maintain perpetual compatibility."
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
            zh: "你保留你提交内容的权利。为提供服务，你授予我们一项非独占、全球范围、在服务运行所必需范围内的许可，用于托管、处理、缓存、传输和显示你的输入、项目数据和指令。",
            en: "You retain rights in content you submit. To operate the service, you grant us a non-exclusive, worldwide license to host, process, cache, transmit, and display your inputs, project data, and instructions as necessary to provide the service."
          },
          {
            zh: "在法律允许范围内，你对使用生成输出承担责任，包括核查第三方权利、标识义务、商用适配性和合规要求。我们不承诺输出天然具有版权、专有性、唯一性或可注册性。",
            en: "To the extent permitted by law, you are responsible for your use of generated outputs, including reviewing third-party rights, labeling obligations, commercial suitability, and legal compliance. We do not guarantee that outputs are inherently copyrightable, proprietary, unique, or registrable."
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
            zh: "你不得利用服务从事违法、侵权、欺诈、骚扰、仇恨、剥削未成年人、侵犯隐私、传播恶意代码、规避安全限制、滥发垃圾信息、训练竞争性基础模型或规避计费的行为。",
            en: "You may not use the service for unlawful, infringing, fraudulent, harassing, hateful, child exploitation, privacy-invasive, malware, security-evasion, spam, competitive foundation-model training, or billing-circumvention activities."
          },
          {
            zh: "你不得上传或生成你无权处理的个人数据、受保护内容或高风险受监管材料，除非你已取得充分授权并遵守适用法律。",
            en: "You may not upload or generate personal data, protected content, or high-risk regulated material unless you have adequate authorization and comply with applicable law."
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
            zh: "除适用法律不得限制者外，我们不对间接、附带、惩罚性、特殊或后果性损失负责。若你的法域要求特定责任上限或消费者救济，该等强制性规则优先适用。",
            en: "Except where prohibited by law, we are not liable for indirect, incidental, punitive, special, or consequential damages. If your jurisdiction requires specific liability caps or consumer remedies, those mandatory rules prevail."
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
            zh: "我们可基于法律、监管、风控或产品演进更新本协议。重大更新将通过站内公告、邮件或登录提示提供通知；更新生效后继续使用服务即表示你接受修订条款。",
            en: "We may update these Terms due to legal, regulatory, risk, or product changes. Material updates will be notified via in-product notice, email, or sign-in prompts. Continued use after the effective date constitutes acceptance of the revised Terms."
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
    version: "v1.3",
    updatedAt: "2026-03-13",
    summary: {
      zh: "说明收集哪些数据、为何收集、如何使用、保存多久、跨境传输、区域权利和安全通知机制。",
      en: "Explains what data is collected, why it is collected, how it is used, retention periods, cross-border transfers, regional rights, and security-notice processes."
    },
    sections: [
      {
        heading: {
          zh: "1. 我们收集的数据",
          en: "1. Data We Collect"
        },
        body: [
          {
            zh: "我们可能收集账户信息（如邮箱）、登录与设备信息、支付相关记录、输入文本、画布结构、项目文件、日志、客服沟通和防滥用信号。默认不要收集与你提供服务无关的敏感个人信息。",
            en: "We may collect account information (such as email), login and device data, payment-related records, prompts, canvas structures, project files, logs, support communications, and abuse-prevention signals. By default, you should avoid collecting sensitive personal data unrelated to providing the service."
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
            zh: "我们处理数据是为了创建和管理账户、提供生成服务、结算付款、防欺诈与防滥用、履行法律义务、改进产品和回应支持请求。对于不同法域，法律基础可能包括履行合同、合法利益、同意和法定义务。",
            en: "We process data to create and manage accounts, provide generation services, process payments, prevent fraud and abuse, comply with legal obligations, improve the product, and respond to support requests. Depending on the jurisdiction, legal bases may include contract performance, legitimate interests, consent, and legal obligations."
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
            zh: "为提供服务，我们可能与云基础设施、支付服务商、分析服务商、邮件服务商和模型供应商共享必要数据。支付环节由 Paddle 及其支付网络处理，我们仅接收订单状态、风控与对账所需信息。",
            en: "To provide the service, we may share necessary data with cloud infrastructure providers, payment processors, analytics vendors, email vendors, and model providers. Payment processing is handled by Paddle and its payment network, while we receive order-status, risk, and reconciliation data needed to run the service."
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
            zh: "个人数据仅在实现收集目的所需期间内保留，之后删除、匿名化或隔离保存。你应为账户数据、支付记录、风控日志和支持工单设定明确保留期。",
            en: "Personal data is retained only for as long as needed for the purposes collected, then deleted, anonymized, or isolated. You should set clear retention periods for account data, payment records, risk logs, and support tickets."
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
    version: "v1.3",
    updatedAt: "2026-03-13",
    summary: {
      zh: "说明价格展示、Paddle 支付处理、自动续费、取消时点、点数规则、税费、风控、主动同意与争议处理路径。",
      en: "Explains pricing display, Paddle payment processing, auto-renewal, cancellation timing, credits rules, taxes, risk controls, affirmative consent, and dispute workflows."
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
            zh: "结账由 Paddle 托管或处理，Paddle 可作为 Merchant of Record（法定销售主体）处理付款、税费、发票和收据。Pro 为自动续费订阅，直到你取消为止。",
            en: "Checkout is hosted or processed by Paddle. Paddle may act as the merchant of record to handle payment collection, taxes, invoices, and receipts. Pro is an auto-renewing subscription until cancelled."
          },
          {
            zh: "我们会在结账前明确展示自动续费、计费周期、价格、如何取消和退款规则。你可通过账户中心“管理订阅（Manage Subscription）”入口或 Paddle 客户门户管理续费。",
            en: "Before checkout, we clearly disclose auto-renewal, billing cycle, pricing, how to cancel, and refund rules. You can manage renewal in Account Center via \"Manage Subscription\" or the Paddle customer portal."
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
            zh: "点数是用于解锁或调用特定生成能力的账户内使用额度，不是法定货币、储值支付工具、证券或可自由转让财产。除非我们明确允许，点数不得转让、出售、质押或兑换现金。",
            en: "Credits are account-based usage units for unlocking or consuming certain generation features. They are not legal tender, stored-value payment instruments, securities, or freely transferable property. Unless we expressly allow it, credits may not be transferred, sold, pledged, or redeemed for cash."
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
            zh: "在你付款前，系统会要求你主动勾选并确认已阅读适用的付费条款、退款政策、用户协议与隐私说明。未完成勾选前，系统不会执行下单。",
            en: "Before payment, the product requires you to actively check and confirm applicable Billing Terms, Refund Policy, Terms of Service, and Privacy Notice. No order is executed before this consent is completed."
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
    version: "v1.3",
    updatedAt: "2026-03-13",
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
            zh: "赠送点数、促销点数、客服补偿点数和订阅附带点数不属于“单独购买点数包未使用可退”范围。",
            en: "Complimentary, promotional, support-compensation, and subscription-included credits are not part of the 'unused purchased credits pack refundable' rule."
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
  }
};

export function legalText(lang: Lang, text: LocalizedText) {
  return lang === "zh" ? text.zh : text.en;
}
