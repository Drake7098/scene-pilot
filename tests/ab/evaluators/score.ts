import type { ScoreRecord } from "./schema.js";

export function isScoreUsable(record: ScoreRecord): boolean {
  return record.isUsable || record.usabilityScore >= 4;
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}
