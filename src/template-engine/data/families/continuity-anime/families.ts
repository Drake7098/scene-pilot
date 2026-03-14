/**
 * Anime continuity families - 20 × 5 = 100 templates.
 */

import type { ContinuityVariantAnime } from "../../../types/templateTypes";

export const ANIME_VARIANTS: ContinuityVariantAnime[] = [
  "starter",
  "vertical_short",
  "battle_motion",
  "cinematic_anime",
  "advanced_continuity"
];

export const ANIME_VARIANT_LABELS: Record<ContinuityVariantAnime, { zh: string; en: string }> = {
  starter: { zh: "起步版", en: "Starter" },
  vertical_short: { zh: "竖版短视频", en: "Vertical Short" },
  battle_motion: { zh: "对战动作", en: "Battle Motion" },
  cinematic_anime: { zh: "电影感动漫", en: "Cinematic Anime" },
  advanced_continuity: { zh: "高级连续", en: "Advanced Continuity" }
};

export type AnimeFamily = {
  id: string;
  nameEn: string;
  nameZh: string;
};

export const ANIME_FAMILIES: AnimeFamily[] = [
  { id: "daily_dialogue_anime", nameEn: "Daily Dialogue", nameZh: "日常对话连续" },
  { id: "school_corridor_anime", nameEn: "School Corridor", nameZh: "校园走廊连续" },
  { id: "rooftop_dialogue_anime", nameEn: "Rooftop Dialogue", nameZh: "屋顶对话连续" },
  { id: "protagonist_entrance_anime", nameEn: "Protagonist Entrance", nameZh: "主角出场连续" },
  { id: "hype_prep_anime", nameEn: "Hype Prep", nameZh: "热血准备连续" },
  { id: "sprint_jump_anime", nameEn: "Sprint/Jump", nameZh: "冲刺/跳跃连续" },
  { id: "skill_release_anime", nameEn: "Skill Release", nameZh: "技能释放连续" },
  { id: "burst_closeup_anime", nameEn: "Burst Closeup", nameZh: "爆发特写连续" },
  { id: "battle_standoff_anime", nameEn: "Battle Standoff", nameZh: "对战对峙连续" },
  { id: "squad_formation_anime", nameEn: "Squad Formation", nameZh: "小队站位连续" },
  { id: "night_city_anime", nameEn: "Night City", nameZh: "夜景城市连续" },
  { id: "magic_cast_anime", nameEn: "Magic Cast", nameZh: "魔法施法连续" },
  { id: "sword_draw_anime", nameEn: "Sword Draw", nameZh: "剑拔弩张连续" },
  { id: "expression_change_anime", nameEn: "Expression Change", nameZh: "表情变化连续" },
  { id: "bg_switch_anime", nameEn: "Background Switch", nameZh: "背景切换连续" },
  { id: "manga_panel_anime", nameEn: "Manga Panel", nameZh: "漫画分镜连续" },
  { id: "hype_peak_anime", nameEn: "Hype Peak", nameZh: "热血高潮连续" },
  { id: "flashback_transition_anime", nameEn: "Flashback Transition", nameZh: "回忆过渡连续" },
  { id: "villain_pressure_anime", nameEn: "Villain Pressure", nameZh: "反派压迫连续" },
  { id: "ending_wrap_anime", nameEn: "Ending Wrap", nameZh: "片尾收束连续" }
];
