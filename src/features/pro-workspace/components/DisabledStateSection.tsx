/**
 * Rule Engine UI v1 - DisabledStateSection
 * Displays fields currently disabled and why. Read-only, no editing.
 * Derives from: layoutLocked, mediaMode, object states (disabled-state-policy-v1).
 * Aligns with Figma design reference.
 */

import React from "react";
import type { Lang } from "../../../i18n";
import type { Layer } from "../../../model";
import type { StageObjectState } from "../../stage-editor/guards/stageObjectState";
import { Lock, Image } from "lucide-react";
import { FIGMA_COLORS } from "../constants";

export type DisabledItem = {
  field: string;
  scope: "scene" | "object";
  objectId?: string;
  reason: string;
  source: string;
};

type Props = {
  lang: Lang;
  layoutLocked: boolean;
  mediaMode: "image" | "video";
  /** Object states from getStageObjectState per layer */
  objectStates: { layer: Layer; state: StageObjectState }[];
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

function deriveDisabledItems(
  lang: Lang,
  layoutLocked: boolean,
  mediaMode: "image" | "video",
  objectStates: { layer: Layer; state: StageObjectState }[]
): DisabledItem[] {
  const items: DisabledItem[] = [];

  if (layoutLocked) {
    items.push({
      field: t(lang, "全部场景字段", "All scene fields"),
      scope: "scene",
      reason: t(lang, "应用模式为「仅布局」，场景级字段不可编辑", "Apply mode is layout-only, scene fields read-only"),
      source: "applyMode",
    });
  }

  if (mediaMode === "image") {
    items.push({
      field: t(lang, "视频运动相关字段", "Video motion fields"),
      scope: "scene",
      reason: t(lang, "当前为图片模式，视频运动/运镜字段禁用", "Image mode: video motion fields disabled"),
      source: "mediaType",
    });
  }

  for (const { layer, state } of objectStates) {
    if (state.isLocked) {
      items.push({
        field: t(lang, "布局锁定", "Layout locked"),
        scope: "object",
        objectId: layer.id,
        reason: t(lang, "该对象布局已锁定", "Object layout is locked"),
        source: "layoutLocked",
      });
    }
    if (state.continuityId) {
      items.push({
        field: "continuityId",
        scope: "object",
        objectId: layer.id,
        reason: t(
          lang,
          "锚点已绑定，解除锚点请到 Objects 面板",
          "Anchor bound; release in Objects panel"
        ),
        source: "template",
      });
    }
    if (state.isProtectedLayout) {
      items.push({
        field: t(lang, "受保护布局", "Protected layout"),
        scope: "object",
        objectId: layer.id,
        reason: t(lang, "场景布局锁定，对象受保护", "Scene layout locked, object protected"),
        source: "template",
      });
    }
  }

  return items;
}

export function DisabledStateSection({
  lang,
  layoutLocked,
  mediaMode,
  objectStates,
}: Props) {
  const items = deriveDisabledItems(lang, layoutLocked, mediaMode, objectStates);

  if (items.length === 0) {
    return (
      <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted }}>
        {t(lang, "暂无禁用的字段", "No disabled fields")}
      </div>
    );
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", fontSize: 11, color: FIGMA_COLORS.text, lineHeight: 1.8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Lock size={12} color={FIGMA_COLORS.textMuted} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 500 }}>
                {item.field}
                {item.objectId && (
                  <span style={{ color: FIGMA_COLORS.accent, marginLeft: 4 }}>({item.objectId})</span>
                )}
              </span>
              <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted, marginTop: 2 }}>{item.reason}</div>
              <div style={{ fontSize: 10, color: FIGMA_COLORS.textMuted }}>[{item.source}]</div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
