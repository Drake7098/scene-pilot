/**
 * Help Center — modal container (Stage 3).
 * Width 880–980px, maxHeight 85vh; panel scrolls inside.
 */

import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { HelpSectionId } from "./types";
import { HelpLayout } from "./HelpLayout";
import type { HelpPanelFeedbackProps } from "./HelpPanel";
import { helpModalStyles } from "./helpStyles";

type Lang = "zh" | "en";

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
      style={helpModalStyles.mask}
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        data-testid="help-center-modal"
        style={helpModalStyles.modal}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={helpModalStyles.head}>
          <div style={helpModalStyles.headTitle}>
            {lang === "zh" ? "帮助中心" : "Help Center"}
          </div>
          <button
            data-testid="help-center-close-top"
            style={helpModalStyles.iconBtn}
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
