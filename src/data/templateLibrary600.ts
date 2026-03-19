/**
 * Template Library 600 - Spec-driven generation.
 * 40 families × 10 variants = 400 base
 * + 100 webdrama + 100 anime (continuity, built elsewhere)
 *
 * Based on: familySpec, variantRules, payloadSchema (docs/)
 */

import type { Scene, Layer, Camera, Lighting } from "../model";
import type { UnifiedTemplate, TemplateCategory, TemplateVariant } from "../types/templateWorkspace";
import { applyCameraLanguage } from "../content/cameraLanguageLayers";
import { applyVideoClassicMode, applyImageClassicMode, applyImageProEffects } from "../content/proCreativeModes";
import { applyDirectorStylePack } from "../content/directorStylePacks";
import { applyProShotRecipe } from "../content/proShotRecipes";

// --- Variants (from variant rules) ---
const VARIANTS: TemplateVariant[] = [
  "free_starter",
  "cinematic",
  "multi_object",
  "advanced_motion"
];

type HiddenProfile =
  | "product_showcase"
  | "product_clean"
  | "portrait_editorial"
  | "portrait_natural"
  | "social_cover"
  | "poster_cover"
  | "lifestyle_scene"
  | "creative_style"
  | "business_scene"
  | "dialogue_video"
  | "ad_video"
  | "short_video_story";

type ExtraFamilyDef = {
  id: string;
  nameEn: string;
  nameZh: string;
  category: TemplateCategory;
  mediaType: "image" | "video";
  storyPlan: UnifiedTemplate["storyPlan"];
  descriptionZh: string;
  descriptionEn: string;
  hiddenProfile: HiddenProfile;
};

function makeFamilyGroup(
  entries: ReadonlyArray<readonly [string, string, string]>,
  common: {
    category: TemplateCategory;
    mediaType: "image" | "video";
    storyPlan: UnifiedTemplate["storyPlan"];
    hiddenProfile: HiddenProfile;
    descriptionZhSuffix: string;
    descriptionEnSuffix: string;
  }
): ExtraFamilyDef[] {
  return entries.map(([id, nameEn, nameZh]) => ({
    id,
    nameEn,
    nameZh,
    category: common.category,
    mediaType: common.mediaType,
    storyPlan: common.storyPlan,
    descriptionZh: `适合${nameZh}${common.descriptionZhSuffix}`,
    descriptionEn: `A starter for ${nameEn.toLowerCase()} ${common.descriptionEnSuffix}`,
    hiddenProfile: common.hiddenProfile
  }));
}

const EXTRA_PRODUCT_FAMILIES = makeFamilyGroup([
  ["product_lifestyle", "Product Lifestyle", "产品生活场景"],
  ["product_texture_closeup", "Product Texture", "产品材质特写"],
  ["product_hand_use", "Product In Use", "产品使用场景"],
  ["product_packaging", "Product Packaging", "产品包装展示"],
  ["product_minimal_flat", "Minimal Flat Lay", "极简平铺展示"],
  ["product_group_shot", "Product Group Shot", "产品组合展示"],
  ["food_beverage_ad", "Food & Beverage", "食品饮料广告"],
  ["cosmetics_display", "Cosmetics Display", "美妆产品陈列"],
  ["jewelry_showcase", "Jewelry Showcase", "珠宝首饰展示"],
  ["fashion_item_flat", "Fashion Flat Lay", "服装平铺展示"],
  ["perfume_bottle_hero", "Perfume Bottle Hero", "香水瓶主视觉"],
  ["supplement_jar_display", "Supplement Jar", "保健品罐装展示"],
  ["shoe_product_display", "Shoe Display", "鞋类产品展示"],
  ["bag_product_showcase", "Bag Showcase", "包袋展示"],
  ["watch_closeup", "Watch Closeup", "手表特写"],
  ["home_appliance_showcase", "Home Appliance", "家电展示"],
  ["gadget_unboxing_layout", "Gadget Unboxing", "数码开箱布局"],
  ["stationery_flatlay", "Stationery Flat Lay", "文具平铺"],
  ["toy_collectible_display", "Toy Collectible", "潮玩手办展示"],
  ["furniture_product_scene", "Furniture Scene", "家具产品场景"]
], {
  category: "product",
  mediaType: "image",
  storyPlan: "single",
  hiddenProfile: "product_showcase",
  descriptionZhSuffix: "、电商展示与品牌出图。",
  descriptionEnSuffix: "used in e-commerce and product marketing."
});

const EXTRA_PORTRAIT_FAMILIES = makeFamilyGroup([
  ["portrait_natural_light", "Natural Light Portrait", "自然光人像"],
  ["portrait_studio", "Studio Portrait", "棚拍人像"],
  ["portrait_street", "Street Portrait", "街头人像"],
  ["portrait_professional", "Professional Headshot", "职业形象照"],
  ["portrait_couple", "Couple Portrait", "情侣写真"],
  ["portrait_group", "Group Portrait", "团体合影"],
  ["children_portrait", "Children Portrait", "儿童写真"],
  ["elderly_portrait", "Elderly Portrait", "老人肖像"],
  ["bridal_portrait", "Bridal Portrait", "婚纱写真"],
  ["maternity_portrait", "Maternity Portrait", "孕妇写真"],
  ["graduation_portrait", "Graduation Portrait", "毕业写真"],
  ["fitness_portrait", "Fitness Portrait", "健身写真"],
  ["musician_portrait", "Musician Portrait", "音乐人写真"],
  ["artist_portrait", "Artist Portrait", "艺术家肖像"],
  ["festival_portrait", "Festival Portrait", "节日写真"],
  ["travel_portrait", "Travel Portrait", "旅行人像"]
], {
  category: "composition",
  mediaType: "image",
  storyPlan: "single",
  hiddenProfile: "portrait_editorial",
  descriptionZhSuffix: "与人物写真表达。",
  descriptionEnSuffix: "for portrait and human-centered photography."
});

const EXTRA_SOCIAL_FAMILIES = [
  ...makeFamilyGroup([
    ["instagram_square", "Instagram Square", "Instagram 方图"],
    ["youtube_thumbnail", "YouTube Thumbnail", "YouTube 封面"],
    ["wechat_moments_cover", "WeChat Cover", "朋友圈封面"],
    ["xiaohongshu_cover", "Xiaohongshu Cover", "小红书封面"],
    ["douyin_cover", "Douyin Cover", "抖音封面"],
    ["podcast_cover", "Podcast Cover", "播客封面"],
    ["livestream_cover", "Livestream Cover", "直播封面"],
    ["webinar_cover", "Webinar Cover", "线上讲座封面"],
    ["app_store_promo", "App Store Promo", "应用商店宣传图"],
    ["before_after_ad", "Before After Ad", "前后对比广告"],
    ["testimonial_card_layout", "Testimonial Card", "用户证言卡片"],
    ["membership_promo", "Membership Promo", "会员宣传图"]
  ], {
    category: "social",
    mediaType: "image",
    storyPlan: "single",
    hiddenProfile: "social_cover",
    descriptionZhSuffix: "、封面传播与社媒发布。",
    descriptionEnSuffix: "for covers, social campaigns, and platform publishing."
  }),
  ...makeFamilyGroup([
    ["event_poster", "Event Poster", "活动海报"],
    ["course_cover", "Course Cover", "课程封面"],
    ["recruitment_poster", "Recruitment Poster", "招聘海报"],
    ["festival_poster", "Festival Poster", "节庆海报"]
  ], {
    category: "cover_poster",
    mediaType: "image",
    storyPlan: "single",
    hiddenProfile: "poster_cover",
    descriptionZhSuffix: "、宣传视觉与封面呈现。",
    descriptionEnSuffix: "for posters, cover visuals, and announcement graphics."
  }),
  ...makeFamilyGroup([
    ["sale_banner", "Sale Banner", "促销横幅"],
    ["giveaway_poster", "Giveaway Poster", "抽奖宣传图"],
    ["launch_countdown_banner", "Launch Countdown", "新品倒计时横幅"],
    ["brand_story_cover", "Brand Story Cover", "品牌故事封面"]
  ], {
    category: "ad",
    mediaType: "image",
    storyPlan: "single",
    hiddenProfile: "social_cover",
    descriptionZhSuffix: "、营销传播与转化引导。",
    descriptionEnSuffix: "for ad graphics, launch campaigns, and conversion-driven promotion."
  })
];

