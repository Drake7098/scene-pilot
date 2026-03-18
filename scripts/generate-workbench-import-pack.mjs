import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { structureDraftToCanvas } from "../tests/local-ab/dist/src/utils/structureDraftToCanvas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outRoot = path.resolve(repoRoot, "artifacts/import-pack/20260312");
const quickDir = path.join(outRoot, "quick");
const proDir = path.join(outRoot, "pro");

function now() {
  return Date.now();
}

function createLayer({
  id,
  type,
  look,
  notes,
  externalPrompt,
  z,
  t0,
  t1
}) {
  return {
    id,
    type,
    shape: "rect",
    shapeDesc: "",
    look,
    z,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, x: t0.x, y: t0.y, w: t0.w, h: t0.h, rot: t0.rot ?? 0 },
      { t: 1, x: t1.x, y: t1.y, w: t1.w, h: t1.h, rot: t1.rot ?? 0 }
    ],
    notes,
    externalPrompt,
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

function sceneNotes(mediaMode, sceneTier, bg) {
  return [
    `media: ${mediaMode}`,
    "@compiler: v2",
    `@scene_tier: ${sceneTier}`,
    "@v2_mode: strict",
    "stability: standard",
    `bg: ${bg}`
  ].join("\n");
}

function createProject({
  id,
  title,
  mediaType,
  shotPlan,
  scene
}) {
  return {
    project: {
      mode: "storyboard",
      mediaType,
      shotPlan,
      creativeContext: {
        source: "imported",
        mediaType,
        fileName: `${id}.json`,
        primaryInput: title,
        secondaryInput: scene.shotNote ?? "",
        mergedInput: `${title} ${scene.shotNote ?? ""}`.trim(),
        intentSummary: title,
        locationHint: scene.notes,
        styleHint: scene.lighting?.mood ?? "",
        subjectLabels: scene.layers.map((layer) => layer.type).slice(0, 6)
      }
    },
    scenes: [scene]
  };
}

