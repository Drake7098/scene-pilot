import React from "react";
import type { Lang } from "../../i18n";

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export type ImageSecondaryStructure = "single_subject" | "multi_subject" | "environment" | "product_object";
export type VideoSecondaryStructure = "single_shot" | "multicam" | "continuous" | "multi_scene";

export type ImageSecondarySelections = {
  subjectCount: "auto" | "1" | "2" | "3" | "3+";
  compositionPosition: "auto" | "center" | "left" | "right" | "depth";
  backgroundComplexity: "auto" | "clean" | "normal" | "rich" | "strong_environment";
  subjectScale: "auto" | "tight" | "balanced" | "wide" | "detail";
};

export type VideoSecondarySelections = {
  shotCount: "auto" | "1" | "3" | "4" | "5";
  mainScene: "auto" | "indoor" | "outdoor" | "complex" | "multi_scene_switch";
  continuityFocus: "auto" | "identity" | "scene" | "lighting" | "style";
  cameraMotion: "auto" | "static" | "follow" | "push" | "orbit";
  sceneTransition: "auto" | "same_space" | "indoor_outdoor" | "location_switch" | "time_jump";
  shotGrammar: "auto" | "cut" | "reverse_angle" | "over_shoulder" | "pov" | "insert_closeup" | "establishing";
};

type Props = {
  lang: Lang;
  mediaType: "image" | "video";
  imageStructure: ImageSecondaryStructure;
  videoStructure: VideoSecondaryStructure;
  imageSelections: ImageSecondarySelections;
  onImageSelectionsChange: (next: ImageSecondarySelections) => void;
  videoSelections: VideoSecondarySelections;
  onVideoSelectionsChange: (next: VideoSecondarySelections) => void;
};

function imageScaleLabel(lang: Lang, imageStructure: ImageSecondaryStructure) {
  if (imageStructure === "environment") return t(lang, "主体存在感", "Subject Presence");
  if (imageStructure === "product_object") return t(lang, "主体景别", "Subject Framing");
  return t(lang, "主体占比", "Subject Scale");
}

function imageScaleOptionLabel(
  lang: Lang,
  imageStructure: ImageSecondaryStructure,
  value: ImageSecondarySelections["subjectScale"]
) {
  if (imageStructure === "environment") {
    const map: Record<ImageSecondarySelections["subjectScale"], string> = {
      auto: t(lang, "不确定", "Not Sure"),
      tight: t(lang, "主体明显", "Visible Subject"),
      balanced: t(lang, "主体环境平衡", "Balanced"),
      wide: t(lang, "环境优先", "Environment First"),
      detail: t(lang, "空间细节", "Spatial Detail")
    };
    return map[value];
  }
  if (imageStructure === "product_object") {
    const map: Record<ImageSecondarySelections["subjectScale"], string> = {
      auto: t(lang, "不确定", "Not Sure"),
      tight: t(lang, "标准陈列", "Standard Display"),
      balanced: t(lang, "主体完整", "Full Product"),
      wide: t(lang, "带场景展示", "Scene Context"),
      detail: t(lang, "细节特写", "Detail Close-up")
    };
    return map[value];
  }
  const map: Record<ImageSecondarySelections["subjectScale"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    tight: t(lang, "主体更满", "Fill Frame"),
    balanced: t(lang, "标准构图", "Balanced"),
    wide: t(lang, "留出环境", "More Environment"),
    detail: t(lang, "细节特写", "Detail Close-up")
  };
  return map[value];
}

function shotCountLabel(lang: Lang, videoStructure: VideoSecondaryStructure) {
  if (videoStructure === "multicam") return t(lang, "切换节点", "Cut Beats");
  if (videoStructure === "continuous") return t(lang, "节奏段数", "Motion Beats");
  if (videoStructure === "multi_scene") return t(lang, "场景段数", "Scene Beats");
  return t(lang, "分镜数", "Shot Count");
}

