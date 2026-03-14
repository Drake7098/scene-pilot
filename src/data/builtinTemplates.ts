import type { SceneTemplate } from "../model/template";
import type { Scene, Layer, Camera, Lighting } from "../model";

function mkScene(
  id: string,
  name: string,
  duration_s: number,
  mediaMode: "image" | "video",
  layers: Omit<Layer, "id">[],
  camera?: Partial<Camera>,
  lighting?: Partial<Lighting>,
  notes?: string
): Scene {
  const genIds = (prefix: string, count: number) =>
    layers.map((_, i) => ({ ...layers[i], id: `${prefix}${i + 1}` })) as Layer[];
  return {
    id,
    name,
    index: 1,
    duration_s,
    transitionType: "cut",
    camera: {
      shot: camera?.shot ?? (mediaMode === "video" ? "medium" : ""),
      movement: camera?.movement ?? (mediaMode === "video" ? "static" : ""),
      keyframes: camera?.keyframes ?? [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
      ]
    } as Camera,
    lighting: {
      time: lighting?.time ?? "",
      key_dir: lighting?.key_dir ?? "",
      mood: lighting?.mood ?? ""
    } as Lighting,
    layers: genIds("layer", layers.length),
    config: { mediaMode, compiler: mediaMode === "video" ? "v2" : "v1" },
    notes: notes ?? `media: ${mediaMode}\ngenmode: pro`
  };
}

function layer(
  type: string,
  z: number,
  kf0: { x: number; y: number; w: number; h: number },
  kf1?: { x: number; y: number; w: number; h: number }
): Omit<Layer, "id"> {
  const k1 = kf1 ?? kf0;
  return {
    type,
    shape: "rect",
    look: "",
    z,
    color: "#b7c3ff",
    opacity: 1,
    kf: [
      { t: 0, x: kf0.x, y: kf0.y, w: kf0.w, h: kf0.h, rot: 0 },
      { t: 1, x: k1.x, y: k1.y, w: k1.w, h: k1.h, rot: 0 }
    ],
    notes: "",
    externalPrompt: "",
    referenceLinks: "",
    localRefs: [],
    referencePolicy: "optional"
  };
}

