/**
 * compileV3.ts — ScenePilotix V3 Prompt Compiler (v0.4 Refactored)
 *
 * v0.4 Changes:
 * - Structural refactoring for maintainability
 * - Extracted field resolution into resolveAllFields()
 * - Extracted segment builders into individual functions
 * - Cleaned up patch artifacts
 *
 * Fixed 14-segment output order:
 *  1  STYLE          render style + director intent
 *  2  CAMERA         shot size + lens + angle
 *  3  MOTION         movement + duration (video only)
 *  4  SUBJECT_BASE   what the subject is + spatial position
 *  5  SUBJECT_COSTUME material / clothing / surface finish
 *  6  SUBJECT_PROPS  accessories / props
 *  7  SUBJECT_ACTION action / pose / movement
 *  8  SUBJECT_STATE  expression / emotion / condition
 *  9  SUBJECT_DETAIL micro-detail / texture / surface
 * 10  COMPOSITION    framing + layout + negative space
 * 11  LIGHTING       key light + temperature + specials
 * 12  ENVIRONMENT    background + location
 * 13  MOOD           atmosphere / tone (never mixed with style)
 * 14  TECHNICAL      quality suffix — always last
 *
 * Optional 15th segment (machine-readable, for debugging/template injection):
 * 15  STRUCTURE_GUIDE object count, spatial relations, motion path
 */

import type { Lang } from "../i18n";
import type { Scene } from "../model";

// ── Types ──────────────────────────────────────────────────────────────────
export type V3Input = {
  scene: Scene;
  lang: Lang;
  mediaMode: "image" | "video";
  aspectRatio?: string;
  platform?: GenerationPlatform;
};

/**
 * Target platform for prompt adaptation
 * Different platforms have different prompt syntax preferences
 */
export type GenerationPlatform = 
  | "midjourney"      // Midjourney v6+
  | "runway"          // Runway Gen-2/Gen-3
  | "pika"            // Pika Labs
  | "stable-diffusion" // SDXL / SD 1.5
  | "flux"            // Flux models
  | "generic";        // Default universal format

/**
 * Platform adapter interface
 */
interface PlatformAdapter {
  /** Format the final prompt for this platform */
  formatPrompt(rawPrompt: string, input: V3Input): string;
  /** Optional: preprocess input before compilation */
  preprocessInput?(input: V3Input): V3Input;
}

export type ValueSource = "user" | "template" | "director" | "default";

export type ResolvedValue = {
  value: string;
  source: ValueSource;
};

/**
 * All resolved fields from scene notes and camera/lighting config
 */
export type ResolvedFields = {
  shotSize: ResolvedValue;
  camAngle: ResolvedValue;
  camMove: ResolvedValue;
  duration: number;
  directorPack: ResolvedValue;
  narrative: ResolvedValue;
  tension: ResolvedValue;
  renderStyle: ResolvedValue;
  focalLength: ResolvedValue;
  dof: ResolvedValue;
  bgPreset: ResolvedValue;
  envMood: ResolvedValue;
  keyTimeRaw: string;
  keyDir: ResolvedValue;
  keyMood: ResolvedValue;
  colorTemp: ResolvedValue;
  specLightRaw: string;
  colorGrade: ResolvedValue;
  filmLook: ResolvedValue;
  postProcess: ResolvedValue;
  keyTimeFinal: string;
  specLightFinal: string;
};

// ── Marker reader ──────────────────────────────────────────────────────────
function mark(notes: string, key: string): string {
  const line = (notes ?? "").split("\n").find(l => l.trim().startsWith(key + ":"));
  return line ? line.trim().slice(key.length + 1).trim() : "";
}

// ── Conflict resolver with priority rules ─────────────────────────────────
/**
 * Priority: user > template > director > default
 * Returns both value and source for debugging/tracking
 */
function resolveWithPriority(
  userValue?: string,
  templateValue?: string,
  directorValue?: string,
  defaultValue: string = ""
): ResolvedValue {
  const normalize = (v?: string) => {
    if (!v) return "";
    const trimmed = v.trim();
    if (trimmed === "未定义" || trimmed === "未选择" || trimmed === "undefined") return "";
    return trimmed;
  };

  const user = normalize(userValue);
  if (user) return { value: user, source: "user" };

  const template = normalize(templateValue);
  if (template) return { value: template, source: "template" };

  const director = normalize(directorValue);
  if (director) return { value: director, source: "director" };

  return { value: defaultValue, source: "default" };
}

// ── Position: x/y/w → concise natural language ────────────────────────────
function positionPhrase(x: number, y: number, w: number, lang: Lang): string {
  const h =
    x < 28 ? "far left" :
    x < 42 ? "left of center" :
    x < 58 ? "centered" :
    x < 72 ? "right of center" :
    "far right";
  const v =
    y < 30 ? "upper" :
    y < 55 ? "mid" :
    "lower";
  const prominence =
    w < 15 ? "small in frame" :
    w < 28 ? "occupying about a third of the frame" :
    w < 45 ? "prominently sized" :
    "filling most of the frame";
  if (lang === "zh") {
    const hZh =
      h === "far left" ? "画面最左" :
      h === "left of center" ? "偏左" :
      h === "centered" ? "居中" :
      h === "right of center" ? "偏右" :
      "画面最右";
    const vZh =
      v === "upper" ? "上方" :
      v === "mid" ? "中部" :
      "下方";
    const pZh =
      prominence === "small in frame" ? "画面占比小" :
      prominence === "occupying about a third of the frame" ? "约占画面三分之一" :
      prominence === "prominently sized" ? "主体占比较突出" :
      "占据画面大部分";
    return `${hZh}，${vZh}，${pZh}`;
  }

  return `${h}, ${v}-frame, ${prominence}`;
}

// ── De-duplicate overlapping specLight / keyLightTime values ──────────────
function dedupeLight(keyLightTime: string, specLight: string): [string, string] {
  if (specLight === "golden_hour" && keyLightTime === "golden_hour") return [keyLightTime, ""];
  if (specLight === "golden_hour" && keyLightTime !== "") return [keyLightTime, specLight];
  if (specLight === "blue_hour" && keyLightTime === "blue_hour") return [keyLightTime, ""];
  if (specLight === "blue_hour" && keyLightTime !== "") return [keyLightTime, specLight];
  return [keyLightTime, specLight];
}

