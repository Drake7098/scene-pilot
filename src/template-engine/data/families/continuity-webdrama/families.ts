/**
 * Webdrama continuity families - 20 × 5 = 100 templates.
 */

import type { ContinuityVariantWebdrama } from "../../../types/templateTypes";

export const WEBDRAMA_VARIANTS: ContinuityVariantWebdrama[] = [
  "starter",
  "close_emotion",
  "multi_angle",
  "high_tension",
  "advanced_continuity"
];

export const WEBDRAMA_VARIANT_LABELS: Record<ContinuityVariantWebdrama, { zh: string; en: string }> = {
  starter: { zh: "起步版", en: "Starter" },
  close_emotion: { zh: "情绪特写", en: "Close Emotion" },
  multi_angle: { zh: "多角度", en: "Multi Angle" },
  high_tension: { zh: "高张力", en: "High Tension" },
  advanced_continuity: { zh: "高级连续", en: "Advanced Continuity" }
};

export type WebdramaFamily = {
  id: string;
  nameEn: string;
  nameZh: string;
};

export const WEBDRAMA_FAMILIES: WebdramaFamily[] = [
  { id: "indoor_duo_continuity", nameEn: "Indoor Duo Dialogue", nameZh: "室内双人对话连续" },
  { id: "restaurant_bar_continuity", nameEn: "Restaurant/Bar Dialogue", nameZh: "餐厅/酒吧对话连续" },
  { id: "street_encounter_continuity", nameEn: "Street Encounter", nameZh: "街头相遇连续" },
  { id: "corridor_tracking_continuity", nameEn: "Corridor Tracking", nameZh: "走廊跟拍连续" },
  { id: "elevator_door_continuity", nameEn: "Elevator/Door Short", nameZh: "电梯/门口短剧连续" },
  { id: "turn_stop_approach_continuity", nameEn: "Turn/Stop/Approach", nameZh: "回头/停步/靠近连续" },
  { id: "sit_stand_continuity", nameEn: "Sit/Stand", nameZh: "坐下/起身连续" },
  { id: "handoff_continuity", nameEn: "Receive/Handoff Object", nameZh: "接物/递物连续" },
  { id: "emotional_confrontation_continuity", nameEn: "Emotional Confrontation", nameZh: "情绪对峙连续" },
  { id: "sudden_turn_continuity", nameEn: "Sudden Turn", nameZh: "突发转折连续" },
  { id: "chase_enter_continuity", nameEn: "Chase Enter", nameZh: "追逐进入连续" },
  { id: "multi_cam_dialogue_continuity", nameEn: "Multi-Cam Dialogue", nameZh: "多机位对话连续" },
  { id: "pov_continuity", nameEn: "POV Continuity", nameZh: "POV 主视角连续" },
  { id: "reversal_reveal_continuity", nameEn: "Reversal Reveal", nameZh: "反转揭示连续" },
  { id: "office_negotiation_continuity", nameEn: "Office Negotiation", nameZh: "办公室谈判连续" },
  { id: "night_city_continuity", nameEn: "Night City", nameZh: "夜景都市连续" },
  { id: "outdoor_tracking_continuity", nameEn: "Outdoor Tracking", nameZh: "室外追踪连续" },
  { id: "crime_tension_continuity", nameEn: "Crime Tension", nameZh: "黑帮/犯罪张力连续" },
  { id: "emotional_outburst_continuity", nameEn: "Emotional Outburst", nameZh: "情感爆发连续" },
  { id: "short_end_twist_continuity", nameEn: "Short End Twist", nameZh: "短剧结尾反转连续" }
];
