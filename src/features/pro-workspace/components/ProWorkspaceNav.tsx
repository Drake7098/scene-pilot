import React from "react";
import {
  Video,
  Clapperboard,
  MonitorPlay,
  Aperture,
  Mountain,
  Users,
  Sun,
  Palette,
  LayoutGrid,
  Shield,
  Download,
} from "lucide-react";
import type { Lang } from "../../../i18n";
import type { ProWorkspaceSection } from "../types";
import { FIGMA_COLORS, PRO_NAV_WIDTH, PRO_PANEL_PADDING, PRO_FIELD_GAP } from "../constants";

type Props = {
  lang: Lang;
  section: ProWorkspaceSection;
  onSectionChange: (s: ProWorkspaceSection) => void;
};

type NavItem = {
  id: ProWorkspaceSection;
  icon: typeof Video;
  labelZh: string;
  labelEn: string;
  step?: number;
  dividerBefore?: boolean;
};

const WORKFLOW_ITEMS: NavItem[] = [
  { id: "shot",        icon: Video,       labelZh: "镜头",     labelEn: "Shot",        step: 1 },
  { id: "director",    icon: Clapperboard,labelZh: "导演",     labelEn: "Director",    step: 2 },
  { id: "output",      icon: MonitorPlay, labelZh: "输出类型", labelEn: "Output Type", step: 3 },
  { id: "camera_lang", icon: Aperture,    labelZh: "镜头语言", labelEn: "Lens Style",  step: 4 },
  { id: "scene_bg",    icon: Mountain,    labelZh: "场景",     labelEn: "Scene",       step: 5 },
  { id: "objects",     icon: Users,       labelZh: "对象",     labelEn: "Objects",     step: 6 },
  { id: "lighting",    icon: Sun,         labelZh: "灯光",     labelEn: "Lighting",    step: 7 },
  { id: "style",       icon: Palette,     labelZh: "风格",     labelEn: "Style",       step: 8 },
];

const TOOL_ITEMS: NavItem[] = [
  { id: "composition",    icon: LayoutGrid, labelZh: "构图",     labelEn: "Composition",    dividerBefore: true },
  { id: "constraints",    icon: Shield,     labelZh: "约束",     labelEn: "Constraints" },
  { id: "generate_settings", icon: Download, labelZh: "自有API生成", labelEn: "BYO API Generate" },
];

export function ProWorkspaceNav({ lang, section, onSectionChange }: Props) {
  const tl = (zh: string, en: string) => (lang === "zh" ? zh : en);

  const renderItem = (item: NavItem) => {
    const isActive = section === item.id;
    const Icon = item.icon;
    return (
      <React.Fragment key={item.id}>
        {item.dividerBefore && (
          <div
            style={{
              margin: `${PRO_FIELD_GAP}px ${PRO_PANEL_PADDING - 4}px`,
              borderTop: `1px solid ${FIGMA_COLORS.border}`,
            }}
          />
        )}
        <button
          type="button"
          onClick={() => onSectionChange(item.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: `calc(100% - ${(PRO_PANEL_PADDING - 4) * 2}px)`,
            margin: `1px ${PRO_PANEL_PADDING - 4}px`,
            padding: "8px 10px",
            borderRadius: 6,
            border: "none",
            background: isActive ? `${FIGMA_COLORS.accent}22` : "transparent",
            color: isActive ? FIGMA_COLORS.accent : FIGMA_COLORS.text,
            fontSize: 12,
            fontWeight: isActive ? 600 : 400,
            cursor: "pointer",
            textAlign: "left",
            transition: "background 0.12s, color 0.12s",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = FIGMA_COLORS.hover;
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {/* step badge */}
          {item.step != null ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: isActive ? FIGMA_COLORS.accent : `${FIGMA_COLORS.textMuted}33`,
                color: isActive ? "#000" : FIGMA_COLORS.textMuted,
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              {item.step}
            </span>
          ) : (
            <Icon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tl(item.labelZh, item.labelEn)}
          </span>
          {isActive && (
            <span
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                background: FIGMA_COLORS.accent,
                flexShrink: 0,
              }}
            />
          )}
        </button>
      </React.Fragment>
    );
  };

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
      <div className="pro-rail-scroll" style={{ flex: 1, paddingTop: PRO_FIELD_GAP, paddingBottom: PRO_FIELD_GAP }}>
        {/* Workflow label */}
        <div
          style={{
            padding: `0 ${PRO_PANEL_PADDING - 4}px ${PRO_FIELD_GAP}px`,
            fontSize: 9,
            fontWeight: 700,
            color: FIGMA_COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {tl("拍摄流程", "Shot Workflow")}
        </div>

        {WORKFLOW_ITEMS.map(renderItem)}

        {TOOL_ITEMS.map(renderItem)}
      </div>
    </aside>
  );
}
