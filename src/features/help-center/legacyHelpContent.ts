/**
 * LEGACY Help content — preserved for Stage 2 migration reference.
 * Do not render in new Help UI. Old section ids: quick_start, pro_motion_beginner,
 * pro_motion_advanced, export, troubleshoot, feedback, about.
 */

export type LegacyHelpSectionId =
  | "quick_start"
  | "pro_motion_beginner"
  | "pro_motion_advanced"
  | "export"
  | "troubleshoot"
  | "feedback"
  | "about";

export const LEGACY_SECTION_IDS: LegacyHelpSectionId[] = [
  "quick_start",
  "pro_motion_beginner",
  "pro_motion_advanced",
  "export",
  "troubleshoot",
  "feedback",
  "about"
];

/** Raw copy-paste source for Stage 2. Content was in App.tsx (helpCenterSection === "…") */
export const LEGACY_CONTENT_SNIPPETS = {
  quick_start: {
    titleZh: "快速开始",
    titleEn: "Quick Start",
    bodyZh:
      "1) 创建项目：先选图片或视频；结果：确定是单张结构（图片）还是逐镜编辑（视频）。\n2) 搭结构：确定分镜数量、时长、镜头关系；结果：提示词的节奏与连续性被提前锁定。\n3) 编对象：逐镜调整对象位置、大小、层级、参考图；结果：先把结构对齐，再补风格，减少生成漂移。\n4) 导出验证：先看当前提示词，再复制或导出到目标模型平台；结果：快速判断方向、构图和主体关系是否达标。",
    bodyEn:
      "1) Create Project: choose Image or Video first; result: you lock single-image structure (Image) or shot-by-shot editing flow (Video).\n2) Build Structure: set shot count, duration, and shot relationships; result: prompt pacing and continuity are defined before generation.\n3) Edit Objects: tune position, size, layer order, and references shot by shot; result: structure is fixed first, style is added second, reducing drift.\n4) Export & Validate: review current prompt first, then copy/export to the target model platform; result: you can quickly verify direction, composition, and subject relationships."
  },
  export: {
    titleZh: "导出说明",
    titleEn: "Export Guide",
    bodyZh:
      "提示词 TXT 导出：适合快速把当前提示词送到大模型平台，先测试初步效果与方向是否正确；重点验证方向是否对、构图是否对、主体关系是否对。\nPackage Export（交付包导出）：适合正式交付，包含提示词、参考图、说明文件等完整内容；适用于交接、存档和稳定复用。\nCurrent Scene（当前分镜）：只导出当前分镜，适合单镜验证。\nContinuity Sequence（连续序列）：导出当前镜头及后续连续镜头，适合验证镜头衔接和连续性。\nTarget Model（目标模型）：会影响输出文案和结构更偏向哪个模型；不同模型理解方式不同，结果可能存在差异。",
    bodyEn:
      "Prompt TXT Export: best when you need to send the current prompt to a model platform quickly and test whether the initial direction is correct. Use it to validate direction, composition, and subject relationships first.\nPackage Export: best for formal delivery. It includes prompt, references, and instruction files as a complete bundle for handoff, archiving, and stable reuse.\nCurrent Scene: exports only the current shot, ideal for single-shot validation.\nContinuity Sequence: exports the current shot plus following continuous shots, ideal for checking transition quality and sequence continuity.\nTarget Model: changes wording and structure bias toward a selected model profile. Different models may produce different results even with the same project."
  },
  troubleshoot: {
    titleZh: "排错顺序",
    titleEn: "Troubleshooting Order",
    bodyZh: "1) 先看冲突。\n2) 再看对象数量/位置。\n3) 最后调风格和光照词。",
    bodyEn: "1) Check conflicts first.\n2) Verify object count and layout.\n3) Tune style and lighting words last."
  },
  about: {
    titleZh: "关于",
    titleEn: "About",
    productName: "ScenePilotix",
    bodyZh:
      "一个用于“分镜结构 + 精准构图 + 运动轨迹”提示词生成的工具。目标：让大模型更稳定地理解你想要的画面位置、尺寸和运动。",
    bodyEn:
      "A tool for storyboard structure + precise composition + motion paths prompt generation. Goal: make models follow layout/scale/motion more reliably.",
    version: "1.05 (Universal)"
  }
  // pro_motion_beginner / pro_motion_advanced: content came from beginnerCreativeTutorialBlocks, advancedCreativeTutorialBlocks, getVideoClassicModes, getImageClassicModes, PRO_PLUS_MOTION_CATEGORIES, getVisibleVideoProPlusPresets, IMAGE_PRO_CATEGORIES, getImageProEffectsByCategory (see src/content/proCreativeModes.ts, src/content/proCameraPresets.ts).
  // feedback: form + PUBLIC_CONTACT_CHANNELS, template lines, textarea, Copy/Send buttons — see App.tsx feedback block.
};
