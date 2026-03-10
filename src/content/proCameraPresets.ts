import type { Lang } from "../i18n";

export type ProMotionTier = "basic" | "pro_plus";

export type ProMotionCategory =
  | "push_pull"
  | "pan_tilt"
  | "follow_orbit"
  | "angle_height"
  | "dialogue_grammar"
  | "transition_time"
  | "psychology"
  | "surreal_material"
  | "body_perception";

export type ProCameraPreset = {
  id: string;
  tier: ProMotionTier;
  category: ProMotionCategory;
  labelZh: string;
  labelEn: string;
  descZh: string;
  descEn: string;
  promptZh: string;
  promptEn: string;
  disabledByBasic?: string[];
  conflicts?: string[];
};

export const PRO_BASIC_MOTION_MARK = "pro_basic_motion:";
export const PRO_PLUS_MOTION_MARK = "pro_plus_motion:";

export const BASIC_MOTION_CATEGORIES: Array<{ id: ProMotionCategory; labelZh: string; labelEn: string }> = [
  { id: "push_pull", labelZh: "推进拉远", labelEn: "Push / Pull" },
  { id: "pan_tilt", labelZh: "平移摇移", labelEn: "Pan / Tilt" },
  { id: "follow_orbit", labelZh: "跟拍环绕", labelEn: "Follow / Orbit" },
  { id: "angle_height", labelZh: "视角机位", labelEn: "Angle / Height" }
];

export const PRO_PLUS_MOTION_CATEGORIES: Array<{ id: ProMotionCategory; labelZh: string; labelEn: string }> = [
  { id: "dialogue_grammar", labelZh: "叙事语法", labelEn: "Story Grammar" },
  { id: "transition_time", labelZh: "转场时空", labelEn: "Transition / Time" },
  { id: "psychology", labelZh: "心理效果", labelEn: "Psychology" },
  { id: "surreal_material", labelZh: "材质超现实", labelEn: "Surreal Material" },
  { id: "body_perception", labelZh: "角色身体感", labelEn: "Body / Perception" }
];

