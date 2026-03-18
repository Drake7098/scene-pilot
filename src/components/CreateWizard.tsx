import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Lang } from "../i18n";
import type { ShotPlan } from "../model";
import { defaultProjectName, defaultSceneName } from "../utils/naming";
import { UI_ACTION, UI_COLOR, UI_CONTROL, UI_EFFECT, UI_INFO, UI_PALETTE, UI_RADIUS, UI_SPACE, UI_STATUS, UI_TYPO } from "../uiTokens";

export type NewProjectMedia = "image" | "video";
export type CreateStep = "media" | "setup" | "done";
export type DurationMode = "average" | "manual";
export type RatioOption = "16:9" | "9:16" | "1:1";
export type SceneTier = "indoor" | "small_plaza" | "open_space";
export type WizardDraft = {
  projectName: string;
  mediaType: NewProjectMedia;
  ratio: RatioOption;
  sceneTier: SceneTier;
  shotPlan: ShotPlan;
  shotCount: number;
  totalDuration: number;
  durationMode: DurationMode;
  manualDurations: number[];
};

type Props = {
  lang: Lang;
  open: boolean;
  canCancel: boolean;
  step: CreateStep;
  draft: WizardDraft;
  setStep: Dispatch<SetStateAction<CreateStep>>;
  setDraft: Dispatch<SetStateAction<WizardDraft>>;
  nextWizardDraft: (base?: Partial<WizardDraft>) => WizardDraft;
  defaultShotCount: (plan: ShotPlan) => number;
  onCreateProject: () => void;
  onMarkOnboardingDone: () => void;
  onToggleLang: () => void;
  onCancel: () => void;
};

type PrimaryActionButtonProps = {
  label: string;
  onClick: () => void;
};

type SecondaryActionButtonProps = {
  label: string;
  onClick: () => void;
};

