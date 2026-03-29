/**
 * Template detail panel - compact decision summary plus reusable fields.
 */

import React from "react";
import { KeyRound, Star } from "lucide-react";
import { PRO_TYPO } from "../../../uiTokens";
import { editorTheme } from "../../../theme/editorTheme";
import type { Lang } from "../../../i18n";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { isUserPrivateTemplate } from "./TemplateCard";
import type { ApplyTemplateMode } from "../model/templateFilter";
import { formatPricingBucketForDisplay } from "../../../pricing";
import { useTemplatePricing } from "../hooks/useTemplatePricing";
import { loadTemplatePayloadById } from "../../../template-engine/payload/templateLoader";
import { getProFieldLabelsFromPayload } from "../../../utils/proFieldsResolver";
import type { ProFieldLabel } from "../../../utils/proFieldsResolver";
import { copyTemplateLink, shareTemplateLink } from "../utils/templateShare";

const { colors } = editorTheme;
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function buildDecisionSummary(template: TemplateIndex, lang: Lang) {
  const zh = lang === "zh";
  const family = zh ? template.familyNameZh : template.familyNameEn;
  const media = template.mediaType === "image"
    ? (zh ? "图片宣传图" : "Image key visual")
    : (zh ? "视频关键帧" : "Video key frame");

  const replaceWhat = (() => {
    switch (template.familyId) {
      case "v3_product_hero":
      case "v3_product_lifestyle":
      case "v3_pro_ad_visual":
        return zh ? "替换产品主体、品牌材质与参考图即可复用。" : "Replace the hero product, branded materials, and references.";
      case "v3_portrait_cinematic":
      case "v3_portrait_lifestyle":
      case "v3_portrait_video":
        return zh ? "替换人物、服装和参考图，保留构图与光线逻辑。" : "Replace the person, wardrobe, and references while keeping framing and lighting.";
      case "v3_story_drama":
      case "v3_pro_film_blocking":
        return zh ? "替换角色身份、冲突关系和场景元素，直接保留戏剧调度。" : "Replace role identities, conflict relationship, and scene cues while preserving dramatic blocking.";
      case "v3_pro_game_skill":
      case "v3_pro_game_entrance":
      case "v3_pro_game_squad":
        return zh ? "替换角色设定、技能风格和装备信息，阵营结构可直接复用。" : "Replace character fantasy, skill language, and gear while reusing the lineup structure.";
      case "v3_pro_animation_anime":
      case "v3_pro_animation_cg":
      case "v3_pro_animation_epic":
        return zh ? "替换主角色、世界观符号和武器特征，保留镜头张力与风格层次。" : "Replace the lead character, world symbols, and weapon traits while keeping the camera tension and style layers.";
      case "v3_pro_style_fusion":
      case "v3_pro_style_surreal":
      case "v3_pro_style_future":
        return zh ? "替换主体和材质方向，继续沿用现成的风格碰撞结构。" : "Replace the subject and material direction while reusing the established style-collision structure.";
      default:
        return zh ? "替换主体与关键对象，保留结构、光线和结果方向。" : "Replace the hero subject and key objects while keeping structure, lighting, and result intent.";
    }
  })();

  const outcome = (() => {
    if (template.familyId.startsWith("v3_product")) {
      return zh ? "你会得到一张能直接做电商、品牌投放或详情页头图的商业主视觉。" : "You get a commercial key visual ready for ecommerce, brand ads, or PDP hero usage.";
    }
    if (template.familyId.startsWith("v3_portrait")) {
      return zh ? "你会得到一张可信、可传播、适合个人品牌或宣传页的人物主视觉。" : "You get a trustworthy, shareable character visual suitable for personal branding and promo pages.";
    }
    if (template.familyId.startsWith("v3_poster")) {
      return zh ? "你会得到一张封面感很强、标题区明确、适合传播的主封面画面。" : "You get a bold cover visual with strong title space and high shareability.";
    }
    if (template.familyId.startsWith("v3_story") || template.familyId.startsWith("v3_pro_film")) {
      return zh ? "你会得到一张剧情感、关系感和镜头秩序都成立的宣传定帧。" : "You get a promotional keyframe with real narrative tension, relationships, and camera order.";
    }
    if (template.familyId.startsWith("v3_pro_game")) {
      return zh ? "你会得到一张适合版本宣传、角色投放或阵营展示的游戏主视觉。" : "You get a game-ready key visual suited for character launches, version art, or faction promos.";
    }
    if (template.familyId.startsWith("v3_pro_animation")) {
      return zh ? "你会得到一张风格纯度高、角色清晰、适合海报与传播的动画视觉。" : "You get a high-purity animation visual with clear character readability for posters and campaigns.";
    }
    if (template.familyId.startsWith("v3_pro_style")) {
      return zh ? "你会得到一张具备实验感但结构稳定、适合品牌创意测试的视觉稿。" : "You get a style-forward yet structurally stable visual fit for brand experimentation.";
    }
    return zh ? "你会得到一张结果明确、结构完整、可直接拿去生成宣传图的模板画面。" : "You get a clear-result, fully structured visual template ready for promo generation.";
  })();

  const valueReason = (() => {
    const paid = !template.isFree;
    const base = paid
      ? (zh ? "这条是高复杂度付费模板：对象更多、细节更细、结果更接近可投放的宣传图。" : "This is a high-complexity paid template with more objects, richer detail, and stronger promo-ready output.")
      : (zh ? "这条是精选免费模板：结构已经拉满，适合先验证结果方向。" : "This is a curated free template with strong structure, ideal for validating the result direction.");
    return `${family} · ${media} · ${base}`;
  })();

  const fit = (() => {
    const tags = template.tags ?? [];
    if (tags.includes("ecommerce") || template.familyId.startsWith("v3_product")) {
      return zh ? "适合商品主图、电商详情页、品牌宣传图。" : "Best for product heroes, ecommerce pages, and brand visuals.";
    }
    if (template.familyId.startsWith("v3_portrait")) {
      return zh ? "适合人物包装、达人封面、职业形象和品牌人物图。" : "Best for character branding, creator covers, professional portraits, and brand talent visuals.";
    }
    if (template.familyId.startsWith("v3_poster")) {
      return zh ? "适合封面、海报、活动主图和栏目视觉。" : "Best for covers, posters, campaign visuals, and editorial features.";
    }
    if (template.familyId.startsWith("v3_story") || template.familyId.startsWith("v3_pro_film")) {
      return zh ? "适合剧情短片宣传图、片段封面和影视氛围样张。" : "Best for drama promos, scene covers, and cinematic mood frames.";
    }
    if (template.familyId.startsWith("v3_pro_game")) {
      return zh ? "适合角色发布、技能海报、阵营 KV 和版本宣传。" : "Best for character launches, skill posters, faction key art, and version campaigns.";
    }
    if (template.familyId.startsWith("v3_pro_animation")) {
      return zh ? "适合动画海报、角色宣传和风格化故事画面。" : "Best for animation posters, character promos, and stylized story frames.";
    }
    return zh ? "适合创意测试、品牌视觉探索和风格化宣传图。" : "Best for creative tests, brand exploration, and stylized promo visuals.";
  })();

  return { fit, replaceWhat, outcome, valueReason };
}