const EXTRA_SHORT_VIDEO_FAMILIES = makeFamilyGroup([
  ["vlog_opening", "Vlog Opening", "Vlog 开场"],
  ["product_review_shot", "Product Review Shot", "产品测评镜头"],
  ["dance_performance", "Dance Performance", "舞蹈表演镜头"],
  ["comedy_reaction", "Comedy Reaction", "喜剧反应镜头"],
  ["suspense_buildup", "Suspense Buildup", "悬念铺垫"],
  ["flashback_scene", "Flashback Scene", "闪回场景"],
  ["montage_transition", "Montage Transition", "蒙太奇转场"],
  ["slow_motion_highlight", "Slow Motion Highlight", "慢动作高光"],
  ["tutorial_hook", "Tutorial Hook", "教程钩子镜头"],
  ["unboxing_reveal", "Unboxing Reveal", "开箱揭示"],
  ["transformation_reveal", "Transformation Reveal", "改造揭示"],
  ["street_interview_shot", "Street Interview", "街采访镜头"],
  ["cooking_process_shot", "Cooking Process", "烹饪过程镜头"],
  ["workout_highlight", "Workout Highlight", "训练高光镜头"],
  ["fashion_walk_shot", "Fashion Walk", "走秀出场镜头"],
  ["travel_broll_shot", "Travel B-Roll", "旅行转场镜头"]
], {
  category: "short_video",
  mediaType: "video",
  storyPlan: "single",
  hiddenProfile: "short_video_story",
  descriptionZhSuffix: "与短视频关键镜头。",
  descriptionEnSuffix: "for short-form video beats and creator storytelling."
});

const EXTRA_LIFESTYLE_FAMILIES = makeFamilyGroup([
  ["cafe_scene", "Cafe Scene", "咖啡馆场景"],
  ["home_cozy", "Cozy Home", "温馨家居"],
  ["outdoor_adventure", "Outdoor Adventure", "户外探险"],
  ["beach_vacation", "Beach Vacation", "海滩度假"],
  ["mountain_scenery", "Mountain Scenery", "山地风景"],
  ["city_street", "City Street", "城市街道"],
  ["night_city", "Night City", "夜间城市"],
  ["restaurant_scene", "Restaurant Scene", "餐厅场景"],
  ["gym_fitness", "Gym & Fitness", "健身运动"],
  ["reading_study", "Reading & Study", "阅读学习"],
  ["market_scene", "Market Scene", "市集生活"],
  ["park_picnic", "Park Picnic", "公园野餐"],
  ["airport_travel", "Airport Travel", "机场出行"],
  ["hotel_room_scene", "Hotel Room", "酒店房间场景"],
  ["kitchen_cooking", "Kitchen Cooking", "厨房烹饪"],
  ["bakery_counter", "Bakery Counter", "面包店柜台"],
  ["bookstore_corner", "Bookstore Corner", "书店一角"],
  ["pet_lifestyle", "Pet Lifestyle", "宠物生活方式"],
  ["camping_scene", "Camping Scene", "露营场景"],
  ["sunset_walk", "Sunset Walk", "夕阳散步"]
], {
  category: "composition",
  mediaType: "image",
  storyPlan: "single",
  hiddenProfile: "lifestyle_scene",
  descriptionZhSuffix: "、日常氛围与生活方式画面。",
  descriptionEnSuffix: "for lifestyle scenes, travel, and environmental storytelling."
});

const EXTRA_CREATIVE_FAMILIES = makeFamilyGroup([
  ["cyberpunk_scene", "Cyberpunk Scene", "赛博朋克场景"],
  ["fantasy_world", "Fantasy World", "奇幻世界"],
  ["retro_vintage", "Retro Vintage", "复古风格"],
  ["minimalist_art", "Minimalist Art", "极简艺术"],
  ["watercolor_style", "Watercolor Style", "水彩风格"],
  ["ink_painting", "Ink Painting", "水墨风格"],
  ["pixel_art_scene", "Pixel Art", "像素艺术"],
  ["neon_noir_scene", "Neon Noir", "霓虹黑色电影"],
  ["dreamscape_world", "Dreamscape", "梦境场景"],
  ["surreal_collage", "Surreal Collage", "超现实拼贴"],
  ["paper_cut_style", "Paper Cut Style", "剪纸风格"],
  ["clay_render_scene", "Clay Render", "黏土渲染风格"],
  ["low_poly_world", "Low Poly World", "低多边形世界"],
  ["comic_pop_style", "Comic Pop", "波普漫画风"],
  ["glitch_art_scene", "Glitch Art", "故障艺术风"],
  ["pastel_soft_scene", "Pastel Soft", "粉彩柔和风"],
  ["monochrome_scene", "Monochrome", "单色风格"]
], {
  category: "composition",
  mediaType: "image",
  storyPlan: "single",
  hiddenProfile: "creative_style",
  descriptionZhSuffix: "与风格化创意视觉。",
  descriptionEnSuffix: "for stylized creative visuals and art direction."
});

const EXTRA_PROFESSIONAL_FAMILIES = [
  ...makeFamilyGroup([
    ["office_workspace", "Office Workspace", "办公空间"],
    ["medical_scene", "Medical Scene", "医疗场景"],
    ["education_scene", "Education Scene", "教育场景"],
    ["conference_room", "Conference Room", "会议室场景"],
    ["doctor_consultation", "Doctor Consultation", "医生问诊"],
    ["classroom_teaching", "Classroom Teaching", "课堂教学"],
    ["lab_research", "Lab Research", "实验室研究"],
    ["retail_storefront", "Retail Storefront", "零售门店"],
    ["real_estate_interior", "Real Estate Interior", "地产室内展示"],
    ["legal_consultation", "Legal Consultation", "法律咨询"],
    ["finance_office_scene", "Finance Office", "金融办公场景"],
    ["factory_workspace", "Factory Workspace", "工厂工作场景"],
    ["beauty_salon_scene", "Beauty Salon", "美容沙龙场景"],
    ["hotel_service_scene", "Hotel Service", "酒店服务场景"],
    ["startup_pitch_scene", "Startup Pitch", "创业路演场景"]
  ], {
    category: "composition",
    mediaType: "image",
    storyPlan: "single",
    hiddenProfile: "business_scene",
    descriptionZhSuffix: "与商业专业场景呈现。",
    descriptionEnSuffix: "for business, service, and professional visual communication."
  }),
  ...makeFamilyGroup([
    ["team_collaboration", "Team Collaboration", "团队协作"],
    ["customer_meeting", "Customer Meeting", "客户会议"],
    ["mentor_conversation", "Mentor Conversation", "导师交流"],
    ["workspace_brainstorm", "Workspace Brainstorm", "头脑风暴场景"],
    ["presentation_shot", "Presentation Shot", "演讲展示"],
    ["webinar_speaker", "Webinar Speaker", "线上演讲镜头"],
    ["training_session", "Training Session", "培训讲解镜头"]
  ], {
    category: "dialogue",
    mediaType: "video",
    storyPlan: "single",
    hiddenProfile: "dialogue_video",
    descriptionZhSuffix: "与讲解沟通类工作场景。",
    descriptionEnSuffix: "for presentations, explanations, and communication-driven workflows."
  })
];

const EXTRA_SPORTS_FAMILIES = makeFamilyGroup([
  ["running_scene", "Running Scene", "跑步场景"],
  ["cycling_scene", "Cycling Scene", "骑行场景"],
  ["basketball_moment", "Basketball Moment", "篮球瞬间"],
  ["football_action", "Football Action", "足球动作场景"],
  ["tennis_highlight", "Tennis Highlight", "网球高光"],
  ["yoga_session", "Yoga Session", "瑜伽场景"],
  ["swimming_pool_scene", "Swimming Pool", "泳池场景"],
  ["boxing_training", "Boxing Training", "拳击训练"],
  ["hiking_trail", "Hiking Trail", "徒步路线"],
  ["ski_resort_scene", "Ski Resort", "滑雪度假场景"]
], {
  category: "composition",
  mediaType: "image",
  storyPlan: "single",
  hiddenProfile: "lifestyle_scene",
  descriptionZhSuffix: "、运动氛围与活力表达。",
  descriptionEnSuffix: "for sports, motion energy, and active lifestyle visuals."
});

const EXTRA_FAMILIES: ExtraFamilyDef[] = [
  ...EXTRA_PRODUCT_FAMILIES,
  ...EXTRA_PORTRAIT_FAMILIES,
  ...EXTRA_SOCIAL_FAMILIES,
  ...EXTRA_SHORT_VIDEO_FAMILIES,
  ...EXTRA_LIFESTYLE_FAMILIES,
  ...EXTRA_CREATIVE_FAMILIES,
  ...EXTRA_PROFESSIONAL_FAMILIES,
  ...EXTRA_SPORTS_FAMILIES
];