function PrimaryActionButton({ label, onClick }: PrimaryActionButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      style={{
        ...styles.modalBtn,
        ...(hovered ? styles.modalBtnHover : {}),
        ...(pressed ? styles.modalBtnPressed : {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SecondaryActionButton({ label, onClick }: SecondaryActionButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      style={{
        ...styles.modalBtnGhost,
        ...(hovered ? styles.modalBtnGhostHover : {}),
        ...(pressed ? styles.modalBtnGhostPressed : {})
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function normalizeDurations(draft: WizardDraft): number[] {
  const count = Math.max(1, Math.round(draft.shotCount));
  if (count === 1) return [Math.max(1, Math.round(draft.totalDuration || 6))];
  if (draft.durationMode === "manual") {
    return Array.from({ length: count }, (_, i) => Math.max(1, Math.round(draft.manualDurations[i] || 1)));
  }
  const total = Math.max(count, Math.round(draft.totalDuration || 12));
  const base = Math.floor(total / count);
  let rest = total - base * count;
  return Array.from({ length: count }, () => {
    if (rest > 0) {
      rest -= 1;
      return base + 1;
    }
    return base;
  });
}

function recommendedRatioByTier(tier: SceneTier): RatioOption {
  if (tier === "indoor") return "9:16";
  if (tier === "small_plaza") return "1:1";
  return "16:9";
}

export function CreateWizard(props: Props) {
  const {
    lang,
    open,
    canCancel,
    step,
    draft,
    setStep,
    setDraft,
    nextWizardDraft,
    defaultShotCount,
    onCreateProject,
    onMarkOnboardingDone,
    onToggleLang,
    onCancel
  } = props;
  const [floatingHint, setFloatingHint] = useState("");
  const [showDurationHelp, setShowDurationHelp] = useState(false);
  const [showSceneTierHelp, setShowSceneTierHelp] = useState(false);
  const [mediaTouched, setMediaTouched] = useState(false);
  const [planTouched, setPlanTouched] = useState(false);
  const [hoveredMedia, setHoveredMedia] = useState<NewProjectMedia | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<ShotPlan | null>(null);

  const skeletonRows = useMemo(() => {
    const count = Math.max(1, Math.round(draft.shotCount));
    const durations = normalizeDurations(draft);
    return Array.from({ length: count }, (_, i) => {
      const no = i + 1;
      const noText = String(no).padStart(2, "0");
      return {
        id: noText,
        name: defaultSceneName(lang, draft.mediaType, no),
        duration: Math.max(1, durations[i] ?? 1)
      };
    });
  }, [draft, lang]);

  const step3Warnings = useMemo(() => {
    const out: string[] = [];
    const count = Math.max(1, Math.round(draft.shotCount));
    const total = Math.max(1, Math.round(draft.totalDuration || 1));

    if (total > 20) {
      out.push(lang === "zh" ? "建议总时长控制在 8-20 秒，过长会降低稳定性。" : "Recommended total duration is 8-20s for better stability.");
    }
    if (draft.durationMode === "average" && count > 1 && total % count !== 0) {
      out.push(lang === "zh" ? "当前平均分配不是整数秒，建议调整为可整除值。" : "Average allocation is not integer seconds. Consider using divisible values.");
    }
    if (draft.durationMode === "manual") {
      const manualList = Array.from({ length: count }, (_, i) => Math.max(1, Math.round(draft.manualDurations[i] || 1)));
      const sum = manualList.reduce((a, b) => a + b, 0);
      if (sum !== total) {
        out.push(lang === "zh" ? "手动时长总和与总时长不一致，建议对齐。" : "Manual duration sum does not match total duration.");
      }
      if (manualList.some((v) => v > 20)) {
        out.push(lang === "zh" ? "存在单镜头时长过长，建议压缩节奏。" : "Some shots are too long. Consider tighter pacing.");
      }
    }
    return out;
  }, [draft, lang]);
  const draftSummary = useMemo(() => {
    const durations = normalizeDurations(draft);
    const total = durations.reduce((sum, v) => sum + Math.max(1, Math.round(v || 1)), 0);
    return {
      mediaType: draft.mediaType,
      shotPlan: draft.mediaType === "image" ? "single" : draft.shotPlan,
      shotCount: draft.mediaType === "image" ? 1 : Math.max(1, Math.round(draft.shotCount)),
      totalDuration: draft.mediaType === "image" ? 0 : total,
      sceneTier: draft.sceneTier,
      ratio: draft.ratio
    };
  }, [draft]);
  const summaryLabel = useMemo(() => {
    const media = lang === "zh" ? (draftSummary.mediaType === "image" ? "图片" : "视频") : draftSummary.mediaType;
    const shotPlan = (() => {
      if (lang !== "zh") return draftSummary.shotPlan;
      if (draftSummary.shotPlan === "single") return "单镜头";
      if (draftSummary.shotPlan === "multicam") return "多机位";
      if (draftSummary.shotPlan === "continuous") return "连续镜头";
      return "标准剪辑";
    })();
    return { media, shotPlan };
  }, [lang, draftSummary]);

  useEffect(() => {
    if (!floatingHint) return;
    const timer = window.setTimeout(() => setFloatingHint(""), 2200);
    return () => window.clearTimeout(timer);
  }, [floatingHint]);

  function validateVideoSetup(): boolean {
    const name = draft.projectName.trim();
    if (!name) {
      setFloatingHint(lang === "zh" ? "请先输入项目名称" : "Please enter project name first.");
      return false;
    }

    const total = Math.max(1, Math.round(draft.totalDuration || 1));
    if (!Number.isFinite(total) || total < 1) {
      setFloatingHint(lang === "zh" ? "总时长需要是正整数" : "Total duration must be a positive integer.");
      return false;
    }
    return true;
  }

  if (!open) return null;
  const modalWidthByStep: Record<CreateStep, number> = {
    media: 420,
    setup: 420,
    done: 420
  };
  const modalWidth = modalWidthByStep[step] ?? 420;

  const stepHeader = (
    <div style={styles.stepTopRow}>
      <div style={styles.stepTopBrand}>ScenePilotix</div>
      <button style={styles.langBtn} type="button" onClick={onToggleLang}>
        {lang === "zh" ? "EN" : "中文"}
      </button>
    </div>
  );

  return (
    <div style={styles.modalMask} role="presentation">
      <div
        className="spx-wizard-modal"
        style={{ ...styles.modal, width: modalWidth, maxWidth: "92vw" }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div style={styles.modalBackdrop} aria-hidden="true">
          <div style={styles.modalGlowPrimary} />
          <div style={styles.modalGlowAccent} />
          <div style={styles.modalNoise} />
        </div>
        {floatingHint ? <div style={styles.floatingHint}>{floatingHint}</div> : null}

        {step === "media" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "你要生成什么？" : "What do you want to generate?"}</div>
            <div style={styles.newProjectMediaRow}>
              <button
                type="button"
                style={{
                  ...styles.newProjectMediaBtn,
                  ...(hoveredMedia === "image" ? styles.newProjectMediaBtnHover : {}),
                  ...(mediaTouched && draft.mediaType === "image" ? styles.newProjectMediaBtnOn : {})
                }}
                onMouseEnter={() => setHoveredMedia("image")}
                onMouseLeave={() => setHoveredMedia(null)}
                onClick={() => {
                  setMediaTouched(true);
                  setDraft((s) => nextWizardDraft({ ...s, mediaType: "image", shotPlan: "single", shotCount: 1 }));
                }}
              >
                {lang === "zh" ? "图片" : "Image"}
              </button>
              <button
                type="button"
                style={{
                  ...styles.newProjectMediaBtn,
                  ...(hoveredMedia === "video" ? styles.newProjectMediaBtnHover : {}),
                  ...(mediaTouched && draft.mediaType === "video" ? styles.newProjectMediaBtnOn : {})
                }}
                onMouseEnter={() => setHoveredMedia("video")}
                onMouseLeave={() => setHoveredMedia(null)}
                onClick={() => {
                  setMediaTouched(true);
                  setDraft((s) => nextWizardDraft({ ...s, mediaType: "video", shotPlan: "single", shotCount: 1 }));
                }}
              >
                {lang === "zh" ? "视频" : "Video"}
              </button>
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <SecondaryActionButton label={lang === "zh" ? "取消" : "Cancel"} onClick={onCancel} />
              ) : null}
              <PrimaryActionButton
                label={lang === "zh" ? "下一步" : "Next"}
                onClick={() => setStep("setup")}
              />
            </div>
          </>
        ) : null}

        {step === "setup" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "给项目起个名字" : "Name your project"}</div>
            <div style={styles.modalFormRow}>
              <label style={styles.modalLabel}>{lang === "zh" ? "项目名称" : "Project Name"}</label>
              <input
                value={draft.projectName}
                onChange={(e) => setDraft((s) => ({ ...s, projectName: e.target.value }))}
                style={{ ...styles.modalInput, ...(floatingHint && !draft.projectName.trim() ? { borderColor: "#ef4444" } : {}) }}
                placeholder={defaultProjectName(lang)}
              />
            </div>
            <div style={styles.modalFormRow}>
              <label style={styles.modalLabel}>{lang === "zh" ? "画幅比例" : "Aspect Ratio"}</label>
              <select
                value={draft.ratio}
                onChange={(e) => setDraft((s) => ({ ...s, ratio: e.target.value as RatioOption }))}
                style={styles.modalSelect}
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <SecondaryActionButton label={lang === "zh" ? "取消" : "Cancel"} onClick={onCancel} />
              ) : null}
              <SecondaryActionButton label={lang === "zh" ? "上一步" : "Back"} onClick={() => {
                setMediaTouched(false);
                setStep("media");
              }} />
              <PrimaryActionButton
                label={lang === "zh" ? "下一步" : "Next"}
                onClick={() => {
                  const name = draft.projectName.trim();
                  if (!name) {
                    setFloatingHint(lang === "zh" ? "请填写项目名称" : "Please enter project name.");
                    return;
                  }
                  setStep("done");
                }}
              />
            </div>
          </>
        ) : null}

        {step === "done" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "准备好了" : "You're all set"}</div>
            <ul style={{ margin: "16px 0", paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: "rgba(229,231,235,0.95)" }}>
              <li>{lang === "zh" ? "左侧面板：选镜头景别、运镜方式、光线情绪，600+ 场景模板直接套用" : "Left: shot type, camera movement, lighting mood — 600+ templates ready to apply"}</li>
              <li>{lang === "zh" ? "右侧面板：设置背景氛围、上传参考图、逐一描述画面对象细节" : "Right: background style, reference images, per-object descriptions"}</li>
              <li>{lang === "zh" ? "填好结构，本地直接生成，或复制提示词到你常用的 AI 平台，多平台适配" : "Fill the structure, generate locally or copy the prompt to any AI platform — works everywhere"}</li>
            </ul>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#f59e0b", lineHeight: 1.5 }}>
              {lang === "zh" ? "用好结构化工作台，同样的创意产出效率翻倍——会用的人，比别人少花 80% 的时间。" : "The more you use it, the faster you get. What used to take an hour takes ten minutes."}
            </p>
            <div style={styles.modalBtns}>
              <PrimaryActionButton
                label={lang === "zh" ? "开始使用" : "Get Started"}
                onClick={() => {
                  onMarkOnboardingDone();
                  onCreateProject();
                }}
              />
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}

const WIZARD_BG = "#24262b";
const WIZARD_BORDER = "#3a3f46";
const WIZARD_ACCENT = "#f59e0b";

const styles: Record<string, CSSProperties> = {
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(31,33,37,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 640,
    maxWidth: "100%",
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${WIZARD_BORDER}`,
    background: WIZARD_BG,
    boxShadow: UI_EFFECT.floatShadow,
    padding: UI_SPACE.md,
    position: "relative",
    overflow: "hidden",
    isolation: "isolate"
  },
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0
  },
  modalGlowPrimary: {
    position: "absolute",
    width: 360,
    height: 360,
    top: -170,
    left: -110,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(118,156,255,0.24) 0%, rgba(118,156,255,0.08) 42%, rgba(118,156,255,0) 72%)",
    filter: "blur(12px)"
  },
  modalGlowAccent: {
    position: "absolute",
    width: 300,
    height: 300,
    right: -84,
    bottom: -120,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(77,191,180,0.18) 0%, rgba(77,191,180,0.08) 44%, rgba(77,191,180,0) 74%)",
    filter: "blur(18px)"
  },
  modalNoise: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    backgroundSize: "28px 28px"
  },
  floatingHint: {
    position: "absolute",
    top: -44,
    right: 0,
    width: "max-content",
    minWidth: 120,
    maxWidth: "min(420px, calc(100vw - 40px))",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_STATUS.border.info}`,
    background: UI_STATUS.surface.info,
    boxShadow: UI_EFFECT.floatShadow,
    padding: "8px 10px",
    fontSize: UI_TYPO.size12,
    lineHeight: 1.35,
    textAlign: "left",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "keep-all",
    zIndex: 2
  },
  modalTitle: { fontWeight: 900, fontSize: UI_TYPO.size14, opacity: 0.95, position: "relative", zIndex: 1 },
  modalText: { marginTop: 8, fontSize: UI_TYPO.size12, opacity: 0.82, lineHeight: 1.6, color: UI_PALETTE.text.secondary },
  summaryBox: {
    marginTop: 8,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_INFO.border.default}`,
    background: UI_INFO.surface.default,
    padding: "8px 10px",
    display: "grid",
    gap: 4,
    position: "relative",
    zIndex: 1
  },
  summaryTitle: {
    fontSize: UI_TYPO.size12,
    fontWeight: 900
  },
  summaryLine: {
    fontSize: UI_TYPO.size11,
    color: UI_PALETTE.text.secondary
  },
  wizardBrand: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.66,
    marginBottom: 8,
    fontWeight: 800,
    position: "relative",
    zIndex: 1
  },
  wizardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    position: "relative",
    zIndex: 1
  },
  stepTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    position: "relative",
    zIndex: 1
  },
  stepTopBrand: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.58,
    fontWeight: 800
  },
  langBtn: {
    height: 28,
    padding: "0 10px",
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    fontSize: UI_TYPO.size11,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: UI_CONTROL.shadow.soft
  },
  wizardWelcome: {
    fontSize: 44,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: 1.2,
    marginBottom: 10,
    opacity: 0.96,
    position: "relative",
    zIndex: 1,
    textShadow: "0 10px 32px rgba(0,0,0,0.32)"
  },
  wizardTitle: { fontWeight: 900, fontSize: 20, lineHeight: 1.25, opacity: 0.98, position: "relative", zIndex: 1 },
  wizardSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.55,
    color: UI_PALETTE.text.primary,
    opacity: 0.94,
    position: "relative",
    zIndex: 1
  },
  newProjectMediaRow: { display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 10 },
  newProjectMediaBtn: {
    height: 44,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${WIZARD_BORDER}`,
    background: "#1f2125",
    color: "rgba(229,231,235,0.95)",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxShadow: UI_CONTROL.shadow.soft
  },
  newProjectMediaBtnHover: {
    border: `1px solid ${WIZARD_BORDER}`,
    background: "#24262b",
    boxShadow: UI_CONTROL.shadow.hover,
    transform: "translateY(-1px)"
  },
  newProjectMediaBtnOn: {
    border: `1px solid ${WIZARD_ACCENT}`,
    background: WIZARD_ACCENT,
    color: "#1f2125",
    boxShadow: UI_CONTROL.shadow.hover
  },
  wizardBullets: {
    marginTop: 8,
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    background: UI_INFO.surface.default,
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.45,
    display: "grid",
    gap: 6,
    color: UI_PALETTE.text.primary,
    position: "relative",
    zIndex: 1
  },
  onboardingStepRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8
  },
  onboardingStepItem: {
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    background: UI_INFO.surface.subtle,
    padding: "8px 10px",
    lineHeight: 1.4,
    fontWeight: 700,
    fontSize: 12,
    color: UI_PALETTE.text.primary,
    position: "relative",
    zIndex: 1
  },
  wizardPrinciple: {
    marginTop: 8,
    border: `1px solid ${UI_STATUS.border.info}`,
    borderRadius: UI_RADIUS.control,
    background: UI_STATUS.surface.info,
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.96,
    color: UI_PALETTE.text.primary,
    position: "relative",
    zIndex: 1
  },
  wizardPrincipleColumn: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6
  },
  wizardPrincipleSub: {
    marginLeft: 14,
    opacity: 0.9
  },
  wizardPlanGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8,
    marginTop: 8
  },
  wizardPlanCard: {
    textAlign: "center",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    padding: "10px 12px",
    cursor: "pointer",
    color: "inherit",
    display: "grid",
    placeItems: "center",
    boxShadow: UI_CONTROL.shadow.soft
  },
  wizardPlanCardHover: {
    border: `1px solid ${UI_CONTROL.border.hover}`,
    background: UI_CONTROL.bg.hover,
    boxShadow: UI_CONTROL.shadow.hover,
    transform: "translateY(-1px)"
  },
  wizardPlanCardOn: {
    border: `1px solid ${UI_PALETTE.border.active}`,
    background: UI_PALETTE.surface.surfaceActive,
    boxShadow: UI_CONTROL.shadow.hover,
    ["--spx-btn-bg-hover" as any]: UI_CONTROL.bg.accentHover,
    ["--spx-btn-bg-active" as any]: UI_CONTROL.bg.accentActive,
    ["--spx-btn-border-hover" as any]: UI_CONTROL.border.active,
    ["--spx-btn-border-active" as any]: UI_CONTROL.border.active
  },
  wizardPlanTitle: { fontSize: 13, fontWeight: 900, marginBottom: 4, textAlign: "center", width: "100%" },
  wizardPlanDesc: { fontSize: 12, opacity: 0.76, lineHeight: 1.4, textAlign: "center", width: "100%" },
  modalFormRow: {
    display: "grid",
    gridTemplateColumns: "minmax(90px,120px) minmax(0,1fr)",
    gap: 10,
    alignItems: "center",
    marginTop: 8
  },
  modalLabel: { fontSize: 12, opacity: 0.86, fontWeight: 800 },
  modalLabelWithHelp: {
    fontSize: 12,
    opacity: 0.86,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  },
  helpQ: {
    width: 16,
    height: 16,
    borderRadius: 999,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "rgba(230,238,255,0.90)",
    fontSize: 11,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    cursor: "help",
    boxShadow: UI_CONTROL.shadow.soft
  },
  helpWrap: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center"
  },
  helpBubble: {
    position: "absolute",
    left: 22,
    top: -8,
    transform: "translateY(-100%)",
    width: "min(240px, calc(92vw - 72px))",
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    background: UI_INFO.surface.elevated,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    padding: "8px 10px",
    fontSize: 11,
    lineHeight: 1.4,
    color: "rgba(230,238,255,0.92)",
    zIndex: 20,
    pointerEvents: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical"
  },
  modalInput: {
    height: 34,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: "inherit",
    padding: "0 10px",
    outline: "none",
    fontSize: 12,
    fontWeight: 700
  },
  modalSelect: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    height: 34,
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: "inherit",
    padding: "0 34px 0 10px",
    outline: "none",
    fontSize: 12,
    fontWeight: 700,
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, rgba(220,232,255,0.78) 50%), linear-gradient(135deg, rgba(220,232,255,0.78) 50%, transparent 50%), linear-gradient(to right, transparent, transparent)",
    backgroundPosition: "calc(100% - 18px) calc(50% - 1px), calc(100% - 12px) calc(50% - 1px), 100% 0",
    backgroundSize: "6px 6px, 6px 6px, 2.2em 2.2em",
    backgroundRepeat: "no-repeat"
  },
  step3WarnBox: {
    marginTop: 6,
    border: `1px solid ${UI_STATUS.border.warn}`,
    borderRadius: UI_RADIUS.control,
    background: UI_STATUS.surface.warn,
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.4
  },
  step3Body: {
    maxWidth: 600,
    marginInline: "auto"
  },
  step3FormRow: {
    display: "grid",
    gridTemplateColumns: "minmax(90px,120px) minmax(0,1fr)",
    gap: 10,
    alignItems: "center",
    marginTop: 8,
    maxWidth: 600,
    marginInline: "auto"
  },
  manualDurGrid: {
    marginTop: 8,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))",
    gap: 8
  },
  manualDurItem: {
    height: 30,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "0 8px"
  },
  manualDurInput: {
    height: 28,
    border: "none",
    background: "transparent",
    color: "inherit",
    outline: "none",
    fontSize: 12,
    minWidth: 0
  },
  manualDurUnit: {
    fontSize: 11,
    opacity: 0.78
  },
  wizardPreviewWrap: {
    marginTop: 10,
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    padding: 10,
    background: UI_INFO.surface.default
  },
  wizardPreviewTitle: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.9,
    marginBottom: 8
  },
  wizardPreviewList: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 6
  },
  wizardPreviewItem: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
    border: `1px solid ${UI_INFO.border.subtle}`,
    borderRadius: UI_RADIUS.control,
    padding: "6px 8px",
    fontSize: 12,
    background: UI_INFO.surface.subtle
  },
  wizardPreviewName: { fontWeight: 700, opacity: 0.92 },
  wizardPreviewMeta: { opacity: 0.78, marginLeft: 8 },
  modalBtns: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
    flexWrap: "wrap",
    position: "relative",
    zIndex: 1
  },
  modalBtn: {
    height: 34,
    padding: "0 14px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${WIZARD_ACCENT}`,
    background: WIZARD_ACCENT,
    color: "#1f2125",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    boxShadow: UI_CONTROL.shadow.soft
  },
  modalBtnHover: {
    border: `1px solid ${WIZARD_ACCENT}`,
    background: "#d97706",
    boxShadow: UI_ACTION.shadow.hover,
    transform: "translateY(-1px)"
  },
  modalBtnPressed: {
    border: `1px solid ${WIZARD_ACCENT}`,
    background: "#b45309",
    boxShadow: UI_CONTROL.shadow.active,
    transform: "translateY(0)"
  },
  modalBtnGhost: {
    height: 34,
    padding: "0 14px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    boxShadow: UI_CONTROL.shadow.soft
  },
  modalBtnGhostHover: {
    border: `1px solid ${UI_CONTROL.border.hover}`,
    background: UI_CONTROL.bg.hover,
    boxShadow: UI_CONTROL.shadow.hover,
    transform: "translateY(-1px)"
  },
  modalBtnGhostPressed: {
    border: `1px solid ${UI_CONTROL.border.active}`,
    background: UI_CONTROL.bg.active,
    boxShadow: UI_CONTROL.shadow.active,
    transform: "translateY(0)"
  }
};
