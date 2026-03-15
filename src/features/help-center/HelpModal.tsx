/**
 * Help Center — modal container: mask, header, close, layout.
 */

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { HelpSectionId } from "./types";
import { HelpLayout } from "./HelpLayout";
import type { HelpPanelFeedbackProps } from "./HelpPanel";

type Lang = "zh" | "en";

const styles = {
  mask: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    borderRadius: 16,
    border: "1px solid rgba(170,193,226,0.24)",
    background: "radial-gradient(520px 360px at 82% 18%, rgba(74,196,192,0.12), transparent 58%), radial-gradient(420px 260px at 24% 84%, rgba(104,171,255,0.12), transparent 56%), rgba(12,17,27,0.96)",
    boxShadow: "0 14px 34px rgba(2,6,14,0.5)",
    padding: 14,
    backdropFilter: "blur(18px)",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    width: "min(860px, calc(100vw - 32px))",
    maxHeight: "min(85vh, 800px)"
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  title: {
    fontWeight: 900,
    fontSize: 14,
    opacity: 0.96,
    color: "rgba(237,243,252,0.96)"
  },
  iconBtn: {
    height: 30,
    width: 30,
    borderRadius: 12,
    border: "1px solid rgba(170,193,226,0.24)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};

export function HelpModal({
  open,
  onClose,
  sectionId,
  setSectionId,
  lang,
  viewportWidth,
  feedbackProps
}: {
  open: boolean;
  onClose: () => void;
  sectionId: HelpSectionId;
  setSectionId: (id: HelpSectionId) => void;
  lang: Lang;
  viewportWidth: number;
  feedbackProps?: HelpPanelFeedbackProps | null;
}) {
  if (!open) return null;
  const modal = (
    <div
      data-testid="help-center-mask"
      style={styles.mask}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        data-testid="help-center-modal"
        style={styles.modal}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={styles.head}>
          <div style={styles.title}>{lang === "zh" ? "帮助中心" : "Help Center"}</div>
          <button
            data-testid="help-center-close-top"
            style={styles.iconBtn}
            type="button"
            onClick={onClose}
            aria-label={lang === "zh" ? "关闭帮助中心" : "Close help center"}
          >
            <X size={16} />
          </button>
        </div>
        <HelpLayout
          sectionId={sectionId}
          setSectionId={setSectionId}
          lang={lang}
          viewportWidth={viewportWidth}
          feedbackProps={feedbackProps}
        />
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}