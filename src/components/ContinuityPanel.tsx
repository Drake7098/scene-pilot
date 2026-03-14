/**
 * Continuity Panel - shows scene承接关系 and carry-over in Pro Sidebar.
 * Rendered below Scenes when project has continuity (continuous/multicam).
 */

import React from "react";
import { Link2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Lang } from "../i18n";
import type { ContinuityViewModel } from "../utils/continuityViewModel";
import {
  buildContinuityViewModel,
  transitionLabel,
  dirDisplay
} from "../utils/continuityViewModel";
import { EditorSection } from "./ui";
import { editorTheme } from "../theme/editorTheme";
import { PRO_TYPO } from "../uiTokens";

const { colors: ec } = editorTheme;

type Props = {
  lang: Lang;
  project: { scenes?: unknown[]; project?: { shotPlan?: string; mediaType?: string }; meta?: { currentTemplate?: { domain?: string } } };
  currentSceneIndex: number;
  onSetSceneIdx: (i: number) => void;
  collapsed: boolean;
  onToggle: () => void;
};

export function ContinuityPanel({
  lang,
  project,
  currentSceneIndex,
  onSetSceneIdx,
  collapsed,
  onToggle
}: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const vm = buildContinuityViewModel(project as import("../model").Project, currentSceneIndex);

  const isEmpty = !vm.continuityEnabled && vm.templateType === "base";
  const isVideo = (project.project?.mediaType ?? "video") === "video";
  const hasScenes = (project.scenes?.length ?? 0) > 1;

  if (!isVideo) {
    return null;
  }

  return (
    <EditorSection
      title={t("连续性", "Continuity")}
      icon={Link2}
      open={!collapsed}
      onOpenChange={(open) => {
        if (open !== !collapsed) onToggle();
      }}
    >
      <div style={styles.wrap}>
        {isEmpty && !hasScenes ? (
          <div style={styles.empty}>
            <div style={styles.emptyHint}>{t("单镜或非连续项目", "Single shot or non-continuous")}</div>
          </div>
        ) : isEmpty && hasScenes ? (
          <div style={styles.empty}>
            <div style={styles.emptyHint}>{t("多镜非连续模板", "Multi-shot, non-continuity template")}</div>
            <SummaryRow vm={vm} lang={lang} t={t} onSetSceneIdx={onSetSceneIdx} />
          </div>
        ) : (
          <>
            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span style={styles.label}>{t("连续", "Continuity")}</span>
                <span style={styles.badge}>{vm.continuityEnabled ? t("开", "On") : t("关", "Off")}</span>
              </div>
              {vm.templateType && vm.templateType !== "base" ? (
                <div style={styles.summaryRow}>
                  <span style={styles.label}>{t("模板", "Template")}</span>
                  <span style={styles.badge}>
                    {vm.templateType === "webdrama" ? t("网剧", "Web Drama") : t("动漫", "Anime")}
                  </span>
                </div>
              ) : null}
              <div style={styles.summaryRow}>
                <span style={styles.label}>{t("分镜", "Scene")}</span>
                <span style={styles.value}>
                  {currentSceneIndex + 1} / {vm.totalScenes}
                </span>
              </div>
            </div>

            {vm.continuityEnabled && (
              <>
                <div style={styles.block}>
                  <div style={styles.blockTitle}>{t("承接关系", "Links")}</div>
                  <div style={styles.linkRow}>
                    <span style={styles.linkLabel}>{t("前镜", "From prev")}</span>
                    <span>{vm.sceneLinks.fromPrevious ? "✓" : "—"}</span>
                  </div>
                  <div style={styles.linkRow}>
                    <span style={styles.linkLabel}>{t("后镜", "To next")}</span>
                    <span>{vm.sceneLinks.toNext ? "✓" : "—"}</span>
                  </div>
                  <div style={styles.linkRow}>
                    <span style={styles.linkLabel}>{t("衔接", "Transition")}</span>
                    <span>{transitionLabel(lang, vm.sceneLinks.transition)}</span>
                  </div>
                  {(vm.sceneLinks.entryDir || vm.sceneLinks.exitDir) && (
                    <div style={styles.linkRow}>
                      <span style={styles.linkLabel}>{t("方向", "Direction")}</span>
                      <span>
                        {vm.sceneLinks.entryDir ? dirDisplay(vm.sceneLinks.entryDir, lang) : ""}
                        {vm.sceneLinks.entryDir && vm.sceneLinks.exitDir ? " → " : ""}
                        {vm.sceneLinks.exitDir ? dirDisplay(vm.sceneLinks.exitDir, lang) : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.block}>
                  <div style={styles.blockTitle}>{t("承接继承", "Carry-over")}</div>
                  <div style={styles.carryRow}>
                    <span>{vm.carryOver.character ? "✓" : "—"}</span>
                    <span style={styles.carryLabel}>{t("角色", "Character")}</span>
                  </div>
                  <div style={styles.carryRow}>
                    <span>{vm.carryOver.direction ? "✓" : "—"}</span>
                    <span style={styles.carryLabel}>{t("方向", "Direction")}</span>
                  </div>
                  <div style={styles.carryRow}>
                    <span>{vm.carryOver.camera ? "✓" : "—"}</span>
                    <span style={styles.carryLabel}>{t("镜头", "Camera")}</span>
                  </div>
                  <div style={styles.carryRow}>
                    <span>{vm.carryOver.background ? "✓" : "—"}</span>
                    <span style={styles.carryLabel}>{t("背景", "Background")}</span>
                  </div>
                </div>

                {vm.anchorSummary.length > 0 && (
                  <div style={styles.block}>
                    <div style={styles.blockTitle}>{t("连续锚点", "Anchors")}</div>
                    <div style={styles.anchorList}>
                      {vm.anchorSummary.map((id) => (
                        <span key={id} style={styles.anchorTag}>
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.nav}>
                  <button
                    type="button"
                    className="pro-btn-ghost"
                    style={styles.navBtn}
                    onClick={() => onSetSceneIdx(currentSceneIndex - 1)}
                    disabled={!vm.hasPrev}
                    title={t("上一镜", "Previous scene")}
                  >
                    <ChevronLeft size={14} />
                    {t("上一镜", "Prev")}
                  </button>
                  <button
                    type="button"
                    className="pro-btn-ghost"
                    style={styles.navBtn}
                    onClick={() => onSetSceneIdx(currentSceneIndex + 1)}
                    disabled={!vm.hasNext}
                    title={t("下一镜", "Next scene")}
                  >
                    {t("下一镜", "Next")}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </>
            )}

            {!vm.continuityEnabled && hasScenes && (
              <div style={styles.nav}>
                <button
                  type="button"
                  className="pro-btn-ghost"
                  style={styles.navBtn}
                  onClick={() => onSetSceneIdx(Math.max(0, currentSceneIndex - 1))}
                  disabled={currentSceneIndex <= 0}
                >
                  <ChevronLeft size={14} /> {t("上一镜", "Prev")}
                </button>
                <button
                  type="button"
                  className="pro-btn-ghost"
                  style={styles.navBtn}
                  onClick={() => onSetSceneIdx(Math.min((project.scenes?.length ?? 1) - 1, currentSceneIndex + 1))}
                  disabled={currentSceneIndex >= (project.scenes?.length ?? 1) - 1}
                >
                  {t("下一镜", "Next")} <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </EditorSection>
  );
}

function SummaryRow({
  vm,
  lang,
  t,
  onSetSceneIdx
}: {
  vm: ContinuityViewModel;
  lang: Lang;
  t: (zh: string, en: string) => string;
  onSetSceneIdx: (i: number) => void;
}) {
  return (
    <div style={styles.nav}>
      <button
        type="button"
        className="pro-btn-ghost"
        style={styles.navBtn}
        onClick={() => onSetSceneIdx(Math.max(0, vm.currentSceneIndex - 1))}
        disabled={!vm.hasPrev}
      >
        <ChevronLeft size={14} /> {t("上一镜", "Prev")}
      </button>
      <span style={styles.sceneIndex}>
        {vm.currentSceneIndex + 1} / {vm.totalScenes}
      </span>
      <button
        type="button"
        className="pro-btn-ghost"
        style={styles.navBtn}
        onClick={() => onSetSceneIdx(Math.min(vm.totalScenes - 1, vm.currentSceneIndex + 1))}
        disabled={!vm.hasNext}
      >
        {t("下一镜", "Next")} <ChevronRight size={14} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  empty: {
    padding: 8,
    textAlign: "center"
  },
  emptyHint: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    color: ec.textMuted,
    marginBottom: 8
  },
  summary: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily
  },
  label: {
    color: ec.textMuted
  },
  value: {
    color: ec.text
  },
  badge: {
    padding: "2px 6px",
    borderRadius: 4,
    background: ec.hover,
    color: ec.text,
    fontSize: PRO_TYPO["3xs"]
  },
  block: {
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  blockTitle: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    fontWeight: 600,
    color: ec.textMuted,
    marginBottom: 2
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily
  },
  linkLabel: {
    minWidth: 52,
    color: ec.textMuted
  },
  carryRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily
  },
  carryLabel: {
    color: ec.textMuted
  },
  anchorList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4
  },
  anchorTag: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    padding: "2px 6px",
    borderRadius: 4,
    background: ec.hover,
    color: ec.textMuted
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 4
  },
  navBtn: {
    fontSize: PRO_TYPO["3xs"],
    padding: "4px 8px",
    minHeight: "auto"
  },
  sceneIndex: {
    fontSize: PRO_TYPO["3xs"],
    fontFamily: PRO_TYPO.fontFamily,
    color: ec.textMuted
  }
};
