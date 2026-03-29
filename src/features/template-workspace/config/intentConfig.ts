import { Film, Layers, Layout, ShoppingBag, UserRound, Video, type LucideIcon } from "lucide-react";
import type { TemplateIntentId, TemplateIntentMeta } from "../model/templateIntent";

export const INTENT_ICONS: Record<TemplateIntentId, LucideIcon> = {
  sell_product: ShoppingBag,
  people_portrait: UserRound,
  cover_poster: Layout,
  talking_video: Video,
  story_video: Film,
  pro_workflows: Layers
};

export const INTENT_CONFIG: TemplateIntentMeta[] = [
  {
    id: "sell_product",
    labelZh: "商品展示",
    labelEn: "Product Showcase",
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
        familyIds: ["v3_white_bg"],
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
        familyIds: ["v3_product_hero", "v3_luxury_ad", "v3_daily_product_luxury"],
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
        familyIds: ["v3_product_detail", "v3_tech_ad"],
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
        familyIds: ["v3_product_lifestyle"],
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
        familyIds: ["v3_product_compare"],
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
        familyIds: ["v3_product_video", "v3_food_ad", "v3_car_ad"],
        freeFirst: 2
      }
    ]
  },
  {
    id: "people_portrait",
    labelZh: "人物形象",
    labelEn: "Character Portraits",
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
        familyIds: ["v3_portrait_lifestyle", "v3_portrait_brand"],
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
        familyIds: ["v3_portrait_editorial", "v3_portrait_luxury_fashion", "v3_portrait_fashion_video", "v3_daily_portrait_premium"],
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
        familyIds: ["v3_portrait_corporate", "v3_portrait_bw"],
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
        familyIds: ["v3_portrait_cinematic", "v3_portrait_director"],
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
        familyIds: ["v3_portrait_couple", "v3_portrait_athlete"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "cover_poster",
    labelZh: "封面视觉",
    labelEn: "Cover Visuals",
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
        familyIds: ["v3_poster_social", "v3_poster_fashion"],
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
        familyIds: ["v3_poster_film_video", "v3_poster_brand_video"],
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
        familyIds: ["v3_poster_tech_brand", "v3_poster_corporate"],
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
        familyIds: ["v3_poster_event", "v3_poster_music", "v3_daily_cover_hero"],
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
        familyIds: ["v3_poster_abstract", "v3_poster_luxury_brand"],
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
        familyIds: ["v3_poster_brand", "v3_poster_movie"],
        freeFirst: 2
      }
    ]
  },
  {
    id: "talking_video",
    labelZh: "口播视频",
    labelEn: "Talking Videos",
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
        familyIds: ["v3_pro_commercial", "v3_pro_brand_film", "v3_daily_talking_head"],
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
        familyIds: ["v3_product_video", "v3_pro_tech"],
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
        familyIds: ["v3_pro_food", "v3_pro_beauty"],
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
        familyIds: ["v3_portrait_video", "v3_portrait_cinematic_video"],
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
        familyIds: ["v3_pro_real_estate", "v3_pro_hospitality"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "story_video",
    labelZh: "剧情片段",
    labelEn: "Story Snippets",
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
        familyIds: ["v3_story_vlog", "v3_story_documentary", "v3_story_nature", "v3_pro_formats"],
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
        familyIds: ["v3_story_drama", "v3_story_crime", "v3_story_suspense", "v3_daily_story_conflict"],
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
        familyIds: ["v3_story_romance", "v3_story_action", "v3_story_sport"],
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
        familyIds: ["v3_story_scifi", "v3_story_historical", "v3_story_golden"],
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
        familyIds: ["v3_story_fashion_film", "v3_story_music_video", "v3_story_product_film", "v3_pro_fashion_film", "v3_pro_music_video", "v3_pro_sports", "v3_pro_travel"],
        freeFirst: 1
      }
    ]
  },
  {
    id: "pro_workflows",
    labelZh: "更多专业任务",
    labelEn: "More Pro Workflows",
    descriptionZh: "广告、影视、动画、游戏与风格化创作",
    descriptionEn: "Ad, film, animation, game, and stylized creation",
    featured: false,
    tagsZh: ["专业", "多镜头", "连续"],
    tagsEn: ["Pro", "Multi-shot", "Continuity"],
    subTasks: [
      {
        id: "continuity",
        labelZh: "广告镜头",
        labelEn: "Ad Shots",
        descriptionZh: "商业叙事、品牌片和广告节奏的镜头组织",
        descriptionEn: "Commercial narrative and brand-film shot organization",
        sceneHintsZh: ["同一个人跨镜头还是同一个人", "空间方向和动作衔接不断", "短剧 / 剧情连续段落先搭好"],
        sceneHintsEn: ["The same character stays consistent across cuts", "Direction and movement hold together", "Build a continuous drama sequence first"],
        familyIds: [
          "v3_pro_director_style",
          "v3_pro_commercial",
          "v3_pro_brand_film",
          "v3_pro_documentary",
          "v3_pro_editorial",
          "v3_pro_ad_visual",
        ],
        freeFirst: 1
      },
      {
        id: "dialogue",
        labelZh: "影视镜头",
        labelEn: "Film Shots",
        descriptionZh: "角色关系、走位交流和叙事镜头切换",
        descriptionEn: "Narrative coverage with relationships, blocking, and cut grammar",
        sceneHintsZh: ["双人对话正反打", "谈判 / 对峙 / 交流场面", "说话的人和听的人都能照顾到"],
        sceneHintsEn: ["Shot-reverse-shot for two people", "Negotiation, standoff, or conversation scenes", "Covers both speaker and listener clearly"],
        familyIds: ["v3_story_drama", "v3_portrait_cinematic", "v3_pro_film_blocking"],
        freeFirst: 1
      },
      {
        id: "action",
        labelZh: "游戏视觉",
        labelEn: "Game Visuals",
        descriptionZh: "高速动作、对抗场景和强动态视觉节奏",
        descriptionEn: "High-speed action, confrontation, and game-like visual rhythm",
        sceneHintsZh: ["动作戏和冲突场面", "节奏快、动势强的镜头", "从起手到爆点的动作编排"],
        sceneHintsEn: ["Fight and conflict-heavy scenes", "Fast rhythm and strong motion", "From setup to impact in one action flow"],
        familyIds: ["v3_story_action", "v3_story_sport", "v3_story_scifi", "v3_pro_game_squad", "v3_pro_game_skill", "v3_pro_game_entrance"],
        freeFirst: 1
      },
      {
        id: "chase",
        labelZh: "风格实验",
        labelEn: "Style Experiments",
        descriptionZh: "悬疑、压迫、特殊气质和风格化镜头尝试",
        descriptionEn: "Suspense, pressure, and style-forward cinematic experiments",
        sceneHintsZh: ["追逐、逃跑、逼近", "悬疑 / 惊悚的压迫感运动镜头", "先远后近、顺着紧张感推进"],
        sceneHintsEn: ["Chasing, escaping, closing in", "Suspense and thriller motion coverage", "Build tension by moving from wide to close"],
        familyIds: ["v3_story_crime", "v3_story_suspense", "v3_pro_style_fusion", "v3_pro_style_surreal", "v3_pro_style_future"],
        freeFirst: 1
      },
      {
        id: "anime",
        labelZh: "动画镜头",
        labelEn: "Animation Shots",
        descriptionZh: "动画、赛博朋克与强演出感的画面组织",
        descriptionEn: "Animation, cyberpunk, and performance-driven stylized visuals",
        sceneHintsZh: ["二次元角色和演出节奏", "赛博朋克 / 风格化视觉", "MV 感、情绪感、表演感画面"],
        sceneHintsEn: ["Anime-style characters and staging", "Cyberpunk and stylized visuals", "MV-like, emotional, performance-first frames"],
        familyIds: ["v3_story_anime", "v3_story_music_video", "v3_story_short_vertical", "v3_pro_animation_epic", "v3_pro_animation_anime", "v3_pro_animation_cg"],
        freeFirst: 1
      }
    ]
  }
];

export function getIntentIcon(intentId: TemplateIntentId): LucideIcon {
  return INTENT_ICONS[intentId];
}
