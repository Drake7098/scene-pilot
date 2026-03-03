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
    media: 500,
    image_setup: 520,
    video_plan: 560,
    video_setup: 560
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
              <button
                style={styles.modalBtn}
                onClick={() => {
                  onMarkOnboardingDone();
                  setStep("media");
                }}
                type="button"
              >
                {lang === "zh" ? "开始创建" : "Start Creating"}
              </button>
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
                style={{ ...styles.newProjectMediaBtn, ...(draft.mediaType === "image" ? styles.newProjectMediaBtnOn : {}) }}
                onClick={() => setDraft((s) => nextWizardDraft({ ...s, mediaType: "image", shotPlan: "single", shotCount: 1 }))}
              >
                {lang === "zh" ? "图片" : "Image"}
              </button>
              <button
                type="button"
                style={{ ...styles.newProjectMediaBtn, ...(draft.mediaType === "video" ? styles.newProjectMediaBtnOn : {}) }}
                onClick={() => setDraft((s) => nextWizardDraft({ ...s, mediaType: "video", shotPlan: "single", shotCount: 1 }))}
              >
                {lang === "zh" ? "视频" : "Video"}
              </button>
            </div>
            <div style={styles.modalText}>
              {draft.mediaType === "image"
                ? lang === "zh"
                  ? "图片：单分镜，适合海报/概念图。"
                  : "Image: single shot for posters/concepts."
                : lang === "zh"
                  ? "视频：分镜驱动，适合多镜头叙事。"
                  : "Video: storyboard-driven multi-shot narrative."}
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <button style={styles.modalBtnGhost} onClick={onCancel} type="button">
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
              ) : null}
              <button style={styles.modalBtn} onClick={() => setStep(draft.mediaType === "image" ? "image_setup" : "video_plan")} type="button">
                {lang === "zh" ? "下一步" : "Next"}
              </button>
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
                <button style={styles.modalBtnGhost} onClick={onCancel} type="button">
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
              ) : null}
              <button style={styles.modalBtnGhost} onClick={() => setStep("media")} type="button">
                {lang === "zh" ? "上一步" : "Back"}
              </button>
              <button style={styles.modalBtn} onClick={onCreateProject} type="button">
                {lang === "zh" ? "开始编辑" : "Start Editing"}
              </button>
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
                    style={{ ...styles.wizardPlanCard, ...(on ? styles.wizardPlanCardOn : {}) }}
                    onClick={() =>
                      setDraft((s) =>
                        nextWizardDraft({ ...s, shotPlan: p.id as ShotPlan, shotCount: defaultShotCount(p.id as ShotPlan) })
                      )
                    }
                  >
                    <div style={styles.wizardPlanTitle}>{lang === "zh" ? p.zh : p.en}</div>
                    <div style={styles.wizardPlanDesc}>{lang === "zh" ? p.descZh : p.descEn}</div>
                  </button>
                );
              })}
            </div>
            <div style={styles.wizardPrinciple}>
              {draft.shotPlan === "multicam" ? (
                <div style={styles.wizardPrincipleColumn}>
                  <div>{lang === "zh" ? "连接预览：Shot01 -> Shot02 = cut / reverse angle" : "Transition preview: Shot01 -> Shot02 = cut / reverse angle"}</div>
                  <div>{lang === "zh" ? "对象继承：默认开启（推荐）" : "Object inheritance: ON by default (recommended)"}</div>
                </div>
              ) : draft.shotPlan === "continuous" ? (
                <div style={styles.wizardPrincipleColumn}>
                  <div>{lang === "zh" ? "连接预览：Shot01 -> Shot02 = camera continues" : "Transition preview: Shot01 -> Shot02 = camera continues"}</div>
                  <div>{lang === "zh" ? "对象继承：强制开启（连续镜头）" : "Object inheritance: forced ON (continuous mode)"}</div>
                </div>
              ) : draft.shotPlan === "edit" ? (
                <div style={styles.wizardPrincipleColumn}>
                  <div>{lang === "zh" ? "连接预览：Shot01 -> Shot02 = cut / dissolve / time jump" : "Transition preview: Shot01 -> Shot02 = cut / dissolve / time jump"}</div>
                  <div>{lang === "zh" ? "对象继承：默认关闭（可单镜头调整）" : "Object inheritance: OFF by default"}</div>
                </div>
              ) : null}
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <button style={styles.modalBtnGhost} onClick={onCancel} type="button">
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
              ) : null}
              <button style={styles.modalBtnGhost} onClick={() => setStep("media")} type="button">
                {lang === "zh" ? "上一步" : "Back"}
              </button>
              <button style={styles.modalBtn} onClick={() => setStep("video_setup")} type="button">
                {lang === "zh" ? "下一步" : "Next"}
              </button>
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
                <label style={styles.modalLabel}>{lang === "zh" ? "总时长(s)" : "Total Duration(s)"}</label>
                <input
                value={String(draft.totalDuration)}
                onChange={(e) => setDraft((s) => nextWizardDraft({ ...s, totalDuration: Math.max(1, Math.round(Number(e.target.value) || 12)) }))}
                style={styles.modalInput}
                inputMode="numeric"
              />
            </div>
            </div>
            <div style={styles.step3HintText}>
              {lang === "zh"
                ? "创建后可在分镜中继续修改每镜秒数，建议时长不要过长。"
                : "After creation, you can adjust shot seconds in scene list. Keep durations reasonable."}
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
            <div style={{ ...styles.wizardPrinciple, ...styles.step3Body }}>
              {lang === "zh" ? (
                <div style={styles.wizardPrincipleColumn}>
                  <div>单镜头：1 个分镜完成整体画面表达。</div>
                  <div>多机位 / 连续镜头：同场景下用于切换角度或连续推进运动。</div>
                  <div>标准剪辑：允许切场、叠化与时间跳转。</div>
                </div>
              ) : (
                <div style={styles.wizardPrincipleColumn}>
                  <div>Single: one shot carries the full expression.</div>
                  <div>Multicam / Continuous: same scene for angle switches or continuous movement.</div>
                  <div>Edit: allows scene cuts, dissolves, and time jumps.</div>
                </div>
              )}
            </div>
            <div style={styles.modalBtns}>
              {canCancel ? (
                <button style={styles.modalBtnGhost} onClick={onCancel} type="button">
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
              ) : null}
              <button style={styles.modalBtnGhost} onClick={() => setStep("video_plan")} type="button">
                {lang === "zh" ? "上一步" : "Back"}
              </button>
              <button
                style={styles.modalBtn}
                onClick={() => {
                  if (!validateVideoSetup()) return;
                  onCreateProject();
                }}
                type="button"
              >
                {lang === "zh" ? "开始编辑" : "Start Editing"}
              </button>
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
    width: 520,
    maxWidth: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 14,
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
    fontWeight: 800
  },
  newProjectMediaBtnOn: {
    border: "1px solid rgba(120,180,255,0.78)",
    background: "rgba(120,180,255,0.12)",
    boxShadow: "0 0 0 2px rgba(120,180,255,0.18) inset"
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
    textAlign: "left",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "inherit"
  },
  wizardPlanCardOn: {
    border: "1px solid rgba(120,180,255,0.7)",
    background: "rgba(120,180,255,0.12)"
  },
  wizardPlanTitle: { fontSize: 13, fontWeight: 900, marginBottom: 4 },
  wizardPlanDesc: { fontSize: 12, opacity: 0.76, lineHeight: 1.4 },
  modalFormRow: {
    display: "grid",
    gridTemplateColumns: "96px 1fr",
    gap: 8,
    alignItems: "center",
    marginTop: 6
  },
  modalLabel: { fontSize: 12, opacity: 0.86, fontWeight: 800 },
  modalInput: {
    height: 32,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    padding: "0 8px",
    outline: "none",
    fontSize: 12
  },
  modalSelect: {
    height: 32,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    padding: "0 8px",
    outline: "none",
    fontSize: 12
  },
  step3HintText: {
    marginTop: 6,
    maxWidth: 480,
    marginInline: "auto",
    fontSize: 12,
    opacity: 0.78,
    lineHeight: 1.45
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
    maxWidth: 480,
    marginInline: "auto"
  },
  step3FormRow: {
    display: "grid",
    gridTemplateColumns: "92px minmax(0, 360px)",
    gap: 8,
    alignItems: "center",
    marginTop: 6,
    maxWidth: 480,
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
    border: "1px solid rgba(120,180,255,0.62)",
    background: "rgba(120,180,255,0.22)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
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
  }
};