// ── Translation tables ─────────────────────────────────────────────────────
const SHOT: Record<string, string> = {
  ECU:"extreme close-up shot", CU:"close-up shot", MCU:"medium close-up shot",
  MS:"medium shot", FS:"full shot", LS:"long shot", XLS:"extreme long shot",
};
const SHOT_ZH: Record<string, string> = {
  ECU: "极近景",
  CU: "近景",
  MCU: "中近景",
  MS: "中景",
  FS: "全身景",
  LS: "远景",
  XLS: "大远景",
};
const ANGLE: Record<string, string> = {
  eye_level:"eye-level angle", low_angle:"low angle",
  high_angle:"high angle", dutch:"dutch angle", worm_eye:"extreme low angle / worm's eye view",
  bird_eye:"bird's eye view, straight down overhead",
  over_shoulder:"over-the-shoulder shot (OTS)",
  two_shot:"two-shot, cowboy framing",
  profile:"side-on profile angle, 90 degrees",
  three_quarter:"three-quarter angle",
};
const ANGLE_ZH: Record<string, string> = {
  eye_level: "平视机位",
  low_angle: "低机位仰拍",
  high_angle: "高机位俯拍",
  dutch: "荷兰式倾斜机位",
  worm_eye: "虫眼极低机位",
  bird_eye: "鸟瞰正俯视",
  over_shoulder: "过肩机位",
  two_shot: "双人同框机位",
  profile: "侧面轮廓机位",
  three_quarter: "四分之三机位",
};
const MOVEMENT: Record<string, string> = {
  static:"", slow_push:"slow dolly push forward", pull_back:"slow dolly pull back",
  pan_left:"camera pan left", pan_right:"camera pan right",
  tilt_up:"camera tilt up", tilt_down:"camera tilt down",
  tracking:"tracking shot", crane_up:"crane shot rising",
  handheld:"handheld, naturalistic movement", steadicam:"steadicam, smooth gliding",
  orbit:"orbital arc around subject", zoom_in:"slow zoom in", zoom_out:"slow zoom out",
  // New additions
  push_in:"dolly push in", pull_out:"dolly pull out",
  whip_pan:"whip pan, fast snap cut motion",
  roll:"dutch roll, rotating camera",
  follow_focus:"follow focus, tracking subject depth",
  dolly_zoom:"dolly zoom, Hitchcock vertigo effect",
  arc:"arc shot, orbital movement around subject",
  drone_rise:"drone ascent, rising aerial shot",
  drone_descend:"drone descent, lowering aerial shot",
  drone_orbit:"drone orbital arc, sweeping aerial circle",
  crane_down:"crane shot descending",
  jib_up:"jib arm rising shot",
};
const MOVEMENT_ZH: Record<string, string> = {
  static: "",
  slow_push: "缓慢推进",
  pull_back: "缓慢拉远",
  pan_left: "镜头左摇",
  pan_right: "镜头右摇",
  tilt_up: "镜头上仰",
  tilt_down: "镜头下俯",
  tracking: "跟拍镜头",
  crane_up: "升降臂上升",
  handheld: "手持机位，自然晃动",
  steadicam: "斯坦尼康平稳移动",
  orbit: "环绕主体运动",
  zoom_in: "缓慢变焦推近",
  zoom_out: "缓慢变焦拉远",
  push_in: "轨道推进",
  pull_out: "轨道拉远",
  whip_pan: "甩镜，快速转向",
  roll: "镜头旋转",
  follow_focus: "跟焦追随",
  dolly_zoom: "焦距推拉（希区柯克）",
  arc: "弧线环绕镜头",
  drone_rise: "无人机上升",
  drone_descend: "无人机下降",
  drone_orbit: "无人机环绕",
  crane_down: "升降臂下降",
  jib_up: "摇臂上扬",
};
const FOCAL: Record<string, string> = {
  "8mm":"8mm fisheye lens, extreme distortion",
  "14mm":"14mm ultra-wide lens", "18mm":"18mm wide-angle lens",
  "24mm":"24mm wide lens", "28mm":"28mm lens",
  "35mm":"35mm lens", "40mm":"40mm natural field of view lens",
  "50mm":"50mm standard lens", "85mm":"85mm portrait prime lens",
  "105mm":"105mm portrait / macro lens", "135mm":"135mm medium telephoto lens",
  "200mm":"200mm telephoto lens", "300mm":"300mm super telephoto lens",
  "600mm":"600mm extreme telephoto lens",
  "macro":"macro lens, extreme close-up detail",
  "tilt_shift":"tilt-shift lens, selective focus plane",
  "anamorphic":"anamorphic lens, widescreen format with oval bokeh",
};
const FOCAL_ZH: Record<string, string> = {
  "24mm": "24mm 广角镜头",
  "35mm": "35mm 镜头",
  "50mm": "50mm 标准镜头",
  "85mm": "85mm 人像定焦",
  macro: "微距镜头，强调细节",
  anamorphic: "变形宽银幕镜头，椭圆散景",
};
const DOF: Record<string, string> = {
  very_shallow:"extremely shallow depth of field, subject sharp, background dissolved into bokeh",
  shallow:"shallow depth of field, soft background blur",
  medium:"medium depth of field",
  deep:"deep depth of field, all elements sharp",
  full_focus:"pan focus, everything in sharp focus",
};
const DOF_ZH: Record<string, string> = {
  very_shallow: "极浅景深，主体清晰、背景虚化",
  shallow: "浅景深，背景柔和虚化",
  medium: "中等景深",
  deep: "深景深，画面整体清晰",
  full_focus: "全焦清晰",
};
const RENDER: Record<string, string> = {
  commercial:      "luxury product advertisement, high-end commercial film, cinematic studio photography",
  photorealistic:  "photorealistic ultra-realistic photography",
  cinematic_still: "cinematic film photography",
  editorial:       "editorial photography, high-end magazine look",
  filmic:          "filmic motion picture aesthetic",
  documentary:     "documentary style, naturalistic photography",
  music_video:     "music video aesthetics, stylized visuals",
  vfx_heavy:       "VFX-heavy, cinematic visual effects",
};
const RENDER_ZH: Record<string, string> = {
  commercial: "高端商业广告质感，电影级棚拍",
  photorealistic: "照片级写实摄影",
  cinematic_still: "电影感静帧摄影",
  editorial: "杂志编辑风摄影",
  filmic: "电影感影像风格",
  documentary: "纪实风自然摄影",
};
const DIRECTOR: Record<string, string> = {
  kubrick:        "symmetrical wide-angle composition, cold detached atmosphere, clinical framing",
  wong_kar_wai:   "warm neon palette, shallow focus, melancholic time-suspended mood",
  nolan:          "practical IMAX scale, cool desaturated tones, oppressive epic tension",
  wes_anderson:   "pastel palette, precise symmetrical framing, deadpan flat aesthetic",
  villeneuve:     "extreme wide shots, oppressive environmental scale, sparse minimal presence",
  fincher:        "green-teal grade, precisely controlled lighting, clinical precision",
  bay_explosive:  "low rotating camera angles, hyper-saturated teal-orange palette, explosive kinetic impact, metallic sheen",
  scott_epic:     "vast environmental scale, atmospheric haze, 35mm grain texture, historical gravitas",
  coppola_soft:   "soft diffused light, desaturated pastel palette, floating interior-state compositions",
  park_chan_wook: "precise symmetric framing, saturated crimson against cold blue, restrained then suddenly explosive",
  bong_joon_ho:   "spatial compositions revealing hierarchy, warm-cool color zoning, realism with absurdist edge",
  zhang_yimou:    "intensely saturated color blocks, red-gold palette dominance, grand ceremonial scale",
};
const DIRECTOR_ZH: Record<string, string> = {
  kubrick: "对称构图、冷静疏离、精密画面控制",
  wong_kar_wai: "暖霓虹色调、浅焦、悬停式情绪氛围",
  nolan: "IMAX 体量感、冷调去饱和、史诗压迫感",
  wes_anderson: "马卡龙色系、精确对称、平静戏谑感",
  villeneuve: "极广景与环境压迫、稀疏克制",
  fincher: "绿青色调、精确控光、冷峻秩序感",
};
const KEY_TIME: Record<string, string> = {
  dawn:"dawn light, first light of day", morning:"soft morning light",
  midday:"high-noon overhead sun, harsh direct light",
  golden_hour:"golden hour, warm low-angle sunlight",
  blue_hour:"blue hour, cool twilight ambient",
  night:"night, controlled artificial lighting",
  studio:"studio lighting setup", overcast:"overcast diffused light, no hard shadows",
};
const KEY_TIME_ZH: Record<string, string> = {
  golden_hour: "黄金时段暖色低角度光",
  night: "夜景环境与人工控光",
  overcast: "阴天漫射光，无硬阴影",
  studio: "棚内控光布置",
};
const COLOR_TEMP: Record<string, string> = {
  "2700K":"2700K candlelight warm glow", "3200K":"3200K tungsten warm light",
  "4000K":"4000K warm white", "5600K":"5600K daylight balanced",
  "6500K":"6500K cool white", "8000K":"8000K overcast blue-hour sky",
};
const COLOR_TEMP_ZH: Record<string, string> = {
  "3200K": "3200K 暖色钨丝光",
  "5600K": "5600K 日光平衡",
  "6500K": "6500K 冷白光",
  "8000K": "8000K 冷蓝环境光",
};
const SPEC_LIGHT: Record<string, string> = {
  volumetric:          "volumetric light rays, atmospheric haze",
  lens_flare:          "anamorphic lens flare, controlled highlight streak",
  anamorphic_flare:    "anamorphic lens flare with horizontal streak",
  rim_light:           "strong rim light on subject edges",
  backlight:           "powerful backlight, silhouette effect",
  practicals:          "practical lights visible in scene",
  practical:           "practical lights visible in scene",
  neon:                "neon color cast",
  neon_spill:          "neon light spill, colored ambient wash",
  golden_hour:         "golden hour sunlight, warm directional rays",
  golden_hour_rays:    "golden hour sunbeams, warm directional shafts of light",
  blue_hour:           "blue-hour cool ambient wrap",
  blue_hour_ambient:   "blue hour ambient, cool twilight diffusion",
  practical_window:    "natural window light, soft directional daylight",
  haze:                "haze machine atmosphere, scattered diffused light",
  candlelight:         "candlelight, warm flickering glow",
  fire_glow:           "fire glow, warm dancing reflections",
  strobe:              "strobe flash, freeze-motion light burst",
  lightning:           "lightning flash, sudden high-intensity burst",
  screen_glow:         "screen glow, cool blue-white ambient",
  bokeh_lights:        "out-of-focus background light orbs",
  laser:               "laser beams cutting through atmosphere",
};
const SPEC_LIGHT_ZH: Record<string, string> = {
  volumetric: "体积光束与空气感",
  lens_flare: "镜头眩光高光拉丝",
  rim_light: "主体边缘轮廓光",
  practicals: "画面内实景光源可见",
  practical: "画面内实景光源可见",
  neon: "霓虹色溢出光",
  golden_hour: "黄金时段方向性暖光",
};
const BG: Record<string, string> = {
  studio_dark:    "dark studio background, deep gradient from charcoal to black",
  studio_white:   "clean white studio seamless backdrop",
  studio_grey:    "neutral grey studio backdrop",
  outdoor_urban:  "urban street environment",
  outdoor_nature: "natural outdoor environment",
  indoor_luxury:  "luxury interior space",
  indoor_minimal: "minimal interior, clean architecture",
  gradient_black: "deep gradient dark background, near-black to pure black",
  gradient_white: "soft white gradient background",
  abstract:       "abstract non-representational background",
};
const BG_ZH: Record<string, string> = {
  studio_dark: "深色棚拍背景，炭黑到纯黑渐变",
  studio_white: "纯白无缝棚拍背景",
  outdoor_nature: "自然户外环境",
  outdoor_urban: "城市街景环境",
  indoor_luxury: "高端室内空间",
  gradient_black: "近黑到纯黑渐变背景",
  abstract: "抽象非具象背景",
};
const ENV_MOOD: Record<string, string> = {
  serene:"serene, peaceful", dramatic:"dramatic, high-contrast",
  mysterious:"mysterious, fog-laden", energetic:"energetic, vibrant",
  melancholic:"melancholic, quiet solitude", luxurious:"quiet opulence, premium atmosphere",
  raw:"raw, gritty, unfiltered",
};
const ENV_MOOD_ZH: Record<string, string> = {
  serene: "宁静克制",
  dramatic: "戏剧张力强",
  mysterious: "神秘氛围",
  energetic: "高能量感",
  melancholic: "忧郁沉静",
  luxurious: "低调奢华",
};
const NARRATIVE: Record<string, string> = {
  slow_burn:    "slow-burn pacing, extended holds",
  urgent:       "urgent rhythm, kinetic momentum",
  meditative:   "meditative pace, still and contemplative",
  epic_build:   "epic build, escalating intensity",
  lyrical:      "lyrical flow, dream-like",
  staccato:     "staccato rhythm, jump cuts and punchy edits",
  breath:       "breathing rhythm, pauses and reactions prioritized",
  freeform:     "freeform, no dominant rhythm",
};
const NARRATIVE_ZH: Record<string, string> = {
  slow_burn: "慢燃节奏，强调停顿与酝酿",
  urgent: "紧迫节奏，强调推进",
  meditative: "冥想式节奏，安静凝视",
  epic_build: "史诗式递进，强度逐步拉升",
};
const TENSION: Record<string, string> = {
  none:"", low:"calm, composed", medium:"building tension",
  high:"high tension, confrontational charge", explosive:"explosive intensity",
  minimal:       "minimal tension, restrained",
  balanced:      "balanced, natural",
  charged:       "charged, taut energy",
  confrontational:"confrontational, face-off charge",
  unsettling:    "unsettling, suspenseful undertone",
  euphoric:      "euphoric, ecstatic energy",
};
const TENSION_ZH: Record<string, string> = {
  none: "",
  low: "氛围平稳克制",
  medium: "张力逐步建立",
  high: "高强度对抗张力",
};
const GRADE: Record<string, string> = {
  teal_orange:     "teal and orange grade, cinematic blockbuster look",
  warm_golden:     "warm golden grade, luxurious amber",
  warm_vintage:    "warm vintage grade, amber highlights with lifted blacks",
  cool_steel:      "cool steel blue, desaturated",
  high_contrast:   "high contrast, deep blacks and bright highlights",
  pastel:          "soft pastel palette, low contrast",
  vintage:         "vintage film grade, faded highlights",
  bw:              "black and white, monochrome",
  natural:         "",
  cinematic:       "cinematic color grade, film-look color science",
  vibrant:         "vibrant saturated grade",
  matte:           "matte finish, flat grade",
  noir:            "film noir, dramatic shadows",
  bleach_bypass:   "bleach bypass, desaturated high-contrast silver retention",
  high_key:        "high-key grade, bright open shadows",
  low_key:         "low-key noir grade, crushed blacks",
  desaturated:     "desaturated, muted palette",
  neon_pop:        "neon-saturated, hyper-vivid color",
  fincher_teal:    "green-teal grade, clinical precision, deep shadow detail",
  wkw_warm_neon:   "warm neon palette, amber and magenta cast, soft halation",
  nolan_imax:      "cool desaturated IMAX look, oppressive tonal range",
  anderson_pastel: "pastel symmetrical palette, low contrast, deadpan flat tone",
  kodak_vision3:   "Kodak Vision3 film emulation — warm shadows, rich midtones",
  fuji_velvia:     "Fuji Velvia emulation — vivid saturated color, high contrast",
  agfa_ultra:      "Agfa Ultra vintage emulation — faded warm tones",
};
const GRADE_ZH: Record<string, string> = {
  teal_orange: "青橙对比调色，电影商业感",
  warm_golden: "暖金调色，奢华琥珀质感",
  cool_steel: "冷钢蓝调，低饱和",
  bw: "黑白单色调",
  natural: "",
  noir: "黑色电影调，强阴影",
  pastel: "柔和低饱和马卡龙色调",
  vibrant: "高饱和鲜艳调色",
};
const FILM_LOOK: Record<string, string> = {
  film_grain:      "subtle film grain, 35mm texture",
  "16mm_grain":    "heavy 16mm film grain, raw texture",
  halation:        "lens halation, glowing highlight bloom",
  vignette:        "natural vignette, darkened edges",
  anamorphic_flare:"oval bokeh, anamorphic character, horizontal lens streak",
  anamorphic:      "anamorphic lens character, oval bokeh, widescreen quality",
  digital_clean:   "",
  bleach_bypass:   "bleach bypass, desaturated high contrast",
  super8:          "Super 8mm vintage look, heavy grain and color shift",
  vhs:             "VHS tape aesthetic, scan lines and color bleed",
  imax:            "IMAX large-format look, exceptional clarity and depth",
  log_c:           "Log-C / S-Log flat grade, latitude for grading",
  infrared:        "infrared photography feel, inverted foliage, ethereal look",
  drone_raw:       "drone RAW aerial footage look, high dynamic range",
};
const FILM_LOOK_ZH: Record<string, string> = {
  film_grain: "轻微胶片颗粒质感",
  halation: "高光晕影与发光扩散",
  anamorphic_flare: "变形镜头横向眩光与椭圆散景",
  anamorphic: "变形镜头质感与宽银幕气质",
  bleach_bypass: "漂白旁路，高反差低饱和",
  digital_clean: "",
};
const ACTION_MAP: Record<string, string> = {
  standing:"standing", sitting:"seated", walking:"walking forward",
  running:"running", jumping:"leaping", crouching:"crouched",
  turning:"turning", reaching:"reaching out",
  reaching_sky:"arms stretched wide", fighting:"in combat stance",
  dancing:"mid-dance", looking:"gazing into the distance",
};
const ACTION_MAP_ZH: Record<string, string> = {
  standing: "站立",
  sitting: "坐姿",
  walking: "向前行走",
  running: "奔跑",
  turning: "转身",
  reaching: "伸手动作",
};
const POSE_MAP: Record<string, string> = {
  power_pose:"commanding power pose", relaxed:"relaxed natural stance",
  hero_entry:"protective stance", arms_raised:"arms spread wide",
  profile:"in profile", back_to_cam:"back to camera",
  confrontational:"confrontational stance", collapsed:"collapsed",
};
const POSE_MAP_ZH: Record<string, string> = {
  power_pose: "强势姿态",
  relaxed: "放松自然姿态",
  profile: "侧身姿态",
  back_to_cam: "背对镜头",
};
const EXPR_MAP: Record<string, string> = {
  neutral:"neutral expression", determined:"determined expression",
  joyful:"joyful expression", sad:"sorrowful expression",
  angry:"intense expression", confident:"confident expression",
  vulnerable:"vulnerable expression", stoic:"stoic expression",
  surprised:"surprised expression",
};
const EXPR_MAP_ZH: Record<string, string> = {
  neutral: "中性表情",
  determined: "坚定表情",
  joyful: "愉悦表情",
  sad: "悲伤表情",
  angry: "愤怒表情",
  confident: "自信表情",
};

