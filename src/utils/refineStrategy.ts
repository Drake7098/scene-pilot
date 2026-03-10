export type RefineStrategy = {
  mode: "rebuild" | "patch" | "polish" | "deliver";
  summary: string;
};

export function deriveRefineStrategy(score: number, feedbackText: string): RefineStrategy {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const feedback = feedbackText.trim();
  if (s <= 39) {
    return {
      mode: "rebuild",
      summary: feedback || "Direction is off. Rebuild composition, subject relation, and scene anchors."
    };
  }
  if (s <= 69) {
    return {
      mode: "patch",
      summary: feedback || "Direction is usable. Patch object placement, hierarchy, and prompt constraints."
    };
  }
  if (s <= 89) {
    return {
      mode: "polish",
      summary: feedback || "Core result works. Polish lighting, style consistency, and details."
    };
  }
  return {
    mode: "deliver",
    summary: feedback || "Result is delivery-ready. Keep only minor touch-ups if needed."
  };
}
