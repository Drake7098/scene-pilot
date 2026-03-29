/**
 * V3 Template Payloads
 * Each payload maps to a template ID and contains the full scene.notes
 * with V3 markers that compileV3 can read directly.
 *
 * Scene notes format:
 *   @compiler: v3
 *   render_style: commercial|photorealistic|editorial|filmic|...
 *   focal_length: 85mm|35mm|macro|...
 *   shot_size: MCU|CU|MS|FS|LS|ECU
 *   cam_angle: eye_level|low_angle|high_angle|dutch
 *   cam_movement: static|slow_push|tracking|handheld|orbit|...
 *   depth_of_field: very_shallow|shallow|medium|deep
 *   bg_preset: studio_dark|gradient_black|outdoor_urban|...
 *   env_mood: luxurious|dramatic|melancholic|energetic|...
 *   key_light_time: studio|golden_hour|night|overcast|...
 *   color_temp: 3200K|5600K|6500K|8000K
 *   spec_light: rim_light|lens_flare|volumetric|neon|golden_hour|...
 *   color_grade: warm_golden|teal_orange|cool_steel|noir|bw|natural|...
 *   film_look: digital_clean|film_grain|halation|anamorphic_flare|...
 *   narrative_rhythm: meditative|slow_burn|urgent|epic_build
 *   visual_tension: none|low|medium|high
 *   director_pack: kubrick|wong_kar_wai|nolan|fincher|villeneuve|wes_anderson
 */

export type V3Payload = {
  templateId: string;
  sceneNotes: string;
  layerLook?: string;
  layerNotes?: string;
  layerShapeDesc?: string;
  sceneLayers?: Array<{
    id: string;
    type: string;
    look: string;
    shapeDesc?: string;
    z: number;
    color?: string;
    opacity?: number;
    notes?: string;
    externalPrompt?: string;
    referenceLinks?: string;
    referencePolicy?: "optional" | "required";
    t0: { x: number; y: number; w: number; h: number; rot?: number };
    t1?: { x: number; y: number; w: number; h: number; rot?: number };
  }>;
  sceneCamera?: {
    shot?: string;
    movement?: string;
  };
  sceneLighting?: {
    time?: string;
    key_dir?: string;
    mood?: string;
  };
  mediaMode: "image" | "video";
  duration?: number;
  aspectRatio?: string;
};