/** @deprecated 主流程已用 template-engine + templateLibrary400。仅 templateStore 历史兼容。 */
export const builtinTemplates: SceneTemplate[] = [
  {
    id: "builtin_product_hero",
    name: "Product Hero",
    category: "product",
    description: "Centered product layout with headline and logo zones",
    isBuiltin: true,
    isProOnly: false,
    tags: ["product", "hero", "ad"],
    scene: mkScene(
      "tpl_s1",
      "Product Hero",
      6,
      "image",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Product", 20, { x: 50, y: 50, w: 28, h: 32 }),
        layer("Headline", 15, { x: 50, y: 78, w: 60, h: 12 }),
        layer("Logo", 18, { x: 85, y: 15, w: 16, h: 10 })
      ],
      { shot: "medium", movement: "static" }
    )
  },
  {
    id: "builtin_product_push",
    name: "Product Push-in",
    category: "product",
    description: "Product center, T0 medium shot, T1 push in",
    isBuiltin: true,
    isProOnly: true,
    tags: ["product", "camera", "video"],
    scene: mkScene(
      "tpl_s2",
      "Product Push-in",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Product", 20, { x: 50, y: 50, w: 30, h: 36 }, { x: 50, y: 50, w: 40, h: 48 })
      ],
      { shot: "medium", movement: "slow_push_in", keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 1.2, rot: 0 }
      ]}
    )
  },
  {
    id: "builtin_dialogue",
    name: "Two Person Dialogue",
    category: "dialogue",
    description: "Balanced two-character conversation layout",
    isBuiltin: true,
    isProOnly: false,
    tags: ["dialogue", "story", "short video"],
    scene: mkScene(
      "tpl_s3",
      "Two Person Dialogue",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Character A", 15, { x: 30, y: 55, w: 22, h: 35 }),
        layer("Character B", 15, { x: 70, y: 55, w: 22, h: 35 }),
        layer("Subtitle zone", 10, { x: 50, y: 88, w: 70, h: 8 })
      ],
      { shot: "wide", movement: "static" }
    )
  },
  {
    id: "builtin_character_entrance",
    name: "Character Entrance",
    category: "short_video",
    description: "Subject enters from left, light camera push",
    isBuiltin: true,
    isProOnly: true,
    tags: ["character", "entrance", "video"],
    scene: mkScene(
      "tpl_s4",
      "Character Entrance",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Character", 20, { x: 20, y: 50, w: 24, h: 40 }, { x: 45, y: 50, w: 24, h: 40 })
      ],
      { shot: "medium", movement: "slow_push_in" }
    )
  },
  {
    id: "builtin_social_ad",
    name: "Social Ad Layout",
    category: "social",
    description: "Product + headline + CTA zones for social ads",
    isBuiltin: true,
    isProOnly: true,
    tags: ["social", "ad", "product"],
    scene: mkScene(
      "tpl_s5",
      "Social Ad Layout",
      6,
      "image",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Product", 20, { x: 50, y: 42, w: 32, h: 38 }),
        layer("Headline", 15, { x: 50, y: 72, w: 75, h: 10 }),
        layer("CTA", 18, { x: 50, y: 88, w: 40, h: 8 })
      ]
    )
  },
  {
    id: "builtin_before_after",
    name: "Before/After Compare",
    category: "ad",
    description: "Left-right comparison layout",
    isBuiltin: true,
    isProOnly: true,
    tags: ["compare", "ad", "effect"],
    scene: mkScene(
      "tpl_s6",
      "Before/After Compare",
      6,
      "image",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Before", 15, { x: 28, y: 50, w: 35, h: 45 }),
        layer("After", 15, { x: 72, y: 50, w: 35, h: 45 })
      ]
    )
  },
  {
    id: "builtin_multi_showcase",
    name: "Multi-object Showcase",
    category: "product",
    description: "Multiple objects arranged across the frame",
    isBuiltin: true,
    isProOnly: true,
    tags: ["product", "showcase", "layout"],
    scene: mkScene(
      "tpl_s7",
      "Multi-object Showcase",
      6,
      "image",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Object 1", 15, { x: 25, y: 45, w: 20, h: 28 }),
        layer("Object 2", 15, { x: 50, y: 50, w: 22, h: 30 }),
        layer("Object 3", 15, { x: 75, y: 45, w: 20, h: 28 })
      ]
    )
  },
  {
    id: "builtin_camera_pan",
    name: "Camera Pan",
    category: "camera_move",
    description: "Static scene, camera pans horizontally",
    isBuiltin: true,
    isProOnly: true,
    tags: ["camera", "motion", "video"],
    scene: mkScene(
      "tpl_s8",
      "Camera Pan",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Subject", 20, { x: 50, y: 50, w: 28, h: 40 })
      ],
      { shot: "wide", movement: "pan_right" }
    )
  },
  {
    id: "builtin_zoom_out",
    name: "Camera Zoom Out",
    category: "camera_move",
    description: "T0 close-up, T1 wide shot",
    isBuiltin: true,
    isProOnly: true,
    tags: ["camera", "zoom", "video"],
    scene: mkScene(
      "tpl_s9",
      "Camera Zoom Out",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Subject", 20, { x: 50, y: 50, w: 40, h: 55 }, { x: 50, y: 50, w: 22, h: 32 })
      ],
      { shot: "close", movement: "slow_pull_out", keyframes: [
        { t: 0, x: 0, y: 0, zoom: 1.4, rot: 0 },
        { t: 1, x: 0, y: 0, zoom: 0.9, rot: 0 }
      ]}
    )
  },
  {
    id: "builtin_empty_pro",
    name: "Empty Starter Pro",
    category: "custom",
    description: "Blank Pro template with common placeholder layers",
    isBuiltin: true,
    isProOnly: false,
    tags: ["empty", "starter", "pro"],
    scene: mkScene(
      "tpl_s10",
      "Empty Starter Pro",
      6,
      "video",
      [
        layer("Background", 1, { x: 50, y: 50, w: 100, h: 100 }),
        layer("Subject", 20, { x: 50, y: 50, w: 24, h: 34 })
      ],
      { shot: "medium", movement: "static" }
    )
  }
];
