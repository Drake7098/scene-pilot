/**
 * compileV3.ts — ScenePilotix V3 Prompt Compiler (v0.4 Refactored)
 *
 * v0.4 Changes:
 * - Structural refactoring for maintainability
 * - Extracted field resolution into resolveAllFields()
 * - Extracted segment builders into individual functions
 * - Cleaned up patch artifacts
 *
 * Fixed 14-segment output order:
 *  1  STYLE          render style + director intent
 *  2  CAMERA         shot size + lens + angle
 *  3  MOTION         movement + duration (video only)
 *  4  SUBJECT_BASE   what the subject is + spatial position
 *  5  SUBJECT_COSTUME material / clothing / surface finish
 *  6  SUBJECT_PROPS  accessories / props
 *  7  SUBJECT_ACTION action / pose / movement
 *  8  SUBJECT_STATE  expression / emotion / condition
 *  9  SUBJECT_DETAIL micro-detail / texture / surface
 * 10  COMPOSITION    framing + layout + negative space
 * 11  LIGHTING       key light + temperature + specials
 * 12  ENVIRONMENT    background + location
 * 13  MOOD           atmosphere / tone (never mixed with style)
 * 14  TECHNICAL      quality suffix — always last
 *
 * Optional 15th segment (machine-readable, for debugging/template injection):
 * 15  STRUCTURE_GUIDE object count, spatial relations, motion path
 */

import type { Lang } from "../i18n";
import type { Scene } from "../model";

// ── Types ──────────────────────────────────────────────────────────────────
export type V3Input = {
  scene: Scene;
  lang: Lang;
  mediaMode: "image" | "video";
  aspectRatio?: string;
  platform?: GenerationPlatform;
};

/**
 * Target platform for prompt adaptation
 * Different platforms have different prompt syntax preferences
 */
export type GenerationPlatform = 
  | "midjourney"      // Midjourney v6+
  | "runway"          // Runway Gen-2/Gen-3
  | "pika"            // Pika Labs
  | "stable-diffusion" // SDXL / SD 1.5
  | "flux"            // Flux models
  | "generic";        // Default universal format

/**
 * Platform adapter interface
 */
interface PlatformAdapter {
  /** Format the final prompt for this platform */
  formatPrompt(rawPrompt: string, input: V3Input): string;
  /** Optional: preprocess input before compilation */
  preprocessInput?(input: V3Input): V3Input;
}

export type ValueSource = "user" | "template" | "director" | "default";

export type ResolvedValue = {
  value: string;
  source: ValueSource;
};

/**
 * All resolved fields from scene notes and camera/lighting config
 */
export type ResolvedFields = {
  shotSize: ResolvedValue;
  camAngle: ResolvedValue;
  camMove: ResolvedValue;
  duration: number;
  directorPack: ResolvedValue;
  narrative: ResolvedValue;
  tension: ResolvedValue;
  renderStyle: ResolvedValue;
  focalLength: ResolvedValue;
  dof: ResolvedValue;
  bgPreset: ResolvedValue;
  envMood: ResolvedValue;
  keyTimeRaw: string;
  keyDir: ResolvedValue;
  keyMood: ResolvedValue;
  colorTemp: ResolvedValue;
  specLightRaw: string;
  colorGrade: ResolvedValue;
  filmLook: ResolvedValue;
  postProcess: ResolvedValue;
  keyTimeFinal: string;
  specLightFinal: string;
};

// ── Marker reader ──────────────────────────────────────────────────────────
function mark(notes: string, key: string): string {
  const line = (notes ?? "").split("\n").find(l => l.trim().startsWith(key + ":"));
  return line ? line.trim().slice(key.length + 1).trim() : "";
}

// ── Conflict resolver with priority rules ─────────────────────────────────
/**
 * Priority: user > template > director > default
 * Returns both value and source for debugging/tracking
 */
function resolveWithPriority(
  userValue?: string,
  templateValue?: string,
  directorValue?: string,
  defaultValue: string = ""
): ResolvedValue {
  const normalize = (v?: string) => {
    if (!v) return "";
    const trimmed = v.trim();
    if (trimmed === "未定义" || trimmed === "未选择" || trimmed === "undefined") return "";
    return trimmed;
  };

  const user = normalize(userValue);
  if (user) return { value: user, source: "user" };

  const template = normalize(templateValue);
  if (template) return { value: template, source: "template" };

  const director = normalize(directorValue);
  if (director) return { value: director, source: "director" };

  return { value: defaultValue, source: "default" };
}

// ── Position: x/y/w → concise natural language ────────────────────────────
function positionPhrase(x: number, y: number, w: number): string {
  const h =
    x < 28 ? "far left" :
    x < 42 ? "left of center" :
    x < 58 ? "centered" :
    x < 72 ? "right of center" :
    "far right";
  const v =
    y < 30 ? "upper" :
    y < 55 ? "mid" :
    "lower";
  const prominence =
    w < 15 ? "small in frame" :
    w < 28 ? "occupying about a third of the frame" :
    w < 45 ? "prominently sized" :
    "filling most of the frame";
  return `${h}, ${v}-frame, ${prominence}`;
}

