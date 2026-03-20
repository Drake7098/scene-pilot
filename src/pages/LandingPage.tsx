import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ChevronRight,
  Film,
  Crosshair,
  Layers,
  LayoutTemplate,
  MessagesSquare,
  Orbit,
  ShoppingBag,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";
import { getCurrentUser } from "../services/authService";
import type { UserState } from "../types/account";
import { PUBLIC_CONTACT_CHANNELS } from "../config/contactChannels";
import {
  TEMPLATE_INTENTS,
  getDefaultSubTaskIdForIntent,
  setPendingTemplateIntent,
  setPendingTemplateSubTask,
  type TemplateIntentId
} from "../features/template-workspace/model/templateIntent";

const WORKSPACE_MODE_KEY = "sp_workspace_mode";
const WORKSPACE_ENTRY_GUIDE_KEY = "sp_workspace_entry_guide_done_v1";
const LANDING_LANG_KEY = "sp_landing_lang";

type WorkspaceMode = "results" | "pro";
type LandingLocale = "zh" | "en";

type TaskCard = {
  id: TemplateIntentId;
  icon: keyof typeof ICON_MAP;
  labelZh: string;
  labelEn: string;
  descZh: string;
  descEn: string;
  hintZh?: string;
  hintEn?: string;
  tagsZh: string[];
  tagsEn: string[];
  featured: boolean;
};

type AdvancedTaskCard = {
  id: string;
  icon: keyof typeof ICON_MAP;
  labelZh: string;
  labelEn: string;
  descZh: string;
  descEn: string;
  hintZh?: string;
  hintEn?: string;
  tagsZh: string[];
  tagsEn: string[];
};

