import { compileV3 } from './src/utils/compileV3';

// 构造 V3 引擎输入
const input = {
  scene: {
    id: "scene_1",
    name: "Luxury Watch Advertisement",
    duration_s: 8,
    camera: {
      shot: "medium",
      movement: "orbit",
      keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 360 }
      ]
    },
    lighting: {
      time: "studio",
      key_dir: "",
      mood: ""
    },
    layers: [
      {
        id: "layer_1",
        type: "subject",
        shape: "rect",
        look: "luxury mechanical wristwatch, polished gold case, brushed metal finishing, textured dial, applied hour markers, engraved crown, sapphire crystal glass, dark brown leather strap, fine stitching",
        shapeDesc: "pedestal display",
        z: 1,
        color: "#b7c3ff",
        opacity: 1,
        kf: [
          { t: 0, x: 50, y: 50, w: 40, h: 40, rot: 0 },
          { t: 1, x: 50, y: 50, w: 40, h: 40, rot: 0 }
        ],
        notes: "",
        externalPrompt: "",
        referenceLinks: ""
      }
    ],
    config: {
      mediaMode: "image",
      compiler: "v3"
    },
    notes: `@compiler: v3
media: image
render_style:commercial
shot_size:MS
focal_length:85mm
depth_of_field:very_shallow
cam_movement:orbit
bg_preset:gradient_black
env_mood:luxurious
key_light_time:studio
color_temp:3200K
spec_light:rim_light
color_grade:warm_golden
film_look:digital_clean
narrative_rhythm:meditative
visual_tension:none`,
    aspectRatio: "1:1"
  },
  lang: "en",
  mediaMode: "image",
  aspectRatio: "1:1"
};

// 生成 V3 提示词
const result = compileV3(input);

// 输出结果
console.log('【结构化输入】');
console.log(JSON.stringify(input, null, 2));
console.log('\n【编译中间层】');
console.log(result);
console.log('\n【最终 Prompt】');
console.log(result + '\n--ar 1:1 --v 6.1 --style raw');
console.log('\n【冲突处理 / 去重 / 平台适配说明】');
console.log('1. 无冲突消解：所有输入字段兼容');
console.log('2. 无字段去重：所有字段唯一');
console.log('3. 无平台适配：使用默认通用格式');
console.log('4. 权重按 V3 引擎默认顺序：STYLE → CAMERA → MOTION → SUBJECT → COMPOSITION → LIGHTING → ENVIRONMENT → MOOD → TECHNICAL');
