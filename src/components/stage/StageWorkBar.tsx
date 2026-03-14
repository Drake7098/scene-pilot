/**
 * Stage Work Bar - movable, context-aware tool bar for object-level safe actions.
 */

import React, { useRef, useEffect } from "react";
import {
  MousePointer2,
  Move,
  Maximize2,
  RotateCcw,
  Copy,
  Lock,
  Unlock,
  Link2
} from "lucide-react";
import type { Project, Scene, Layer } from "../../model";
import { resolveSceneConfig } from "../../model";
import { resolveWorkBarCapabilities } from "../../features/stage-editor/guards/stageCapabilityResolver";
import { stageActionGuard } from "../../features/stage-editor/guards/stageActionGuard";
import { stageResetTransform } from "../../features/stage-editor/actions/stageResetTransform";
import { stageCopyT0ToT1 } from "../../features/stage-editor/actions/stageCopyKeyframe";
import { stageToggleLock } from "../../features/stage-editor/actions/stageToggleLock";
import { stageCenterObject } from "../../features/stage-editor/actions/stageCenterObject";
import { stageMarkAnchor, stageClearAnchor, getLayerAnchorId } from "../../features/stage-editor/actions/stageMarkAnchor";
import { getStageObjectState } from "../../features/stage-editor/guards/stageObjectState";

type Props = {
  lang: "zh" | "en";
  project: Project | null;
  scene: Scene;
  layer: Layer;
  editT: 0 | 1;
  position: { x: number; y: number };
  onPositionDrag: (clientX: number, clientY: number) => void;
  onUpdateScene: (scene: Scene) => void;
  containerRect: DOMRect | null;
};

const t = (zh: string, en: string, lang: "zh" | "en") => (lang === "zh" ? zh : en);

export function StageWorkBar({
  lang,
  project,
  scene,
  layer,
  editT,
  position,
  onPositionDrag,
  onUpdateScene,
  containerRect
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const isImage = mediaMode === "image";
  const state = getStageObjectState(layer, scene, project);
  const caps = resolveWorkBarCapabilities(layer, scene, project, mediaMode);

  const mapAction = (id: string): import("../../features/stage-editor/guards/stageActionGuard").StageActionKind => {
    if (id === "center") return "center";
    if (id === "reset") return "reset";
    if (id === "copyT0ToT1") return "copyKeyframe";
    if (id === "lock" || id === "unlock") return "toggleLock";
    return "move";
  };

  const handleAction = (actionId: string) => {
    if (actionId === "select" || actionId === "move") return;
    const guard = stageActionGuard(mapAction(actionId), layer, scene, project);
    if (guard.kind === "deny" || guard.kind === "reroute-to-panel") return;

    if (actionId === "center") {
      onUpdateScene(stageCenterObject(scene, layer, editT));
    } else if (actionId === "reset") {
      onUpdateScene(stageResetTransform(scene, layer, editT, project));
    } else if (actionId === "copyT0ToT1") {
      onUpdateScene(stageCopyT0ToT1(scene, layer));
    } else if (actionId === "lock") {
      onUpdateScene(stageToggleLock(scene, layer, true));
    } else if (actionId === "unlock") {
      onUpdateScene(stageToggleLock(scene, layer, false));
    } else if (actionId === "markAnchor") {
      const existing = getLayerAnchorId(layer);
      if (existing) {
        onUpdateScene(stageClearAnchor(scene, layer));
      } else {
        onUpdateScene(stageMarkAnchor(scene, layer, `anchor_${layer.id.slice(-6)}`));
      }
    }
  };

  const cap = (id: string) => caps.find((c) => c.id === id);
  const can = (id: string) => cap(id)?.allowed ?? false;
  const reason = (id: string) => cap(id)?.reason ?? "";

  const buttons: Array<{ id: string; icon: React.ElementType; title: string }> = [
    { id: "select", icon: MousePointer2, title: t("选中", "Select", lang) },
    { id: "move", icon: Move, title: t("移动", "Move", lang) },
    { id: "center", icon: Maximize2, title: t("居中", "Center", lang) },
    { id: "reset", icon: RotateCcw, title: t("重置", "Reset", lang) },
    { id: "copyT0ToT1", icon: Copy, title: t("复制 T0→T1", "Copy T0→T1", lang) },
    { id: state.isLocked ? "unlock" : "lock", icon: state.isLocked ? Unlock : Lock, title: state.isLocked ? t("解锁", "Unlock", lang) : t("锁定", "Lock", lang) }
  ];

  if (can("markAnchor")) {
    const anchorId = getLayerAnchorId(layer);
    buttons.push({
      id: "markAnchor",
      icon: Link2,
      title: anchorId ? t("清除锚点", "Clear Anchor", lang) : t("标记锚点", "Mark Anchor", lang)
    });
  }

  const onBarPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPx = position.x;
    const startPy = position.y;

    const onMove = (ev: PointerEvent) => {
      if (!containerRect) return;
      const dx = (ev.clientX - startX) / containerRect.width;
      const dy = (ev.clientY - startY) / containerRect.height;
      onPositionDrag(startPx + dx, startPy + dy);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={barRef}
      role="toolbar"
      aria-label="Stage actions"
      style={{
        position: "absolute",
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 6px",
        background: "rgba(31, 33, 37, 0.96)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        cursor: "grab",
        zIndex: 10
      }}
      onPointerDown={onBarPointerDown}
    >
      {buttons.map((btn) => {
        const allowed = can(btn.id);
        const Icon = btn.icon;
        return (
          <button
            key={btn.id}
            type="button"
            disabled={!allowed && btn.id !== "select"}
            title={allowed ? btn.title : reason(btn.id) || btn.title}
            onClick={() => allowed && handleAction(btn.id)}
            style={{
              padding: 6,
              border: "none",
              borderRadius: 6,
              background: allowed ? "rgba(255,255,255,0.06)" : "transparent",
              color: allowed ? "#e5e7eb" : "#6b7280",
              cursor: allowed ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
