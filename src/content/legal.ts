import type { Lang } from "../i18n";

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

export const LEGAL_COMPANY_PLACEHOLDERS = {
  legalName: "[Company Legal Name]",
  address: "[Registered Address]",
  contactEmail: "[support@yourdomain.com]",
  governingLaw: "[Governing Law / Jurisdiction]"
} as const;

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: "terms",
    title: {
      zh: "用户协议",
      en: "Terms of Service"
    },
    version: "v1.0",
    updatedAt: "2026-03-10",
    summary: {
      zh: "规范账户、服务使用、内容责任、可接受使用、知识产权、AI 输出限制与责任边界。",
      en: "Covers accounts, acceptable use, content responsibility, intellectual property, AI output limits, and liability boundaries."
    },
    sections: [
      {
        heading: {
          zh: "1. 适用范围与签约主体",
          en: "1. Scope and Contracting Entity"
        },
        body: [
          {
            zh: `${LEGAL_COMPANY_PLACEHOLDERS.legalName}（以下简称“我们”）向全球用户提供 ScenePilot 服务。本协议适用于网站、应用、API、快捷工作台、Pro 工作台及相关付费功能。你在注册、登录、访问或使用服务时，即表示你同意本协议。`,
            en: `${LEGAL_COMPANY_PLACEHOLDERS.legalName} ("we", "us", or "our") provides ScenePilot services to users globally. These Terms apply to the website, apps, APIs, Quick Workspace, Pro Workspace, and related paid features. By registering, signing in, accessing, or using the service, you agree to these Terms.`
          },
          {
            zh: `请在上线前补充完整主体名称、注册地址、联系邮箱和适用法律信息：${LEGAL_COMPANY_PLACEHOLDERS.legalName} / ${LEGAL_COMPANY_PLACEHOLDERS.address} / ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail} / ${LEGAL_COMPANY_PLACEHOLDERS.governingLaw}。`,
            en: `Before launch, complete the legal entity, address, contact email, and governing law placeholders: ${LEGAL_COMPANY_PLACEHOLDERS.legalName} / ${LEGAL_COMPANY_PLACEHOLDERS.address} / ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail} / ${LEGAL_COMPANY_PLACEHOLDERS.governingLaw}.`
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
            zh: "部分功能需付费订阅或购买点数。若你违反本协议、存在欺诈或支付风险、或法律要求我们采取措施，我们可暂停或终止你的访问权限。",
            en: "Some features require a paid subscription or credits. We may suspend or terminate access if you violate these Terms, present fraud or payment risk, or where required by law."
          },
          {
            zh: "终止后，法律允许范围内你对服务的访问将停止；已产生的付款义务、责任限制、争议解决和知识产权条款继续有效。",
            en: "Upon termination, your access may cease to the extent permitted by law; accrued payment obligations, limitations of liability, dispute terms, and intellectual property provisions survive."
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
            zh: "除适用法律不得限制者外，我们不对间接、附带、惩罚性、特殊或后果性损失负责。责任上限建议在上线前由律师按实体和市场补充。",
            en: "Except where prohibited by law, we are not liable for indirect, incidental, punitive, special, or consequential damages. A liability cap should be finalized with counsel before launch based on your entity and markets."
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
            zh: `请在上线前补充争议解决机制、法院或仲裁机构以及适用法。若当地消费者保护法赋予你不可放弃的权利，该等权利优先适用。占位：${LEGAL_COMPANY_PLACEHOLDERS.governingLaw}。`,
            en: `Before launch, add your dispute mechanism, forum, and governing law. Where local consumer protection law gives users non-waivable rights, those rights prevail. Placeholder: ${LEGAL_COMPANY_PLACEHOLDERS.governingLaw}.`
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
    version: "v1.0",
    updatedAt: "2026-03-10",
    summary: {
      zh: "说明收集哪些数据、为何收集、如何使用、保存多久、跨境传输、用户权利和联系渠道。",
      en: "Explains what data is collected, why it is collected, how it is used, retention periods, cross-border transfers, user rights, and contact channels."
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
            zh: "为提供服务，我们可能与云基础设施、支付服务商、分析服务商、邮件服务商和模型供应商共享必要数据。你应在上线前列明主要处理者类别和跨境传输安排。",
            en: "To provide the service, we may share necessary data with cloud infrastructure providers, payment processors, analytics vendors, email vendors, and model providers. Before launch, list major processor categories and cross-border transfer arrangements."
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
            zh: `隐私相关请求请联系 ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail}。若适用法律要求设立数据保护负责人、欧盟代表或英国代表，请在上线前补充。`,
            en: `For privacy requests, contact ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail}. If required by law, add your data protection officer, EU representative, or UK representative before launch.`
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
    version: "v1.0",
    updatedAt: "2026-03-10",
    summary: {
      zh: "说明价格、自动续费、取消时点、点数规则、税费、风控和服务变更。",
      en: "Explains pricing, auto-renewal, cancellation timing, credits rules, taxes, risk controls, and service changes."
    },
    sections: [
      {
        heading: {
          zh: "1. 价格与税费",
          en: "1. Pricing and Taxes"
        },
        body: [
          {
            zh: "价格、计费周期、包含权益和点数数量会在结账前展示。除非另有说明，显示价格不含适用税费、汇率差额、银行费用或平台收取的附加费用。",
            en: "Pricing, billing cycle, included benefits, and credits amounts will be shown before checkout. Unless stated otherwise, displayed prices exclude applicable taxes, exchange-rate differences, bank fees, or platform charges."
          }
        ]
      },
      {
        heading: {
          zh: "2. Pro 订阅",
          en: "2. Pro Subscription"
        },
        body: [
          {
            zh: "Pro 为自动续费订阅，直到你取消为止。除当地法律另有要求外，取消将在当前计费周期结束时生效，不追溯既往已提供的服务。",
            en: "Pro is an auto-renewing subscription until cancelled. Unless local law requires otherwise, cancellation takes effect at the end of the current billing period and does not retroactively undo services already provided."
          },
          {
            zh: "我们会在结账前向你明确展示自动续费、计费周期、价格、如何取消以及退款规则。",
            en: "Before checkout, we will clearly disclose auto-renewal, billing cycle, price, how to cancel, and the refund rules."
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
            zh: "若交易存在欺诈、盗刷、滥用退款、制裁合规、身份异常或系统故障风险，我们可以延迟、限制、撤销或拒绝订单，并在适用法律允许范围内回收相关权益。",
            en: "If a transaction presents fraud, stolen-payment, refund abuse, sanctions, identity anomaly, or system-failure risk, we may delay, limit, reverse, or refuse the order and, where permitted by law, reclaim related benefits."
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
    version: "v1.0",
    updatedAt: "2026-03-10",
    summary: {
      zh: "首购订阅 7 天可退，不再以是否已消耗订阅点数为退款前提；单独充值点数在整包未使用时可退。",
      en: "First-time subscriptions are refundable within 7 days without conditioning the refund on whether subscription credits were used; standalone purchased credits are refundable when the purchased pack remains unused."
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
            zh: "若退款获批，订阅将在退款处理后终止，后续订阅权益可被停止；适用法律要求保留的权利除外。续费订阅、升级差价或企业定制方案是否退款，可在订单页另行说明。",
            en: "If a refund is granted, the subscription will terminate after refund processing and future subscription benefits may stop, except where local law requires otherwise. Refund treatment for renewals, upgrade proration, or enterprise plans may be stated separately on the order page."
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
            zh: `退款申请请发送至 ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail}，并附上账户邮箱、订单号、购买日期和退款原因。建议在正式上线前补充处理时限、原路退回说明以及税费处理规则。`,
            en: `Submit refund requests to ${LEGAL_COMPANY_PLACEHOLDERS.contactEmail} with your account email, order number, purchase date, and reason. Before launch, add processing timelines, original-payment-method handling, and tax treatment details.`
          }
        ]
      }
    ]
  }
};

export function legalText(lang: Lang, text: LocalizedText) {
  return lang === "zh" ? text.zh : text.en;
}