const quickItems = [
  {
    filename: "quick_image_brand_campaign_team.json",
    item: {
      id: "quick_img_brand_team_001",
      title: "品牌海报-团队合影",
      mediaType: "image",
      firstInput: "科技品牌发布会海报，三位团队成员站台，主视觉要干净有质感",
      secondInput: "主讲人居中更大，左右两人形成关系，背景保留品牌灯牌和发布会舞台层次",
      ratio: "16:9",
      durationSec: 6,
      firstLayerSelections: {
        image: { frameType: "multi_subject", compositionFocus: "relation_expression", styleGoal: "commercial" },
        video: { shotStructure: "single_shot", expressionFocus: "character_action", styleGoal: "cinematic" }
      },
      secondLayerSelections: {
        image: { subjectCount: "3", compositionPosition: "center", backgroundComplexity: "normal", subjectScale: "balanced" },
        video: { shotCount: "1", mainScene: "indoor", continuityFocus: "identity", cameraMotion: "follow", sceneTransition: "same_space", shotGrammar: "cut" }
      },
      structureDraft: {
        mediaType: "image",
        primaryBrief: "科技品牌发布会海报，三位团队成员站台，主视觉要干净有质感",
        secondaryBrief: "主讲人居中更大，左右两人形成关系，背景保留品牌灯牌和发布会舞台层次",
        structureType: "multi_subject",
        objects: [
          { id: "obj_1", name: "主讲人", type: "person", role: "primary", depth: "foreground", isPrimary: true },
          { id: "obj_2", name: "左侧团队成员", type: "person", role: "secondary", depth: "midground" },
          { id: "obj_3", name: "右侧团队成员", type: "person", role: "secondary", depth: "midground" },
          { id: "obj_4", name: "品牌灯牌与舞台屏", type: "environment", role: "environment", depth: "background" }
        ],
        scene: "品牌发布会舞台",
        sceneType: "indoor",
        spatialRelations: ["主讲人居中且更大", "两名成员分居左右形成三角关系", "背景保留品牌灯牌与舞台层次"],
        focus: "团队关系清晰，品牌感强",
        relationMode: "left_right",
        emphasis: "三人关系 / 商业海报",
        compositionFocus: "relation_expression",
        styleGoal: "commercial",
        subjectScale: "balanced",
        composition: {
          subjectCount: 3,
          focusMode: "relation",
          framing: "center",
          backgroundDensity: "normal"
        }
      }
    }
  },
  {
    filename: "quick_image_ecommerce_cosmetics.json",
    item: {
      id: "quick_img_ecom_beauty_002",
      title: "电商美妆组合图",
      mediaType: "image",
      firstInput: "电商首页美妆主图，护肤瓶、礼盒和模特手部同框，强调高级感",
      secondInput: "产品在中前景更突出，手部作为辅助动作，礼盒在后侧补层次，背景简洁但不空",
      ratio: "1:1",
      durationSec: 6,
      firstLayerSelections: {
        image: { frameType: "product_object", compositionFocus: "product_showcase", styleGoal: "commercial" },
        video: { shotStructure: "single_shot", expressionFocus: "character_action", styleGoal: "advertising" }
      },
      secondLayerSelections: {
        image: { subjectCount: "3", compositionPosition: "center", backgroundComplexity: "clean", subjectScale: "tight" },
        video: { shotCount: "1", mainScene: "indoor", continuityFocus: "style", cameraMotion: "static", sceneTransition: "same_space", shotGrammar: "insert_closeup" }
      },
      structureDraft: {
        mediaType: "image",
        primaryBrief: "电商首页美妆主图，护肤瓶、礼盒和模特手部同框，强调高级感",
        secondaryBrief: "产品在中前景更突出，手部作为辅助动作，礼盒在后侧补层次，背景简洁但不空",
        structureType: "product_object",
        objects: [
          { id: "obj_1", name: "护肤瓶主体", type: "prop", role: "primary", depth: "foreground", isPrimary: true },
          { id: "obj_2", name: "模特手部", type: "person", role: "support", depth: "midground" },
          { id: "obj_3", name: "礼盒", type: "prop", role: "secondary", depth: "midground" },
          { id: "obj_4", name: "品牌背景板", type: "environment", role: "environment", depth: "background" }
        ],
        scene: "电商影棚产品台",
        sceneType: "product_display",
        spatialRelations: ["护肤瓶居中偏前", "手部从侧边进入形成动作辅助", "礼盒位于后侧形成体块层次"],
        focus: "产品高级质感与购买转化",
        relationMode: "subject_environment",
        emphasis: "产品展示 / 细节质感",
        compositionFocus: "product_showcase",
        styleGoal: "commercial",
        subjectScale: "tight",
        composition: {
          subjectCount: 3,
          focusMode: "subject",
          framing: "center",
          backgroundDensity: "clean"
        }
      }
    }
  },
  {
    filename: "quick_video_clinic_consultation.json",
    item: {
      id: "quick_vid_clinic_consult_003",
      title: "医疗门诊咨询流程",
      mediaType: "video",
      firstInput: "门诊咨询短视频，医生、患者和家属三方沟通，过程要连贯可信",
      secondInput: "先全景建立关系，再到医生解释，最后患者点头确认，保持身份和光线一致",
      ratio: "16:9",
      durationSec: 15,
      firstLayerSelections: {
        image: { frameType: "multi_subject", compositionFocus: "relation_expression", styleGoal: "realistic" },
        video: { shotStructure: "continuous", expressionFocus: "relation_change", styleGoal: "realistic" }
      },
      secondLayerSelections: {
        image: { subjectCount: "3", compositionPosition: "depth", backgroundComplexity: "normal", subjectScale: "balanced" },
        video: { shotCount: "4", mainScene: "indoor", continuityFocus: "identity", cameraMotion: "follow", sceneTransition: "same_space", shotGrammar: "over_shoulder" }
      },
      structureDraft: {
        mediaType: "video",
        primaryBrief: "门诊咨询短视频，医生、患者和家属三方沟通，过程要连贯可信",
        secondaryBrief: "先全景建立关系，再到医生解释，最后患者点头确认，保持身份和光线一致",
        structureType: "continuous",
        scene: "门诊诊室",
        objects: [
          { id: "obj_1", name: "医生", type: "person", role: "primary", depth: "midground", isPrimary: true },
          { id: "obj_2", name: "患者", type: "person", role: "secondary", depth: "midground" },
          { id: "obj_3", name: "家属", type: "person", role: "support", depth: "midground" },
          { id: "obj_4", name: "诊疗桌与病历", type: "prop", role: "environment", depth: "foreground" }
        ],
        shotCount: 4,
        mainScene: "indoor",
        continuityFocus: "identity",
        rhythm: "switch",
        sceneTransitions: "same_space",
        cameraMotion: "follow",
        expressionFocus: "relation_change",
        styleGoal: "realistic",
        shots: [
          { id: "shot_1", index: 1, title: "诊室全景建立", durationSec: 4, sceneLabel: "门诊诊室", objectIds: ["obj_1", "obj_2", "obj_3", "obj_4"], transitionFromPrev: "none", emphasis: "建立三方关系" },
          { id: "shot_2", index: 2, title: "医生解释方案", durationSec: 4, sceneLabel: "诊疗桌近中景", objectIds: ["obj_1", "obj_2", "obj_4"], transitionFromPrev: "same_space", emphasis: "信息沟通清晰" },
          { id: "shot_3", index: 3, title: "家属提问与确认", durationSec: 3, sceneLabel: "侧向过肩", objectIds: ["obj_1", "obj_2", "obj_3"], transitionFromPrev: "same_space", emphasis: "关系变化" },
          { id: "shot_4", index: 4, title: "患者点头结束", durationSec: 4, sceneLabel: "中近景收束", objectIds: ["obj_2", "obj_1"], transitionFromPrev: "same_space", emphasis: "结论确认" }
        ],
        continuity: ["身份一致", "光线一致", "动作与对话连贯", "医疗场景真实可信"]
      }
    }
  },
  {
    filename: "quick_video_factory_training.json",
    item: {
      id: "quick_vid_factory_training_004",
      title: "工厂安全培训演示",
      mediaType: "video",
      firstInput: "制造业安全培训短片，班组长、操作员和设备三方互动，强调规范流程",
      secondInput: "开场看全场，随后跟拍操作步骤，最后给到合规结果，镜头稳定推进",
      ratio: "16:9",
      durationSec: 15,
      firstLayerSelections: {
        image: { frameType: "environment", compositionFocus: "environment_wrap", styleGoal: "realistic" },
        video: { shotStructure: "multi_scene", expressionFocus: "scene_progression", styleGoal: "advertising" }
      },
      secondLayerSelections: {
        image: { subjectCount: "3", compositionPosition: "depth", backgroundComplexity: "strong_environment", subjectScale: "balanced" },
        video: { shotCount: "5", mainScene: "complex", continuityFocus: "scene", cameraMotion: "push", sceneTransition: "location_switch", shotGrammar: "cut" }
      },
      structureDraft: {
        mediaType: "video",
        primaryBrief: "制造业安全培训短片，班组长、操作员和设备三方互动，强调规范流程",
        secondaryBrief: "开场看全场，随后跟拍操作步骤，最后给到合规结果，镜头稳定推进",
        structureType: "multi_scene",
        scene: "工厂产线与安全区",
        objects: [
          { id: "obj_1", name: "班组长", type: "person", role: "primary", depth: "midground", isPrimary: true },
          { id: "obj_2", name: "操作员", type: "person", role: "secondary", depth: "midground" },
          { id: "obj_3", name: "设备产线", type: "environment", role: "environment", depth: "background" },
          { id: "obj_4", name: "安全警示牌", type: "prop", role: "support", depth: "foreground" }
        ],
        shotCount: 5,
        mainScene: "multi_scene",
        continuityFocus: "scene",
        rhythm: "push",
        sceneTransitions: "location_switch",
        cameraMotion: "push",
        expressionFocus: "scene_progression",
        styleGoal: "advertising",
        shots: [
          { id: "shot_1", index: 1, title: "车间全景建立", durationSec: 3, sceneLabel: "产线全景", objectIds: ["obj_1", "obj_2", "obj_3"], transitionFromPrev: "none", emphasis: "环境建立" },
          { id: "shot_2", index: 2, title: "班组长讲解", durationSec: 3, sceneLabel: "安全区中景", objectIds: ["obj_1", "obj_4"], transitionFromPrev: "location_switch", emphasis: "规范说明" },
          { id: "shot_3", index: 3, title: "操作员执行步骤", durationSec: 3, sceneLabel: "工位近中景", objectIds: ["obj_2", "obj_3", "obj_4"], transitionFromPrev: "location_switch", emphasis: "动作流程" },
          { id: "shot_4", index: 4, title: "复核与确认", durationSec: 3, sceneLabel: "双人同框", objectIds: ["obj_1", "obj_2"], transitionFromPrev: "location_switch", emphasis: "关系协同" },
          { id: "shot_5", index: 5, title: "合规结果展示", durationSec: 3, sceneLabel: "合规看板", objectIds: ["obj_1", "obj_2", "obj_4"], transitionFromPrev: "location_switch", emphasis: "结果收束" }
        ],
        continuity: ["流程一致", "设备位置稳定", "人员身份不变", "安全语义明确"]
      }
    }
  }
];

