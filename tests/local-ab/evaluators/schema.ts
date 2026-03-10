export type LocalTool = "drawthings" | "comfyui";
export type PromptMode = "plain" | "structured";

export type ImageScoreRecord = {
  caseId: string;
  title: string;
  tool: LocalTool;
  promptMode: PromptMode;
  modelName: string;
  seed: number;
  imagePath: string;
  completionScore: number;
  compositionScore: number;
  semanticMatchScore: number;
  usabilityScore: number;
  isUsable: boolean;
  notes: string;
};

export type LocalAbSummary = {
  totals: {
    scoredImages: number;
    drawThingsRuns: number;
    comfyUiRuns: number;
  };
  promptModes: Record<PromptMode, {
    usableRate: number;
    averageUsability: number;
  }>;
  tools: Record<LocalTool, {
    usableRate: number;
    averageUsability: number;
  }>;
  categories: Record<string, {
    plainUsableRate: number;
    structuredUsableRate: number;
    lift: number;
  }>;
  topLiftCases: string[];
  unstableCases: string[];
};
