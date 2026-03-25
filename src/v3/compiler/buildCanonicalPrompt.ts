/**
 * buildCanonicalPrompt
 * 
 * Wraps compileV3 output with structured metadata
 * Creates intermediate format for platform adaptation
 * 
 * Does NOT modify compileV3 - only reads its output and input metadata
 */

import type { Scene } from "../../model";
import type { Lang } from "../../i18n";
import { compileV3 } from "../../utils/compileV3";
import type {
  CanonicalPrompt,
  CanonicalObject,
  CanonicalCamera,
  CanonicalLighting,
  CanonicalComposition,
  CanonicalMotion,
  CanonicalStyle,
  CanonicalEnvironment,
  CanonicalTechnical,
} from "../types/canonicalPrompt";

// ── Helper: extract marker from notes ──────────────────────────────────────
function mark(notes: string, key: string): string {
  const line = (notes ?? "").split("\n").find(l => l.trim().startsWith(key + ":"));
  return line ? line.trim().slice(key.length + 1).trim() : "";
}

// ── Helper: determine object role from layer notes ─────────────────────────
function determineObjectRole(layerNotes: string, index: number): CanonicalObject["role"] {
  if (layerNotes.includes("role:primary")) return "primary";
  if (layerNotes.includes("role:foreground")) return "foreground";
  if (layerNotes.includes("role:background")) return "background";
  if (index === 0) return "primary"; // Default first layer is primary
  return "secondary";
}

// ── Helper: parse position from keyframe ───────────────────────────────────
function parsePosition(kf: any): { position?: string; size?: string } {
  if (!kf) return {};
  
  const x = kf.x ?? 50;
  const y = kf.y ?? 50;
  const w = kf.w ?? 30;
  
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
    
  return {
    position: `${h}, ${v}-frame`,
    size: prominence,
  };
}

// ── Main builder ───────────────────────────────────────────────────────────
export interface BuildCanonicalInput {
  scene: Scene;
  lang: Lang;
  mediaMode: "image" | "video";
  aspectRatio?: string;
}

