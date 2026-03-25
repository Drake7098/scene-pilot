import { defaultProject } from "../../../model";
import type { Scene } from "../../../model";
import type { TemplateIndex } from "../../types/templateIndex";
import type { TemplatePayload } from "../../types/templatePayload";

type BenchmarkDef = {
  id: string;
  familyId: string;
  familyNameEn: string;
  familyNameZh: string;
  nameEn: string;
  nameZh: string;
  category: TemplateIndex["category"];
  mediaType: TemplateIndex["mediaType"];
  storyPlan: TemplateIndex["storyPlan"];
  ratio: TemplateIndex["ratio"];
  variantId: string;
  tags: string[];
  payload: {
    camera: string;
    composition: string;
    space: string;
    layer: string;
    lighting: string;
    material: string;
    detail: string;
    mood: string;
    style: string;
    semantic: string;
    subject: string;
  };
};

const BENCHMARK_DEFS: BenchmarkDef[] = [
  {
    id: "visual_people_action_01",
    familyId: "character_entrance",
    familyNameEn: "Character Entrance",
    familyNameZh: "人物登场",
    nameEn: "Visual Benchmark People Action",
    nameZh: "标杆样本-人物动作",
    category: "short_video",
    mediaType: "video",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark_visual",
    tags: ["benchmark", "visual", "people", "action", "cinematic"],
    payload: {
      camera: "low three-quarter tracking then tight side profile, 70mm, fast shutter feel",
      composition: "diagonal motion line, subject on right third during acceleration",
      space: "rain-dark running track at night with long lane depth",
      layer: "foreground rain particles, middle athlete, background stadium lights",
      lighting: "hard stadium back rim, cool ambient fill, subtle warm side bounce",
      material: "wet skin sheen, breathable race fabric, textured track rubber",
      detail: "calf tension, shoe spike bite, water spray off heel strike",
      mood: "focused, relentless, championship-pressure intensity",
      style: "sports cinematic realism",
      semantic: "peak commitment at decisive race moment",
      subject: "elite sprinter exploding from starting blocks"
    }
  },
  {
    id: "visual_product_ad_01",
    familyId: "product_center_display",
    familyNameEn: "Product Center Display",
    familyNameZh: "产品居中展示",
    nameEn: "Visual Benchmark Product Ad",
    nameZh: "标杆样本-产品广告",
    category: "ad",
    mediaType: "image",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark_visual",
    tags: ["benchmark", "visual", "product", "ad", "commercial"],
    payload: {
      camera: "85mm macro close-up with calm centered frame and subtle downward glide",
      composition: "centered symmetry with disciplined negative space",
      space: "minimal studio with reflective black stone base and soft gradient backdrop",
      layer: "foreground condensation veil, middle serum bottle, background glow strip",
      lighting: "controlled overhead soft key with side accents and restrained rear kicker",
      material: "frosted glass bottle, glossy cap, polished black stone surface",
      detail: "embossed logo edge, condensation distribution, visible meniscus line",
      mood: "clean, premium, clinical confidence",
      style: "high-end beauty commercial realism",
      semantic: "global campaign hero frame balancing science and luxury",
      subject: "premium serum bottle hero shot"
    }
  },
  {
    id: "visual_space_scene_01",
    familyId: "dialogue_duo",
    familyNameEn: "Dialogue Duo",
    familyNameZh: "双人对话",
    nameEn: "Visual Benchmark Space Scene",
    nameZh: "标杆样本-空间场景",
    category: "dialogue",
    mediaType: "video",
    storyPlan: "continuous",
    ratio: "16:9",
    variantId: "benchmark_visual",
    tags: ["benchmark", "visual", "space", "scene", "narrative"],
    payload: {
      camera: "tense over-shoulder with deep perspective then restrained reverse angle",
      composition: "two-shot tension axis with controlled headroom and distance readability",
      space: "narrow old corridor with doorway vanishing point and compressed depth",
      layer: "foreground shoulder silhouette, middle dialogue pair, rear doorway spill",
      lighting: "practical tungsten ceiling source mixed with cool doorway spill",
      material: "peeling painted walls, worn wood trim, matte floor reflections",
      detail: "micro-expression flicker, finger twitch, subtle sleeve friction",
      mood: "intimate, claustrophobic, emotionally loaded tension",
      style: "narrative neo-noir realism",
      semantic: "silence-before-conflict turning point between two characters",
      subject: "two people facing each other before confrontation"
    }
  },
  {
    id: "bm_shot_master_01",
    familyId: "product_hero",
    familyNameEn: "Product Hero",
    familyNameZh: "产品主图",
    nameEn: "Benchmark Shot Master",
    nameZh: "标杆-镜头控制-产品发布",
    category: "product",
    mediaType: "image",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "camera", "composition", "lighting"],
    payload: {
      camera: "35mm low-angle push-in, stable dolly, medium speed",
      composition: "rule-of-thirds, subject on left third, negative space right",
      space: "clean studio depth with soft rear falloff",
      layer: "foreground haze, middle product, background gradient wall",
      lighting: "key 45deg left, soft fill front, rim back right",
      material: "brushed aluminum with subtle micro-scratch",
      detail: "edge highlight, engraved logo, fine chamfer",
      mood: "premium confident",
      style: "commercial cinematic realism",
      semantic: "hero launch reveal",
      subject: "wireless headphone case"
    }
  },
  {
    id: "bm_space_hierarchy_01",
    familyId: "center_composition",
    familyNameEn: "Center Composition",
    familyNameZh: "主体居中",
    nameEn: "Benchmark Space Hierarchy",
    nameZh: "标杆-空间层级-人物环境",
    category: "composition",
    mediaType: "image",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "space", "layer", "hierarchy"],
    payload: {
      camera: "50mm eye-level static lock",
      composition: "triangular composition with leading lines",
      space: "foreground leaves, middle subject, far background architecture",
      layer: "three-layer depth with clear occlusion",
      lighting: "soft daylight key, subtle bounce, ambient sky fill",
      material: "cotton fabric and matte stone surface",
      detail: "hair strands, jacket folds, pavement texture",
      mood: "calm urban morning",
      style: "editorial lifestyle realism",
      semantic: "commute preparation moment",
      subject: "young commuter adjusting backpack"
    }
  },
  {
    id: "bm_product_ad_01",
    familyId: "product_center_display",
    familyNameEn: "Product Center Display",
    familyNameZh: "产品居中展示",
    nameEn: "Benchmark Product Ad",
    nameZh: "标杆-产品广告-护肤瓶",
    category: "ad",
    mediaType: "image",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "product", "material", "detail"],
    payload: {
      camera: "85mm macro close-up slight top tilt",
      composition: "centered symmetry with reflective base",
      space: "minimal gradient backdrop with controlled floor reflection",
      layer: "front droplets, middle bottle, rear glow band",
      lighting: "softbox overhead, side strip lights, rear kicker",
      material: "frosted glass with glossy cap",
      detail: "condensation droplets, logo emboss, liquid meniscus",
      mood: "clean and scientific",
      style: "high-end beauty advertising",
      semantic: "clinical trust and purity",
      subject: "serum bottle standing upright"
    }
  },
  {
    id: "bm_pose_subject_01",
    familyId: "character_entrance",
    familyNameEn: "Character Entrance",
    familyNameZh: "人物登场",
    nameEn: "Benchmark Pose Subject",
    nameZh: "标杆-人物姿态-运动定格",
    category: "short_video",
    mediaType: "video",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "pose", "subject", "action"],
    payload: {
      camera: "70mm chest-level freeze frame",
      composition: "diagonal dynamic framing",
      space: "foreground dust particles, subject center-right, blurred crowd rear",
      layer: "motion trail front, athlete mid, stadium rear",
      lighting: "hard side key, warm rim, cool ambient fill",
      material: "breathable sports fabric with sweat sheen",
      detail: "muscle tension, shoe grip texture, chalk particles",
      mood: "high intensity determination",
      style: "sports documentary cinematic",
      semantic: "peak action commitment",
      subject: "sprinter pushing off starting block"
    }
  },
  {
    id: "bm_scene_story_01",
    familyId: "dialogue_duo",
    familyNameEn: "Dialogue Duo",
    familyNameZh: "双人对话",
    nameEn: "Benchmark Scene Story",
    nameZh: "标杆-叙事场景-室内对峙",
    category: "dialogue",
    mediaType: "video",
    storyPlan: "continuous",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "story", "semantic", "continuity"],
    payload: {
      camera: "35mm over-shoulder to reverse shot continuity",
      composition: "two-shot tension axis with controlled headroom",
      space: "narrow room depth with doorway vanishing point",
      layer: "foreground shoulder silhouette, mid dialogue pair, rear door light",
      lighting: "motivated practical lamp, edge backlight, low fill contrast",
      material: "aged wood, worn leather, matte wall paint",
      detail: "micro expressions, hand tremor, table scratches",
      mood: "suppressed tension before resolution",
      style: "neo-noir narrative realism",
      semantic: "conflict pause and emotional turn",
      subject: "two characters negotiating in cramped room"
    }
  },
  {
    id: "bm_material_macro_01",
    familyId: "product_texture_closeup",
    familyNameEn: "Product Texture",
    familyNameZh: "产品材质特写",
    nameEn: "Benchmark Material Macro",
    nameZh: "标杆-材质细节-腕表特写",
    category: "product",
    mediaType: "image",
    storyPlan: "single",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "material", "macro", "detail"],
    payload: {
      camera: "100mm macro with shallow DOF rack focus",
      composition: "radial composition centered on watch face",
      space: "dark neutral void with controlled specular points",
      layer: "front bokeh sparks, mid watch body, rear soft gradient",
      lighting: "narrow spot key, soft side fill, tiny edge sparkle",
      material: "brushed steel, sapphire crystal, leather strap grain",
      detail: "minute markers, knurling, stitching seams",
      mood: "precision luxury craft",
      style: "luxury product macro realism",
      semantic: "precision engineering and craftsmanship",
      subject: "mechanical wristwatch close-up"
    }
  },
  {
    id: "bm_hybrid_control_01",
    familyId: "tracking_dialogue",
    familyNameEn: "Tracking Dialogue",
    familyNameZh: "跟拍对话",
    nameEn: "Benchmark Hybrid Control",
    nameZh: "标杆-混合控制-车内连续动作",
    category: "continuous",
    mediaType: "video",
    storyPlan: "continuous",
    ratio: "16:9",
    variantId: "benchmark",
    tags: ["benchmark", "hybrid", "camera", "space", "lighting"],
    payload: {
      camera: "handheld over-shoulder push then lateral pan continuity",
      composition: "asymmetric frame with moving anchor on driver",
      space: "dashboard foreground, driver/passenger middle, rain street background",
      layer: "glass reflections front, characters mid, neon traffic rear",
      lighting: "dashboard practical key, neon side spill, street back rim",
      material: "wet leather seats, fogged glass, brushed metal trim",
      detail: "breath fog, finger tension on wheel, raindrop streaks",
      mood: "urgent nocturnal suspense",
      style: "cinematic thriller realism",
      semantic: "pursuit escape decision moment",
      subject: "driver making split-second turn in traffic"
    }
  }
];

