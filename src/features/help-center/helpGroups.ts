/**
 * Help Center — section groups for sidebar navigation (Stage 3).
 * Group labels and section order only; content from helpContent / Stage1 section.
 */

import type { HelpSectionId } from "./types";

export type HelpGroupId =
  | "getting_started"
  | "templates_billing"
  | "creative_controls"
  | "output_platform"
  | "other";

export type HelpGroup = {
  groupId: HelpGroupId;
  labelZh: string;
  labelEn: string;
  sections: HelpSectionId[];
};

export const HELP_GROUPS: HelpGroup[] = [
  {
    groupId: "getting_started",
    labelZh: "入门",
    labelEn: "Getting started",
    sections: ["intro", "workspace"]
  },
  {
    groupId: "templates_billing",
    labelZh: "模板与计费",
    labelEn: "Templates & billing",
    sections: ["templates", "advanced_templates", "credits", "billing"]
  },
  {
    groupId: "creative_controls",
    labelZh: "创作控制",
    labelEn: "Creative controls",
    sections: ["camera", "lighting", "director", "continuity"]
  },
  {
    groupId: "output_platform",
    labelZh: "导出与平台",
    labelEn: "Output & platform",
    sections: ["generation", "export", "platform"]
  },
  {
    groupId: "other",
    labelZh: "其他",
    labelEn: "Other",
    sections: ["faq"]
  }
];