function pickLabel(
  key: string,
  lang: Lang,
  enMap: Record<string, string>,
  zhMap: Record<string, string>
): string {
  if (lang === "zh") return zhMap[key] ?? enMap[key] ?? key;
  return enMap[key] ?? key;
}

function localizeFreeText(value: string, lang: Lang): string {
  if (lang !== "zh") return value;
  let out = value ?? "";
  const rules: Array<[RegExp, string]> = [
    [/sharp product edges,\s*no shadows,\s*pure white surround/gi, "产品边缘清晰，无明显阴影，纯白包围背景"],
    [/product,\s*centered,\s*sharp edges/gi, "产品主体，居中，边缘锐利"],
    [/\bproduct\b/gi, "产品主体"],
    [/\bcentered\b/gi, "居中"],
    [/\bsharp edges?\b/gi, "边缘锐利"],
    [/\bclean white seamless backdrop\b/gi, "纯白无缝背景"],
    [/\bno shadows?\b/gi, "无明显阴影"],
    [/\bpure white surround\b/gi, "纯白包围背景"],
    [/\bhigh-end\b/gi, "高端"],
    [/\bluxury\b/gi, "奢华"],
    [/\bpremium\b/gi, "高级质感"],
    [/\btexture\b/gi, "纹理细节"],
    [/\bmacro\b/gi, "微距"],
    [/\blighting\b/gi, "光线"],
    [/\bstudio\b/gi, "棚拍"],
  ];
  for (const [pattern, next] of rules) {
    out = out.replace(pattern, next);
  }
  return out;
}