function imageSubjectCountLabel(lang: Lang, value: ImageSecondarySelections["subjectCount"]) {
  const map: Record<ImageSecondarySelections["subjectCount"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    "1": t(lang, "1 个", "1 Subject"),
    "2": t(lang, "2 个", "2 Subjects"),
    "3": t(lang, "3 个", "3 Subjects"),
    "3+": t(lang, "3 个以上", "3+ Subjects")
  };
  return map[value];
}

function imageCompositionPositionLabel(lang: Lang, value: ImageSecondarySelections["compositionPosition"]) {
  const map: Record<ImageSecondarySelections["compositionPosition"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    center: t(lang, "居中", "Center"),
    left: t(lang, "偏左", "Left"),
    right: t(lang, "偏右", "Right"),
    depth: t(lang, "前后景", "Depth")
  };
  return map[value];
}

function imageBackgroundComplexityLabel(lang: Lang, value: ImageSecondarySelections["backgroundComplexity"]) {
  const map: Record<ImageSecondarySelections["backgroundComplexity"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    clean: t(lang, "干净", "Clean"),
    normal: t(lang, "正常", "Normal"),
    rich: t(lang, "丰富", "Rich"),
    strong_environment: t(lang, "强环境感", "Strong Environment")
  };
  return map[value];
}

function videoShotCountOptionLabel(lang: Lang, value: VideoSecondarySelections["shotCount"]) {
  const map: Record<VideoSecondarySelections["shotCount"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    "1": t(lang, "1 段", "1 Beat"),
    "3": t(lang, "3 段", "3 Beats"),
    "4": t(lang, "4 段", "4 Beats"),
    "5": t(lang, "5 段", "5 Beats")
  };
  return map[value];
}

function videoMainSceneLabel(lang: Lang, value: VideoSecondarySelections["mainScene"]) {
  const map: Record<VideoSecondarySelections["mainScene"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    indoor: t(lang, "室内", "Indoor"),
    outdoor: t(lang, "室外", "Outdoor"),
    complex: t(lang, "复杂环境", "Complex"),
    multi_scene_switch: t(lang, "多场景切换", "Multi Scene Switch")
  };
  return map[value];
}

function videoCameraMotionOptionLabel(lang: Lang, value: VideoSecondarySelections["cameraMotion"]) {
  const map: Record<VideoSecondarySelections["cameraMotion"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    static: t(lang, "稳机位", "Locked Camera"),
    follow: t(lang, "跟随主体", "Follow Subject"),
    push: t(lang, "缓慢推进", "Slow Push"),
    orbit: t(lang, "轻绕拍", "Light Orbit")
  };
  return map[value];
}

function videoSceneTransitionOptionLabel(lang: Lang, value: VideoSecondarySelections["sceneTransition"]) {
  const map: Record<VideoSecondarySelections["sceneTransition"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    same_space: t(lang, "同空间变化", "Same Space Shift"),
    indoor_outdoor: t(lang, "室内到室外", "Indoor to Outdoor"),
    location_switch: t(lang, "地点直接切换", "Location Switch"),
    time_jump: t(lang, "时间跳切", "Time Jump")
  };
  return map[value];
}

function videoContinuityFocusOptionLabel(lang: Lang, value: VideoSecondarySelections["continuityFocus"]) {
  const map: Record<VideoSecondarySelections["continuityFocus"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    identity: t(lang, "人物一致", "Identity"),
    scene: t(lang, "场景一致", "Scene"),
    lighting: t(lang, "光线一致", "Lighting"),
    style: t(lang, "风格一致", "Style")
  };
  return map[value];
}

