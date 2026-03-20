import { Film, Layers, LayoutTemplate, ShoppingBag, UserRound, Video, type LucideIcon } from "lucide-react";
import type { TemplateIntentId, TemplateIntentMeta } from "../model/templateIntent";

export const INTENT_ICONS: Record<TemplateIntentId, LucideIcon> = {
  sell_product: ShoppingBag,
  people_portrait: UserRound,
  cover_poster: LayoutTemplate,
  talking_video: Video,
  story_video: Film,
  pro_workflows: Layers
};

export const INTENT_CONFIG: TemplateIntentMeta[] = [
  {
    id: "sell_product",
    labelZh: "卖货出图",
    labelEn: "Sell Products",
    descriptionZh: "商品主图、卖点图、白底图",
    descriptionEn: "Product shots, feature images, white background",
    featured: true,
    tagsZh: ["电商", "品牌", "广告"],
    tagsEn: ["Ecommerce", "Brand", "Ads"],
    subTasks: [
      {
        id: "white_bg",
        labelZh: "白底商品",
        labelEn: "White Background",
        descriptionZh: "白底、电商、包装展示",
        descriptionEn: "White background, ecommerce, packaging",
        sceneHintsZh: ["护肤品 / 食品 / 3C 白底棚拍", "直接上传电商平台的主图", "包装正面 + 细节展示"],
        sceneHintsEn: ["Skincare / food / gadget white-bg shot", "Ready-to-upload ecommerce hero", "Packaging front + detail"],
        familyIds: ["white_bg_product", "product_minimal_flat", "product_packaging"],
        freeFirst: 3
      },
      {
        id: "hero_shot",
        labelZh: "产品主图",
        labelEn: "Product Hero",
        descriptionZh: "主视觉、居中展示、高级感",
        descriptionEn: "Hero visual, centered premium shot",
        sceneHintsZh: ["高端感品牌主视觉", "居中悬浮 + 光影衬托", "首图用、Banner 用"],
        sceneHintsEn: ["Premium brand hero shot", "Centered float with mood lighting", "For homepage or banner use"],
        familyIds: ["product_hero", "product_center_display", "floating_product_showcase"],
        freeFirst: 2
      },
      {
        id: "feature",
        labelZh: "卖点拆解",
        labelEn: "Feature Breakdown",
        descriptionZh: "功能拆解、卖点标签、组合展示",
        descriptionEn: "Features, tags, grouped selling points",
        sceneHintsZh: ["多个卖点同框标注", "功能图 + 文字标签组合", "详情页中段分区展示"],
        sceneHintsEn: ["Multiple features in one frame", "Feature callout with text labels", "Mid-page detail section"],
        familyIds: ["feature_breakdown", "selling_point_ad", "product_group_shot"],
        freeFirst: 2
      },
      {
        id: "in_use",
        labelZh: "使用场景",
        labelEn: "In Use",
        descriptionZh: "上手展示、生活场景、实际使用",
        descriptionEn: "Lifestyle scene, actual use, in-hand",
        sceneHintsZh: ["真人手持 / 使用中的产品", "生活化场景里的自然摆放", "展示产品大小感和质感"],
        sceneHintsEn: ["Product held or in active use", "Natural placement in lifestyle scene", "Shows scale and texture in context"],
        familyIds: ["product_in_hand", "product_lifestyle", "product_hand_use"],
        freeFirst: 2
      },
      {
        id: "compare",
        labelZh: "对比展示",
        labelEn: "Compare",
        descriptionZh: "材质对比、左右对照、差异呈现",
        descriptionEn: "Texture compare, side-by-side difference",
        sceneHintsZh: ["新旧 / 使用前后对比", "两款产品并排比较", "材质 / 颜色差异特写"],
        sceneHintsEn: ["Before / after or old vs new", "Two variants side by side", "Texture or color closeup diff"],
        familyIds: ["product_compare", "product_texture_closeup"],
        freeFirst: 1
      },
      {
        id: "ad_cover",
        labelZh: "广告封面",
        labelEn: "Ad Cover",
        descriptionZh: "品牌封面、广告图、投放素材",
        descriptionEn: "Brand cover, ad visual, promo creative",
        sceneHintsZh: ["信息流广告首图", "大促 / 节日促销图", "品牌感强的视觉封面"],
        sceneHintsEn: ["Feed ad hero image", "Sale event or holiday promo", "Brand-forward visual cover"],
        familyIds: ["brand_promo_cover", "cta_landing_layout", "food_beverage_ad", "cosmetics_display", "jewelry_showcase", "food_ad"],
        freeFirst: 2
      }
    ]
  },
  {
    id: "people_portrait",
    labelZh: "人物出图",
    labelEn: "Portrait",
    descriptionZh: "写真、头像、人像摄影",
    descriptionEn: "Portraits, headshots, personal visuals",
    featured: true,
    tagsZh: ["写真", "时尚", "职业"],
    tagsEn: ["Portrait", "Fashion", "Professional"],
    subTasks: [
      {
        id: "natural",
        labelZh: "自然光写真",
        labelEn: "Natural Light",
        descriptionZh: "自然光、生活感、轻松写实",
        descriptionEn: "Natural light, relaxed realism",
        sceneHintsZh: ["窗边自然光、生活化穿搭", "户外公园 / 街头随拍感", "轻松状态、不刻意摆拍"],
        sceneHintsEn: ["Window light, casual outfit", "Outdoor park or street candid feel", "Relaxed, not overly posed"],
        familyIds: ["portrait_natural_light", "lifestyle_casual", "lifestyle_scene"],
        freeFirst: 2
      },
      {
        id: "fashion",
        labelZh: "时尚写真",
        labelEn: "Fashion Portrait",
        descriptionZh: "时尚感、街头感、精致妆面",
        descriptionEn: "Fashion, street, beauty detail",
        sceneHintsZh: ["杂志感构图 + 精致造型", "街头穿搭 + 强烈光影", "美妆 / 精致妆面特写"],
        sceneHintsEn: ["Editorial framing + polished styling", "Street outfit with strong light", "Beauty closeup or makeup detail"],
        familyIds: ["portrait_fashion", "beauty_closeup", "portrait_street"],
        freeFirst: 2
      },
      {
        id: "headshot",
        labelZh: "职业头像",
        labelEn: "Headshot",
        descriptionZh: "职业照、形象照、棚拍头像",
        descriptionEn: "Professional profile, studio headshot",
        sceneHintsZh: ["简历 / LinkedIn 头像", "企业官网形象照", "棚拍 + 纯色背景"],
        sceneHintsEn: ["Resume or LinkedIn profile photo", "Company website team photo", "Studio + solid background"],
        familyIds: ["portrait_professional", "portrait_studio"],
        freeFirst: 2
      },
      {
        id: "emotional",
        labelZh: "情绪肖像",
        labelEn: "Emotional Portrait",
        descriptionZh: "情绪人像、电影感、氛围肖像",
        descriptionEn: "Emotional portrait, cinematic still",
        sceneHintsZh: ["电影剧照感 + 情绪表达", "强氛围光影 + 人物特写", "适合艺术写真 / 社交封面"],
        sceneHintsEn: ["Cinematic still with emotional beat", "Mood lighting + character closeup", "Art portrait or social cover"],
        familyIds: ["poster_cover", "portrait_fashion"],
        freeFirst: 1
      },
      {
        id: "couple",
        labelZh: "双人合影",
        labelEn: "Duo / Group",
        descriptionZh: "情侣、双人、多人合影",
        descriptionEn: "Couple, duo, group portrait",
        sceneHintsZh: ["情侣 / 闺蜜合照", "多人团体形象照", "双人互动自然状态"],
        sceneHintsEn: ["Couple or best friends shot", "Group team or family portrait", "Duo in natural interaction"],
        familyIds: ["portrait_couple", "portrait_group"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "cover_poster",
    labelZh: "封面海报",
    labelEn: "Cover & Poster",
    descriptionZh: "小红书、抖音、活动海报",
    descriptionEn: "Social covers, posters, promo visuals",
    featured: true,
    tagsZh: ["封面", "海报", "广告图"],
    tagsEn: ["Cover", "Poster", "Promo"],
    subTasks: [
      {
        id: "xhs",
        labelZh: "小红书封面",
        labelEn: "Xiaohongshu Cover",
        descriptionZh: "封面卡、种草封面、竖版头图",
        descriptionEn: "Vertical social cover",
        sceneHintsZh: ["笔记首图 / 封面卡", "种草风 + 生活感构图", "竖版 3:4 比例"],
        sceneHintsEn: ["Note cover card or hero image", "Lifestyle discovery feed feel", "Vertical 3:4 ratio"],
        familyIds: ["xiaohongshu_cover", "social_vertical_ad", "poster_cover"],
        freeFirst: 2
      },
      {
        id: "douyin",
        labelZh: "抖音封面",
        labelEn: "Douyin Cover",
        descriptionZh: "短视频封面、卖点图、封面吸睛",
        descriptionEn: "Short-video cover, promo visual",
        sceneHintsZh: ["短视频封面 + 大字标题", "卖点图 / 爆款视觉钩子", "9:16 竖屏封面"],
        sceneHintsEn: ["Short video cover + bold title", "Selling point or viral visual hook", "9:16 vertical cover"],
        familyIds: ["douyin_cover", "selling_point_ad"],
        freeFirst: 2
      },
      {
        id: "youtube",
        labelZh: "YouTube 缩略图",
        labelEn: "YouTube Thumbnail",
        descriptionZh: "缩略图、标题图、视觉缩略卡",
        descriptionEn: "Thumbnail, title image",
        sceneHintsZh: ["YouTube 视频封面缩略图", "大表情 / 强对比吸睛构图", "16:9 横版，文字留位"],
        sceneHintsEn: ["YouTube video thumbnail", "Big reaction or high-contrast layout", "16:9 landscape with text space"],
        familyIds: ["youtube_thumbnail", "app_promo_layout"],
        freeFirst: 1
      },
      {
        id: "event",
        labelZh: "活动海报",
        labelEn: "Event Poster",
        descriptionZh: "活动海报、宣传页、标题字幕",
        descriptionEn: "Event poster, promo layout",
        sceneHintsZh: ["线下活动 / 演出宣传海报", "节日促销 / 大促主视觉", "标题 + 日期信息排版"],
        sceneHintsEn: ["Event or show promo poster", "Holiday or sale main visual", "Title + date info layout"],
        familyIds: ["event_poster", "title_subtitle_layout"],
        freeFirst: 2
      },
      {
        id: "course",
        labelZh: "课程封面",
        labelEn: "Course Cover",
        descriptionZh: "课程封面、知识卡、品牌标题",
        descriptionEn: "Course cover, branded title",
        sceneHintsZh: ["知识付费 / 课程主图", "品牌 Logo + 标题排版", "专栏封面 / 电子书封面"],
        sceneHintsEn: ["Online course or knowledge product cover", "Brand logo + title layout", "Column or ebook cover"],
        familyIds: ["course_cover", "logo_copy_layout"],
        freeFirst: 1
      },
      {
        id: "brand",
        labelZh: "品牌宣传",
        labelEn: "Brand Campaign",
        descriptionZh: "品牌视觉、促销图、社媒宣传",
        descriptionEn: "Brand visual, social campaign",
        sceneHintsZh: ["品牌感强的社媒宣传图", "大促 / 节日限定主视觉", "朋友圈 / Instagram 方图"],
        sceneHintsEn: ["Brand-forward social campaign image", "Sale or seasonal limited visual", "WeChat Moments or Instagram square"],
        familyIds: ["brand_promo_cover", "sale_banner", "instagram_square", "wechat_moments_cover"],
        freeFirst: 2
      }
    ]
  },
  {
    id: "talking_video",
    labelZh: "视频口播",
    labelEn: "Talking Video",
    descriptionZh: "口播广告、教程、产品演示",
    descriptionEn: "Talking ads, tutorials, explainers",
    featured: true,
    tagsZh: ["口播", "测评", "教学"],
    tagsEn: ["Talking", "Review", "Tutorial"],
    subTasks: [
      {
        id: "solo",
        labelZh: "单人口播",
        labelEn: "Single Talking",
        descriptionZh: "单人稳定出镜、正面讲解",
        descriptionEn: "Single speaker, front-facing explainer",
        sceneHintsZh: ["一个人正面讲话 + 稳定构图", "带货口播 / 品牌讲解视频", "室内简洁背景 + 中景构图"],
        sceneHintsEn: ["Single speaker front-facing stable shot", "Selling or brand explainer video", "Clean indoor background, medium shot"],
        familyIds: ["solo_speaker", "talking_head_ad"],
        freeFirst: 2
      },
      {
        id: "product",
        labelZh: "产品讲解",
        labelEn: "Product Explainer",
        descriptionZh: "测评、开箱、产品说明",
        descriptionEn: "Review, unboxing, product explainer",
        sceneHintsZh: ["手持产品 + 讲解镜头", "开箱 / 测评 / 上手体验", "产品近景 + 人物互动"],
        sceneHintsEn: ["Hand-holding product while explaining", "Unboxing or hands-on review shot", "Product closeup + person interaction"],
        familyIds: ["product_tutorial", "product_review_shot"],
        freeFirst: 1
      },
      {
        id: "tutorial",
        labelZh: "教程演示",
        labelEn: "Tutorial Demo",
        descriptionZh: "教学、演示、步骤说明",
        descriptionEn: "Tutorial, demo, step by step",
        sceneHintsZh: ["操作步骤演示镜头", "俯拍桌面 / 手部操作特写", "技能教学 / 工具演示"],
        sceneHintsEn: ["Step-by-step demo shot", "Top-down desk or hand operation closeup", "Skill or tool tutorial"],
        familyIds: ["tutorial_demo"],
        freeFirst: 1
      },
      {
        id: "review",
        labelZh: "测评镜头",
        labelEn: "Review Shot",
        descriptionZh: "采访感、评测感、轻对话镜头",
        descriptionEn: "Review feel, interview tone",
        sceneHintsZh: ["轻采访 / 评测对话感镜头", "稍微侧角 + 自然互动", "测评博主常用构图"],
        sceneHintsEn: ["Light interview or review dialogue feel", "Slight angle + natural interaction", "Typical reviewer framing"],
        familyIds: ["interview_layout", "comedy_reaction"],
        freeFirst: 1
      },
      {
        id: "interview",
        labelZh: "访谈式",
        labelEn: "Presentation",
        descriptionZh: "演讲、说明、访谈呈现",
        descriptionEn: "Presentation, briefing, interview-style",
        sceneHintsZh: ["演讲台 / 汇报场景", "正式访谈 + 双机位感", "知识分享 / 深度内容风格"],
        sceneHintsEn: ["Stage or podium presentation", "Formal interview two-camera feel", "Knowledge share or thought-leader style"],
        familyIds: ["presentation_shot"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "story_video",
    labelZh: "剧情短视频",
    labelEn: "Short Drama",
    descriptionZh: "开场、冲突、情绪、结尾",
    descriptionEn: "Opening, conflict, emotion, ending",
    featured: true,
    tagsZh: ["短剧", "短视频", "分镜"],
    tagsEn: ["Drama", "Shorts", "Storyboard"],
    subTasks: [
      {
        id: "opening",
        labelZh: "开场",
        labelEn: "Opening",
        descriptionZh: "开场镜头、人物出场、氛围建立",
        descriptionEn: "Opening shot, entrance, tone setting",
        sceneHintsZh: ["人物登场 + 环境建立镜头", "氛围渲染 + 悬念引入", "Vlog 开场 / 剧情起势"],
        sceneHintsEn: ["Character entrance + environment establish", "Mood build + suspense hook", "Vlog or drama opening beat"],
        familyIds: ["opening_shot", "drama_opening", "vlog_opening", "character_entrance"],
        freeFirst: 2
      },
      {
        id: "conflict",
        labelZh: "冲突",
        labelEn: "Conflict",
        descriptionZh: "对峙、冲突、悬念铺垫",
        descriptionEn: "Confrontation, suspense buildup",
        sceneHintsZh: ["两人对峙 / 争执场景", "悬念铺垫 + 紧张节奏", "戏剧冲突高峰前镜头"],
        sceneHintsEn: ["Two-person standoff or argument", "Tension build before the peak", "Pre-climax drama confrontation"],
        familyIds: ["drama_conflict", "faceoff_scene", "suspense_buildup"],
        freeFirst: 1
      },
      {
        id: "climax",
        labelZh: "情绪爆点",
        labelEn: "Emotional Peak",
        descriptionZh: "爆点、高潮、慢动作高光",
        descriptionEn: "Peak emotion, climax, slow motion",
        sceneHintsZh: ["情绪最强烈的一刻", "慢动作 / 高光特写镜头", "剧情高潮 + 强情绪表达"],
        sceneHintsEn: ["The most intense emotional moment", "Slow motion or highlight closeup", "Drama climax with peak emotion"],
        familyIds: ["emotional_peak", "drama_climax", "slow_motion_highlight"],
        freeFirst: 1
      },
      {
        id: "reveal",
        labelZh: "真相揭示",
        labelEn: "Reveal",
        descriptionZh: "转折、闪回、真相浮现",
        descriptionEn: "Turning point, flashback, reveal",
        sceneHintsZh: ["剧情反转 / 真相浮现时刻", "闪回记忆镜头", "悬疑 / 惊悚揭示场景"],
        sceneHintsEn: ["Plot twist or truth reveal moment", "Flashback memory shot", "Thriller or suspense reveal scene"],
        familyIds: ["turning_point_shot", "thriller_reveal", "flashback_scene"],
        freeFirst: 1
      },
      {
        id: "ending",
        labelZh: "结尾收束",
        labelEn: "Ending",
        descriptionZh: "结尾、收束、蒙太奇收尾",
        descriptionEn: "Ending, closure, montage",
        sceneHintsZh: ["情感落定 / 故事收束镜头", "蒙太奇剪辑式结尾", "留白 + 余韵感收场"],
        sceneHintsEn: ["Emotional resolution or story close", "Montage-style ending beat", "Open-ended fade or lingering close"],
        familyIds: ["ending_closure", "drama_ending", "montage_transition"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "pro_workflows",
    labelZh: "更多专业任务",
    labelEn: "More Pro Workflows",
    descriptionZh: "连续分镜、多镜调度、风格化",
    descriptionEn: "Continuity, multi-shot blocking, stylized workflows",
    featured: false,
    tagsZh: ["专业", "多镜头", "连续"],
    tagsEn: ["Pro", "Multi-shot", "Continuity"],
    subTasks: [
      {
        id: "continuity",
        labelZh: "连续分镜",
        labelEn: "Continuity",
        descriptionZh: "同一角色、同一空间、跨镜保持一致",
        descriptionEn: "Keep the same character and space coherent across cuts",
        sceneHintsZh: ["同一个人跨镜头还是同一个人", "空间方向和动作衔接不断", "短剧 / 剧情连续段落先搭好"],
        sceneHintsEn: ["The same character stays consistent across cuts", "Direction and movement hold together", "Build a continuous drama sequence first"],
        familyIds: [
          "indoor_duo_continuity",
          "office_negotiation_continuity",
          "corridor_tracking_continuity",
          "emotional_confrontation_continuity",
          "chase_enter_continuity"
        ],
        freeFirst: 1
      },
      {
        id: "dialogue",
        labelZh: "多镜对话",
        labelEn: "Multi-shot Dialogue",
        descriptionZh: "双人对话、走位交流、情绪反应切换",
        descriptionEn: "Dialogue coverage with movement and reaction beats",
        sceneHintsZh: ["双人对话正反打", "谈判 / 对峙 / 交流场面", "说话的人和听的人都能照顾到"],
        sceneHintsEn: ["Shot-reverse-shot for two people", "Negotiation, standoff, or conversation scenes", "Covers both speaker and listener clearly"],
        familyIds: ["dialogue_duo", "indoor_duo_continuity", "office_negotiation_continuity", "emotional_confrontation_continuity"],
        freeFirst: 1
      },
      {
        id: "action",
        labelZh: "动作连续",
        labelEn: "Action Blocking",
        descriptionZh: "打、跑、冲、放招，这些动作镜头怎么排",
        descriptionEn: "Plan fights, runs, bursts, and motion-heavy shots",
        sceneHintsZh: ["动作戏和冲突场面", "节奏快、动势强的镜头", "从起手到爆点的动作编排"],
        sceneHintsEn: ["Fight and conflict-heavy scenes", "Fast rhythm and strong motion", "From setup to impact in one action flow"],
        familyIds: ["scene_push_forward", "battle_standoff_anime", "skill_release_anime", "anime_action"],
        freeFirst: 1
      },
      {
        id: "chase",
        labelZh: "追逐调度",
        labelEn: "Chase Blocking",
        descriptionZh: "追的人和被追的人，镜头顺序怎么跟",
        descriptionEn: "How the camera follows the chaser and the chased",
        sceneHintsZh: ["追逐、逃跑、逼近", "悬疑 / 惊悚的压迫感运动镜头", "先远后近、顺着紧张感推进"],
        sceneHintsEn: ["Chasing, escaping, closing in", "Suspense and thriller motion coverage", "Build tension by moving from wide to close"],
        familyIds: ["thriller_chase", "chase_enter_continuity", "corridor_tracking_continuity"],
        freeFirst: 1
      },
      {
        id: "anime",
        labelZh: "动漫风格",
        labelEn: "Anime / Stylized",
        descriptionZh: "二次元、赛博朋克、MV感这类风格化画面",
        descriptionEn: "Anime, cyberpunk, and stylized performance-driven visuals",
        sceneHintsZh: ["二次元角色和演出节奏", "赛博朋克 / 风格化视觉", "MV 感、情绪感、表演感画面"],
        sceneHintsEn: ["Anime-style characters and staging", "Cyberpunk and stylized visuals", "MV-like, emotional, performance-first frames"],
        familyIds: ["anime_action", "anime_emotional", "battle_standoff_anime", "daily_dialogue_anime", "protagonist_entrance_anime", "skill_release_anime"],
        freeFirst: 1
      }
    ]
  }
];

export function getIntentIcon(intentId: TemplateIntentId): LucideIcon {
  return INTENT_ICONS[intentId];
}
