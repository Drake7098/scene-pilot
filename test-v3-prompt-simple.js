// 模拟 V3 提示词引擎行为

// 翻译表
const RENDER = {
  commercial: "luxury product advertisement, high-end commercial film, cinematic studio photography"
};

const SHOT = {
  MS: "medium shot"
};

const FOCAL = {
  "85mm": "85mm prime lens"
};

const DOF = {
  very_shallow: "extremely shallow depth of field, subject sharp, background dissolved into bokeh"
};

const MOVEMENT = {
  orbit: "orbital arc around subject"
};

const BG = {
  gradient_black: "deep gradient dark background, near-black to pure black"
};

const ENV_MOOD = {
  luxurious: "quiet opulence, premium atmosphere"
};

const KEY_TIME = {
  studio: "studio lighting setup"
};

const COLOR_TEMP = {
  "3200K": "3200K tungsten warm light"
};

const SPEC_LIGHT = {
  rim_light: "strong rim light on subject edges"
};

const GRADE = {
  warm_golden: "warm golden grade, luxurious amber"
};

const NARRATIVE = {
  meditative: "meditative pace, still and contemplative"
};

// 生成提示词
function generateV3Prompt() {
  // 结构化输入
  const structuredInput = {
    theme: "luxury product advertisement",
    camera: "medium shot, 85mm prime lens, extremely shallow depth of field, orbital arc around subject, 8-second duration",
    action: "camera orbit around product, product static, no cut, continuous shot, meditative slow pacing",
    subject: "luxury mechanical wristwatch, polished gold case, brushed metal finishing, textured dial, applied hour markers, engraved crown, sapphire crystal glass, dark brown leather strap, fine stitching",
    composition: "centered, mid-frame, prominently sized, perfect centered composition, clean negative space, 1:1 aspect ratio, pedestal display",
    lighting: "studio lighting setup, 3200K tungsten warm light, strong rim light on subject edges, controlled highlights, deep shadow falloff",
    environment: "deep gradient dark background, near-black to pure black, reflective black surface",
    color: "warm golden grade, luxurious amber",
    mood: "quiet opulence, premium atmosphere, still and contemplative",
    quality: "photorealistic, professional commercial cinematography, high dynamic range, 8K ultra detail",
    engineParams: "--ar 1:1 --v 6.1 --style raw"
  };

  // 编译中间层 - 按 V3 引擎的 14 段结构
  const segments = [
    // 1 STYLE
    RENDER.commercial,
    
    // 2 CAMERA
    [SHOT.MS, FOCAL["85mm"], DOF.very_shallow].filter(Boolean).join(", "),
    
    // 3 MOTION (video only)
    null,
    
    // 4 SUBJECT_BASE
    "luxury mechanical wristwatch, polished gold case, brushed metal finishing, textured dial, applied hour markers, engraved crown, sapphire crystal glass, dark brown leather strap, fine stitching, pedestal display, centered, mid-frame, prominently sized",
    
    // 5 SUBJECT_COSTUME
    null,
    
    // 6 SUBJECT_PROPS
    null,
    
    // 7 SUBJECT_ACTION
    "product static",
    
    // 8 SUBJECT_STATE
    null,
    
    // 9 SUBJECT_DETAIL
    null,
    
    // 10 COMPOSITION
    "perfect centered composition, clean negative space, 1:1 aspect ratio",
    
    // 11 LIGHTING
    [KEY_TIME.studio, COLOR_TEMP["3200K"], SPEC_LIGHT.rim_light, "controlled highlights, deep shadow falloff"].filter(Boolean).join(", "),
    
    // 12 ENVIRONMENT
    "deep gradient dark background, near-black to pure black, reflective black surface",
    
    // 13 MOOD
    [ENV_MOOD.luxurious, NARRATIVE.meditative].filter(Boolean).join(", "),
    
    // 14 TECHNICAL
    "photorealistic, professional commercial cinematography, high dynamic range, 8K ultra detail"
  ];

  // 过滤空值并连接
  const compiledPrompt = segments.filter(Boolean).join(",\n");

  // 最终提示词
  const finalPrompt = compiledPrompt + "\n--ar 1:1 --v 6.1 --style raw";

  // 输出结果
  console.log('【结构化输入】');
  console.log(JSON.stringify(structuredInput, null, 2));
  console.log('\n【编译中间层】');
  console.log(compiledPrompt);
  console.log('\n【最终 Prompt】');
  console.log(finalPrompt);
  console.log('\n【冲突处理 / 去重 / 平台适配说明】');
  console.log('1. 无冲突消解：所有输入字段兼容');
  console.log('2. 无字段去重：所有字段唯一');
  console.log('3. 无平台适配：使用默认通用格式');
  console.log('4. 权重按 V3 引擎默认顺序：STYLE → CAMERA → MOTION → SUBJECT → COMPOSITION → LIGHTING → ENVIRONMENT → MOOD → TECHNICAL');
}

// 运行生成
generateV3Prompt();
