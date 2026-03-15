/**
 * Prompt Batch Test v2 - Enhanced rule check
 * ok / warn / fail + warn_reasons + length_bucket
 */

import { splitMachineNotes } from "../../src/utils/promptTail";

export type CheckResult = "ok" | "warn" | "fail";

export type WarnReason =
  | "warn_length_short"
  | "warn_length_long"
  | "warn_missing_camera"
  | "warn_missing_style"
  | "warn_missing_subject"
  | "warn_missing_layout"
  | "warn_missing_machine_tail"
  | "warn_layout_heavy"
  | "warn_machine_heavy"
  | "warn_continuity_heavy"
  | "warn_unknown";

export type LengthBucket =
  | "empty"
  | "under_50"
  | "50_500"
  | "500_1000"
  | "1000_2000"
  | "over_2000";

export type CheckDetail = {
  rule: string;
  result: CheckResult;
  message?: string;
};

export type CheckOutput = {
  result: CheckResult;
  details: CheckDetail[];
  warnReasons: WarnReason[];
  lengthBucket: LengthBucket;
};

const MIN_LEN = 20;
const MAX_LEN = 8000;
const WARN_MIN = 50;
const WARN_MAX = 4000;
const LAYOUT_HEAVY_RATIO = 0.45;
const MACHINE_HEAVY_RATIO = 0.55;

function getLengthBucket(len: number): LengthBucket {
  if (len <= 0) return "empty";
  if (len < 50) return "under_50";
  if (len <= 500) return "50_500";
  if (len <= 1000) return "500_1000";
  if (len <= 2000) return "1000_2000";
  return "over_2000";
}

export function checkPrompt(prompt: string): CheckOutput {
  const details: CheckDetail[] = [];
  const warnReasons: WarnReason[] = [];
  const lower = prompt.toLowerCase();

  // empty
  if (!prompt.trim()) {
    details.push({ rule: "prompt_empty", result: "fail", message: "Prompt is empty" });
    return {
      result: "fail",
      details,
      warnReasons: [],
      lengthBucket: "empty",
    };
  }

  const len = prompt.length;
  const lengthBucket = getLengthBucket(len);

  // length checks
  if (len < MIN_LEN) {
    details.push({ rule: "length_short", result: "fail", message: `Length ${len} < ${MIN_LEN}` });
  } else if (len < WARN_MIN) {
    details.push({ rule: "length_short", result: "warn", message: `Length ${len} < ${WARN_MIN}` });
    warnReasons.push("warn_length_short");
  }
  if (len > MAX_LEN) {
    details.push({ rule: "length_long", result: "fail", message: `Length ${len} > ${MAX_LEN}` });
  } else if (len > WARN_MAX) {
    details.push({ rule: "length_long", result: "warn", message: `Length ${len} > ${WARN_MAX}` });
    warnReasons.push("warn_length_long");
  }

  // 1. camera: camera / shot / lens / angle
  const hasCamera =
    /\bcamera\b|\bshot\b|\blens\b|\bangle\b|镜头|景别|movement|运动|wide|medium|close|pan|push|pull/i.test(lower) ||
    /layout contract|t0 frame|t1 frame/i.test(lower);
  if (!hasCamera) {
    details.push({ rule: "camera", result: "warn", message: "No camera/shot/lens/angle terms" });
    warnReasons.push("warn_missing_camera");
  }

  // 2. subject: subject / character / product
  const hasSubject =
    /\bsubject\b|\bcharacter\b|\bproduct\b|主体|对象|人物|产品/i.test(lower) ||
    /\blayer\d*\b|object|对象/i.test(lower) ||
    /region|区域|position|位置/i.test(lower);
  if (!hasSubject) {
    details.push({ rule: "subject", result: "warn", message: "No subject/character/product terms" });
    warnReasons.push("warn_missing_subject");
  }

  // 3. layout: layout / position / region / anchor
  const hasLayout =
    /\blayout\b|\bposition\b|\bregion\b|\banchor\b|布局|构图|坐标/i.test(lower) ||
    /composition|frame|left|right|center|top|bottom/i.test(lower);
  if (!hasLayout) {
    details.push({ rule: "layout", result: "warn", message: "No layout/position/region/anchor terms" });
    warnReasons.push("warn_missing_layout");
  }

  // 4. style: style / lighting / cinematic / mood
  const hasStyle =
    /\bstyle\b|\blighting\b|\bcinematic\b|\bmood\b|风格|光照|氛围/i.test(lower) ||
    /realistic|commercial|product|ad|film|time|时间/i.test(lower);
  if (!hasStyle) {
    details.push({ rule: "style", result: "warn", message: "No style/lighting/cinematic/mood terms" });
    warnReasons.push("warn_missing_style");
  }

  // 5. machine tail: coords / anchor / region / structural
  const { main, notes } = splitMachineNotes(prompt);
  const hasMachineTail =
    notes.length > 0 ||
    /\bcoords\b|\banchor\b|\bregion\b|structural|结构控制|机器语言/i.test(lower);
  if (!hasMachineTail) {
    details.push({ rule: "machine_tail", result: "warn", message: "No coords/anchor/structural layer" });
    warnReasons.push("warn_missing_machine_tail");
  }

  // 6. continuity
  const continuityMatches = lower.match(/@continuity\s*id\s*:|@continuityid\s*:/g) ?? [];
  const hasContinuity = continuityMatches.length > 0;
  if (hasContinuity) {
    const count = continuityMatches.length;
    if (count >= 3) {
      warnReasons.push("warn_continuity_heavy");
    }
  }

  // 7. refs
  const hasRefs = /\bref\b|\breference\b|参考|localref|image\s+ref/i.test(lower);

  // 8. platform token
  const hasPlatformToken =
    /runway|fal|midjourney|flux|gen4|imagen|dall|stable diffusion/i.test(lower) ||
    /\bplatform\b|\btarget\b|\bmodel\b/i.test(lower);

  // layout_heavy: layout-related content > 45% of main
  const layoutTerms = (main.match(/\blayout\b|\bposition\b|\bregion\b|\banchor\b|布局|构图|坐标|composition|left|right|center|top|bottom/gi) ?? []).length;
  const mainLen = main.trim().length;
  if (mainLen > 0 && layoutTerms >= 8 && layoutTerms * 15 > mainLen * LAYOUT_HEAVY_RATIO) {
    warnReasons.push("warn_layout_heavy");
  }

  // machine_heavy: machine notes > 55% of total
  if (notes.length > 0 && prompt.length > 0 && notes.length / prompt.length > MACHINE_HEAVY_RATIO) {
    warnReasons.push("warn_machine_heavy");
  }

  const hasFail = details.some((d) => d.result === "fail");
  const hasWarn = details.some((d) => d.result === "warn") || warnReasons.length > 0;
  if (hasWarn && warnReasons.length === 0) {
    warnReasons.push("warn_unknown");
  }
  const result: CheckResult = hasFail ? "fail" : hasWarn ? "warn" : "ok";

  return {
    result,
    details,
    warnReasons: [...new Set(warnReasons)],
    lengthBucket,
  };
}
