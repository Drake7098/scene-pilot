/**
 * Help Center — 全部更新为当前实际功能
 * 基于 V3 编译器、结构化对象、生成弹窗、积分体系
 */

import type { HelpSectionId } from "./types";

export type HelpContentBlock = {
  titleZh: string;
  titleEn: string;
  textZh: string;
  textEn: string;
};

export type HelpSectionContent = {
  titleZh: string;
  titleEn: string;
  blocks: HelpContentBlock[];
};

const CONTENT: Record<HelpSectionId, HelpSectionContent> = {

  intro: {
    titleZh: "什么是场景领航",
    titleEn: "What is ScenePilotix",
    blocks: [
      {
        titleZh: "核心定位",
        titleEn: "What it does",
        textZh: "场景领航（ScenePilotix）是结构化创作工作台。你先确定任务和模板，再填写镜头、对象、布光、风格等结构信息，最后复制提示词、导出项目包，或用自己的 API / 本地引擎继续执行。",
        textEn: "ScenePilotix is a structured creation workspace. Start from a task and template, fill in camera, object, lighting, and style structure, then copy the prompt, export a project package, or continue with your own API or local engine."
      },
      {
        titleZh: "基本流程",
        titleEn: "Basic flow",
        textZh: "1) 选择任务和模板\n2) 在拍摄流程里补充你的主体、环境、镜头和风格\n3) 复制提示词或导出项目包\n4) Pro 用户可在最后一步使用自己的 API 或本地引擎执行",
        textEn: "1) Choose a task and template\n2) Fill in subject, environment, camera, and style in the workflow\n3) Copy the prompt or export a project package\n4) Pro users can execute in the final step with their own API or local engine"
      },
      {
        titleZh: "和普通提示词工具的区别",
        titleEn: "vs. regular prompt tools",
        textZh: "普通工具是写文字。场景领航是结构化填表——对象有位置、大小、材质、动作；镜头有景别、运动、角度；布光有时间、方向、氛围。结构决定了 AI 生成的可控性，越结构化，结果越接近你想要的。",
        textEn: "Regular tools are about writing text. ScenePilotix is structured form-filling — objects have position, size, material, action; camera has shot, movement, angle; lighting has time, direction, mood. Structure controls AI output — more structure means results closer to what you want."
      }
    ]
  },

  workspace: {
    titleZh: "工作台",
    titleEn: "Workspace",
    blocks: [
      {
        titleZh: "左侧栏",
        titleEn: "Left panel",
        textZh: "左侧第一栏是项目菜单（新建/打开/保存/导出），可折叠。折叠后点头像弹出用户菜单。第二栏是拍摄流程步骤导航（镜头→导演→场景→对象→灯光→风格→提示词引擎）和工具区。",
        textEn: "The first left column is the project menu (new / open / save / export), collapsible. When collapsed, click the avatar to open the user menu. The second column has workflow step navigation and tools."
      },
      {
        titleZh: "画布区域",
        titleEn: "Canvas area",
        textZh: "画布显示当前场景的对象布局。对象可以在画布上拖拽调整位置和大小，也可以在右侧属性面板里精确填写。底部区域主要负责复制提示词、导出项目包，以及 Pro 的自有 API / 本地生成动作。",
        textEn: "The canvas shows the current scene's object layout. Objects can be dragged to adjust position and size, or set precisely in the right properties panel. The bottom bar shows media type, character count, and buttons to copy prompts or generate."
      },
      {
        titleZh: "右侧属性面板",
        titleEn: "Properties panel",
        textZh: "根据当前选中的步骤显示对应内容：选「镜头」显示景别和运动设置；选「对象」显示对象列表和详细属性（服装/道具/动作/表情等14个字段）。属性填得越详细，生成结果越精准。",
        textEn: "Shows content based on the selected step: select Camera to see shot and movement; select Objects to see the object list and detailed attributes (costume, props, action, expression — 14 fields). More detail means more precise results."
      }
    ]
  },

  templates: {
    titleZh: "模版库",
    titleEn: "Templates",
    blocks: [
      {
        titleZh: "模版是什么",
        titleEn: "What templates are",
        textZh: "模版是专业拍摄结构的预设。选一个模版，镜头、布光、风格、对象骨架会自动带入，省去从零搭结构的时间。模版分日常任务（商品展示 / 人物形象 / 封面视觉 / 口播视频 / 剧情片段）和专业创作（广告镜头 / 影视镜头 / 动画镜头 / 游戏视觉 / 风格实验）两大类。",
        textEn: "Templates are professional shooting structure presets. Pick one and camera, lighting, style, and object skeleton are filled in automatically. Templates are split into Daily tasks (product showcase / character portraits / cover visuals / talking videos / story snippets) and Pro creation (ad shots / film shots / animation shots / game visuals / style experiments)."
      },
      {
        titleZh: "免费和付费模版",
        titleEn: "Free and paid templates",
        textZh: "免费（0积分）：单场景图片基础款、电商直发、基础人像写真等。\n2积分：视频基础款、电影风格图片。\n3积分：奢侈品商业大片、完整广告片、专业叙事视频。\n限时免费标签：部分3积分模版会定期标记为限时免费，把握机会体验顶级商业效果。",
        textEn: "Free (0 credits): single-scene image basics, ecommerce, basic portraits.\n2 credits: basic video, cinematic image styles.\n3 credits: luxury commercial, full ad films, pro narrative video.\nLimited-time free: some 3-credit templates are occasionally marked free — a chance to try top commercial quality."
      },
      {
        titleZh: "如何选模版",
        titleEn: "How to choose",
        textZh: "根据你的最终用途选：要拍产品图 → 「商品展示」；要拍人像写真 → 「人物形象」；要做剧情向短片 → 「剧情片段」；要做品牌广告或商业叙事 → 专业创作里的对应分类。搜索栏支持按名称、风格、描述搜索。",
        textEn: "Choose by your end goal: product images → Product Showcase; portraits → Character Portraits; story-led short videos → Story Snippets; brand ads or commercial narratives → the matching Pro creation category. The search bar supports name, style, and description search."
      }
    ]
  },

  advanced_templates: {
    titleZh: "专业模版",
    titleEn: "Pro Templates",
    blocks: [
      {
        titleZh: "什么是专业模版",
        titleEn: "What are pro templates",
        textZh: "专业模版（3积分）是面向商业制作的顶级结构，包括：腕表广告、香水大片、汽车夜景、IMAX史诗叙事、霓虹情绪叙事、时装品牌短片、30秒商业广告等。这些模版填满了14个以上的对象字段，镜头参数精确，布光细腻，比用户自己从零写提示词高效10倍以上。",
        textEn: "Pro templates (3 credits) are top-tier structures for commercial production: luxury watch ads, perfume campaigns, car night posters, IMAX epic narratives, neon emotional films, fashion brand shorts, 30-second commercials. They fill 14+ object fields with precise camera and lighting — 10x more efficient than writing from scratch."
      },
      {
        titleZh: "专业创作分类",
        titleEn: "Pro task categories",
        textZh: "广告镜头：商业叙事、品牌片和宣传片的镜头组织。影视镜头：人物关系、走位交流和叙事切换。动画镜头：动画、赛博朋克与强演出感画面。游戏视觉：动作、对抗和高速节奏场景。风格实验：悬疑、压迫和风格化镜头尝试。",
        textEn: "Ad Shots: brand films, promos, and commercial narrative coverage. Film Shots: relationships, blocking, and narrative cut grammar. Animation Shots: animation, cyberpunk, and performance-driven visuals. Game Visuals: action, confrontation, and fast visual rhythm. Style Experiments: suspense, pressure, and style-forward cinematic trials."
      }
    ]
  },

  credits: {
    titleZh: "积分",
    titleEn: "Credits",
    blocks: [
      {
        titleZh: "积分用在哪里",
        titleEn: "What credits are used for",
        textZh: "积分不再用于官方托管生成。当前积分主要用于平台内模板、高级功能和后续平台能力。复制提示词、导出项目包、以及使用你自己的 API / 本地引擎，不通过 ScenePilot 积分结算。",
        textEn: "Credits are no longer used for hosted generation. They are now mainly for in-product templates, advanced features, and future platform capabilities. Copying prompts, exporting packages, and using your own API or local engine do not bill through ScenePilot credits."
      },
      {
        titleZh: "积分包",
        titleEn: "Credit packs",
        textZh: "当前积分包：150 / $3，420 / $8，800 / $15。积分不过期，购买后保留在账户内。Pro 会员每月额外赠送 280 Credits。",
        textEn: "Current credit packs: 150 / $3, 420 / $8, 800 / $15. Credits do not expire and stay in your account after purchase. Pro members receive 280 bonus credits every month."
      },
      {
        titleZh: "用自己的 API Key",
        titleEn: "Use your own API key",
        textZh: "Pro 用户可在「账户中心 → API Keys」接入自己的云端 API。相关费用、配额、封号和政策变化由第三方平台决定，不由 ScenePilot 积分承担。",
        textEn: "Pro users can connect their own cloud APIs in Account Center → API Keys. Costs, quotas, suspensions, and policy changes are determined by the third-party provider, not by ScenePilot credits."
      }
    ]
  },

  billing: {
    titleZh: "计费说明",
    titleEn: "Billing",
    blocks: [
      {
        titleZh: "生成计费",
        titleEn: "Generation billing",
        textZh: "ScenePilot 不再提供官方托管生成，因此也没有“平台生成扣积分”的计费方式。你在工作台里主要有三种出口：复制提示词、导出项目包、或由 Pro 用户使用自己的 API / 本地引擎执行。",
        textEn: "ScenePilot no longer provides hosted generation, so there is no platform-generation credit billing. In the workspace you mainly have three exits: copy the prompt, export a project package, or, for Pro users, execute with your own API or local engine."
      },
      {
        titleZh: "模版计费",
        titleEn: "Template billing",
        textZh: "模板相关消耗以当前模板定价和账户页说明为准。重点是：模板和平台执行是两条不同链路，不要把模板消耗和第三方 API 费用混在一起理解。",
        textEn: "Template-related consumption follows the current template pricing and account-page rules. The key point: template consumption and execution on third-party APIs are two different paths and should not be treated as the same cost."
      },
      {
        titleZh: "Pro 订阅",
        titleEn: "Pro subscription",
        textZh: "Pro 月订阅主要解锁：自己的 API、ComfyUI / Draw Things 本地执行、更完整的创作能力，以及高级模板。在「账户中心 → Pro」里升级或管理订阅。",
        textEn: "Pro mainly unlocks: your own APIs, local execution with ComfyUI / Draw Things, more complete creative control, and advanced templates. Upgrade or manage in Account Center → Pro."
      }
    ]
  },

  generation: {
    titleZh: "生成",
    titleEn: "Generation",
    blocks: [
      {
        titleZh: "生成方式",
        titleEn: "Generation methods",
        textZh: "当前工作台的生成方式分三类：\n1) 复制提示词：免费主路径\n2) 导出项目包：适合交付、备份和外部继续创作\n3) 自有 API / 本地生成：仅 Pro 可用，用你自己的连接执行",
        textEn: "Current generation modes in the workspace are:\n1) Copy Prompt: the free default path\n2) Export Project Package: for handoff, backup, and continuing outside\n3) BYO API / Local Generation: Pro-only, executed through your own connections"
      },
      {
        titleZh: "复制提示词",
        titleEn: "Copy prompt",
        textZh: "点「复制提示词」会把当前结构化提示词复制到剪贴板。复制内容不带系统隐式标记，适合粘贴到外部平台继续使用。首次复制时会看到风险提示确认。",
        textEn: "Click 'Copy Prompt' to copy the current structured prompt to the clipboard. The copied content has no hidden system markers and is meant for use on external platforms. A short risk acknowledgment appears the first time."
      },
      {
        titleZh: "生成效果不理想怎么办",
        titleEn: "If results aren't right",
        textZh: "1) 检查对象字段是否填充足够详细（服装、道具、动作、表情都填上）\n2) 确认镜头和布光参数是否匹配你想要的效果\n3) 换一个更接近目标风格的模版作为基础\n4) 在「提示词」步骤里直接添加补充描述",
        textEn: "1) Check if object fields are detailed enough (costume, props, action, expression)\n2) Confirm camera and lighting match your target style\n3) Try a different template that's closer to your goal\n4) Add supplementary description in the Prompt step"
      }
    ]
  },

  camera: {
    titleZh: "镜头设置",
    titleEn: "Camera",
    blocks: [
      {
        titleZh: "景别",
        titleEn: "Shot size",
        textZh: "ECU（极近）：眼睛/手指细节。CU（近景）：面部表情。MCU（中近）：胸部以上。MS（中景）：腰部以上。FS（全身）：完整人物。LS（远景）：环境感强。选景别决定了画面的信息密度和情绪距离。",
        textEn: "ECU (extreme close): eye/finger detail. CU (close): facial expression. MCU (medium close): chest up. MS (medium): waist up. FS (full shot): full figure. LS (long): strong environment. Shot size determines information density and emotional distance."
      },
      {
        titleZh: "镜头运动",
        titleEn: "Camera movement",
        textZh: "static：固定机位，稳定庄重。slow_push：缓慢推进，增加压迫感。tracking：跟踪运动主体。handheld：手持抖动，纪实感。orbit：环绕主体，展示全貌（适合产品视频）。zoom_in/out：变焦，突出或收缩感。",
        textEn: "static: fixed, stable, formal. slow_push: gradual push-in, adds tension. tracking: follows moving subject. handheld: shaky, documentary feel. orbit: circles subject, shows all sides (good for product video). zoom_in/out: scale sensation."
      },
      {
        titleZh: "焦距",
        titleEn: "Focal length",
        textZh: "24mm：广角，环境感强，轻微畸变。35mm：人文纪实感，自然视角。50mm：最接近人眼视角，中性。85mm：人像首选，背景虚化，主体突出。100-200mm：压缩空间，主体与背景贴近感。macro：微距，极致细节特写。",
        textEn: "24mm: wide-angle, environmental, slight distortion. 35mm: documentary, natural. 50mm: closest to human eye, neutral. 85mm: portrait standard, background blur. 100-200mm: space compression, subject/background proximity. macro: extreme detail."
      }
    ]
  },

  lighting: {
    titleZh: "灯光设置",
    titleEn: "Lighting",
    blocks: [
      {
        titleZh: "时间与自然光",
        titleEn: "Time and natural light",
        textZh: "studio：棚拍，完全可控。golden_hour：日出/日落前后1小时，暖色最美。blue_hour：日落后，冷蓝调，城市感强。midday：正午硬光，反差大，适合商业感。night：夜景，需补光或霓虹。overcast：阴天，柔光，适合人像。",
        textEn: "studio: fully controlled. golden_hour: warm, 1h before/after sunrise/sunset. blue_hour: post-sunset, cool blue, urban. midday: hard light, high contrast, commercial. night: requires fill or neon. overcast: soft diffused, good for portraits."
      },
      {
        titleZh: "主光方向",
        titleEn: "Key light direction",
        textZh: "front：正面平光，减少阴影，干净明亮。top_left/top_right：45度斜上，经典人像布光。rim_light：背后轮廓光，分离主体与背景。backlight：逆光/剪影。split_light：分割光，半脸明暗，戏剧感强。",
        textEn: "front: flat, even, clean. top_left/top_right: 45° classic portrait. rim_light: backlit edge, separates subject from background. backlight: silhouette/contre-jour. split_light: half-face light/shadow, dramatic."
      },
      {
        titleZh: "氛围与色调",
        titleEn: "Mood and tone",
        textZh: "warm_golden：暖金色，奢侈品/浪漫感。teal_orange：青橙对比，好莱坞商业感。cool_steel：冷钢蓝，科技/现代感。noir：黑白或极低饱和，悬疑感。natural：自然色彩，真实感。cinematic：电影调色，对比度高。",
        textEn: "warm_golden: warm gold, luxury/romance. teal_orange: Hollywood commercial. cool_steel: tech/modern. noir: desaturated, mystery. natural: realistic. cinematic: high contrast filmic."
      }
    ]
  },

  director: {
    titleZh: "风格设置",
    titleEn: "Style",
    blocks: [
      {
        titleZh: "渲染风格",
        titleEn: "Render style",
        textZh: "photorealistic：照片写实，适合商业产品和人像。commercial：高端商业摄影感，奢侈品级别光影。editorial：杂志编辑风，时尚感。filmic：电影质感，自然颗粒。cinematic_still：电影静帧，强叙事感。",
        textEn: "photorealistic: photo-real, for commercial product and portrait. commercial: luxury brand level. editorial: fashion magazine. filmic: cinematic with natural grain. cinematic_still: film frame with strong narrative."
      },
      {
        titleZh: "画面比例",
        titleEn: "Aspect ratio",
        textZh: "1:1：方形，适合社交媒体（小红书/Instagram）。4:5：竖向接近正方，适合手机浏览。9:16：竖屏，适合抖音/Reels。16:9：横屏标准，适合网站/展示。21:9：超宽银幕，史诗电影感。",
        textEn: "1:1: square, social media. 4:5: portrait near-square, mobile. 9:16: vertical, TikTok/Reels. 16:9: landscape standard, website. 21:9: ultra-wide, epic cinematic."
      },
      {
        titleZh: "叙事节奏",
        titleEn: "Narrative rhythm",
        textZh: "meditative：沉思，慢节奏，冥想感。slow_burn：缓慢积累张力。epic_build：史诗感逐渐升腾。urgent：紧迫，快节奏。节奏影响整体提示词的语气和镜头描述方式，让 AI 在同一结构下给出不同情绪基调的结果。",
        textEn: "meditative: slow, contemplative. slow_burn: gradually building tension. epic_build: rising grandeur. urgent: fast-paced. Rhythm affects the tone and how camera descriptions are phrased, giving different emotional results within the same structure."
      }
    ]
  },

  continuity: {
    titleZh: "多场景连续性",
    titleEn: "Multi-scene Continuity",
    blocks: [
      {
        titleZh: "什么时候需要多场景",
        titleEn: "When to use multiple scenes",
        textZh: "单张图片或单段视频用单场景即可。需要以下情况时用多场景：完整叙事短片（开场→冲突→高潮→结局）；同一角色在不同地点出现；广告片多镜剪辑；专业创作里的多镜头工作流。",
        textEn: "Use a single scene for one image or one video clip. Use multiple scenes for: complete narrative short (opening → conflict → climax → ending); same character in different locations; ad film multi-shot edit; multi-shot workflows in Pro creation."
      },
      {
        titleZh: "角色连续性",
        titleEn: "Character continuity",
        textZh: "在对象设置里给角色设定 Continuity ID（如 char_a），跨场景使用同一 ID 可以告诉 AI 这是同一个角色。结合参考图效果更好。对象描述（服装/发型/特征）在多个场景里保持一致，是连续性的基础。",
        textEn: "Set a Continuity ID (e.g. char_a) for a character in object settings. Using the same ID across scenes tells AI it's the same character. Works best with a reference image. Consistent object descriptions (costume, hair, features) across scenes is the foundation of continuity."
      },
      {
        titleZh: "场景衔接",
        titleEn: "Scene transitions",
        textZh: "每个场景可设置进出方向（入画方向/出画方向）和转场类型（cut直切/dissolve溶解/reverse_angle反角/match_cut动作衔接）。正确设置转场能让生成的多段视频剪辑在一起时更自然流畅。",
        textEn: "Each scene has entry/exit direction and transition type (cut / dissolve / reverse_angle / match_cut). Correct transition settings make multiple generated clips feel naturally connected when edited together."
      }
    ]
  },

  export: {
    titleZh: "导出与复制",
    titleEn: "Export & Copy",
    blocks: [
      {
        titleZh: "复制提示词",
        titleEn: "Copy prompt",
        textZh: "点底部区域的「复制提示词」，把当前提示词复制到剪贴板。复制内容干净，不带系统隐藏标记，可直接粘贴到外部平台使用。",
        textEn: "Click 'Copy Prompt' in the bottom area to copy the current prompt to the clipboard. The copied content is clean, contains no hidden system markers, and can be pasted into external platforms directly."
      },
      {
        titleZh: "导出项目包",
        titleEn: "Export project package",
        textZh: "导出项目包会根据你选择的导出类型输出统一结构。常用类型包括：通用、含参考图、不含参考图、仅提示词（TXT）。适合交付、备份和跨平台继续创作。",
        textEn: "Export Project Package outputs a unified structure based on the export type you choose. Common types include universal, with references, without references, and prompt-only (TXT). It is best for handoff, backup, and continuing across tools."
      },
      {
        titleZh: "保存项目",
        titleEn: "Save project",
        textZh: "项目保存在本地浏览器存储。Cmd+S 保存当前项目，Shift+Cmd+S 另存为新项目。如果换设备或清除浏览器数据，项目会丢失——建议定期导出项目包备份。",
        textEn: "Projects are saved to local browser storage. Cmd+S to save, Shift+Cmd+S to save as. Projects are lost if you switch devices or clear browser data — export project packages periodically as backup."
      }
    ]
  },

  platform: {
    titleZh: "API 与本地接入",
    titleEn: "API & Local Setup",
    blocks: [
      {
        titleZh: "云端 API 接入",
        titleEn: "Cloud API setup",
        textZh: "在「账户中心 → API Keys」中配置云端 API。接入中心按能力分层说明，但真正的 provider 只在管理列表里出现一次。保存前可以先测试连接。这些能力仅 Pro 可用。",
        textEn: "Configure cloud APIs in Account Center → API Keys. The page explains capability layers, but each provider appears only once in the management list. You can test the connection before saving. These capabilities are Pro-only."
      },
      {
        titleZh: "连接 ComfyUI",
        titleEn: "Connect ComfyUI",
        textZh: "本地运行 ComfyUI 时，在「账户中心 → API Keys → Local」填写地址并测试连接。浏览器方式通常需要允许本地访问和正确的 CORS 配置；若本地服务不可达，工作台会提示你先完成连接。",
        textEn: "When running ComfyUI locally, enter the URL (default http://127.0.0.1:8188) in API Access → Local Generation. Important: start ComfyUI with --enable-cors-header flag, otherwise the browser can't access it."
      },
      {
        titleZh: "连接 Draw Things",
        titleEn: "Connect Draw Things",
        textZh: "在 Draw Things 中开启 API 服务后，到「账户中心 → API Keys → Local」填写地址并测试连接。Draw Things 更适合图片工作流；如果你当前是视频任务，优先考虑支持视频的云端 API 或其他本地方案。",
        textEn: "After enabling the API service in Draw Things, enter the address and test it in Account Center → API Keys → Local. Draw Things is better suited to image workflows; for video tasks, prefer a cloud API or another local solution that supports video."
      }
    ]
  },

  faq: {
    titleZh: "常见问题",
    titleEn: "FAQ",
    blocks: [
      {
        titleZh: "生成结果和预期差很多怎么办",
        titleEn: "Result is far from expected",
        textZh: "最常见原因是对象描述太空。检查步骤 6「对象」——服装、材质、动作、表情尽量都填上。其次检查镜头景别是否合适（太远则细节少），布光氛围是否匹配风格。换一个更接近目标的模版也是快速解法。",
        textEn: "Most common cause: object description is too vague. Check Step 6 Objects — fill in costume, material, action, expression. Also check if shot size is right (too far = less detail) and lighting mood matches the style. Switching to a closer template is a quick fix."
      },
      {
        titleZh: "复制提示词后到哪里生成",
        titleEn: "Where to generate after copying",
        textZh: "复制后的提示词可以粘贴到你熟悉的平台或本地工具里继续使用。帮助中心不替你规定唯一平台，重点是：先把结构化提示词整理好，再去你自己的执行环境里生成。",
        textEn: "After copying, you can paste the prompt into the platform or local tool you already use. The Help Center does not prescribe a single destination. The priority is to organize a strong structured prompt first, then execute in your own environment."
      },
      {
        titleZh: "为什么我不能直接生成",
        titleEn: "Why can't I generate directly",
        textZh: "如果你是 Free 用户，只能使用复制提示词和导出项目包。若你选择了「我的 API / ComfyUI / Draw Things」但无法继续，通常是因为未开通 Pro，或还没有在 API Keys 页面完成连接。",
        textEn: "If you are on Free, you can only use Copy Prompt and Export Project Package. If you choose My API / ComfyUI / Draw Things and cannot continue, it is usually because Pro is not enabled yet or the connection has not been completed in API Keys."
      },
      {
        titleZh: "项目保存在哪里，会丢失吗",
        titleEn: "Where are projects saved",
        textZh: "项目存在浏览器本地存储（IndexedDB）。不换设备、不清除浏览器数据就不会丢失。换电脑或用无痕模式时无法访问旧项目。建议养成定期「导出项目包」的习惯，作为本地备份。",
        textEn: "Projects are stored in browser local storage (IndexedDB). They persist unless you switch devices or clear browser data. Incognito mode can't access existing projects. Make a habit of exporting project packages regularly as local backup."
      },
      {
        titleZh: "如何联系客服",
        titleEn: "How to contact support",
        textZh: "在帮助中心底部的反馈区填写问题描述，或通过以下方式联系：微信/微博搜索「场景领航」，商务合作请发邮件。我们通常在1个工作日内回复。",
        textEn: "Fill out the feedback form at the bottom of the Help Center, or reach us through social channels. We typically respond within 1 business day."
      }
    ]
  }
};

export function getHelpContent(sectionId: HelpSectionId): HelpSectionContent {
  return CONTENT[sectionId];
}

export function getHelpContentForLang(
  sectionId: HelpSectionId,
  lang: "zh" | "en"
): { title: string; blocks: Array<{ title: string; text: string }> } {
  const s = CONTENT[sectionId];
  return {
    title: lang === "zh" ? s.titleZh : s.titleEn,
    blocks: s.blocks.map((b) => ({
      title: lang === "zh" ? b.titleZh : b.titleEn,
      text:  lang === "zh" ? b.textZh  : b.textEn
    }))
  };
}
