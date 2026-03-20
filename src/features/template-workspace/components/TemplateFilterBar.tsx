/**
 * Template filter bar - media, storyPlan, ratio, pricing.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { TemplateWorkspaceFilters } from "../model/templateFilter";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";

const colors = TEMPLATE_WORKSPACE_UI.colors;

type Props = {
  lang: Lang;
  filters: TemplateWorkspaceFilters;
  onChange: (f: TemplateWorkspaceFilters) => void;
};

export function TemplateFilterBar({ lang, filters, onChange }: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <div style={styles.wrap}>
      <select
        value={filters.mediaType}
        onChange={(e) =>
          onChange({ ...filters, mediaType: e.target.value as TemplateWorkspaceFilters["mediaType"] })
        }
        style={styles.select}
      >
        <option value="all">{t("图/视频", "Image/Video")}</option>
        <option value="image">{t("图", "Image")}</option>
        <option value="video">{t("视频", "Video")}</option>
      </select>
      <select
        value={filters.storyPlan}
        onChange={(e) =>
          onChange({ ...filters, storyPlan: e.target.value as TemplateWorkspaceFilters["storyPlan"] })
        }
        style={styles.select}
      >
        <option value="all">{t("单镜/连续/多机位/剪辑", "Shot plan")}</option>
        <option value="single">{t("单镜", "Single")}</option>
        <option value="continuous">{t("连续", "Continuous")}</option>
        <option value="multi_cam">{t("多机位", "Multi-cam")}</option>
        <option value="edited">{t("剪辑", "Edit")}</option>
      </select>
      <select
        value={filters.ratio}
        onChange={(e) =>
          onChange({ ...filters, ratio: e.target.value as TemplateWorkspaceFilters["ratio"] })
        }
        style={styles.select}
      >
        <option value="all">{t("比例", "Ratio")}</option>
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
        <option value="1:1">1:1</option>
      </select>
      <select
        value={filters.pricing}
        onChange={(e) =>
          onChange({ ...filters, pricing: e.target.value as TemplateWorkspaceFilters["pricing"] })
        }
        style={styles.select}
      >
        <option value="all">{t("免费/付费", "Free/Paid")}</option>
        <option value="free">{t("免费", "Free")}</option>
        <option value="paid">{t("付费", "Paid")}</option>
      </select>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", gap: 8 },
  select: {
    padding: "6px 10px",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.text,
    fontSize: TEMPLATE_WORKSPACE_UI.fontSize.label,
    cursor: "pointer"
  }
};
