import React from "react";
import type { Lang } from "../../i18n";
import type { StructureHint } from "../../types/structureDraft";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

type Props = {
  lang: Lang;
  mediaType: "image" | "video";
  firstLayerStructure: StructureHint;
  onMediaTypeChange: (next: "image" | "video") => void;
  onFirstLayerStructureChange: (next: StructureHint) => void;
};

const IMAGE_OPTIONS: Array<{ key: StructureHint; labelZh: string; labelEn: string }> = [
  { key: "single_subject", labelZh: "单主体", labelEn: "Single Subject" },
  { key: "multi_subject", labelZh: "多主体关系", labelEn: "Multi Subject Relation" },
  { key: "environment", labelZh: "环境主导", labelEn: "Environment Driven" },
  { key: "product_object", labelZh: "产品物件", labelEn: "Product Object" }
];

const VIDEO_OPTIONS: Array<{ key: StructureHint; labelZh: string; labelEn: string }> = [
  { key: "single_shot", labelZh: "单镜头", labelEn: "Single Shot" },
  { key: "continuous", labelZh: "连续镜头", labelEn: "Continuous" },
  { key: "multi_scene", labelZh: "多场景", labelEn: "Multi Scene" },
  { key: "multicam", labelZh: "多机位", labelEn: "Multicam" }
];

export function QuickWorkspacePrimaryChoices(props: Props) {
  const { lang, mediaType, firstLayerStructure, onMediaTypeChange, onFirstLayerStructureChange } = props;
  const options = mediaType === "video" ? VIDEO_OPTIONS : IMAGE_OPTIONS;

  return (
    <div style={styles.wrap} data-testid="quick-primary-choices">
      <div style={styles.row} data-testid="quick-primary-media-row">
        <button
          type="button"
          style={{ ...styles.chip, ...(mediaType === "image" ? styles.chipOn : null) }}
          onClick={() => onMediaTypeChange("image")}
          data-testid="quick-primary-media-image"
        >
          {t(lang, "图片", "Image")}
        </button>
        <button
          type="button"
          style={{ ...styles.chip, ...(mediaType === "video" ? styles.chipOn : null) }}
          onClick={() => onMediaTypeChange("video")}
          data-testid="quick-primary-media-video"
        >
          {t(lang, "视频", "Video")}
        </button>
      </div>

      <div style={styles.row} data-testid="quick-primary-structure-row">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            style={{ ...styles.chip, ...(firstLayerStructure === option.key ? styles.chipOn : null) }}
            onClick={() => onFirstLayerStructureChange(option.key)}
            data-testid={`quick-first-layer-${option.key}`}
          >
            {lang === "zh" ? option.labelZh : option.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 8,
    paddingTop: 2
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap"
  },
  chip: {
    minHeight: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: 600,
    padding: "0 12px",
    cursor: "pointer"
  },
  chipOn: {
    background: "rgba(255,255,255,0.18)",
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.28)"
  }
};
