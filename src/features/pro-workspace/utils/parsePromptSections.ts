/**
 * Prompt UI v1 - UI-layer read-only prompt section parser.
 * Maps final prompt text into sections for display. Does NOT modify prompt engine.
 */

export type PromptSection = {
  id: string;
  title: string;
  titleEn: string;
  lines: string[];
};

const SCENE_PATTERNS = [/^Scene:/i, /^#\s*(Scene|Shot)\b/i, /^分镜\b/];
const CAMERA_PATTERNS = [/^Camera Contract:/i, /^Camera:/i, /^镜头[:：]/];
const LAYOUT_PATTERNS = [/^Layout Contract/i, /^Layout:/i, /^布局[:：]/];
const SUBJECTS_PATTERNS = [/^T0 Frame Spec:/i, /^Subjects:/i, /^主体[:：]/];
const MOTION_PATTERNS = [/^T1 Frame Spec:/i, /^Motion:/i, /^动作[:：]/];
const NEGATIVE_PATTERNS = [/^Anti-Director Rules:/i, /^Negative:/i, /^负向约束[:：]/];
const CONSTRAINTS_PATTERNS = [/^Generation constraints:/i, /^生成约束[:：]?/];

function matches(line: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(line.trim()));
}

function contentAfterColon(line: string): string | null {
  const m = line.match(/[:：]\s*(.+)$/);
  return m ? m[1].trim() : null;
}

export function parsePromptSections(main: string): PromptSection[] {
  const sections: PromptSection[] = [];
  const buckets: Record<string, string[]> = {
    scene: [],
    camera: [],
    layout: [],
    subjects: [],
    motion: [],
    style: [],
    constraints: [],
    extras: [],
  };

  type Key = keyof typeof buckets;
  let current: Key = "extras";
  const lines = (main ?? "").split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === "[V2 SCENEPILOT COMPILE]" || line === "[END]" || line === "---") continue;

    if (matches(line, SCENE_PATTERNS)) {
      current = "scene";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.scene.push(rest);
      continue;
    }
    if (matches(line, CAMERA_PATTERNS)) {
      current = "camera";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.camera.push(rest);
      continue;
    }
    if (matches(line, LAYOUT_PATTERNS)) {
      current = "layout";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.layout.push(rest);
      continue;
    }
    if (matches(line, SUBJECTS_PATTERNS)) {
      current = "subjects";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.subjects.push(rest);
      continue;
    }
    if (matches(line, MOTION_PATTERNS)) {
      current = "motion";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.motion.push(rest);
      continue;
    }
    if (matches(line, NEGATIVE_PATTERNS)) {
      current = "constraints";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.constraints.push(rest);
      continue;
    }
    if (matches(line, CONSTRAINTS_PATTERNS)) {
      current = "constraints";
      const rest = contentAfterColon(line) ?? line;
      if (rest) buckets.constraints.push(rest);
      continue;
    }

    if (current && current !== "extras") {
      buckets[current].push(line);
    } else {
      buckets.extras.push(line);
    }
  }

  const order: { key: Key; title: string; titleEn: string }[] = [
    { key: "scene", title: "场景", titleEn: "Scene" },
    { key: "camera", title: "镜头 / 运镜", titleEn: "Camera / Motion" },
    { key: "layout", title: "构图", titleEn: "Composition" },
    { key: "subjects", title: "主体", titleEn: "Subjects" },
    { key: "motion", title: "动作", titleEn: "Motion" },
    { key: "style", title: "风格 / 光照", titleEn: "Style / Lighting" },
    { key: "constraints", title: "约束 / 特殊说明", titleEn: "Constraints / Notes" },
    { key: "extras", title: "其他", titleEn: "Extras" },
  ];

  for (const { key, title, titleEn } of order) {
    const lines = [...new Set(buckets[key].filter(Boolean))];
    if (lines.length > 0) {
      sections.push({ id: key, title, titleEn, lines });
    }
  }

  return sections;
}
