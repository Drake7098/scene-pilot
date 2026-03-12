export type LightingProfileId =
  | "natural_skin_readability"
  | "low_key_edge_separation"
  | "rim_scale_separation"
  | "action_path_readability"
  | "soft_layered_breathing"
  | "premium_focal_highlights";

export type LightingProfile = {
  id: LightingProfileId;
  promptZh: string;
  promptEn: string;
  runwayZh: string;
  runwayEn: string;
  falZh: string;
  falEn: string;
};

export const LIGHTING_PROFILES: LightingProfile[] = [
  {
    id: "natural_skin_readability",
    promptZh: "光照语言：自然主光贴近人物皮肤与表情，优先脸部、眼神和关系细节可读。",
    promptEn: "Lighting language: keep the natural key close to skin, face, and expression readability.",
    runwayZh: "人物表情和皮肤可读优先，避免用夸张阴影盖掉反应。",
    runwayEn: "Keep face and skin readability high; avoid dramatic shadow that hides reactions.",
    falZh: "优先皮肤、面部和眼神细节的可读性，不要让高对比抢掉人物关系。",
    falEn: "Prioritize skin, face, and eyeline readability over aggressive contrast."
  },
  {
    id: "low_key_edge_separation",
    promptZh: "光照语言：低调对比、边缘分离、暗部保留结构，不要一味压黑。",
    promptEn: "Lighting language: use low-key contrast with readable edge separation and structured shadows.",
    runwayZh: "保持低调压光，但主体轮廓和空间边缘必须可读。",
    runwayEn: "Maintain low-key pressure, but keep subject contour and spatial edge separation readable.",
    falZh: "用低调对比建立压迫感，同时保住主体轮廓和空间层次。",
    falEn: "Build pressure with low-key contrast while preserving subject contour and spatial layers."
  },
  {
    id: "rim_scale_separation",
    promptZh: "光照语言：边缘光、轮廓高光或结构反光优先，用来拉开主体与大环境的尺度分离。",
    promptEn: "Lighting language: favor rim light and structural highlights to separate the subject from scale-heavy environments.",
    runwayZh: "优先轮廓高光和结构反光，让主体从大尺度环境里清楚跳出来。",
    runwayEn: "Use rim highlights and structural reflections to pull the subject cleanly out of large environments.",
    falZh: "强调边缘光和结构反光，让主体、材质和空间骨架清楚分离。",
    falEn: "Emphasize rim light and structural reflections to separate subject, materials, and spatial skeleton."
  },
  {
    id: "action_path_readability",
    promptZh: "光照语言：优先动作路径和方向可读，不让阴影、雾或高光遮掉运动线。",
    promptEn: "Lighting language: keep motion path and directional action readable without burying it in shadow or glare.",
    runwayZh: "光要服务动作方向和运动线，不能把推进路径压没。",
    runwayEn: "Light should support action direction and motion paths, not obscure them.",
    falZh: "让动作、身体语言和方向关系清楚，不要用过重光影干扰读图。",
    falEn: "Keep body language and directional spacing clear instead of over-stylizing with heavy light."
  },
  {
    id: "soft_layered_breathing",
    promptZh: "光照语言：柔和、层次细、呼吸感强，保留留白和空气感，避免硬切式高反差。",
    promptEn: "Lighting language: keep the light soft, layered, and breathable, with room for negative space.",
    runwayZh: "用柔和分层光保留空间呼吸感，不要突然拉高对比。",
    runwayEn: "Use soft layered light to preserve breathing room instead of snapping into hard contrast.",
    falZh: "让光照保持柔和层次和留白，不要让高反差破坏情绪流动。",
    falEn: "Keep the light soft and layered so negative space and emotional flow stay intact."
  },
  {
    id: "premium_focal_highlights",
    promptZh: "光照语言：主光和高光都要服务重点信息，让主体、材质和卖点一眼可见。",
    promptEn: "Lighting language: use key light and premium highlights to make the focal subject and material finish read immediately.",
    runwayZh: "用清楚主光和高光快速建立焦点，不要拖泥带水。",
    runwayEn: "Use clear key light and premium highlights to establish the focal beat immediately.",
    falZh: "保证主体、材质和卖点高可读，优先焦点层级和商业完成度。",
    falEn: "Maximize focal hierarchy, material readability, and commercial polish."
  }
];

const LIGHTING_PROFILE_MAP = new Map(LIGHTING_PROFILES.map((item) => [item.id, item]));

export function getLightingProfile(id: LightingProfileId | string | null | undefined) {
  if (!id) return null;
  return LIGHTING_PROFILE_MAP.get(id as LightingProfileId) ?? null;
}

