import React from "react";
import { getIntentIcon } from "../config/intentConfig";
import type { TemplateIntentMeta } from "../model/templateIntent";
import type { Lang } from "../../../i18n";
import { TEMPLATE_WORKSPACE_UI } from "../constants/uiStyle";

const colors = TEMPLATE_WORKSPACE_UI.colors;

type Props = {
  intent: TemplateIntentMeta;
  lang: Lang;
  active?: boolean;
  compact?: boolean;
  proLikeHover?: boolean;
  onClick: () => void;
};

export function TaskIntentCard({ intent, lang, active = false, compact = false, proLikeHover = false, onClick }: Props) {
  const Icon = getIntentIcon(intent.id);
  const isLandingCard = !compact;
  const borderColor = active
    ? colors.accent
    : isLandingCard
      ? "rgba(245,158,11,0.72)"
      : colors.border;
  const background = active
    ? colors.accent
    : isLandingCard
      ? colors.accent
      : colors.panel;
  const title = lang === "zh" ? intent.labelZh : intent.labelEn;
  const description = lang === "zh" ? intent.descriptionZh : intent.descriptionEn;
  const sharedButtonStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    width: "100%",
    borderRadius: 14,
    border: `1px solid ${borderColor}`,
    background,
    cursor: "pointer",
    textAlign: "left",
    boxShadow: active
      ? "0 16px 34px rgba(0,0,0,0.24)"
      : "0 8px 20px rgba(0,0,0,0.16)",
    transition: "background 120ms ease, border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease"
  };
  const buttonClassName = compact
    ? `template-intent-card template-intent-card--compact${proLikeHover ? " template-intent-card--pro-hover" : ""}${active ? " template-intent-card--active" : ""}`
    : `template-intent-card template-intent-card--landing${active ? " template-intent-card--active" : ""}`;

  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <style>{`
          .template-intent-card {
            will-change: transform, background, border-color, box-shadow;
          }
          .template-intent-card--landing:hover {
            background: ${colors.accentHover} !important;
            border-color: ${colors.accent} !important;
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(0,0,0,0.24);
          }
          .template-intent-card--compact:hover {
            background: ${colors.buttonHover} !important;
            border-color: ${colors.accent} !important;
          }
          .template-intent-card--pro-hover:hover {
            background: ${colors.buttonHover} !important;
            border-color: ${colors.buttonBorder} !important;
          }
          .template-intent-card--compact:hover .template-intent-card__icon {
            color: ${colors.accent} !important;
          }
          .template-intent-card--pro-hover:hover .template-intent-card__icon {
            color: ${colors.textMuted} !important;
          }
        `}</style>
        <button
          className={buttonClassName}
          type="button"
          onClick={onClick}
          style={{
            ...sharedButtonStyles,
            minHeight: 47,
            height: 47,
            padding: "0 14px",
            color: active ? colors.accent : colors.text,
            justifyContent: "space-between",
            transform: "translateY(0)",
            background: colors.panel,
            borderColor: active ? colors.accent : colors.buttonBorder,
            boxShadow: "none"
          }}
        >
          <div style={compactButtonInner}>
            <Icon
              size={16}
              className="template-intent-card__icon"
              style={{ color: active ? colors.accent : colors.textMuted, flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, fontSize: 14, fontWeight: 700, color: active ? colors.accent : colors.text, lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.compact }}>
              {title}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <button
        className={buttonClassName}
        type="button"
        onClick={onClick}
        style={{
          ...sharedButtonStyles,
          minHeight: 90,
          padding: "0 18px",
          color: "#171717",
          justifyContent: "space-between",
          transform: "translateY(0)",
          boxShadow: active ? "0 16px 34px rgba(0,0,0,0.24)" : "0 8px 20px rgba(0,0,0,0.16)"
        }}
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: "rgba(23,23,23,0.1)",
          border: "1px solid rgba(23,23,23,0.12)",
          flexShrink: 0
        }}>
          <Icon size={18} style={{ color: "#171717" }} />
        </div>
        <div style={{ minWidth: 0, flex: 1, fontSize: 20, fontWeight: 800, color: "#171717", lineHeight: 1.15 }}>
          {title}
        </div>
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 4px" }}>
        {description.split(", ").flatMap((line) => line.split("、")).slice(0, 2).map((line, index) => (
          <div key={`${title}-${index}`} style={{ fontSize: TEMPLATE_WORKSPACE_UI.fontSize.body, lineHeight: TEMPLATE_WORKSPACE_UI.lineHeight.relaxed, color: colors.textMuted }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

const compactButtonInner: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
  flex: 1
};
