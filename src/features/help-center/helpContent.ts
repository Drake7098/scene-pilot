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
        textZh: "场景领航（ScenePilotix）是专业的 AI 拍摄结构工具。通过填写镜头、对象、布光等结构化参数，自动生成可直接用于 fal / Runway 等平台的高质量提示词。相比从零手写提示词，结构化填写效率更高、结果更稳定。",
        textEn: "ScenePilotix is a structured AI filmmaking tool. Fill in shot, object, and lighting parameters to generate high-quality prompts ready for fal / Runway and other platforms. More efficient and consistent than writing prompts from scratch."
      },
      {
        titleZh: "基本流程",
        titleEn: "Basic flow",
        textZh: "1) 选择模版 — 从模版库选一个符合场景的模版，带入专业结构\n2) 编辑内容 — 在拍摄流程各步骤里填写你的具体对象、环境、风格\n3) 生成或复制 — 直接平台生成，或复制提示词到外部工具使用",
        textEn: "1) Pick a template — choose one from the library that fits your scene\n2) Edit content — fill in your specific objects, environment, and style in each workflow step\n3) Generate or copy — generate directly on platform, or copy prompt for external tools"
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
        textZh: "画布显示当前场景的对象布局。对象可以在画布上拖拽调整位置和大小，也可以在右侧属性面板里精确填写。底部工具栏显示媒体类型、字符数，以及复制提示词和生成按钮。",
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
        textZh: "模版是专业拍摄结构的预设。选一个模版，镜头、布光、风格、对象骨架会自动带入，省去从零搭结构的时间。模版分日常任务（卖货/人物/海报/口播/剧情）和专业任务（连续分镜/多镜对话/动作/动漫等）两大类。",
        textEn: "Templates are professional shooting structure presets. Pick one and camera, lighting, style, and object skeleton are filled in automatically. Templates are split into Daily tasks (product / portrait / poster / presenter / drama) and Pro tasks (continuity / dialogue / action / anime, etc.)."
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
        textZh: "根据你的最终用途选：要拍产品图 → 「卖货出图」；要拍人像写真 → 「人物出图」；要做剧情短视频 → 「剧情短视频」；要做品牌广告 → 专业任务里的「连续分镜」。搜索栏支持按名称、风格、描述搜索。",
        textEn: "Choose by your end goal: product images → Sell Products; portrait → Portrait; drama short video → Drama; brand ad → Pro tasks / Continuity. The search bar supports name, style, and description search."
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
        titleZh: "专业任务分类",
        titleEn: "Pro task categories",
        textZh: "连续分镜：多镜头叙事，保持角色/场景连续性。多镜对话：两人或多人对话场景调度。动作连续：追逐、动作、运动高光等快节奏场景。追逐调度：悬疑、惊悚、紧张张力场景。动漫风格：动漫电影感、竖版短剧等特殊风格。",
        textEn: "Continuity: multi-shot narrative with character/scene consistency. Dialogue: two or more person conversation shot choreography. Action: chase, action, sports highlight fast-paced scenes. Suspense: thriller, mystery, tension-building scenes. Anime: cinematic anime, vertical short drama styles."
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
        textZh: "积分用于两个地方：1) 使用付费模版（2-3积分/次）；2) 平台生成图片/视频（3积分/次）。提示词复制和导出永远免费，不消耗积分。",
        textEn: "Credits are used for two things: 1) using paid templates (2–3 credits each); 2) platform generation of images/video (3 credits each). Prompt copying and export are always free."
      },
      {
        titleZh: "积分包",
        titleEn: "Credit packs",
        textZh: "150积分 $3 — 约50次图片生成\n420积分 $8 — 约140次图片生成（最划算）\n800积分 $15 — 约266次图片生成\n积分不过期，购买后永久有效。Pro 会员每月额外获赠积分。",
        textEn: "150 credits $3 — about 50 image generations\n420 credits $8 — about 140 image generations (best value)\n800 credits $15 — about 266 image generations\nCredits never expire. Pro members receive bonus credits monthly."
      },
      {
        titleZh: "用自己的 API Key",
        titleEn: "Use your own API key",
        textZh: "Pro 用户可在「账户 → API 接入」配置 fal 或 Runway 的 Key。使用自己的 Key 生成不消耗 ScenePilot 积分，只消耗你在 fal/Runway 账户里的余额。适合高频生成的用户。",
        textEn: "Pro users can configure fal or Runway keys in Account → API Access. Generating with your own key doesn't consume ScenePilot credits — only your fal/Runway balance. Good for high-volume users."
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
        textZh: "平台生成（使用 ScenePilot Credits）：图片 3积分/次，视频 5积分/次。使用自己的 API Key（Pro功能）：不消耗 ScenePilot 积分，消耗 fal/Runway 账户余额。本地生成（ComfyUI/Draw Things，Pro功能）：完全免费，不消耗任何积分。",
        textEn: "Platform generation (ScenePilot Credits): image 3 credits, video 5 credits. Own API key (Pro): no ScenePilot credits, uses your fal/Runway balance. Local generation (ComfyUI/Draw Things, Pro): completely free."
      },
      {
        titleZh: "模版计费",
        titleEn: "Template billing",
        textZh: "免费模版：0积分。标准模版：2积分。商业顶级模版：3积分。同一项目里，同一模版只扣一次费用；重新打开或再次编辑不再扣费。",
        textEn: "Free templates: 0 credits. Standard templates: 2 credits. Commercial top-tier: 3 credits. In the same project, the same template is charged only once — reopening or re-editing doesn't charge again."
      },
      {
        titleZh: "Pro 订阅",
        titleEn: "Pro subscription",
        textZh: "Pro 月订阅包含：每月赠送积分 + API接入权限 + 本地生成权限 + 全部专业模版解锁。在「账户中心 → Pro」里升级或管理订阅。",
        textEn: "Pro monthly subscription includes: monthly bonus credits + API access + local generation + all pro templates unlocked. Upgrade or manage in Account → Pro."
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
        textZh: "点击「生成」按钮时，如果有多种生成方式可选，按钮会变成分体式 [生成 | ▼]，点 ▼ 选择：\n☁ 平台生成：使用 ScenePilot 积分，最简单，无需配置\n⚡ 我的 API：使用你自己的 fal/Runway Key，不消耗积分\n💻 本地：使用本机的 ComfyUI 或 Draw Things，完全免费",
        textEn: "When you click Generate, if multiple methods are available the button becomes [Generate | ▼]. Click ▼ to choose:\n☁ Platform: uses ScenePilot credits, simplest, no setup\n⚡ My API: uses your own fal/Runway key, no credits consumed\n💻 Local: uses your local ComfyUI or Draw Things, completely free"
      },
      {
        titleZh: "复制提示词",
        titleEn: "Copy prompt",
        textZh: "点「复制提示词」可以把当前生成的提示词复制到剪贴板，然后粘贴到任意 AI 平台手动生成。提示词不含任何系统标记，干净可用。复制功能需要登录账户。",
        textEn: "Click 'Copy Prompt' to copy the current prompt to clipboard and paste into any AI platform manually. The copied prompt is clean with no system markers. Login required."
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
        textZh: "单张图片或单段视频用单场景即可。需要以下情况时用多场景：完整叙事短片（开场→冲突→高潮→结局）；同一角色在不同地点出现；广告片多镜剪辑；专业任务里的连续分镜工作流。",
        textEn: "Use a single scene for one image or one video clip. Use multiple scenes for: complete narrative short (opening → conflict → climax → ending); same character in different locations; ad film multi-shot edit; pro continuity workflow."
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
        textZh: "点底部工具栏的「复制提示词」，把当前提示词复制到剪贴板。复制的内容干净，没有系统控制标记，可以直接粘贴到任意 AI 平台（Midjourney / 即梦 / Stable Diffusion 等）使用。",
        textEn: "Click 'Copy Prompt' in the bottom bar to copy to clipboard. The copied content is clean with no system markers, ready to paste into any AI platform (Midjourney, Jimeng, Stable Diffusion, etc.)."
      },
      {
        titleZh: "提示词 + 参考图 导出",
        titleEn: "Prompt + refs export",
        textZh: "在左侧菜单「Export → 提示词+参考图」可以导出包含提示词文本和所有参考图的压缩包。适合交付给设计师或存档备用。快捷键 Shift+Cmd+E。",
        textEn: "Left menu Export → Prompt+Refs exports a zip with the prompt text and all reference images. Good for handoff to designers or archiving. Shortcut: Shift+Cmd+E."
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
    titleZh: "API 接入与本地连接",
    titleEn: "API & Local Setup",
    blocks: [
      {
        titleZh: "配置外部 API Key",
        titleEn: "Set up external API key",
        textZh: "在「账户中心 → API 接入」里配置 fal 或 Runway 的 API Key。启用后，生成时选「我的 API」就会使用你自己的账户生成，不消耗 ScenePilot 积分。这是 Pro 专属功能。",
        textEn: "In Account → API Access, configure your fal or Runway API key. Once enabled, choose 'My API' when generating to use your own account — no ScenePilot credits consumed. Pro feature."
      },
      {
        titleZh: "连接 ComfyUI",
        titleEn: "Connect ComfyUI",
        textZh: "本地运行 ComfyUI 时，在「API 接入」→「本地生成」区域填入 URL（默认 http://127.0.0.1:8188）。注意：ComfyUI 启动时需要加 --enable-cors-header 参数，否则浏览器无法访问。",
        textEn: "When running ComfyUI locally, enter the URL (default http://127.0.0.1:8188) in API Access → Local Generation. Important: start ComfyUI with --enable-cors-header flag, otherwise the browser can't access it."
      },
      {
        titleZh: "连接 Draw Things",
        titleEn: "Connect Draw Things",
        textZh: "在 Draw Things 应用设置里开启「API 服务」，然后在「API 接入」→「本地生成」填入地址（默认 http://127.0.0.1:7888）。Draw Things 只支持图片生成，不支持视频。",
        textEn: "Enable 'API Service' in Draw Things settings, then enter the address (default http://127.0.0.1:7888) in API Access → Local Generation. Draw Things supports image only, not video."
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
        textZh: "复制的提示词可以粘贴到：\n• fal.ai — 图片和视频都支持\n• Runway — 高质量视频\n• Midjourney — 图片\n• 即梦 / 海螺 — 国内平台\n• Stable Diffusion / ComfyUI — 本地开源方案\n\n直接在 ScenePilot 里点「生成」按钮也可以，用平台积分或自己的 Key。",
        textEn: "Paste the copied prompt into:\n• fal.ai — image and video\n• Runway — high-quality video\n• Midjourney — image\n• Local Stable Diffusion / ComfyUI\n\nOr click Generate directly in ScenePilot — uses platform credits or your own key."
      },
      {
        titleZh: "积分消耗了但没有生成结果",
        titleEn: "Credits deducted but no result",
        textZh: "生成失败时积分会自动退回，请稍等片刻后刷新账户页面查看余额。如果余额确实减少但没有结果，请联系客服，提供项目名称和大致时间。",
        textEn: "Credits are automatically refunded on generation failure — refresh the account page after a moment to check balance. If balance decreased without a result, contact support with your project name and approximate time."
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