function normalizeImperfectionTokens(raw: string): string[] {
  const tokens = (raw ?? "")
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^preset=/i.test(s) && !/^level=/i.test(s));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out;
}

function localizeImperfectionToken(token: string, lang: Lang): string {
  if (lang !== "zh") return token;
  const map: Record<string, string> = {
    "natural facial asymmetry": "自然面部不对称",
    "visible pores": "可见毛孔",
    "uneven skin texture": "不均匀皮肤纹理",
    "faint under-eye darkness": "轻微眼下暗沉",
    "not overly smooth": "不过度磨皮",
    "micro skin detail": "皮肤微细节",
    "tiny skin imperfections": "细小皮肤瑕疵",
    "slight roughness": "轻微粗糙感",
    "uneven skin tone": "肤色轻微不均",
    "not plastic skin": "避免塑料皮肤感",
    "fine lines": "细纹",
    "natural eye bags": "自然眼袋",
    "natural expression lines": "自然表情纹",
    "natural age traces": "自然年龄痕迹",
    "minor scratches": "轻微划痕",
    "edge wear": "边缘磨损",
    "surface inconsistency": "表面轻微不一致",
    "imperfect finish": "不完美收边",
    "realistic usage marks": "真实使用痕迹",
    "subtle dust in air": "空气中轻微尘粒",
    "light atmospheric particles": "轻微空气颗粒",
    "slight haze": "轻薄雾感",
    "uneven lighting falloff": "不均匀光衰减",
    "imperfect light distribution": "不完美光照分布",
    "natural shadow variation": "自然阴影变化",
    "slight environmental messiness": "轻微环境杂乱感",
    "small background imperfections": "背景轻微瑕疵",
    "not overly clean": "不过度干净",
    "surface wear": "表面磨损",
    "texture inconsistency": "纹理不一致",
    "natural material aging": "自然材质旧化",
    "non-pristine surfaces": "非崭新表面状态"
  };
  const key = token.toLowerCase();
  return map[key] ?? token;
}