export const PRO_CAMERA_PRESETS: ProCameraPreset[] = [
  { id: "locked_static", tier: "basic", category: "push_pull", labelZh: "静止机位", labelEn: "Locked Static", descZh: "镜头不动，主体和场面自己动。", descEn: "Camera stays still; subjects carry the motion.", promptZh: "静止机位，构图稳定，不自动推拉摇移。", promptEn: "Locked-off camera, stable framing, no auto push/pan/tilt." },
  { id: "slow_push_in", tier: "basic", category: "push_pull", labelZh: "缓慢推进", labelEn: "Slow Push In", descZh: "镜头慢慢靠近主体，强化情绪或信息。", descEn: "Slowly move in to intensify emotion or reveal detail.", promptZh: "镜头缓慢推进，逐步靠近主体，不突兀变焦。", promptEn: "Slow push-in toward the subject with smooth advance." },
  { id: "slow_pull_out", tier: "basic", category: "push_pull", labelZh: "缓慢拉远", labelEn: "Slow Pull Out", descZh: "镜头慢慢退出，露出环境或疏离感。", descEn: "Slow pull out to reveal space or emotional distance.", promptZh: "镜头缓慢拉远，逐步露出更多环境。", promptEn: "Slow pull-out to reveal more environment." },
  { id: "fast_push", tier: "basic", category: "push_pull", labelZh: "快速逼近", labelEn: "Fast Push", descZh: "短时间快速靠近，适合发现和惊吓点。", descEn: "Fast approach for revelation or impact beats.", promptZh: "镜头快速逼近主体，形成明显压迫和注意力集中。", promptEn: "Fast push toward the subject for a punchy reveal." },
  { id: "fast_pull", tier: "basic", category: "push_pull", labelZh: "快速退出", labelEn: "Fast Pull", descZh: "快速退开，形成突然失落或局势暴露。", descEn: "Fast pull back for exposure or sudden release.", promptZh: "镜头快速退出，突然把主体放回更大的环境里。", promptEn: "Fast pull-back to drop the subject into a larger space." },

  { id: "move_left", tier: "basic", category: "pan_tilt", labelZh: "向左平移", labelEn: "Move Left", descZh: "镜头整体向左平移。", descEn: "Translate the camera left.", promptZh: "镜头向左平移，主体和环境产生横向位移关系。", promptEn: "Camera tracks left with clear lateral motion." },
  { id: "move_right", tier: "basic", category: "pan_tilt", labelZh: "向右平移", labelEn: "Move Right", descZh: "镜头整体向右平移。", descEn: "Translate the camera right.", promptZh: "镜头向右平移，主体和环境产生横向位移关系。", promptEn: "Camera tracks right with clear lateral motion." },
  { id: "pan_left", tier: "basic", category: "pan_tilt", labelZh: "左摇镜", labelEn: "Pan Left", descZh: "原地向左转，适合揭示信息。", descEn: "Pan left in place to reveal space or information.", promptZh: "镜头原地左摇，逐步揭示左侧信息。", promptEn: "Pan left in place to reveal what is on the left." },
  { id: "pan_right", tier: "basic", category: "pan_tilt", labelZh: "右摇镜", labelEn: "Pan Right", descZh: "原地向右转，适合跟视线或揭示。", descEn: "Pan right in place for reveal or gaze follow.", promptZh: "镜头原地右摇，逐步揭示右侧信息。", promptEn: "Pan right in place to reveal what is on the right." },
  { id: "tilt_up", tier: "basic", category: "pan_tilt", labelZh: "上仰摇镜", labelEn: "Tilt Up", descZh: "镜头从下往上抬，看向更高信息。", descEn: "Tilt upward to reveal higher information.", promptZh: "镜头上仰摇镜，从较低处抬到更高目标。", promptEn: "Tilt up from lower framing to higher subject information." },
  { id: "tilt_down", tier: "basic", category: "pan_tilt", labelZh: "下俯摇镜", labelEn: "Tilt Down", descZh: "镜头从上往下压，看向人物或地面。", descEn: "Tilt down to settle onto subject or ground detail.", promptZh: "镜头下俯摇镜，从高处压向主体或地面信息。", promptEn: "Tilt down from higher framing to the subject or ground detail." },

  { id: "follow_front", tier: "basic", category: "follow_orbit", labelZh: "正面跟拍", labelEn: "Front Follow", descZh: "镜头面对主体后退或同步移动。", descEn: "Camera faces the subject while moving with them.", promptZh: "镜头正面跟拍主体，速度稳定，主体始终清晰。", promptEn: "Front-facing follow shot that keeps the subject clear." },
  { id: "follow_back", tier: "basic", category: "follow_orbit", labelZh: "尾随跟拍", labelEn: "Back Follow", descZh: "镜头跟在人物背后推进。", descEn: "Follow from behind to build journey and immersion.", promptZh: "镜头从人物后方尾随跟拍，保持前进路径连续。", promptEn: "Back-follow camera that trails the subject's path." },
  { id: "side_follow", tier: "basic", category: "follow_orbit", labelZh: "侧向跟拍", labelEn: "Side Follow", descZh: "镜头与主体并排移动。", descEn: "Track alongside the subject.", promptZh: "镜头与主体侧向并行跟拍，形成流畅运动感。", promptEn: "Side-follow shot moving parallel to the subject." },
  { id: "orbit_left", tier: "basic", category: "follow_orbit", labelZh: "左环绕", labelEn: "Orbit Left", descZh: "镜头围绕主体左向环绕。", descEn: "Orbit left around the subject.", promptZh: "镜头围绕主体左向环绕，主体保持视觉核心。", promptEn: "Orbit left around the subject while keeping them central." },
  { id: "orbit_right", tier: "basic", category: "follow_orbit", labelZh: "右环绕", labelEn: "Orbit Right", descZh: "镜头围绕主体右向环绕。", descEn: "Orbit right around the subject.", promptZh: "镜头围绕主体右向环绕，主体保持视觉核心。", promptEn: "Orbit right around the subject while keeping them central." },
  { id: "handheld", tier: "basic", category: "follow_orbit", labelZh: "手持机感", labelEn: "Handheld", descZh: "轻微手持抖动，纪实和临场感更强。", descEn: "Subtle handheld feel for documentary immediacy.", promptZh: "轻微手持机感，保持真实临场感，不要过度抖动。", promptEn: "Subtle handheld camera feel, grounded and not overly shaky." },

  { id: "eye_level", tier: "basic", category: "angle_height", labelZh: "眼平视角", labelEn: "Eye Level", descZh: "最自然、中性的叙事视角。", descEn: "Natural neutral viewing angle.", promptZh: "采用眼平视角，叙事中性自然。", promptEn: "Use eye-level framing with neutral perspective." },
  { id: "low_angle", tier: "basic", category: "angle_height", labelZh: "低机位仰拍", labelEn: "Low Angle", descZh: "强化人物力量、压迫和英雄感。", descEn: "Low angle for dominance or heroism.", promptZh: "采用低机位仰拍，强化主体压迫和力量感。", promptEn: "Use a low angle to amplify dominance and power." },
  { id: "high_angle", tier: "basic", category: "angle_height", labelZh: "高机位俯拍", labelEn: "High Angle", descZh: "压低人物气场，强化脆弱感。", descEn: "High angle for vulnerability or overview.", promptZh: "采用高机位俯拍，强化主体的脆弱或被观察感。", promptEn: "Use a high angle to create vulnerability or observation." },
  { id: "top_down", tier: "basic", category: "angle_height", labelZh: "顶拍", labelEn: "Top Down", descZh: "从上向下俯看结构和空间。", descEn: "Top-down angle for structure and layout.", promptZh: "使用顶拍视角，自上而下展示空间和结构。", promptEn: "Use a top-down view to show spatial structure." },
  { id: "aerial_rise", tier: "basic", category: "angle_height", labelZh: "升空俯看", labelEn: "Aerial Rise", descZh: "镜头抬升到更高位置俯看场景。", descEn: "Rise upward into an aerial overview.", promptZh: "镜头升空抬高，逐步获得更大范围的俯看视角。", promptEn: "Camera rises into a wider aerial perspective." },

  { id: "reverse_angle", tier: "pro_plus", category: "dialogue_grammar", labelZh: "反打", labelEn: "Reverse Angle", descZh: "同场景切换到相对方向的镜头。", descEn: "Cut to the opposite angle in the same scene.", promptZh: "使用反打镜头，保持同场景人物关系稳定。", promptEn: "Use a reverse-angle shot while keeping scene continuity." },
  { id: "over_shoulder", tier: "pro_plus", category: "dialogue_grammar", labelZh: "过肩镜头", labelEn: "Over Shoulder", descZh: "从一人肩后观察另一人。", descEn: "Observe one character from behind the other's shoulder.", promptZh: "使用过肩镜头，明确对话关系和视线方向。", promptEn: "Use an over-the-shoulder angle for dialogue clarity." },
  { id: "pov_lock", tier: "pro_plus", category: "dialogue_grammar", labelZh: "主观视角锁定", labelEn: "POV Lock", descZh: "镜头完全站在角色视角里。", descEn: "Hold the camera in character POV.", promptZh: "镜头锁定主观视角，以角色所见组织画面。", promptEn: "Lock the shot to the character's POV." },
  { id: "insert_detail", tier: "pro_plus", category: "dialogue_grammar", labelZh: "插入特写", labelEn: "Insert Detail", descZh: "插入物件或动作细节镜头。", descEn: "Insert a detail close-up for emphasis.", promptZh: "插入一个细节特写镜头，聚焦关键物件或动作。", promptEn: "Insert a detail close-up for an important object or action." },
  { id: "reveal_pan", tier: "pro_plus", category: "dialogue_grammar", labelZh: "揭示摇镜", labelEn: "Reveal Pan", descZh: "通过摇镜揭示隐藏信息。", descEn: "Pan to reveal hidden information.", promptZh: "通过揭示摇镜逐步带出新信息，不要突然硬切。", promptEn: "Use a reveal pan to uncover new information." },
  { id: "whip_pan", tier: "pro_plus", category: "dialogue_grammar", labelZh: "甩镜", labelEn: "Whip Pan", descZh: "高速摇镜制造节奏和冲击。", descEn: "Fast whip pan for energetic transitions.", promptZh: "使用甩镜制造强烈节奏变化和视觉冲击。", promptEn: "Use a whip pan for high-energy transition." },
  { id: "reaction_push", tier: "pro_plus", category: "dialogue_grammar", labelZh: "反应推进", labelEn: "Reaction Push", descZh: "在情绪点上突然靠近反应对象。", descEn: "Push in on the reaction beat.", promptZh: "在反应点做短推进，强调情绪变化。", promptEn: "Use a short push-in to emphasize a reaction beat." },
  { id: "eyeline_match", tier: "pro_plus", category: "dialogue_grammar", labelZh: "视线匹配", labelEn: "Eyeline Match", descZh: "按角色视线方向切到其所见。", descEn: "Cut by matching the character's eyeline.", promptZh: "按视线匹配组织镜头，确保所见信息顺接。", promptEn: "Use eyeline matching to connect what the character sees." },

  { id: "same_space_shift", tier: "pro_plus", category: "transition_time", labelZh: "同空间切换", labelEn: "Same Space Shift", descZh: "仍在同一空间内换角度和节奏。", descEn: "Shift camera grammar inside the same space.", promptZh: "保持同一空间不变，仅切换镜头角度和节奏。", promptEn: "Keep the same location while shifting angle and rhythm." },
  { id: "indoor_outdoor_pass", tier: "pro_plus", category: "transition_time", labelZh: "室内外穿越", labelEn: "Indoor-Outdoor Pass", descZh: "穿门或穿窗完成室内外切换。", descEn: "Pass through a doorway/window to switch indoor-outdoor.", promptZh: "通过门框或开口完成室内外切换，光线过渡自然。", promptEn: "Transition between indoor and outdoor through a doorway or opening." },
  { id: "location_switch", tier: "pro_plus", category: "transition_time", labelZh: "地点切换", labelEn: "Location Switch", descZh: "直接切到另一个明确地点。", descEn: "Cut directly to a new location.", promptZh: "直接切换到新地点，上一镜和下一镜要有叙事对应。", promptEn: "Switch to a new location with clear narrative linkage." },
  { id: "time_jump", tier: "pro_plus", category: "transition_time", labelZh: "时间跳切", labelEn: "Time Jump", descZh: "时间向前跳，人物延续但状态变化。", descEn: "Jump forward in time while keeping narrative continuity.", promptZh: "进行时间跳切，人物延续但时间状态明显变化。", promptEn: "Use a time jump while preserving character continuity." },
  { id: "match_cut", tier: "pro_plus", category: "transition_time", labelZh: "匹配剪辑", labelEn: "Match Cut", descZh: "动作、形状或方向上匹配转场。", descEn: "Transition by matching motion, shape, or direction.", promptZh: "使用匹配剪辑，上一镜和下一镜在形状或动作上呼应。", promptEn: "Use a match cut with shape or motion continuity." },
  { id: "morph_cut", tier: "pro_plus", category: "transition_time", labelZh: "形变转场", labelEn: "Morph Cut", descZh: "两个画面在形态中间连续融合。", descEn: "Blend shots through a morphing transition.", promptZh: "用形变转场让两个镜头平滑融合。", promptEn: "Blend shots through a morph-like transition." },
  { id: "doorframe_wipe", tier: "pro_plus", category: "transition_time", labelZh: "门框擦切", labelEn: "Doorframe Wipe", descZh: "借遮挡物做自然擦切。", descEn: "Use a doorway or obstacle as a wipe transition.", promptZh: "借门框或遮挡完成自然擦切。", promptEn: "Use a doorway or obstruction as a natural wipe." },
  { id: "light_dissolve", tier: "pro_plus", category: "transition_time", labelZh: "光线溶解", labelEn: "Light Dissolve", descZh: "用强光或暗部融接场景。", descEn: "Dissolve through a bright or dark light field.", promptZh: "用强光或暗部区域完成溶解转场。", promptEn: "Dissolve through bright light or dark fade regions." },

  { id: "dolly_zoom", tier: "pro_plus", category: "psychology", labelZh: "眩晕变焦", labelEn: "Dolly Zoom", descZh: "主体尺度相对稳定，背景压缩或拉开。", descEn: "Keep subject scale while the background distorts.", promptZh: "使用眩晕变焦，主体相对稳定，背景空间明显压缩或拉伸。", promptEn: "Use a dolly zoom with stable subject scale and distorted background depth.", disabledByBasic: ["locked_static", "fast_push", "fast_pull"] },
  { id: "vertigo_drop", tier: "pro_plus", category: "psychology", labelZh: "坠落眩晕", labelEn: "Vertigo Drop", descZh: "向下失重感和心理坠落感。", descEn: "Create a falling, destabilized sensation.", promptZh: "营造坠落眩晕感，空间像在向下塌陷。", promptEn: "Create a falling vertigo feeling with collapsing space." },
  { id: "memory_palace", tier: "pro_plus", category: "psychology", labelZh: "记忆宫殿", labelEn: "Memory Palace", descZh: "空间里一个区域接一个区域唤起记忆。", descEn: "Let spatial zones trigger memory-like progression.", promptZh: "把空间组织成记忆宫殿式推进，每经过一处唤起一层记忆。", promptEn: "Use memory-palace progression where space unlocks memory in layers." },
  { id: "subconscious_reveal", tier: "pro_plus", category: "psychology", labelZh: "潜意识浮现", labelEn: "Subconscious Reveal", descZh: "隐藏形象从背景里慢慢浮出来。", descEn: "A hidden image slowly emerges from the background.", promptZh: "潜意识图像从背景里缓慢浮现，不要直接硬出现。", promptEn: "Let subconscious imagery emerge gradually from the background." },
  { id: "dream_drift", tier: "pro_plus", category: "psychology", labelZh: "梦境漂移", labelEn: "Dream Drift", descZh: "空间和镜头轻微失真，像梦里移动。", descEn: "Gentle drift and disorientation like a dream.", promptZh: "镜头和空间带轻微漂移感，营造梦境不稳定性。", promptEn: "Add gentle dreamlike drift and slight spatial instability." },
  { id: "paranoia_peek", tier: "pro_plus", category: "psychology", labelZh: "窥视压迫", labelEn: "Paranoia Peek", descZh: "像有人在暗处观察主体。", descEn: "Create the feeling of hidden surveillance.", promptZh: "镜头像在暗处窥视主体，形成被观察的压迫感。", promptEn: "Frame as if the subject is being secretly watched." },
  { id: "freeze_orbit", tier: "pro_plus", category: "psychology", labelZh: "冻结环视", labelEn: "Freeze Orbit", descZh: "主体像冻结，镜头绕着情绪点转。", descEn: "Freeze the moment and orbit around the emotional point.", promptZh: "主体动作像被瞬间冻结，镜头继续环视情绪核心。", promptEn: "Freeze the action beat while the camera keeps orbiting." },
  { id: "sudden_realization", tier: "pro_plus", category: "psychology", labelZh: "顿悟逼近", labelEn: "Realization Push", descZh: "发现真相时镜头心理逼近。", descEn: "Psychological push-in on realization.", promptZh: "在顿悟瞬间做心理逼近，突出真相被意识到的感觉。", promptEn: "Push in psychologically at the realization moment." },

  { id: "liquid_metal", tier: "pro_plus", category: "surreal_material", labelZh: "液体金属", labelEn: "Liquid Metal", descZh: "主体边缘或环境像液态金属流动。", descEn: "Surfaces behave like flowing liquid metal.", promptZh: "让主体或环境出现液体金属般的流动质感。", promptEn: "Introduce flowing liquid-metal behavior on surfaces." },
  { id: "silhouette_animation", tier: "pro_plus", category: "surreal_material", labelZh: "剪影动画", labelEn: "Silhouette Animation", descZh: "主体以轮廓和边缘光驱动。", descEn: "Drive the scene through silhouette and rim-light motion.", promptZh: "用剪影和边缘光组织动作，主体细节弱化为轮廓。", promptEn: "Drive the action through silhouette and rim-light emphasis." },
  { id: "smoke_manifest", tier: "pro_plus", category: "surreal_material", labelZh: "烟雾显形", labelEn: "Smoke Manifest", descZh: "角色或物体从雾里显形。", descEn: "Characters or objects manifest from smoke.", promptZh: "让角色或物体从烟雾中逐渐显形。", promptEn: "Let the subject gradually manifest from smoke." },
  { id: "particle_assemble", tier: "pro_plus", category: "surreal_material", labelZh: "粒子聚合", labelEn: "Particle Assemble", descZh: "物体由粒子重新组合成型。", descEn: "Assemble the subject out of particles.", promptZh: "让主体由粒子聚合成型，过程清晰可见。", promptEn: "Assemble the subject visibly out of particles." },
  { id: "glass_refraction", tier: "pro_plus", category: "surreal_material", labelZh: "玻璃折射", labelEn: "Glass Refraction", descZh: "镜头像穿过玻璃和折射层。", descEn: "Shoot through refractive glass layers.", promptZh: "镜头像穿过玻璃折射层，画面边缘产生光学偏移。", promptEn: "Shoot through refractive glass for optical distortion." },
  { id: "mirror_split", tier: "pro_plus", category: "surreal_material", labelZh: "镜面分身", labelEn: "Mirror Split", descZh: "反射里出现多个版本的主体。", descEn: "Use reflections to split the subject into versions.", promptZh: "利用镜面反射制造分身或多重身份感。", promptEn: "Use reflections to create split identities or doubles." },
  { id: "ink_bloom", tier: "pro_plus", category: "surreal_material", labelZh: "墨迹扩散", labelEn: "Ink Bloom", descZh: "像墨在水中扩散一样展开画面。", descEn: "Let the scene spread like ink in water.", promptZh: "让情绪或画面元素像墨迹一样缓慢扩散。", promptEn: "Let emotion or imagery bloom like ink in water." },
  { id: "neon_pulse", tier: "pro_plus", category: "surreal_material", labelZh: "霓虹脉冲", labelEn: "Neon Pulse", descZh: "灯光和节奏脉冲化。", descEn: "Pulse lighting with rhythmic energy.", promptZh: "霓虹灯光按节奏脉冲变化，形成强烈视频感。", promptEn: "Make neon lighting pulse rhythmically for strong video energy." },

  { id: "skeletal_perspective", tier: "pro_plus", category: "body_perception", labelZh: "骨骼透视", labelEn: "Skeletal Perspective", descZh: "动作时带出骨架和透视结构。", descEn: "Expose bone-like perspective logic during motion.", promptZh: "在动作中强调骨骼透视与身体结构的空间关系。", promptEn: "Emphasize skeletal perspective and body structure in motion." },
  { id: "bullet_time_orbit", tier: "pro_plus", category: "body_perception", labelZh: "子弹时间环视", labelEn: "Bullet Time Orbit", descZh: "动作近似冻结，镜头快速绕看。", descEn: "Freeze the action while the camera orbits fast.", promptZh: "营造子弹时间效果，动作几乎冻结但镜头继续环视。", promptEn: "Use bullet-time logic: frozen action with orbiting camera." },
  { id: "body_follow_close", tier: "pro_plus", category: "body_perception", labelZh: "贴身尾随", labelEn: "Close Body Follow", descZh: "紧贴人物身体后方或侧后方。", descEn: "Stay very close to the body from behind or beside.", promptZh: "镜头贴近人物身体尾随，强调呼吸和步伐存在感。", promptEn: "Stay close to the body to emphasize breath and movement." },
  { id: "first_person_rush", tier: "pro_plus", category: "body_perception", labelZh: "第一人称冲刺", labelEn: "First-Person Rush", descZh: "第一人称快速前冲。", descEn: "Rush forward in first-person perspective.", promptZh: "使用第一人称冲刺视角，形成强代入和速度感。", promptEn: "Use a rushing first-person perspective for strong immersion." },
  { id: "third_person_tail", tier: "pro_plus", category: "body_perception", labelZh: "第三人称尾随", labelEn: "Third-Person Tail", descZh: "像游戏镜头那样跟随角色。", descEn: "Follow like a third-person game camera.", promptZh: "使用第三人称尾随镜头，稳定跟随角色移动。", promptEn: "Use a third-person follow camera to trail the character." },
  { id: "role_swap_pass", tier: "pro_plus", category: "body_perception", labelZh: "身位互换", labelEn: "Role Swap Pass", descZh: "镜头经过遮挡后主次人物前后交换。", descEn: "Swap foreground-background dominance through a pass.", promptZh: "镜头经过遮挡后让主次人物完成前后身位互换。", promptEn: "Swap subject dominance after passing an occluder." },
  { id: "freeze_then_push", tier: "pro_plus", category: "body_perception", labelZh: "冻结后推进", labelEn: "Freeze Then Push", descZh: "动作停住，镜头继续前压。", descEn: "Freeze the body beat while the camera keeps pushing.", promptZh: "先冻结动作，再让镜头继续推进，形成心理聚焦。", promptEn: "Freeze the action beat and continue pushing in." },
  { id: "afterimage_trace", tier: "pro_plus", category: "body_perception", labelZh: "残影拖尾", labelEn: "Afterimage Trace", descZh: "动作后方留下残影。", descEn: "Leave visible afterimages trailing motion.", promptZh: "让角色动作带出明显残影拖尾。", promptEn: "Leave visible afterimage trails behind motion." }
];

