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
      "depth_of_field:very_shallow",
      "bg_preset:studio_white",
      "env_mood:serene",
      "key_light_time:studio", "color_temp:5600K",
      "color_grade:natural", "film_look:digital_clean",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "product, centered, sharp edges",
    layerNotes: notes(
      "costume:clean white seamless backdrop",
      "detail:sharp product edges, no shadows, pure white surround"
    ),
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
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "product packaging front view",
    layerNotes: notes(
      "costume:clean white seamless background",
      "detail:label text sharp and readable, packaging edges crisp, no distortion"
    ),
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
    layerLook: "high-end mechanical wristwatch",
    layerShapeDesc: "luxury timepiece, centered presentation",
    layerNotes: notes(
      "costume:polished stainless steel case, sapphire crystal, brushed dial",
      "detail:seconds hand moving in real time, controlled rim light reflections on case edge"
    ),
  },
  {
    templateId: "v3_car_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:filmic",
      "shot_size:LS", "focal_length:35mm", "cam_angle:low_angle",
      "depth_of_field:medium",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:night", "color_temp:8000K", "spec_light:volumetric",
      "color_grade:teal_orange", "film_look:anamorphic_flare",
      "narrative_rhythm:slow_burn", "visual_tension:medium"
    ),
    layerLook: "high-end black sports car",
    layerShapeDesc: "sleek aerodynamic body, lowered performance stance",
    layerNotes: notes(
      "costume:glossy carbon fiber trim, aggressive body lines",
      "detail:wet tarmac reflecting neon city lights, chrome wheel details, LED headlights glowing cold blue"
    ),
  },
  {
    templateId: "v3_product_lifestyle_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MCU", "focal_length:50mm",
      "depth_of_field:shallow",
      "bg_preset:indoor_luxury",
      "env_mood:serene",
      "key_light_time:overcast", "color_temp:5600K",
      "color_grade:natural", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "hand holding product, natural grip, clean fingernails",
    layerNotes: notes(
      "costume:natural hand, minimal styling",
      "detail:product in hand showing actual scale, natural skin texture, soft background context"
    ),
  },

  // ── PEOPLE PORTRAIT ────────────────────────────────────────────

  {
    templateId: "v3_portrait_editorial_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:editorial",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:very_shallow",
      "bg_preset:studio_dark",
      "env_mood:luxurious",
      "key_light_time:studio", "color_temp:3200K", "spec_light:rim_light",
      "color_grade:warm_golden", "film_look:film_grain",
      "narrative_rhythm:meditative", "visual_tension:none"
    ),
    layerLook: "female model, angular jaw, sharp cheekbones, editorial expression",
    layerShapeDesc: "elegant posture, professional presence",
    layerNotes: notes(
      "costume:high-end fashion garment, precise tailoring",
      "pose:power_pose",
      "expression:confident",
      "detail:smooth skin, precise makeup, garment texture visible"
    ),
  },
  {
    templateId: "v3_portrait_cinematic_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes(
      "@compiler: v3", "media: image",
      "render_style:cinematic_still",
      "shot_size:MCU", "focal_length:85mm",
      "depth_of_field:shallow",
      "bg_preset:outdoor_urban",
      "env_mood:dramatic",
      "key_light_time:golden_hour", "color_temp:3200K",
      "color_grade:teal_orange", "film_look:film_grain",
      "narrative_rhythm:slow_burn", "visual_tension:medium"
    ),
    layerLook: "person in mid-shot, strong cheekbones, defined jawline, intense gaze",
    layerShapeDesc: "strong presence, defined features",
    layerNotes: notes(
      "costume:simple but distinctive clothing",
      "expression:determined",
      "detail:golden light catching face, urban environment out of focus behind"
    ),
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
    sceneNotes: notes("@compiler: v3","media: image","render_style:photorealistic","shot_size:MS","focal_length:85mm","depth_of_field:medium","bg_preset:studio_white","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "product set grouped arrangement",
    layerNotes: notes("costume:multiple products in coordinated layout","detail:precise spacing, clean shadows, consistent lighting across all items"),
  },
  {
    templateId: "v3_product_hero_03",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:studio_white","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "premium product centered on white",
    layerNotes: notes("costume:clean premium surface finish","detail:crisp product silhouette, minimal shadow, ample breathing room"),
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
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:35mm","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "product on surface, editorial placement",
    layerNotes: notes("costume:natural surface setting, lifestyle props nearby","detail:product scale clear, natural placement, soft shadows from window light"),
  },
  {
    templateId: "v3_product_video_01",
    mediaMode: "video", aspectRatio: "1:1", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:MS","focal_length:85mm","cam_movement:orbit","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "luxury product on pedestal",
    layerNotes: notes("costume:polished premium finish","detail:orbital camera reveals all product angles, controlled highlights rotate with camera"),
  },
  {
    templateId: "v3_product_video_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:lens_flare","color_grade:warm_golden","film_look:halation","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "product reveal emerging from dark",
    layerNotes: notes("costume:premium material, high finish","detail:product gradually enters frame, light catches edges dramatically"),
  },
  {
    templateId: "v3_product_video_03",
    mediaMode: "video", aspectRatio: "1:1", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:commercial","shot_size:ECU","focal_length:macro","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:5600K","spec_light:rim_light","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "product surface texture in motion",
    layerNotes: notes("costume:premium material surface","detail:slow camera glide over texture, light plays across material grain"),
  },
  {
    templateId: "v3_luxury_03",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "premium skincare product",
    layerShapeDesc: "elegant bottle or jar form",
    layerNotes: notes("costume:glass or ceramic surface, gold metallic accents","prop:brand embossing or seal visible","detail:controlled specular on curved surface, gradient shadow base, surface micro-texture"),
  },
  {
    templateId: "v3_luxury_04",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:FS","focal_length:85mm","depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "luxury structured handbag",
    layerShapeDesc: "top-handle rigid form, architectural silhouette",
    layerNotes: notes("costume:fine leather, quilted or smooth, gold hardware","prop:chain strap visible alongside, brand monogram embossed","detail:leather grain visible, stitching precise, hardware reflections controlled"),
  },
  {
    templateId: "v3_car_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:LS","focal_length:50mm","cam_angle:low_angle","depth_of_field:medium","bg_preset:studio_dark","env_mood:dramatic","key_light_time:studio","color_temp:6500K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:low"),
    layerLook: "luxury car in studio",
    layerShapeDesc: "full vehicle, three-quarter front angle",
    layerNotes: notes("costume:polished paint, chrome trim, alloy wheels","detail:paint reflection of studio lights, tyre texture, badge and logo sharp"),
  },
  {
    templateId: "v3_tech_ad_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:dramatic","key_light_time:studio","color_temp:6500K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "premium smartphone or tablet",
    layerShapeDesc: "sleek device, minimal bezel",
    layerNotes: notes("costume:glass and metal unibody, precise chamfered edges","detail:screen reflections controlled, camera module sharp, brand mark visible"),
  },
  {
    templateId: "v3_food_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "premium food dish hero shot",
    layerShapeDesc: "plated food, styled presentation",
    layerNotes: notes("costume:fresh ingredients, precise plating","detail:steam or moisture visible, ingredient textures vivid, garnish precise"),
  },

  // PORTRAIT
  {
    templateId: "v3_portrait_editorial_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:85mm","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:serene","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "fashion model, editorial pose, high-fashion garment",
    layerNotes: notes("costume:high-end fashion garment, precise styling","expression:confident","detail:natural light wrapping, city environment soft behind, garment movement"),
  },
  {
    templateId: "v3_portrait_corporate_02",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "professional team member",
    layerNotes: notes("costume:business casual, clean professional style","expression:confident","detail:neutral background, consistent light, sharp facial detail"),
  },
  {
    templateId: "v3_portrait_lifestyle_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:photorealistic","shot_size:MCU","focal_length:50mm","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","color_grade:vibrant","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "person in urban street portrait",
    layerNotes: notes("costume:contemporary street style clothing","expression:confident","detail:city environment soft behind, natural light from side, authentic mood"),
  },
  {
    templateId: "v3_portrait_lifestyle_02",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:50mm","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "person in casual attire, relaxed pose",
    layerNotes: notes("costume:relaxed lifestyle clothing","expression:joyful","emotion:calm","detail:warm window light, café environment soft behind, cup or book as prop"),
  },
  {
    templateId: "v3_portrait_cinematic_02",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","depth_of_field:shallow","bg_preset:studio_dark","env_mood:mysterious","key_light_time:studio","color_temp:3200K","color_grade:noir","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:medium"),
    layerLook: "mysterious character in shadow",
    layerNotes: notes("costume:dark dramatic clothing","expression:stoic","detail:single light source, deep shadows on half face, noir atmosphere"),
  },
  {
    templateId: "v3_portrait_video_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:85mm","cam_movement:static","depth_of_field:shallow","bg_preset:studio_dark","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "presenter or host on camera",
    layerNotes: notes("costume:professional on-camera attire","expression:confident","detail:clean background, key light on face, natural eye contact with lens"),
  },
  {
    templateId: "v3_portrait_video_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:85mm","cam_movement:static","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:studio","color_temp:5600K","spec_light:rim_light","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "interview subject, side-lit",
    layerNotes: notes("costume:professional attire","expression:determined","detail:side key light creates authority, background slightly lit, composed posture"),
  },
  {
    templateId: "v3_portrait_fashion_video_01",
    mediaMode: "video", aspectRatio: "9:16", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:85mm","cam_movement:slow_push","depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "fashion model walking toward camera",
    layerNotes: notes("costume:runway or high-fashion garment","expression:confident","detail:slow motion garment movement, rim light defining silhouette, confident stride"),
  },
  {
    templateId: "v3_portrait_fashion_video_02",
    mediaMode: "video", aspectRatio: "9:16", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:35mm","cam_movement:handheld","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium"),
    layerLook: "fashion figure, streetwear, candid mid-motion",
    layerNotes: notes("costume:street fashion, editorial styling","expression:confident","detail:handheld energy, city motion behind, fashion as statement"),
  },
  {
    templateId: "v3_portrait_athlete_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:photorealistic","shot_size:MCU","focal_length:85mm","cam_angle:low_angle","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high"),
    layerLook: "elite athlete in competition moment",
    layerNotes: notes("costume:sport performance gear, team or brand colors","action:running","expression:determined","detail:peak physical effort, sweat detail, muscles engaged, dynamic angle"),
  },
  {
    templateId: "v3_portrait_couple_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","shot_size:MS","focal_length:85mm","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:melancholic","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:low"),
    layerLook: "couple in cinematic moment",
    layerNotes: notes("costume:stylish contemporary clothing","emotion:calm","detail:golden light between them, city evening background, unspoken connection"),
  },
  {
    templateId: "v3_portrait_brand_collab_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MS","focal_length:85mm","depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "brand ambassador holding product",
    layerNotes: notes("costume:premium brand-aligned styling","expression:confident","prop:luxury product prominently held or worn","detail:product detail sharp, person warm and approachable, brand aesthetic unified"),
  },
  {
    templateId: "v3_portrait_fincher_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","director_pack:fincher","shot_size:MCU","focal_length:35mm","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night","color_temp:6500K","spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high"),
    layerLook: "character under Fincher precision lighting",
    layerNotes: notes("costume:controlled, precise clothing","expression:stoic","detail:green-teal wash, geometric shadow patterns, clinical precision in every edge"),
  },
  {
    templateId: "v3_portrait_nolan_01",
    mediaMode: "image", aspectRatio: "21:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:filmic","director_pack:nolan","shot_size:FS","focal_length:24mm","cam_angle:low_angle","depth_of_field:deep","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:high"),
    layerLook: "heroic figure, dramatic posture, facing camera",
    layerNotes: notes("costume:practical hero clothing","expression:determined","detail:IMAX scale, human dwarfed by landscape, epic backlighting"),
  },
  {
    templateId: "v3_portrait_video_long_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","shot_size:FS","focal_length:85mm","cam_movement:slow_push","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:medium"),
    layerLook: "character entering scene with presence",
    layerNotes: notes("costume:distinctive character clothing","expression:determined","detail:slow dolly reveals character scale, golden backlight creates silhouette, epic entrance"),
  },

  // POSTER / COVER
  {
    templateId: "v3_poster_brand_02",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:MS","focal_length:50mm","depth_of_field:shallow","bg_preset:studio_white","env_mood:serene","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "minimal brand visual subject",
    layerNotes: notes("costume:clean minimal styling","detail:ample white space for typography, strong visual hierarchy, brand aesthetic"),
  },
  {
    templateId: "v3_poster_movie_02",
    mediaMode: "image", aspectRatio: "2:3",
    sceneNotes: notes("@compiler: v3","media: image","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_angle:low_angle","depth_of_field:shallow","bg_preset:outdoor_urban","env_mood:mysterious","key_light_time:night","color_temp:8000K","spec_light:volumetric","color_grade:noir","film_look:film_grain","narrative_rhythm:slow_burn","visual_tension:high"),
    layerLook: "thriller protagonist on dark poster",
    layerNotes: notes("costume:dark practical clothing","expression:determined","detail:deep noir shadows, fog in background, tension in posture"),
  },
  {
    templateId: "v3_poster_event_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:35mm","depth_of_field:medium","bg_preset:outdoor_urban","env_mood:energetic","key_light_time:night","color_temp:8000K","spec_light:neon","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium"),
    layerLook: "performer on stage or event space",
    layerNotes: notes("costume:stage costume or event attire","action:reaching_sky","detail:dramatic stage lighting, crowd energy implied, poster composition"),
  },
  {
    templateId: "v3_poster_social_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:5600K","color_grade:natural","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "premium brand visual for Instagram",
    layerNotes: notes("costume:brand-aligned minimal styling","detail:square format optimized, strong center focal point, premium brand aesthetic"),
  },
  {
    templateId: "v3_poster_social_02",
    mediaMode: "image", aspectRatio: "3:4",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:50mm","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "lifestyle subject for social content",
    layerNotes: notes("costume:authentic lifestyle styling","expression:joyful","detail:natural, relatable composition, warm tones, scroll-stopping visual"),
  },
  {
    templateId: "v3_poster_luxury_brand_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:MS","focal_length:85mm","depth_of_field:shallow","bg_preset:gradient_black","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "luxury brand campaign hero visual",
    layerNotes: notes("costume:prestige brand aesthetic, impeccable detail","detail:every element communicates exclusivity, negative space intentional, brand mark placement ready"),
  },
  {
    templateId: "v3_poster_fashion_01",
    mediaMode: "image", aspectRatio: "4:5",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:FS","focal_length:85mm","depth_of_field:shallow","bg_preset:studio_dark","env_mood:luxurious","key_light_time:studio","color_temp:3200K","spec_light:rim_light","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "fashion model for seasonal campaign",
    layerNotes: notes("costume:season collection hero piece","expression:confident","detail:garment design visible, fabric quality communicates season theme"),
  },
  {
    templateId: "v3_poster_tech_brand_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:commercial","shot_size:LS","focal_length:35mm","depth_of_field:deep","bg_preset:gradient_black","env_mood:dramatic","key_light_time:studio","color_temp:6500K","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:epic_build","visual_tension:medium"),
    layerLook: "tech product launch hero visual",
    layerNotes: notes("costume:sleek device or product","detail:minimal composition, product floating in dark space, Apple-level precision"),
  },
  {
    templateId: "v3_poster_corporate_01",
    mediaMode: "image", aspectRatio: "16:9",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:LS","focal_length:35mm","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:cool_steel","film_look:digital_clean","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "corporate team or executive in office",
    layerNotes: notes("costume:professional business attire","expression:confident","detail:modern office architecture, glass and steel, professional authority"),
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
    templateId: "v3_poster_music_01",
    mediaMode: "image", aspectRatio: "1:1",
    sceneNotes: notes("@compiler: v3","media: image","render_style:editorial","shot_size:MCU","focal_length:85mm","depth_of_field:very_shallow","bg_preset:studio_dark","env_mood:mysterious","key_light_time:studio","color_temp:3200K","spec_light:neon","color_grade:vibrant","film_look:halation","narrative_rhythm:meditative","visual_tension:low"),
    layerLook: "artist for album cover visual",
    layerNotes: notes("costume:distinctive artist styling","expression:confident","detail:square format, strong character presence, music genre aesthetic"),
  },

  // STORY VIDEO
  {
    templateId: "v3_story_drama_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_movement:static","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:dramatic","key_light_time:night","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high"),
    layerLook: "character in emotional confrontation",
    layerNotes: notes("costume:contemporary dramatic clothing","expression:angry","emotion:tense","detail:two-person tension, shallow focus isolates subject, emotional peak"),
  },
  {
    templateId: "v3_story_romance_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:85mm","cam_movement:slow_push","depth_of_field:very_shallow","bg_preset:outdoor_urban","env_mood:melancholic","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:halation","narrative_rhythm:slow_burn","visual_tension:low"),
    layerLook: "character in farewell moment",
    layerNotes: notes("costume:romantic casual clothing","expression:sad","emotion:melancholic","detail:golden light, moment of departure, emotional weight in stillness"),
  },
  {
    templateId: "v3_story_suspense_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","director_pack:fincher","shot_size:MCU","focal_length:35mm","cam_movement:slow_push","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night","color_temp:6500K","spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high"),
    layerLook: "character discovering crucial reveal",
    layerNotes: notes("costume:controlled, precise clothing","expression:surprised","emotion:tense","detail:clinical precision, green-teal shadows, information revealed in frame geometry"),
  },
  {
    templateId: "v3_story_scifi_02",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","shot_size:LS","focal_length:24mm","cam_movement:crane_up","depth_of_field:deep","bg_preset:outdoor_urban","env_mood:mysterious","key_light_time:night","color_temp:8000K","spec_light:neon","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:epic_build","visual_tension:medium"),
    layerLook: "character in cyberpunk city at night",
    layerNotes: notes("costume:futuristic urban clothing","action:walking","detail:neon signs in multiple colors, rain on streets, retrofuturist architecture"),
  },
  {
    templateId: "v3_story_nature_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","director_pack:villeneuve","shot_size:XLS","focal_length:24mm","cam_movement:crane_up","depth_of_field:deep","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:teal_orange","film_look:film_grain","narrative_rhythm:meditative","visual_tension:low"),
    layerLook: "lone figure in epic natural landscape",
    layerNotes: notes("costume:minimal outdoor clothing","action:standing","detail:human scale dwarfed by landscape, Villeneuve oppressive beauty, golden light"),
  },
  {
    templateId: "v3_story_sport_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:photorealistic","shot_size:MCU","focal_length:85mm","cam_angle:low_angle","cam_movement:tracking","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","spec_light:golden_hour","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium"),
    layerLook: "athlete at peak performance moment",
    layerNotes: notes("costume:sport performance gear","action:running","expression:determined","emotion:euphoric","detail:slow motion peak effort, sweat particles, golden back rim light"),
  },
  {
    templateId: "v3_story_product_film_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 15,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:MCU","focal_length:50mm","cam_movement:slow_push","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "person using or holding product meaningfully",
    layerNotes: notes("costume:authentic everyday clothing","expression:joyful","detail:product as part of life story, emotional connection, brand warmth"),
  },
  {
    templateId: "v3_story_crime_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","director_pack:fincher","shot_size:MCU","focal_length:35mm","cam_movement:slow_push","depth_of_field:medium","bg_preset:indoor_luxury","env_mood:mysterious","key_light_time:night","color_temp:6500K","spec_light:practicals","color_grade:noir","film_look:bleach_bypass","narrative_rhythm:slow_burn","visual_tension:high"),
    layerLook: "interrogation scene character",
    layerNotes: notes("costume:rumpled detective suit or suspect clothing","action:sitting","expression:determined","detail:single overhead light, harsh geometric shadows, table surface reflecting light"),
  },
  {
    templateId: "v3_story_historical_01",
    mediaMode: "video", aspectRatio: "21:9", duration: 10,
    sceneNotes: notes("@compiler: v3","media: video","render_style:filmic","shot_size:LS","focal_length:35mm","cam_angle:low_angle","cam_movement:crane_up","depth_of_field:medium","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:volumetric","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:epic_build","visual_tension:high"),
    layerLook: "historical figure in epic setting",
    layerNotes: notes("costume:period-accurate costume, battle or ceremonial","expression:determined","detail:epic landscape, period details, grand historical scale"),
  },
  {
    templateId: "v3_story_documentary_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 6,
    sceneNotes: notes("@compiler: v3","media: video","render_style:documentary","shot_size:MCU","focal_length:85mm","cam_movement:static","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:serene","key_light_time:overcast","color_temp:5600K","color_grade:natural","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "documentary interview subject",
    layerNotes: notes("costume:authentic everyday clothing","expression:determined","detail:observational framing, natural light, direct to camera, authentic presence"),
  },
  {
    templateId: "v3_story_music_video_01",
    mediaMode: "video", aspectRatio: "16:9", duration: 8,
    sceneNotes: notes("@compiler: v3","media: video","render_style:editorial","shot_size:FS","focal_length:35mm","cam_movement:orbit","depth_of_field:shallow","bg_preset:studio_dark","env_mood:energetic","key_light_time:night","color_temp:8000K","spec_light:neon","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:medium"),
    layerLook: "artist performing on stage",
    layerNotes: notes("costume:performance stage costume","action:reaching_sky","detail:dramatic concert lighting, crowd implied, peak performance moment"),
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
    sceneNotes: notes("@compiler: v3","media: video","render_style:documentary","shot_size:MCU","focal_length:35mm","cam_movement:handheld","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:energetic","key_light_time:golden_hour","color_temp:3200K","color_grade:vibrant","film_look:film_grain","narrative_rhythm:urgent","visual_tension:none"),
    layerLook: "travel vlogger in scenic location",
    layerNotes: notes("costume:casual travel clothing","expression:joyful","detail:location beauty behind, natural adventurous energy, handheld authenticity"),
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
    sceneNotes: notes("@compiler: v3","media: video","render_style:cinematic_still","shot_size:MCU","focal_length:50mm","cam_movement:static","depth_of_field:shallow","bg_preset:indoor_luxury","env_mood:dramatic","key_light_time:night","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:urgent","visual_tension:high"),
    layerLook: "short drama character at emotional peak",
    layerNotes: notes("costume:dramatic costume for short drama","expression:determined","emotion:tense","detail:vertical format composition, emotional close-up, mobile-first impact"),
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
    sceneNotes: notes("@compiler: v3","media: video","render_style:documentary","shot_size:MCU","focal_length:85mm","cam_movement:static","depth_of_field:shallow","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","color_grade:warm_golden","film_look:film_grain","narrative_rhythm:meditative","visual_tension:none"),
    layerLook: "documentary character in natural environment",
    layerNotes: notes("costume:authentic subject clothing","expression:determined","detail:observational intimacy, real-world detail, PBS/BBC quality presence"),
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
    sceneNotes: notes("@compiler: v3","media: image","render_style:filmic","shot_size:LS","focal_length:anamorphic","cam_angle:low_angle","depth_of_field:medium","bg_preset:outdoor_nature","env_mood:dramatic","key_light_time:golden_hour","color_temp:3200K","spec_light:lens_flare","color_grade:teal_orange","film_look:anamorphic_flare","narrative_rhythm:epic_build","visual_tension:medium"),
    layerLook: "cinematic scene in ultra-wide anamorphic format",
    layerNotes: notes("costume:character in dramatic environment","detail:oval bokeh, horizontal anamorphic flare, ultra-wide epic feel, letterbox cinema"),
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
];