function formatImperfection(raw: string, lang: Lang): string {
  const tokens = normalizeImperfectionTokens(raw).map((t) => localizeImperfectionToken(t, lang));
  return tokens.join(lang === "zh" ? "，" : ", ");
}

function qualitySuffix(renderStyle: string, mediaMode: "image" | "video", lang: Lang): string {
  if (lang === "zh") {
    if (renderStyle === "commercial")
      return "照片级写实，专业商业影视质感，高动态范围，8K 超清细节";
    if (renderStyle === "photorealistic" || renderStyle === "editorial")
      return "照片级写实，专业摄影质感，高动态范围，8K 细节";
    if (renderStyle === "documentary")
      return "照片级写实，自然纪实摄影，高动态范围";
    if (mediaMode === "video")
      return "照片级写实，专业商业影视质感，高动态范围，8K 细节";
    return "照片级写实，专业摄影质感，高动态范围，8K 细节";
  }

  if (renderStyle === "commercial")
    return "photorealistic, professional commercial cinematography, high dynamic range, 8K ultra detail";
  if (renderStyle === "photorealistic" || renderStyle === "editorial")
    return "photorealistic, professional photography, high dynamic range, 8K detail";
  if (renderStyle === "documentary")
    return "photorealistic, naturalistic photography, high dynamic range";
  if (mediaMode === "video")
    return "photorealistic, professional commercial cinematography, high dynamic range, 8K detail";
  return "photorealistic, professional photography, high dynamic range, 8K detail";
}

// ── Video Motion Language Helpers ─────────────────────────────────────────
const MOTION_EPS = 0.5;

function getLayerKeyframes(layer: any) {
  const kf0 = (layer?.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30, h: 30, rot: 0 };
  const kf1 = (layer?.kf ?? []).find((k: any) => k.t === 1) ?? null;
  return { kf0, kf1 };
}

function hasEffectiveMotion(layer: any): boolean {
  const { kf0, kf1 } = getLayerKeyframes(layer);
  if (!kf1) return false;
  const dx = Math.abs((kf1.x ?? 0) - (kf0.x ?? 0));
  const dy = Math.abs((kf1.y ?? 0) - (kf0.y ?? 0));
  const dw = Math.abs((kf1.w ?? 0) - (kf0.w ?? 0));
  const dh = Math.abs((kf1.h ?? 0) - (kf0.h ?? 0));
  const dRot = Math.abs((kf1.rot ?? 0) - (kf0.rot ?? 0));
  return dx >= MOTION_EPS || dy >= MOTION_EPS || dw >= MOTION_EPS || dh >= MOTION_EPS || dRot >= MOTION_EPS;
}

/**
 * Describe video motion with director-style natural language (V3.3)
 * Focus on visual change and cinematic intent, not technical coordinates
 */
function describeVideoMotion(layer: any, duration: number, isPrimary: boolean, lang: Lang): string {
  if (!hasEffectiveMotion(layer)) return "";
  const { kf0 } = getLayerKeyframes(layer);
  const kf1 = (layer.kf ?? []).find((k: any) => k.t === 1) ?? kf0;
  
  const dx = kf1.x - kf0.x;
  const dy = kf1.y - kf0.y;
  const dw = kf1.w - kf0.w;
  const rot0 = kf0.rot ?? 0;
  const rot1 = kf1.rot ?? 0;
  const dRot = rot1 - rot0;
  
  // Build natural language description with cinematic flow
  const clauses: string[] = [];
  
  // Opening: establish starting state naturally
  if (isPrimary) {
    if (dw > 10) {
      clauses.push(lang === "zh" ? "开场为更宽构图" : "starting in a wider composition");
    } else if (dw < -10) {
      clauses.push(lang === "zh" ? "开场紧贴主体" : "starting tight on the subject");
    } else {
      clauses.push(lang === "zh" ? "主体保持居中" : "the subject holds centered in frame");
    }
  }
  
  // Describe change as visual transformation, not coordinate shift
  if (dw > 8) {
    clauses.push(lang === "zh" ? `${duration} 秒内缓慢推进` : `slowly pushing in over ${duration} seconds`);
    clauses.push(lang === "zh" ? "逐步靠近主体" : "drawing closer to the subject");
  } else if (dw < -8) {
    clauses.push(lang === "zh" ? `${duration} 秒内缓慢拉远` : `pulling back over ${duration} seconds`);
    clauses.push(lang === "zh" ? "逐步揭示更多环境信息" : "revealing more of the surroundings");
  }
  
  // Position changes - describe as intentional camera movement
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    const driftParts: string[] = [];
    if (dx > 8) driftParts.push(lang === "zh" ? "向右平移" : "drifting right");
    if (dx < -8) driftParts.push(lang === "zh" ? "向左平移" : "drifting left");
    if (dy > 8) driftParts.push(lang === "zh" ? "镜头下移" : "tilting down");
    if (dy < -8) driftParts.push(lang === "zh" ? "镜头上扬" : "rising upward");
    if (driftParts.length > 0) {
      clauses.push(driftParts.join(", "));
    }
  }
  
  // Rotation - subtle mention
  if (Math.abs(dRot) > 15) {
    clauses.push(
      lang === "zh"
        ? (dRot > 0 ? "轻微顺时针旋转" : "轻微逆时针旋转")
        : `${dRot > 0 ? "gentle clockwise rotation" : "subtle counter-clockwise turn"}`
    );
  }
  
  // Ending state - describe the final visual
  if (dw > 8) {
    clauses.push(lang === "zh" ? "结尾落在亲密近景" : "ending in an intimate close-up");
  } else if (dw < -8) {
    clauses.push(lang === "zh" ? "结尾回到更宽画幅" : "settling into a wider view");
  }
  
  // Static case - describe as intentional stillness
  if (clauses.length <= 1 && isPrimary) {
    return lang === "zh"
      ? `主体基本静止，保持该状态约 ${duration} 秒`
      : `the subject remains still, holding the moment for ${duration} seconds`;
  }
  
  return clauses.join(", ");
}

