import React from "react";
import type { Lang } from "../../i18n";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export type PrimaryMediaType = "image" | "video";
export type ImagePrimaryStructure = "single_frame" | "multi_object" | "environment_scene";
export type VideoPrimaryStructure = "single_shot" | "multicam" | "continuous" | "multi_scene";

type Props = {
  lang: Lang;
  mediaType: PrimaryMediaType;
  imageStructure: ImagePrimaryStructure;
  videoStructure: VideoPrimaryStructure;
  onMediaTypeChange: (next: PrimaryMediaType) => void;
  onImageStructureChange: (next: ImagePrimaryStructure) => void;
  onVideoStructureChange: (next: VideoPrimaryStructure) => void;
};

export function QuickWorkspacePrimaryStep(props: Props) {
  const {
    lang,
    mediaType,
    imageStructure,
    videoStructure,
    onMediaTypeChange,
    onImageStructureChange,
    onVideoStructureChange
  } = props;

  return (
    <section style={styles.wrap} data-testid="quick-primary-step">
      <div style={styles.title}>{t(lang, "你想生成什么？", "What do you want to generate?")}</div>
      <div style={styles.row} data-testid="quick-primary-media-cards">
        <button
          type="button"
          style={{ ...styles.card, ...(mediaType === "image" ? styles.cardOn : null) }}
          onClick={() => onMediaTypeChange("image")}
          data-testid="quick-primary-media-image"
        >
          {t(lang, "图片", "Image")}
        </button>
        <button
          type="button"
          style={{ ...styles.card, ...(mediaType === "video" ? styles.cardOn : null) }}
          onClick={() => onMediaTypeChange("video")}
          data-testid="quick-primary-media-video"
        >
          {t(lang, "视频", "Video")}
        </button>
      </div>

      {mediaType === "image" ? (
        <div style={styles.row} data-testid="quick-primary-image-structure-cards">
          <button
            type="button"
            style={{ ...styles.card, ...(imageStructure === "single_frame" ? styles.cardOn : null) }}
            onClick={() => onImageStructureChange("single_frame")}
            data-testid="quick-primary-image-single"
          >
            {t(lang, "单画面", "Single Frame")}
          </button>
          <button
            type="button"
            style={{ ...styles.card, ...(imageStructure === "multi_object" ? styles.cardOn : null) }}
            onClick={() => onImageStructureChange("multi_object")}
            data-testid="quick-primary-image-multi"
          >
            {t(lang, "多对象", "Multi Object")}
          </button>
          <button
            type="button"
            style={{ ...styles.card, ...(imageStructure === "environment_scene" ? styles.cardOn : null) }}
            onClick={() => onImageStructureChange("environment_scene")}
            data-testid="quick-primary-image-environment"
          >
            {t(lang, "环境场景", "Environment Scene")}
          </button>
        </div>
      ) : (
        <div style={styles.row} data-testid="quick-primary-video-structure-cards">
          <button
            type="button"
            style={{ ...styles.card, ...(videoStructure === "single_shot" ? styles.cardOn : null) }}
            onClick={() => onVideoStructureChange("single_shot")}
            data-testid="quick-primary-video-single"
          >
            {t(lang, "单镜头", "Single Shot")}
          </button>
          <button
            type="button"
            style={{ ...styles.card, ...(videoStructure === "continuous" ? styles.cardOn : null) }}
            onClick={() => onVideoStructureChange("continuous")}
            data-testid="quick-primary-video-continuous"
          >
            {t(lang, "连续镜头", "Continuous")}
          </button>
          <button
            type="button"
            style={{ ...styles.card, ...(videoStructure === "multi_scene" ? styles.cardOn : null) }}
            onClick={() => onVideoStructureChange("multi_scene")}
            data-testid="quick-primary-video-multi-scene"
          >
            {t(lang, "多场景", "Multi Scene")}
          </button>
          <button
            type="button"
            style={{ ...styles.card, ...(videoStructure === "multicam" ? styles.cardOn : null) }}
            onClick={() => onVideoStructureChange("multicam")}
            data-testid="quick-primary-video-multicam"
          >
            {t(lang, "多机位", "Multicam")}
          </button>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 8,
    marginTop: 8
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff"
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  card: {
    minHeight: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    fontWeight: 620,
    padding: "0 12px",
    cursor: "pointer"
  },
  cardOn: {
    background: "rgba(255,255,255,0.2)",
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.3)"
  }
};
