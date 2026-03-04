export type SceneTier = "indoor" | "small_plaza" | "open_space";

export type CombatPatchProfile = {
  far_threshold_height_pct: number;
  background_density: "low" | "medium" | "high";
  anti_director_strength: "low" | "medium" | "strong";
};

export type CombatPatchList = {
  version: string;
  description: string;
  profiles: Record<SceneTier, CombatPatchProfile>;
};

export const COMBAT_PATCH_LIST: CombatPatchList = {
  version: "1.0.0",
  description: "Combat prototype patch list for V2 prompt post-processing.",
  profiles: {
    indoor: {
      far_threshold_height_pct: 0.12,
      background_density: "low",
      anti_director_strength: "low",
    },
    small_plaza: {
      far_threshold_height_pct: 0.08,
      background_density: "medium",
      anti_director_strength: "medium",
    },
    open_space: {
      far_threshold_height_pct: 0.05,
      background_density: "high",
      anti_director_strength: "strong",
    },
  },
};