function describeMotionPath(layer: any, lang: Lang): string {
  if (!hasEffectiveMotion(layer)) return "";
  const { kf0 } = getLayerKeyframes(layer);
  const kf1 = (layer.kf ?? []).find((k: any) => k.t === 1) ?? kf0;
  
  const dx = Math.round(kf1.x * 10) / 10 - Math.round(kf0.x * 10) / 10;
  const dy = Math.round(kf1.y * 10) / 10 - Math.round(kf0.y * 10) / 10;
  
  const horizontal = Math.abs(dx) >= 4 ? (dx > 0 ? "right" : "left") : "";
  const vertical = Math.abs(dy) >= 4 ? (dy > 0 ? "down" : "up") : "";
  
  const parts = [horizontal, vertical].filter(Boolean);
  if (!parts.length) return lang === "zh" ? "平稳位移" : "smooth displacement";
  
  return lang === "zh" 
    ? `从${horizontal || ""}${vertical || ""}方向移动` 
    : `moves ${parts.join("-")}`;
}

// ── Structure Guide Builder ───────────────────────────────────────────────
function buildStructureGuide(scene: Scene, lang: Lang, mediaMode: "image" | "video"): string {
  const layers = ((scene as any).layers ?? []).filter(
    (l: any) => l && (l.look || l.externalPrompt || l.notes)
  );
  
  if (layers.length === 0) return "";
  
  const lines: string[] = [];
  lines.push(`Objects: ${layers.length}`);
  
  if (layers.length === 1) {
    const kf0 = (layers[0].kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
    const pos = positionPhrase(kf0.x, kf0.y, kf0.w, lang);
    lines.push(`Spatial: single subject ${pos}`);
  } else if (layers.length > 1) {
    const positions = layers.map((l: any, i: number) => {
      const kf = (l.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50 + i * 10, y: 50, w: 25 };
      return `${l.id || `obj${i+1}`}:${kf.x < 50 ? 'L' : 'R'}`;
    });
    lines.push(`Spatial: ${positions.join(", ")}`);
  }
  
  if (mediaMode === "video" && layers.length > 0) {
    const paths = layers
      .map((l: any, i: number) => {
        if (!hasEffectiveMotion(l)) return "";
        const path = describeMotionPath(l, lang);
        return `${l.id || `obj${i+1}`}:${path}`;
      })
      .filter((p: string) => !!p && !p.endsWith(":"));
    if (paths.length > 0) {
      lines.push(`Motion: ${paths.join("; ")}`);
    }
  }
  
  return lines.join(" | ");
}

// ── Field Resolution ──────────────────────────────────────────────────────
function resolveAllFields(scene: Scene, notes: string, cam: any, lighting: any): ResolvedFields {
  const shotSize = resolveWithPriority(mark(notes, "shot_size") || cam.shot, undefined, undefined, "");
  const camAngle = resolveWithPriority(mark(notes, "cam_angle"), undefined, undefined, "");
  const camMove = resolveWithPriority(mark(notes, "cam_movement") || cam.movement, undefined, undefined, "static");
  const duration = Math.max(1, Math.round(Number(scene.duration_s) || 5));
  const directorPack = resolveWithPriority(mark(notes, "director_pack"), undefined, undefined, "");
  const narrative = resolveWithPriority(mark(notes, "narrative_rhythm"), undefined, undefined, "");
  const tension = resolveWithPriority(mark(notes, "visual_tension"), undefined, undefined, "");
  const renderStyle = resolveWithPriority(mark(notes, "render_style"), undefined, undefined, "");
  const focalLength = resolveWithPriority(mark(notes, "focal_length"), undefined, undefined, "");
  const dof = resolveWithPriority(mark(notes, "depth_of_field"), undefined, undefined, "");
  const bgPreset = resolveWithPriority(mark(notes, "bg_preset"), undefined, undefined, "");
  const envMood = resolveWithPriority(mark(notes, "env_mood"), undefined, undefined, "");
  
  const keyTimeRaw = mark(notes, "key_light_time") || lighting.time || "";
  const keyDir = resolveWithPriority(mark(notes, "key_light_dir") || lighting.key_dir, undefined, undefined, "");
  const keyMood = resolveWithPriority(mark(notes, "key_light_mood") || lighting.mood, undefined, undefined, "");
  const colorTemp = resolveWithPriority(mark(notes, "color_temp"), undefined, undefined, "");
  
  const specLightRaw = mark(notes, "spec_light") || "";
  const colorGrade = resolveWithPriority(mark(notes, "color_grade"), undefined, undefined, "");
  const filmLook = resolveWithPriority(mark(notes, "film_look"), undefined, undefined, "");
  const postProcess = resolveWithPriority(mark(notes, "post_process"), undefined, undefined, "");
  
  const [keyTimeFinal, specLightFinal] = dedupeLight(keyTimeRaw, specLightRaw);
  
  return {
    shotSize, camAngle, camMove, duration, directorPack, narrative, tension,
    renderStyle, focalLength, dof, bgPreset, envMood,
    keyTimeRaw, keyDir, keyMood, colorTemp, specLightRaw,
    colorGrade, filmLook, postProcess, keyTimeFinal, specLightFinal,
  };
}

// ── Segment Builders ──────────────────────────────────────────────────────
function buildStyleSegment(f: ResolvedFields, lang: Lang): string | null {
  const parts: string[] = [];
  if (f.renderStyle.value) parts.push(pickLabel(f.renderStyle.value, lang, RENDER, RENDER_ZH));
  if (f.directorPack.value) parts.push(pickLabel(f.directorPack.value, lang, DIRECTOR, DIRECTOR_ZH));
  return parts.filter(Boolean).join(", ") || null;
}

function buildCameraSegment(f: ResolvedFields, lang: Lang): string | null {
  const parts: string[] = [];
  if (f.shotSize.value) parts.push(pickLabel(f.shotSize.value, lang, SHOT, SHOT_ZH));
  if (f.focalLength.value) parts.push(pickLabel(f.focalLength.value, lang, FOCAL, FOCAL_ZH));
  if (f.camAngle.value && f.camAngle.value !== "eye_level") parts.push(pickLabel(f.camAngle.value, lang, ANGLE, ANGLE_ZH));
  if (f.dof.value) parts.push(pickLabel(f.dof.value, lang, DOF, DOF_ZH));
  return parts.filter(Boolean).join(", ") || null;
}

function buildMotionSegment(f: ResolvedFields, validLayers: any[], lang: Lang): string | null {
  const moveStr = pickLabel(f.camMove.value, lang, MOVEMENT, MOVEMENT_ZH);
  
  const parts: string[] = [];
  
  // Camera movement with duration - natural phrasing
  if (moveStr) {
    parts.push(lang === "zh" ? `${moveStr}，时长约 ${f.duration} 秒` : `${moveStr} over ${f.duration} seconds`);
  } else {
    parts.push(lang === "zh" ? `时长约 ${f.duration} 秒` : `over ${f.duration} seconds`);
  }
  
  // Subject motion - primary layer only in main prompt
  if (validLayers.length > 0) {
    const secondaryMentions: string[] = [];
    if (hasEffectiveMotion(validLayers[0])) {
      const primaryMotion = describeVideoMotion(validLayers[0], f.duration, true, lang);
      if (primaryMotion) parts.push(primaryMotion);
    }
    
    // Secondary layers - keep minimal, push detail to Structure_Guide
    for (let i = 1; i < validLayers.length; i++) {
      const layer = validLayers[i];
      const layerId = layer.id || `obj${i + 1}`;
      // Only add brief mention of secondary motion if there's actual movement
      if (hasEffectiveMotion(layer)) {
        secondaryMentions.push(lang === "zh" ? `${layerId}：轻微位移` : `${layerId}: subtle movement`);
      }
    }
    if (secondaryMentions.length > 0) {
      parts.push(lang === "zh" ? `次对象运动：${secondaryMentions.join("；")}` : `secondary motion: ${secondaryMentions.join("; ")}`);
    }
  }
  
  return parts.join(", ");
}

interface LayerMarkers {
  look: string;
  shapeDesc: string;
  ext: string;
  costume: string;
  accessory: string;
  prop: string;
  action: string;
  pose: string;
  expression: string;
  emotion: string;
  status: string;
  detail: string;
}

function extractLayerMarkers(notes: string): LayerMarkers {
  return {
    look: "",
    shapeDesc: "",
    ext: "",
    costume: mark(notes, "costume"),
    accessory: mark(notes, "accessory"),
    prop: mark(notes, "prop"),
    action: mark(notes, "action"),
    pose: mark(notes, "pose"),
    expression: mark(notes, "expression"),
    emotion: mark(notes, "emotion"),
    status: mark(notes, "status"),
    detail: mark(notes, "detail"),
  };
}

function buildSubjectSegments(validLayers: any[], seg: Array<string | null>, lang: Lang, sceneNotes?: string): void {
  // V3.2 Fallback: if no valid layers, try to extract subject info from scene notes directly
  if (validLayers.length === 0 && sceneNotes) {
    const lookFromNotes = localizeFreeText(mark(sceneNotes, "look"), lang);
    const detailFromNotes = localizeFreeText(mark(sceneNotes, "detail"), lang);
    const imperfectionFromNotes = formatImperfection(mark(sceneNotes, "imperfection_object"), lang);
    
    if (lookFromNotes) {
      seg[3] = lookFromNotes;
    }
    if (detailFromNotes) {
      seg[8] = detailFromNotes;
    }
    if (imperfectionFromNotes) {
      seg[8] = seg[8] ? `${seg[8]}${lang === "zh" ? "，" : ", "}${imperfectionFromNotes}` : imperfectionFromNotes;
    }
    return;
  }
  
  if (validLayers.length === 0) return;
  
  const firstLayer = validLayers[0];
  const kf0 = (firstLayer.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
  const posPhrase = positionPhrase(kf0.x, kf0.y, kf0.w, lang);
  
  const lm: LayerMarkers = {
    look: localizeFreeText(firstLayer.look ?? "", lang),
    shapeDesc: localizeFreeText(firstLayer.shapeDesc ?? "", lang),
    ext: localizeFreeText(firstLayer.externalPrompt ?? "", lang),
    costume: localizeFreeText(mark(firstLayer.notes ?? "", "costume"), lang),
    accessory: localizeFreeText(mark(firstLayer.notes ?? "", "accessory"), lang),
    prop: localizeFreeText(mark(firstLayer.notes ?? "", "prop"), lang),
    action: mark(firstLayer.notes ?? "", "action"),
    pose: mark(firstLayer.notes ?? "", "pose"),
    expression: mark(firstLayer.notes ?? "", "expression"),
    emotion: localizeFreeText(mark(firstLayer.notes ?? "", "emotion"), lang),
    status: localizeFreeText(mark(firstLayer.notes ?? "", "status"), lang),
    detail: localizeFreeText(mark(firstLayer.notes ?? "", "detail"), lang),
  };
  
  // V3.2: Build natural language subject description
  // Combine look + costume + action into flowing sentences where possible
  
  // 4 SUBJECT_BASE - main subject identity
  const baseParts = [lm.look, lm.shapeDesc, lm.ext].filter(Boolean);
  if (baseParts.length) {
    seg[3] = `${baseParts.join(", ")}${lang === "zh" ? "，" : ", "}${posPhrase}`;
  }
  
  // 5 SUBJECT_COSTUME - merge with base if simple
  if (lm.costume) {
    // If costume is simple, prepend to base for natural flow
    const costumeSimple = lm.costume.length < 60;
    if (costumeSimple && seg[3]) {
      seg[3] = lang === "zh" ? `${seg[3]}，穿着${lm.costume}` : `${seg[3]}, wearing ${lm.costume}`;
    } else {
      seg[4] = lm.costume;
    }
  }
  
  // 6 SUBJECT_PROPS - accessories and props
  const propParts = [lm.accessory, lm.prop].filter(Boolean);
  if (propParts.length) seg[5] = propParts.join(", ");
  
  // 7 SUBJECT_ACTION - combine action + pose naturally
  const actionStr = lm.action ? pickLabel(lm.action, lang, ACTION_MAP, ACTION_MAP_ZH) : "";
  const poseStr = lm.pose ? pickLabel(lm.pose, lang, POSE_MAP, POSE_MAP_ZH) : "";
  
  // V3.2: Merge action with pose for natural flow
  if (actionStr && poseStr) {
    seg[6] = `${actionStr}, ${poseStr}`;
  } else if (actionStr) {
    seg[6] = actionStr;
  } else if (poseStr) {
    seg[6] = poseStr;
  }
  
  // 8 SUBJECT_STATE - expression and emotion
  const exprStr = lm.expression ? pickLabel(lm.expression, lang, EXPR_MAP, EXPR_MAP_ZH) : "";
  const stateParts = [exprStr, lm.emotion, lm.status].filter(Boolean);
  if (stateParts.length) seg[7] = stateParts.join(", ");
  
  // 9 SUBJECT_DETAIL
  if (lm.detail) seg[8] = lm.detail;
  const primaryImperfection = formatImperfection(mark(firstLayer.notes ?? "", "imperfection_object"), lang);
  if (primaryImperfection) {
    seg[8] = seg[8] ? `${seg[8]}${lang === "zh" ? "，" : ", "}${primaryImperfection}` : primaryImperfection;
  }
  
  // V3.3: Multi-object handling with clearer hierarchy
  // Primary subject gets full description, secondary objects are concise context
  if (validLayers.length > 1) {
    const secondaryPhrases: string[] = [];
    
    for (let i = 1; i < validLayers.length; i++) {
      const l = validLayers[i];
      const k0 = (l.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50 + i * 20, y: 50, w: 20 };
      const pos2 = positionPhrase(k0.x, k0.y, k0.w, lang);
      
      const look2 = localizeFreeText(l.look ?? "", lang);
      const ext2 = localizeFreeText(l.externalPrompt ?? "", lang);
      const costume2 = localizeFreeText(mark(l.notes ?? "", "costume"), lang);
      const prop2 = localizeFreeText(mark(l.notes ?? "", "prop"), lang);
      const imp2 = formatImperfection(mark(l.notes ?? "", "imperfection_object"), lang);
      
      // Build concise but natural secondary object phrase
      let objDesc = look2;
      
      // Add external prompt if present and meaningful
      if (ext2 && ext2.length > 3) {
        objDesc += `, ${ext2}`;
      }
      
      // Costume: only add if not redundant and adds value
      if (costume2) {
        const lookLower = look2.toLowerCase();
        const costumeLower = costume2.toLowerCase();
        const isRedundant = 
          lookLower.includes(costumeLower) ||
          (costumeLower.includes("gown") && lookLower.includes("gown")) ||
          (costumeLower.includes("dress") && lookLower.includes("dress")) ||
          (costumeLower.includes("suit") && lookLower.includes("suit"));
        if (!isRedundant) {
          objDesc += lang === "zh" ? `，穿着${costume2}` : `, dressed in ${costume2}`;
        }
      }
      
      // Props: integrate naturally as comma-separated list
      if (prop2) {
        objDesc += `, ${prop2}`;
      }
      if (imp2) {
        objDesc += lang === "zh" ? `，${imp2}` : `, ${imp2}`;
      }
      
      secondaryPhrases.push(lang === "zh" ? `${objDesc}——${pos2}` : `${objDesc} — ${pos2}`);
    }
    
    // Connect secondary objects with em-dash for cleaner visual separation
    if (secondaryPhrases.length > 0 && seg[3]) {
      seg[3] = lang === "zh" ? `${seg[3]}——${secondaryPhrases.join("；")}` : `${seg[3]} — ${secondaryPhrases.join("; ")}`;
    }
  }
}

function buildCompositionSegment(validLayers: any[], aspectRatio?: string, lang: Lang = "en"): string | null {
  const parts: string[] = [];
  
  if (validLayers.length === 1) {
    const kf0 = ((validLayers[0] as any).kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
    if (kf0.x >= 40 && kf0.x <= 60) {
      parts.push(lang === "zh" ? "中心构图，留白干净" : "perfect centered composition, clean negative space");
    } else {
      parts.push(lang === "zh" ? "偏轴构图，留白干净" : "off-center composition, clean negative space");
    }
  }
  
  if (aspectRatio && aspectRatio !== "16:9") {
    parts.push(lang === "zh" ? `${aspectRatio} 画幅比例` : `${aspectRatio} aspect ratio`);
  }
  
  return parts.join(", ") || null;
}

function buildLightingSegment(f: ResolvedFields, lang: Lang): string | null {
  const parts: string[] = [];
  if (f.keyTimeFinal) parts.push(pickLabel(f.keyTimeFinal, lang, KEY_TIME, KEY_TIME_ZH));
  if (f.keyDir.value) parts.push(lang === "zh" ? `${f.keyDir.value} 主光方向` : `${f.keyDir.value} key light`);
  if (f.keyMood.value) parts.push(lang === "zh" ? `${f.keyMood.value} 光线情绪` : `${f.keyMood.value} mood`);
  if (f.colorTemp.value) parts.push(pickLabel(f.colorTemp.value, lang, COLOR_TEMP, COLOR_TEMP_ZH));
  if (f.specLightFinal) parts.push(pickLabel(f.specLightFinal, lang, SPEC_LIGHT, SPEC_LIGHT_ZH));
  return parts.filter(Boolean).join(", ") || null;
}

function buildEnvironmentSegment(f: ResolvedFields, lang: Lang): string | null {
  if (f.bgPreset.value) {
    return pickLabel(f.bgPreset.value, lang, BG, BG_ZH);
  }
  return null;
}

function buildMoodSegment(f: ResolvedFields, lang: Lang): string | null {
  const parts: string[] = [];
  if (f.envMood.value) parts.push(pickLabel(f.envMood.value, lang, ENV_MOOD, ENV_MOOD_ZH));
  if (f.narrative.value) parts.push(pickLabel(f.narrative.value, lang, NARRATIVE, NARRATIVE_ZH));
  if (f.tension.value) {
    const tensionStr = pickLabel(f.tension.value, lang, TENSION, TENSION_ZH) ?? "";
    if (tensionStr) parts.push(tensionStr);
  }
  return parts.filter(Boolean).join(", ") || null;
}

function buildTechnicalSegment(f: ResolvedFields, mediaMode: "image" | "video", lang: Lang): string {
  const parts: string[] = [];
  
  if (f.colorGrade.value) {
    const gradeStr = pickLabel(f.colorGrade.value, lang, GRADE, GRADE_ZH);
    if (gradeStr) parts.push(gradeStr);
  }
  
  if (f.filmLook.value) {
    const lookStr = pickLabel(f.filmLook.value, lang, FILM_LOOK, FILM_LOOK_ZH);
    if (lookStr) parts.push(lookStr);
  }
  
  if (f.postProcess.value) parts.push(f.postProcess.value);
  
  parts.push(qualitySuffix(f.renderStyle.value, mediaMode, lang));
  
  return parts.filter(Boolean).join(", ");
}

// ── Main compiler ──────────────────────────────────────────────────────────
export function compileV3(input: V3Input): string {
  const { scene, lang, mediaMode, aspectRatio } = input;
  const n = scene.notes ?? "";
  const cam = (scene as any).camera ?? {};
  const lighting = (scene as any).lighting ?? {};
  const layers = ((scene as any).layers ?? []) as any[];
  
  const validLayers = layers.filter((l) => l && (l.look || l.externalPrompt || l.notes));
  
  const f = resolveAllFields(scene, n, cam, lighting);
  const sceneImperfection = formatImperfection(mark(n, "imperfection_scene"), lang);
  
  const seg: Array<string | null> = new Array(14).fill(null);
  
  seg[0] = buildStyleSegment(f, lang);
  seg[1] = buildCameraSegment(f, lang);
  
  if (mediaMode === "video") {
    seg[2] = buildMotionSegment(f, validLayers, lang);
  }
  
  buildSubjectSegments(validLayers, seg, lang, n);
  seg[9] = buildCompositionSegment(validLayers, aspectRatio, lang);
  seg[10] = buildLightingSegment(f, lang);
  seg[11] = buildEnvironmentSegment(f, lang);
  seg[12] = buildMoodSegment(f, lang);
  if (sceneImperfection) {
    seg[12] = seg[12] ? `${seg[12]}${lang === "zh" ? "，" : ", "}${sceneImperfection}` : sceneImperfection;
  }
  seg[13] = buildTechnicalSegment(f, mediaMode, lang);
  
  const mainOutput = seg.filter(Boolean).join(",\n");
  
  const includeStructureGuide = mark(n, "include_structure_guide") === "true";
  if (includeStructureGuide) {
    const structureGuide = buildStructureGuide(scene, lang, mediaMode);
    if (structureGuide) {
      return `${mainOutput}\n[Structure_Guide]: ${structureGuide}`;
    }
  }
  
  return mainOutput;
}