const PRESET_MAP = new Map(PRO_CAMERA_PRESETS.map((item) => [item.id, item]));

export function getProCameraPreset(id: string | null | undefined) {
  if (!id) return null;
  return PRESET_MAP.get(id) ?? null;
}

export function getProCameraPresetsByTier(tier: ProMotionTier) {
  return PRO_CAMERA_PRESETS.filter((item) => item.tier === tier);
}

export function getProCameraCategoriesByTier(tier: ProMotionTier) {
  return tier === "basic" ? BASIC_MOTION_CATEGORIES : PRO_PLUS_MOTION_CATEGORIES;
}

function readMarker(notes: string, mark: string) {
  const lines = (notes ?? "").split("\n");
  const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
  return hit ? hit.trim().slice(mark.length).trim() : "";
}

function writeMarker(notes: string, mark: string, value: string) {
  const lines = (notes ?? "").split("\n").filter((line) => line.trim().length > 0);
  const nextLines = lines.filter((line) => !line.trim().toLowerCase().startsWith(mark));
  if (value.trim()) nextLines.push(`${mark} ${value.trim()}`);
  return nextLines.join("\n");
}

export function parseProMotionSelection(notes: string): { basicId: string | null; proPlusIds: string[] } {
  const basicRaw = readMarker(notes, PRO_BASIC_MOTION_MARK);
  const proPlusRaw = readMarker(notes, PRO_PLUS_MOTION_MARK);
  const basicId = getProCameraPreset(basicRaw)?.tier === "basic" ? basicRaw : null;
  const proPlusIds = proPlusRaw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => getProCameraPreset(item)?.tier === "pro_plus");
  return { basicId, proPlusIds: Array.from(new Set(proPlusIds)) };
}