// ── De-duplicate overlapping specLight / keyLightTime values ──────────────
function dedupeLight(keyLightTime: string, specLight: string): [string, string] {
  if (specLight === "golden_hour" && keyLightTime === "golden_hour") return [keyLightTime, ""];
  if (specLight === "golden_hour" && keyLightTime !== "") return [keyLightTime, specLight];
  if (specLight === "blue_hour" && keyLightTime === "blue_hour") return [keyLightTime, ""];
  if (specLight === "blue_hour" && keyLightTime !== "") return [keyLightTime, specLight];
  return [keyLightTime, specLight];
}

// ── Translation tables ─────────────────────────────────────────────────────
const SHOT: Record<string, string> = {
  ECU:"extreme close-up shot", CU:"close-up shot", MCU:"medium close-up shot",
  MS:"medium shot", FS:"full shot", LS:"long shot", XLS:"extreme long shot",
};
const ANGLE: Record<string, string> = {
  eye_level:"eye-level angle", low_angle:"low angle",
  high_angle:"high angle", dutch:"dutch angle", worm_eye:"extreme low angle / worm's eye view",
  bird_eye:"bird's eye view, straight down overhead",
  over_shoulder:"over-the-shoulder shot (OTS)",
  two_shot:"two-shot, cowboy framing",
  profile:"side-on profile angle, 90 degrees",
  three_quarter:"three-quarter angle",
};
const MOVEMENT: Record<string, string> = {
  static:"", slow_push:"slow dolly push forward", pull_back:"slow dolly pull back",
  pan_left:"camera pan left", pan_right:"camera pan right",
  tilt_up:"camera tilt up", tilt_down:"camera tilt down",
  tracking:"tracking shot", crane_up:"crane shot rising",
  handheld:"handheld, naturalistic movement", steadicam:"steadicam, smooth gliding",
  orbit:"orbital arc around subject", zoom_in:"slow zoom in", zoom_out:"slow zoom out",
  // New additions
  push_in:"dolly push in", pull_out:"dolly pull out",
  whip_pan:"whip pan, fast snap cut motion",
  roll:"dutch roll, rotating camera",
  follow_focus:"follow focus, tracking subject depth",
  dolly_zoom:"dolly zoom, Hitchcock vertigo effect",
  arc:"arc shot, orbital movement around subject",
  drone_rise:"drone ascent, rising aerial shot",
  drone_descend:"drone descent, lowering aerial shot",
  drone_orbit:"drone orbital arc, sweeping aerial circle",
  crane_down:"crane shot descending",
  jib_up:"jib arm rising shot",
};
const FOCAL: Record<string, string> = {
  "8mm":"8mm fisheye lens, extreme distortion",
  "14mm":"14mm ultra-wide lens", "18mm":"18mm wide-angle lens",
  "24mm":"24mm wide lens", "28mm":"28mm lens",
  "35mm":"35mm lens", "40mm":"40mm natural field of view lens",
  "50mm":"50mm standard lens", "85mm":"85mm portrait prime lens",
  "105mm":"105mm portrait / macro lens", "135mm":"135mm medium telephoto lens",
  "200mm":"200mm telephoto lens", "300mm":"300mm super telephoto lens",
  "600mm":"600mm extreme telephoto lens",
  "macro":"macro lens, extreme close-up detail",
  "tilt_shift":"tilt-shift lens, selective focus plane",
  "anamorphic":"anamorphic lens, widescreen format with oval bokeh",
};
const DOF: Record<string, string> = {
  very_shallow:"extremely shallow depth of field, subject sharp, background dissolved into bokeh",
  shallow:"shallow depth of field, soft background blur",
  medium:"medium depth of field",
  deep:"deep depth of field, all elements sharp",
  full_focus:"pan focus, everything in sharp focus",
};
const RENDER: Record<string, string> = {
  commercial:      "luxury product advertisement, high-end commercial film, cinematic studio photography",
  photorealistic:  "photorealistic ultra-realistic photography",
  cinematic_still: "cinematic film photography",
  editorial:       "editorial photography, high-end magazine look",
  filmic:          "filmic motion picture aesthetic",
  documentary:     "documentary style, naturalistic photography",
  music_video:     "music video aesthetics, stylized visuals",
  vfx_heavy:       "VFX-heavy, cinematic visual effects",
};
const DIRECTOR: Record<string, string> = {
  kubrick:        "symmetrical wide-angle composition, cold detached atmosphere, clinical framing",
  wong_kar_wai:   "warm neon palette, shallow focus, melancholic time-suspended mood",
  nolan:          "practical IMAX scale, cool desaturated tones, oppressive epic tension",
  wes_anderson:   "pastel palette, precise symmetrical framing, deadpan flat aesthetic",
  villeneuve:     "extreme wide shots, oppressive environmental scale, sparse minimal presence",
  fincher:        "green-teal grade, precisely controlled lighting, clinical precision",
  bay_explosive:  "low rotating camera angles, hyper-saturated teal-orange palette, explosive kinetic impact, metallic sheen",
  scott_epic:     "vast environmental scale, atmospheric haze, 35mm grain texture, historical gravitas",
  coppola_soft:   "soft diffused light, desaturated pastel palette, floating interior-state compositions",
  park_chan_wook: "precise symmetric framing, saturated crimson against cold blue, restrained then suddenly explosive",
  bong_joon_ho:   "spatial compositions revealing hierarchy, warm-cool color zoning, realism with absurdist edge",
  zhang_yimou:    "intensely saturated color blocks, red-gold palette dominance, grand ceremonial scale",
};
const KEY_TIME: Record<string, string> = {
  dawn:"dawn light, first light of day", morning:"soft morning light",
  midday:"high-noon overhead sun, harsh direct light",
  golden_hour:"golden hour, warm low-angle sunlight",
  blue_hour:"blue hour, cool twilight ambient",
  night:"night, controlled artificial lighting",
  studio:"studio lighting setup", overcast:"overcast diffused light, no hard shadows",
};
const COLOR_TEMP: Record<string, string> = {
  "2700K":"2700K candlelight warm glow", "3200K":"3200K tungsten warm light",
  "4000K":"4000K warm white", "5600K":"5600K daylight balanced",
  "6500K":"6500K cool white", "8000K":"8000K overcast blue-hour sky",
};
const SPEC_LIGHT: Record<string, string> = {
  volumetric:          "volumetric light rays, atmospheric haze",
  lens_flare:          "anamorphic lens flare, controlled highlight streak",
  anamorphic_flare:    "anamorphic lens flare with horizontal streak",
  rim_light:           "strong rim light on subject edges",
  backlight:           "powerful backlight, silhouette effect",
  practicals:          "practical lights visible in scene",
  practical:           "practical lights visible in scene",
  neon:                "neon color cast",
  neon_spill:          "neon light spill, colored ambient wash",
  golden_hour:         "golden hour sunlight, warm directional rays",
  golden_hour_rays:    "golden hour sunbeams, warm directional shafts of light",
  blue_hour:           "blue-hour cool ambient wrap",
  blue_hour_ambient:   "blue hour ambient, cool twilight diffusion",
  practical_window:    "natural window light, soft directional daylight",
  haze:                "haze machine atmosphere, scattered diffused light",
  candlelight:         "candlelight, warm flickering glow",
  fire_glow:           "fire glow, warm dancing reflections",
  strobe:              "strobe flash, freeze-motion light burst",
  lightning:           "lightning flash, sudden high-intensity burst",
  screen_glow:         "screen glow, cool blue-white ambient",
  bokeh_lights:        "out-of-focus background light orbs",
  laser:               "laser beams cutting through atmosphere",
};
const BG: Record<string, string> = {
  studio_dark:    "dark studio background, deep gradient from charcoal to black",
  studio_white:   "clean white studio seamless backdrop",
  studio_grey:    "neutral grey studio backdrop",
  outdoor_urban:  "urban street environment",
  outdoor_nature: "natural outdoor environment",
  indoor_luxury:  "luxury interior space",
  indoor_minimal: "minimal interior, clean architecture",
  gradient_black: "deep gradient dark background, near-black to pure black",
  gradient_white: "soft white gradient background",
  abstract:       "abstract non-representational background",
};
const ENV_MOOD: Record<string, string> = {
  serene:"serene, peaceful", dramatic:"dramatic, high-contrast",
  mysterious:"mysterious, fog-laden", energetic:"energetic, vibrant",
  melancholic:"melancholic, quiet solitude", luxurious:"quiet opulence, premium atmosphere",
  raw:"raw, gritty, unfiltered",
};
const NARRATIVE: Record<string, string> = {
  slow_burn:    "slow-burn pacing, extended holds",
  urgent:       "urgent rhythm, kinetic momentum",
  meditative:   "meditative pace, still and contemplative",
  epic_build:   "epic build, escalating intensity",
  lyrical:      "lyrical flow, dream-like",
  staccato:     "staccato rhythm, jump cuts and punchy edits",
  breath:       "breathing rhythm, pauses and reactions prioritized",
  freeform:     "freeform, no dominant rhythm",
};
const TENSION: Record<string, string> = {
  none:"", low:"calm, composed", medium:"building tension",
  high:"high tension, confrontational charge", explosive:"explosive intensity",
  minimal:       "minimal tension, restrained",
  balanced:      "balanced, natural",
  charged:       "charged, taut energy",
  confrontational:"confrontational, face-off charge",
  unsettling:    "unsettling, suspenseful undertone",
  euphoric:      "euphoric, ecstatic energy",
};
const GRADE: Record<string, string> = {
  teal_orange:     "teal and orange grade, cinematic blockbuster look",
  warm_golden:     "warm golden grade, luxurious amber",
  warm_vintage:    "warm vintage grade, amber highlights with lifted blacks",
  cool_steel:      "cool steel blue, desaturated",
  high_contrast:   "high contrast, deep blacks and bright highlights",
  pastel:          "soft pastel palette, low contrast",
  vintage:         "vintage film grade, faded highlights",
  bw:              "black and white, monochrome",
  natural:         "",
  cinematic:       "cinematic color grade, film-look color science",
  vibrant:         "vibrant saturated grade",
  matte:           "matte finish, flat grade",
  noir:            "film noir, dramatic shadows",
  bleach_bypass:   "bleach bypass, desaturated high-contrast silver retention",
  high_key:        "high-key grade, bright open shadows",
  low_key:         "low-key noir grade, crushed blacks",
  desaturated:     "desaturated, muted palette",
  neon_pop:        "neon-saturated, hyper-vivid color",
  fincher_teal:    "green-teal grade, clinical precision, deep shadow detail",
  wkw_warm_neon:   "warm neon palette, amber and magenta cast, soft halation",
  nolan_imax:      "cool desaturated IMAX look, oppressive tonal range",
  anderson_pastel: "pastel symmetrical palette, low contrast, deadpan flat tone",
  kodak_vision3:   "Kodak Vision3 film emulation — warm shadows, rich midtones",
  fuji_velvia:     "Fuji Velvia emulation — vivid saturated color, high contrast",
  agfa_ultra:      "Agfa Ultra vintage emulation — faded warm tones",
};
const FILM_LOOK: Record<string, string> = {
  film_grain:      "subtle film grain, 35mm texture",
  "16mm_grain":    "heavy 16mm film grain, raw texture",
  halation:        "lens halation, glowing highlight bloom",
  vignette:        "natural vignette, darkened edges",
  anamorphic_flare:"oval bokeh, anamorphic character, horizontal lens streak",
  anamorphic:      "anamorphic lens character, oval bokeh, widescreen quality",
  digital_clean:   "",
  bleach_bypass:   "bleach bypass, desaturated high contrast",
  super8:          "Super 8mm vintage look, heavy grain and color shift",
  vhs:             "VHS tape aesthetic, scan lines and color bleed",
  imax:            "IMAX large-format look, exceptional clarity and depth",
  log_c:           "Log-C / S-Log flat grade, latitude for grading",
  infrared:        "infrared photography feel, inverted foliage, ethereal look",
  drone_raw:       "drone RAW aerial footage look, high dynamic range",
};
const ACTION_MAP: Record<string, string> = {
  standing:"standing", sitting:"seated", walking:"walking forward",
  running:"running", jumping:"leaping", crouching:"crouched",
  turning:"turning", reaching:"reaching out",
  reaching_sky:"arms stretched wide", fighting:"in combat stance",
  dancing:"mid-dance", looking:"gazing into the distance",
};
const POSE_MAP: Record<string, string> = {
  power_pose:"commanding power pose", relaxed:"relaxed natural stance",
  hero_entry:"protective stance", arms_raised:"arms spread wide",
  profile:"in profile", back_to_cam:"back to camera",
  confrontational:"confrontational stance", collapsed:"collapsed",
};
const EXPR_MAP: Record<string, string> = {
  neutral:"neutral expression", determined:"determined expression",
  joyful:"joyful expression", sad:"sorrowful expression",
  angry:"intense expression", confident:"confident expression",
  vulnerable:"vulnerable expression", stoic:"stoic expression",
  surprised:"surprised expression",
};