function detectLocale(): LandingLocale {
  try {
    const saved = localStorage.getItem(LANDING_LANG_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch { /* ignore */ }
  if (typeof navigator === "undefined") return "en";
  return /^zh(?:-|$)/i.test(navigator.language || "") ? "zh" : "en";
}

function saveLocale(lang: LandingLocale) {
  try { localStorage.setItem(LANDING_LANG_KEY, lang); } catch { /* ignore */ }
}

function routeToSignIn(mode?: WorkspaceMode, intentId?: TemplateIntentId, subTaskId?: string | null) {
  if (mode) {
    try {
      localStorage.removeItem(WORKSPACE_MODE_KEY);
      localStorage.removeItem(WORKSPACE_ENTRY_GUIDE_KEY);
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
      localStorage.setItem(WORKSPACE_ENTRY_GUIDE_KEY, "1");
      if (intentId) setPendingTemplateIntent(intentId);
      setPendingTemplateSubTask(subTaskId ?? null);
    } catch { /* ignore */ }
  }
  window.location.href = "/signin";
}

function buildAppTaskUrl(intentId: TemplateIntentId, subTaskId?: string | null) {
  const url = new URL("/app", window.location.origin);
  url.searchParams.set("template", "1");
  url.searchParams.set("intent", intentId);
  if (subTaskId) url.searchParams.set("subtask", subTaskId);
  return `${url.pathname}${url.search}`;
}

function openTaskIntent(accountUser: UserState | null, intentId: TemplateIntentId, subTaskId?: string | null) {
  setPendingTemplateIntent(intentId);
  setPendingTemplateSubTask(subTaskId ?? null);
  if (accountUser) {
    window.location.href = buildAppTaskUrl(intentId, subTaskId ?? null);
    return;
  }
  routeToSignIn("pro", intentId, subTaskId ?? null);
}

const COPY = {
  zh: {
    intro: "产品介绍",
    pricing: "定价",
    lang: "EN",
    signInUp: "登录",
    account: "账户",
    openWorkspace: "工作台",
    eyebrow: "别再盲猜提示词",
    title: "提示词写了十遍\n结果还是不对",
    subtitle: "提示词越写越长，结果越跑越偏。\nScenePilotix 用分镜结构替代自由文本——\n主体位置、镜头语言、光影情绪，一次说清。",
    tagline: "首次生成成功率提升 3×",
    ctaMain: "免费开始",
    ctaSub: "工作台",
    taskTitle: "直接说你要做什么",
    painTitle: "你一定遇过这些",
    pains: [
      { icon: "↺", text: "改了五遍提示词，主体还是跑偏" },
      { icon: "✂", text: "复制别人的 Prompt，风格完全不对" },
      { icon: "⚡", text: "换了模型又要重新调一遍参数" },
    ],
    solveTitle: "ScenePilotix 怎么解决",
    solves: [
      { icon: "◉", label: "结构化分镜", text: "主体 / 背景 / 构图分层填写，不靠猜" },
      { icon: "◎", label: "结构化模板库", text: "产品 对话 运镜 场景 直接套用" },
      { icon: "⬡", label: "多平台语言导出", text: "同一份场景结构 自动改写成不同平台语言" },
    ],
    terms: "服务协议",
    privacy: "隐私协议",
    contact: "联系我们",
  },
  en: {
    intro: "Product",
    pricing: "Pricing",
    lang: "中文",
    signInUp: "Sign In",
    account: "Account",
    openWorkspace: "Workspace",
    eyebrow: "Stop guessing prompts",
    title: "Wrote the prompt\nten times. Still wrong.",
    subtitle: "The longer your prompt, the further off the result.\nScenePilotix replaces free-text guessing with scene structure —\nsubject position, camera language, mood. Say it once, get it right.",
    tagline: "3× higher first-generation success rate",
    ctaMain: "Start Free",
    ctaSub: "Workspace",
    taskTitle: "Go straight to the job",
    painTitle: "Sound familiar?",
    pains: [
      { icon: "↺", text: "Tweaked the prompt five times. Subject still drifts." },
      { icon: "✂", text: "Copied someone's prompt. Looks nothing like it." },
      { icon: "⚡", text: "Switched models. Back to square one." },
    ],
    solveTitle: "How ScenePilotix fixes it",
    solves: [
      { icon: "◉", label: "Structured scenes", text: "Subject / background / composition — filled, not guessed" },
      { icon: "◎", label: "Structured template library", text: "Product, dialogue, motion, and scene starters ready to use" },
      { icon: "⬡", label: "Platform-aware prompt export", text: "One scene structure rewritten for different platform languages" },
    ],
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
  }
} as const;

const TASK_CARDS: TaskCard[] = [
  {
    id: "sell_product",
    icon: "ShoppingBag",
    labelZh: "卖货出图",
    labelEn: "Sell Products",
    descZh: "白底 场景 卖点 三种图都能出",
    descEn: "Product images that make people want to buy",
    hintZh: "换个背景 商品就能开口说话",
    hintEn: "White background, lifestyle scene, or feature callout",
    tagsZh: ["电商", "品牌", "广告"],
    tagsEn: ["commerce", "brand", "ads"],
    featured: true,
  },
  {
    id: "people_portrait",
    icon: "UserRound",
    labelZh: "人物出图",
    labelEn: "Portrait",
    descZh: "一个人 一张好看的照片",
    descEn: "One person, one photo worth keeping",
    hintZh: "职业形象 个人品牌 创作者封面",
    hintEn: "Professional headshot, personal brand, or creator visual",
    tagsZh: ["写真", "时尚", "职业"],
    tagsEn: ["portrait", "fashion", "headshot"],
    featured: true,
  },
  {
    id: "cover_poster",
    icon: "LayoutTemplate",
    labelZh: "封面海报",
    labelEn: "Cover & Poster",
    descZh: "竖版横版 社媒海报 活动宣传",
    descEn: "Vertical, square, or wide — covers and posters ready to post",
    hintZh: "对的尺寸 对的氛围 直接能用",
    hintEn: "Pick the format, set the mood, done",
    tagsZh: ["封面", "海报", "宣传"],
    tagsEn: ["cover", "poster", "campaign"],
    featured: true,
  },
  {
    id: "talking_video",
    icon: "Video",
    labelZh: "视频口播",
    labelEn: "Talking Video",
    descZh: "出镜讲话之前 先把每个镜头排清楚",
    descEn: "Plan every shot before you step in front of the camera",
    hintZh: "什么位置 什么景别 说到哪里切",
    hintEn: "Position, framing, and cut points — all laid out",
    tagsZh: ["讲解", "测评", "教学"],
    tagsEn: ["explainer", "review", "tutorial"],
    featured: true,
  },
  {
    id: "story_video",
    icon: "Film",
    labelZh: "剧情短视频",
    labelEn: "Short Drama",
    descZh: "从第一个镜头到最后一帧 完整走一遍",
    descEn: "From the first shot to the last frame, every scene planned",
    hintZh: "开场怎么钩人 结尾怎么收",
    hintEn: "Hook them at the start, land the ending",
    tagsZh: ["剧情", "短片", "分镜"],
    tagsEn: ["story", "shortform", "storyboard"],
    featured: true,
  },
  {
    id: "pro_workflows",
    icon: "Layers",
    labelZh: "更多专业任务",
    labelEn: "More Pro Workflows",
    descZh: "多个镜头之间的衔接 调度 风格控制",
    descEn: "Continuity, blocking, and style control across shots",
    hintZh: "给已经知道自己要什么的人用的",
    hintEn: "For people who already know exactly what they need",
    tagsZh: ["专业", "多镜头", "连续"],
    tagsEn: ["pro", "multi-shot", "continuity"],
    featured: false,
  },
];

const ICON_MAP = {
  ShoppingBag,
  UserRound,
  LayoutTemplate,
  Video,
  Film,
  Layers,
  MessagesSquare,
  Crosshair,
  Orbit,
  Sparkles,
};

const ADVANCED_TASK_CARDS: AdvancedTaskCard[] = [
  {
    id: "continuity",
    icon: "Layers",
    labelZh: "连续分镜",
    labelEn: "Continuity",
    descZh: "同一个角色跨多个镜头还是同一个人",
    descEn: "Same character, same world, across every cut",
    hintZh: "空间方向 动作衔接 不让观众出戏",
    hintEn: "Direction, motion, and space that hold together",
    tagsZh: ["连续", "剧情", "一致性"],
    tagsEn: ["continuity", "story", "consistency"],
  },
  {
    id: "dialogue",
    icon: "MessagesSquare",
    labelZh: "多镜对话",
    labelEn: "Multi-shot Dialogue",
    descZh: "两个人说话不止一个机位",
    descEn: "A conversation told through more than one angle",
    hintZh: "正反打 切反应 跟着人物走",
    hintEn: "Cut to the listener, follow the speaker, stay in the scene",
    tagsZh: ["对话", "多人", "跟拍"],
    tagsEn: ["dialogue", "multi-person", "tracking"],
  },
  {
    id: "action",
    icon: "Crosshair",
    labelZh: "动作连续",
    labelEn: "Action Blocking",
    descZh: "打 跑 跳 动作穿越剪辑点还是连贯的",
    descEn: "Punches, runs, and jumps that survive the cut",
    hintZh: "力道 方向 节奏在每个镜头之间不断",
    hintEn: "Force, direction, and rhythm — unbroken across shots",
    tagsZh: ["动作", "连续", "节奏"],
    tagsEn: ["action", "continuity", "rhythm"],
  },
  {
    id: "chase",
    icon: "Orbit",
    labelZh: "追逐调度",
    labelEn: "Chase Blocking",
    descZh: "追的人和被追的人 镜头怎么跟",
    descEn: "How the camera follows the chaser and the chased",
    hintZh: "环绕 俯冲 切近景 紧张感靠顺序堆出来",
    hintEn: "Orbit, dive, cut close — tension built shot by shot",
    tagsZh: ["追逐", "运镜", "调度"],
    tagsEn: ["chase", "camera", "blocking"],
  },
  {
    id: "anime",
    icon: "Sparkles",
    labelZh: "动漫风格",
    labelEn: "Anime / Stylized",
    descZh: "二次元 动漫感 风格化画面",
    descEn: "Anime, stylized frames, and designed visuals",
    hintZh: "赛博朋克 动漫演出 MV感 先搭结构再出图",
    hintEn: "Cyberpunk, anime performance, or MV mood — structure first",
    tagsZh: ["动漫", "风格化", "演出"],
    tagsEn: ["anime", "stylized", "performance"],
  },
];

export default function LandingPage() {
  const [locale, setLocale] = useState<LandingLocale>(() => detectLocale());
  const [accountUser, setAccountUser] = useState<UserState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAdvancedTasks, setShowAdvancedTasks] = useState(false);
  const t = useMemo(() => COPY[locale], [locale]);
  const isZh = locale === "zh";
  const hasIntentRegistry = TEMPLATE_INTENTS.length > 0;

  useEffect(() => {
    let alive = true;
    void getCurrentUser()
      .then((user) => { if (alive) { setAccountUser(user); setAuthLoading(false); } })
      .catch(() => { if (alive) { setAccountUser(null); setAuthLoading(false); } });
    return () => { alive = false; };
  }, []);

  const toggleLang = () => {
    const next = locale === "zh" ? "en" : "zh";
    setLocale(next);
    saveLocale(next);
  };

  const openCurrentGuideEntry = () => {
    if (showAdvancedTasks) {
      openTaskIntent(accountUser, "pro_workflows", "continuity");
      return;
    }
    openTaskIntent(accountUser, "sell_product", null);
  };

  const handleTaskClick = (card: TaskCard) => {
    const defaultSubTaskId = hasIntentRegistry ? getDefaultSubTaskIdForIntent(card.id) : null;
    if (hasIntentRegistry) {
      openTaskIntent(accountUser, card.id, defaultSubTaskId);
      return;
    }
    setPendingTemplateIntent(card.id);
    setPendingTemplateSubTask(defaultSubTaskId);
    if (accountUser) {
      window.location.href = "/app";
      return;
    }
    window.location.href = "/signin";
  };

  const handleAdvancedTaskClick = (card: AdvancedTaskCard) => {
    if (hasIntentRegistry) {
      openTaskIntent(accountUser, "pro_workflows", card.id);
      return;
    }
    setPendingTemplateIntent("pro_workflows");
    setPendingTemplateSubTask(card.id);
    if (accountUser) {
      window.location.href = "/app";
      return;
    }
    window.location.href = "/signin";
  };

  const handleGuideCta = () => {
    openCurrentGuideEntry();
  };

  return (
    <div style={page}>
      <style>{`
        .landing-task-button:hover {
          border-color: #f59e0b !important;
        }
        .landing-task-button:active {
          transform: scale(0.98);
        }
        .landing-task-button--primary:hover {
          background: #ffb11a !important;
        }
        .landing-task-button--advanced:hover {
          background: rgba(245,158,11,0.08) !important;
        }
        .landing-task-button--advanced:hover .landing-task-icon,
        .landing-task-button--advanced:hover .landing-task-arrow {
          color: #f59e0b !important;
        }
        .landing-task-button--primary:hover .landing-task-icon,
        .landing-task-button--primary:hover .landing-task-arrow {
          color: rgba(23,23,23,0.72) !important;
        }
        .landing-cta-secondary:hover {
          border-color: #9ca3af !important;
          color: #e5e7eb !important;
          background: #353a42 !important;
        }
      `}</style>
      <header style={header}>
        <div style={logoWrap}>
          <span style={logoDot} />
          <span style={logoText}>ScenePilotix</span>
          {isZh ? <span style={logoZh}>场景领航</span> : null}
        </div>
        <nav style={topActions}>
          <a href="/product-intro" style={navLink}>{t.intro}</a>
          <a href="/pricing" style={navLink}>{t.pricing}</a>
          <button type="button" style={navBtn} onClick={toggleLang}>{t.lang}</button>
          <div style={divider} />
          {authLoading ? (
            <div style={{ ...userBtnBase, opacity: 0, pointerEvents: "none" as const }}>
              <span style={avatarCircle}><UserRound size={13} /></span>
              {t.signInUp}
            </div>
          ) : accountUser ? (
            <button
              type="button"
              style={userBtnLoggedIn}
              onClick={openCurrentGuideEntry}
              data-testid="landing-user-entry"
            >
              <span style={avatarCircle}>
                {accountUser.avatarUrl
                  ? <img src={accountUser.avatarUrl} alt="" style={avatarImg} />
                  : <UserRound size={13} />}
              </span>
              {t.openWorkspace}
            </button>
          ) : (
            <a href="/signin" style={userBtnSignedOut} data-testid="landing-user-entry">
              {t.signInUp}
            </a>
          )}
        </nav>
      </header>

      <main style={shell}>
        <section style={heroSection}>
          <p style={eyebrow}>{t.eyebrow}</p>
          <h1 style={heroTitle}>{t.title}</h1>
          <p style={heroSubtitle}>
            {isZh
              ? "提示词越长 结果越偏 ScenePilotix 用场景结构替代自由猜测 一次说对 结果更准"
              : "The longer your prompt, the further off the result. ScenePilotix replaces free-text guessing with scene structure."}
          </p>
        </section>

        <section style={taskSection}>
          <div style={taskSectionHead}>
            <p style={sectionLead}>{showAdvancedTasks ? (isZh ? "继续选择更专业的任务" : "Choose a more advanced workflow") : t.taskTitle}</p>
            {showAdvancedTasks ? (
              <button type="button" style={backToPrimaryBtn} onClick={() => setShowAdvancedTasks(false)}>
                {isZh ? "返回常用任务" : "Back to Main Tasks"}
              </button>
            ) : null}
          </div>
          <div style={taskGrid}>
            {(showAdvancedTasks ? ADVANCED_TASK_CARDS : TASK_CARDS).map((card) => {
              const Icon = ICON_MAP[card.icon];
              const isAdvancedRoot = !("featured" in card) ? false : !card.featured;
              const label = isZh ? card.labelZh : card.labelEn;
              const desc = isZh ? card.descZh : card.descEn;
              const hint = isZh ? card.hintZh : card.hintEn;
              return (
                <div key={`${showAdvancedTasks ? "advanced" : "primary"}-${card.id}`} style={taskCardWrap}>
                  <button
                    type="button"
                    className={`landing-task-button ${isAdvancedRoot ? "landing-task-button--advanced" : "landing-task-button--primary"}`}
                    onClick={() => {
                      if (showAdvancedTasks) {
                        handleAdvancedTaskClick(card as AdvancedTaskCard);
                        return;
                      }
                      if ((card as TaskCard).id === "pro_workflows") {
                        setShowAdvancedTasks(true);
                        return;
                      }
                      handleTaskClick(card as TaskCard);
                    }}
                    style={{
                      ...taskButton,
                      ...(isAdvancedRoot ? { width: 280 } : null),
                      ...(isAdvancedRoot ? advancedTaskButton : null),
                    }}
                  >
                    <span style={taskButtonContent}>
                      <Icon
                        className="landing-task-icon"
                        size={18}
                        color={isAdvancedRoot ? C.textMuted : "#171717"}
                      />
                      <span style={taskButtonLabel}>{label}</span>
                    </span>
                    <ChevronRight
                      className="landing-task-arrow"
                      size={14}
                      color={isAdvancedRoot ? C.border : "rgba(23,23,23,0.72)"}
                    />
                  </button>
                  <div style={{ ...taskDescBlock, ...(isAdvancedRoot ? { width: 280 } : null) }}>
                    <div style={taskDescLine}>{desc}</div>
                    {hint ? <div style={taskDescLine}>{hint}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={secondaryActionWrap}>
            <button
              type="button"
              className="landing-cta-secondary"
              style={secondaryCta}
              onClick={handleGuideCta}
              data-testid="landing-start-workspace"
            >
              {t.ctaMain}
            </button>
          </div>
        </section>

        <section style={sectionWrap}>
          <p style={sectionLabel}>{t.painTitle}</p>
          <div style={painGrid}>
            {t.pains.map((p, i) => (
              <div key={i} style={painCard}>
                <span style={painIcon}>{p.icon}</span>
                <span style={painText}>{p.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={solveSectionWrap}>
          <p style={sectionLabel}>{t.solveTitle}</p>
          <div style={solveGrid}>
            {t.solves.map((s, i) => (
              <div key={i} style={solveCard}>
                <div style={solveIcon}>{s.icon}</div>
                <div style={solveLabel}>{s.label}</div>
                <div style={solveText}>{s.text}</div>
              </div>
            ))}
          </div>
        </section>

        <footer style={footerWrap}>
          <a href="/terms" style={footerLink}>{t.terms}</a>
          <a href="/privacy" style={footerLink}>{t.privacy}</a>
          <a href={`mailto:${PUBLIC_CONTACT_CHANNELS.business}`} style={footerLink}>{t.contact}</a>
        </footer>
      </main>
    </div>
  );
}

const C = {
  bg: "#1f2125",
  panel: "#24262b",
  border: "#3a3f46",
  hover: "#343942",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  accent: "#f59e0b",
};

const page: CSSProperties = {
  minHeight: "100%",
  background: C.bg,
  color: C.text,
  overflowX: "hidden",
};

const header: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 100,
  height: 52,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "0 24px",
  background: C.panel,
  borderBottom: `1px solid ${C.border}`,
};

const logoWrap: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const logoDot: CSSProperties = { width: 8, height: 8, borderRadius: "50%", background: C.accent, flexShrink: 0 };
const logoText: CSSProperties = { fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" };
const logoZh: CSSProperties = { fontSize: 12, color: C.textMuted, fontWeight: 500 };

const topActions: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const navLink: CSSProperties = { color: C.textMuted, textDecoration: "none", fontSize: 13, fontWeight: 500, padding: "0 6px" };
const navBtn: CSSProperties = { border: "none", background: "transparent", color: C.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", padding: "0 6px" };
const divider: CSSProperties = { width: 1, height: 16, background: C.border };
const userBtnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 8,
  minHeight: 32,
  padding: "0 12px",
  fontSize: 13,
  fontWeight: 600,
  color: C.text,
  textDecoration: "none",
};
const userBtnSignedOut: CSSProperties = {
  ...userBtnBase,
  border: `1px solid ${C.border}`,
  background: "transparent",
};
const userBtnLoggedIn: CSSProperties = {
  ...userBtnBase,
  border: "1px solid rgba(245,158,11,0.3)",
  background: "rgba(245,158,11,0.12)",
  cursor: "pointer",
};
const avatarCircle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: C.hover,
  color: C.text,
  flexShrink: 0,
};
const avatarImg: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" };

const shell: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "0 24px 80px",
};

const heroSection: CSSProperties = {
  paddingTop: 56,
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
};
const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: C.accent,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};
const heroTitle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(28px, 4vw, 46px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  maxWidth: 760,
  textWrap: "balance",
};
const heroSubtitle: CSSProperties = {
  margin: 0,
  maxWidth: 680,
  fontSize: "clamp(14px, 1.6vw, 16px)",
  lineHeight: 1.65,
  color: C.textMuted,
};

const taskSection: CSSProperties = {
  marginTop: 40,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};
const taskSectionHead: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  width: "100%",
  maxWidth: 920,
  margin: "0 auto",
};
const sectionLead: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: C.textMuted,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "left",
  paddingLeft: "calc((100% - 688px) / 6)",
};
const backToPrimaryBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  color: C.textMuted,
  fontSize: 12,
  fontWeight: 600,
  padding: 0,
  cursor: "pointer",
};
const taskGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  width: "100%",
  maxWidth: 920,
  margin: "0 auto",
};
const taskCardWrap: CSSProperties = {
  minHeight: 96,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
};
const taskButton: CSSProperties = {
  minHeight: 50,
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  background: C.accent,
  padding: "0 18px",
  cursor: "pointer",
  transition: "border-color 150ms, background 150ms, transform 150ms, color 150ms",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  color: "#171717",
  textAlign: "left",
  alignSelf: "center",
  width: 220,
  maxWidth: "100%",
};
const advancedTaskButton: CSSProperties = {
  background: "#2a2d32",
  color: "#c7ccd4",
  borderStyle: "dashed",
  borderColor: "#4b515b",
};
const taskButtonContent: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};
const taskButtonLabel: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};
const taskDescBlock: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 0,
  width: 220,
  maxWidth: "100%",
  alignSelf: "center",
  textAlign: "left",
};
const taskDescLine: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: C.textMuted,
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const secondaryActionWrap: CSSProperties = {
  marginTop: 24,
  display: "flex",
  justifyContent: "center",
};
const secondaryCta: CSSProperties = {
  height: 40,
  padding: "0 20px",
  borderRadius: 10,
  border: "1px solid #4b515b",
  background: "#2e333b",
  color: "#c8ced8",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "border-color 150ms, color 150ms, background 150ms",
};