function videoShotGrammarOptionLabel(lang: Lang, value: VideoSecondarySelections["shotGrammar"]) {
  const map: Record<VideoSecondarySelections["shotGrammar"], string> = {
    auto: t(lang, "不确定", "Not Sure"),
    cut: t(lang, "切镜", "Cut"),
    reverse_angle: t(lang, "反打", "Reverse Angle"),
    over_shoulder: t(lang, "过肩", "Over Shoulder"),
    pov: t(lang, "主观视角", "POV"),
    insert_closeup: t(lang, "插入特写", "Insert Close-up"),
    establishing: t(lang, "建立镜头", "Establishing Shot")
  };
  return map[value];
}

function textVisualUnits(text: string) {
  return Array.from(text).reduce((sum, char) => {
    const code = char.charCodeAt(0);
    const isWide =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3040 && code <= 0x30ff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xff01 && code <= 0xff60);
    return sum + (isWide ? 1.76 : 0.92);
  }, 0);
}

function selectWidthFromLabel(
  label: string,
  minEm = 7.2,
  maxEm = 15.2,
  candidates: string[] = []
): React.CSSProperties {
  const currentUnits = textVisualUnits(label);
  const widestUnits = [label, ...candidates].reduce((max, text) => Math.max(max, textVisualUnits(text)), 0);
  const targetUnits = Math.max(currentUnits, Math.min(widestUnits, currentUnits + 2.8));
  const em = Math.min(maxEm, Math.max(minEm, targetUnits + 1.7));
  return {
    ...styles.select,
    width: `${em}em`
  };
}