export function applyProMotionSelection(notes: string, selection: { basicId: string | null; proPlusIds: string[] }) {
  const basicNext = selection.basicId && getProCameraPreset(selection.basicId)?.tier === "basic" ? selection.basicId : "";
  const proPlusNext = selection.proPlusIds.filter((id) => getProCameraPreset(id)?.tier === "pro_plus").join(", ");
  let next = writeMarker(notes, PRO_BASIC_MOTION_MARK, basicNext);
  next = writeMarker(next, PRO_PLUS_MOTION_MARK, proPlusNext);
  return next;
}

export function proMotionLabel(id: string, lang: Lang) {
  const item = getProCameraPreset(id);
  if (!item) return id;
  return lang === "zh" ? item.labelZh : item.labelEn;
}

export function proMotionDesc(id: string, lang: Lang) {
  const item = getProCameraPreset(id);
  if (!item) return "";
  return lang === "zh" ? item.descZh : item.descEn;
}

export function proMotionPrompt(id: string, lang: Lang) {
  const item = getProCameraPreset(id);
  if (!item) return "";
  return lang === "zh" ? item.promptZh : item.promptEn;
}

export function summarizeProMotion(selection: { basicId: string | null; proPlusIds: string[] }, lang: Lang) {
  const parts: string[] = [];
  if (selection.basicId) parts.push(`${lang === "zh" ? "基础" : "Basic"}: ${proMotionLabel(selection.basicId, lang)}`);
  if (selection.proPlusIds.length) parts.push(`${lang === "zh" ? "PRO+" : "PRO+"}: ${selection.proPlusIds.map((id) => proMotionLabel(id, lang)).join(lang === "zh" ? "、" : ", ")}`);
  return parts.join(lang === "zh" ? "  ·  " : " · ");
}