function isTemplateNewFlag(template: TemplateIndex): boolean {
  if (template.isNewTemplate === true) return true;
  const until = Number(template.newUntil ?? 0);
  if (Number.isFinite(until) && until > Date.now()) return true;
  const tail = template.id.match(/(\d{10,13})$/)?.[1];
  if (!tail) return false;
  const ts = Number(tail.length === 10 ? `${tail}000` : tail);
  return Number.isFinite(ts) && Date.now() - ts <= NEW_WINDOW_MS;
}

type Props = {
  lang: Lang;
  template: TemplateIndex | UserPrivateTemplate | null;
  applyMode: ApplyTemplateMode;
  onApplyModeChange: (m: ApplyTemplateMode) => void;
  onUse: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (templateId: string) => void;
  project?: import("../../../model").Project | null;
  userCredits?: number;
  isTemplateOwned?: (templateId: string) => boolean;
  relatedTemplates?: TemplateIndex[];
};

export function TemplateWorkspaceDetail({
  lang,
  template,
  applyMode: _applyMode,
  onApplyModeChange: _onApplyModeChange,
  onUse,
  isFavorite = false,
  onToggleFavorite,
  project: _project = null,
  userCredits = 0,
  isTemplateOwned,
  relatedTemplates = []
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const blurButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    window.requestAnimationFrame(() => {
      event.currentTarget.blur();
    });
  };
  const preventMouseFocus = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const [proLabels, setProLabels] = React.useState<ProFieldLabel[]>([]);
  const [linkHint, setLinkHint] = React.useState("");

  React.useEffect(() => {
    if (!template || isUserPrivateTemplate(template)) {
      setProLabels([]);
      return;
    }
    let cancelled = false;
    loadTemplatePayloadById(template.id).then((payload) => {
      if (cancelled || !payload) {
        setProLabels([]);
        return;
      }
      setProLabels(getProFieldLabelsFromPayload(payload, lang));
    });
    return () => {
      cancelled = true;
    };
  }, [(template as { id?: string } | null)?.id, lang]);

  const isPrivate = template ? isUserPrivateTemplate(template) : false;
  const { pricing, loading } = useTemplatePricing(
    template && !isPrivate ? (template as TemplateIndex).id : null
  );

  if (!template) {
    return (
      <div className="pro-rail-scroll" style={styles.wrap}>
        <div style={styles.empty}>{t("选择模板查看详情", "Select a template to view details")}</div>
      </div>
    );
  }

  const name = isPrivate
    ? (template as UserPrivateTemplate).name
    : (lang === "zh" ? (template as TemplateIndex).nameZh : (template as TemplateIndex).nameEn);
  const desc = isPrivate
    ? ""
    : (lang === "zh"
        ? ((template as TemplateIndex).descriptionZh ?? (template as TemplateIndex).descriptionEn)
        : (template as TemplateIndex).descriptionEn);
  const owned = isPrivate || (isTemplateOwned?.(template.id) ?? false);
  const priceLabel = (() => {
    if (isPrivate) return t("已拥有", "Owned");
    if ((template as TemplateIndex).isFree) return t("免费", "Free");
    const cost = (template as TemplateIndex).cost ?? 0;
    if (cost > 0) return `${cost} ${t("积分", "credits")}`;
    if (pricing) return formatPricingBucketForDisplay(pricing.pricingBucket, lang);
    return t("免费", "Free");
  })();
  const capabilityTags = pricing?.capabilityTags?.slice(0, 4) ?? [];

  if (isPrivate) {
    return (
      <div className="pro-rail-scroll" style={styles.wrap}>
        <div style={styles.section}>
          <div style={styles.titleRow}>
            <h3 style={styles.title}>{name}</h3>
          </div>
          <div style={styles.metaChips}>
            <span style={styles.metaChip}>{t("我创建的", "Created by me")}</span>
            <span style={styles.metaChip}>{t("直接复用", "Reusable")}</span>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLine}>
              <span style={styles.summaryLabel}>{t("套用结果", "Result")}</span>
              <span style={styles.summaryValue}>{t("创建新项目", "Creates new project")}</span>
            </div>
            <div style={styles.summaryHint}>
              {t("保留原模板不变，套用后直接进入可编辑工作台。", "Keeps the original template intact and opens the editable workspace directly.")}
            </div>
          </div>
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.useBtn} onClick={onUse} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {t("使用模板", "Use Template")}
          </button>
        </div>
      </div>
    );
  }

  const marketTemplate = template as TemplateIndex;
  const mediaLabel = marketTemplate.mediaType === "image" ? t("图片", "Image") : t("视频", "Video");
  const isNew = isTemplateNewFlag(marketTemplate);
  const templateCost = (marketTemplate as TemplateIndex).cost ?? (pricing?.creditPrice ?? 0);
  const insufficient =
    !owned &&
    !marketTemplate.isFree &&
    templateCost > 0 &&
    userCredits < templateCost;

  const onCopyLink = async () => {
    const ok = await copyTemplateLink(marketTemplate);
    setLinkHint(ok ? t("链接已复制", "Link copied") : t("复制失败，请重试", "Copy failed, please retry"));
  };
  const onShareTemplate = async () => {
    const mode = await shareTemplateLink(marketTemplate, lang);
    if (mode === "shared") setLinkHint(t("已打开系统分享", "System share opened"));
    else if (mode === "copied") setLinkHint(t("链接已复制", "Link copied"));
    else setLinkHint(t("分享失败，请重试", "Share failed, please retry"));
  };
  const summary = buildDecisionSummary(marketTemplate, lang);

  return (
    <div className="pro-rail-scroll" style={styles.wrap}>
      <div style={styles.section}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>{name}</h3>
          {isNew ? <span style={styles.newBadge}>NEW</span> : null}
          {onToggleFavorite ? (
            <button
              type="button"
              style={{ ...styles.favBtn, ...(isFavorite ? styles.favBtnOn : {}) }}
              onClick={() => onToggleFavorite(template.id)}
              onMouseDown={preventMouseFocus}
              onMouseUp={blurButton}
              title={isFavorite ? t("取消收藏", "Unfavorite") : t("收藏", "Favorite")}
            >
              <Star
                size={16}
                fill={isFavorite ? colors.accent : "transparent"}
                stroke={isFavorite ? colors.accent : colors.textMuted}
              />
            </button>
          ) : null}
        </div>
        <div style={styles.heroSummary}>{summary.fit}</div>
      </div>

      {proLabels.length > 0 ? (
        <div style={styles.proCard}>
          <div style={styles.proCardHeader}>
            <span style={styles.proCardTitle}>
              <KeyRound size={13} style={styles.proCardKeyIcon} />
              {t("Pro 专享隐藏控制", "Pro Hidden Controls")}
            </span>
          </div>
          <div style={styles.proCardHint}>
            {t(
              "这组是 Pro 专享隐藏控制词，默认折叠显示，可在工作台继续微调。",
              "These are Pro hidden control phrases. They stay collapsed by default and can be fine-tuned in the workspace."
            )}
          </div>
          <div style={styles.proTagWrap}>
            {proLabels.map((label) => (
              <span key={label.key} style={styles.proTag}>
                {lang === "zh" ? label.labelZh : label.labelEn}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.valueSection}>
        <div style={styles.blockTitle}>{t("模板简介", "Template Intro")}</div>
        {desc ? <div style={styles.desc}>{desc}</div> : null}
        <div style={styles.metaChips}>
          <span style={styles.metaChip}>{lang === "zh" ? marketTemplate.familyNameZh : marketTemplate.familyNameEn}</span>
          <span style={styles.metaChip}>{mediaLabel}</span>
          {marketTemplate.ratio && <span style={styles.metaChip}>{marketTemplate.ratio}</span>}
        </div>
        {(marketTemplate.tags ?? []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            {(marketTemplate.tags ?? []).slice(0, 6).map((tag: string) => (
              <span key={tag} style={{
                fontSize: 10, padding: "0", borderRadius: editorTheme.radius.input,
                background: "transparent",
                border: "none",
                color: "#9ca3af",
              }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.blockTitle}>{t("为什么值得用", "Why It Matters")}</div>
        <div style={styles.decisionList}>
          <div style={styles.decisionItem}>
            <div style={styles.decisionLabel}>{t("适合什么", "Best for")}</div>
            <div style={styles.decisionValue}>{summary.fit}</div>
          </div>
          <div style={styles.decisionItem}>
            <div style={styles.decisionLabel}>{t("你需要替换", "Replace")}</div>
            <div style={styles.decisionValue}>{summary.replaceWhat}</div>
          </div>
          <div style={styles.decisionItem}>
            <div style={styles.decisionLabel}>{t("你会得到", "You Get")}</div>
            <div style={styles.decisionValue}>{summary.outcome}</div>
          </div>
          <div style={styles.decisionItem}>
            <div style={styles.decisionLabel}>{t("适用价值", "Value")}</div>
            <div style={styles.decisionValue}>{summary.valueReason}</div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <div style={styles.priceRow}>
          {insufficient ? (
            <span style={styles.insufficientHint}>
              {t("需要", "Need")} {templateCost} {t("积分", "credits")}
            </span>
          ) : (
            <span style={styles.priceLabel}>
              {owned || marketTemplate.isFree ? t("免费使用", "Free") : priceLabel}
            </span>
          )}
        </div>
        <button type="button" style={styles.useBtn} onClick={onUse} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
          {owned || marketTemplate.isFree
            ? t("使用模板", "Use Template")
            : (marketTemplate.cost ?? 0) > 0
              ? t("购买并使用", "Buy & Use")
              : t("使用模板", "Use Template")}
        </button>
        <div style={styles.secondaryActions}>
          <button type="button" style={styles.secondaryBtn} onClick={onShareTemplate} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {t("转发模板", "Share Template")}
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={onCopyLink} onMouseDown={preventMouseFocus} onMouseUp={blurButton}>
            {t("复制链接", "Copy Link")}
          </button>
        </div>
        {linkHint ? <div style={styles.shareHint}>{linkHint}</div> : null}
      </div>

      {capabilityTags.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("适用场景", "Best for")}</div>
          <div style={styles.tags}>
            {capabilityTags.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {relatedTemplates.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.blockTitle}>{t("同系列延展", "Related Variants")}</div>
          <div style={styles.relatedList}>
            {relatedTemplates.slice(0, 4).map((item) => (
              <div key={item.id} style={styles.relatedItem}>
                {lang === "zh" ? item.nameZh : item.nameEn}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: editorTheme.sizing.railWidth,
    flexShrink: 0,
    padding: editorTheme.spacing.panelPadding,
    background: colors.panel,
    borderLeft: `1px solid ${colors.border}`,
    overflowY: "auto"
  },
  empty: {
    color: colors.textMuted,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    textAlign: "center",
    padding: 24
  },
  section: {
    marginBottom: 16
  },
  valueSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottom: `1px solid ${colors.border}`,
  },
  titleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8
  },
  title: {
    flex: 1,
    fontSize: PRO_TYPO.sm,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.text,
    margin: 0
  },
  heroSummary: {
    fontSize: PRO_TYPO.xs,
    lineHeight: 1.55,
    color: colors.text,
    marginTop: 2,
  },
  favBtn: {
    padding: 4,
    background: "transparent",
    border: "none",
    borderRadius: 6,
    color: colors.textMuted,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent"
  },
  favBtnOn: {
    color: colors.accent
  },
  metaChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 22,
    padding: "0 8px",
    borderRadius: editorTheme.radius.input,
    background: "transparent",
    border: "none",
    color: colors.textMuted,
    fontSize: PRO_TYPO["3xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily
  },
  desc: {
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.text,
    lineHeight: 1.45,
    marginBottom: 8
  },
  decisionList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  decisionItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  decisionLabel: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.accent,
  },
  decisionValue: {
    fontSize: PRO_TYPO.xs,
    lineHeight: 1.5,
    color: colors.textMuted,
    fontFamily: PRO_TYPO.fontFamily,
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 14px",
    borderRadius: editorTheme.radius.panel,
    background: colors.bg,
    border: `1px solid ${colors.border}`
  },
  summaryLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily
  },
  summaryValue: {
    color: colors.text,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    textAlign: "right"
  },
  summaryHint: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    lineHeight: 1.45
  },
  blockTitle: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted,
    marginBottom: 6
  },
  insufficientHint: {
    fontSize: PRO_TYPO["2xs"],
    color: colors.accent
  },
  proCard: {
    margin: "0 0 12px",
    borderRadius: editorTheme.radius.panel,
    border: "none",
    background: "transparent",
    padding: "0"
  },
  proCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8
  },
  proCardTitle: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    color: colors.accent
  },
  proCardKeyIcon: {
    color: colors.accent,
    flexShrink: 0
  },
  proCardHint: {
    fontSize: PRO_TYPO["2xs"],
    lineHeight: 1.45,
    color: colors.textMuted,
    marginBottom: 8
  },
  proTagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5
  },
  proTag: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    background: "transparent",
    border: "none",
    borderRadius: editorTheme.radius.input,
    padding: "0"
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  tag: {
    padding: "0",
    background: "transparent",
    borderRadius: editorTheme.radius.input,
    border: "none",
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightRegular,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.textMuted
  },
  relatedList: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  relatedItem: {
    fontSize: PRO_TYPO["2xs"],
    color: colors.text,
    fontFamily: PRO_TYPO.fontFamily
  },
  actions: {
    marginTop: 12,
    paddingTop: 14,
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 0
  },
  priceLabel: {
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    color: colors.accent
  },
  useBtn: {
    width: "100%",
    minHeight: 42,
    padding: "0 14px",
    background: colors.accent,
    border: "none",
    borderRadius: editorTheme.radius.input,
    color: colors.bg,
    fontSize: PRO_TYPO.xs,
    fontWeight: PRO_TYPO.weightMedium,
    fontFamily: PRO_TYPO.fontFamily,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent"
  },
  secondaryActions: {
    display: "flex",
    gap: 8,
  },
  secondaryBtn: {
    width: "100%",
    minHeight: 32,
    padding: "0 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: editorTheme.radius.input,
    background: colors.bg,
    color: colors.text,
    fontSize: PRO_TYPO["2xs"],
    fontWeight: PRO_TYPO.weightMedium,
    cursor: "pointer",
    appearance: "none",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
  newBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 18,
    padding: "0 7px",
    borderRadius: 4,
    background: "rgba(245,158,11,0.12)",
    color: colors.accent,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  shareHint: {
    marginTop: 6,
    fontSize: PRO_TYPO["2xs"],
    color: colors.accent,
  },
};