function qualitySuffix(renderStyle: string, mediaMode: "image" | "video"): string {
  if (renderStyle === "commercial")
    return "photorealistic, professional commercial cinematography, high dynamic range, 8K ultra detail";
  if (renderStyle === "photorealistic" || renderStyle === "editorial")
    return "photorealistic, professional photography, high dynamic range, 8K detail";
  if (renderStyle === "documentary")
    return "photorealistic, naturalistic photography, high dynamic range";
  if (mediaMode === "video")
    return "photorealistic, professional commercial cinematography, high dynamic range, 8K detail";
  return "photorealistic, professional photography, high dynamic range, 8K detail";
}

// ── Video Motion Language Helpers ─────────────────────────────────────────
/**
 * Describe video motion with director-style natural language (V3.3)
 * Focus on visual change and cinematic intent, not technical coordinates
 */
function describeVideoMotion(layer: any, duration: number, isPrimary: boolean): string {
  const kf0 = (layer.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
  const kf1 = (layer.kf ?? []).find((k: any) => k.t === 1) ?? kf0;
  
  const dx = kf1.x - kf0.x;
  const dy = kf1.y - kf0.y;
  const dw = kf1.w - kf0.w;
  const rot0 = kf0.rot ?? 0;
  const rot1 = kf1.rot ?? 0;
  const dRot = rot1 - rot0;
  
  // Build natural language description with cinematic flow
  const clauses: string[] = [];
  
  // Opening: establish starting state naturally
  if (isPrimary) {
    if (dw > 10) {
      clauses.push("starting in a wider composition");
    } else if (dw < -10) {
      clauses.push("starting tight on the subject");
    } else {
      clauses.push("the subject holds centered in frame");
    }
  }
  
  // Describe change as visual transformation, not coordinate shift
  if (dw > 8) {
    clauses.push(`slowly pushing in over ${duration} seconds`);
    clauses.push("drawing closer to the subject");
  } else if (dw < -8) {
    clauses.push(`pulling back over ${duration} seconds`);
    clauses.push("revealing more of the surroundings");
  }
  
  // Position changes - describe as intentional camera movement
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    const driftParts: string[] = [];
    if (dx > 8) driftParts.push("drifting right");
    if (dx < -8) driftParts.push("drifting left");
    if (dy > 8) driftParts.push("tilting down");
    if (dy < -8) driftParts.push("rising upward");
    if (driftParts.length > 0) {
      clauses.push(driftParts.join(", "));
    }
  }
  
  // Rotation - subtle mention
  if (Math.abs(dRot) > 15) {
    clauses.push(`${dRot > 0 ? 'gentle clockwise rotation' : 'subtle counter-clockwise turn'}`);
  }
  
  // Ending state - describe the final visual
  if (dw > 8) {
    clauses.push("ending in an intimate close-up");
  } else if (dw < -8) {
    clauses.push("settling into a wider view");
  }
  
  // Static case - describe as intentional stillness
  if (clauses.length <= 1 && isPrimary) {
    return `the subject remains still, holding the moment for ${duration} seconds`;
  }
  
  return clauses.join(", ");
}

