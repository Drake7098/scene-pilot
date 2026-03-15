/**
 * Help Center — scrollable content panel; renders full help content per section (Stage 2).
 * Content from helpContent.ts; faq section includes feedback form when feedbackProps passed.
 */

import React from "react";
import type { HelpSectionId } from "./types";
import type { Lang } from "../../i18n";
import { getHelpContentForLang } from "./helpContent";

const styles = {
  panel: {
    minHeight: 280,
    border: "1px solid rgba(170,193,226,0.16)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.035)",
    padding: "10px 12px",
    overflow: "auto" as const
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 4,
    fontWeight: 900,
    fontSize: 14,
    opacity: 0.98,
    color: "rgba(237,243,252,0.96)"
  },
  blockTitle: {
    marginTop: 14,
    fontWeight: 800,
    fontSize: 12,
    opacity: 0.96,
    color: "rgba(237,243,252,0.96)"
  },
  blockText: {
    marginTop: 4,
    opacity: 0.94,
    color: "rgba(237,243,252,0.96)",
    lineHeight: 1.65,
    whiteSpace: "pre-line" as const,
    fontSize: 12
  }
};

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

  return (
    <div style={styles.panel}>
      <div style={styles.sectionTitle}>{title}</div>
      {blocks.map((block, i) => (
        <div key={i}>
          <div style={styles.blockTitle}>{block.title}</div>
          <div style={styles.blockText}>{block.text}</div>
        </div>
      ))}
      {sectionId === "faq" && feedbackProps ? (
        <HelpPanelFaqFeedback lang={lang} {...feedbackProps} />
      ) : null}
    </div>
  );
}

const feedbackStyles = {
  block: { marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(170,193,226,0.16)" },
  label: { fontSize: 12, fontWeight: 800, opacity: 0.9, marginBottom: 6 },
  channels: { marginTop: 8, fontSize: 12, opacity: 0.76, lineHeight: 1.5 },
  tpl: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(170,193,226,0.16)",
    background: "rgba(0,0,0,0.18)"
  },
  tplLine: { fontSize: 12, opacity: 0.82, lineHeight: 1.55 },
  textarea: {
    width: "100%",
    marginTop: 10,
    minHeight: 110,
    resize: "vertical" as const,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "10px 10px",
    fontSize: 12,
    lineHeight: 1.45
  },
  btns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" as const, marginTop: 12 },
  btnGhost: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(170,193,226,0.24)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  btn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(120,170,240,0.44)",
    background: "linear-gradient(180deg, rgba(27,37,54,0.88) 0%, rgba(20,29,44,0.92) 100%)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  }
};

function HelpPanelFaqFeedback(
  props: { lang: Lang } & HelpPanelFeedbackProps
) {
  const {
    lang,
    feedbackText,
    setFeedbackText,
    feedbackSending,
    feedbackSent,
    onCopyTemplate,
    onSubmitFeedback,
    supportChannel,
    businessChannel,
    systemMailbox
  } = props;
  return (
    <div style={feedbackStyles.block}>
      <div style={feedbackStyles.label}>{lang === "zh" ? "反馈" : "Feedback"}</div>
      <div style={feedbackStyles.channels}>
        {lang === "zh"
          ? `客服支持：${supportChannel} ｜ 商务合作：${businessChannel}`
          : `Support: ${supportChannel} | Business: ${businessChannel}`}
      </div>
      <div style={feedbackStyles.tpl}>
        <div style={feedbackStyles.tplLine}>{lang === "zh" ? "【问题】" : "[Issue]"}</div>
        <div style={feedbackStyles.tplLine}>{lang === "zh" ? "【复现步骤】1) 2) 3)" : "[Steps] 1) 2) 3)"}</div>
        <div style={feedbackStyles.tplLine}>{lang === "zh" ? "【期望】" : "[Expected]"}</div>
        <div style={feedbackStyles.tplLine}>{lang === "zh" ? "【实际】" : "[Actual]"}</div>
        <div style={feedbackStyles.tplLine}>{lang === "zh" ? "【环境】浏览器/系统" : "[Env] Browser/OS"}</div>
      </div>
      <textarea
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        placeholder={
          lang === "zh"
            ? "把你的反馈写在这里（可选），然后点“发送”或“复制”"
            : "Write your feedback here (optional), then click Send or Copy"
        }
        style={feedbackStyles.textarea}
      />
      {feedbackSent && (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.82 }}>
          {feedbackSent === "ok"
            ? lang === "zh"
              ? "✅ 已发送"
              : "✅ Sent"
            : lang === "zh"
              ? "❌ 发送失败（可能是未部署 telemetry worker 或网络问题）"
              : "❌ Failed (worker not deployed or network issue)"}
        </div>
      )}
      <div style={feedbackStyles.btns}>
        <button style={feedbackStyles.btnGhost} onClick={onCopyTemplate} type="button">
          {lang === "zh" ? "复制" : "Copy"}
        </button>
        <button style={feedbackStyles.btn} onClick={onSubmitFeedback} type="button" disabled={feedbackSending}>
          {feedbackSending ? (lang === "zh" ? "发送中…" : "Sending…") : lang === "zh" ? "发送" : "Send"}
        </button>
      </div>
      <div style={feedbackStyles.channels}>
        {lang === "zh" ? `系统通知：${systemMailbox}（请勿直接回复）` : `System notifications: ${systemMailbox} (do not reply)`}
      </div>
    </div>
  );
}