const PAID_VARIANT_FAMILY_IDS = new Set([
  "product_hero",
  "product_center_display",
  "product_compare",
  "feature_breakdown",
  "logo_copy_layout",
  "product_in_hand",
  "floating_product_showcase",
  "white_bg_product",
  "dialogue_duo",
  "faceoff_scene",
  "tracking_dialogue",
  "multi_person_dialogue",
  "solo_speaker",
  "interview_layout",
  "social_vertical_ad",
  "selling_point_ad",
  "cta_landing_layout",
  "talking_head_ad",
  "app_promo_layout",
  "brand_promo_cover",
  "opening_shot",
  "character_entrance",
  "scene_push_forward",
  "emotional_peak",
  "turning_point_shot",
  "ending_closure",
  "poster_cover",
  "title_subtitle_layout",
  "beauty_closeup",
  "anime_action",
  "drama_conflict",
  "drama_climax",
  "thriller_chase",
  "thriller_reveal",
  "tech_product",
  "food_ad",
  "product_tutorial",
  "chase_sequence",
  "dialogue_sequence",
  "action_sequence",
  "product_lifestyle",
  "product_texture_closeup",
  "product_hand_use",
  "product_group_shot",
  "cosmetics_display",
  "jewelry_showcase",
  "portrait_studio",
  "portrait_professional",
  "portrait_couple",
  "portrait_group",
  "youtube_thumbnail",
  "xiaohongshu_cover",
  "vlog_opening",
  "product_review_shot",
  "suspense_buildup",
  "flashback_scene",
  "slow_motion_highlight",
  "team_collaboration",
  "presentation_shot"
]);

