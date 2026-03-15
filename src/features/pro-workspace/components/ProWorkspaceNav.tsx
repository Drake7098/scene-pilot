import React from "react";
import {
  Film,
  Layers,
  LayoutGrid,
  Shield,
  FileText,
  Download,
  Globe,
} from "lucide-react";
import type { Lang } from "../../../i18n";
import type { ProWorkspaceSection } from "../types";
import { FIGMA_COLORS, PRO_NAV_WIDTH, PRO_PANEL_PADDING, PRO_FIELD_GAP } from "../constants";

type Props = {
  lang: Lang;
  section: ProWorkspaceSection;
  onSectionChange: (s: ProWorkspaceSection) => void;
};

const NAV_ITEMS: { id: ProWorkspaceSection; icon: typeof Film; labelZh: string; labelEn: string }[] = [
  { id: "scene", icon: Film, labelZh: "场景", labelEn: "Scene" },
  { id: "objects", icon: Layers, labelZh: "对象", labelEn: "Objects" },
  { id: "composition", icon: LayoutGrid, labelZh: "构图", labelEn: "Composition" },
  { id: "constraints", icon: Shield, labelZh: "约束", labelEn: "Constraints" },
  { id: "prompt_preview", icon: FileText, labelZh: "提示词预览", labelEn: "Prompt Preview" },
  { id: "export", icon: Download, labelZh: "输出", labelEn: "Export" },
  { id: "platform", icon: Globe, labelZh: "平台", labelEn: "Platform" },
];

export function ProWorkspaceNav({ lang, section, onSectionChange }: Props) {
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);

  return (
    <aside
      style={{
        width: PRO_NAV_WIDTH,
        minWidth: PRO_NAV_WIDTH,
        borderRight: `1px solid ${FIGMA_COLORS.border}`,
        background: FIGMA_COLORS.panel,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="pro-rail-scroll" style={{ flex: 1, padding: `${PRO_FIELD_GAP}px 0` }}>
        <div style={{ padding: `0 ${PRO_PANEL_PADDING - 4}px ${PRO_FIELD_GAP}px`, fontSize: 10, fontWeight: 600, color: FIGMA_COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("专业编辑", "Pro Editor")}
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = section === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                margin: `0 ${PRO_FIELD_GAP}px`,
                borderRadius: 8,
                border: "none",
                background: isActive ? `${FIGMA_COLORS.accent}20` : "transparent",
                color: isActive ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = FIGMA_COLORS.hover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={16} style={{ opacity: 0.9, flexShrink: 0 }} />
              <span>{t(item.labelZh, item.labelEn)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