function buildBenchmarkRawScene(def: BenchmarkDef): Scene {
  const project = defaultProject();
  const scene = project.scenes[0];
  const [shot, ...movementParts] = def.payload.camera.split(",");
  const notes = [
    `camera: ${def.payload.camera}`,
    `composition: ${def.payload.composition}`,
    `space: ${def.payload.space}`,
    `layer: ${def.payload.layer}`,
    `lighting: ${def.payload.lighting}`,
    `material: ${def.payload.material}`,
    `detail: ${def.payload.detail}`,
    `mood: ${def.payload.mood}`,
    `style: ${def.payload.style}`,
    `semantic: ${def.payload.semantic}`,
    `subject: ${def.payload.subject}`
  ].join("\n");

  return {
    ...scene,
    name: def.nameEn,
    duration_s: 6,
    camera: {
      ...scene.camera,
      shot: shot?.trim() || scene.camera.shot,
      movement: movementParts.join(",").trim() || scene.camera.movement
    },
    lighting: {
      ...scene.lighting,
      mood: def.payload.mood
    },
    layers: [
      {
        ...scene.layers[0],
        id: "Benchmark Subject",
        type: def.payload.subject,
        look: `${def.payload.material}; ${def.payload.detail}`,
        notes: `semantic: ${def.payload.semantic}`
      }
    ],
    notes
  };
}