// --- Families (from template-family-spec) ---
const FAMILIES: {
  id: string;
  nameEn: string;
  nameZh: string;
  category: TemplateCategory;
  mediaType: "image" | "video";
  storyPlan: UnifiedTemplate["storyPlan"];
}[] = [
  { id: "product_hero", nameEn: "Product Hero", nameZh: "产品主图", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_center_display", nameEn: "Product Center Display", nameZh: "产品居中展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_compare", nameEn: "Product Compare", nameZh: "双产品对比", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "feature_breakdown", nameEn: "Feature Breakdown", nameZh: "功能拆解", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "logo_copy_layout", nameEn: "Logo Copy Layout", nameZh: "Logo 与文案布局", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "product_in_hand", nameEn: "Product In Hand", nameZh: "手持产品展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "floating_product_showcase", nameEn: "Floating Product Showcase", nameZh: "悬浮产品展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "white_bg_product", nameEn: "White Background Product", nameZh: "电商白底展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "dialogue_duo", nameEn: "Dialogue Duo", nameZh: "双人对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "solo_speaker", nameEn: "Solo Speaker", nameZh: "单人主讲", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "interview_layout", nameEn: "Interview Layout", nameZh: "采访结构", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "faceoff_scene", nameEn: "Face-off Scene", nameZh: "对峙场景", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "tracking_dialogue", nameEn: "Tracking Dialogue", nameZh: "跟拍对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "multi_person_dialogue", nameEn: "Multi-Person Dialogue", nameZh: "多人站位对话", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "social_vertical_ad", nameEn: "Social Vertical Ad", nameZh: "社媒竖版广告", category: "social", mediaType: "image", storyPlan: "single" },
  { id: "selling_point_ad", nameEn: "Selling Point Ad", nameZh: "产品卖点广告", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "cta_landing_layout", nameEn: "CTA Landing Layout", nameZh: "行动召唤布局", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "talking_head_ad", nameEn: "Talking Head Ad", nameZh: "口播广告", category: "ad", mediaType: "video", storyPlan: "single" },
  { id: "app_promo_layout", nameEn: "App Promo Layout", nameZh: "应用宣传布局", category: "social", mediaType: "image", storyPlan: "single" },
  { id: "brand_promo_cover", nameEn: "Brand Promo Cover", nameZh: "品牌宣传封面", category: "ad", mediaType: "image", storyPlan: "single" },
  { id: "opening_shot", nameEn: "Opening Shot", nameZh: "开场镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "character_entrance", nameEn: "Character Entrance", nameZh: "角色入场", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "scene_push_forward", nameEn: "Scene Push Forward", nameZh: "场景推进", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "emotional_peak", nameEn: "Emotional Peak", nameZh: "情绪爆点", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "turning_point_shot", nameEn: "Turning Point Shot", nameZh: "转折镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "ending_closure", nameEn: "Ending Closure", nameZh: "结尾收束", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "push_in_motion", nameEn: "Push-in Motion", nameZh: "推镜", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "pull_out_motion", nameEn: "Pull-out Motion", nameZh: "拉镜", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "pan_motion", nameEn: "Pan Motion", nameZh: "横移镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "tracking_motion", nameEn: "Tracking Motion", nameZh: "跟拍镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "orbit_motion", nameEn: "Orbit Motion", nameZh: "环绕镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "crane_motion", nameEn: "Crane Motion", nameZh: "升降镜头", category: "camera_move", mediaType: "video", storyPlan: "single" },
  { id: "center_composition", nameEn: "Center Composition", nameZh: "居中构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "symmetry_composition", nameEn: "Symmetry Composition", nameZh: "对称构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "asymmetry_composition", nameEn: "Asymmetry Composition", nameZh: "不对称构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "multi_object_composition", nameEn: "Multi-Object Composition", nameZh: "多对象构图", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "continuous_single_scene", nameEn: "Continuous Single Scene", nameZh: "单场景连续", category: "continuous", mediaType: "video", storyPlan: "continuous" },
  { id: "multi_scene_continuity", nameEn: "Multi-Scene Continuity", nameZh: "多分镜连续", category: "continuous", mediaType: "video", storyPlan: "multi_cam" },
  { id: "poster_cover", nameEn: "Poster Cover", nameZh: "海报封面", category: "cover_poster", mediaType: "image", storyPlan: "single" },
  { id: "title_subtitle_layout", nameEn: "Title Subtitle Layout", nameZh: "标题字幕布局", category: "cover_poster", mediaType: "image", storyPlan: "single" },
  // ── 人物写真/时尚 ──
  { id: "portrait_fashion", nameEn: "Fashion Portrait", nameZh: "时尚人物写真", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "lifestyle_casual", nameEn: "Lifestyle Casual", nameZh: "生活随拍写真", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "beauty_closeup", nameEn: "Beauty Closeup", nameZh: "美妆特写", category: "composition", mediaType: "image", storyPlan: "single" },
  // ── 美食/旅行/生活 ──
  { id: "food_showcase", nameEn: "Food Showcase", nameZh: "美食展示", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "travel_landscape", nameEn: "Travel Landscape", nameZh: "旅行风景", category: "composition", mediaType: "image", storyPlan: "single" },
  { id: "lifestyle_scene", nameEn: "Lifestyle Scene", nameZh: "生活场景", category: "composition", mediaType: "image", storyPlan: "single" },
  // ── 动漫/AI动画 ──
  { id: "anime_action", nameEn: "Anime Action", nameZh: "动漫动作场景", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "anime_emotional", nameEn: "Anime Emotional", nameZh: "动漫情绪特写", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "anime_landscape", nameEn: "Anime Landscape", nameZh: "动漫环境镜头", category: "composition", mediaType: "image", storyPlan: "single" },
  // ── 建筑/空间 ──
  { id: "urban_scene", nameEn: "Urban Scene", nameZh: "城市场景", category: "composition", mediaType: "video", storyPlan: "single" },
  // ── 网剧剧情结构 ──
  { id: "drama_opening", nameEn: "Drama Opening", nameZh: "剧情开场", category: "continuous", mediaType: "video", storyPlan: "single" },
  { id: "drama_conflict", nameEn: "Drama Conflict", nameZh: "剧情冲突", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "drama_climax", nameEn: "Drama Climax", nameZh: "剧情高潮", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "drama_ending", nameEn: "Drama Ending", nameZh: "剧情结局", category: "short_video", mediaType: "video", storyPlan: "single" },
  // ── 音乐MV ──
  { id: "mv_performance", nameEn: "MV Performance", nameZh: "MV表演镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "mv_narrative", nameEn: "MV Narrative", nameZh: "MV叙事镜头", category: "short_video", mediaType: "video", storyPlan: "single" },
  // ── 悬疑/惊悚 ──
  { id: "thriller_chase", nameEn: "Thriller Chase", nameZh: "悬疑追逐", category: "short_video", mediaType: "video", storyPlan: "single" },
  { id: "thriller_reveal", nameEn: "Thriller Reveal", nameZh: "悬疑揭示", category: "short_video", mediaType: "video", storyPlan: "single" },
  // ── 商业广告专题 ──
  { id: "tech_product", nameEn: "Tech Product", nameZh: "科技产品", category: "product", mediaType: "image", storyPlan: "single" },
  { id: "food_ad", nameEn: "Food Ad", nameZh: "美食广告", category: "ad", mediaType: "image", storyPlan: "single" },
  // ── 教学/演示 ──
  { id: "tutorial_demo", nameEn: "Tutorial Demo", nameZh: "教学演示", category: "dialogue", mediaType: "video", storyPlan: "single" },
  { id: "product_tutorial", nameEn: "Product Tutorial", nameZh: "产品教程", category: "ad", mediaType: "video", storyPlan: "single" },
  // ── 连续调度扩展 ──
  { id: "chase_sequence", nameEn: "Chase Sequence", nameZh: "追逐序列", category: "continuous", mediaType: "video", storyPlan: "continuous" },
  { id: "dialogue_sequence", nameEn: "Dialogue Sequence", nameZh: "对话序列", category: "continuous", mediaType: "video", storyPlan: "continuous" },
  { id: "action_sequence", nameEn: "Action Sequence", nameZh: "动作序列", category: "continuous", mediaType: "video", storyPlan: "continuous" }
];

const CAMERA_MOVE_FAMILIES = [
  "push_in_motion",
  "pull_out_motion",
  "pan_motion",
  "tracking_motion",
  "orbit_motion",
  "crane_motion"
];

const MULTI_OBJECT_REQUIRED = [
  "symmetry_composition",
  "asymmetry_composition",
  "multi_object_composition",
  "product_compare",
  "duo_tension",
  "dialogue_duo",
  "faceoff_scene",
  "tracking_dialogue",
  "multi_person_dialogue",
  "chase_sequence",
  "dialogue_sequence",
  "action_sequence"
];

const SINGLE_SUBJECT_ONLY = [
  "beauty_closeup",
  "portrait_fashion",
  "solo_speaker",
  "talking_head_ad",
  "tutorial_demo",
  "white_bg_product",
  "mv_performance",
  "anime_emotional"
];

const CONTINUOUS_FAMILIES = [
  "continuous_single_scene",
  "multi_scene_continuity",
  "chase_sequence",
  "dialogue_sequence",
  "action_sequence"
];

const HIGH_INTENT_BASE_FAMILY_IDS = new Set([
  "product_hero",
  "product_center_display",
  "product_compare",
  "feature_breakdown",
  "logo_copy_layout",
  "product_in_hand",
  "floating_product_showcase",
  "white_bg_product",
  "dialogue_duo",
  "solo_speaker",
  "interview_layout",
  "social_vertical_ad",
  "selling_point_ad",
  "cta_landing_layout",
  "talking_head_ad",
  "app_promo_layout",
  "brand_promo_cover",
  "opening_shot",
  "character_entrance",
  "scene_push_forward",
  "emotional_peak",
  "turning_point_shot",
  "ending_closure",
  "poster_cover",
  "title_subtitle_layout",
  "portrait_fashion",
  "lifestyle_casual",
  "beauty_closeup",
  "food_showcase",
  "anime_action",
  "anime_emotional",
  "drama_opening",
  "drama_conflict",
  "drama_climax",
  "drama_ending",
  "thriller_chase",
  "thriller_reveal",
  "tech_product",
  "food_ad",
  "tutorial_demo",
  "product_tutorial"
]);

const FREE_DESCRIPTIONS: Record<string, { descriptionZh: string; descriptionEn: string }> = {
  product_hero: { descriptionZh: "适合快速生成单产品主视觉，居中主体，保留标题与 logo 区域。", descriptionEn: "A quick starter for single-product hero scenes with centered subject and reserved title/logo zones." },
  product_center_display: { descriptionZh: "适合产品居中陈列与干净背景展示，适合电商与演示图。", descriptionEn: "A centered product display starter for clean layouts, ideal for commerce and demo visuals." },
  product_compare: { descriptionZh: "适合两款产品左右对比，强调差异与信息并列。", descriptionEn: "A starter for side-by-side comparison of two products with balanced information zones." },
  feature_breakdown: { descriptionZh: "适合主产品加多个说明区域，突出功能与结构分层。", descriptionEn: "A starter for main product plus supporting explanation areas to highlight features and structure." },
  logo_copy_layout: { descriptionZh: "适合品牌标题、主文案与 logo 的标准广告布局。", descriptionEn: "A starter for standard brand layouts with title, main copy, and logo placement." },
  product_in_hand: { descriptionZh: "适合人物手持产品的近景展示与代入式构图。", descriptionEn: "A starter for close-up product-in-hand scenes with more immersive framing." },
  floating_product_showcase: { descriptionZh: "适合产品悬浮、科技感或高端展示风格。", descriptionEn: "A starter for floating product layouts with a sleek tech or premium feel." },
  white_bg_product: { descriptionZh: "适合白底产品图、详情页主图与标准电商展示。", descriptionEn: "A starter for clean white-background product shots used in product listings and e-commerce." },
  dialogue_duo: { descriptionZh: "适合两人对话、对视、交流的基础镜头结构。", descriptionEn: "A starter for two-person dialogue scenes with balanced conversational framing." },
  solo_speaker: { descriptionZh: "适合单人口播、叙述、独白类镜头。", descriptionEn: "A starter for solo speaking, narration, or monologue-focused shots." },
  interview_layout: { descriptionZh: "适合采访、问答、半正式访谈结构。", descriptionEn: "A starter for interview or Q&A layouts with semi-formal framing." },
  faceoff_scene: { descriptionZh: "适合人物对立、冲突、张力关系的基础站位。", descriptionEn: "A starter for confrontational scenes with strong opposing character positioning." },
  tracking_dialogue: { descriptionZh: "适合边走边说、移动对话、跟拍式交流镜头。", descriptionEn: "A starter for walking dialogue and moving conversational shots." },
  multi_person_dialogue: { descriptionZh: "适合三人及以上交流场景，强调站位与关系层次。", descriptionEn: "A starter for three-or-more person dialogue scenes with layered character placement." },
  social_vertical_ad: { descriptionZh: "适合短视频平台竖版广告与快速传播场景。", descriptionEn: "A starter for vertical social ads optimized for short-form platforms." },
  selling_point_ad: { descriptionZh: "适合突出一个核心卖点的产品宣传镜头。", descriptionEn: "A starter for ads focused on one strong product selling point." },
  cta_landing_layout: { descriptionZh: "适合带按钮感、引导感的行动召唤型结构。", descriptionEn: "A starter for layouts with strong call-to-action emphasis." },
  talking_head_ad: { descriptionZh: "适合人物正面对镜介绍产品或观点。", descriptionEn: "A starter for talking-head presentations facing the camera directly." },
  app_promo_layout: { descriptionZh: "适合 App、SaaS、界面展示型宣传结构。", descriptionEn: "A starter for app and SaaS promotional layouts featuring UI showcases." },
  brand_promo_cover: { descriptionZh: "适合品牌海报、宣传封面与品牌识别镜头。", descriptionEn: "A starter for brand covers, promo posters, and identity-focused visuals." },
  opening_shot: { descriptionZh: "适合视频或故事的第一镜，建立空间与基调。", descriptionEn: "A starter for opening shots that establish space and tone." },
  character_entrance: { descriptionZh: "适合角色首次出现与注意力导入。", descriptionEn: "A starter for character entrance moments and first-appearance framing." },
  scene_push_forward: { descriptionZh: "适合从静态过渡到更聚焦主体的推进结构。", descriptionEn: "A starter for scenes that transition into a more focused subject framing." },
  emotional_peak: { descriptionZh: "适合情绪升高、冲突升级、爆点瞬间的构图。", descriptionEn: "A starter for emotional peaks, tension spikes, and dramatic moments." },
  turning_point_shot: { descriptionZh: "适合故事转折、信息变化、人物决断时刻。", descriptionEn: "A starter for turning points, revelations, and character decisions." },
  ending_closure: { descriptionZh: "适合结尾、回收情绪、完成收束的镜头结构。", descriptionEn: "A starter for ending shots that resolve tone and close the scene." },
  push_in_motion: { descriptionZh: "适合从中景推进主体，增强关注与压迫感。", descriptionEn: "A starter for push-in motion that increases focus and dramatic intensity." },
  pull_out_motion: { descriptionZh: "适合从近到远拉开空间，建立环境与关系。", descriptionEn: "A starter for pull-out motion that reveals space and context." },
  pan_motion: { descriptionZh: "适合水平移动展示空间、角色或对象关系。", descriptionEn: "A starter for horizontal motion that reveals space or object relationships." },
  tracking_motion: { descriptionZh: "适合跟随主体移动，保持关注与节奏。", descriptionEn: "A starter for motion that follows the subject while maintaining focus." },
  orbit_motion: { descriptionZh: "适合围绕主体建立立体感与戏剧张力。", descriptionEn: "A starter for orbit-style motion around the subject with more spatial drama." },
  crane_motion: { descriptionZh: "适合垂直运动、建立气势与层级变化。", descriptionEn: "A starter for crane-style vertical motion with stronger sense of scale." },
  center_composition: { descriptionZh: "适合主体明确、视觉中心稳定的标准构图。", descriptionEn: "A starter for centered compositions with clear, stable focal placement." },
  symmetry_composition: { descriptionZh: "适合秩序感、仪式感、品牌感较强的画面。", descriptionEn: "A starter for symmetrical scenes with order, ritual, or premium visual balance." },
  asymmetry_composition: { descriptionZh: "适合更自然、更动态、更具故事感的画面布局。", descriptionEn: "A starter for asymmetrical layouts with more natural and narrative-driven balance." },
  multi_object_composition: { descriptionZh: "适合三对象以上的复杂布局与前后层次关系。", descriptionEn: "A starter for multi-object layouts with layered depth and structured placement." },
  continuous_single_scene: { descriptionZh: "适合在同一场景中保持角色和构图连续推进。", descriptionEn: "A starter for maintaining continuity within a single evolving scene." },
  multi_scene_continuity: { descriptionZh: "适合多镜头之间保持角色、方向与空间一致。", descriptionEn: "A starter for preserving character, direction, and spatial continuity across scenes." },
  poster_cover: { descriptionZh: "适合封面、海报、宣传主视觉构图。", descriptionEn: "A starter for poster covers and promotional key visual layouts." },
  title_subtitle_layout: { descriptionZh: "适合标题、副标题、口号、字幕占位的标准结构。", descriptionEn: "A starter for title, subtitle, slogan, and caption-driven layouts." }
  ,portrait_fashion: { descriptionZh: "适合时尚人物写真、大片感人像摄影。", descriptionEn: "A starter for fashion portraits and editorial-style character photography." }
  ,lifestyle_casual: { descriptionZh: "适合生活随拍、人物环境融合构图。", descriptionEn: "A starter for casual lifestyle shots with natural environment integration." }
  ,beauty_closeup: { descriptionZh: "适合美妆、护肤品、人物面部特写。", descriptionEn: "A starter for beauty and skincare closeups with refined detail focus." }
  ,food_showcase: { descriptionZh: "适合美食展示、餐饮宣传、料理特写。", descriptionEn: "A starter for food photography with rich texture and depth." }
  ,travel_landscape: { descriptionZh: "适合旅行风景、目的地宣传、户外场景。", descriptionEn: "A starter for travel and landscape photography with environmental scale." }
  ,lifestyle_scene: { descriptionZh: "适合生活场景、人物环境叙事、日常记录。", descriptionEn: "A starter for lifestyle scenes with subject-environment storytelling." }
  ,anime_action: { descriptionZh: "适合动漫动作戏、打斗场面、能量爆发场景。", descriptionEn: "A starter for anime action sequences and high-energy combat scenes." }
  ,anime_emotional: { descriptionZh: "适合动漫情绪特写、人物内心戏、关键时刻。", descriptionEn: "A starter for anime emotional beats and character focus moments." }
  ,anime_landscape: { descriptionZh: "适合动漫风格环境镜头、场景建立、背景展示。", descriptionEn: "A starter for anime-style environment and establishing scene visuals." }
  ,urban_scene: { descriptionZh: "适合城市街景、夜间都市、户外环境镜头。", descriptionEn: "A starter for urban cinematography and city environment shots." }
  ,drama_opening: { descriptionZh: "适合剧情开场、人物出场建立、氛围铺垫。", descriptionEn: "A starter for drama openings that establish character and tone." }
  ,drama_conflict: { descriptionZh: "适合剧情冲突、人物对立、矛盾激化场面。", descriptionEn: "A starter for dramatic conflict and interpersonal tension scenes." }
  ,drama_climax: { descriptionZh: "适合剧情高潮、情绪顶点、关键转折时刻。", descriptionEn: "A starter for dramatic climax and peak emotional moments." }
  ,drama_ending: { descriptionZh: "适合剧情结局、情绪收尾、叙事封闭。", descriptionEn: "A starter for drama endings with emotional resolution and closure." }
  ,mv_performance: { descriptionZh: "适合MV表演镜头、歌手出镜、节奏感强的视觉。", descriptionEn: "A starter for music video performance shots with strong rhythm." }
  ,mv_narrative: { descriptionZh: "适合MV叙事镜头、故事线、情绪驱动画面。", descriptionEn: "A starter for narrative-driven music video storytelling." }
  ,thriller_chase: { descriptionZh: "适合悬疑追逐、紧张逃跑、高压动作场景。", descriptionEn: "A starter for thriller chase sequences with high tension." }
  ,thriller_reveal: { descriptionZh: "适合悬疑揭示、真相浮现、心理转折时刻。", descriptionEn: "A starter for thriller reveal moments and psychological turning points." }
  ,tech_product: { descriptionZh: "适合科技产品展示、数码设备、工业设计感。", descriptionEn: "A starter for technology product photography with clean precision." }
  ,food_ad: { descriptionZh: "适合美食广告、餐厅宣传、食品品牌形象。", descriptionEn: "A starter for food advertising with appetizing texture and depth." }
  ,tutorial_demo: { descriptionZh: "适合教学演示、操作说明、知识传递镜头。", descriptionEn: "A starter for tutorial and instructional demonstration shots." }
  ,product_tutorial: { descriptionZh: "适合产品教程、使用展示、功能说明视频。", descriptionEn: "A starter for product tutorial and feature demonstration videos." }
  ,chase_sequence: { descriptionZh: "适合多镜追逐序列、连续追逐调度、动态场景组合。", descriptionEn: "A multi-shot starter for chase sequence continuity." }
  ,dialogue_sequence: { descriptionZh: "适合多镜对话序列、连续对话调度、情绪递进。", descriptionEn: "A multi-shot starter for dialogue sequence continuity." }
  ,action_sequence: { descriptionZh: "适合多镜动作序列、连续动作调度、打斗/运动组合。", descriptionEn: "A multi-shot starter for action sequence continuity." }
};

// --- Spec→Payload helpers (template-payload-schema-v2) ---
function layer(
  type: string,
  z: number,
  kf0: { x: number; y: number; w: number; h: number },
  continuityId?: string
): Omit<Layer, "id"> {
  const notes = continuityId ? `@continuityId:${continuityId}` : "";
  return {
    type,
    shape: "rect",
    look: "",
    z,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, x: kf0.x, y: kf0.y, w: kf0.w, h: kf0.h, rot: 0 },
      { t: 1, x: kf0.x, y: kf0.y, w: kf0.w, h: kf0.h, rot: 0 }
    ],
    notes,
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function mkScene(
  id: string,
  name: string,
  mediaType: "image" | "video",
  layers: Omit<Layer, "id">[],
  opts: {
    shot?: string;
    movement?: string;
    notes?: string;
  } = {}
): Scene {
  const genIds = (prefix: string) =>
    layers.map((_, i) => ({ ...layers[i], id: `${prefix}${i + 1}` })) as Layer[];
  let notes = `media: ${mediaType}\ngenmode: pro`;
  if (opts.notes) notes = opts.notes;
  return {
    id,
    name,
    index: 1,
    duration_s: 6,
    transitionType: "cut",
    camera: {
      shot: (opts.shot ?? (mediaType === "video" ? "medium" : "")) as Camera["shot"],
      movement: (opts.movement ?? (mediaType === "video" ? "static" : "")) as Camera["movement"],
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
      ]
    } as Camera,
    lighting: { time: "", key_dir: "", mood: "" } as Lighting,
    layers: genIds("layer"),
    config: { mediaMode: mediaType, compiler: mediaType === "video" ? "v2" : "v1" },
    notes
  };
}

// 隐藏字段分配表：family + variant → notes 处理函数列表
type NotesTransform = (notes: string, shot: string, movement: string) => string;

const HIDDEN_FIELD_MAP: Record<string, Partial<Record<TemplateVariant, NotesTransform[]>>> = {
  // ── 对话类 ──────────────────────────────────────────────
  dialogue_duo: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyCameraLanguage(n, "drama_close"),
                     (n) => applyProShotRecipe(n, "emotion_push")],
    multi_object:    [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyDirectorStylePack(n, "intimate_observation"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "relationship_standoff")],
  },
  faceoff_scene: {
    cinematic:       [(n) => applyCameraLanguage(n, "suspense_observe"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "suspense_watch")],
    advanced_motion: [(n) => applyCameraLanguage(n, "thriller_lowkey"),
                     (n) => applyProShotRecipe(n, "suspense_watch")],
    multi_object:    [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "relationship_standoff")],
  },
  interview_layout: {
    cinematic:       [(n) => applyCameraLanguage(n, "handheld_real"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyCameraLanguage(n, "documentary"),
                     (n) => applyProShotRecipe(n, "emotion_push")],
    multi_object:    [(n) => applyProShotRecipe(n, "steady_dialogue"),
                     (n) => applyDirectorStylePack(n, "intimate_observation")],
  },
  solo_speaker: {
    cinematic:       [(n) => applyCameraLanguage(n, "commercial_ad"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n) => applyProShotRecipe(n, "emotion_push")],
    multi_object:    [(n) => applyProShotRecipe(n, "hero_entry"),
                     (n) => applyDirectorStylePack(n, "commercial_spectacle"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
  },
  tracking_dialogue: {
    cinematic:       [(n) => applyCameraLanguage(n, "handheld_real"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyProShotRecipe(n, "character_trail"),
                     (n) => applyCameraLanguage(n, "documentary")],
    multi_object:    [(n) => applyProShotRecipe(n, "character_trail"),
                     (n) => applyDirectorStylePack(n, "intimate_observation"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
  },
  multi_person_dialogue: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyCameraLanguage(n, "drama_close")],
    multi_object:    [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "relationship_standoff")],
  },
  talking_head_ad: {
    cinematic:       [(n) => applyCameraLanguage(n, "commercial_ad"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n) => applyProShotRecipe(n, "emotion_push")],
    multi_object:    [(n) => applyProShotRecipe(n, "hero_entry"),
                     (n) => applyDirectorStylePack(n, "commercial_spectacle"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
  },

  // ── 短视频类 ────────────────────────────────────────────
  emotional_peak: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "emotion_push")],
    advanced_motion: [(n) => applyCameraLanguage(n, "drama_close"),
                     (n) => applyProShotRecipe(n, "truth_reveal")],
    multi_object:    [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "truth_reveal")],
  },
  character_entrance: {
    cinematic:       [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
    advanced_motion: [(n) => applyCameraLanguage(n, "anime_dynamic"),
                     (n) => applyProShotRecipe(n, "hero_entry")],
    multi_object:    [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
  },
  turning_point_shot: {
    cinematic:       [(n) => applyCameraLanguage(n, "reveal_focus"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "truth_reveal")],
    advanced_motion: [(n) => applyCameraLanguage(n, "suspense_observe"),
                     (n) => applyProShotRecipe(n, "mystery_reveal")],
    multi_object:    [(n) => applyProShotRecipe(n, "truth_reveal"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "mystery_reveal")],
  },
  opening_shot: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_wide"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n) => applyProShotRecipe(n, "hero_entry")],
    multi_object:    [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyDirectorStylePack(n, "poetic_restraint"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
  },
  ending_closure: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
    advanced_motion: [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyCameraLanguage(n, "cinematic_dark")],
    multi_object:    [(n) => applyProShotRecipe(n, "dream_memory"),
                     (n) => applyDirectorStylePack(n, "poetic_restraint"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
  },
  scene_push_forward: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "emotion_push")],
    advanced_motion: [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyCameraLanguage(n, "drama_tension")],
    multi_object:    [(n) => applyProShotRecipe(n, "rhythm_transition"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
  },

  // ── 镜头运动类 ──────────────────────────────────────────
  push_in_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "emotion_push")],
    advanced_motion: [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyCameraLanguage(n, "drama_tension")],
    multi_object:    [(n) => applyProShotRecipe(n, "truth_reveal"),
                     (n) => applyDirectorStylePack(n, "architectural_tension")],
  },
  pull_out_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_wide"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
    advanced_motion: [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyCameraLanguage(n, "cinematic_dark")],
    multi_object:    [(n) => applyProShotRecipe(n, "dream_memory"),
                     (n) => applyDirectorStylePack(n, "poetic_restraint")],
  },
  pan_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "neon_city"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
    advanced_motion: [(n) => applyProShotRecipe(n, "rhythm_transition"),
                     (n) => applyCameraLanguage(n, "anime_dynamic")],
    multi_object:    [(n) => applyProShotRecipe(n, "cyber_neon"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit")],
  },
  tracking_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "handheld_real"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyProShotRecipe(n, "character_trail"),
                     (n) => applyCameraLanguage(n, "documentary")],
    multi_object:    [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit")],
  },
  orbit_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "premium_commercial")],
    advanced_motion: [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyCameraLanguage(n, "luxury_light")],
    multi_object:    [(n) => applyProShotRecipe(n, "premium_commercial"),
                     (n) => applyDirectorStylePack(n, "commercial_spectacle")],
  },
  crane_motion: {
    cinematic:       [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
    advanced_motion: [(n) => applyProShotRecipe(n, "hero_entry"),
                     (n) => applyCameraLanguage(n, "cinematic_wide")],
    multi_object:    [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyDirectorStylePack(n, "industrial_epic")],
  },

  // ── 产品 / 图片类 ───────────────────────────────────────
  product_hero: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy")],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "clean_layering"])],
  },
  product_center_display: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["center_pressure", "material_focus"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["center_pressure", "material_focus", "glass_glow"])],
  },
  product_compare: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["clean_layering", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "eyeline_tension"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "material_focus", "glass_glow"])],
  },
  feature_breakdown: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["clean_layering", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "depth_split"])],
  },
  logo_copy_layout: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "cinematic_air"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "ad_luxury"),
                     (n) => applyImageProEffects(n, ["center_pressure", "foreground_occlusion", "cinematic_air"])],
  },
  product_in_hand: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "subject_env_link"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_dark"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "foreground_occlusion"])],
  },
  floating_product_showcase: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["depth_split", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["glass_glow", "depth_split"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["glass_glow", "depth_split", "cinematic_air"])],
  },
  white_bg_product: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "studio_highkey"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "clean_layering"])],
  },
  poster_cover: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["depth_split", "foreground_occlusion"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["depth_split", "cinematic_air"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "dream_portrait"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["dream_haze", "silhouette_rim", "cinematic_air"])],
  },
  title_subtitle_layout: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["depth_split", "cinematic_air"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n) => applyImageProEffects(n, ["depth_split", "foreground_occlusion", "cinematic_air"])],
  },
  social_vertical_ad: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyCameraLanguage(n, "social_direct"),
                     (n) => applyImageProEffects(n, ["center_pressure"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyCameraLanguage(n, "studio_highkey"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering", "material_focus"])],
  },
  selling_point_ad: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "subject_env_link"])],
  },
  cta_landing_layout: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "subject_env_link"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyCameraLanguage(n, "ad_clean"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering", "foreground_occlusion"])],
  },
  app_promo_layout: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["clean_layering", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["clean_layering", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyCameraLanguage(n, "studio_highkey"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "clean_layering", "glass_glow"])],
  },
  brand_promo_cover: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "ad_luxury"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "cinematic_air"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "cinematic_air", "silhouette_rim"])],
  },
  center_composition: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "poster_center"),
                     (n) => applyImageProEffects(n, ["center_pressure", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["center_pressure", "depth_split"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n) => applyImageProEffects(n, ["center_pressure", "depth_split", "cinematic_air"])],
  },
  asymmetry_composition: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "depth_split"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyCameraLanguage(n, "cinematic_dark"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "foreground_occlusion", "depth_split"])],
  },
  symmetry_composition: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "eyeline_tension"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "duo_tension"),
                     (n) => applyCameraLanguage(n, "drama_tension"),
                     (n) => applyImageProEffects(n, ["left_right_standoff", "eyeline_tension", "depth_split"])],
  },
  multi_object_composition: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["depth_split", "foreground_occlusion"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n) => applyImageProEffects(n, ["depth_split", "foreground_occlusion", "cinematic_air"])],
  },
  // ── 人物写真/时尚 ───────────────────────────────────────
  portrait_fashion: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["depth_split", "foreground_occlusion"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "dream_portrait"),
                     (n) => applyImageProEffects(n, ["silhouette_rim", "dream_haze"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "dream_portrait"),
                     (n) => applyCameraLanguage(n, "luxury_light"),
                     (n) => applyImageProEffects(n, ["silhouette_rim", "dream_haze", "cinematic_air"])],
  },
  lifestyle_casual: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "subject_env_link"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "subject_env_link"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyCameraLanguage(n, "handheld_real"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "foreground_occlusion", "subject_env_link"])],
  },
  beauty_closeup: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "clean_layering"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "rim_light_focus"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "rim_light_focus"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "clean_layering"])],
  },
  // ── 美食/旅行/生活 ─────────────────────────────────────
  food_showcase: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["material_focus", "glass_glow", "foreground_occlusion"])],
  },
  travel_landscape: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "cinematic_air"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyCameraLanguage(n, "cinematic_wide"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split", "cinematic_air"])],
  },
  lifestyle_scene: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyImageProEffects(n, ["subject_env_link", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "subject_env_link"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "handheld_real"),
                     (n) => applyImageProEffects(n, ["foreground_occlusion", "subject_env_link", "cinematic_air"])],
  },
  // ── 动漫 ───────────────────────────────────────────────
  anime_action: {
    cinematic:       [(n) => applyCameraLanguage(n, "anime_dynamic"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
    advanced_motion: [(n) => applyCameraLanguage(n, "anime_battle"),
                     (n) => applyProShotRecipe(n, "bullet_highlight")],
    multi_object:    [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "first_person_impact")],
  },
  anime_emotional: {
    cinematic:       [(n) => applyCameraLanguage(n, "anime_pose"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "emotion_push")],
    advanced_motion: [(n) => applyCameraLanguage(n, "anime_dynamic"),
                     (n) => applyProShotRecipe(n, "truth_reveal")],
    multi_object:    [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyDirectorStylePack(n, "intimate_observation"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "truth_reveal")],
  },
  anime_landscape: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "lonely_env"),
                     (n) => applyCameraLanguage(n, "anime_dynamic"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "anime_pose"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "cinematic_air"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "cinematic_still"),
                     (n) => applyCameraLanguage(n, "anime_battle"),
                     (n) => applyImageProEffects(n, ["environment_wrap", "depth_split", "foreground_occlusion"])],
  },
  // ── 建筑/空间 ──────────────────────────────────────────
  urban_scene: {
    cinematic:       [(n) => applyCameraLanguage(n, "neon_city"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
    advanced_motion: [(n) => applyProShotRecipe(n, "cyber_neon"),
                     (n) => applyCameraLanguage(n, "neon_city")],
    multi_object:    [(n) => applyProShotRecipe(n, "cyber_neon"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
  },
  // ── 网剧剧情 ───────────────────────────────────────────
  drama_opening: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_wide"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyCameraLanguage(n, "hero_entry"),
                     (n) => applyProShotRecipe(n, "hero_entry")],
    multi_object:    [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
  },
  drama_conflict: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "relationship_standoff")],
    advanced_motion: [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyCameraLanguage(n, "drama_close")],
    multi_object:    [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "suspense_watch")],
  },
  drama_climax: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "truth_reveal")],
    advanced_motion: [(n) => applyProShotRecipe(n, "truth_reveal"),
                     (n) => applyCameraLanguage(n, "drama_close")],
    multi_object:    [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "truth_reveal")],
  },
  drama_ending: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_dark"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
    advanced_motion: [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyCameraLanguage(n, "cinematic_soft")],
    multi_object:    [(n) => applyProShotRecipe(n, "dream_memory"),
                     (n) => applyDirectorStylePack(n, "poetic_restraint"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
  },
  // ── 音乐MV ─────────────────────────────────────────────
  mv_performance: {
    cinematic:       [(n) => applyCameraLanguage(n, "neon_city"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
    advanced_motion: [(n) => applyProShotRecipe(n, "rhythm_transition"),
                     (n) => applyCameraLanguage(n, "anime_dynamic")],
    multi_object:    [(n) => applyProShotRecipe(n, "cyber_neon"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "rhythm_transition")],
  },
  mv_narrative: {
    cinematic:       [(n) => applyCameraLanguage(n, "cinematic_soft"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyProShotRecipe(n, "character_trail"),
                     (n) => applyCameraLanguage(n, "cinematic_dark")],
    multi_object:    [(n) => applyProShotRecipe(n, "lonely_space"),
                     (n) => applyDirectorStylePack(n, "poetic_restraint"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "dream_memory")],
  },
  // ── 悬疑/惊悚 ──────────────────────────────────────────
  thriller_chase: {
    cinematic:       [(n) => applyCameraLanguage(n, "thriller_lowkey"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "suspense_watch")],
    advanced_motion: [(n) => applyProShotRecipe(n, "first_person_impact"),
                     (n) => applyCameraLanguage(n, "suspense_observe")],
    multi_object:    [(n) => applyProShotRecipe(n, "first_person_impact"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "mystery_reveal")],
  },
  thriller_reveal: {
    cinematic:       [(n) => applyCameraLanguage(n, "suspense_observe"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "mystery_reveal")],
    advanced_motion: [(n) => applyProShotRecipe(n, "mystery_reveal"),
                     (n) => applyCameraLanguage(n, "noir_shadow")],
    multi_object:    [(n) => applyProShotRecipe(n, "truth_reveal"),
                     (n) => applyDirectorStylePack(n, "architectural_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "suspense_watch")],
  },
  // ── 商业广告专题 ───────────────────────────────────────
  tech_product: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "studio_lowkey"),
                     (n) => applyImageProEffects(n, ["material_focus", "depth_split"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["glass_glow", "depth_split"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_dark"),
                     (n) => applyImageProEffects(n, ["glass_glow", "depth_split", "clean_layering"])],
  },
  food_ad: {
    cinematic:       [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "foreground_occlusion"])],
    advanced_motion: [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyImageProEffects(n, ["material_focus", "subject_env_link"])],
    multi_object:    [(n, s) => applyImageClassicMode(n, s, "premium_product"),
                     (n) => applyCameraLanguage(n, "product_glossy"),
                     (n) => applyImageProEffects(n, ["material_focus", "foreground_occlusion", "subject_env_link"])],
  },
  // ── 教学/演示 ──────────────────────────────────────────
  tutorial_demo: {
    cinematic:       [(n) => applyCameraLanguage(n, "handheld_real"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyProShotRecipe(n, "product_showcase"),
                     (n) => applyCameraLanguage(n, "documentary")],
    multi_object:    [(n) => applyProShotRecipe(n, "steady_dialogue"),
                     (n) => applyDirectorStylePack(n, "intimate_observation"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
  },
  product_tutorial: {
    cinematic:       [(n) => applyCameraLanguage(n, "commercial_ad"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "premium_commercial")],
    advanced_motion: [(n) => applyProShotRecipe(n, "product_showcase"),
                     (n) => applyCameraLanguage(n, "product_glossy")],
    multi_object:    [(n) => applyProShotRecipe(n, "premium_commercial"),
                     (n) => applyDirectorStylePack(n, "commercial_spectacle"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "premium_commercial")],
  },
  // ── 连续调度扩展 ───────────────────────────────────────
  chase_sequence: {
    cinematic:       [(n) => applyCameraLanguage(n, "thriller_lowkey"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "character_trail")],
    advanced_motion: [(n) => applyProShotRecipe(n, "first_person_impact"),
                     (n) => applyCameraLanguage(n, "suspense_observe")],
    multi_object:    [(n) => applyProShotRecipe(n, "first_person_impact"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "mystery_reveal")],
  },
  dialogue_sequence: {
    cinematic:       [(n) => applyCameraLanguage(n, "drama_tension"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "steady_dialogue")],
    advanced_motion: [(n) => applyProShotRecipe(n, "emotion_push"),
                     (n) => applyCameraLanguage(n, "drama_close")],
    multi_object:    [(n) => applyProShotRecipe(n, "relationship_standoff"),
                     (n) => applyDirectorStylePack(n, "intimate_observation"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "relationship_standoff")],
  },
  action_sequence: {
    cinematic:       [(n) => applyCameraLanguage(n, "anime_dynamic"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "hero_entry")],
    advanced_motion: [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyCameraLanguage(n, "anime_battle")],
    multi_object:    [(n) => applyProShotRecipe(n, "bullet_highlight"),
                     (n) => applyDirectorStylePack(n, "kinetic_pursuit"),
                     (n, s, m) => applyVideoClassicMode(n, s, m, "first_person_impact")],
  },
};

/** Build scene from spec (variant rules + payload schema) */
function buildSceneFromSpec(
  familyId: string,
  variant: TemplateVariant,
  family: (typeof FAMILIES)[0]
): Scene {
  const mediaType = family.mediaType;
  let shot = "medium";
  let movement: string = mediaType === "video" ? "static" : "";

  // 按 variant 设置基础 shot/movement
  if (variant === "advanced_motion" && mediaType === "video") movement = "slow_push_in";

  // 基础 layers（已删除 Background 全画布层）
  const baseLayers: Omit<Layer, "id">[] = [
    layer("Subject", 20, { x: 50, y: 50, w: 28, h: 36 })
  ];
  const layers: Omit<Layer, "id">[] = variant === "multi_object"
    ? [
        layer("Object 2", 18, { x: 30, y: 45, w: 18, h: 24 }),
        layer("Subject",  20, { x: 50, y: 50, w: 28, h: 36 }),
        layer("Object 3", 18, { x: 70, y: 45, w: 18, h: 24 })
      ]
    : baseLayers;

  // 基础 notes
  let notes = `media: ${mediaType}\ngenmode: pro`;

  if (variant === "free_starter") {
    if (mediaType === "image") {
      const imageDefaultClassic: Record<string, string> = {
        product: "premium_product",
        composition: "poster_center",
        cover_poster: "poster_center",
        ad: "poster_center",
        social: "poster_center"
      };
      const classicId = imageDefaultClassic[family.category] ?? "poster_center";
      notes = applyImageClassicMode(notes, shot, classicId);
    } else {
      const videoDefaultLang: Record<string, string> = {
        dialogue: "realistic_restrained",
        ad: "commercial_ad",
        social: "commercial_ad",
        short_video: "cinematic_narrative",
        camera_move: "cinematic_narrative",
        continuous: "cinematic_narrative"
      };
      const langId = videoDefaultLang[family.category] ?? "cinematic_narrative";
      notes = applyCameraLanguage(notes, langId);
    }
  }

  // 应用隐藏字段（按分配表）
  const transforms = HIDDEN_FIELD_MAP[familyId]?.[variant] ?? [];
  for (const fn of transforms) {
    notes = fn(notes, shot, movement);
  }

  // free_starter 不带任何隐藏字段（已在上面 map 里没有定义，所以 transforms 为空）
  // cinematic/advanced_motion 没有命中 map 的 family 默认加基础镜头语言
  if (transforms.length === 0 && variant === "cinematic" && mediaType === "video") {
    notes = applyCameraLanguage(notes, "cinematic_soft");
  }

  const sceneId = `tpl_${familyId}_${variant}`;
  const scene = mkScene(sceneId, `${family.nameEn} - ${variant}`, mediaType, layers, {
    shot,
    movement: movement as Camera["movement"],
    notes
  });
  return scene;
}

function variantRatio(v: TemplateVariant): UnifiedTemplate["ratio"] {
  if (v === "vertical_9_16") return "9:16";
  if (v === "horizontal_16_9") return "16:9";
  return "16:9";
}

/** Template cost: 0=free, 1=basic, 2=advanced, 3=director/continuity/multi-shot. */
function templateCost(family: (typeof FAMILIES)[0], variant: TemplateVariant): number {
  void family;
  if (variant === "free_starter") return 0;
  if (variant === "vertical_9_16" || variant === "horizontal_16_9") return 1;
  if (variant === "cinematic" || variant === "advanced_motion") return 2;
  if (variant === "multi_object") return 3;
  return 1;
}

function computeAdvancedTags(family: (typeof FAMILIES)[0], variant: TemplateVariant, cost: number): string[] {
  const tags: string[] = [];
  if (cost >= 2) tags.push("advanced_camera");
  if (family.category === "continuous") tags.push("continuity");
  if (family.storyPlan === "multi_cam") tags.push("multi_scene");
  if (variant === "cinematic") tags.push("cinematic_mode");
  if (variant === "advanced_motion") tags.push("drama_mode");
  if (family.category === "dialogue" && variant === "advanced_motion") tags.push("director_preset");
  if (
    ["cinematic", "advanced_motion", "multi_object"].includes(variant) &&
    (HIDDEN_FIELD_MAP[family.id]?.[variant]?.length ?? 0) > 0
  ) {
    tags.push("Pro 专属解锁");
    tags.push("Pro Unlocked");
  }
  return tags;
}

const VARIANT_LABELS: Record<TemplateVariant, { en: string; zh: string }> = {
  free_starter: { en: "Free Starter", zh: "免费起步版" },
  vertical_9_16: { en: "Vertical 9:16", zh: "竖版短视频版" },
  horizontal_16_9: { en: "Horizontal 16:9", zh: "横版标准版" },
  cinematic: { en: "Cinematic", zh: "电影质感版" },
  multi_object: { en: "Multi-Object", zh: "多对象复杂版" },
  advanced_motion: { en: "Advanced Motion", zh: "高级运动版" }
};

let _cached: UnifiedTemplate[] | null = null;

/** 400 base templates (spec-driven). Use with index + register400. */
export function getTemplateLibrary600Base(): UnifiedTemplate[] {
  if (_cached) return _cached;
  const out: UnifiedTemplate[] = [];
  for (const family of FAMILIES) {
    if (!HIGH_INTENT_BASE_FAMILY_IDS.has(family.id)) continue;
    for (const variant of VARIANTS) {
      // ── 语义无效过滤规则 ──────────────────────────────
      if (
        MULTI_OBJECT_REQUIRED.includes(family.id) &&
        (variant === "free_starter" || variant === "vertical_9_16" || variant === "horizontal_16_9")
      ) continue;
      if (SINGLE_SUBJECT_ONLY.includes(family.id) && variant === "multi_object") continue;
      if (
        CAMERA_MOVE_FAMILIES.includes(family.id) &&
        !["cinematic", "advanced_motion", "multi_object"].includes(variant)
      ) continue;
      if (
        CONTINUOUS_FAMILIES.includes(family.id) &&
        !["advanced_motion", "multi_object"].includes(variant)
      ) continue;
      // ── 过滤结束，以下正常生成 ─────────────────────────

      const isFree = variant === "free_starter";
      const cost = templateCost(family, variant);
      const scene = buildSceneFromSpec(family.id, variant, family);
      const id = `tpl400_${family.id}_${variant}`;
      const lbl = VARIANT_LABELS[variant];
      const name = `${family.nameEn} / ${lbl.en}`;
      const nameZh = `${family.nameZh}｜${lbl.zh}`;
      const freeDesc = FREE_DESCRIPTIONS[family.id];
      const desc = isFree && freeDesc
        ? freeDesc.descriptionEn
        : `${family.nameEn} template, ${lbl.en} variant. ${family.mediaType === "video" ? "Video" : "Image"} format.`;
      const descZh = isFree && freeDesc ? freeDesc.descriptionZh : undefined;
      const tags = [family.category, family.id, variant, family.mediaType];
      if (isFree) tags.push("free");
      const advancedTags = computeAdvancedTags(family, variant, cost);
      out.push({
        id,
        name,
        nameZh,
        family: family.nameEn,
        familyZh: family.nameZh,
        variant,
        category: family.category,
        description: desc,
        descriptionZh: descZh,
        tags,
        mediaType: family.mediaType,
        storyPlan: family.storyPlan,
        ratio: variantRatio(variant),
        isFree,
        cost,
        popularity: 70,
        isFeatured: isFree,
        scene,
        sceneDefaults: {},
        objects: [],
        exportDefaults: {},
        advancedTags: advancedTags.length > 0 ? advancedTags : undefined
      });
    }
  }
  _cached = out;
  return out;
}

/** Backward compat: same as getTemplateLibrary400 for base 400. */
export function getTemplateLibrary400(): UnifiedTemplate[] {
  return getTemplateLibrary600Base();
}

export function getFreeCount600(): number {
  return getTemplateLibrary600Base().filter((t) => t.isFree).length;
}

export function getTotalCount600(): number {
  return getTemplateLibrary600Base().length + 200; // base + webdrama/anime continuity
}

/** Backward compat: free count in base 400. */
export function getFreeCount(): number {
  return getFreeCount600();
}

/** Backward compat: total in base 400 only. */
export function getTotalCount(): number {
  return getTemplateLibrary600Base().length;
}