export function buildProMotionPromptLine(selection: { basicId: string | null; proPlusIds: string[] }, lang: Lang) {
  const segments: string[] = [];
  if (selection.basicId) segments.push(proMotionPrompt(selection.basicId, lang));
  for (const id of selection.proPlusIds) {
    const line = proMotionPrompt(id, lang);
    if (line) segments.push(line);
  }
  if (!segments.length) return "";
  return lang === "zh"
    ? `专业运镜：${segments.join("；")}`
    : `Pro camera language: ${segments.join("; ")}`;
}

export function proPlusDisabledIds(selection: { basicId: string | null; proPlusIds: string[] }) {
  const disabled = new Set<string>();
  const selected = selection.proPlusIds.map((id) => getProCameraPreset(id)).filter(Boolean) as ProCameraPreset[];
  const selectedCategories = new Set(selected.map((item) => item.category));
  for (const item of getProCameraPresetsByTier("pro_plus")) {
    if (selection.proPlusIds.includes(item.id)) continue;
    if (selectedCategories.has(item.category)) disabled.add(item.id);
    if (selection.basicId && (item.disabledByBasic ?? []).includes(selection.basicId)) disabled.add(item.id);
    if (selected.some((current) => (current.conflicts ?? []).includes(item.id) || (item.conflicts ?? []).includes(current.id))) disabled.add(item.id);
  }
  return disabled;
}