function notes(...lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

export const V3_PAYLOADS: V3Payload[] = [

  // ── SELL PRODUCT ───────────────────────────────────────────────

  {
    templateId: "v3_product_white_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:shallow",
      "bg_preset:studio_white",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene:subtle paper dust; non-pristine white sweep"
    ),
    sceneLayers: [
      { id: "white_hero", type: "product", look: "single ecommerce hero product centered on a clean white sweep", shapeDesc: "main product silhouette with readable front face", z: 5, notes: notes("detail:sharp edges, readable label, clear scale, premium ecommerce clarity","imperfection_object:micro dust; slight cap wear; faint label edge inconsistency"), t0: { x: 50, y: 56, w: 30, h: 30, rot: 0 } },
      { id: "white_ground", type: "prop", look: "subtle grounded contact shadow under the product", shapeDesc: "soft commercial shadow anchor", z: 1, notes: notes("detail:avoids sterile floating look"), t0: { x: 50, y: 68, w: 26, h: 8, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_white_02",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MS", "focal_length:85mm",
      "depth_of_field:medium",
      "bg_preset:studio_white",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene:subtle packaging dust; slight floor scuff"
    ),
    sceneLayers: [
      { id: "pack_front", type: "product", look: "front-facing packaging hero with clean ecommerce readability", shapeDesc: "upright box or bottle package centered in frame", z: 5, notes: notes("detail:sharp label text area, clean front plane, clear volume and edge transitions","imperfection_object:tiny carton wear; faint print offset; minor seal wrinkle"), t0: { x: 50, y: 56, w: 28, h: 34, rot: 0 } },
      { id: "support_shadow", type: "prop", look: "soft under-shadow and white bounce plane", shapeDesc: "minimal grounding support", z: 1, notes: notes("detail:commercial polish without visual clutter"), t0: { x: 50, y: 70, w: 28, h: 8, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_hero_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "premium product",
    layerNotes: notes(
      "costume:polished surface, high-end material finish",
      "detail:controlled specular highlights, deep shadow on base, surface reflection"
    ),
  },
  {
    templateId: "v3_product_hero_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:MS", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:lens_flare",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "product with floating effect",
    layerNotes: notes(
      "costume:polished premium finish",
      "detail:soft halo around product, gradient shadow below, suspended in space"
    ),
  },
  {
    templateId: "v3_product_detail_02",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:ECU", "focal_length:macro",
      "depth_of_field:very_shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:5600K", "spec_light:rim_light",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "diamond jewelry piece",
    layerNotes: notes(
      "costume:polished platinum or gold setting",
      "detail:brilliant cut facets visible, light refracting through stone, micro-pavé details"
    ),
  },
  {
    templateId: "v3_luxury_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "high-end mechanical wristwatch",
    layerShapeDesc: "precision Swiss movement timepiece",
    layerNotes: notes(
      "costume:polished stainless steel case, brushed finishing on lugs, polished bevels on case sides",
      "prop:dark brown alligator leather strap, hand-stitched ivory thread, deployment clasp",
      "detail:intricate guilloché dial texture, applied hour markers with luminous fill, engraved crown at three o'clock, running seconds hand at 6 o'clock",
      "shapeDesc:rectangular watch case, 40mm diameter, 12mm thick, crown at 3 o'clock position",
      "accessory:exhibition caseback, visible rotor movement, engraved brand signature",
      "status:movement running, second hand in motion, date wheel visible",
      "emotion:timeless luxury, mechanical perfection, investment-grade craftsmanship",
      "action:placed on dark velvet surface, angled at 30 degrees toward camera"
    ),
  },
  {
    templateId: "v3_luxury_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:CU", "focal_length:macro",
      "depth_of_field:very_shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:lens_flare",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:meditative", "visual_tension:low"
    ),
    layerLook: "crystal perfume bottle",
    layerShapeDesc: "tall elegant flacon with sculptural form",
    layerNotes: notes(
      "costume:transparent glass body, golden liquid inside, engraved brand logo",
      "prop:gold metallic cap, brand insignia on neck",
      "detail:soft mist around bottle, subtle vapor effect, glossy obsidian surface reflection below"
    ),
  },
  {
    templateId: "v3_luxury_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 30,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:commercial","shot_size:MCU","focal_length:85mm",
      "cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious",
      "key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean",
      "narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:subtle studio dust; non-pristine reflective base; slight light falloff variation"
    ),
    sceneLayers: [
      { id: "watch_body", type: "prop", look: "high-end mechanical wristwatch presented as the hero object in a dark luxury studio", shapeDesc: "centered prestige watch anchor", z: 6, notes: notes("detail:polished steel case, sapphire crystal, brushed dial, crisp bezel highlight, real material response","imperfection_object:minor scratches; subtle fingerprint trace; non-pristine finish"), t0: { x: 50, y: 56, w: 24, h: 20, rot: 0 }, t1: { x: 50, y: 54, w: 28, h: 22, rot: 0 } },
      { id: "watch_support", type: "prop", look: "reflective obsidian plinth and soft floating dial particles around the watch", shapeDesc: "luxury support layer for movement and scale", z: 2, notes: notes("detail:keeps the commercial feeling premium and cinematic"), t0: { x: 50, y: 70, w: 40, h: 14, rot: 0 }, t1: { x: 50, y: 68, w: 42, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_car_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:filmic","shot_size:LS","focal_length:35mm","cam_angle:low_angle",
      "depth_of_field:medium","bg_preset:outdoor_urban","env_mood:dramatic","key_light_time:night","color_temp:8000K",
      "spec_light:volumetric","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:slow_burn","visual_tension:medium",
      "imperfection_scene:wet road grit; worn painted lane marks; drifting mist"
    ),
    sceneLayers: [
      { id: "car_hero", type: "prop", look: "high-end black sports car parked in a cinematic night street setup", shapeDesc: "wide low-angle automotive hero anchor", z: 6, notes: notes("detail:glossy paint, carbon fiber trim, chrome wheel definition, LED headlight signature","imperfection_object:road dust; minor body reflections irregularity; subtle water spots"), t0: { x: 52, y: 58, w: 54, h: 24, rot: 0 } },
      { id: "street_reflection", type: "prop", look: "wet tarmac, curb edge, and neon reflections stretching under the car", shapeDesc: "automotive environment support layer", z: 2, notes: notes("detail:sells speed, luxury, and real urban atmosphere"), t0: { x: 50, y: 72, w: 80, h: 18, rot: 0 } },
      { id: "city_arch", type: "prop", look: "soft city façade, sign glow, and volumetric haze behind the car", shapeDesc: "night city automotive anchor", z: 1, notes: notes("detail:keeps the image cinematic rather than studio-generic"), t0: { x: 58, y: 38, w: 74, h: 24, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_lifestyle_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:50mm",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","spec_light:practical_window","color_grade:natural","film_look:film_grain",
      "narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:soft table dust; slight countertop scratches; uneven daylight falloff"
    ),
    sceneLayers: [
      { id: "hand_subject", type: "character", look: "elegant real hand holding the product at a believable three-quarter angle", shapeDesc: "hand-and-product hero anchor showing actual scale", z: 5, notes: notes("costume:natural hand styling, short clean nails, no heavy manicure","detail:skin texture, knuckle folds, realistic grip pressure, believable use context","imperfection_object:visible pores; slight dryness at knuckles; natural asymmetry"), t0: { x: 44, y: 56, w: 22, h: 34, rot: -6 } },
      { id: "product_focus", type: "prop", look: "the product clearly readable in hand with premium material response", shapeDesc: "small but high-priority product detail block", z: 6, notes: notes("detail:logo area readable, edge definition preserved, tactile material finish","imperfection_object:minor scratches; subtle fingerprint trace; non-pristine finish"), t0: { x: 54, y: 56, w: 20, h: 20, rot: 8 } },
      { id: "lifestyle_anchor", type: "prop", look: "marble counter edge, folded receipt, and coffee cup blur creating a believable premium lifestyle backdrop", shapeDesc: "soft indoor lifestyle anchor", z: 1, notes: notes("detail:keeps the scene commercial and lived-in without clutter"), t0: { x: 64, y: 66, w: 28, h: 16, rot: 0 } },
    ],
  },

  // ── PEOPLE PORTRAIT ────────────────────────────────────────────

  {
    templateId: "v3_portrait_editorial_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:backdrop dust; light haze; soft floor wear"
    ),
    sceneLayers: [
      { id: "editorial_model", type: "character", look: "editorial female model with angular jaw and high-fashion stillness", shapeDesc: "mid-close magazine cover subject", z: 6, notes: notes("costume:high-end fashion garment with crisp tailoring and tactile fabric","pose:power_pose","expression:confident","detail:visible pores, precise makeup, controlled garment texture, believable skin finish","imperfection_object:visible pores; natural asymmetry; slight makeup wear; fabric lint"), t0: { x: 50, y: 54, w: 30, h: 44, rot: 0 } },
      { id: "editorial_set", type: "prop", look: "minimal cube pedestal or folded garment volume behind the model", shapeDesc: "subtle editorial staging support", z: 2, notes: notes("detail:turns the portrait into an actual magazine set"), t0: { x: 67, y: 66, w: 18, h: 16, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_cinematic_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K",
      "color_grade:teal_orange","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:medium",
      "imperfection_scene:street haze; worn curb texture; light airborne dust"
    ),
    sceneLayers: [
      { id: "cinematic_lead", type: "character", look: "cinematic protagonist framed in a dramatic urban golden-hour still", shapeDesc: "mid-shot lead with strong facial architecture", z: 6, notes: notes("costume:simple but distinctive clothing with clean silhouette","expression:determined","detail:intense gaze, cheekbone definition, real skin texture, cinematic highlight rolloff","imperfection_object:visible pores; natural asymmetry; faint under-eye darkness"), t0: { x: 46, y: 54, w: 28, h: 42, rot: 0 } },
      { id: "city_background", type: "prop", look: "softly defocused city edge, parked car line, and low sun flare behind the lead", shapeDesc: "cinematic city anchor", z: 1, notes: notes("detail:keeps the portrait grounded in a story world"), t0: { x: 62, y: 42, w: 46, h: 22, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_wk_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "director_pack:wong_kar_wai",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:outdoor_urban",
      "env_mood:melancholic",
      "key_light_time:night", "color_temp:3200K", "spec_light:neon",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:slow_burn", "visual_tension:low"
    ),
    layerLook: "solitary figure, 1970s Hong Kong attire, loose shirt, melancholic posture",
    layerShapeDesc: "melancholic presence, timeless quality",
    layerNotes: notes(
      "costume:raw silk qipao or linen suit, 1970s Hong Kong period-accurate, nothing synthetic",
      "shapeDesc:medium close-up, face upper center, shallow focus separates subject from neon background",
      "accessory:thin gold bracelet, single period earring, nothing modern",
      "action:head slightly turned, gaze directed off-frame at 30-degree angle",
      "expression:eyes slightly downcast, mouth relaxed — melancholy without drama",
      "emotion:trapped time, longing for something unreachable, nostalgic ache in every detail",
      "detail:single warm neon catchlight in each eye — amber point of reflection in iris, soft halo on cheekbone",
      "status:absolutely still, suspended in an emotional moment",
      "shapeDesc:background neon signs render as soft oval amber and red blobs behind head"
    ),
  },
  {
    templateId: "v3_portrait_luxury_fashion_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:85mm",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "tall model, couture garment, sculptural silhouette, luxury styling",
    layerShapeDesc: "full-length elegant stance",
    layerNotes: notes(
      "costume:luxury fashion garment, couture quality, intricate detail",
      "pose:profile",
      "expression:confident",
      "detail:fabric drape and texture, garment craftsmanship, skin luminosity"
    ),
  },
  {
    templateId: "v3_portrait_corporate_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:shallow",
      "bg_preset:indoor_luxury",
      "env_mood:luxurious",
      "key_light_time:overcast", "color_temp:5600K",
      "color_grade:cool_steel", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "senior executive",
    layerShapeDesc: "composed authoritative presence",
    layerNotes: notes(
      "costume:tailored business suit, quality fabric",
      "pose:power_pose",
      "expression:confident",
      "detail:precise tailoring, clean grooming, controlled expression"
    ),
  },

  // ── COVER POSTER ───────────────────────────────────────────────

  {
    templateId: "v3_poster_brand_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:MS", "focal_length:50mm",
      "depth_of_field:shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "brand visual centerpiece, bold graphic composition",
    layerNotes: notes(
      "costume:premium brand aesthetic",
      "detail:clean typography space in upper third, strong visual hierarchy"
    ),
  },
  {
    templateId: "v3_poster_movie_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:FS", "focal_length:35mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:3200K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:epic_build", "visual_tension:high"
    ),
    layerLook: "hero figure, dramatic 3/4 angle, confident stance, cinematic lighting",
    layerNotes: notes(
      "costume:distinctive iconic clothing",
      "pose:hero_entry",
      "expression:determined",
      "detail:dramatic sky behind, environmental scale contrast, poster composition"
    ),
  },

  // ── STORY VIDEO ────────────────────────────────────────────────

  {
    templateId: "v3_story_drama_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:cinematic_still",
      "shot_size:MCU", "focal_length:85mm",
      "cam_movement:static",
      "depth_of_field:very_shallow",
      "bg_preset:indoor_luxury",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:3200K",
      "color_grade:warm_golden", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:medium"
    ),
    layerLook: "character in dramatic indoor dialogue",
    layerNotes: notes(
      "costume:contemporary clothing",
      "action:standing",
      "expression:determined",
      "detail:ambient practical lights in background, emotional shadows on face"
    ),
  },
  {
    templateId: "v3_story_action_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:filmic",
      "director_pack:nolan",
      "shot_size:MCU", "focal_length:35mm", "cam_angle:low_angle",
      "cam_movement:handheld",
      "depth_of_field:shallow",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:3200K",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:urgent", "visual_tension:high"
    ),
    layerLook: "athletic figure, running, motion blur on limbs",
    layerNotes: notes(
      "costume:worn dark hoodie, tactical pants, well-used trainers — functional not fashionable, lived-in",
      "shapeDesc:3/4 body visible, body pitched 30 degrees forward, arms pumping mid-stride",
      "action:full sprint, right foot pushing off wet pavement, body committed toward camera-left",
      "expression:jaw tight, eyes scanning ahead — survival-focus, not rage",
      "emotion:desperate velocity, fight-or-flight adrenaline, urban pursuit tension at its peak",
      "detail:motion blur on legs and periphery, face sharp — panning camera technique implied",
      "status:peak-action moment — not running TO something, running FROM something",
      "shapeDesc:wet pavement reflections below echo the running figure as a distorted shadow-twin"
    ),
  },
  {
    templateId: "v3_story_scifi_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:filmic",
      "director_pack:nolan",
      "shot_size:XLS", "focal_length:24mm",
      "cam_movement:crane_up",
      "depth_of_field:deep",
      "bg_preset:abstract",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:cool_steel", "film_look:anamorphic_flare",
      "narrative_rhythm:epic_build", "visual_tension:high"
    ),
    layerLook: "lone astronaut in full space suit, visor reflecting stars",
    layerShapeDesc: "full-body standing, helmet on, arms slightly raised for balance",
    layerNotes: notes(
      "costume:hard-shell EVA space suit, white with orange trim, mission patches on shoulder, tethering D-rings on chest",
      "shapeDesc:full-body standing, helmet visor reflecting nebula, arms slightly raised for zero-G balance",
      "accessory:sealed helmet with curved polycarbonate visor, built-in comm antenna, chest-mounted life support panel",
      "prop:handheld equipment in right hand, tether cable trailing off to the right",
      "action:stationary, slight body lean as if adjusting to microgravity",
      "expression:face partially visible through visor, focused and calm",
      "detail:visible helmet reflection contains the nebula background, suit surface has micro-scratches from use",
      "emotion:vast cosmic solitude, human scale dwarfed by universe, quiet heroism",
      "status:suit pressurized, oxygen indicator LED visible on wrist panel"
    ),
  },
  {
    templateId: "v3_story_romance_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:cinematic_still",
      "director_pack:wong_kar_wai",
      "shot_size:MCU", "focal_length:85mm",
      "cam_movement:slow_push",
      "depth_of_field:very_shallow",
      "bg_preset:outdoor_urban",
      "env_mood:melancholic",
      "key_light_time:night", "color_temp:3200K", "spec_light:neon",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:slow_burn", "visual_tension:low"
    ),
    layerLook: "two characters in a chance encounter",
    layerNotes: notes(
      "costume:romantic casual clothing",
      "action:standing",
      "expression:surprised",
      "emotion:tense",
      "detail:warm neon light between them, city night softly out of focus"
    ),
  },
  {
    templateId: "v3_story_fashion_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 10,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:editorial",
      "shot_size:FS", "focal_length:85mm",
      "cam_movement:orbit",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "fashion model in structured luxury garment, minimal jewelry, confident stance",
    layerNotes: notes(
      "costume:structured wool coat off-white oversized, raw hem at ankle, single oversized matte button closure",
      "shapeDesc:full-length to knee, figure at two-thirds frame height, ample negative space on both sides",
      "accessory:one architectural gold cuff on left wrist, no bag, no visible branding",
      "action:mid-stride, weight transferring left to right, coat hem lifting in motion",
      "expression:forward gaze, chin slightly elevated, presence not affect — not smiling",
      "emotion:quiet authority, fashion confidence, garment IS the statement",
      "detail:fabric drape across structured shoulders catches soft studio light, seams razor-sharp",
      "status:in motion — fabric ghost-blur visible but face crisp and sharp",
      "shapeDesc:negative space flanking figure is deliberate — this is not a catalog shot"
    ),
  },

  // ── PRO WORKFLOWS ──────────────────────────────────────────────

  {
    templateId: "v3_pro_commercial_30s_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 30,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:commercial",
      "shot_size:MCU", "focal_length:85mm",
      "cam_movement:slow_push",
      "depth_of_field:very_shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "premium product, flawless surface finish, precision-machined details",
    layerShapeDesc: "premium commercial subject",
    layerNotes: notes(
      "costume:premium product surface — anodized aluminum body, matte-finish rear panel, chamfered edge catches specular highlight",
      "shapeDesc:product positioned at 30-degree angle to lens, bottom-left closer, top-right receding — classic ad perspective",
      "accessory:subtle ambient occlusion shadow at base, groundline visible but clean",
      "prop:no props — product is hero, negative space is intentional",
      "detail:every surface texture rendered: brushed grain direction visible on metal, glass specular is a single elongated highlight not blown",
      "action:static, no motion — this is the hero freeze-frame of a 30-second commercial",
      "emotion:aspirational desire, premium quality, you-deserve-this energy",
      "status:hero moment — maximum elegance, zero distraction",
      "shapeDesc:product fills 40% of frame, centered with 30% breathing room on each side"
    ),
  },
  {
    templateId: "v3_pro_nolan_epic_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:filmic",
      "director_pack:nolan",
      "shot_size:XLS", "focal_length:24mm", "cam_angle:low_angle",
      "cam_movement:crane_up",
      "depth_of_field:deep",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:3200K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:epic_build", "visual_tension:high"
    ),
    layerLook: "lone figure in worn practical clothing, silhouette sharp",
    layerShapeDesc: "full-body long shot, centered in frame, dwarfed by architecture",
    layerNotes: notes(
      "costume:practical dark field jacket, cargo pants, worn leather boots — nothing branded, everything functional",
      "shapeDesc:full-body long shot, human figure at lower third, dwarfed by towering concrete or natural cliff behind",
      "action:standing still, weight on one foot, facing slightly away from camera — suggesting contemplation or resolve",
      "expression:face not fully visible at this scale — expression implied by posture",
      "prop:no props — isolation is the point",
      "detail:golden light from hard side angle creates strong shadow split on figure and environment equally",
      "emotion:epic scale, human resolve against impossible odds, IMAX-grade gravitas",
      "status:still, composed, not afraid — a moment before action",
      "shapeDesc:human figure occupies 15% of frame height — everything else is environment"
    ),
  },
  {
    templateId: "v3_pro_wk_style_01",
    mediaMode: "video", aspectRatio: "1:1", duration: 10,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:cinematic_still",
      "director_pack:wong_kar_wai",
      "shot_size:MCU", "focal_length:85mm",
      "cam_movement:slow_push",
      "depth_of_field:very_shallow",
      "bg_preset:outdoor_urban",
      "env_mood:melancholic",
      "key_light_time:night", "color_temp:3200K", "spec_light:neon",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:slow_burn", "visual_tension:low"
    ),
    layerLook: "lone figure, vintage coat, collar up, face half-lit by neon",
    layerShapeDesc: "medium shot, figure at left third, bokeh neon at right",
    layerNotes: notes(
      "costume:loose cream linen shirt half-tucked, wide-leg trousers, 1970s Hong Kong style — lived-in and slightly rumpled",
      "shapeDesc:medium shot, figure at left third of frame, occupying 60% of vertical height, bokeh neon columns at right",
      "accessory:lit cigarette in right hand, smoke curl visible",
      "prop:glass of amber liquid on surface, condensation rings, half-empty",
      "action:leaning against wall, weight on left shoulder, right arm hanging loose",
      "expression:eyes half-closed, gaze past camera — somewhere in memory, not present",
      "emotion:suspended time, melancholic longing, beautiful sadness without explanation",
      "detail:neon red and amber light split across face — left side warm, right side cool shadow, skin texture visible in catch light",
      "status:in stasis — a person living inside a feeling",
      "shapeDesc:background bokeh columns elongated not circular — slow aperture, anamorphic quality"
    ),
  },
  {
    templateId: "v3_pro_fincher_style_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3", "media: video",
      "render_style:filmic",
      "director_pack:fincher",
      "shot_size:MS", "focal_length:35mm",
      "cam_movement:slow_push",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:6500K", "spec_light:practicals",
      "color_grade:noir", "film_look:bleach_bypass",
      "narrative_rhythm:slow_burn", "visual_tension:high"
    ),
    layerLook: "character under clinical Fincher lighting",
    layerNotes: notes(
      "costume:precise, controlled clothing",
      "action:sitting",
      "expression:determined",
      "emotion:tense",
      "detail:green-teal light wash, hard shadow geometry, controlled chaos in background"
    ),
  },
  {
    templateId: "v3_pro_editorial_series_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:85mm",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "editorial fashion subject",
    layerShapeDesc: "magazine-quality presence",
    layerNotes: notes(
      "costume:couture-level fashion garment",
      "pose:power_pose",
      "expression:confident",
      "detail:fabric architecture, garment engineering, skin perfection"
    ),
  },

  // ── MISSING PAYLOADS — all 73 remaining templates ────────────────

  // PRODUCT
  {
    templateId: "v3_product_white_03",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MS","focal_length:85mm",
      "depth_of_field:deep","bg_preset:studio_white","env_mood:serene","key_light_time:studio",
      "color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:soft floor scuffs; subtle paper dust; non-pristine white stage"
    ),
    sceneLayers: [
      { id: "set_main", type: "product", look: "three-piece skincare or fragrance set arranged in a clean family composition", shapeDesc: "primary bottle flanked by two smaller companion items", z: 5, notes: notes("detail:label hierarchy readable, premium packaging proportion, family silhouette coherence","imperfection_object:micro carton texture; tiny print misregistration; subtle cap wear"), t0: { x: 50, y: 56, w: 42, h: 28, rot: 0 } },
      { id: "base_card", type: "prop", look: "soft white acrylic riser card beneath the product group", shapeDesc: "thin rectangular plinth adding depth without clutter", z: 2, notes: notes("detail:clean edge line, soft grounded shadow","imperfection_object:faint edge abrasion"), t0: { x: 50, y: 68, w: 48, h: 10, rot: 0 } },
      { id: "accent_leaf", type: "prop", look: "minimal pale botanical accent placed behind one side of the set", shapeDesc: "small soft organic silhouette", z: 1, notes: notes("detail:kept secondary, only enough to break sterility","imperfection_object:natural irregularity"), t0: { x: 69, y: 49, w: 10, h: 12, rot: 8 } },
    ],
  },
  {
    templateId: "v3_product_hero_03",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:studio_white","env_mood:serene","key_light_time:studio",
      "color_temp:5600K","spec_light:rim_light","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:subtle studio dust; not overly sterile white environment"
    ),
    sceneLayers: [
      { id: "hero_product", type: "product", look: "premium cosmetic jar or compact device centered on a white infinity backdrop", shapeDesc: "main hero object with bold clean silhouette", z: 5, notes: notes("detail:premium edge highlight, embossed logo, tight controlled shadow","imperfection_object:micro fingerprints; tiny surface dust; slight finish inconsistency"), t0: { x: 50, y: 58, w: 34, h: 28, rot: 0 } },
      { id: "soft_shadow", type: "prop", look: "grounding shadow plane under the hero product", shapeDesc: "soft oval tonal anchor", z: 1, notes: notes("detail:soft but visible grounding to avoid floating ambiguity"), t0: { x: 50, y: 69, w: 36, h: 8, rot: 0 } },
      { id: "white_reflector", type: "prop", look: "subtle white side reflector card causing a controlled edge glow", shapeDesc: "invisible studio support effect", z: 0, notes: notes("detail:commercial polish, no visible clutter"), t0: { x: 76, y: 52, w: 12, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_detail_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:ECU","focal_length:macro","depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:5600K","spec_light:rim_light","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "product material texture close-up",
    layerNotes: notes("costume:premium material surface","detail:micro-texture visible, grain or weave pattern, surface quality communicates craftsmanship"),
  },
  {
    templateId: "v3_product_lifestyle_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:35mm",
      "depth_of_field:medium","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","spec_light:practical_window","color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:subtle desk dust; uneven paper stack; natural material aging"
    ),
    sceneLayers: [
      { id: "desk_product", type: "product", look: "hero product placed on a styled walnut desk in a calm lifestyle setup", shapeDesc: "center-right commercial product anchor", z: 5, notes: notes("detail:clear scale, realistic product presence, premium but lived-in context","imperfection_object:micro dust; light packaging wear"), t0: { x: 58, y: 58, w: 18, h: 22, rot: 0 } },
      { id: "notebook_prop", type: "prop", look: "linen notebook and fountain pen on the left side of the desk", shapeDesc: "editorial lifestyle prop cluster", z: 3, notes: notes("detail:texture contrast, believable daily-use scene","imperfection_object:paper edge curl; tiny ink mark"), t0: { x: 33, y: 62, w: 18, h: 14, rot: -6 } },
      { id: "cup_prop", type: "prop", look: "ceramic cup with faint tea stain ring near the product", shapeDesc: "small hospitality detail", z: 4, notes: notes("detail:soft steam or warmth implied, human presence without showing a person","imperfection_object:small stain ring; uneven glaze"), t0: { x: 72, y: 63, w: 8, h: 10, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_video_01",
    mediaMode: "video", aspectRatio: "1:1", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:commercial","shot_size:MS","focal_length:85mm","cam_movement:orbit",
      "depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:halation","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:light atmospheric particles; non-pristine pedestal finish"
    ),
    sceneLayers: [
      { id: "orbit_hero", type: "product", look: "luxury product hero on a dark circular pedestal", shapeDesc: "centered hero object for full-angle reveal", z: 5, notes: notes("detail:precise material highlight travel, engraved brand mark, rotation-friendly silhouette","imperfection_object:subtle fingerprints; tiny metal edge wear"), t0: { x: 50, y: 56, w: 24, h: 30, rot: 0 } },
      { id: "pedestal", type: "prop", look: "matte black pedestal with soft brushed texture", shapeDesc: "simple cylinder base", z: 2, notes: notes("detail:grounds the hero and catches faint ring reflection","imperfection_object:minor scuffs"), t0: { x: 50, y: 72, w: 28, h: 12, rot: 0 }, t1: { x: 50, y: 72, w: 28, h: 12, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_video_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:commercial","shot_size:MCU","focal_length:85mm","cam_movement:slow_push",
      "depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:lens_flare","color_grade:warm_golden","film_look:halation","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:subtle haze; imperfect dark stage finish"
    ),
    sceneLayers: [
      { id: "reveal_product", type: "product", look: "premium hero product slowly revealed from darkness", shapeDesc: "strong frontal object with dramatic edge light", z: 5, notes: notes("detail:brand silhouette appears first, then material finish, then logo and details","imperfection_object:micro dust; faint hairline marks"), t0: { x: 50, y: 58, w: 22, h: 28, rot: 0 }, t1: { x: 50, y: 56, w: 26, h: 32, rot: 0 } },
      { id: "light_strip", type: "prop", look: "narrow practical light streak passing behind the product", shapeDesc: "thin cinematic lighting accent", z: 1, notes: notes("detail:dramatic reveal layer, not a subject"), t0: { x: 50, y: 46, w: 40, h: 4, rot: 0 }, t1: { x: 50, y: 46, w: 40, h: 4, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_video_03",
    mediaMode: "video", aspectRatio: "1:1", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:commercial","shot_size:ECU","focal_length:macro","cam_movement:slow_push",
      "depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio",
      "color_temp:5600K","spec_light:rim_light","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:micro dust in beam light"
    ),
    sceneLayers: [
      { id: "macro_surface", type: "product", look: "extreme close-up of premium product texture and finish", shapeDesc: "macro material detail surface", z: 5, notes: notes("detail:grain, stitching, knurling, etched logo or texture transitions all readable","imperfection_object:tiny scratches; micro surface inconsistency"), t0: { x: 50, y: 52, w: 56, h: 36, rot: 0 }, t1: { x: 52, y: 52, w: 62, h: 40, rot: 0 } },
    ],
  },
  {
    templateId: "v3_luxury_03",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:subtle floating mist; non-pristine reflective stage"
    ),
    sceneLayers: [
      { id: "skin_hero", type: "product", look: "premium skincare bottle with ceramic-glass body and brushed metallic cap", shapeDesc: "centered hero vessel with clean luxury geometry", z: 5, notes: notes("detail:brand embossing, creamy product logic, premium material transitions","imperfection_object:micro condensation; tiny cap abrasion; slight label edge wear"), t0: { x: 50, y: 54, w: 24, h: 32, rot: 0 } },
      { id: "liquid_ribbon", type: "prop", look: "subtle cream ribbon or serum swirl wrapping near the bottle base", shapeDesc: "luxury skincare motion accent frozen as still life", z: 3, notes: notes("detail:communicates texture and efficacy without clutter","imperfection_object:slight shape irregularity"), t0: { x: 52, y: 64, w: 22, h: 8, rot: 0 } },
    ],
  },
  {
    templateId: "v3_luxury_04",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:FS","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:soft airborne dust; non-pristine black stage"
    ),
    sceneLayers: [
      { id: "bag_hero", type: "product", look: "luxury structured handbag with top handle, rich leather grain, and gold hardware", shapeDesc: "architectural bag silhouette angled three-quarter toward camera", z: 5, notes: notes("detail:precise stitching, embossed brand monogram, dimensional structure","imperfection_object:subtle leather creases; light hardware scratches; natural edge wear"), t0: { x: 50, y: 56, w: 30, h: 34, rot: 0 } },
      { id: "chain_accent", type: "prop", look: "detached chain strap elegantly looping beside the bag", shapeDesc: "secondary metallic luxury accent", z: 4, notes: notes("detail:adds richness and motion rhythm","imperfection_object:micro tarnish"), t0: { x: 68, y: 66, w: 12, h: 10, rot: 18 } },
    ],
  },
  {
    templateId: "v3_car_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:LS","focal_length:50mm","cam_angle:low_angle",
      "depth_of_field:medium","bg_preset:studio_dark","env_mood:dramatic","key_light_time:studio",
      "color_temp:6500K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:subtle floor dust; imperfect wet-floor streaks"
    ),
    sceneLayers: [
      { id: "car_body", type: "product", look: "luxury sedan in a dark studio from a low three-quarter angle", shapeDesc: "full vehicle hero with aggressive stance", z: 5, notes: notes("detail:precise paint reflections, alloy wheel detail, badge readable, brake caliper accent","imperfection_object:tiny road dust; subtle tire wear; faint swirl marks on clear coat"), t0: { x: 52, y: 58, w: 62, h: 34, rot: 0 } },
      { id: "floor_reflect", type: "prop", look: "semi-wet reflective floor grounding the vehicle", shapeDesc: "dark reflective base plane", z: 1, notes: notes("detail:commercial automotive studio polish","imperfection_object:light streaks; faint pooled water traces"), t0: { x: 50, y: 74, w: 80, h: 16, rot: 0 } },
    ],
  },
  {
    templateId: "v3_tech_ad_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:gradient_black","env_mood:dramatic","key_light_time:studio",
      "color_temp:6500K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:light suspended particles; non-pristine reflective black base"
    ),
    sceneLayers: [
      { id: "device_hero", type: "product", look: "premium smartphone with sleek unibody frame and crisp camera module", shapeDesc: "angled floating hero device with minimal bezel", z: 5, notes: notes("detail:camera module precision, subtle screen glow, metallic chamfer edge","imperfection_object:micro fingerprints; faint hairline scratches; tiny dust around lens ring"), t0: { x: 50, y: 52, w: 32, h: 40, rot: -6 } },
      { id: "ui_light", type: "prop", look: "abstract interface light bars behind the device", shapeDesc: "soft tech launch support graphics", z: 1, notes: notes("detail:keeps hero dominant while reinforcing tech context"), t0: { x: 50, y: 52, w: 44, h: 22, rot: 0 } },
    ],
  },
  {
    templateId: "v3_food_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:subtle table crumbs; slight sauce drag; non-pristine tabletop"
    ),
    sceneLayers: [
      { id: "dish_hero", type: "product", look: "premium plated signature dish with layered ingredients and refined garnish", shapeDesc: "centered hero plate composition", z: 5, notes: notes("detail:steam, glaze, moisture beads, ingredient texture contrast","imperfection_object:tiny sauce drip; irregular herb placement; natural food variation"), t0: { x: 50, y: 58, w: 36, h: 26, rot: 0 } },
      { id: "cutlery", type: "prop", look: "brushed silver cutlery and folded napkin beside the plate", shapeDesc: "support hospitality detail", z: 3, notes: notes("detail:restaurant-grade styling, premium dining context","imperfection_object:faint smudges; textile fold irregularity"), t0: { x: 73, y: 60, w: 14, h: 16, rot: 0 } },
    ],
  },

  // PORTRAIT
  {
    templateId: "v3_portrait_editorial_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:85mm",
      "depth_of_field:medium","bg_preset:outdoor_urban","env_mood:serene","key_light_time:golden_hour",
      "color_temp:3200K","spec_light:golden_hour","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:light airborne dust; worn pavement edges; natural city variation"
    ),
    sceneLayers: [
      { id: "model_editorial", type: "character", look: "fashion model in a tailored editorial silhouette standing in a quiet luxury street setting", shapeDesc: "full-body outdoor fashion figure", z: 5, notes: notes("costume:high-end fashion garment, structured coat, refined footwear, precise styling","expression:confident","detail:visible pores, natural facial asymmetry, subtle wind in fabric, premium city texture behind","imperfection_object:natural facial asymmetry; visible pores; fabric edge wear; not overly retouched"), t0: { x: 50, y: 57, w: 28, h: 52, rot: 0 } },
      { id: "urban_anchor", type: "prop", look: "architectural storefront edge and parked town car blur behind the model", shapeDesc: "soft city luxury anchor", z: 1, notes: notes("detail:grounds the editorial in a believable premium district"), t0: { x: 58, y: 38, w: 46, h: 24, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_corporate_02",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:85mm",
      "depth_of_field:medium","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","spec_light:practical_window","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:soft office wear marks; subtle glass reflections"
    ),
    sceneLayers: [
      { id: "team_lead", type: "character", look: "professional team lead in a modern office portrait setup", shapeDesc: "clean waist-up business portrait subject", z: 5, notes: notes("costume:business casual with textured blazer and open-collar shirt","expression:confident","detail:real skin texture, slight under-eye detail, smart office polish","imperfection_object:visible pores; faint under-eye darkness; subtle fabric lint"), t0: { x: 50, y: 54, w: 34, h: 42, rot: 0 } },
      { id: "office_anchor", type: "prop", look: "glass partition and soft conference table blur in the background", shapeDesc: "modern office context anchor", z: 1, notes: notes("detail:corporate but not generic, quiet authority"), t0: { x: 52, y: 46, w: 50, h: 26, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_lifestyle_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:photorealistic","shot_size:MS","focal_length:50mm",
      "depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:energetic","key_light_time:golden_hour",
      "color_temp:3200K","color_grade:vibrant","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:street dust; small poster tears; uneven pavement"
    ),
    sceneLayers: [
      { id: "street_subject", type: "character", look: "stylish urban subject leaning into a lived-in city street portrait", shapeDesc: "mid-body street style figure", z: 5, notes: notes("costume:contemporary street style clothing, layered jacket, tonal sneakers, understated accessories","expression:confident","detail:natural pores, slight asymmetry, clothing creases, city sunlight edge","imperfection_object:natural facial asymmetry; visible pores; fabric wear; not overly retouched"), t0: { x: 50, y: 58, w: 30, h: 46, rot: 0 } },
      { id: "street_anchor", type: "prop", look: "subway entrance rail and postered wall behind the subject", shapeDesc: "urban context anchor", z: 1, notes: notes("detail:softly readable city context without distracting"), t0: { x: 54, y: 40, w: 54, h: 26, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_lifestyle_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:50mm",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","spec_light:practical_window","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:coffee ring; subtle table dust; slightly uneven window light falloff"
    ),
    sceneLayers: [
      { id: "cafe_subject", type: "character", look: "casual lifestyle subject seated in a refined café corner", shapeDesc: "mid-body seated portrait with relaxed posture", z: 5, notes: notes("costume:soft knitwear, lived-in denim or tailored casual layers","expression:joyful","emotion:calm","detail:soft real skin, smile lines, hand placement, believable café moment","imperfection_object:visible pores; natural smile lines; slight fabric pilling"), t0: { x: 46, y: 58, w: 30, h: 44, rot: 0 } },
      { id: "cafe_props", type: "prop", look: "coffee cup, open book, and marble side table near the subject", shapeDesc: "small lifestyle prop cluster", z: 4, notes: notes("detail:helps scale and narrative warmth","imperfection_object:coffee stain ring; page curl"), t0: { x: 68, y: 66, w: 18, h: 16, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_cinematic_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:studio_dark","env_mood:mysterious","key_light_time:studio",
      "color_temp:3200K","spec_light:single_practical","color_grade:noir","film_look:film_grain",
      "narrative_rhythm:slow_burn","visual_tension:medium",
      "imperfection_scene:smoke residue in air; faint wall texture; non-pristine dark backdrop"
    ),
    sceneLayers: [
      { id: "noir_subject", type: "character", look: "mysterious protagonist emerging from shadow with one side of the face barely revealed", shapeDesc: "mid-close cinematic noir figure", z: 5, notes: notes("costume:dark wool coat or tailored noir wardrobe with structured collar","expression:stoic","detail:half-lit cheekbone, skin texture, slight asymmetry, controlled jaw tension","imperfection_object:visible pores; faint under-eye darkness; natural asymmetry; slight fabric lint"), t0: { x: 44, y: 54, w: 28, h: 42, rot: 0 } },
      { id: "practical_anchor", type: "prop", look: "single tungsten practical lamp and hazy window sliver behind the subject", shapeDesc: "small noir lighting anchor", z: 2, notes: notes("detail:grounds the image in a specific noir room instead of abstract darkness"), t0: { x: 68, y: 46, w: 22, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_video_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:85mm","cam_movement:static",
      "depth_of_field:shallow","bg_preset:studio_dark","env_mood:serene","key_light_time:studio",
      "color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:light dust in beam path; slight backdrop texture"
    ),
    sceneLayers: [
      { id: "host", type: "character", look: "trusted host or creator speaking directly to camera in a vertical studio setup", shapeDesc: "upper-body on-camera presenter", z: 5, notes: notes("costume:professional on-camera attire with subtle layering","expression:confident","detail:natural eye contact, slight lip asymmetry, skin texture, controlled hand gesture","imperfection_object:visible pores; faint under-eye darkness; natural expression lines"), t0: { x: 50, y: 54, w: 36, h: 46, rot: 0 } },
      { id: "desk_hint", type: "prop", look: "minimal desk edge and notebook at the very bottom of frame", shapeDesc: "small production anchor", z: 2, notes: notes("detail:signals real filming environment"), t0: { x: 50, y: 84, w: 40, h: 8, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_video_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:85mm","cam_movement:static",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:studio",
      "color_temp:5600K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:quiet room texture; subtle practicals"
    ),
    sceneLayers: [
      { id: "interview_subject", type: "character", look: "interview subject in a composed side-lit setup", shapeDesc: "seated upper-body interview frame", z: 5, notes: notes("costume:professional attire with tonal layering","expression:determined","detail:controlled side key, slight eye bag, skin realism, composed shoulders","imperfection_object:visible pores; faint under-eye darkness; natural age traces"), t0: { x: 46, y: 54, w: 34, h: 44, rot: 0 } },
      { id: "chair_back", type: "prop", look: "subtle chair and warm practical light behind the subject", shapeDesc: "interview context anchor", z: 1, notes: notes("detail:grounds documentary authority"), t0: { x: 63, y: 45, w: 24, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_fashion_video_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:85mm","cam_movement:slow_push",
      "depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:floating lint in spotlight; non-pristine runway floor"
    ),
    sceneLayers: [
      { id: "runway_model", type: "character", look: "fashion model walking toward camera in a couture runway moment", shapeDesc: "full-body catwalk subject", z: 5, notes: notes("costume:runway statement garment, precise heel, moving fabric silhouette","expression:confident","detail:slow fabric swish, natural skin detail, commanding stride","imperfection_object:natural asymmetry; visible pores; slight fabric fray; not overly smooth"), t0: { x: 50, y: 56, w: 24, h: 58, rot: 0 }, t1: { x: 50, y: 54, w: 28, h: 62, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_fashion_video_02",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:35mm","cam_movement:handheld",
      "depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:energetic","key_light_time:golden_hour",
      "color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium",
      "imperfection_scene:street poster wear; pavement dirt; light airborne dust"
    ),
    sceneLayers: [
      { id: "street_model", type: "character", look: "street fashion figure caught in candid city motion", shapeDesc: "mid-body streetwear subject in handheld energy", z: 5, notes: notes("costume:street fashion layers, standout outerwear, worn sneakers or boots","expression:confident","detail:wind in hair, fabric motion, authentic skin, city blur behind","imperfection_object:minor blemishes; natural asymmetry; scuffed footwear"), t0: { x: 50, y: 56, w: 34, h: 46, rot: 0 }, t1: { x: 52, y: 56, w: 34, h: 46, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_athlete_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:photorealistic","shot_size:MCU","focal_length:85mm",
      "cam_angle:low_angle","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic",
      "key_light_time:golden_hour","color_temp:3200K","spec_light:rim_light","color_grade:vibrant","film_look:film_grain",
      "narrative_rhythm:urgent","visual_tension:high",
      "imperfection_scene:track dust; turf wear; uneven sweat mist in backlight"
    ),
    sceneLayers: [
      { id: "athlete_subject", type: "character", look: "elite athlete caught at the peak of an explosive sprint finish", shapeDesc: "dominant low-angle sports portrait figure", z: 6, notes: notes("costume:performance jersey, compression shorts or track gear in team colors","action:running","expression:determined","detail:sweat beads, tendon strain, realistic muscle engagement, dirt on shoes","imperfection_object:visible pores; sweat sheen; minor blemishes; scuffed footwear"), t0: { x: 46, y: 56, w: 30, h: 42, rot: 0 } },
      { id: "sports_anchor", type: "prop", look: "lane markings, timing block, and blurred stadium rail behind the athlete", shapeDesc: "sports environment proof anchor", z: 2, notes: notes("detail:ensures the frame reads as real competition rather than generic action"), t0: { x: 58, y: 68, w: 34, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_couple_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:cinematic_still","shot_size:MS","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:melancholic","key_light_time:golden_hour",
      "color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:low",
      "imperfection_scene:soft pavement dust; distant traffic blur; slight city haze"
    ),
    sceneLayers: [
      { id: "couple_a", type: "character", look: "first partner in a restrained cinematic relationship frame", shapeDesc: "left-half emotional anchor", z: 5, notes: notes("costume:stylish contemporary outerwear with natural folds","expression:calm","emotion:melancholic","detail:eye contact almost withheld, subtle skin realism","imperfection_object:visible pores; natural asymmetry; slight fabric wear"), t0: { x: 38, y: 56, w: 22, h: 38, rot: 0 } },
      { id: "couple_b", type: "character", look: "second partner turned slightly toward the first with unspoken emotional tension", shapeDesc: "right-half emotional counterpart", z: 5, notes: notes("costume:contrasting refined city clothing","expression:sad","emotion:guarded","detail:distance and body angle communicate unresolved connection","imperfection_object:faint under-eye darkness; natural skin texture; not overly retouched"), t0: { x: 62, y: 56, w: 22, h: 38, rot: 0 } },
      { id: "city_anchor", type: "prop", look: "soft evening streetlights, railing, and distant city bokeh behind the pair", shapeDesc: "romantic urban evening anchor", z: 1, notes: notes("detail:keeps the story grounded in a place and time"), t0: { x: 50, y: 42, w: 56, h: 22, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_brand_collab_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio",
      "color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:soft platform dust; subtle gradient backdrop texture"
    ),
    sceneLayers: [
      { id: "ambassador", type: "character", look: "brand ambassador with warm credibility holding the hero product in a premium studio frame", shapeDesc: "mid-body endorsement subject", z: 5, notes: notes("costume:brand-aligned tailoring or knitwear with elevated finish","expression:confident","detail:approachable face, visible skin realism, believable hand pose","imperfection_object:visible pores; natural asymmetry; slight fabric lint"), t0: { x: 44, y: 56, w: 28, h: 42, rot: 0 } },
      { id: "hero_product", type: "prop", look: "luxury product prominently presented in the ambassador's hand or near the collarbone line", shapeDesc: "product endorsement anchor", z: 6, notes: notes("detail:product needs crisp silhouette and premium finish","imperfection_object:minor scratches; subtle fingerprint trace"), t0: { x: 58, y: 60, w: 12, h: 14, rot: 8 } },
      { id: "brand_set", type: "prop", look: "minimal plinth edge or reflective brand set element behind the ambassador", shapeDesc: "commercial studio support anchor", z: 2, notes: notes("detail:keeps the image ad-ready and not just portrait-like"), t0: { x: 66, y: 64, w: 18, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_fincher_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:cinematic_still","director_pack:fincher","shot_size:MCU","focal_length:35mm",
      "depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night","color_temp:6500K",
      "spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high",
      "imperfection_scene:glass smudges; desk wear; quiet room disorder"
    ),
    sceneLayers: [
      { id: "fincher_subject", type: "character", look: "controlled character under teal-green precision lighting in a geometric suspense interior", shapeDesc: "mid-shot subject placed in a rigorously framed composition", z: 6, notes: notes("costume:precise structured clothing with subtle wear","expression:determined","emotion:tense","detail:skin realism, eye focus, shadow geometry, restrained presence","imperfection_object:visible pores; under-eye detail; fabric edge wear"), t0: { x: 42, y: 56, w: 24, h: 38, rot: 0 } },
      { id: "precision_room", type: "prop", look: "desk edge, practical lamp, glass partition, and neatly displaced background objects", shapeDesc: "clinical room anchors framing the subject", z: 2, notes: notes("detail:Fincher-like controlled chaos, geometric depth, subtle evidence of use","imperfection_object:paper wear; glass smudges; desk scratches"), t0: { x: 66, y: 50, w: 30, h: 22, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_nolan_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:filmic","director_pack:nolan","shot_size:FS","focal_length:24mm","cam_angle:low_angle",
      "depth_of_field:deep","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K",
      "spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:high",
      "imperfection_scene:dust in air; terrain erosion; uneven cloud breaks"
    ),
    sceneLayers: [
      { id: "nolan_hero", type: "character", look: "heroic figure in a dark practical coat facing an immense horizon", shapeDesc: "small human figure carrying blockbuster-scale weight", z: 5, notes: notes("costume:structured dark coat with functional details","pose:hero_entry","expression:determined","detail:wind-driven fabric, grounded realism, solitary resolve","imperfection_object:fabric wear; dusty boots; natural asymmetry"), t0: { x: 42, y: 63, w: 12, h: 28, rot: 0 } },
      { id: "epic_landscape", type: "prop", look: "vast cliffs, broken architecture, and a monumental sky dominating the frame", shapeDesc: "giant environmental scale anchor", z: 1, notes: notes("detail:environment should dwarf the subject and carry IMAX-scale gravitas","imperfection_object:terrain erosion; debris traces; cloud irregularity"), t0: { x: 58, y: 44, w: 62, h: 40, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_video_long_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:cinematic_still","shot_size:FS","focal_length:85mm","cam_movement:slow_push",
      "depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K",
      "spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:street haze; dust in light shaft; worn pavement"
    ),
    sceneLayers: [
      { id: "intro_character", type: "character", look: "hero protagonist entering frame with a strong silhouette and deliberate pace", shapeDesc: "foreground character built for long-lens reveal", z: 6, notes: notes("costume:structured outerwear with cinematic silhouette","action:walking","expression:determined","detail:slow reveal, subtle body shift, grounded realism","imperfection_object:boot dust; coat wear; natural facial asymmetry"), t0: { x: 38, y: 60, w: 18, h: 36, rot: 0 }, t1: { x: 46, y: 60, w: 18, h: 36, rot: 0 } },
      { id: "entrance_anchor", type: "prop", look: "street corridor, doorway glow, and layered city depth behind the character", shapeDesc: "entrance path and depth anchor", z: 1, notes: notes("detail:space must read as a cinematic entrance lane rather than generic city bokeh","imperfection_object:worn pavement; haze; signage wear"), t0: { x: 60, y: 48, w: 38, h: 24, rot: 0 }, t1: { x: 60, y: 48, w: 38, h: 24, rot: 0 } },
    ],
  },

  // POSTER / COVER
  {
    templateId: "v3_poster_brand_02",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MS","focal_length:50mm","depth_of_field:shallow",
      "bg_preset:studio_white","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean",
      "narrative_rhythm:meditative","visual_tension:none","imperfection_scene:paper sweep texture; slight floor shadow irregularity"
    ),
    sceneLayers: [
      { id: "brand_subject", type: "product", look: "minimal hero product or spokesperson focal point positioned with brand-ad hierarchy", shapeDesc: "clean primary shape leaving intentional typography space", z: 5, notes: notes("detail:brand-forward silhouette, premium polish, negative space discipline","imperfection_object:micro surface wear; subtle print texture"), t0: { x: 38, y: 58, w: 22, h: 28, rot: 0 } },
      { id: "brand_shape", type: "prop", look: "secondary geometric plinth or graphic support form reinforcing the layout", shapeDesc: "support shape that stabilizes composition without stealing focus", z: 2, notes: notes("detail:built for key visual hierarchy and headline placement","imperfection_object:slight paper edge irregularity"), t0: { x: 66, y: 62, w: 22, h: 12, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_movie_02",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_angle:low_angle","depth_of_field:shallow",
      "bg_preset:outdoor_urban","env_mood:mysterious","key_light_time:night","color_temp:8000K","spec_light:volumetric","color_grade:noir",
      "film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:high","imperfection_scene:fog drift; wet grit; urban decay marks"
    ),
    sceneLayers: [
      { id: "thriller_lead", type: "character", look: "troubled protagonist locked in an intense thriller poster stare", shapeDesc: "close-up lead built for suspense poster crop", z: 6, notes: notes("costume:dark outerwear with subtle wear","expression:determined","emotion:tense","detail:shadow carve, emotional pressure, face-led poster focus","imperfection_object:visible pores; eye bags; natural asymmetry"), t0: { x: 44, y: 52, w: 34, h: 44, rot: 0 } },
      { id: "thriller_bg", type: "prop", look: "night urban residue, practical light glow, and damp architectural backdrop", shapeDesc: "genre anchor that grounds the thriller setting", z: 1, notes: notes("detail:must read as real threat-space, not generic darkness","imperfection_object:wet grit; wall wear; fog drift"), t0: { x: 66, y: 48, w: 28, h: 24, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_event_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:35mm","depth_of_field:medium",
      "bg_preset:outdoor_urban","env_mood:energetic","key_light_time:night","color_temp:8000K","spec_light:neon",
      "color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium",
      "imperfection_scene:haze bursts; light beam dust; crowd barrier wear"
    ),
    sceneLayers: [
      { id: "performer", type: "character", look: "headline performer captured in a full-body stage poster moment", shapeDesc: "front-stage hero subject", z: 6, notes: notes("costume:stage costume or elevated event styling with motion-ready silhouette","action:reaching_sky","expression:confident","detail:dynamic hand shape, sweat glow, controlled stage presence","imperfection_object:visible pores; makeup wear; fabric fray"), t0: { x: 48, y: 56, w: 24, h: 52, rot: 0 } },
      { id: "crowd_energy", type: "prop", look: "raised hands, haze, and beam lights suggesting a live audience below the stage", shapeDesc: "event energy support layer", z: 3, notes: notes("detail:implies scale without cluttering the composition"), t0: { x: 52, y: 76, w: 44, h: 18, rot: 0 } },
      { id: "stage_arch", type: "prop", look: "LED rig, truss structure, and colored backlight behind the performer", shapeDesc: "concert production anchor", z: 1, notes: notes("detail:turns the poster into a real event visual rather than generic portrait"), t0: { x: 50, y: 34, w: 64, h: 24, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_social_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm",
      "depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio",
      "color_temp:5600K","spec_light:rim_light","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:subtle floating dust; non-pristine dark backdrop"
    ),
    sceneLayers: [
      { id: "social_hero", type: "character", look: "premium brand ambassador or subject centered in a high-finish square social hero", shapeDesc: "clean center-weighted portrait anchor", z: 5, notes: notes("costume:brand-aligned minimal styling, statement outerwear or jewelry","expression:confident","detail:strong gaze, premium skin realism, center focal point for campaign cover","imperfection_object:visible pores; slight asymmetry; not overly retouched"), t0: { x: 50, y: 54, w: 34, h: 44, rot: 0 } },
      { id: "graphic_prop", type: "prop", look: "minimal sculptural object or product hint behind the subject", shapeDesc: "secondary brand form for depth", z: 2, notes: notes("detail:keeps the image commercial and modular"), t0: { x: 66, y: 58, w: 14, h: 16, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_social_02",
    mediaMode: "image", aspectRatio: "3:4",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:50mm",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","spec_light:practical_window","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:soft room dust; uneven paper stack; natural material aging"
    ),
    sceneLayers: [
      { id: "lifestyle_hero", type: "character", look: "relatable lifestyle subject in a polished but believable social campaign frame", shapeDesc: "mid-body social cover figure", z: 5, notes: notes("costume:authentic lifestyle styling, premium knitwear or casual tailoring","expression:joyful","detail:warm but premium composition, natural hands, real skin texture","imperfection_object:visible pores; smile lines; slight fabric wear"), t0: { x: 46, y: 56, w: 32, h: 44, rot: 0 } },
      { id: "social_prop_cluster", type: "prop", look: "book stack, ceramic cup, and side table edge as lived-in content cues", shapeDesc: "small content creator prop cluster", z: 3, notes: notes("detail:scroll-stopping but not cluttered"), t0: { x: 70, y: 68, w: 20, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_luxury_brand_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:MS","focal_length:85mm","depth_of_field:shallow",
      "bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light",
      "color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:light airborne dust; non-pristine black plinth; subtle studio surface texture"
    ),
    sceneLayers: [
      { id: "luxury_subject", type: "character", look: "luxury campaign protagonist posed with prestige confidence under controlled studio light", shapeDesc: "center-weighted fashion-commercial subject", z: 5, notes: notes("costume:prestige tailoring, jewelry or couture detail with sharp finish","expression:confident","detail:polished but still human skin, sculptural posture, ad-ready silhouette","imperfection_object:visible pores; natural asymmetry; not overly retouched"), t0: { x: 46, y: 54, w: 28, h: 42, rot: 0 } },
      { id: "luxury_plinth", type: "prop", look: "black lacquer plinth and reflective campaign object or logo form near the subject", shapeDesc: "luxury campaign anchor", z: 3, notes: notes("detail:signals exclusivity and premium staging","imperfection_object:minor scratches; subtle fingerprint trace"), t0: { x: 66, y: 68, w: 16, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_fashion_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:85mm","depth_of_field:shallow",
      "bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light",
      "color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:runway lint; backdrop creases; soft floor wear"
    ),
    sceneLayers: [
      { id: "fashion_model", type: "character", look: "fashion model presenting the season hero garment with magazine-cover authority", shapeDesc: "full-body seasonal campaign subject", z: 6, notes: notes("costume:season collection hero piece with layered fabric language and standout silhouette","expression:confident","detail:garment drape, seam quality, realistic skin texture, shoe styling must read","imperfection_object:visible pores; slight asymmetry; fabric fray; not overly smooth"), t0: { x: 50, y: 54, w: 24, h: 56, rot: 0 } },
      { id: "campaign_prop", type: "prop", look: "minimal studio cube or folded outerwear piece beside the model", shapeDesc: "fashion layout support anchor", z: 2, notes: notes("detail:keeps the frame campaign-ready and editorial"), t0: { x: 68, y: 72, w: 16, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_tech_brand_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:commercial","shot_size:LS","focal_length:35mm","depth_of_field:deep",
      "bg_preset:gradient_black","env_mood:dramatic","key_light_time:studio","color_temp:6500K","color_grade:cool_steel",
      "film_look:digital_clean","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:subtle surface dust; panel edge wear; non-pristine metal reflections"
    ),
    sceneLayers: [
      { id: "tech_device", type: "prop", look: "sleek hero device floating in a dark precision-engineered launch environment", shapeDesc: "central technology product anchor", z: 6, notes: notes("detail:industrial design edges, material contrast, clean logo zone","imperfection_object:minor scratches; subtle fingerprint residue; uneven brushed metal grain"), t0: { x: 50, y: 52, w: 28, h: 20, rot: 0 } },
      { id: "holo_panel", type: "prop", look: "subtle light planes and data-grid reflections behind the device", shapeDesc: "technology staging layer", z: 2, notes: notes("detail:keeps the launch image futuristic but believable"), t0: { x: 50, y: 44, w: 58, h: 24, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_corporate_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:LS","focal_length:35mm","depth_of_field:medium",
      "bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:cool_steel",
      "film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:soft glass smudges; paper stack irregularity; subtle desk wear"
    ),
    sceneLayers: [
      { id: "executive", type: "character", look: "executive lead standing in a clean modern office with credible authority", shapeDesc: "primary corporate figure", z: 5, notes: notes("costume:tailored business attire with texture and realistic crease behavior","expression:confident","detail:approachable authority, real skin, posture clarity","imperfection_object:visible pores; faint under-eye darkness; slight fabric lint"), t0: { x: 42, y: 54, w: 22, h: 42, rot: 0 } },
      { id: "team_hint", type: "character", look: "secondary colleague or blurred support figure deeper in the office", shapeDesc: "small organizational context figure", z: 3, notes: notes("detail:suggests real company environment rather than solo portrait"), t0: { x: 66, y: 52, w: 16, h: 28, rot: 0 } },
      { id: "office_architecture", type: "prop", look: "glass partition, conference table edge, and skyline-reflective window wall", shapeDesc: "corporate architecture anchor", z: 1, notes: notes("detail:modern office proof, not generic white room"), t0: { x: 56, y: 40, w: 60, h: 26, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_film_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","shot_size:LS","focal_length:35mm","cam_movement:crane_up","depth_of_field:deep","bg_preset:outdoor_urban","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:epic_build","visual_tension:high"),
    layerLook: "cinematic scene for film promo",
    layerNotes: notes("costume:character in distinctive role","expression:determined","detail:cinematic scale, crane reveals environment, epic theatrical quality"),
  },
  {
    templateId: "v3_poster_brand_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:MS","focal_length:50mm","cam_movement:slow_push","depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "brand hero product or person",
    layerNotes: notes("costume:premium brand aesthetic","detail:15-second brand message, strong brand identity, memorable visual hook"),
  },
  {
    templateId: "v3_poster_abstract_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:35mm","depth_of_field:medium","bg_preset:abstract","env_mood:mysterious","key_light_time:studio","color_temp:5600K","color_grade:vibrant","film_look:halation","narrative_rhythm:meditative","visual_tension:low"),
    layerLook: "abstract gradient visual composition",
    layerNotes: notes("costume:minimal geometric or organic form","detail:color gradients, light refraction, artistic composition, designed negative space"),
  },
  {
    templateId: "v3_cover_structure_room_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3",
      "media: image",
      "render_style:photorealistic",
      "shot_size:FS",
      "cam_angle:eye_level",
      "focal_length:35mm",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:overcast",
      "color_temp:5600K",
      "spec_light:practical_window",
      "color_grade:warm_golden",
      "film_look:film_grain",
      "director_pack:fincher",
      "narrative_rhythm:meditative",
      "visual_tension:low",
      "post_process:restrained contrast, subtle highlight rolloff",
      "imperfection_scene:subtle dust in air; uneven lighting falloff; natural material aging; non-pristine surfaces; slight environmental messiness"
    ),
    sceneCamera: {
      shot: "wide",
      movement: "static",
    },
    sceneLighting: {
      time: "overcast",
      key_dir: "window_side",
      mood: "quiet realism",
    },
    sceneLayers: [
      {
        id: "layer_desk",
        type: "prop",
        look: "large dark walnut writing desk with visible wood grain and slightly worn edges",
        shapeDesc: "heavy rectangular writing desk occupying the foreground",
        z: 1,
        color: "#7e5a3c",
        notes: notes(
          "role:primary",
          "detail:fine wood texture, edge wear, minor scratches, strong foreground anchor",
          "imperfection_object:surface wear; small dents; realistic usage marks"
        ),
        t0: { x: 50, y: 77, w: 86, h: 36, rot: 0 },
      },
      {
        id: "layer_lamp",
        type: "prop",
        look: "medium brass desk lamp with curved neck and green banker shade",
        shapeDesc: "desk lamp placed on the left front corner of the desk",
        z: 6,
        color: "#c69a47",
        notes: notes(
          "role:secondary",
          "detail:brushed brass texture, warm practical glow, tiny oxidation marks",
          "imperfection_object:minor scratches; imperfect finish"
        ),
        t0: { x: 21, y: 59, w: 16, h: 24, rot: 0 },
      },
      {
        id: "layer_book",
        type: "prop",
        look: "open aged book with thick yellowed pages at the center of the desk",
        shapeDesc: "open antique hardcover book lying flat",
        z: 7,
        color: "#d4b489",
        notes: notes(
          "role:secondary",
          "detail:paper fibers, worn page corners, faded ink, aged binding",
          "imperfection_object:edge wear; natural material aging"
        ),
        t0: { x: 50, y: 72, w: 24, h: 10, rot: 0 },
      },
      {
        id: "layer_ink",
        type: "prop",
        look: "small black glass ink bottle on the right side of the desk",
        shapeDesc: "small square ink bottle with reflective glass surface",
        z: 8,
        color: "#1c1c20",
        notes: notes(
          "role:support",
          "detail:glass reflections, slightly dusty cap, small but clearly readable",
          "imperfection_object:surface inconsistency; small usage marks"
        ),
        t0: { x: 70, y: 70, w: 5, h: 7, rot: 0 },
      },
      {
        id: "layer_quill",
        type: "prop",
        look: "slender feather quill pen beside the ink bottle",
        shapeDesc: "feather pen standing slightly diagonally near the book",
        z: 9,
        color: "#ddd6c8",
        notes: notes(
          "role:support",
          "detail:fine feather strands, dark ink-stained tip, delicate silhouette",
          "imperfection_object:subtle material imperfections"
        ),
        t0: { x: 77, y: 68, w: 8, h: 14, rot: -12 },
      },
      {
        id: "layer_globe",
        type: "prop",
        look: "medium antique globe on a rear-left cabinet",
        shapeDesc: "aged globe with dark stand placed behind the desk on the left",
        z: 3,
        color: "#9b7b47",
        notes: notes(
          "role:support",
          "detail:aged paper map texture, slightly tarnished metal ring",
          "imperfection_object:used texture; minor scratches"
        ),
        t0: { x: 25, y: 34, w: 18, h: 24, rot: 0 },
      },
      {
        id: "layer_chair",
        type: "prop",
        look: "large worn brown leather armchair on the right side of the room",
        shapeDesc: "deep leather armchair in the right rear area",
        z: 2,
        color: "#6f432d",
        notes: notes(
          "role:secondary",
          "detail:creased leather, visible seams, soft sheen, tufted backrest",
          "imperfection_object:surface wear; realistic usage marks; non-pristine object"
        ),
        t0: { x: 82, y: 50, w: 28, h: 32, rot: 0 },
      },
      {
        id: "layer_plant",
        type: "prop",
        look: "small ceramic pot with a slightly uneven green plant on the rear window sill",
        shapeDesc: "small potted plant centered slightly right on the window ledge",
        z: 4,
        color: "#6f8f57",
        notes: notes(
          "role:support",
          "detail:matte ceramic surface, irregular leaves, quiet lived-in accent",
          "imperfection_object:small dents; natural irregularity"
        ),
        t0: { x: 64, y: 30, w: 10, h: 12, rot: 0 },
      },
    ],
  },
  {
    templateId: "v3_cover_structure_people_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3",
      "media: image",
      "render_style:photorealistic",
      "shot_size:FS",
      "cam_angle:eye_level",
      "focal_length:35mm",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:overcast",
      "color_temp:5600K",
      "spec_light:practical_window",
      "color_grade:natural",
      "film_look:film_grain",
      "director_pack:fincher",
      "narrative_rhythm:meditative",
      "visual_tension:low",
      "post_process:restrained contrast, subtle highlight rolloff",
      "imperfection_scene:subtle dust in air; uneven lighting falloff; natural material aging; non-pristine surfaces; slight environmental messiness"
    ),
    sceneCamera: {
      shot: "wide",
      movement: "static",
    },
    sceneLighting: {
      time: "overcast",
      key_dir: "window_side",
      mood: "quiet realism",
    },
    sceneLayers: [
      {
        id: "layer_table",
        type: "prop",
        look: "large dark walnut meeting table with visible wood grain and worn edges",
        shapeDesc: "broad foreground table acting as the spatial anchor of the room",
        z: 1,
        color: "#6f4d34",
        notes: notes(
          "role:primary",
          "detail:fine wood texture, edge wear, minor scratches, strong foreground anchor",
          "imperfection_object:surface wear; small dents; realistic usage marks"
        ),
        t0: { x: 50, y: 83, w: 88, h: 28, rot: 0 },
      },
      {
        id: "layer_person_a",
        type: "character",
        look: "middle-aged man in dark gray suit with distinct cheekbones and composed posture",
        shapeDesc: "foreground left standing figure",
        z: 8,
        color: "#7b8089",
        notes: notes(
          "role:primary",
          "costume:dark gray tailored suit, crisp shirt, understated formal styling",
          "expression:stoic",
          "emotion:restrained authority",
          "detail:visible pores, faint under-eye darkness, natural facial asymmetry",
          "imperfection_object:natural facial asymmetry; visible pores; faint under-eye darkness; not overly retouched"
        ),
        t0: { x: 31, y: 58, w: 18, h: 34, rot: 0 },
      },
      {
        id: "layer_person_b",
        type: "character",
        look: "young woman in dark red long coat facing forward with calm intensity",
        shapeDesc: "foreground right standing figure",
        z: 9,
        color: "#8b453f",
        notes: notes(
          "role:primary",
          "costume:dark red long coat over clean modern clothing",
          "expression:neutral",
          "emotion:quiet confidence",
          "detail:slightly uneven lips, natural freckles, uneven skin texture",
          "imperfection_object:subtle facial imbalance; natural freckles; uneven skin texture; not plastic skin"
        ),
        t0: { x: 69, y: 58, w: 18, h: 34, rot: 0 },
      },
      {
        id: "layer_person_c",
        type: "character",
        look: "tall slim man in black turtleneck with narrow jawline and slight fatigue",
        shapeDesc: "mid-background left standing figure",
        z: 5,
        color: "#383838",
        notes: notes(
          "role:secondary",
          "costume:black turtleneck and dark trousers",
          "expression:neutral",
          "emotion:guarded",
          "detail:slight fatigue, fine facial lines, realistic skin texture",
          "imperfection_object:minor blemishes; faint under-eye darkness; natural age traces"
        ),
        t0: { x: 24, y: 39, w: 12, h: 24, rot: 0 },
      },
      {
        id: "layer_person_d",
        type: "character",
        look: "older woman in deep green shawl with composed expression and visible age lines",
        shapeDesc: "mid-background center standing figure",
        z: 6,
        color: "#55634f",
        notes: notes(
          "role:secondary",
          "costume:deep green shawl over elegant dark clothing",
          "expression:stoic",
          "emotion:calm restraint",
          "detail:fine lines, natural age traces, realistic facial structure",
          "imperfection_object:fine lines; natural age traces; non-perfect face structure"
        ),
        t0: { x: 50, y: 36, w: 12, h: 24, rot: 0 },
      },
      {
        id: "layer_person_e",
        type: "character",
        look: "young man in khaki jacket with short hair and slightly rough skin",
        shapeDesc: "mid-background right standing figure",
        z: 7,
        color: "#8b7a5a",
        notes: notes(
          "role:secondary",
          "costume:khaki jacket over casual inner layer",
          "expression:neutral",
          "emotion:watchful",
          "detail:minor blemishes, slight roughness, short clean hair",
          "imperfection_object:minor blemishes; slight roughness; real human imperfection"
        ),
        t0: { x: 76, y: 39, w: 12, h: 24, rot: 0 },
      },
      {
        id: "layer_window",
        type: "prop",
        look: "tall rear window with thin curtains and soft daylight entering the room",
        shapeDesc: "rear architectural light anchor",
        z: 2,
        color: "#c9c7bc",
        notes: notes(
          "role:support",
          "detail:thin curtains, soft natural light, calm window geometry",
          "imperfection_object:subtle material imperfections; non-pristine surface"
        ),
        t0: { x: 50, y: 22, w: 32, h: 24, rot: 0 },
      },
      {
        id: "layer_lamp",
        type: "prop",
        look: "brass pendant lamp with frosted glass shade hanging in the rear upper area",
        shapeDesc: "rear overhead pendant lamp",
        z: 3,
        color: "#c5a05c",
        notes: notes(
          "role:support",
          "detail:brass frame, frosted glass shade, warm restrained glow",
          "imperfection_object:slight oxidation marks; imperfect finish"
        ),
        t0: { x: 50, y: 8, w: 10, h: 12, rot: 0 },
      },
    ],
  },
  {
    templateId: "v3_cover_structure_outdoor_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3",
      "media: image",
      "render_style:photorealistic",
      "shot_size:FS",
      "cam_angle:eye_level",
      "focal_length:35mm",
      "depth_of_field:deep",
      "bg_preset:outdoor_nature",
      "env_mood:dramatic",
      "key_light_time:overcast",
      "color_temp:5600K",
      "spec_light:volumetric",
      "color_grade:cool_steel",
      "film_look:film_grain",
      "director_pack:fincher",
      "narrative_rhythm:meditative",
      "visual_tension:medium",
      "post_process:restrained contrast, subtle highlight rolloff",
      "imperfection_scene:subtle dust in air; natural shadow variation; worn outdoor surfaces; slight environmental messiness; real-world irregularity"
    ),
    sceneCamera: {
      shot: "wide",
      movement: "static",
    },
    sceneLighting: {
      time: "overcast",
      key_dir: "window_side",
      mood: "quiet realism",
    },
    sceneLayers: [
      {
        id: "layer_man_foreground",
        type: "character",
        look: "weathered middle-aged man standing in the near left foreground",
        shapeDesc: "foreground left adult figure facing camera",
        z: 8,
        color: "#6d7178",
        notes: notes(
          "role:primary",
          "costume:dark wool coat with one frayed cuff, dust on the coat hem, dark leather shoes with scuffed toe caps",
          "expression:stoic",
          "emotion:restrained authority",
          "detail:salt-and-pepper hair at the temples, dark brown eyes, deep-set nasolabial folds, visible pores, faint under-eye darkness",
          "imperfection_object:natural facial asymmetry; visible pores; faint under-eye darkness; fabric edge wear; shoe surface wear"
        ),
        t0: { x: 22, y: 63, w: 18, h: 34, rot: 0 },
      },
      {
        id: "layer_woman_foreground",
        type: "character",
        look: "young woman in the near right foreground facing camera with quiet intensity",
        shapeDesc: "foreground right adult figure facing forward",
        z: 9,
        color: "#7a403d",
        notes: notes(
          "role:primary",
          "costume:dark red long coat with a torn seam near the sleeve, charcoal inner shirt, black boots with dusty soles",
          "expression:neutral",
          "emotion:quiet confidence",
          "detail:light brown eyes, subtle freckles across cheeks, slightly wind-blown hair strands across the cheek, uneven skin texture",
          "imperfection_object:subtle facial imbalance; natural freckles; uneven skin texture; minor fabric damage; dust on boots"
        ),
        t0: { x: 71, y: 64, w: 18, h: 33, rot: 0 },
      },
      {
        id: "layer_man_left_mid",
        type: "character",
        look: "tall slim young man in the mid-left background",
        shapeDesc: "left rear standing figure farther from camera",
        z: 5,
        color: "#37393b",
        notes: notes(
          "role:secondary",
          "costume:black turtleneck under a faded dark coat, mud stains on trouser hem, old dark shoes with cracked leather",
          "expression:neutral",
          "emotion:guarded",
          "detail:narrow jawline, grey-green eyes, left shoulder fabric slightly torn, slight fatigue",
          "imperfection_object:minor blemishes; slight fatigue; fabric fray; cracked shoe leather"
        ),
        t0: { x: 18, y: 41, w: 10, h: 23, rot: 0 },
      },
      {
        id: "layer_old_woman_mid",
        type: "character",
        look: "older woman in the mid-center background with a dark green shawl",
        shapeDesc: "center rear standing figure",
        z: 6,
        color: "#4c5a4d",
        notes: notes(
          "role:secondary",
          "costume:deep green shawl with uneven woven texture, dark skirt with dust near the bottom edge, small worn brown shoes",
          "expression:stoic",
          "emotion:calm restraint",
          "detail:grey hair tucked back, soft hazel eyes, fine forehead lines, natural age traces",
          "imperfection_object:fine lines; natural age traces; non-perfect face structure; uneven textile texture; used footwear"
        ),
        t0: { x: 47, y: 39, w: 10, h: 22, rot: 0 },
      },
      {
        id: "layer_child_mid",
        type: "character",
        look: "small child standing in the mid-right background slightly closer to the woman",
        shapeDesc: "small child figure in right mid-background",
        z: 7,
        color: "#8a7a5f",
        notes: notes(
          "role:secondary",
          "costume:dusty beige jacket with one loose button, short trousers, mismatched socks, worn blue shoes",
          "expression:neutral",
          "emotion:watchful innocence",
          "detail:large dark eyes, round face, real child proportions, uneven clothing fit",
          "imperfection_object:slight redness; uneven clothing fit; dust marks; real child proportions"
        ),
        t0: { x: 65, y: 44, w: 7, h: 15, rot: 0 },
      },
      {
        id: "layer_old_man_far",
        type: "character",
        look: "elderly man farther back near the fence line",
        shapeDesc: "small distant elderly figure near the rear fence",
        z: 4,
        color: "#71634e",
        notes: notes(
          "role:secondary",
          "costume:long faded brown coat with patched elbow, dusty trousers, dark boots with heavy wear",
          "expression:neutral",
          "emotion:weathered patience",
          "detail:thin white beard, cloudy grey eyes, sunken cheeks, natural age traces",
          "imperfection_object:natural age traces; fine lines; patched clothing; heavy usage marks"
        ),
        t0: { x: 80, y: 33, w: 8, h: 18, rot: 0 },
      },
      {
        id: "layer_horse_far",
        type: "animal",
        look: "lean brown horse in the far-right background near the weathered fence",
        shapeDesc: "small distant horse shape near rear-right fence",
        z: 3,
        color: "#7a5b40",
        notes: notes(
          "role:support",
          "detail:dark mane, visible rib contour, mud on lower legs, old leather harness, slightly uneven coat texture, one ear turned back",
          "imperfection_object:used texture; surface wear; natural irregularity; non-pristine animal gear"
        ),
        t0: { x: 88, y: 27, w: 9, h: 11, rot: 0 },
      },
      {
        id: "layer_fence_shelter",
        type: "prop",
        look: "weathered fence and rough wooden shelter structure behind the group",
        shapeDesc: "rear environmental anchor with fence line and wind-worn shelter",
        z: 2,
        color: "#8b7658",
        notes: notes(
          "role:support",
          "detail:aged wood grain, cracked edges, uneven posts, dry rope, dust accumulation",
          "imperfection_object:surface wear; small dents; natural material aging"
        ),
        t0: { x: 50, y: 22, w: 72, h: 18, rot: 0 },
      },
    ],
  },
  {
    templateId: "v3_cover_structure_suite_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3",
      "media: image",
      "render_style:photorealistic",
      "shot_size:FS",
      "cam_angle:eye_level",
      "focal_length:35mm",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:luxurious",
      "key_light_time:night",
      "color_temp:3200K",
      "spec_light:practicals",
      "color_grade:warm_golden",
      "film_look:film_grain",
      "director_pack:fincher",
      "narrative_rhythm:meditative",
      "visual_tension:low",
      "post_process:restrained contrast, subtle highlight rolloff",
      "imperfection_scene:subtle dust in air; uneven lighting falloff; natural material aging; non-pristine surfaces; slight environmental messiness"
    ),
    sceneCamera: {
      shot: "wide",
      movement: "static",
    },
    sceneLighting: {
      time: "night",
      key_dir: "practical_window_mix",
      mood: "controlled luxury realism",
    },
    sceneLayers: [
      {
        id: "layer_woman_a",
        type: "character",
        look: "deep-skinned woman in the near left foreground with short curly hair and a calm commanding presence",
        shapeDesc: "foreground left fashion figure",
        z: 8,
        color: "#6f4d44",
        notes: notes(
          "role:primary",
          "costume:black velvet blazer dress, gold stiletto heels, minimal gold ring",
          "expression:stoic",
          "emotion:quiet control",
          "detail:short curls, defined collarbone, cool-toned makeup, dark brown eyes, slight under-eye shadow, velvet fabric absorbs light richly",
          "imperfection_object:natural facial asymmetry; visible pores; faint under-eye darkness; not overly retouched"
        ),
        t0: { x: 24, y: 63, w: 16, h: 33, rot: 0 },
      },
      {
        id: "layer_woman_b",
        type: "character",
        look: "fair-skinned woman in the near right foreground with long straight black hair and direct eye contact",
        shapeDesc: "foreground right fashion figure",
        z: 9,
        color: "#7d403f",
        notes: notes(
          "role:primary",
          "costume:burgundy satin gown, black pointed heels, thin gold bracelet",
          "expression:neutral",
          "emotion:poised intensity",
          "detail:subtle freckles, slightly uneven lips, straight black hair, pale skin, dark eyes, satin highlights and fine dress folds",
          "imperfection_object:subtle facial imbalance; natural freckles; uneven skin texture; not plastic skin"
        ),
        t0: { x: 73, y: 63, w: 16, h: 33, rot: 0 },
      },
      {
        id: "layer_woman_c",
        type: "character",
        look: "wheat-toned woman in the mid-left background with brown wavy hair and elegant posture",
        shapeDesc: "left rear style figure",
        z: 5,
        color: "#b89578",
        notes: notes(
          "role:secondary",
          "costume:ivory silk set, nude high heels",
          "expression:neutral",
          "emotion:composed elegance",
          "detail:high cheekbones, defined nose bridge, brown eyes, silk wrinkles at the waist and sleeve, warm skin tone",
          "imperfection_object:minor blemishes; subtle texture variation; natural human imperfection"
        ),
        t0: { x: 22, y: 39, w: 11, h: 24, rot: 0 },
      },
      {
        id: "layer_woman_d",
        type: "character",
        look: "cool fair-skinned older woman in the mid-center background with short silver hair",
        shapeDesc: "center rear fashion figure",
        z: 6,
        color: "#66706f",
        notes: notes(
          "role:secondary",
          "costume:deep green off-shoulder evening dress, silver sandals, pearl earrings",
          "expression:stoic",
          "emotion:reserved confidence",
          "detail:visible fine lines, silver short hair, cool grey eyes, clear neck and shoulder line, soft fabric drape",
          "imperfection_object:fine lines; natural age traces; non-perfect face structure"
        ),
        t0: { x: 50, y: 38, w: 11, h: 24, rot: 0 },
      },
      {
        id: "layer_woman_e",
        type: "character",
        look: "warm brown-skinned woman in the mid-right background with a high ponytail and sharp gaze",
        shapeDesc: "right rear tailored figure",
        z: 7,
        color: "#4a5c78",
        notes: notes(
          "role:secondary",
          "costume:deep blue tailored pantsuit, patent ankle boots, slightly worn sleeve cuff",
          "expression:neutral",
          "emotion:watchful confidence",
          "detail:high ponytail, sharp eyes, slight acne marks, clean jawline, crisp tailoring, glossy boot surface",
          "imperfection_object:minor blemishes; slight roughness; sleeve wear; real human imperfection"
        ),
        t0: { x: 78, y: 40, w: 11, h: 24, rot: 0 },
      },
      {
        id: "layer_sofa",
        type: "prop",
        look: "large cream luxury sofa group anchoring the suite interior",
        shapeDesc: "premium sofa set across the rear lower area",
        z: 2,
        color: "#c9c0b4",
        notes: notes(
          "role:support",
          "detail:soft upholstery, plush seat depth, subtle seam lines, premium hotel styling",
          "imperfection_object:subtle material imperfections; non-pristine surface"
        ),
        t0: { x: 50, y: 58, w: 68, h: 20, rot: 0 },
      },
      {
        id: "layer_window_curtain",
        type: "prop",
        look: "tall floor-to-ceiling window with heavy drapes and soft city night glow outside",
        shapeDesc: "luxury suite window and curtain anchor",
        z: 3,
        color: "#d3c8bb",
        notes: notes(
          "role:support",
          "detail:thick drapes, glass reflection, blurred city lights outside, soft vertical geometry",
          "imperfection_object:subtle material imperfections; slight dust in air"
        ),
        t0: { x: 50, y: 20, w: 44, h: 28, rot: 0 },
      },
      {
        id: "layer_side_table_lamp",
        type: "prop",
        look: "black stone side table with crystal wine glasses, champagne bucket, and brass floor lamp",
        shapeDesc: "luxury hospitality detail cluster on one side of the suite",
        z: 4,
        color: "#8d7154",
        notes: notes(
          "role:support",
          "detail:black stone tabletop, crystal glass reflections, metallic bucket sheen, warm brass lamp, luxury suite service detail",
          "imperfection_object:surface wear; imperfect finish; natural material aging"
        ),
        t0: { x: 84, y: 29, w: 18, h: 24, rot: 0 },
      },
    ],
  },
  {
    templateId: "v3_poster_music_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow",
      "bg_preset:studio_dark","env_mood:mysterious","key_light_time:studio","color_temp:3200K","spec_light:neon","color_grade:vibrant",
      "film_look:halation","narrative_rhythm:meditative","visual_tension:low","imperfection_scene:backdrop haze; lens halation dust; soft stage wear"
    ),
    sceneLayers: [
      { id: "album_artist", type: "character", look: "music artist with strong performance attitude and iconic album-cover presence", shapeDesc: "hero portrait for music key art", z: 6, notes: notes("costume:statement outfit with performance edge","expression:confident","emotion:euphoric","detail:graphic contrast, memorable silhouette, artist identity","imperfection_object:skin texture; hair flyaways; fabric wear"), t0: { x: 46, y: 54, w: 30, h: 40, rot: 0 } },
      { id: "music_prop", type: "prop", look: "microphone stand, cable hint, or instrument edge reinforcing music identity", shapeDesc: "secondary music anchor near the artist", z: 3, notes: notes("detail:subtle but readable music context","imperfection_object:metal scuffs; grip wear"), t0: { x: 68, y: 64, w: 12, h: 18, rot: 0 } },
    ],
  },

  // STORY VIDEO
  {
    templateId: "v3_story_drama_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:cinematic_still","shot_size:MS","focal_length:85mm","cam_movement:slow_push",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:dramatic","key_light_time:night",
      "color_temp:3200K","spec_light:practicals","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high",
      "imperfection_scene:glass smudges; slight room disorder; practical light falloff"
    ),
    sceneLayers: [
      { id: "drama_a", type: "character", look: "foreground woman holding back anger during a tense confrontation", shapeDesc: "primary emotional figure", z: 6, notes: notes("costume:contemporary dramatic clothing with slight wear","expression:angry","emotion:tense","detail:wet eyes, real skin texture, tight jaw, hand tension","imperfection_object:visible pores; faint under-eye darkness; fabric wear"), t0: { x: 38, y: 58, w: 22, h: 36, rot: 0 }, t1: { x: 40, y: 58, w: 22, h: 36, rot: 0 } },
      { id: "drama_b", type: "character", look: "opposing figure standing near a doorway in the back-right of frame", shapeDesc: "secondary conflict counterpart", z: 5, notes: notes("costume:dark practical layers","expression:stoic","emotion:guarded","detail:distance keeps tension active, not lost","imperfection_object:natural asymmetry; subtle clothing fatigue"), t0: { x: 72, y: 49, w: 16, h: 30, rot: 0 }, t1: { x: 72, y: 49, w: 16, h: 30, rot: 0 } },
      { id: "door_light", type: "prop", look: "warm practical doorway light and table edge anchoring the scene", shapeDesc: "small interior conflict anchor", z: 2, notes: notes("detail:keeps the frame story-driven rather than generic"), t0: { x: 72, y: 45, w: 24, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_romance_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_movement:slow_push",
      "depth_of_field:very_shallow","bg_preset:outdoor_urban","env_mood:melancholic","key_light_time:golden_hour","color_temp:3200K",
      "color_grade:warm_golden","film_look:halation","narrative_rhythm:slow_burn","visual_tension:low",
      "imperfection_scene:soft wind movement; slight pavement grit; dusk haze"
    ),
    sceneLayers: [
      { id: "farewell_a", type: "character", look: "first partner holding back emotion in a goodbye moment", shapeDesc: "foreground emotional anchor", z: 6, notes: notes("costume:romantic casual outerwear with soft texture","expression:sad","emotion:melancholic","detail:wet eyes, still shoulders, real skin texture","imperfection_object:visible pores; faint under-eye darkness; natural asymmetry"), t0: { x: 42, y: 56, w: 22, h: 36, rot: 0 }, t1: { x: 43, y: 56, w: 22, h: 36, rot: 0 } },
      { id: "farewell_b", type: "character", look: "second partner turned away slightly as if leaving but still emotionally present", shapeDesc: "secondary relationship counterpart", z: 5, notes: notes("costume:contrasting subdued city clothing","expression:sad","emotion:guarded","detail:small distance fuels the emotional narrative","imperfection_object:natural asymmetry; subtle fabric wear"), t0: { x: 64, y: 54, w: 18, h: 32, rot: 0 }, t1: { x: 65, y: 54, w: 18, h: 32, rot: 0 } },
      { id: "departure_anchor", type: "prop", look: "tram stop sign, bench edge, and warm late-sunset street glow behind them", shapeDesc: "farewell location anchor", z: 1, notes: notes("detail:grounds the parting in a specific urban place"), t0: { x: 60, y: 44, w: 34, h: 18, rot: 0 }, t1: { x: 60, y: 44, w: 34, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_suspense_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:filmic","director_pack:fincher","shot_size:MS","focal_length:35mm","cam_movement:slow_push",
      "depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night",
      "color_temp:6500K","spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high",
      "imperfection_scene:paper clutter; glass reflections; low-level room wear"
    ),
    sceneLayers: [
      { id: "detective", type: "character", look: "controlled protagonist realizing a crucial reveal in a green-teal suspense interior", shapeDesc: "primary suspense figure framed mid-shot", z: 6, notes: notes("costume:sharp but slightly tired wardrobe","expression:surprised","emotion:tense","detail:clinical precision, eye focus shift, jaw tension","imperfection_object:visible pores; under-eye detail; natural asymmetry"), t0: { x: 42, y: 56, w: 24, h: 38, rot: 0 }, t1: { x: 44, y: 56, w: 24, h: 38, rot: 0 } },
      { id: "clue_board", type: "prop", look: "document board, taped photos, and desk lamp revealing the hidden clue", shapeDesc: "investigation support anchor", z: 4, notes: notes("detail:story clue must read as meaningful","imperfection_object:torn paper edge; tape residue"), t0: { x: 70, y: 48, w: 26, h: 20, rot: 0 }, t1: { x: 70, y: 48, w: 26, h: 20, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_scifi_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:filmic","shot_size:LS","focal_length:24mm","cam_movement:crane_up",
      "depth_of_field:deep","bg_preset:outdoor_urban","env_mood:mysterious","key_light_time:night",
      "color_temp:8000K","spec_light:neon","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:wet pavement irregularity; drifting haze; worn signage"
    ),
    sceneLayers: [
      { id: "cyber_hero", type: "character", look: "futuristic urban character walking through a cyberpunk night district", shapeDesc: "foreground-to-mid hero figure", z: 5, notes: notes("costume:futuristic urban layers, modular jacket, glowing trim kept restrained","action:walking","detail:wet clothing edge, asymmetrical haircut, determined body line","imperfection_object:minor blemishes; jacket wear; uneven glow accents"), t0: { x: 42, y: 60, w: 18, h: 34, rot: 0 }, t1: { x: 46, y: 60, w: 18, h: 34, rot: 0 } },
      { id: "neon_city", type: "prop", look: "layered neon signage, elevated rail, and wet street reflections", shapeDesc: "dense cyberpunk environment anchor", z: 2, notes: notes("detail:retrofuturist architecture, readable scale, rain-rich texture","imperfection_object:worn signage; uneven pavement reflections"), t0: { x: 56, y: 40, w: 64, h: 34, rot: 0 }, t1: { x: 56, y: 40, w: 64, h: 34, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_nature_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:filmic","director_pack:villeneuve","shot_size:XLS","focal_length:24mm",
      "cam_movement:crane_up","depth_of_field:deep","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour",
      "color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:wind-bent grass; dust veil; uneven rock erosion"
    ),
    sceneLayers: [
      { id: "nature_figure", type: "character", look: "small lone figure standing against an overwhelming natural formation", shapeDesc: "tiny human scale anchor in epic landscape", z: 5, notes: notes("costume:minimal outdoor clothing with practical layers","action:standing","detail:human fragility against environmental scale","imperfection_object:dust on hem; natural posture irregularity"), t0: { x: 48, y: 67, w: 8, h: 16, rot: 0 }, t1: { x: 48, y: 67, w: 8, h: 16, rot: 0 } },
      { id: "terrain_anchor", type: "prop", look: "massive cliff line, wind-swept grass plain, and low cloud layers", shapeDesc: "oppressive nature scale anchor", z: 1, notes: notes("detail:the environment must dominate the frame"), t0: { x: 50, y: 42, w: 90, h: 38, rot: 0 }, t1: { x: 50, y: 42, w: 90, h: 38, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_sport_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:photorealistic","shot_size:MCU","focal_length:85mm","cam_angle:low_angle",
      "cam_movement:tracking","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour",
      "color_temp:3200K","spec_light:golden_hour","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium",
      "imperfection_scene:track dust; sideline debris; sweat mist in sunlight"
    ),
    sceneLayers: [
      { id: "sport_runner", type: "character", look: "athlete at the peak of a race or training sprint in golden backlight", shapeDesc: "dynamic sports hero in motion", z: 6, notes: notes("costume:sport performance gear with visible texture and team color cue","action:running","expression:determined","emotion:euphoric","detail:slow-motion effort, sweat particles, shoe impact, strained muscles","imperfection_object:visible pores; sweat sheen; dust on shoes; minor blemishes"), t0: { x: 42, y: 58, w: 22, h: 38, rot: 0 }, t1: { x: 48, y: 58, w: 22, h: 38, rot: 0 } },
      { id: "sports_context", type: "prop", look: "track lane lines, cones, and blurred stadium or field edge behind the runner", shapeDesc: "sports setting anchor", z: 1, notes: notes("detail:clearly reads as competitive or training context"), t0: { x: 58, y: 68, w: 40, h: 18, rot: 0 }, t1: { x: 58, y: 68, w: 40, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_product_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:50mm","cam_movement:slow_push",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K",
      "color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:countertop marks; soft daylight dust; lived-in room texture"
    ),
    sceneLayers: [
      { id: "user_subject", type: "character", look: "person meaningfully using or holding the product inside a warm lived-in daily setting", shapeDesc: "human emotional anchor for product narrative", z: 6, notes: notes("costume:authentic everyday clothing with believable texture","expression:joyful","emotion:hopeful","detail:real connection between hand, face, and product","imperfection_object:visible pores; fabric wear; natural asymmetry"), t0: { x: 42, y: 56, w: 22, h: 36, rot: 0 }, t1: { x: 43, y: 56, w: 22, h: 36, rot: 0 } },
      { id: "product_story", type: "product", look: "hero product held close enough to remain readable and emotionally important", shapeDesc: "secondary hero object supporting the human story", z: 5, notes: notes("detail:product should feel integrated into life, not placed like a studio ad","imperfection_object:light packaging wear; micro dust"), t0: { x: 56, y: 63, w: 12, h: 16, rot: 0 }, t1: { x: 56, y: 63, w: 12, h: 16, rot: 0 } },
      { id: "life_anchor", type: "prop", look: "kitchen or living-space details such as cup, note, shelf, or soft daylight window edge", shapeDesc: "lifestyle anchor giving the brand story warmth", z: 1, notes: notes("detail:grounds the scene in brand warmth and daily life"), t0: { x: 68, y: 52, w: 26, h: 18, rot: 0 }, t1: { x: 68, y: 52, w: 26, h: 18, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_crime_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:filmic","director_pack:fincher","shot_size:MCU","focal_length:35mm","cam_movement:slow_push",
      "depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night","color_temp:6500K",
      "spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high",
      "imperfection_scene:table scratches; smoke residue; fluorescent falloff"
    ),
    sceneLayers: [
      { id: "crime_subject", type: "character", look: "interrogation-room lead figure in a pressure-filled Fincher-style setup", shapeDesc: "central crime-drama subject framed for psychological tension", z: 6, notes: notes("costume:rumpled detective suit or suspect clothing","action:sitting","expression:determined","emotion:tense","detail:single overhead light, eye pressure, jaw restraint","imperfection_object:visible pores; under-eye fatigue; collar wear"), t0: { x: 44, y: 56, w: 24, h: 38, rot: 0 }, t1: { x: 45, y: 56, w: 24, h: 38, rot: 0 } },
      { id: "interrogation_table", type: "prop", look: "metal table, evidence folder, and hard fluorescent light geometry around the subject", shapeDesc: "interrogation anchor supporting the crime narrative", z: 2, notes: notes("detail:table reflection and evidence presence should be readable","imperfection_object:table scratches; paper wear; fluorescent grime"), t0: { x: 58, y: 66, w: 32, h: 14, rot: 0 }, t1: { x: 58, y: 66, w: 32, h: 14, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_historical_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:filmic","shot_size:LS","focal_length:35mm","cam_angle:low_angle","cam_movement:crane_up",
      "depth_of_field:medium","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K",
      "spec_light:volumetric","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:high",
      "imperfection_scene:flag wear; dust haze; terrain erosion"
    ),
    sceneLayers: [
      { id: "historical_lead", type: "character", look: "historical figure in a ceremonial or battlefield-ready period costume", shapeDesc: "heroic period lead for epic widescreen framing", z: 6, notes: notes("costume:period-accurate layered garment with battle or court detail","expression:determined","emotion:solemn","detail:weight, authority, and human scale inside a grand world","imperfection_object:fabric wear; dust; natural age traces"), t0: { x: 40, y: 60, w: 16, h: 34, rot: 0 }, t1: { x: 41, y: 60, w: 16, h: 34, rot: 0 } },
      { id: "historical_world", type: "prop", look: "banners, fortification, terrain, and distant crowd or architecture establishing the period world", shapeDesc: "epic historical environment anchor", z: 1, notes: notes("detail:must read as historical world-building, not generic landscape","imperfection_object:flag wear; stone erosion; airborne dust"), t0: { x: 62, y: 46, w: 44, h: 30, rot: 0 }, t1: { x: 62, y: 46, w: 44, h: 30, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_documentary_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:documentary","shot_size:MCU","focal_length:85mm","cam_movement:static",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast",
      "color_temp:5600K","color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none",
      "imperfection_scene:quiet room wear; soft dust in light path"
    ),
    sceneLayers: [
      { id: "doc_subject", type: "character", look: "documentary interview subject with grounded everyday presence", shapeDesc: "seated direct-to-camera subject", z: 5, notes: notes("costume:authentic everyday clothing with texture and wear","expression:determined","detail:observational framing, skin realism, lived-in face, direct presence","imperfection_object:visible pores; natural age traces; fabric wear"), t0: { x: 46, y: 55, w: 34, h: 44, rot: 0 } },
      { id: "doc_room", type: "prop", look: "small table, lamp, and household background softly visible", shapeDesc: "domestic documentary anchor", z: 1, notes: notes("detail:authentic, not polished studio"), t0: { x: 64, y: 48, w: 30, h: 20, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_music_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:35mm","cam_movement:orbit","depth_of_field:shallow",
      "bg_preset:studio_dark","env_mood:energetic","key_light_time:night","color_temp:8000K","spec_light:neon","color_grade:vibrant",
      "film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium","imperfection_scene:stage haze; floor scuffs; beam dust"
    ),
    sceneLayers: [
      { id: "mv_performer", type: "character", look: "music performer at the emotional peak of a stage performance", shapeDesc: "full-stage artist hero under live-show lighting", z: 6, notes: notes("costume:performance stage costume with movement","action:reaching_sky","expression:euphoric","emotion:charged","detail:sweat, gesture, breath, spotlight energy","imperfection_object:skin texture; fabric wear; hair flyaways"), t0: { x: 44, y: 58, w: 20, h: 36, rot: 0 }, t1: { x: 48, y: 56, w: 20, h: 36, rot: 0 } },
      { id: "mv_stage", type: "prop", look: "stage riser, light beams, speaker edges, and haze behind the performer", shapeDesc: "concert stage anchor", z: 2, notes: notes("detail:must clearly read as a performance stage, not just a dark studio","imperfection_object:floor scuffs; beam dust; haze irregularity"), t0: { x: 56, y: 64, w: 36, h: 20, rot: 0 }, t1: { x: 56, y: 64, w: 36, h: 20, rot: 0 } },
      { id: "crowd_hint", type: "prop", look: "soft crowd silhouettes or raised hands near the lower frame edge", shapeDesc: "audience energy layer", z: 1, notes: notes("detail:add performance scale without overwhelming the artist"), t0: { x: 50, y: 76, w: 40, h: 10, rot: 0 }, t1: { x: 50, y: 76, w: 40, h: 10, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_music_video_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:outdoor_urban","env_mood:melancholic","key_light_time:night","color_temp:3200K","spec_light:neon","color_grade:warm_golden","film_look:halation","narrative_rhythm:slow_burn","visual_tension:low"),
    layerLook: "artist in narrative music video scene",
    layerNotes: notes("costume:artistic narrative costume","expression:sad","emotion:melancholic","detail:cinematic storytelling, emotional visual poetry, MV aesthetic"),
  },
  {
    templateId: "v3_story_vlog_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:documentary","shot_size:MCU","focal_length:35mm","cam_movement:handheld",
      "depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour",
      "color_temp:3200K","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:none",
      "imperfection_scene:wind movement; light airborne dust; natural uneven ground"
    ),
    sceneLayers: [
      { id: "vlogger", type: "character", look: "travel vlogger in a scenic outdoor location speaking in handheld vertical format", shapeDesc: "on-camera creator subject", z: 5, notes: notes("costume:casual travel clothing, backpack strap, weather-aware styling","expression:joyful","detail:authentic handheld vibe, natural skin, visible environment context","imperfection_object:visible pores; light wind hair flyaways; dust on shoes"), t0: { x: 48, y: 56, w: 34, h: 46, rot: 0 }, t1: { x: 50, y: 56, w: 34, h: 46, rot: 0 } },
      { id: "travel_anchor", type: "prop", look: "landscape overlook, guardrail, and distant mountain or sea horizon", shapeDesc: "travel location proof anchor", z: 1, notes: notes("detail:location beauty must remain visible behind the creator"), t0: { x: 54, y: 42, w: 58, h: 26, rot: 0 }, t1: { x: 54, y: 42, w: 58, h: 26, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_anime_film_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:LS","focal_length:35mm","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:melancholic","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:halation","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "anime-style character in cinematic landscape",
    layerNotes: notes("costume:distinctive anime character design","action:looking","detail:Shinkai-level sky detail, volumetric light, emotional color palette"),
  },
  {
    templateId: "v3_story_short_vertical_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:50mm","cam_movement:static",
      "depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:dramatic","key_light_time:night","color_temp:3200K",
      "color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high",
      "imperfection_scene:room clutter hint; soft practical bloom; uneven shadow corners"
    ),
    sceneLayers: [
      { id: "short_drama_lead", type: "character", look: "vertical short-drama lead at the emotional breaking point", shapeDesc: "mobile-first close emotional anchor", z: 6, notes: notes("costume:dramatic wardrobe with contemporary realism","expression:determined","emotion:tense","detail:tearline, jaw tension, real skin texture, phone-screen readability","imperfection_object:visible pores; under-eye detail; natural asymmetry"), t0: { x: 50, y: 54, w: 36, h: 46, rot: 0 }, t1: { x: 50, y: 54, w: 36, h: 46, rot: 0 } },
      { id: "story_anchor", type: "prop", look: "door frame, sofa edge, or bedside practical light hinting at the off-screen conflict", shapeDesc: "small vertical drama anchor", z: 1, notes: notes("detail:adds story context without distracting from the face"), t0: { x: 66, y: 54, w: 20, h: 18, rot: 0 }, t1: { x: 66, y: 54, w: 20, h: 18, rot: 0 } },
    ],
  },

  // PRO WORKFLOWS
  {
    templateId: "v3_pro_brand_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 30,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:50mm","cam_movement:slow_push","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "brand story protagonist in authentic moment",
    layerNotes: notes("costume:brand-aligned authentic clothing","expression:joyful","detail:emotional narrative beat, product or brand value embodied in scene"),
  },
  {
    templateId: "v3_pro_fashion_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 30,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:85mm","cam_movement:orbit","depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "fashion model as art film subject",
    layerNotes: notes("costume:couture art piece from collection","expression:confident","detail:garment as protagonist, MV visual language, beauty in motion"),
  },
  {
    templateId: "v3_pro_documentary_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes(
      "@compiler: v3","media: video","render_style:documentary","shot_size:MS","focal_length:85mm","cam_movement:static",
      "depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour",
      "color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low",
      "imperfection_scene:wind dust; natural terrain wear; uneven sunlight falloff"
    ),
    sceneLayers: [
      { id: "doc_protagonist", type: "character", look: "observational documentary protagonist in a real outdoor environment", shapeDesc: "waist-up subject with environmental intimacy", z: 5, notes: notes("costume:authentic subject clothing, layered utilitarian outerwear","expression:determined","detail:PBS/BBC level observational realism, skin detail, lived-in clothing","imperfection_object:visible pores; natural age traces; fabric wear; dust on cuffs"), t0: { x: 44, y: 56, w: 28, h: 42, rot: 0 }, t1: { x: 44, y: 56, w: 28, h: 42, rot: 0 } },
      { id: "environment_anchor", type: "prop", look: "weathered field tools, fence line, and horizon atmosphere behind the subject", shapeDesc: "real-world documentary location anchor", z: 1, notes: notes("detail:communicates place and profession without overpowering the person"), t0: { x: 63, y: 46, w: 34, h: 22, rot: 0 }, t1: { x: 63, y: 46, w: 34, h: 22, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_music_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:35mm","cam_movement:orbit","depth_of_field:shallow","bg_preset:studio_dark","env_mood:mysterious","key_light_time:night","color_temp:8000K","spec_light:neon","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium"),
    layerLook: "music artist in creative visual space",
    layerNotes: notes("costume:artist signature visual identity","expression:confident","detail:creative choreography, visual concept driven, award-worthy aesthetics"),
  },
  {
    templateId: "v3_pro_sports_ad_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 30,
    sceneNotes: notes("@compiler: v3","media: video","render_style:photorealistic","shot_size:MCU","focal_length:35mm","cam_angle:low_angle","cam_movement:tracking","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","spec_light:golden_hour","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high"),
    layerLook: "elite athlete at explosive performance peak",
    layerNotes: notes("costume:sport brand gear, iconic colors","action:running","expression:determined","emotion:euphoric","detail:Nike/Adidas level, sweat and power, inspirational energy"),
  },
  {
    templateId: "v3_pro_travel_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:LS","focal_length:24mm","cam_movement:crane_up","depth_of_field:medium","bg_preset:outdoor_nature","env_mood:serene","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "traveler in destination landscape",
    layerNotes: notes("costume:travel casual clothing","expression:joyful","detail:destination beauty central, human presence adds scale, wanderlust feeling"),
  },
  {
    templateId: "v3_pro_food_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:indoor_luxury","env_mood:luxurious","key_light_time:studio","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "fine dining dish or culinary experience",
    layerNotes: notes("costume:impeccably plated dish on premium service","detail:steam rising, ingredient freshness, Michelin-level presentation, appetite appeal"),
  },
  {
    templateId: "v3_pro_real_estate_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:LS","focal_length:24mm","cam_movement:steadicam","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:luxurious","key_light_time:overcast","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "luxury property interior or exterior",
    layerNotes: notes("costume:architectural space in peak condition","detail:sweeping view, architectural lines, natural light, aspirational living"),
  },
  {
    templateId: "v3_pro_tech_launch_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:dramatic","key_light_time:studio","color_temp:6500K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:epic_build","visual_tension:medium"),
    layerLook: "premium tech product launch reveal",
    layerNotes: notes("costume:device with precise engineering detail","detail:Apple keynote level, product floating in darkness, spec details emerge"),
  },
  {
    templateId: "v3_pro_luxury_hotel_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:LS","focal_length:35mm","cam_movement:steadicam","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:luxurious","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "five-star hotel space or experience",
    layerNotes: notes("costume:luxury hospitality environment","detail:white glove service, architectural beauty, quiet opulence, aspirational calm"),
  },
  {
    templateId: "v3_pro_beauty_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "beauty or skincare product with person",
    layerNotes: notes("costume:premium product and aspirational model","detail:skin luminosity, product application or reveal, Chanel/Dior level production"),
  },
  {
    templateId: "v3_pro_kubrick_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","director_pack:kubrick","shot_size:LS","focal_length:24mm","cam_movement:slow_push","depth_of_field:deep","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:studio","color_temp:6500K","color_grade:cool_steel","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:medium"),
    layerLook: "character in Kubrick symmetrical composition",
    layerNotes: notes("costume:precise, period or contemporary","expression:stoic","detail:perfect bilateral symmetry, one-point perspective, cold detached atmosphere"),
  },
  {
    templateId: "v3_pro_villeneuve_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","director_pack:villeneuve","shot_size:XLS","focal_length:24mm","cam_movement:crane_up","depth_of_field:deep","bg_preset:outdoor_nature","env_mood:mysterious","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:meditative","visual_tension:medium"),
    layerLook: "tiny figure against oppressive landscape",
    layerNotes: notes("costume:minimal practical clothing","action:standing","detail:Villeneuve ultra-wide, human dwarfed, existential scale, silence in the composition"),
  },
  {
    templateId: "v3_pro_wes_anderson_01",
    mediaMode: "video", aspectRatio: "4:5", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","director_pack:wes_anderson","shot_size:MS","focal_length:50mm","cam_movement:static","depth_of_field:deep","bg_preset:indoor_luxury","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:pastel","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "character in Wes Anderson symmetrical scene",
    layerNotes: notes("costume:quirky period or retro clothing","expression:neutral","detail:perfect pastel symmetry, deadpan framing, whimsical detail in set design"),
  },
  {
    templateId: "v3_pro_ultrawide_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3","media: image","render_style:filmic","shot_size:LS","focal_length:anamorphic","cam_angle:low_angle",
      "depth_of_field:medium","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour",
      "color_temp:3200K","spec_light:lens_flare","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:epic_build","visual_tension:medium",
      "imperfection_scene:windblown dust; uneven earth; real-world atmospheric particles"
    ),
    sceneLayers: [
      { id: "ultrawide_subject", type: "character", look: "small cinematic protagonist framed against a dramatic expansive environment", shapeDesc: "human figure intentionally dwarfed by space", z: 5, notes: notes("costume:dramatic environment-ready wardrobe, readable silhouette","expression:determined","detail:epic scale, authentic body proportion, premium cinematic blocking","imperfection_object:natural asymmetry; fabric wear; dust on hem"), t0: { x: 36, y: 62, w: 10, h: 24, rot: 0 } },
      { id: "epic_landscape", type: "prop", look: "massive layered landscape with ridge line, sky drama, and atmospheric depth", shapeDesc: "ultra-wide environmental anchor", z: 1, notes: notes("detail:oval bokeh, horizontal flare, true ultrawide storytelling composition"), t0: { x: 56, y: 42, w: 82, h: 34, rot: 0 } },
    ],
  },

  // EXTRA 3
  {
    templateId: "v3_product_compare_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:photorealistic","shot_size:MS","focal_length:85mm","depth_of_field:medium","bg_preset:studio_white","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "two product variants side by side",
    layerNotes: notes("costume:consistent surface treatment on both","detail:equal spacing, same lighting angle, differences clearly visible, detail labels optional"),
  },
  {
    templateId: "v3_portrait_bw_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:dramatic","key_light_time:studio","color_temp:5600K","spec_light:rim_light","color_grade:bw","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low"),
    layerLook: "portrait subject in classic black and white",
    layerNotes: notes("costume:simple clean clothing","expression:neutral","detail:rich tonal range, deep shadows, luminous highlights, timeless quality"),
  },
  {
    templateId: "v3_story_golden_hour_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","shot_size:LS","focal_length:35mm","cam_angle:low_angle","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:serene","key_light_time:golden_hour","color_temp:3200K","spec_light:golden_hour","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "person or subject in golden hour landscape",
    layerNotes: notes("costume:natural outdoor styling","expression:joyful","detail:warm directional light, long shadows, golden atmosphere, cinematic natural beauty"),
  },
  {
    templateId: "v3_daily_product_luxury_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:MCU", "focal_length:macro",
      "depth_of_field:very_shallow",
      "bg_preset:gradient_black",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: subtle dust in air; natural material aging; non-pristine reflective surfaces"
    ),
    layerLook: "premium hero product suspended above a polished obsidian pedestal, surrounded by smoked glass, brushed metal, and liquid gold accents",
    layerShapeDesc: "centered luxury product composition with strong silhouette and multi-surface reflections",
    layerNotes: notes(
      "costume:high-end material finish, polished primary body, mixed metal and glass components",
      "prop:thin reflective ring, acrylic shards, dark velvet base, luxury staging elements",
      "detail:micro edge highlights, controlled reflections, visible surface texture, engraved marks, premium craftsmanship",
      "imperfection_object: tiny fingerprints; minor scratches; imperfect finish on edges; realistic usage marks"
    ),
  },
  {
    templateId: "v3_daily_portrait_premium_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:studio_dark",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K", "spec_light:rim_light",
      "color_grade:natural", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene: subtle dust in air; slight shadow falloff; not overly clean backdrop"
    ),
    layerLook: "premium character portrait with direct gaze, precise tailoring, and high-trust personal branding presence",
    layerShapeDesc: "three-quarter portrait with elegant posture and balanced facial structure",
    layerNotes: notes(
      "costume:tailored outerwear, layered styling, refined accessories, visible fabric weave",
      "expression:confident",
      "emotion:quiet authority",
      "detail:visible pores, realistic skin texture, hair strands, jewelry detail, collar shape, garment seam quality",
      "imperfection_object: natural facial asymmetry; faint under-eye darkness; uneven skin texture; slight fabric creasing"
    ),
  },
  {
    templateId: "v3_daily_cover_hero_01",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:FS", "focal_length:50mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: subtle haze; surface wear; slight environmental messiness; non-pristine urban surfaces"
    ),
    layerLook: "hero character poster composition with a dominant protagonist, layered city atmosphere, and strong title-safe negative space",
    layerShapeDesc: "full-body poster silhouette with dramatic stance and controlled negative space",
    layerNotes: notes(
      "costume:signature outerwear, layered textures, iconic accessory or prop",
      "pose:power_pose",
      "expression:determined",
      "detail:coat texture, hair movement, cinematic backlight, atmospheric depth, readable poster geometry",
      "imperfection_object: visible pores; fabric edge wear; faint scars; slight asymmetry"
    ),
  },
  {
    templateId: "v3_daily_talking_head_01",
    mediaMode: "image", aspectRatio: "9:16",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MCU", "focal_length:50mm",
      "depth_of_field:shallow",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:overcast", "color_temp:5600K",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none",
      "imperfection_scene: small background imperfections; natural shadow variation; not overly clean surfaces"
    ),
    layerLook: "professional spokesperson seated in a premium studio-office environment with direct-to-camera credibility",
    layerShapeDesc: "mid-close vertical talking-head cover frame with clean desk and brand-safe composition",
    layerNotes: notes(
      "costume:polished business-casual wardrobe with neat layering",
      "prop:laptop edge, notebook, glass of water, subtle desk accessories",
      "expression:confident",
      "detail:realistic skin, eye catchlight, fabric texture, tabletop material, clean environment hierarchy",
      "imperfection_object: natural expression lines; slight under-eye darkness; not overly retouched skin; subtle clothing folds"
    ),
  },
  {
    templateId: "v3_daily_story_conflict_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:MS", "focal_length:40mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:high",
      "imperfection_scene: subtle rain residue; worn concrete; slight atmospheric haze; real-world irregularity"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "young woman in a dark coat standing in the near foreground left, wet hair strands, restrained anger, tired but unbroken gaze",
        shapeDesc: "foreground figure with dominant readable face and tense stance",
        z: 10,
        notes: "costume:weathered dark coat, soft inner knit, realistic fabric folds\ndetail:visible pores, damp skin, hair strands, sleeve wear\nimperfection_object: faint under-eye darkness; natural facial asymmetry; fabric edge wear",
        t0: { x: 31, y: 60, w: 24, h: 54, rot: 0 }
      },
      {
        id: "layer2",
        type: "subject",
        look: "shadowed man near a half-open doorway in the mid-right background, holding his ground with cold restraint",
        shapeDesc: "background opposing figure framed by doorway light",
        z: 6,
        notes: "costume:black suit, rain-darkened lapels, muted shirt\ndetail:sharp silhouette, reflective wet floor, doorway tension\nimperfection_object: slight fatigue; minor beard roughness; natural skin texture",
        t0: { x: 73, y: 45, w: 16, h: 36, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "half-open industrial doorway, wet concrete ground, reflected street light, drifting mist and rain residue",
        shapeDesc: "environment anchor defining confrontation space",
        z: 2,
        notes: "detail:door edge, floor reflections, distant practical light, mist depth\nimperfection_object: surface wear; non-pristine urban texture; uneven shadow falloff",
        t0: { x: 55, y: 44, w: 62, h: 48, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_ad_visual_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:LS", "focal_length:50mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:digital_clean",
      "narrative_rhythm:epic_build", "visual_tension:medium",
      "imperfection_scene: subtle particles in air; natural surface wear; non-pristine premium set pieces"
    ),
    layerLook: "campaign hero scene for a premium brand with a dominant core subject, reflective staging, sculptural props, and luxury set geometry",
    layerShapeDesc: "wide hero advertising composition with premium spacing and campaign-level readability",
    layerNotes: notes(
      "costume:hero subject or product with premium finish and precise silhouette",
      "prop:architectural plinths, reflective side elements, soft fabric or smoke layers, branded environment anchors",
      "detail:hard and soft light contrast, material fidelity, edge polish, layered reflections, high-end campaign art direction",
      "imperfection_object: tiny scratches; subtle dust; realistic material inconsistencies; light wear on non-primary set surfaces"
    ),
  },
  {
    templateId: "v3_pro_film_blocking_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "director_pack:fincher",
      "shot_size:LS", "focal_length:35mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:5600K", "spec_light:practicals",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:high",
      "imperfection_scene: natural shadow variation; worn surfaces; light haze; slight environmental messiness"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "lead character seated in the foreground left, composed but burdened, sharply readable face and tailored dark wardrobe",
        shapeDesc: "foreground anchor for emotional perspective",
        z: 10,
        notes: "costume:dark precise tailoring, visible seam work, worn cuff edge\ndetail:visible pores, eye bags, restrained tension\nimperfection_object: natural asymmetry; fabric edge wear; slight fatigue",
        t0: { x: 24, y: 66, w: 18, h: 34, rot: 0 }
      },
      {
        id: "layer2",
        type: "subject",
        look: "second lead standing in the mid-right, cleaner posture, lighter wardrobe contrast, opposing emotional energy",
        shapeDesc: "midground counterweight figure",
        z: 8,
        notes: "costume:long structured coat, visible texture, premium shoes\ndetail:controlled stance, hand posture, garment drape\nimperfection_object: uneven skin texture; slight expression lines; shoe wear",
        t0: { x: 69, y: 53, w: 15, h: 31, rot: 0 }
      },
      {
        id: "layer3",
        type: "subject",
        look: "third figure in the deep background near practical lights, reduced in scale but narratively important",
        shapeDesc: "small rear figure preserving scene depth",
        z: 4,
        notes: "costume:muted clothing, silhouette readable against practical light\ndetail:small but distinct presence\nimperfection_object: slight roughness; worn textile texture",
        t0: { x: 84, y: 37, w: 8, h: 18, rot: 0 }
      },
      {
        id: "layer4",
        type: "support",
        look: "long table and precise room geometry creating strong vanishing lines through the frame",
        shapeDesc: "blocking anchor defining spatial order",
        z: 2,
        notes: "detail:table edge, chair alignment, practical lamps, architectural symmetry\nimperfection_object: scuffed tabletop; non-pristine surfaces; soft dust",
        t0: { x: 50, y: 67, w: 72, h: 28, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_animation_epic_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:LS", "focal_length:anamorphic", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_nature",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:vibrant", "film_look:halation",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: airborne dust; cracked stone surfaces; material wear; uneven glow edges"
    ),
    layerLook: "anime-style hero at the center of an epic final-battle frame, with ceremonial ruins, storm light, and weapon-driven silhouette clarity",
    layerShapeDesc: "heroic wide frame with massive readable silhouette and surrounding fantasy debris",
    layerNotes: notes(
      "costume:signature fantasy coat, layered armor accents, sculpted footwear, glowing weapon core",
      "prop:stone ruins, torn banners, floating talismans, atmospheric particles",
      "detail:high-contrast rim light, color-blocked sky, metal edge wear, cloth tears, weapon surface detail",
      "imperfection_object: blade edge wear; cloth fray; uneven energy glow; cracked material texture"
    ),
  },
  {
    templateId: "v3_pro_game_squad_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:LS", "focal_length:35mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:neon",
      "color_grade:teal_orange", "film_look:anamorphic_flare",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: smoke haze; worn concrete; scattered particles; non-pristine surfaces"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "frontline squad leader in the foreground center with heavy armor layering, weapon holster, faction insignia, and commanding gaze",
        shapeDesc: "largest character silhouette anchoring the lineup",
        z: 10,
        notes: "costume:signature combat gear, layered materials, reinforced boots\ndetail:weapon wear, armor scratches, visible facial structure\nimperfection_object: scuffed armor; skin texture; slight scars",
        t0: { x: 50, y: 62, w: 24, h: 46, rot: 0 }
      },
      {
        id: "layer2",
        type: "subject",
        look: "left flanking sniper-type character with slimmer silhouette, asymmetrical jacket, and high-tech optics",
        shapeDesc: "mid-left supporting squad member",
        z: 8,
        notes: "costume:long tactical coat, strapped accessories, fitted trousers\ndetail:gear layering, optics glow, fabric seam variation\nimperfection_object: textile wear; slight under-eye darkness; gear usage marks",
        t0: { x: 24, y: 56, w: 16, h: 34, rot: 0 }
      },
      {
        id: "layer3",
        type: "subject",
        look: "right flanking heavy unit with bulkier armor, exposed metallic joints, and weighty stance",
        shapeDesc: "mid-right supporting squad member",
        z: 8,
        notes: "costume:thick armor plating, heavy boots, reinforced gloves\ndetail:metal wear, scratches, illuminated tech seams\nimperfection_object: surface dents; imperfect finish; usage marks",
        t0: { x: 76, y: 56, w: 17, h: 35, rot: 0 }
      },
      {
        id: "layer4",
        type: "support",
        look: "faction environment with ruined wall, holographic sign fragments, and battlefield smoke behind the squad",
        shapeDesc: "world-building anchor for the lineup",
        z: 2,
        notes: "detail:ruined architecture, neon fragments, debris, atmospheric haze\nimperfection_object: worn surfaces; irregular dust; damaged structures",
        t0: { x: 50, y: 42, w: 72, h: 44, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_style_fusion_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "director_pack:wong_kar_wai",
      "shot_size:FS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:3200K", "spec_light:neon",
      "color_grade:warm_golden", "film_look:halation",
      "narrative_rhythm:slow_burn", "visual_tension:medium",
      "imperfection_scene: slight haze; surface wear; uneven reflective materials; subtle environmental dust"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "fashion-forward protagonist blending retro tailoring with futuristic material accents, standing in calm defiance",
        shapeDesc: "single editorial figure occupying the lower center of frame",
        z: 10,
        notes: "costume:retro coat shape, metallic fabric inserts, sculptural boots, unexpected accessories\ndetail:face readability, skin texture, layered material contrast\nimperfection_object: natural asymmetry; minor blemishes; garment edge wear",
        t0: { x: 49, y: 60, w: 22, h: 46, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "chrome industrial sculpture and soft velvet drape placed in tension behind the figure",
        shapeDesc: "material clash anchor",
        z: 5,
        notes: "detail:brushed metal, warped reflection, velvet texture, contrasting forms\nimperfection_object: imperfect finish; scratches; textile creases",
        t0: { x: 36, y: 40, w: 28, h: 24, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "minimal brutalist interior plane with warm neon spill and cinematic shadow falloff",
        shapeDesc: "background anchor establishing editorial set mood",
        z: 1,
        notes: "detail:clean geometry, warm reflections, shadow gradients, premium emptiness\nimperfection_object: slight wall wear; subtle dust; non-pristine surface",
        t0: { x: 50, y: 34, w: 74, h: 40, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_animation_anime_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:outdoor_nature",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:5600K",
      "color_grade:vibrant", "film_look:halation",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: uneven painted walls; light atmospheric particles; material wear; not overly clean surfaces"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "anime protagonist in the mid-foreground with expressive eyes, distinctive hair silhouette, and clean story-driven costume design",
        shapeDesc: "mid-shot anime hero anchor",
        z: 10,
        notes: "costume:signature anime outfit, layered jacket, symbolic accessory\ndetail:clear face, readable eyes, cloth folds, weapon or school bag silhouette\nimperfection_object: cloth fray; imperfect edge highlights; subtle asymmetry in hair strands",
        t0: { x: 44, y: 58, w: 22, h: 40, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "layered anime background with city stairs, utility poles, and painted sky gradient",
        shapeDesc: "background environment anchor",
        z: 2,
        notes: "detail:anime cloud shapes, clean perspective lines, poster-ready scene depth\nimperfection_object: cracked wall edge; weathered railing; uneven paint texture",
        t0: { x: 54, y: 41, w: 72, h: 46, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "foreground wind-driven petals, paper fragments, or small debris adding layered motion feel",
        shapeDesc: "foreground depth accent",
        z: 12,
        notes: "detail:small drifting accents, anime compositing feel\nimperfection_object: irregular edge shapes; non-uniform placement",
        t0: { x: 50, y: 64, w: 40, h: 16, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_animation_cg_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MS", "focal_length:35mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_nature",
      "env_mood:serene",
      "key_light_time:golden_hour", "color_temp:5600K", "spec_light:volumetric",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene: light dust in air; realistic ground wear; non-pristine props"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "CG-style animated hero character with oversized readable eyes, soft facial planes, and emotionally expressive body language",
        shapeDesc: "hero character occupying center-left of frame",
        z: 10,
        notes: "costume:stylized layered clothing with high-quality fabric and toy-like readable shape language\ndetail:soft skin shading, hair clumps, visible stitching, shoe sole shape\nimperfection_object: subtle skin texture; cloth creasing; scuffed shoes; tiny scratches on accessories",
        t0: { x: 40, y: 58, w: 24, h: 42, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "CG environment prop cluster with wooden crate, lamp glow, and secondary object or pet companion",
        shapeDesc: "support cluster enriching animated world",
        z: 5,
        notes: "detail:rounded forms, soft reflections, textured surfaces, stylized scale relationships\nimperfection_object: used texture; worn paint; imperfect finish",
        t0: { x: 69, y: 60, w: 22, h: 24, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "warm CG environment backdrop with atmospheric depth, soft bokeh, and storybook lighting",
        shapeDesc: "background world anchor",
        z: 1,
        notes: "detail:clear silhouette layers, cinematic animated backdrop, depth through light and shape\nimperfection_object: slight material aging; small scratches; subtle environmental dust",
        t0: { x: 52, y: 38, w: 78, h: 48, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_game_skill_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:CU", "focal_length:50mm", "cam_angle:low_angle",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:halation",
      "narrative_rhythm:urgent", "visual_tension:high",
      "imperfection_scene: smoke haze; particle residue; cracked surfaces; non-pristine effect edges"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "game hero in near close-up with one arm or weapon driving a visible skill burst outward from the frame center",
        shapeDesc: "foreground combat hero anchor",
        z: 10,
        notes: "costume:combat gear, layered armor or cloth, readable faction details\ndetail:focused face, weapon surface, glove texture, luminous energy interaction\nimperfection_object: armor scratches; weapon wear; skin texture; fabric fray",
        t0: { x: 42, y: 60, w: 22, h: 38, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "explosive skill particles, runic effect shapes, and directional light streaks around the hero",
        shapeDesc: "skill effect anchor",
        z: 12,
        notes: "detail:layered particles, energy bloom, magical or technological effect texture\nimperfection_object: uneven glow edges; irregular particle spacing; imperfect flare falloff",
        t0: { x: 58, y: 52, w: 40, h: 28, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "dark structured background with fractured ground or shadowed architecture behind the effect",
        shapeDesc: "background contrast anchor",
        z: 1,
        notes: "detail:deep dark backdrop, readable environment damage, depth contrast\nimperfection_object: cracked surfaces; dust marks; worn material texture",
        t0: { x: 50, y: 40, w: 76, h: 44, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_game_entrance_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:FS", "focal_length:35mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:rim_light",
      "color_grade:cool_steel", "film_look:anamorphic_flare",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: smoke haze; worn stone; debris; irregular backlight spill"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "hero character entering frame with a low-angle silhouette, long coat or cape, readable weapon, and iconic stance",
        shapeDesc: "full-body hero entrance anchor",
        z: 10,
        notes: "costume:signature hero outfit, armor accents, layered boots, high-recognition silhouette\ndetail:weapon edge, cape fold, facial shape, stance control\nimperfection_object: fabric damage; armor wear; dirt on boots; slight scars",
        t0: { x: 48, y: 58, w: 23, h: 46, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "smoke and environmental depth behind the hero, with ruined architecture or faction backdrop",
        shapeDesc: "environmental support anchor",
        z: 4,
        notes: "detail:smoke layers, architectural silhouette, backlit depth, cinematic staging\nimperfection_object: broken edges; debris; non-pristine stone texture",
        t0: { x: 50, y: 42, w: 74, h: 42, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "light bloom, dust, and atmosphere accent around the hero entrance path",
        shapeDesc: "dramatic entrance accent",
        z: 12,
        notes: "detail:backlight flare, dust rays, glowing particles\nimperfection_object: uneven glow; irregular particle density",
        t0: { x: 50, y: 54, w: 46, h: 24, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_style_surreal_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:gradient_black",
      "env_mood:mysterious",
      "key_light_time:studio", "color_temp:6500K", "spec_light:neon",
      "color_grade:vibrant", "film_look:halation",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: irregular texture planes; surreal dust; non-pristine abstract surfaces"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "surreal central figure or object floating within an abstract art space, with impossible scale relationships",
        shapeDesc: "main surreal anchor in the lower center",
        z: 10,
        notes: "costume:editorial or sculptural styling, unusual proportion cues\ndetail:face or object readability preserved amid abstraction\nimperfection_object: cracked finish; asymmetry; texture variation; imperfect edges",
        t0: { x: 50, y: 58, w: 22, h: 42, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "floating geometric masses, suspended frames, or cut-out architecture around the subject",
        shapeDesc: "abstract support system",
        z: 6,
        notes: "detail:clean but impossible spatial arrangement, graphic silhouettes, art-poster readability\nimperfection_object: uneven finish; subtle material wear; non-perfect symmetry",
        t0: { x: 46, y: 38, w: 52, h: 28, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "unreal lighting gradient and non-natural shadow plane extending behind the subject",
        shapeDesc: "abstract light anchor",
        z: 1,
        notes: "detail:unphysical glow, color plane clash, surreal atmosphere\nimperfection_object: irregular glow falloff; dusty surface; abstract texture noise",
        t0: { x: 50, y: 34, w: 78, h: 46, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_pro_style_future_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:LS", "focal_length:35mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:8000K", "spec_light:neon",
      "color_grade:cool_steel", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: panel scratches; cold condensation; uneven light spill; used industrial surfaces"
    ),
    sceneLayers: [
      {
        id: "layer1",
        type: "subject",
        look: "futuristic central figure or device placed inside a symmetrical tech chamber with precise composition",
        shapeDesc: "center-weighted tech hero anchor",
        z: 10,
        notes: "costume:clean techwear or premium industrial shell, controlled silhouette\ndetail:panel lines, reflective surfaces, readable central form\nimperfection_object: panel scratches; imperfect finish; slight wear; subtle dust",
        t0: { x: 50, y: 58, w: 20, h: 40, rot: 0 }
      },
      {
        id: "layer2",
        type: "support",
        look: "symmetrical light bars, transparent screens, and cold industrial architecture surrounding the center",
        shapeDesc: "symmetry-defining support structure",
        z: 4,
        notes: "detail:cool reflections, translucent panels, clean geometry, futuristic depth\nimperfection_object: uneven light distribution; minor surface wear; non-pristine edges",
        t0: { x: 50, y: 40, w: 78, h: 44, rot: 0 }
      },
      {
        id: "layer3",
        type: "support",
        look: "floor reflections and atmospheric particles reinforcing the chamber scale",
        shapeDesc: "floor and atmosphere anchor",
        z: 1,
        notes: "detail:reflective floor, condensation haze, subtle volumetric light\nimperfection_object: smudged reflection; particle dust; cold moisture marks",
        t0: { x: 50, y: 68, w: 76, h: 18, rot: 0 }
      }
    ],
  },
  {
    templateId: "v3_product_hero_21",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:CU", "focal_length:70mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:gradient_black",
      "env_mood:dramatic",
      "key_light_time:studio", "color_temp:6500K", "spec_light:rim_light",
      "color_grade:cool_steel", "film_look:digital_clean",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: subtle floating dust; slight reflective noise; non-pristine premium surfaces"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "hero product floating at center with premium silhouette, precise branding face, and strong futuristic presence", shapeDesc: "dominant central floating product", z: 10, notes: "detail:edge polish, material fidelity, engraved micro details, precision seams\nimperfection_object: tiny scratches; subtle fingerprints; imperfect micro reflections", t0: { x: 50, y: 51, w: 24, h: 30, rot: 0 } },
      { id: "layer2", type: "support", look: "bottom light platform and thin luminous base shaping the float effect beneath the product", shapeDesc: "light anchor under product", z: 4, notes: "detail:soft underglow, reflected light bloom, premium stage geometry\nimperfection_object: slight light spill variation; faint surface dust", t0: { x: 50, y: 68, w: 36, h: 12, rot: 0 } },
      { id: "layer3", type: "support", look: "dark sculptural side panels and suspended micro particles framing the product without stealing focus", shapeDesc: "left-right premium framing system", z: 2, notes: "detail:controlled reflections, atmospheric particles, clean spacing\nimperfection_object: uneven edge highlights; non-pristine panel finish", t0: { x: 50, y: 48, w: 78, h: 46, rot: 0 } },
    ],
  },
  {
    templateId: "v3_product_lifestyle_22",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:CU", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:day", "color_temp:5600K", "spec_light:natural_window",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene: natural dust in air; soft lived-in textures; subtle surface wear"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "real hand holding the product close to camera in a believable daily-use pose", shapeDesc: "hand plus product conversion anchor", z: 10, notes: "detail:skin texture, natural nails, knuckle tone variation, realistic grip pressure\nimperfection_object: visible pores; slight dryness; minor skin redness; tiny fingerprints on product", t0: { x: 48, y: 58, w: 34, h: 34, rot: -8 } },
      { id: "layer2", type: "support", look: "lifestyle background cue such as tabletop, notebook, cup, or sofa arm that proves real usage context", shapeDesc: "conversion support environment", z: 3, notes: "detail:soft domestic textures, practical object evidence, believable distance blur\nimperfection_object: subtle scratches; cloth creases; non-pristine objects", t0: { x: 54, y: 66, w: 62, h: 24, rot: 0 } },
      { id: "layer3", type: "support", look: "window daylight or natural side light shaping the hand and product edges", shapeDesc: "soft natural light direction anchor", z: 1, notes: "detail:gentle highlight rolloff, realistic shadow transition\nimperfection_object: slight uneven light falloff; atmospheric dust", t0: { x: 50, y: 42, w: 80, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_cinematic_23",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:85mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:gradient_white",
      "env_mood:mysterious",
      "key_light_time:backlight", "color_temp:6500K", "spec_light:rim_light",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:medium",
      "imperfection_scene: slight haze; imperfect glow edges; non-pristine backdrop finish"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "single person in strong backlight with a readable silhouette edge and restrained fashion styling", shapeDesc: "backlit figure dominating center frame", z: 10, notes: "costume:clean long outerwear, subtle texture, premium shoes\ndetail:contour face line, hair edge separation, posture clarity\nimperfection_object: natural asymmetry; visible pores; slight under-eye darkness; fabric edge wear", t0: { x: 50, y: 58, w: 24, h: 48, rot: 0 } },
      { id: "layer2", type: "support", look: "glow-heavy rear light plane creating a halo and silhouette separation behind the figure", shapeDesc: "backlight wall anchor", z: 2, notes: "detail:light bloom, contour contrast, gradient falloff\nimperfection_object: uneven flare edge; dusty glow plane", t0: { x: 50, y: 42, w: 74, h: 40, rot: 0 } },
      { id: "layer3", type: "support", look: "minimal side haze and fine atmospheric particles deepening the mood without clutter", shapeDesc: "subtle atmosphere support", z: 1, notes: "detail:soft haze, cinematic cleanliness\nimperfection_object: irregular particle density; slight environmental dust", t0: { x: 50, y: 40, w: 78, h: 44, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_lifestyle_24",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:35mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:day", "color_temp:5600K", "spec_light:natural_window",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:urgent", "visual_tension:medium",
      "imperfection_scene: street dust; uneven wall textures; non-pristine city surfaces"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "street-fashion figure caught mid-turn with strong styling and dynamic real-world posture", shapeDesc: "foreground fashion subject with motion implication", z: 10, notes: "costume:layered streetwear, premium shoes, statement accessory\ndetail:hair movement, gaze direction, fabric layering, face readability\nimperfection_object: natural skin texture; slight asymmetry; textile wear; dusty shoe edges", t0: { x: 49, y: 58, w: 22, h: 46, rot: 0 } },
      { id: "layer2", type: "support", look: "urban sidewalk, storefront edge, or parked vehicle creating a believable street-fashion context", shapeDesc: "street anchor", z: 3, notes: "detail:concrete, signage blur, hard urban lines\nimperfection_object: worn paint; small dents; real street grime", t0: { x: 52, y: 68, w: 76, h: 20, rot: 0 } },
      { id: "layer3", type: "support", look: "high-contrast natural city light and reflected highlights shaping the fashion figure", shapeDesc: "urban light anchor", z: 1, notes: "detail:reflected contrast, edge separation, documentary realism\nimperfection_object: slight uneven light falloff; airborne particles", t0: { x: 50, y: 42, w: 78, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_movie_25",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:ECU", "focal_length:100mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:gradient_black",
      "env_mood:dramatic",
      "key_light_time:studio", "color_temp:6500K", "spec_light:hard_key",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:urgent", "visual_tension:high",
      "imperfection_scene: light haze; imperfect dark plane; subtle dust"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "extreme facial close-up or object close-up dominating the poster with intense emotional pressure", shapeDesc: "extreme close anchor", z: 10, notes: "detail:eyes, skin, pores, lashes, or hard-surface micro details made highly readable\nimperfection_object: skin texture; fine lines; tiny scratches; non-perfect symmetry", t0: { x: 50, y: 46, w: 42, h: 42, rot: 0 } },
      { id: "layer2", type: "support", look: "minimal negative space plane reserved for typography and poster breathing room", shapeDesc: "poster spacing anchor", z: 1, notes: "detail:clean emptiness, strong contrast field\nimperfection_object: subtle gradient noise; imperfect shadow falloff", t0: { x: 50, y: 76, w: 70, h: 28, rot: 0 } },
    ],
  },
  {
    templateId: "v3_poster_brand_26",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:graphic",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:gradient_white",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K",
      "color_grade:vibrant", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene: slight paper texture; non-perfect geometric edges"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "central subject framed by bold color blocks and clean geometric shapes", shapeDesc: "centered design-led poster anchor", z: 10, notes: "detail:clear silhouette, graphic readability, premium form separation\nimperfection_object: slight material variation; tiny edge wear", t0: { x: 50, y: 56, w: 22, h: 40, rot: 0 } },
      { id: "layer2", type: "support", look: "large geometric color planes surrounding the subject with clean visual hierarchy", shapeDesc: "color block structure", z: 2, notes: "detail:poster geometry, hard edges, strong design rhythm\nimperfection_object: imperfect borders; paper-like texture variation", t0: { x: 50, y: 48, w: 78, h: 56, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_video_27",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:balanced",
      "key_light_time:studio", "color_temp:5600K", "spec_light:three_point",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:steady", "visual_tension:low",
      "imperfection_scene: subtle office wear; light dust; lived-in surfaces"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "professional speaker centered in a clean office environment with trustworthy expression and open body language", shapeDesc: "talking-head hero anchor", z: 10, notes: "costume:tailored blazer or smart office attire\ndetail:skin texture, eye contact, natural posture, microphone or notebook cue\nimperfection_object: visible pores; slight under-eye detail; fabric creases", t0: { x: 48, y: 58, w: 20, h: 38, rot: 0 } },
      { id: "layer2", type: "support", look: "desk edge, laptop, notebook, or glass water prop creating a credible explainer setting", shapeDesc: "office credibility anchor", z: 4, notes: "detail:workspace evidence, practical office rhythm\nimperfection_object: minor scratches; used desk surface; natural object wear", t0: { x: 50, y: 70, w: 52, h: 18, rot: 0 } },
      { id: "layer3", type: "support", look: "soft office background with practical lights and neutral architectural lines", shapeDesc: "professional space anchor", z: 1, notes: "detail:controlled depth, tasteful office styling\nimperfection_object: subtle shadow variation; non-pristine surfaces", t0: { x: 50, y: 42, w: 78, h: 44, rot: 0 } },
    ],
  },
  {
    templateId: "v3_portrait_video_28",
    mediaMode: "image", aspectRatio: "9:16",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:photorealistic",
      "shot_size:MS", "focal_length:35mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:day", "color_temp:5600K", "spec_light:natural_window",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:breathing", "visual_tension:low",
      "imperfection_scene: soft lived-in clutter; natural light falloff; subtle air particles"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "creator figure in a natural daily setting with easy expression and intimate vertical framing", shapeDesc: "vertical vlog subject anchor", z: 10, notes: "costume:casual daily outfit, layered homewear, simple accessories\ndetail:skin realism, friendly eye line, natural hair, handheld intimacy\nimperfection_object: slight redness; under-eye detail; garment wrinkles", t0: { x: 50, y: 56, w: 22, h: 42, rot: 0 } },
      { id: "layer2", type: "support", look: "soft lifestyle objects such as mug, plant, book, or window curtain proving lived-in daily context", shapeDesc: "daily-life prop anchor", z: 3, notes: "detail:domestic textures, personal space evidence\nimperfection_object: small dents; cloth creases; non-pristine objects", t0: { x: 50, y: 72, w: 56, h: 18, rot: 0 } },
      { id: "layer3", type: "support", look: "slightly handheld-feeling space composition with natural side light", shapeDesc: "vlog realism anchor", z: 1, notes: "detail:gentle perspective, organic depth, comfortable vertical balance\nimperfection_object: uneven light rolloff; soft dust in air", t0: { x: 50, y: 42, w: 78, h: 46, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_drama_29",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:MCU", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:blue_hour", "color_temp:5600K", "spec_light:rim_light",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:urgent", "visual_tension:high",
      "imperfection_scene: drifting particles; non-pristine walls; subtle haze"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "main character captured at the exact instant of turning back with sharp emotional charge", shapeDesc: "turn-back motion freeze", z: 10, notes: "costume:story-ready outerwear, layered collar, practical styling\ndetail:face tension, eye shift, hair movement, shoulder twist\nimperfection_object: skin texture; slight fatigue; textile wear", t0: { x: 46, y: 56, w: 24, h: 38, rot: 0 } },
      { id: "layer2", type: "support", look: "background clue such as doorway, alley edge, or blurred second figure intensifying the turn-back reason", shapeDesc: "dramatic trigger anchor", z: 3, notes: "detail:narrative cue, spatial implication, emotional contrast\nimperfection_object: worn surfaces; soft grime; light haze", t0: { x: 68, y: 48, w: 28, h: 28, rot: 0 } },
    ],
  },
  {
    templateId: "v3_story_drama_30",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "director_pack:fincher",
      "shot_size:MS", "focal_length:40mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:5600K", "spec_light:practicals",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:high",
      "imperfection_scene: natural shadow variation; non-pristine surfaces; slight room haze"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "left character standing still in a contained but dangerous posture", shapeDesc: "left side standoff anchor", z: 10, notes: "costume:structured coat, controlled silhouette\ndetail:face readability, restrained hands, tension through stillness\nimperfection_object: skin texture; expression lines; cloth wear", t0: { x: 30, y: 58, w: 16, h: 36, rot: 0 } },
      { id: "layer2", type: "subject", look: "right character holding equal frame weight with opposing emotional energy", shapeDesc: "right side standoff anchor", z: 10, notes: "costume:contrasting wardrobe tone, sharp profile\ndetail:posture lock, eye line tension, controlled balance\nimperfection_object: uneven skin texture; garment edge wear; slight fatigue", t0: { x: 70, y: 58, w: 16, h: 36, rot: 0 } },
      { id: "layer3", type: "support", look: "cold-warm divided space between the two characters emphasizing the confrontation gap", shapeDesc: "conflict space anchor", z: 1, notes: "detail:light split, empty distance, balanced geometry\nimperfection_object: worn surfaces; subtle environmental dust", t0: { x: 50, y: 52, w: 76, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_ad_visual_31",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:ECU", "focal_length:100mm_macro", "cam_angle:eye_level",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:6500K", "spec_light:hard_key",
      "color_grade:cool_steel", "film_look:digital_clean",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: spray residue; reflective imperfections; non-pristine liquid edges"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "primary liquid form or water drop suspended in a polished macro frame with razor-sharp clarity", shapeDesc: "macro liquid hero", z: 10, notes: "detail:surface tension, reflections, refractions, premium liquid texture\nimperfection_object: uneven droplet edge; tiny bubbles; realistic residue", t0: { x: 50, y: 52, w: 22, h: 24, rot: 0 } },
      { id: "layer2", type: "support", look: "secondary product or contact surface interacting with the drop in a controlled black-stage environment", shapeDesc: "product interaction anchor", z: 6, notes: "detail:wet highlights, hard reflections, luxury finish\nimperfection_object: micro scratches; fingerprints; slight condensation marks", t0: { x: 58, y: 60, w: 26, h: 18, rot: 0 } },
      { id: "layer3", type: "support", look: "dark glossy background plane with high-contrast specular streaks", shapeDesc: "macro ad contrast field", z: 1, notes: "detail:premium emptiness, reflective depth, dramatic black field\nimperfection_object: dust specks; imperfect highlight rolloff", t0: { x: 50, y: 48, w: 78, h: 36, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_ad_visual_32",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:commercial",
      "shot_size:LS", "focal_length:35mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:day", "color_temp:8000K", "spec_light:soft_top",
      "color_grade:cool_steel", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: subtle concrete wear; glass smudges; non-pristine architectural surfaces"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "premium product centered within a minimal architectural interior with strong brand restraint", shapeDesc: "symmetrical product hero", z: 10, notes: "detail:clean silhouette, material richness, premium edge control\nimperfection_object: tiny scratches; subtle dust; non-perfect finish", t0: { x: 50, y: 58, w: 20, h: 28, rot: 0 } },
      { id: "layer2", type: "support", look: "architectural plinths, wall planes, or steps creating a luxurious minimal space around the product", shapeDesc: "architectural support system", z: 2, notes: "detail:clean geometry, reflective floor, restrained emptiness\nimperfection_object: concrete pores; scuffed floor; soft smudges", t0: { x: 50, y: 62, w: 72, h: 30, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_film_blocking_33",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:5600K", "spec_light:practicals",
      "color_grade:cool_steel", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:high",
      "imperfection_scene: rain haze; wet surfaces; non-pristine street textures"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "rain-soaked person in the mid-foreground under streetlight with emotionally charged stillness", shapeDesc: "rain character anchor", z: 10, notes: "costume:wet coat, layered clothing, realistic folds\ndetail:damp skin, hair strands, reflective rain texture\nimperfection_object: visible pores; wet fabric wear; slight fatigue", t0: { x: 46, y: 58, w: 20, h: 38, rot: 0 } },
      { id: "layer2", type: "support", look: "streetlight pool, wet pavement reflections, and distant practicals building cinematic rain depth", shapeDesc: "rain environment anchor", z: 1, notes: "detail:reflections, rain streaks, urban night spacing\nimperfection_object: uneven puddle surfaces; worn pavement; drifting mist", t0: { x: 52, y: 56, w: 78, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_film_blocking_34",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:LS", "focal_length:24mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:outdoor_nature",
      "env_mood:serene",
      "key_light_time:day", "color_temp:5600K",
      "color_grade:desaturated", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:low",
      "imperfection_scene: wind dust; worn terrain; non-pristine horizon haze"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "small lone figure far from camera inside a vast open space", shapeDesc: "tiny lonely figure", z: 8, notes: "detail:clear silhouette despite small scale, isolated stance\nimperfection_object: cloth wear; subtle human irregularity", t0: { x: 50, y: 60, w: 5, h: 14, rot: 0 } },
      { id: "layer2", type: "support", look: "large environmental planes such as road, shoreline, desert, or empty field overwhelming the frame", shapeDesc: "space-dominant loneliness anchor", z: 1, notes: "detail:negative space, horizon, subtle weather texture\nimperfection_object: uneven terrain; natural surface wear; haze", t0: { x: 50, y: 56, w: 82, h: 44, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_animation_epic_35",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MS", "focal_length:anamorphic", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_nature",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:6500K", "spec_light:rim_light",
      "color_grade:vibrant", "film_look:halation",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: floating dust; cracked surfaces; uneven glow edges"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "anime battle hero in a poised pre-attack stance with low-angle power and readable weapon silhouette", shapeDesc: "battle-ready hero anchor", z: 10, notes: "costume:signature battle outfit, layered armor accents, dramatic boots\ndetail:hair silhouette, weapon edge, cloth tension, aggressive posture\nimperfection_object: cloth fray; blade wear; asymmetrical strands; cracked surface accents", t0: { x: 48, y: 58, w: 24, h: 44, rot: 0 } },
      { id: "layer2", type: "support", look: "charged anime environment with wind streaks, broken ground, or symbolic backdrop shape", shapeDesc: "combat environment anchor", z: 2, notes: "detail:dynamic backdrop, dramatic perspective, battle mood\nimperfection_object: cracked stone; dust particles; uneven energy glow", t0: { x: 50, y: 48, w: 76, h: 40, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_animation_anime_36",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:day", "color_temp:5600K", "spec_light:soft_top",
      "color_grade:vibrant", "film_look:halation",
      "narrative_rhythm:breathing", "visual_tension:low",
      "imperfection_scene: cozy clutter; uneven fabric texture; warm particles"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "cute anime character in a warm daily-life setting with soft expression and charming silhouette", shapeDesc: "cute daily hero anchor", z: 10, notes: "costume:cozy daily outfit, rounded shape language, playful accessory\ndetail:large expressive eyes, soft hair, clear gestures\nimperfection_object: cloth creases; non-uniform highlights; asymmetrical strands", t0: { x: 48, y: 58, w: 22, h: 40, rot: 0 } },
      { id: "layer2", type: "support", look: "cozy room props such as lamp, mug, blanket, or pet accessory supporting the warm daily scene", shapeDesc: "cute-life prop cluster", z: 3, notes: "detail:soft object silhouettes, warm domestic rhythm\nimperfection_object: small dents; textile folds; non-pristine objects", t0: { x: 66, y: 66, w: 26, h: 18, rot: 0 } },
      { id: "layer3", type: "support", look: "gentle indoor environment with warm light and inviting background depth", shapeDesc: "cozy room anchor", z: 1, notes: "detail:comforting atmosphere, animation-friendly room depth\nimperfection_object: uneven wall paint; dust motes; soft clutter", t0: { x: 50, y: 44, w: 76, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_game_skill_37",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:CU", "focal_length:50mm", "cam_angle:low_angle",
      "depth_of_field:shallow",
      "bg_preset:studio_dark",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:6500K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:halation",
      "narrative_rhythm:urgent", "visual_tension:high",
      "imperfection_scene: particle residue; cracked floor; non-pristine effect layers"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "game hero unleashing a powerful skill from the center of frame with explosive body language", shapeDesc: "skill-release hero", z: 10, notes: "costume:combat gear, gloves, weapon accents, readable role silhouette\ndetail:face intensity, pose energy, weapon interaction\nimperfection_object: armor scratches; cloth wear; skin texture", t0: { x: 45, y: 58, w: 22, h: 40, rot: 0 } },
      { id: "layer2", type: "support", look: "violent particle burst, runic energy, or shockwave effects radiating around the hero", shapeDesc: "explosion effect anchor", z: 12, notes: "detail:layered particles, energy trails, impact clarity\nimperfection_object: uneven glow edges; irregular particle spacing", t0: { x: 56, y: 52, w: 42, h: 30, rot: 0 } },
      { id: "layer3", type: "support", look: "dark ruined background with clear contrast and impact damage cues", shapeDesc: "damage contrast field", z: 1, notes: "detail:fractures, smoke, dark structural depth\nimperfection_object: dust residue; broken edges; worn surfaces", t0: { x: 50, y: 42, w: 78, h: 42, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_game_entrance_38",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:FS", "focal_length:28mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:mysterious",
      "key_light_time:night", "color_temp:6500K", "spec_light:rim_light",
      "color_grade:cool_steel", "film_look:anamorphic_flare",
      "narrative_rhythm:epic_build", "visual_tension:high",
      "imperfection_scene: smoke haze; debris; worn architecture; uneven backlight spill"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "towering boss figure seen from a low angle with crushing dominance and iconic silhouette", shapeDesc: "boss intimidation anchor", z: 10, notes: "costume:heavy armor, monstrous plating, oversized accessories or weapon\ndetail:threatening stance, readable face or helmet, silhouette dominance\nimperfection_object: armor dents; rough textures; scars; dirt on boots", t0: { x: 52, y: 54, w: 28, h: 50, rot: 0 } },
      { id: "layer2", type: "support", look: "massive environment scale such as ruined hall, throne space, or giant doorway behind the boss", shapeDesc: "boss scale anchor", z: 2, notes: "detail:vast depth, oppressive architecture, scale cues\nimperfection_object: broken stone; ash; worn structures", t0: { x: 50, y: 42, w: 80, h: 44, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_style_surreal_39",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:FS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:deep",
      "bg_preset:gradient_white",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:medium",
      "imperfection_scene: mirrored dust; imperfect symmetry; subtle texture noise"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "central subject or object placed in perfect near-mirror symmetry with a surreal calm", shapeDesc: "centered mirror-world anchor", z: 10, notes: "detail:clear symmetry read, calm posture, art-poster control\nimperfection_object: slight asymmetry; cracked finish; texture variation", t0: { x: 50, y: 56, w: 20, h: 40, rot: 0 } },
      { id: "layer2", type: "support", look: "duplicated architectural or object forms mirrored left and right around the center axis", shapeDesc: "mirror structure system", z: 2, notes: "detail:aligned duplicates, graphic readability, spatial ritual\nimperfection_object: non-perfect symmetry; uneven surface wear", t0: { x: 50, y: 46, w: 76, h: 44, rot: 0 } },
    ],
  },
  {
    templateId: "v3_pro_style_fusion_40",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MS", "focal_length:50mm", "cam_angle:eye_level",
      "depth_of_field:medium",
      "bg_preset:indoor_luxury",
      "env_mood:mysterious",
      "key_light_time:studio", "color_temp:6500K", "spec_light:hard_key",
      "color_grade:cool_steel", "film_look:halation",
      "narrative_rhythm:frozen", "visual_tension:high",
      "imperfection_scene: suspended dust; broken edges; imperfect frozen fragments"
    ),
    sceneLayers: [
      { id: "layer1", type: "subject", look: "central figure or object caught at the exact instant of time freezing inside a high-contrast scene", shapeDesc: "time-freeze hero anchor", z: 10, notes: "detail:readable frozen gesture, fabric shape, face intensity, suspended motion\nimperfection_object: skin texture; cloth wear; asymmetrical detail; tiny cracks", t0: { x: 48, y: 58, w: 22, h: 40, rot: 0 } },
      { id: "layer2", type: "support", look: "frozen debris, liquid fragments, paper, or dust suspended around the subject in mid-action", shapeDesc: "suspension support field", z: 12, notes: "detail:micro freeze moments, dramatic spacing, surreal motion stop\nimperfection_object: broken edges; irregular fragment shapes; uneven spacing", t0: { x: 52, y: 50, w: 46, h: 30, rot: 0 } },
      { id: "layer3", type: "support", look: "high-contrast environment behind the frozen action creating theatrical separation", shapeDesc: "contrast stage anchor", z: 1, notes: "detail:clean background geometry, dark-light split, concept poster readability\nimperfection_object: worn surfaces; slight texture noise; dust", t0: { x: 50, y: 42, w: 78, h: 44, rot: 0 } },
    ],
  },
];