export function buildCanonicalPrompt(input: BuildCanonicalInput): CanonicalPrompt {
  const { scene, lang, mediaMode, aspectRatio } = input;
  const notes = scene.notes ?? "";
  const layers = ((scene as any).layers ?? []) as any[];
  
  // Step 1: Get base prompt from compileV3 (unchanged)
  const basePrompt = compileV3(input);
  
  // Step 2: Extract structure guide if enabled
  const includeStructureGuide = mark(notes, "include_structure_guide") === "true";
  let structureGuide: string | undefined;
  
  if (includeStructureGuide && layers.length > 0) {
    const validLayers = layers.filter(l => l && (l.look || l.externalPrompt || l.notes));
    if (validLayers.length > 0) {
      const lines: string[] = [];
      lines.push(`Objects: ${validLayers.length}`);
      
      if (validLayers.length === 1) {
        const pos = parsePosition((validLayers[0].kf ?? [])[0]);
        lines.push(`Spatial: single subject ${pos.position}`);
      } else {
        const positions = validLayers.map((l, i) => {
          const kf = (l.kf ?? [])[0] ?? { x: 50 + i * 10, y: 50, w: 25 };
          return `${l.id || `obj${i + 1}`}:${kf.x < 50 ? 'L' : 'R'}`;
        });
        lines.push(`Spatial: ${positions.join(", ")}`);
      }
      
      if (mediaMode === "video") {
        const motionLines = validLayers
          .map((l, i) => {
            const kf0 = (l.kf ?? []).find((k: any) => k.t === 0);
            const kf1 = (l.kf ?? []).find((k: any) => k.t === 1);
            if (!kf0 || !kf1) return null;
            
            const dx = Math.round((kf1.x - kf0.x) * 10) / 10;
            const dy = Math.round((kf1.y - kf0.y) * 10) / 10;
            
            if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return null;
            
            const horizontal = Math.abs(dx) >= 4 ? (dx > 0 ? "right" : "left") : "";
            const vertical = Math.abs(dy) >= 4 ? (dy > 0 ? "down" : "up") : "";
            const path = [horizontal, vertical].filter(Boolean).join("-");
            
            return `${l.id || `obj${i + 1}`}:moves ${path || "static"}`;
          })
          .filter(Boolean) as string[];
        
        if (motionLines.length > 0) {
          lines.push(`Motion: ${motionLines.join("; ")}`);
        }
      }
      
      structureGuide = lines.join(" | ");
    }
  }
  
  // Step 3: Parse objects from layers
  const objects: CanonicalObject[] = [];
  
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    if (!l || (!l.look && !l.externalPrompt && !l.notes)) continue;
    
    const kf0 = (l.kf ?? []).find((k: any) => k.t === 0);
    const posInfo = parsePosition(kf0);
    
    const obj: CanonicalObject = {
      name: l.id || l.name || `object_${i + 1}`,
      role: determineObjectRole(l.notes ?? "", i),
      position: posInfo.position,
      size: posInfo.size,
      look: l.look ?? "",
      costume: mark(l.notes ?? "", "costume") || undefined,
      props: [],
      action: mark(l.notes ?? "", "action") || mark(l.notes ?? "", "pose") || undefined,
      state: mark(l.notes ?? "", "expression") || mark(l.notes ?? "", "emotion") || undefined,
      detail: mark(l.notes ?? "", "detail") || undefined,
      externalPrompt: l.externalPrompt || undefined,
    };
    
    // Collect props
    const accessory = mark(l.notes ?? "", "accessory");
    const prop = mark(l.notes ?? "", "prop");
    if (accessory) obj.props!.push(accessory);
    if (prop) obj.props!.push(prop);
    if (obj.props!.length === 0) obj.props = undefined;
    
    objects.push(obj);
  }
  
  // Step 4: Parse camera settings
  const camera: CanonicalCamera = {
    shot: mark(notes, "shot_size") || (scene as any).camera?.shot || undefined,
    lens: mark(notes, "focal_length") || undefined,
    angle: mark(notes, "cam_angle") || undefined,
    dof: mark(notes, "depth_of_field") || undefined,
    movement: mark(notes, "cam_movement") || (scene as any).camera?.movement || undefined,
    durationSec: mediaMode === "video" ? Math.max(1, Math.round(Number(scene.duration_s) || 5)) : undefined,
  };
  
  // Step 5: Parse lighting settings
  const lightingRaw = (scene as any).lighting ?? {};
  const specLight = mark(notes, "spec_light");
  
  const lighting: CanonicalLighting = {
    time: mark(notes, "key_light_time") || lightingRaw.time || undefined,
    direction: mark(notes, "key_light_dir") || lightingRaw.key_dir || undefined,
    mood: mark(notes, "key_light_mood") || lightingRaw.mood || undefined,
    colorTemp: mark(notes, "color_temp") || undefined,
    specialEffects: specLight ? [specLight] : undefined,
  };
  
  // Step 6: Parse composition
  const composition: CanonicalComposition = {
    aspectRatio: aspectRatio || "16:9",
    framing: objects.length === 1 ? "single subject focus" : "multi-object composition",
  };
  
  // Step 7: Parse motion (video only)
  let motion: CanonicalMotion | undefined;
  
  if (mediaMode === "video" && objects.length > 0) {
    motion = {
      description: `over ${camera.durationSec} seconds`,
    };
    
    // Extract motion paths if keyframes exist
    const primaryObj = objects.find(o => o.role === "primary") ?? objects[0];
    const primaryLayer = layers.find(l => l.id === primaryObj.name);
    
    if (primaryLayer) {
      const kf0 = (primaryLayer.kf ?? []).find((k: any) => k.t === 0);
      const kf1 = (primaryLayer.kf ?? []).find((k: any) => k.t === 1);
      
      if (kf0 && kf1) {
        const dx = kf1.x - kf0.x;
        const dy = kf1.y - kf0.y;
        const dw = kf1.w - kf0.w;
        
        const parts: string[] = [];
        if (Math.abs(dx) > 5) parts.push(dx > 0 ? "right" : "left");
        if (Math.abs(dy) > 5) parts.push(dy > 0 ? "down" : "up");
        if (dw > 8) parts.push("push in");
        if (dw < -8) parts.push("pull back");
        
        if (parts.length > 0) {
          motion.primaryPath = parts.join(" ");
        }
      }
    }
  }
  
  // Step 8: Parse style
  const style: CanonicalStyle = {
    renderStyle: mark(notes, "render_style") || undefined,
    directorPack: mark(notes, "director_pack") || undefined,
    colorGrade: mark(notes, "color_grade") || undefined,
    filmLook: mark(notes, "film_look") || undefined,
  };
  
  // Step 9: Parse environment
  const environment: CanonicalEnvironment = {
    background: mark(notes, "bg_preset") || undefined,
    mood: mark(notes, "env_mood") || undefined,
  };
  
  // Step 10: Parse technical
  const technical: CanonicalTechnical = {
    quality: mediaMode === "video" ? "8K cinematic" : "8K photography",
    postProcess: mark(notes, "post_process") || undefined,
  };
  
  // Build final canonical prompt
  const canonical: CanonicalPrompt = {
    basePrompt,
    media: mediaMode,
    objects,
    camera: Object.keys(camera).some(k => camera[k as keyof CanonicalCamera]) ? camera : undefined,
    lighting: Object.keys(lighting).some(k => lighting[k as keyof CanonicalLighting]) ? lighting : undefined,
    composition,
    motion,
    style: Object.keys(style).some(k => style[k as keyof CanonicalStyle]) ? style : undefined,
    environment: Object.keys(environment).some(k => environment[k as keyof CanonicalEnvironment]) ? environment : undefined,
    technical,
    structureGuide,
  };
  
  return canonical;
}
