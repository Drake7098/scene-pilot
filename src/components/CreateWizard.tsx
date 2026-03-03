import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Lang } from "../i18n";
import type { ShotPlan } from "../model";

export type NewProjectMedia = "image" | "video";
export type CreateStep = "welcome_1" | "welcome_2" | "media" | "image_setup" | "video_plan" | "video_setup";
export type DurationMode = "average" | "manual";
export type RatioOption = "16:9" | "9:16" | "1:1";
export type WizardDraft = {
  projectName: string;
  mediaType: NewProjectMedia;
  ratio: RatioOption;
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
        name: `${noText}｜${lang === "zh" ? "镜头" : "Shot"}${noText}`,
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
    welcome_1: 600,
    welcome_2: 640,
    media: 320,
    image_setup: 320,
    video_plan: 340,
    video_setup: 340
  };
  const modalWidth = modalWidthByStep[step] ?? 540;

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
        {floatingHint ? <div style={styles.floatingHint}>{floatingHint}</div> : null}

        {step === "welcome_1" ? (
          <>
            <div style={styles.wizardTopRow}>
              <div style={styles.wizardBrand}>ScenePilotix</div>
              <button style={styles.langBtn} type="button" onClick={onToggleLang}>
                {lang === "zh" ? "EN" : "中文"}
              </button>
            </div>
            <div style={styles.wizardWelcome}>WELCOME</div>
            <div style={styles.wizardTitle}>{lang === "zh" ? "把想法结构化成可生成的画面" : "Structure Ideas into Generatable Visuals"}</div>
            <div style={styles.wizardSubtitle}>
              {lang === "zh"
                ? "ScenePilotix 帮你用“分镜逻辑”组织图像与视频提示词。"
                : "ScenePilotix helps organize image/video prompts with storyboard logic."}
            </div>
            <div style={styles.wizardBullets}>
              <div>{lang === "zh" ? "精准布局人物与物体" : "Precisely place characters and objects"}</div>
              <div>{lang === "zh" ? "用分镜管理镜头与机位" : "Manage shots and camera angles with storyboard"}</div>
              <div>{lang === "zh" ? "自动生成清晰的衔接语言" : "Auto-generate clear transition language"}</div>
            </div>
            <div style={styles.onboardingStepRow}>
              <div style={styles.onboardingStepItem}>{lang === "zh" ? "选择图片或视频" : "Choose Image or Video"}</div>
              <div style={styles.onboardingStepItem}>{lang === "zh" ? "添加分镜数量与每镜秒数" : "Set Shot Count and Duration per Shot"}</div>
              <div style={styles.onboardingStepItem}>{lang === "zh" ? "逐个分镜添加摆放对象（支持参考图）" : "Add and Place Objects Shot by Shot (Supports References)"}</div>
            </div>
            <div style={styles.wizardPrinciple}>
              {lang === "zh" ? (
                <div style={styles.wizardPrincipleColumn}>
                  <div>- 图片 = 永远只有一个分镜</div>
                  <div>- 视频 = 每个分镜代表一个镜头</div>
                  <div>- 系统自动生成衔接语言</div>
                  <div style={styles.wizardPrincipleSub}>同场景换角度 → 切换镜头 / 反打镜头</div>
                  <div style={styles.wizardPrincipleSub}>连续镜头 → 镜头连续推进 / 转向</div>
                  <div style={styles.wizardPrincipleSub}>换场景 → 切到新场景</div>
                </div>
              ) : (
                <div style={styles.wizardPrincipleColumn}>
                  <div>- Image = always one shot</div>
                  <div>- Video = each shot represents one camera shot</div>
                  <div>- System auto-generates transitions</div>
                  <div style={styles.wizardPrincipleSub}>Same scene angle change → cut / reverse angle</div>
                  <div style={styles.wizardPrincipleSub}>Continuous → camera continues / turns</div>
                  <div style={styles.wizardPrincipleSub}>Scene switch → cut to new location</div>
                </div>
              )}
            </div>
            <div style={styles.modalBtns}>
              <PrimaryActionButton
                label={lang === "zh" ? "开始创建" : "Start Creating"}
                onClick={() => {
                  onMarkOnboardingDone();
                  setStep("media");
                }}
              />
            </div>
          </>
        ) : null}

        {step === "media" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "第 1 步：你要生成什么？" : "Step 1: What do you want to generate?"}</div>
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
                onClick={() => setStep(draft.mediaType === "image" ? "image_setup" : "video_plan")}
              />
            </div>
          </>
        ) : null}

        {step === "image_setup" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "第 2 步：图片创建" : "Step 2A: Image Setup"}</div>
            <div style={styles.modalFormRow}>
              <label style={styles.modalLabel}>{lang === "zh" ? "项目名称" : "Project Name"}</label>
              <input
                value={draft.projectName}
                onChange={(e) => setDraft((s) => ({ ...s, projectName: e.target.value }))}
                style={styles.modalInput}
                placeholder={lang === "zh" ? "未命名项目" : "Untitled"}
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
              <SecondaryActionButton label={lang === "zh" ? "上一步" : "Back"} onClick={() => setStep("media")} />
              <PrimaryActionButton label={lang === "zh" ? "开始编辑" : "Start Editing"} onClick={onCreateProject} />
            </div>
          </>
        ) : null}

        {step === "video_plan" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "第 2 步：设置分镜结构" : "Step 2: Set Shot Structure"}</div>
            <div style={styles.wizardPlanGrid}>
              {[
                { id: "single", zh: "单镜头", en: "Single Shot", descZh: "一个分镜完成全部", descEn: "One shot for all" },
                { id: "multicam", zh: "同场景多机位", en: "Multicam", descZh: "场景不变只换角度", descEn: "Same location, angle changes" },
                { id: "continuous", zh: "连续镜头", en: "Continuous", descZh: "多分镜无缝连接", descEn: "Multi-shot no-cut illusion" },
                { id: "edit", zh: "标准剪辑", en: "Edit", descZh: "可切换场景和时间", descEn: "Scene/time jump allowed" }
              ].map((p) => {
                const on = draft.shotPlan === (p.id as ShotPlan);
                return (
                  <button
                    key={p.id}
                    type="button"
                    style={{
                      ...styles.wizardPlanCard,
                      ...(hoveredPlan === (p.id as ShotPlan) ? styles.wizardPlanCardHover : {}),
                      ...(planTouched && on ? styles.wizardPlanCardOn : {})
                    }}
                    onMouseEnter={() => setHoveredPlan(p.id as ShotPlan)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    onClick={() => {
                      setPlanTouched(true);
                      setDraft((s) =>
                        nextWizardDraft({ ...s, shotPlan: p.id as ShotPlan, shotCount: defaultShotCount(p.id as ShotPlan) })
                      );
                    }}
                  >
                    <div style={styles.wizardPlanTitle}>{lang === "zh" ? p.zh : p.en}</div>
                    <div style={styles.wizardPlanDesc}>{lang === "zh" ? p.descZh : p.descEn}</div>
                  </button>
                );
              })}
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <SecondaryActionButton label={lang === "zh" ? "取消" : "Cancel"} onClick={onCancel} />
              ) : null}
              <SecondaryActionButton label={lang === "zh" ? "上一步" : "Back"} onClick={() => setStep("media")} />
              <PrimaryActionButton label={lang === "zh" ? "下一步" : "Next"} onClick={() => setStep("video_setup")} />
            </div>
          </>
        ) : null}

        {step === "video_setup" ? (
          <>
            {stepHeader}
            <div style={styles.modalTitle}>{lang === "zh" ? "第 3 步：生成分镜骨架" : "Step 3: Build Shot Skeleton"}</div>
            <div style={styles.step3Body}>
              <div style={styles.step3FormRow}>
                <label style={styles.modalLabel}>{lang === "zh" ? "项目名称" : "Project Name"}</label>
                <input
                  value={draft.projectName}
                  onChange={(e) => setDraft((s) => ({ ...s, projectName: e.target.value }))}
                  style={styles.modalInput}
                  placeholder={lang === "zh" ? "未命名项目" : "Untitled"}
                />
              </div>
              <div style={styles.step3FormRow}>
                <label style={styles.modalLabel}>{lang === "zh" ? "分镜数量" : "Shot Count"}</label>
                <select
                  value={String(draft.shotCount)}
                  onChange={(e) => {
                    const shotCount = Math.max(1, Number(e.target.value) || 1);
                    setDraft((s) => nextWizardDraft({ ...s, shotCount }));
                  }}
                  style={styles.modalSelect}
                  disabled={draft.shotPlan === "single"}
                >
                  {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.step3FormRow}>
                <label style={styles.modalLabelWithHelp}>
                  <span>{lang === "zh" ? "总时长(s)" : "Total Duration(s)"}</span>
                  <span style={styles.helpWrap}>
                    <span
                      style={styles.helpQ}
                      onMouseEnter={() => setShowDurationHelp(true)}
                      onMouseLeave={() => setShowDurationHelp(false)}
                      onFocus={() => setShowDurationHelp(true)}
                      onBlur={() => setShowDurationHelp(false)}
                      tabIndex={0}
                    >
                      ?
                    </span>
                    {showDurationHelp ? (
                      <span style={styles.helpBubble}>
                        {lang === "zh"
                          ? "创建后可在分镜中继续修改每镜秒数，建议时长不要过长。"
                          : "After creation, you can adjust shot seconds in scene list. Keep durations reasonable."}
                      </span>
                    ) : null}
                  </span>
                </label>
                <input
                value={String(draft.totalDuration)}
                onChange={(e) => setDraft((s) => nextWizardDraft({ ...s, totalDuration: Math.max(1, Math.round(Number(e.target.value) || 12)) }))}
                style={styles.modalInput}
                inputMode="numeric"
              />
            </div>
            </div>
            {step3Warnings.length ? (
              <div style={{ ...styles.step3WarnBox, ...styles.step3Body }}>
                {step3Warnings.map((w, i) => (
                  <div key={`${i}-${w}`}>{`- ${w}`}</div>
                ))}
              </div>
            ) : null}
            <div style={styles.step3FormRow}>
              <label style={styles.modalLabel}>{lang === "zh" ? "时长分配" : "Duration Mode"}</label>
              <select
                value={draft.durationMode}
                onChange={(e) => setDraft((s) => nextWizardDraft({ ...s, durationMode: e.target.value as DurationMode }))}
                style={styles.modalSelect}
              >
                <option value="average">{lang === "zh" ? "平均分配" : "Average"}</option>
                <option value="manual">{lang === "zh" ? "手动填写" : "Manual"}</option>
              </select>
            </div>
            {draft.durationMode === "manual" ? (
              <div style={{ ...styles.manualDurGrid, ...styles.step3Body }}>
                {Array.from({ length: draft.shotCount }).map((_, i) => (
                  <div key={i} style={styles.manualDurItem}>
                    <input
                      value={String(draft.manualDurations[i] ?? 1)}
                      onChange={(e) => {
                        const val = Math.max(1, Math.round(Number(e.target.value) || 1));
                        setDraft((s) => {
                          const next = [...s.manualDurations];
                          next[i] = val;
                          return { ...s, manualDurations: next };
                        });
                      }}
                      style={styles.manualDurInput}
                      inputMode="numeric"
                      placeholder={`${lang === "zh" ? "镜头" : "Shot"} ${i + 1}`}
                    />
                    <span style={styles.manualDurUnit}>{lang === "zh" ? "秒" : "s"}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div style={{ ...styles.wizardPreviewWrap, ...styles.step3Body }}>
              <div style={styles.wizardPreviewTitle}>{lang === "zh" ? "分镜骨架预览" : "Shot Skeleton Preview"}</div>
              <div style={styles.wizardPreviewList}>
                {skeletonRows.map((row) => (
                  <div key={row.id} style={styles.wizardPreviewItem}>
                    <div style={styles.wizardPreviewName}>{row.name}</div>
                    <div style={styles.wizardPreviewMeta}>{lang === "zh" ? `${row.duration}秒` : `${row.duration}s`}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <SecondaryActionButton label={lang === "zh" ? "取消" : "Cancel"} onClick={onCancel} />
              ) : null}
              <SecondaryActionButton label={lang === "zh" ? "上一步" : "Back"} onClick={() => setStep("video_plan")} />
              <PrimaryActionButton
                label={lang === "zh" ? "开始编辑" : "Start Editing"}
                onClick={() => {
                  if (!validateVideoSetup()) return;
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

const styles: Record<string, CSSProperties> = {
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 640,
    maxWidth: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 16,
    position: "relative"
  },
  floatingHint: {
    position: "absolute",
    top: -44,
    right: 0,
    maxWidth: 420,
    borderRadius: 10,
    border: "1px solid rgba(120,180,255,0.45)",
    background: "rgba(18,26,44,0.96)",
    boxShadow: "0 12px 26px rgba(0,0,0,0.35)",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.35
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 8, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },
  wizardBrand: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.66,
    marginBottom: 8,
    fontWeight: 800
  },
  wizardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  stepTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
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
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer"
  },
  wizardWelcome: {
    fontSize: 44,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: 1.2,
    marginBottom: 10,
    opacity: 0.96
  },
  wizardTitle: { fontWeight: 900, fontSize: 20, lineHeight: 1.25, opacity: 0.98 },
  wizardSubtitle: { marginTop: 8, fontSize: 13, opacity: 0.82, lineHeight: 1.45 },
  newProjectMediaRow: { display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 10 },
  newProjectMediaBtn: {
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  newProjectMediaBtnHover: {
    border: "1px solid rgba(170,205,255,0.38)",
    background: "rgba(255,255,255,0.08)"
  },
  newProjectMediaBtnOn: {
    border: "1px solid rgba(120,180,255,0.72)",
    background: "rgba(120,180,255,0.14)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.22) inset"
  },
  wizardBullets: {
    marginTop: 8,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    padding: "10px 12px",
    fontSize: 13,
    lineHeight: 1.45,
    display: "grid",
    gap: 6
  },
  onboardingStepRow: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 8
  },
  onboardingStepItem: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    padding: "8px 10px",
    lineHeight: 1.4,
    fontWeight: 700,
    fontSize: 12
  },
  wizardPrinciple: {
    marginTop: 8,
    border: "1px solid rgba(120,180,255,0.22)",
    borderRadius: 10,
    background: "rgba(120,180,255,0.10)",
    padding: "8px 10px",
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.92
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "inherit",
    display: "grid",
    placeItems: "center"
  },
  wizardPlanCardHover: {
    border: "1px solid rgba(170,205,255,0.38)",
    background: "rgba(255,255,255,0.08)"
  },
  wizardPlanCardOn: {
    border: "1px solid rgba(120,180,255,0.72)",
    background: "rgba(120,180,255,0.14)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.22) inset"
  },
  wizardPlanTitle: { fontSize: 13, fontWeight: 900, marginBottom: 4, textAlign: "center", width: "100%" },
  wizardPlanDesc: { fontSize: 12, opacity: 0.76, lineHeight: 1.4, textAlign: "center", width: "100%" },
  modalFormRow: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0,1fr)",
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
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(230,238,255,0.90)",
    fontSize: 11,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    cursor: "help"
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
    width: 240,
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 10,
    background: "rgba(12,16,30,0.97)",
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
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
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
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
    border: "1px solid rgba(255,190,120,0.4)",
    borderRadius: 10,
    background: "rgba(90,64,18,0.18)",
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
    gridTemplateColumns: "120px minmax(0,1fr)",
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
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: 10,
    background: "rgba(255,255,255,0.03)"
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
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 12,
    background: "rgba(255,255,255,0.02)"
  },
  wizardPreviewName: { fontWeight: 700, opacity: 0.92 },
  wizardPreviewMeta: { opacity: 0.78, marginLeft: 8 },
  modalBtns: { display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" },
  modalBtn: {
    height: 34,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnHover: {
    border: "1px solid rgba(170,205,255,0.42)",
    background: "rgba(255,255,255,0.09)"
  },
  modalBtnPressed: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.14)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.24) inset"
  },
  modalBtnGhost: {
    height: 34,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800
  },
  modalBtnGhostHover: {
    border: "1px solid rgba(170,205,255,0.36)",
    background: "rgba(255,255,255,0.08)"
  },
  modalBtnGhostPressed: {
    border: "1px solid rgba(120,180,255,0.72)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 1px rgba(120,180,255,0.20) inset"
  }
};
