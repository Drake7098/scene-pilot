/**
 * Help Center — scrollable content panel (Stage 3).
 * Section title, block list as cards; FAQ blocks first, then feedback block. Content from helpContent (Stage2).
 */

import React from "react";
import type { HelpSectionId } from "./types";
import type { Lang } from "../../i18n";
import { getHelpContentForLang } from "./helpContent";
import { helpPanelStyles, helpFeedbackStyles } from "./helpStyles";

export type HelpPanelFeedbackProps = {
  feedbackText: string;
  setFeedbackText: (v: string) => void;
  feedbackSending: boolean;
  feedbackSent: "" | "ok" | "fail";
  onCopyTemplate: () => void;
  onSubmitFeedback: () => void;
  supportChannel: string;
  businessChannel: string;
  systemMailbox: string;
};

export function HelpPanel({
  sectionId,
  lang,
  feedbackProps
}: {
  sectionId: HelpSectionId;
  lang: Lang;
  feedbackProps?: HelpPanelFeedbackProps | null;
}) {
  const { title, blocks } = getHelpContentForLang(sectionId, lang);

  const isFaq = sectionId === "faq";
  const faqBlocks = isFaq ? blocks : [];
  const mainBlocks = isFaq ? [] : blocks;

  return (
    <div style={helpPanelStyles.wrap} data-testid={`help-center-section-${sectionId}`}>
      <div style={helpPanelStyles.sectionTitle}>{title}</div>

      {mainBlocks.length > 0 ? (
        <div style={helpPanelStyles.blockList}>
          {mainBlocks.map((block, i) => (
            <div
              key={i}
              style={helpPanelStyles.blockCard}
              data-testid={`help-center-block-${sectionId}-${i}`}
            >
              <div style={helpPanelStyles.blockTitle}>{block.title}</div>
              <div style={helpPanelStyles.blockText}>{block.text}</div>
            </div>
          ))}
        </div>
      ) : null}

      {isFaq ? (
        <>
          <div style={helpPanelStyles.blockList}>
            {faqBlocks.map((block, i) => (
              <div
                key={i}
                style={helpPanelStyles.blockCard}
                data-testid={`help-center-block-faq-${i}`}
              >
                <div style={helpPanelStyles.blockTitle}>{block.title}</div>
                <div style={helpPanelStyles.blockText}>{block.text}</div>
              </div>
            ))}
          </div>
          {feedbackProps ? (
            <div data-testid="help-center-feedback" style={helpFeedbackStyles.block}>
              <div style={helpFeedbackStyles.title}>
                {lang === "zh" ? "反馈" : "Feedback"}
              </div>
              <div style={helpFeedbackStyles.channels}>
                {lang === "zh"
                  ? `客服支持：${feedbackProps.supportChannel} ｜ 商务合作：${feedbackProps.businessChannel}`
                  : `Support: ${feedbackProps.supportChannel} | Business: ${feedbackProps.businessChannel}`}
              </div>
              <div style={helpFeedbackStyles.templateBox}>
                <div style={helpFeedbackStyles.templateLine}>
                  {lang === "zh" ? "【问题】" : "[Issue]"}
                </div>
                <div style={helpFeedbackStyles.templateLine}>
                  {lang === "zh" ? "【复现步骤】1) 2) 3)" : "[Steps] 1) 2) 3)"}
                </div>
                <div style={helpFeedbackStyles.templateLine}>
                  {lang === "zh" ? "【期望】" : "[Expected]"}
                </div>
                <div style={helpFeedbackStyles.templateLine}>
                  {lang === "zh" ? "【实际】" : "[Actual]"}
                </div>
                <div style={helpFeedbackStyles.templateLine}>
                  {lang === "zh" ? "【环境】浏览器/系统" : "[Env] Browser/OS"}
                </div>
              </div>
              <textarea
                value={feedbackProps.feedbackText}
                onChange={(e) => feedbackProps.setFeedbackText(e.target.value)}
                placeholder={
                  lang === "zh"
                    ? "把你的反馈写在这里（可选），然后点“发送”或“复制”"
                    : "Write your feedback here (optional), then click Send or Copy"
                }
                style={helpFeedbackStyles.textarea}
              />
              {feedbackProps.feedbackSent ? (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                  {feedbackProps.feedbackSent === "ok"
                    ? lang === "zh"
                      ? "✅ 已发送"
                      : "✅ Sent"
                    : lang === "zh"
                      ? "❌ 发送失败（可能是未部署 telemetry worker 或网络问题）"
                      : "❌ Failed (worker not deployed or network issue)"}
                </div>
              ) : null}
              <div style={helpFeedbackStyles.btns}>
                <button
                  style={helpFeedbackStyles.btnGhost}
                  onClick={feedbackProps.onCopyTemplate}
                  type="button"
                >
                  {lang === "zh" ? "复制" : "Copy"}
                </button>
                <button
                  style={helpFeedbackStyles.btnPrimary}
                  onClick={feedbackProps.onSubmitFeedback}
                  type="button"
                  disabled={feedbackProps.feedbackSending}
                >
                  {feedbackProps.feedbackSending
                    ? lang === "zh"
                      ? "发送中…"
                      : "Sending…"
                    : lang === "zh"
                      ? "发送"
                      : "Send"}
                </button>
              </div>
              <div style={helpFeedbackStyles.channels}>
                {lang === "zh"
                  ? `系统通知：${feedbackProps.systemMailbox}（请勿直接回复）`
                  : `System notifications: ${feedbackProps.systemMailbox} (do not reply)`}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