function describeMotionPath(layer: any, lang: Lang): string {
  const kf0 = (layer.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
  const kf1 = (layer.kf ?? []).find((k: any) => k.t === 1) ?? kf0;
  
  const dx = Math.round(kf1.x * 10) / 10 - Math.round(kf0.x * 10) / 10;
  const dy = Math.round(kf1.y * 10) / 10 - Math.round(kf0.y * 10) / 10;
  
  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
    return lang === "zh" ? "基本保持静止" : "remains mostly static";
  }
  
  const horizontal = Math.abs(dx) >= 4 ? (dx > 0 ? "right" : "left") : "";
  const vertical = Math.abs(dy) >= 4 ? (dy > 0 ? "down" : "up") : "";
  
  const parts = [horizontal, vertical].filter(Boolean);
  if (!parts.length) return lang === "zh" ? "平稳位移" : "smooth displacement";
  
  return lang === "zh" 
    ? `从${horizontal || ""}${vertical || ""}方向移动` 
    : `moves ${parts.join("-")}`;
}

// ── Structure Guide Builder ───────────────────────────────────────────────
function buildStructureGuide(scene: Scene, lang: Lang, mediaMode: "image" | "video"): string {
  const layers = ((scene as any).layers ?? []).filter(
    (l: any) => l && (l.look || l.externalPrompt || l.notes)
  );
  
  if (layers.length === 0) return "";
  
  const lines: string[] = [];
  lines.push(`Objects: ${layers.length}`);
  
  if (layers.length === 1) {
    const kf0 = (layers[0].kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
    const pos = positionPhrase(kf0.x, kf0.y, kf0.w);
    lines.push(`Spatial: single subject ${pos}`);
  } else if (layers.length > 1) {
    const positions = layers.map((l: any, i: number) => {
      const kf = (l.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50 + i * 10, y: 50, w: 25 };
      return `${l.id || `obj${i+1}`}:${kf.x < 50 ? 'L' : 'R'}`;
    });
    lines.push(`Spatial: ${positions.join(", ")}`);
  }
  
  if (mediaMode === "video" && layers.length > 0) {
    const paths = layers
      .map((l: any, i: number) => {
        const path = describeMotionPath(l, lang);
        return `${l.id || `obj${i+1}`}:${path}`;
      })
      .filter((p: string) => !p.includes("static") && !p.includes("静止"));
    if (paths.length > 0) {
      lines.push(`Motion: ${paths.join("; ")}`);
    }
  }
  
  return lines.join(" | ");
}

// ── Field Resolution ──────────────────────────────────────────────────────
function resolveAllFields(scene: Scene, notes: string, cam: any, lighting: any): ResolvedFields {
  const shotSize = resolveWithPriority(mark(notes, "shot_size") || cam.shot, undefined, undefined, "");
  const camAngle = resolveWithPriority(mark(notes, "cam_angle"), undefined, undefined, "");
  const camMove = resolveWithPriority(mark(notes, "cam_movement") || cam.movement, undefined, undefined, "static");
  const duration = Math.max(1, Math.round(Number(scene.duration_s) || 5));
  const directorPack = resolveWithPriority(mark(notes, "director_pack"), undefined, undefined, "");
  const narrative = resolveWithPriority(mark(notes, "narrative_rhythm"), undefined, undefined, "");
  const tension = resolveWithPriority(mark(notes, "visual_tension"), undefined, undefined, "");
  const renderStyle = resolveWithPriority(mark(notes, "render_style"), undefined, undefined, "");
  const focalLength = resolveWithPriority(mark(notes, "focal_length"), undefined, undefined, "");
  const dof = resolveWithPriority(mark(notes, "depth_of_field"), undefined, undefined, "");
  const bgPreset = resolveWithPriority(mark(notes, "bg_preset"), undefined, undefined, "");
  const envMood = resolveWithPriority(mark(notes, "env_mood"), undefined, undefined, "");
  
  const keyTimeRaw = mark(notes, "key_light_time") || lighting.time || "";
  const keyDir = resolveWithPriority(mark(notes, "key_light_dir") || lighting.key_dir, undefined, undefined, "");
  const keyMood = resolveWithPriority(mark(notes, "key_light_mood") || lighting.mood, undefined, undefined, "");
  const colorTemp = resolveWithPriority(mark(notes, "color_temp"), undefined, undefined, "");
  
  const specLightRaw = mark(notes, "spec_light") || "";
  const colorGrade = resolveWithPriority(mark(notes, "color_grade"), undefined, undefined, "");
  const filmLook = resolveWithPriority(mark(notes, "film_look"), undefined, undefined, "");
  const postProcess = resolveWithPriority(mark(notes, "post_process"), undefined, undefined, "");
  
  const [keyTimeFinal, specLightFinal] = dedupeLight(keyTimeRaw, specLightRaw);
  
  return {
    shotSize, camAngle, camMove, duration, directorPack, narrative, tension,
    renderStyle, focalLength, dof, bgPreset, envMood,
    keyTimeRaw, keyDir, keyMood, colorTemp, specLightRaw,
    colorGrade, filmLook, postProcess, keyTimeFinal, specLightFinal,
  };
}

// ── Segment Builders ──────────────────────────────────────────────────────
function buildStyleSegment(f: ResolvedFields): string | null {
  const parts: string[] = [];
  if (f.renderStyle.value) parts.push(RENDER[f.renderStyle.value] ?? f.renderStyle.value);
  if (f.directorPack.value) parts.push(DIRECTOR[f.directorPack.value] ?? f.directorPack.value);
  return parts.filter(Boolean).join(", ") || null;
}

function buildCameraSegment(f: ResolvedFields): string | null {
  const parts: string[] = [];
  if (f.shotSize.value) parts.push(SHOT[f.shotSize.value] ?? f.shotSize.value);
  if (f.focalLength.value) parts.push(FOCAL[f.focalLength.value] ?? f.focalLength.value);
  if (f.camAngle.value && f.camAngle.value !== "eye_level") parts.push(ANGLE[f.camAngle.value] ?? f.camAngle.value);
  if (f.dof.value) parts.push(DOF[f.dof.value] ?? f.dof.value);
  return parts.filter(Boolean).join(", ") || null;
}

function buildMotionSegment(f: ResolvedFields, validLayers: any[]): string | null {
  const moveStr = MOVEMENT[f.camMove.value] ?? (f.camMove.value !== "static" ? f.camMove.value : "");
  
  const parts: string[] = [];
  
  // Camera movement with duration - natural phrasing
  if (moveStr) {
    parts.push(`${moveStr} over ${f.duration} seconds`);
  } else {
    parts.push(`over ${f.duration} seconds`);
  }
  
  // Subject motion - primary layer only in main prompt
  if (validLayers.length > 0) {
    const primaryMotion = describeVideoMotion(validLayers[0], f.duration, true);
    parts.push(primaryMotion);
    
    // Secondary layers - keep minimal, push detail to Structure_Guide
    for (let i = 1; i < validLayers.length; i++) {
      const layer = validLayers[i];
      const layerId = layer.id || `obj${i + 1}`;
      // Only add brief mention of secondary motion if there's actual movement
      const kf0 = (layer.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 25 };
      const kf1 = (layer.kf ?? []).find((k: any) => k.t === 1) ?? kf0;
      const hasMotion = Math.abs(kf1.x - kf0.x) > 5 || Math.abs(kf1.y - kf0.y) > 5 || Math.abs(kf1.w - kf0.w) > 5;
      if (hasMotion) {
        parts[parts.length - 1] += `; ${layerId}: subtle movement`;
      }
    }
  }
  
  return parts.join(", ");
}

interface LayerMarkers {
  look: string;
  shapeDesc: string;
  ext: string;
  costume: string;
  accessory: string;
  prop: string;
  action: string;
  pose: string;
  expression: string;
  emotion: string;
  status: string;
  detail: string;
}

function extractLayerMarkers(notes: string): LayerMarkers {
  return {
    look: "",
    shapeDesc: "",
    ext: "",
    costume: mark(notes, "costume"),
    accessory: mark(notes, "accessory"),
    prop: mark(notes, "prop"),
    action: mark(notes, "action"),
    pose: mark(notes, "pose"),
    expression: mark(notes, "expression"),
    emotion: mark(notes, "emotion"),
    status: mark(notes, "status"),
    detail: mark(notes, "detail"),
  };
}

function buildSubjectSegments(validLayers: any[], seg: Array<string | null>, sceneNotes?: string): void {
  // V3.2 Fallback: if no valid layers, try to extract subject info from scene notes directly
  if (validLayers.length === 0 && sceneNotes) {
    const lookFromNotes = mark(sceneNotes, "look");
    const detailFromNotes = mark(sceneNotes, "detail");
    
    if (lookFromNotes) {
      seg[3] = lookFromNotes;
    }
    if (detailFromNotes) {
      seg[8] = detailFromNotes;
    }
    return;
  }
  
  if (validLayers.length === 0) return;
  
  const firstLayer = validLayers[0];
  const kf0 = (firstLayer.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
  const posPhrase = positionPhrase(kf0.x, kf0.y, kf0.w);
  
  const lm: LayerMarkers = {
    look: firstLayer.look ?? "",
    shapeDesc: firstLayer.shapeDesc ?? "",
    ext: firstLayer.externalPrompt ?? "",
    costume: mark(firstLayer.notes ?? "", "costume"),
    accessory: mark(firstLayer.notes ?? "", "accessory"),
    prop: mark(firstLayer.notes ?? "", "prop"),
    action: mark(firstLayer.notes ?? "", "action"),
    pose: mark(firstLayer.notes ?? "", "pose"),
    expression: mark(firstLayer.notes ?? "", "expression"),
    emotion: mark(firstLayer.notes ?? "", "emotion"),
    status: mark(firstLayer.notes ?? "", "status"),
    detail: mark(firstLayer.notes ?? "", "detail"),
  };
  
  // V3.2: Build natural language subject description
  // Combine look + costume + action into flowing sentences where possible
  
  // 4 SUBJECT_BASE - main subject identity
  const baseParts = [lm.look, lm.shapeDesc, lm.ext].filter(Boolean);
  if (baseParts.length) {
    seg[3] = `${baseParts.join(", ")}, ${posPhrase}`;
  }
  
  // 5 SUBJECT_COSTUME - merge with base if simple
  if (lm.costume) {
    // If costume is simple, prepend to base for natural flow
    const costumeSimple = lm.costume.length < 60;
    if (costumeSimple && seg[3]) {
      seg[3] = `${seg[3]}, wearing ${lm.costume}`;
    } else {
      seg[4] = lm.costume;
    }
  }
  
  // 6 SUBJECT_PROPS - accessories and props
  const propParts = [lm.accessory, lm.prop].filter(Boolean);
  if (propParts.length) seg[5] = propParts.join(", ");
  
  // 7 SUBJECT_ACTION - combine action + pose naturally
  const actionStr = lm.action ? (ACTION_MAP[lm.action] ?? lm.action) : "";
  const poseStr = lm.pose ? (POSE_MAP[lm.pose] ?? lm.pose) : "";
  
  // V3.2: Merge action with pose for natural flow
  if (actionStr && poseStr) {
    seg[6] = `${actionStr}, ${poseStr}`;
  } else if (actionStr) {
    seg[6] = actionStr;
  } else if (poseStr) {
    seg[6] = poseStr;
  }
  
  // 8 SUBJECT_STATE - expression and emotion
  const exprStr = lm.expression ? (EXPR_MAP[lm.expression] ?? lm.expression) : "";
  const stateParts = [exprStr, lm.emotion, lm.status].filter(Boolean);
  if (stateParts.length) seg[7] = stateParts.join(", ");
  
  // 9 SUBJECT_DETAIL
  if (lm.detail) seg[8] = lm.detail;
  
  // V3.3: Multi-object handling with clearer hierarchy
  // Primary subject gets full description, secondary objects are concise context
  if (validLayers.length > 1) {
    const secondaryPhrases: string[] = [];
    
    for (let i = 1; i < validLayers.length; i++) {
      const l = validLayers[i];
      const k0 = (l.kf ?? []).find((k: any) => k.t === 0) ?? { x: 50 + i * 20, y: 50, w: 20 };
      const pos2 = positionPhrase(k0.x, k0.y, k0.w);
      
      const look2 = l.look ?? "";
      const ext2 = l.externalPrompt ?? "";
      const costume2 = mark(l.notes ?? "", "costume");
      const prop2 = mark(l.notes ?? "", "prop");
      
      // Build concise but natural secondary object phrase
      let objDesc = look2;
      
      // Add external prompt if present and meaningful
      if (ext2 && ext2.length > 3) {
        objDesc += `, ${ext2}`;
      }
      
      // Costume: only add if not redundant and adds value
      if (costume2) {
        const lookLower = look2.toLowerCase();
        const costumeLower = costume2.toLowerCase();
        const isRedundant = 
          lookLower.includes(costumeLower) ||
          (costumeLower.includes("gown") && lookLower.includes("gown")) ||
          (costumeLower.includes("dress") && lookLower.includes("dress")) ||
          (costumeLower.includes("suit") && lookLower.includes("suit"));
        if (!isRedundant) {
          objDesc += `, dressed in ${costume2}`;
        }
      }
      
      // Props: integrate naturally as comma-separated list
      if (prop2) {
        objDesc += `, ${prop2}`;
      }
      
      secondaryPhrases.push(`${objDesc} — ${pos2}`);
    }
    
    // Connect secondary objects with em-dash for cleaner visual separation
    if (secondaryPhrases.length > 0 && seg[3]) {
      seg[3] = `${seg[3]} — ${secondaryPhrases.join("; ")}`;
    }
  }
}

function buildCompositionSegment(validLayers: any[], aspectRatio?: string): string | null {
  const parts: string[] = [];
  
  if (validLayers.length === 1) {
    const kf0 = ((validLayers[0] as any).kf ?? []).find((k: any) => k.t === 0) ?? { x: 50, y: 50, w: 30 };
    if (kf0.x >= 40 && kf0.x <= 60) {
      parts.push("perfect centered composition, clean negative space");
    } else {
      parts.push("off-center composition, clean negative space");
    }
  }
  
  if (aspectRatio && aspectRatio !== "16:9") {
    parts.push(`${aspectRatio} aspect ratio`);
  }
  
  return parts.join(", ") || null;
}

function buildLightingSegment(f: ResolvedFields): string | null {
  const parts: string[] = [];
  if (f.keyTimeFinal) parts.push(KEY_TIME[f.keyTimeFinal] ?? f.keyTimeFinal);
  if (f.keyDir.value) parts.push(`${f.keyDir.value} key light`);
  if (f.keyMood.value) parts.push(`${f.keyMood.value} mood`);
  if (f.colorTemp.value) parts.push(COLOR_TEMP[f.colorTemp.value] ?? f.colorTemp.value);
  if (f.specLightFinal) parts.push(SPEC_LIGHT[f.specLightFinal] ?? f.specLightFinal);
  return parts.filter(Boolean).join(", ") || null;
}

function buildEnvironmentSegment(f: ResolvedFields): string | null {
  if (f.bgPreset.value) {
    return BG[f.bgPreset.value] ?? f.bgPreset.value;
  }
  return null;
}

function buildMoodSegment(f: ResolvedFields): string | null {
  const parts: string[] = [];
  if (f.envMood.value) parts.push(ENV_MOOD[f.envMood.value] ?? f.envMood.value);
  if (f.narrative.value) parts.push(NARRATIVE[f.narrative.value] ?? f.narrative.value);
  if (f.tension.value) {
    const tensionStr = TENSION[f.tension.value] ?? "";
    if (tensionStr) parts.push(tensionStr);
  }
  return parts.filter(Boolean).join(", ") || null;
}

function buildTechnicalSegment(f: ResolvedFields, mediaMode: "image" | "video"): string {
  const parts: string[] = [];
  
  if (f.colorGrade.value) {
    const gradeStr = GRADE[f.colorGrade.value] ?? f.colorGrade.value;
    if (gradeStr) parts.push(gradeStr);
  }
  
  if (f.filmLook.value) {
    const lookStr = FILM_LOOK[f.filmLook.value] ?? f.filmLook.value;
    if (lookStr) parts.push(lookStr);
  }
  
  if (f.postProcess.value) parts.push(f.postProcess.value);
  
  parts.push(qualitySuffix(f.renderStyle.value, mediaMode));
  
  return parts.filter(Boolean).join(", ");
}

// ── Main compiler ──────────────────────────────────────────────────────────
export function compileV3(input: V3Input): string {
  const { scene, lang, mediaMode, aspectRatio } = input;
  const n = scene.notes ?? "";
  const cam = (scene as any).camera ?? {};
  const lighting = (scene as any).lighting ?? {};
  const layers = ((scene as any).layers ?? []) as any[];
  
  const validLayers = layers.filter((l) => l && (l.look || l.externalPrompt || l.notes));
  
  const f = resolveAllFields(scene, n, cam, lighting);
  
  const seg: Array<string | null> = new Array(14).fill(null);
  
  seg[0] = buildStyleSegment(f);
  seg[1] = buildCameraSegment(f);
  
  if (mediaMode === "video") {
    seg[2] = buildMotionSegment(f, validLayers);
  }
  
  buildSubjectSegments(validLayers, seg, n);
  seg[9] = buildCompositionSegment(validLayers, aspectRatio);
  seg[10] = buildLightingSegment(f);
  seg[11] = buildEnvironmentSegment(f);
  seg[12] = buildMoodSegment(f);
  seg[13] = buildTechnicalSegment(f, mediaMode);
  
  const mainOutput = seg.filter(Boolean).join(",\n");
  
  const includeStructureGuide = mark(n, "include_structure_guide") === "true";
  if (includeStructureGuide) {
    const structureGuide = buildStructureGuide(scene, lang, mediaMode);
    if (structureGuide) {
      return `${mainOutput}\n[Structure_Guide]: ${structureGuide}`;
    }
  }
  
  return mainOutput;
}