const sectionWrap: CSSProperties = {
  marginTop: 80,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};
const solveSectionWrap: CSSProperties = {
  marginTop: 64,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};
const sectionLabel: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  color: C.textMuted,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "center",
};
const painGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
};
const painCard: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: "16px 18px",
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
};
const painIcon: CSSProperties = {
  width: 18,
  flexShrink: 0,
  color: C.textMuted,
  fontSize: 18,
  lineHeight: 1,
  marginTop: 1,
  textAlign: "center",
};
const painText: CSSProperties = {
  fontSize: 14,
  color: C.text,
  lineHeight: 1.55,
};

const solveGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
};
const solveCard: CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: 22,
};
const solveIcon: CSSProperties = {
  fontSize: 22,
  color: C.accent,
  marginBottom: 12,
  lineHeight: 1,
};
const solveLabel: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: C.text,
  marginBottom: 6,
};
const solveText: CSSProperties = {
  fontSize: 13,
  color: C.textMuted,
  lineHeight: 1.6,
};

const footerWrap: CSSProperties = {
  marginTop: 80,
  paddingTop: 24,
  borderTop: `1px solid ${C.border}`,
  display: "flex",
  justifyContent: "center",
  gap: 24,
};
const footerLink: CSSProperties = {
  color: C.textMuted,
  textDecoration: "none",
  fontSize: 12,
};