const proItems = [
  {
    filename: "pro_image_fintech_launch.json",
    project: createProject({
      id: "pro_img_fintech_001",
      title: "金融科技新品发布KV",
      mediaType: "image",
      shotPlan: "single",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        layoutLocked: false,
        transitionType: "cut",
        duration_s: 4,
        shotNote: "手机端产品页面作为主视觉，人物与金融卡片形成关系层次。",
        entryDir: "S",
        exitDir: "S",
        camera: {
          shot: "medium",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "front_left", mood: "clean commercial" },
        layers: [
          createLayer({
            id: "主体1",
            type: "产品经理",
            look: "商务休闲，站立展示姿态",
            notes: "中景前景，表情自信",
            externalPrompt: "产品经理面向镜头介绍",
            z: 12,
            t0: { x: 28, y: 56, w: 20, h: 34 },
            t1: { x: 28, y: 56, w: 20, h: 34 }
          }),
          createLayer({
            id: "主体2",
            type: "手机屏幕UI",
            look: "理财App页面，高亮收益卡片",
            notes: "画面中心偏右，主视觉对象",
            externalPrompt: "手机UI清晰可读",
            z: 14,
            t0: { x: 58, y: 54, w: 26, h: 38 },
            t1: { x: 58, y: 54, w: 26, h: 38 }
          }),
          createLayer({
            id: "主体3",
            type: "信用卡道具",
            look: "金属质感卡片，品牌色",
            notes: "前景偏下，辅助金融属性",
            externalPrompt: "卡片有质感高光",
            z: 15,
            t0: { x: 50, y: 74, w: 20, h: 12 },
            t1: { x: 50, y: 74, w: 20, h: 12 }
          }),
          createLayer({
            id: "主体4",
            type: "品牌背景墙",
            look: "渐变品牌背景与图形元素",
            notes: "背景层，保持简洁",
            externalPrompt: "品牌主色平滑渐变",
            z: 4,
            t0: { x: 50, y: 50, w: 94, h: 92 },
            t1: { x: 50, y: 50, w: 94, h: 92 }
          })
        ],
        config: {
          mediaMode: "image",
          compiler: "v2",
          sceneTier: "indoor",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("image", "indoor", "金融发布会背景")
      }
    })
  },
  {
    filename: "pro_image_retail_fashion.json",
    project: createProject({
      id: "pro_img_retail_002",
      title: "零售服饰春季橱窗海报",
      mediaType: "image",
      shotPlan: "single",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "cut",
        duration_s: 4,
        shotNote: "双模特与陈列台同框，突出新品和店内层次。",
        entryDir: "S",
        exitDir: "S",
        camera: {
          shot: "wide",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "top", mood: "spring lifestyle" },
        layers: [
          createLayer({
            id: "主体1",
            type: "模特A",
            look: "浅色春装，站姿自然",
            notes: "左侧前景，人物清晰",
            externalPrompt: "表现服装垂感",
            z: 13,
            t0: { x: 32, y: 58, w: 18, h: 36 },
            t1: { x: 32, y: 58, w: 18, h: 36 }
          }),
          createLayer({
            id: "主体2",
            type: "模特B",
            look: "亮色春装，提包道具",
            notes: "右侧前景，与模特A形成关系",
            externalPrompt: "人物互动感",
            z: 13,
            t0: { x: 66, y: 58, w: 18, h: 36 },
            t1: { x: 66, y: 58, w: 18, h: 36 }
          }),
          createLayer({
            id: "主体3",
            type: "陈列台与新品包",
            look: "木质陈列台+包袋",
            notes: "中景偏中，产品辅助",
            externalPrompt: "产品细节清晰",
            z: 10,
            t0: { x: 50, y: 66, w: 24, h: 16 },
            t1: { x: 50, y: 66, w: 24, h: 16 }
          }),
          createLayer({
            id: "主体4",
            type: "橱窗环境",
            look: "店铺玻璃橱窗与春季装饰",
            notes: "背景层次丰富",
            externalPrompt: "保留空间透视",
            z: 5,
            t0: { x: 50, y: 48, w: 96, h: 92 },
            t1: { x: 50, y: 48, w: 96, h: 92 }
          })
        ],
        config: {
          mediaMode: "image",
          compiler: "v2",
          sceneTier: "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("image", "small_plaza", "零售店橱窗环境")
      }
    })
  },
  {
    filename: "pro_image_food_beverage.json",
    project: createProject({
      id: "pro_img_food_003",
      title: "餐饮新品套餐主图",
      mediaType: "image",
      shotPlan: "single",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "cut",
        duration_s: 4,
        shotNote: "主菜、饮品、品牌元素同框，突出食欲与商业信息。",
        entryDir: "S",
        exitDir: "S",
        camera: {
          shot: "medium",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "indoor", key_dir: "top_left", mood: "warm appetizing" },
        layers: [
          createLayer({
            id: "主体1",
            type: "主菜盘",
            look: "牛排套餐，食物纹理清晰",
            notes: "中心前景，主卖点",
            externalPrompt: "食物热气与高光",
            z: 14,
            t0: { x: 50, y: 60, w: 30, h: 20 },
            t1: { x: 50, y: 60, w: 30, h: 20 }
          }),
          createLayer({
            id: "主体2",
            type: "饮品杯",
            look: "冷饮透明杯，带水珠",
            notes: "左前景，辅助销售",
            externalPrompt: "杯体通透",
            z: 13,
            t0: { x: 30, y: 62, w: 14, h: 22 },
            t1: { x: 30, y: 62, w: 14, h: 22 }
          }),
          createLayer({
            id: "主体3",
            type: "品牌标识牌",
            look: "简洁logo立卡",
            notes: "右中景，识别品牌",
            externalPrompt: "logo可读",
            z: 9,
            t0: { x: 72, y: 50, w: 14, h: 16 },
            t1: { x: 72, y: 50, w: 14, h: 16 }
          }),
          createLayer({
            id: "主体4",
            type: "木质桌面环境",
            look: "木纹桌面和模糊背景灯光",
            notes: "背景层，保持暖色氛围",
            externalPrompt: "背景柔和不抢主体",
            z: 4,
            t0: { x: 50, y: 52, w: 98, h: 94 },
            t1: { x: 50, y: 52, w: 98, h: 94 }
          })
        ],
        config: {
          mediaMode: "image",
          compiler: "v2",
          sceneTier: "indoor",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("image", "indoor", "餐厅桌面场景")
      }
    })
  },
  {
    filename: "pro_image_real_estate.json",
    project: createProject({
      id: "pro_img_realestate_004",
      title: "地产样板间推广图",
      mediaType: "image",
      shotPlan: "single",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "cut",
        duration_s: 4,
        shotNote: "置业顾问、客户和室内空间同框，强调空间品质。",
        entryDir: "S",
        exitDir: "S",
        camera: {
          shot: "wide",
          movement: "static",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "window", mood: "bright premium" },
        layers: [
          createLayer({
            id: "主体1",
            type: "置业顾问",
            look: "职业装，手持户型图",
            notes: "左中景，介绍动作",
            externalPrompt: "讲解状态自然",
            z: 11,
            t0: { x: 30, y: 58, w: 16, h: 30 },
            t1: { x: 30, y: 58, w: 16, h: 30 }
          }),
          createLayer({
            id: "主体2",
            type: "客户夫妻",
            look: "休闲商务穿搭",
            notes: "右中景，两人共同观看",
            externalPrompt: "客户互动自然",
            z: 11,
            t0: { x: 68, y: 58, w: 24, h: 30 },
            t1: { x: 68, y: 58, w: 24, h: 30 }
          }),
          createLayer({
            id: "主体3",
            type: "样板间客厅",
            look: "沙发、落地窗、装饰画",
            notes: "背景主空间，体现品质",
            externalPrompt: "空间层次与透视",
            z: 5,
            t0: { x: 50, y: 50, w: 96, h: 92 },
            t1: { x: 50, y: 50, w: 96, h: 92 }
          })
        ],
        config: {
          mediaMode: "image",
          compiler: "v2",
          sceneTier: "open_space",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("image", "open_space", "样板间客厅空间")
      }
    })
  },
  {
    filename: "pro_video_automotive_showroom.json",
    project: createProject({
      id: "pro_vid_auto_005",
      title: "汽车展厅新品讲解短片",
      mediaType: "video",
      shotPlan: "continuous",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "camera_continues",
        duration_s: 6,
        shotNote: "销售顾问围绕新车讲解，客户从左向右靠近车辆。",
        entryDir: "W",
        exitDir: "E",
        camera: {
          shot: "medium_wide",
          movement: "follow_push",
          keyframes: [
            { t: 0, x: -10, y: 0, zoom: 1.02, rot: 0 },
            { t: 1, x: 12, y: 0, zoom: 1.1, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "top", mood: "premium dynamic" },
        layers: [
          createLayer({
            id: "主体1",
            type: "销售顾问",
            look: "深色西装，讲解手势",
            notes: "前景中部，动作连贯",
            externalPrompt: "保持专业讲解姿态",
            z: 12,
            t0: { x: 44, y: 58, w: 16, h: 30 },
            t1: { x: 48, y: 58, w: 16, h: 30 }
          }),
          createLayer({
            id: "主体2",
            type: "客户",
            look: "休闲装，观察车辆细节",
            notes: "从左向中移动",
            externalPrompt: "动作自然不过快",
            z: 11,
            t0: { x: 22, y: 60, w: 15, h: 28 },
            t1: { x: 34, y: 60, w: 15, h: 28 }
          }),
          createLayer({
            id: "主体3",
            type: "新车型",
            look: "亮银色SUV，车灯高光",
            notes: "主视觉对象，中心偏右",
            externalPrompt: "车体轮廓清晰",
            z: 13,
            t0: { x: 66, y: 56, w: 36, h: 28 },
            t1: { x: 62, y: 56, w: 38, h: 30 }
          }),
          createLayer({
            id: "主体4",
            type: "展厅背景",
            look: "展厅灯带和品牌墙",
            notes: "背景稳定",
            externalPrompt: "保持空间感",
            z: 4,
            t0: { x: 50, y: 50, w: 98, h: 92 },
            t1: { x: 50, y: 50, w: 98, h: 92 }
          })
        ],
        config: {
          mediaMode: "video",
          compiler: "v2",
          sceneTier: "small_plaza",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("video", "small_plaza", "汽车展厅")
      }
    })
  },
  {
    filename: "pro_video_logistics_warehouse.json",
    project: createProject({
      id: "pro_vid_logistics_006",
      title: "物流仓储作业流程",
      mediaType: "video",
      shotPlan: "continuous",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "camera_continues",
        duration_s: 6,
        shotNote: "叉车、分拣员和货架协同作业，镜头沿过道推进。",
        entryDir: "W",
        exitDir: "E",
        camera: {
          shot: "wide",
          movement: "forward_follow",
          keyframes: [
            { t: 0, x: -14, y: 0, zoom: 1, rot: 0 },
            { t: 1, x: 16, y: 0, zoom: 1.08, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "top_left", mood: "efficient industrial" },
        layers: [
          createLayer({
            id: "主体1",
            type: "分拣员",
            look: "工装马甲，手持扫码枪",
            notes: "前景偏左，动作明确",
            externalPrompt: "执行扫描动作",
            z: 12,
            t0: { x: 34, y: 62, w: 14, h: 28 },
            t1: { x: 40, y: 62, w: 14, h: 28 }
          }),
          createLayer({
            id: "主体2",
            type: "叉车",
            look: "黄色叉车，货箱在叉臂上",
            notes: "中景偏右，缓慢前进",
            externalPrompt: "保持安全速度",
            z: 11,
            t0: { x: 66, y: 60, w: 22, h: 18 },
            t1: { x: 58, y: 60, w: 24, h: 19 }
          }),
          createLayer({
            id: "主体3",
            type: "货架通道",
            look: "高位货架和箱体",
            notes: "背景深度明显",
            externalPrompt: "保持透视线",
            z: 5,
            t0: { x: 50, y: 48, w: 98, h: 94 },
            t1: { x: 50, y: 48, w: 98, h: 94 }
          }),
          createLayer({
            id: "主体4",
            type: "安全标识",
            look: "地面引导线和警示牌",
            notes: "前景辅助信息",
            externalPrompt: "标识可辨识",
            z: 9,
            t0: { x: 52, y: 78, w: 22, h: 10 },
            t1: { x: 52, y: 78, w: 22, h: 10 }
          })
        ],
        config: {
          mediaMode: "video",
          compiler: "v2",
          sceneTier: "open_space",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("video", "open_space", "物流仓储通道")
      }
    })
  },
  {
    filename: "pro_video_education_classroom.json",
    project: createProject({
      id: "pro_vid_edu_007",
      title: "教育课堂互动演示",
      mediaType: "video",
      shotPlan: "multicam",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "reverse_angle",
        duration_s: 6,
        shotNote: "老师授课与学生互动，镜头切换保持关系清楚。",
        entryDir: "S",
        exitDir: "S",
        camera: {
          shot: "medium",
          movement: "static_cut",
          keyframes: [
            { t: 0, x: 0, y: 0, zoom: 1.03, rot: 0 },
            { t: 1, x: 0, y: 0, zoom: 1.06, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "window", mood: "bright trust" },
        layers: [
          createLayer({
            id: "主体1",
            type: "老师",
            look: "手持平板讲解",
            notes: "中景中心，主讲对象",
            externalPrompt: "表情亲和清晰",
            z: 12,
            t0: { x: 50, y: 52, w: 16, h: 30 },
            t1: { x: 50, y: 52, w: 16, h: 30 }
          }),
          createLayer({
            id: "主体2",
            type: "学生A",
            look: "举手互动",
            notes: "左侧前景",
            externalPrompt: "动作自然",
            z: 11,
            t0: { x: 30, y: 62, w: 14, h: 26 },
            t1: { x: 30, y: 62, w: 14, h: 26 }
          }),
          createLayer({
            id: "主体3",
            type: "学生B",
            look: "记录笔记",
            notes: "右侧前景",
            externalPrompt: "保持课堂状态",
            z: 11,
            t0: { x: 70, y: 62, w: 14, h: 26 },
            t1: { x: 70, y: 62, w: 14, h: 26 }
          }),
          createLayer({
            id: "主体4",
            type: "白板与课堂背景",
            look: "白板内容和教室布景",
            notes: "背景层",
            externalPrompt: "信息清晰不过载",
            z: 5,
            t0: { x: 50, y: 46, w: 96, h: 90 },
            t1: { x: 50, y: 46, w: 96, h: 90 }
          })
        ],
        config: {
          mediaMode: "video",
          compiler: "v2",
          sceneTier: "indoor",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("video", "indoor", "课堂教学环境")
      }
    })
  },
  {
    filename: "pro_video_travel_airport.json",
    project: createProject({
      id: "pro_vid_travel_008",
      title: "文旅机场值机流程",
      mediaType: "video",
      shotPlan: "edit",
      scene: {
        id: "S01",
        name: "分镜1",
        index: 1,
        transitionType: "dissolve",
        duration_s: 6,
        shotNote: "旅客、值机员、行李与导视系统协同出现，流程清晰。",
        entryDir: "W",
        exitDir: "E",
        camera: {
          shot: "medium_wide",
          movement: "guided_pan",
          keyframes: [
            { t: 0, x: -8, y: 0, zoom: 1.01, rot: 0 },
            { t: 1, x: 8, y: 0, zoom: 1.06, rot: 0 }
          ]
        },
        lighting: { time: "day", key_dir: "top", mood: "clean efficient" },
        layers: [
          createLayer({
            id: "主体1",
            type: "旅客",
            look: "拉杆箱，准备办理登机",
            notes: "左中景向右移动",
            externalPrompt: "保持步态自然",
            z: 12,
            t0: { x: 24, y: 60, w: 14, h: 28 },
            t1: { x: 34, y: 60, w: 14, h: 28 }
          }),
          createLayer({
            id: "主体2",
            type: "值机员",
            look: "制服站在柜台后",
            notes: "中景稳定",
            externalPrompt: "服务姿态自然",
            z: 11,
            t0: { x: 56, y: 58, w: 14, h: 27 },
            t1: { x: 56, y: 58, w: 14, h: 27 }
          }),
          createLayer({
            id: "主体3",
            type: "值机柜台与导视屏",
            look: "柜台品牌标识与航班屏",
            notes: "中后景主信息",
            externalPrompt: "信息可辨识",
            z: 8,
            t0: { x: 62, y: 54, w: 34, h: 24 },
            t1: { x: 62, y: 54, w: 34, h: 24 }
          }),
          createLayer({
            id: "主体4",
            type: "机场大厅环境",
            look: "大厅穹顶和排队区域",
            notes: "背景空间",
            externalPrompt: "保持空间深度",
            z: 4,
            t0: { x: 50, y: 48, w: 98, h: 92 },
            t1: { x: 50, y: 48, w: 98, h: 92 }
          })
        ],
        config: {
          mediaMode: "video",
          compiler: "v2",
          sceneTier: "open_space",
          v2Mode: "strict",
          stability: "standard"
        },
        notes: sceneNotes("video", "open_space", "机场值机大厅")
      }
    })
  }
];

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function generateQuickFiles() {
  const manifest = [];
  const bundleItems = [];
  for (const entry of quickItems) {
    const item = structuredClone(entry.item);
    item.updatedAt = now();
    item.canvasDraft = structureDraftToCanvas(item.structureDraft, "zh");
    item.prompt = "";
    const filePath = path.join(quickDir, entry.filename);
    await writeJson(filePath, item);
    bundleItems.push(item);
    manifest.push({
      workspace: "quick",
      mediaType: item.mediaType,
      title: item.title,
      file: filePath
    });
  }
  await writeJson(path.join(quickDir, "quick_bundle_files.json"), quickItems.map((entry) => entry.filename));
  await writeJson(path.join(quickDir, "quick_bundle_items.json"), bundleItems);
  return manifest;
}

async function generateProFiles() {
  const manifest = [];
  const bundleProjects = [];
  for (const entry of proItems) {
    const filePath = path.join(proDir, entry.filename);
    await writeJson(filePath, entry.project);
    bundleProjects.push(entry.project);
    manifest.push({
      workspace: "pro",
      mediaType: entry.project.project.mediaType,
      title: entry.project.project.creativeContext?.intentSummary || entry.filename,
      file: filePath
    });
  }
  await writeJson(path.join(proDir, "pro_bundle_files.json"), proItems.map((entry) => entry.filename));
  await writeJson(path.join(proDir, "pro_bundle_projects.json"), bundleProjects);
  return manifest;
}

async function main() {
  await fs.mkdir(quickDir, { recursive: true });
  await fs.mkdir(proDir, { recursive: true });
  const quickManifest = await generateQuickFiles();
  const proManifest = await generateProFiles();
  const all = [...quickManifest, ...proManifest];
  await writeJson(path.join(outRoot, "manifest.json"), all);
  console.log(JSON.stringify({
    outRoot,
    total: all.length,
    quick: quickManifest.length,
    pro: proManifest.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