export function beginnerTutorialBlocks(lang: Lang) {
  return [
    {
      title: lang === "zh" ? "怎么用基础运镜" : "How to use Basic Motion",
      body: lang === "zh"
        ? "先选一个基础运镜，再补镜头景别。基础运镜只负责最常见、最容易理解的镜头动作，适合刚上手时直接出结果。"
        : "Choose one Basic Motion first, then pair it with shot size. Basic Motion is the simplest camera layer for first results."
    },
    {
      title: lang === "zh" ? "新手推荐组合" : "Recommended beginner combos",
      body: lang === "zh"
        ? "对话：正面跟拍 + 中景；追人：尾随跟拍 + 广角；情绪：缓慢推进 + 特写；空间介绍：缓慢拉远 + 建立镜头。"
        : "Dialogue: front follow + medium. Chase: back follow + wide. Emotion: slow push + close. Space reveal: slow pull + establishing."
    }
  ];
}

export function advancedTutorialBlocks(lang: Lang) {
  return [
    {
      title: lang === "zh" ? "怎么叠加 PRO+" : "How to stack PRO+",
      body: lang === "zh"
        ? "PRO+ 用来加电影语法、心理效果和超现实视觉。建议一镜最多选 1 个叙事语法 + 1 个时空转场 + 1 个效果模板。"
        : "PRO+ adds film grammar, psychology, and stylized effects. Per shot, keep it to one grammar + one transition + one effect."
    },
    {
      title: lang === "zh" ? "典型高级组合" : "Advanced combinations",
      body: lang === "zh"
        ? "悬疑：缓慢推进 + 眩晕变焦；回忆：缓慢拉远 + 记忆宫殿；科幻：环绕右 + 液体金属；惊悚：手持机感 + 窥视压迫。"
        : "Suspense: slow push + dolly zoom. Memory: slow pull + memory palace. Sci-fi: orbit right + liquid metal. Thriller: handheld + paranoia peek."
    }
  ];
}
