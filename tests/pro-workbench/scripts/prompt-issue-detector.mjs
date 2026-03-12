function compactLines(prompt) {
  return String(prompt || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uniq(list) {
  return [...new Set(list)];
}

function collectMatches(lines, patterns, limit = 6) {
  const hits = [];
  for (const line of lines) {
    if (patterns.some((pattern) => pattern.test(line))) hits.push(line);
    if (hits.length >= limit) break;
  }
  return uniq(hits);
}

const IMAGE_CAMERA_HEADING_PATTERNS = [
  /^Camera Contract:?$/i,
  /^Camera:?$/i,
  /^镜头[:：]?$/i
];

const IMAGE_CAMERA_LANGUAGE_PATTERNS = [
  /单机位/,
  /机位/,
  /镜头与构图一致/,
  /不自动推拉镜头/,
  /换角度/,
  /\bpush-?in\b/i,
  /\bdolly\b/i,
  /\bpan\b/i,
  /\btilt\b/i,
  /\bzoom\b/i,
  /\bframing\b/i,
  /\bcamera angle\b/i,
  /运镜/
];

const IMAGE_TEMPORAL_LANGUAGE_PATTERNS = [
  /^T1 Frame Spec:?$/i,
  /^Motion:?$/i,
  /^动作[:：]?$/i,
  /t0\s*[->→]\s*t1/i,
  /\bt1\b/i,
  /整段\s*\d+(\.\d+)?\s*秒/,
  /在\s*\d+(\.\d+)?\s*秒/,
  /\b\d+(\.\d+)?s\b/i,
  /时长/,
  /轨迹/,
  /路径/,
  /结束保持原位/,
  /within\s+\d+(\.\d+)?s/i,
  /full\s+\d+(\.\d+)?s/i
];

const REQUIRED_LAYOUT_PATTERNS = [/^Layout:?$/i, /^布局[:：]?$/i];
const REQUIRED_SUBJECT_PATTERNS = [/^Subjects:?$/i, /^主体[:：]?$/i];
const REQUIRED_VIDEO_CAMERA_PATTERNS = [/^镜头[:：]?$/i, /^Camera:?$/i];
const REQUIRED_VIDEO_MOTION_PATTERNS = [/^动作[:：]?$/i, /^Motion:?$/i];

function pushIssue(issues, code, severity, evidence, message) {
  issues.push({
    code,
    severity,
    message,
    evidence: uniq((evidence || []).filter(Boolean)).slice(0, 6)
  });
}

export function detectPromptIssues({ prompt, mediaMode, workspace, engineId }) {
  const lines = compactLines(prompt);
  const issues = [];

  const layoutHits = collectMatches(lines, REQUIRED_LAYOUT_PATTERNS, 2);
  const subjectHits = collectMatches(lines, REQUIRED_SUBJECT_PATTERNS, 2);

  if (!layoutHits.length) {
    pushIssue(issues, "missing_layout_section", "high", [], "缺少布局段，结构可执行性不足");
  }
  if (!subjectHits.length) {
    pushIssue(issues, "missing_subject_section", "high", [], "缺少主体段，对象约束不完整");
  }

  if (mediaMode === "image") {
    const cameraHeadingHits = collectMatches(lines, IMAGE_CAMERA_HEADING_PATTERNS);
    if (cameraHeadingHits.length) {
      pushIssue(issues, "image_camera_heading_leak", "high", cameraHeadingHits, "图片 prompt 泄漏镜头标题块");
    }

    const cameraLanguageHits = collectMatches(lines, IMAGE_CAMERA_LANGUAGE_PATTERNS);
    if (cameraLanguageHits.length) {
      pushIssue(issues, "image_camera_language_leak", "high", cameraLanguageHits, "图片 prompt 混入镜头/运镜语言");
    }

    const temporalHits = collectMatches(lines, IMAGE_TEMPORAL_LANGUAGE_PATTERNS);
    if (temporalHits.length) {
      pushIssue(issues, "image_temporal_language_leak", "high", temporalHits, "图片 prompt 混入时序/T1/时长语言");
    }
  } else {
    const videoCameraHits = collectMatches(lines, REQUIRED_VIDEO_CAMERA_PATTERNS, 2);
    if (!videoCameraHits.length) {
      pushIssue(issues, "video_missing_camera_section", "high", [], "视频 prompt 缺少镜头段");
    }

    const videoMotionHits = collectMatches(lines, REQUIRED_VIDEO_MOTION_PATTERNS, 2);
    if (!videoMotionHits.length) {
      pushIssue(issues, "video_missing_motion_section", "high", [], "视频 prompt 缺少动作段");
    }
  }

  if (prompt.length > 2200) {
    pushIssue(issues, "prompt_too_long", "medium", [], "prompt 过长，协议层可能压过执行层");
  }

  const repeatedProtocolHits = collectMatches(lines, [/平台执行协议/, /输出策略：/, /硬约束：/, /通用策略：/], 10);
  if (repeatedProtocolHits.length >= 4 && workspace === "quick") {
    pushIssue(issues, "quick_protocol_too_heavy", "medium", repeatedProtocolHits, "Quick 引擎协议层过厚");
  }

  const severityPenalty = issues.reduce((sum, issue) => sum + (issue.severity === "high" ? 25 : issue.severity === "medium" ? 10 : 5), 0);
  const score = Math.max(0, 100 - severityPenalty);

  return {
    mediaMode,
    workspace,
    engineId,
    score,
    issues
  };
}
