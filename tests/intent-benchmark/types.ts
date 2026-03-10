export type SplitName =
  | "basic"
  | "extended"
  | "noise"
  | "professional"
  | "adversarial"
  | "longtail";

export type GoalLabel = "poster" | "storyframe" | "ad" | "portrait" | "scene" | "unknown";
export type RatioLabel = "1:1" | "16:9" | "9:16";
export type FramingLabel = "center" | "left" | "right" | "balanced";
export type DensityLabel = "clean" | "normal" | "rich";
export type MediaLabel = "image" | "video";
export type TimeOfDayLabel = "day" | "night" | "indoor" | "unknown";

export type ExpectedShape = {
  mediaType: MediaLabel;
  goal: GoalLabel;
  ratio: RatioLabel;
  subjectCount: number;
  primarySubjectType: string;
  framing: FramingLabel;
  backgroundDensity: DensityLabel;
  location: string;
  style: {
    genre: string;
    lighting: string;
  };
  scene: {
    timeOfDay: TimeOfDayLabel;
  };
};

export type BenchmarkCase = {
  id: string;
  split: SplitName;
  lang: "zh" | "en";
  brief: string;
  expected: ExpectedShape;
};

export type FieldMetric = {
  field: string;
  weight: number;
  accuracy: number;
  correct: number;
  total: number;
};

export type EvalSummary = {
  parserMode: string;
  datasetPath: string;
  totalCases: number;
  overallScore: number;
  weightedAccuracy: number;
  fieldMetrics: FieldMetric[];
  topFailures: Array<{ key: string; count: number }>;
  confusion: Record<string, Record<string, number>>;
  splitScores: Record<string, number>;
};