function toTemplatePayload(def: BenchmarkDef): TemplatePayload {
  return {
    projectDefaults: {
      mediaType: def.mediaType,
      aspectRatio: def.ratio,
      storyPlan: def.storyPlan,
      sceneCount: 1,
      totalDuration: 6,
      sceneDurations: [6]
    },
    scenes: [
      {
        nameZh: def.nameZh,
        nameEn: def.nameEn,
        duration: 6,
        raw: buildBenchmarkRawScene(def)
      }
    ]
  };
}

export function getBenchmarkTemplateIndex(): TemplateIndex[] {
  return BENCHMARK_DEFS.map((def) => ({
    id: def.id,
    familyId: def.familyId,
    familyNameEn: def.familyNameEn,
    familyNameZh: def.familyNameZh,
    variantId: def.variantId,
    nameZh: def.nameZh,
    nameEn: def.nameEn,
    category: def.category,
    domain: "base",
    tags: def.tags,
    mediaType: def.mediaType,
    storyPlan: def.storyPlan,
    ratio: def.ratio,
    isFree: true,
    cost: 0,
    featured: true,
    variant: "cinematic",
    isLegacy: false,
    isEnabled: true,
    isOnline: false,
    isExperiment: false,
    isBenchmark: true
  }));
}

export function getBenchmarkPayloadById(id: string): TemplatePayload | null {
  const def = BENCHMARK_DEFS.find((x) => x.id === id);
  if (!def) return null;
  return toTemplatePayload(def);
}