export function QuickWorkspaceSecondaryCards(props: Props) {
  const {
    lang,
    mediaType,
    imageStructure,
    videoStructure,
    imageSelections,
    onImageSelectionsChange,
    videoSelections,
    onVideoSelectionsChange
  } = props;

  const showImageSubjectCount = imageStructure === "multi_subject";
  const showVideoShotCount = videoStructure !== "single_shot";
  const showVideoSceneTransition = videoStructure === "multi_scene";

  return (
    <section style={styles.wrap} data-testid="quick-secondary-layer">
      {mediaType === "image" ? (
        <div style={styles.grid} data-testid="quick-secondary-image-dropdowns">
          {showImageSubjectCount ? (
            <label style={styles.field} data-testid="quick-second-image-subject-count">
              <span style={styles.label}>{t(lang, "主体数量", "Subject Count")}</span>
              <select
                value={imageSelections.subjectCount}
                onChange={(e) => onImageSelectionsChange({ ...imageSelections, subjectCount: e.target.value as ImageSecondarySelections["subjectCount"] })}
                style={selectWidthFromLabel(
                  imageSubjectCountLabel(lang, imageSelections.subjectCount),
                  5.6,
                  9.2,
                  [
                    imageSubjectCountLabel(lang, "1"),
                    imageSubjectCountLabel(lang, "2"),
                    imageSubjectCountLabel(lang, "3"),
                    imageSubjectCountLabel(lang, "3+"),
                    imageSubjectCountLabel(lang, "auto")
                  ]
                )}
              >
                <option value="2">{t(lang, "2 个", "2 Subjects")}</option>
                <option value="3">{t(lang, "3 个", "3 Subjects")}</option>
                <option value="3+">{t(lang, "3 个以上", "3+ Subjects")}</option>
                <option value="1">{t(lang, "1 个", "1 Subject")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          ) : (
            <label style={styles.field} data-testid="quick-second-image-subject-scale">
              <span style={styles.label}>{imageScaleLabel(lang, imageStructure)}</span>
              <select
                value={imageSelections.subjectScale}
                onChange={(e) => onImageSelectionsChange({ ...imageSelections, subjectScale: e.target.value as ImageSecondarySelections["subjectScale"] })}
                style={selectWidthFromLabel(
                  imageScaleOptionLabel(lang, imageStructure, imageSelections.subjectScale),
                  6.8,
                  12,
                  [
                    imageScaleOptionLabel(lang, imageStructure, "tight"),
                    imageScaleOptionLabel(lang, imageStructure, "balanced"),
                    imageScaleOptionLabel(lang, imageStructure, "wide"),
                    imageScaleOptionLabel(lang, imageStructure, "detail"),
                    imageScaleOptionLabel(lang, imageStructure, "auto")
                  ]
                )}
              >
                <option value="tight">{imageScaleOptionLabel(lang, imageStructure, "tight")}</option>
                <option value="balanced">{imageScaleOptionLabel(lang, imageStructure, "balanced")}</option>
                <option value="wide">{imageScaleOptionLabel(lang, imageStructure, "wide")}</option>
                <option value="detail">{imageScaleOptionLabel(lang, imageStructure, "detail")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          )}

          <label style={styles.field} data-testid="quick-second-image-composition-position">
            <span style={styles.label}>{t(lang, "构图位置", "Composition Position")}</span>
            <select
              value={imageSelections.compositionPosition}
              onChange={(e) => onImageSelectionsChange({ ...imageSelections, compositionPosition: e.target.value as ImageSecondarySelections["compositionPosition"] })}
              style={selectWidthFromLabel(
                imageCompositionPositionLabel(lang, imageSelections.compositionPosition),
                5.6,
                9.2,
                [
                  imageCompositionPositionLabel(lang, "center"),
                  imageCompositionPositionLabel(lang, "left"),
                  imageCompositionPositionLabel(lang, "right"),
                  imageCompositionPositionLabel(lang, "depth"),
                  imageCompositionPositionLabel(lang, "auto")
                ]
              )}
            >
              <option value="center">{t(lang, "居中", "Center")}</option>
              <option value="left">{t(lang, "偏左", "Left")}</option>
              <option value="right">{t(lang, "偏右", "Right")}</option>
              <option value="depth">{t(lang, "前后景", "Depth")}</option>
              <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
            </select>
          </label>

          <label style={styles.field} data-testid="quick-second-image-background-complexity">
            <span style={styles.label}>{t(lang, "背景复杂度", "Background Complexity")}</span>
            <select
              value={imageSelections.backgroundComplexity}
              onChange={(e) => onImageSelectionsChange({ ...imageSelections, backgroundComplexity: e.target.value as ImageSecondarySelections["backgroundComplexity"] })}
              style={selectWidthFromLabel(
                imageBackgroundComplexityLabel(lang, imageSelections.backgroundComplexity),
                6.8,
                12,
                [
                  imageBackgroundComplexityLabel(lang, "clean"),
                  imageBackgroundComplexityLabel(lang, "normal"),
                  imageBackgroundComplexityLabel(lang, "rich"),
                  imageBackgroundComplexityLabel(lang, "strong_environment"),
                  imageBackgroundComplexityLabel(lang, "auto")
                ]
              )}
            >
              <option value="clean">{t(lang, "干净", "Clean")}</option>
              <option value="normal">{t(lang, "正常", "Normal")}</option>
              <option value="rich">{t(lang, "丰富", "Rich")}</option>
              <option value="strong_environment">{t(lang, "强环境感", "Strong Environment")}</option>
              <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
            </select>
          </label>
        </div>
      ) : (
        <div style={styles.grid} data-testid="quick-secondary-video-dropdowns">
          {showVideoShotCount ? (
            <label style={styles.field} data-testid="quick-second-video-shot-count">
              <span style={styles.label}>{shotCountLabel(lang, videoStructure)}</span>
              <select
                value={videoSelections.shotCount}
                onChange={(e) => onVideoSelectionsChange({ ...videoSelections, shotCount: e.target.value as VideoSecondarySelections["shotCount"] })}
                style={selectWidthFromLabel(
                  videoShotCountOptionLabel(lang, videoSelections.shotCount),
                  5.8,
                  9.2,
                  [
                    videoShotCountOptionLabel(lang, "1"),
                    videoShotCountOptionLabel(lang, "3"),
                    videoShotCountOptionLabel(lang, "4"),
                    videoShotCountOptionLabel(lang, "5"),
                    videoShotCountOptionLabel(lang, "auto")
                  ]
                )}
              >
                <option value="3">{t(lang, "3 段", "3 Beats")}</option>
                <option value="4">{t(lang, "4 段", "4 Beats")}</option>
                <option value="5">{t(lang, "5 段", "5 Beats")}</option>
                <option value="1">{t(lang, "1 段", "1 Beat")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          ) : (
            <label style={styles.field} data-testid="quick-second-video-camera-motion">
              <span style={styles.label}>{t(lang, "镜头运动", "Camera Motion")}</span>
              <select
                value={videoSelections.cameraMotion}
                onChange={(e) => onVideoSelectionsChange({ ...videoSelections, cameraMotion: e.target.value as VideoSecondarySelections["cameraMotion"] })}
                style={selectWidthFromLabel(
                  videoCameraMotionOptionLabel(lang, videoSelections.cameraMotion),
                  6.8,
                  12,
                  [
                    videoCameraMotionOptionLabel(lang, "static"),
                    videoCameraMotionOptionLabel(lang, "follow"),
                    videoCameraMotionOptionLabel(lang, "push"),
                    videoCameraMotionOptionLabel(lang, "orbit"),
                    videoCameraMotionOptionLabel(lang, "auto")
                  ]
                )}
              >
                <option value="follow">{t(lang, "跟随主体", "Follow Subject")}</option>
                <option value="push">{t(lang, "缓慢推进", "Slow Push")}</option>
                <option value="static">{t(lang, "稳机位", "Locked Camera")}</option>
                <option value="orbit">{t(lang, "轻绕拍", "Light Orbit")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          )}

          {showVideoSceneTransition ? (
            <label style={styles.field} data-testid="quick-second-video-scene-transition">
              <span style={styles.label}>{t(lang, "场景切换", "Scene Transition")}</span>
              <select
                value={videoSelections.sceneTransition}
                onChange={(e) => onVideoSelectionsChange({ ...videoSelections, sceneTransition: e.target.value as VideoSecondarySelections["sceneTransition"] })}
                style={selectWidthFromLabel(
                  videoSceneTransitionOptionLabel(lang, videoSelections.sceneTransition),
                  8.2,
                  13,
                  [
                    videoSceneTransitionOptionLabel(lang, "same_space"),
                    videoSceneTransitionOptionLabel(lang, "indoor_outdoor"),
                    videoSceneTransitionOptionLabel(lang, "location_switch"),
                    videoSceneTransitionOptionLabel(lang, "time_jump"),
                    videoSceneTransitionOptionLabel(lang, "auto")
                  ]
                )}
              >
                <option value="location_switch">{t(lang, "地点直接切换", "Location Switch")}</option>
                <option value="indoor_outdoor">{t(lang, "室内到室外", "Indoor to Outdoor")}</option>
                <option value="time_jump">{t(lang, "时间跳切", "Time Jump")}</option>
                <option value="same_space">{t(lang, "同空间变化", "Same Space Shift")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          ) : (
            <label style={styles.field} data-testid="quick-second-video-main-scene">
              <span style={styles.label}>{t(lang, "主场景", "Main Scene")}</span>
              <select
                value={videoSelections.mainScene}
                onChange={(e) => onVideoSelectionsChange({ ...videoSelections, mainScene: e.target.value as VideoSecondarySelections["mainScene"] })}
                style={selectWidthFromLabel(
                  videoMainSceneLabel(lang, videoSelections.mainScene),
                  5.8,
                  10,
                  [
                    videoMainSceneLabel(lang, "indoor"),
                    videoMainSceneLabel(lang, "outdoor"),
                    videoMainSceneLabel(lang, "complex"),
                    videoMainSceneLabel(lang, "auto")
                  ]
                )}
              >
                <option value="indoor">{t(lang, "室内", "Indoor")}</option>
                <option value="outdoor">{t(lang, "室外", "Outdoor")}</option>
                <option value="complex">{t(lang, "复杂环境", "Complex")}</option>
                <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
              </select>
            </label>
          )}

          <label style={styles.field} data-testid="quick-second-video-continuity-focus">
            <span style={styles.label}>{t(lang, "优先保持", "Keep Stable")}</span>
            <select
              value={videoSelections.continuityFocus}
              onChange={(e) => onVideoSelectionsChange({ ...videoSelections, continuityFocus: e.target.value as VideoSecondarySelections["continuityFocus"] })}
              style={selectWidthFromLabel(
                videoContinuityFocusOptionLabel(lang, videoSelections.continuityFocus),
                6.2,
                10,
                [
                  videoContinuityFocusOptionLabel(lang, "identity"),
                  videoContinuityFocusOptionLabel(lang, "scene"),
                  videoContinuityFocusOptionLabel(lang, "lighting"),
                  videoContinuityFocusOptionLabel(lang, "style"),
                  videoContinuityFocusOptionLabel(lang, "auto")
                ]
              )}
            >
              <option value="identity">{t(lang, "人物一致", "Identity")}</option>
              <option value="scene">{t(lang, "场景一致", "Scene")}</option>
              <option value="lighting">{t(lang, "光线一致", "Lighting")}</option>
              <option value="style">{t(lang, "风格一致", "Style")}</option>
              <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
            </select>
          </label>

          <label style={styles.field} data-testid="quick-second-video-shot-grammar">
            <span style={styles.label}>{t(lang, "镜头语法", "Shot Grammar")}</span>
            <select
              value={videoSelections.shotGrammar}
              onChange={(e) => onVideoSelectionsChange({ ...videoSelections, shotGrammar: e.target.value as VideoSecondarySelections["shotGrammar"] })}
              style={selectWidthFromLabel(
                videoShotGrammarOptionLabel(lang, videoSelections.shotGrammar),
                6.2,
                12.6,
                [
                  videoShotGrammarOptionLabel(lang, "cut"),
                  videoShotGrammarOptionLabel(lang, "reverse_angle"),
                  videoShotGrammarOptionLabel(lang, "over_shoulder"),
                  videoShotGrammarOptionLabel(lang, "pov"),
                  videoShotGrammarOptionLabel(lang, "insert_closeup"),
                  videoShotGrammarOptionLabel(lang, "establishing"),
                  videoShotGrammarOptionLabel(lang, "auto")
                ]
              )}
            >
              <option value="cut">{t(lang, "切镜", "Cut")}</option>
              <option value="reverse_angle">{t(lang, "反打", "Reverse Angle")}</option>
              <option value="over_shoulder">{t(lang, "过肩", "Over Shoulder")}</option>
              <option value="pov">{t(lang, "主观视角", "POV")}</option>
              <option value="insert_closeup">{t(lang, "插入特写", "Insert Close-up")}</option>
              <option value="establishing">{t(lang, "建立镜头", "Establishing Shot")}</option>
              <option value="auto">{t(lang, "不确定", "Not Sure")}</option>
            </select>
          </label>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 0,
    width: "100%"
  },
  grid: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    width: "100%"
  },
  field: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    minHeight: 24,
    width: "fit-content",
    flex: "0 0 auto",
    whiteSpace: "nowrap",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "#000000",
    padding: "0 6px",
    color: "rgba(255,255,255,0.9)"
  },
  label: { fontSize: 10, lineHeight: 1.08, color: "rgba(255,255,255,0.62)", letterSpacing: 0.06 },
  select: {
    minHeight: 17,
    minWidth: 0,
    maxWidth: "100%",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: 11.5,
    lineHeight: 1.2,
    outline: "none",
    cursor: "pointer",
    padding: "0 6px 0 0",
    flex: "0 0 auto"
  }
};
