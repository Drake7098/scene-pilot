import React, { useMemo, useRef, useState } from "react";
import type { ImageCanvasDraft } from "../types/canvasDraft";
import { updateImageCanvasNodes } from "../utils/structureDraftToCanvas";

type Props = {
  draft: ImageCanvasDraft;
  onChange: (next: ImageCanvasDraft) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type DragState = {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export function ImageCanvasView({ draft, onChange }: Props) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(draft.draggableNodes[0]?.id ?? null);
  const activeNode = useMemo(
    () => draft.draggableNodes.find((node) => node.id === activeNodeId) ?? draft.draggableNodes[0] ?? null,
    [activeNodeId, draft.draggableNodes]
  );

  function patchNodes(id: string, patch: Partial<ImageCanvasDraft["draggableNodes"][number]>) {
    onChange(updateImageCanvasNodes(draft, (nodes) => nodes.map((node) => node.id === id ? { ...node, ...patch } : node)));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>, id: string) {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const target = draft.draggableNodes.find((node) => node.id === id);
    if (!target) return;
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - (target.x / 100) * rect.width,
      offsetY: event.clientY - rect.top - (target.y / 100) * rect.height
    };
    setActiveNodeId(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!boardRef.current || !dragRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const rawX = event.clientX - rect.left - dragRef.current.offsetX;
    const rawY = event.clientY - rect.top - dragRef.current.offsetY;
    const x = clamp((rawX / rect.width) * 100, 8, 88);
    const y = clamp((rawY / rect.height) * 100, 12, 82);
    patchNodes(dragRef.current.id, { x, y });
  }

  function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current && dragRef.current.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  return (
    <div style={styles.wrap}>
      <div
        ref={boardRef}
        style={styles.board}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        data-testid="quick-canvas-board"
      >
        {draft.sceneZones.map((zone) => (
          <div
            key={zone.id}
            style={{
              ...styles.zone,
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.w}%`,
              height: `${zone.h}%`,
              borderColor: zone.depth === "foreground" ? "rgba(118,220,255,0.24)" : "rgba(255,255,255,0.08)"
            }}
          >
            <span style={styles.zoneLabel}>{zone.label}</span>
          </div>
        ))}

        <div
          style={{
            ...styles.focusMarker,
            left: draft.compositionFocus === "left_right" ? "50%" : draft.compositionFocus === "environment_wrap" ? "60%" : draft.compositionFocus === "depth" ? "52%" : "50%",
            top: draft.compositionFocus === "depth" ? "36%" : "50%"
          }}
        />

        {draft.draggableNodes.map((node) => (
          <div
            key={node.id}
            style={{
              ...styles.node,
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.w}%`,
              height: `${node.h}%`,
              zIndex: node.layer,
              borderColor: activeNode?.id === node.id ? "rgba(118,220,255,0.9)" : node.role === "primary" ? "rgba(118,220,255,0.72)" : "rgba(255,255,255,0.2)",
              background: node.role === "primary" ? "rgba(72, 146, 255, 0.16)" : node.kind === "environment" ? "rgba(112,255,192,0.1)" : "rgba(255,255,255,0.08)"
            }}
            onPointerDown={(event) => onPointerDown(event, node.id)}
            onClick={() => setActiveNodeId(node.id)}
            data-testid={`quick-canvas-object-${node.id}`}
          >
            <div style={styles.nodeLabel}>{node.label}</div>
            <div style={styles.nodeMeta}>{node.role} / {node.depth}</div>
          </div>
        ))}

        {draft.draggableNodes.length >= 2 ? (
          <svg style={styles.relationSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line
              x1={draft.draggableNodes[0]?.x ?? 50}
              y1={draft.draggableNodes[0]?.y ?? 50}
              x2={draft.draggableNodes[1]?.x ?? 50}
              y2={draft.draggableNodes[1]?.y ?? 50}
              stroke="rgba(118,220,255,0.5)"
              strokeWidth="0.6"
              strokeDasharray="2.2 1.8"
            />
          </svg>
        ) : null}
      </div>

      <div style={styles.summaryBlock}>
        <div style={styles.summaryPrimary} data-testid="quick-canvas-primary-brief">{draft.primaryBrief}</div>
        <div style={styles.summarySecondary} data-testid="quick-canvas-secondary-brief">{draft.secondaryBrief}</div>
        <div style={styles.tagRow}>
          <span style={styles.tag} data-testid="quick-canvas-image-subject-count">{draft.subjectCount} 主体</span>
          <span style={styles.tag} data-testid="quick-canvas-image-composition">{draft.compositionFocus}</span>
          <span style={styles.tag} data-testid="quick-canvas-image-background">{draft.backgroundDensity}</span>
          <span style={styles.tag}>{draft.sceneType}</span>
          <span style={styles.tag}>{draft.relationMode}</span>
        </div>
      </div>

      <div style={styles.editor} data-testid="quick-canvas-editor">
        {activeNode ? (
          <>
            <div style={styles.editorRow}>
              <span style={styles.editorLabel}>对象</span>
              <span style={styles.editorValue}>{activeNode.label}</span>
            </div>
            <div style={styles.editorRow}>
              <span style={styles.editorLabel}>X / Y</span>
              <span style={styles.editorValue} data-testid="quick-canvas-object-position">{Math.round(activeNode.x)} / {Math.round(activeNode.y)}</span>
            </div>
            <div style={styles.editorControl}>
              <span style={styles.editorLabel}>大小</span>
              <input
                type="range"
                min={14}
                max={36}
                value={activeNode.w}
                onChange={(event) => patchNodes(activeNode.id, { w: Number(event.target.value), h: Math.max(12, Math.round(Number(event.target.value) * 0.72)) })}
                data-testid="quick-canvas-size"
              />
            </div>
            <div style={styles.editorControl}>
              <span style={styles.editorLabel}>层级</span>
              <select
                value={String(activeNode.layer)}
                onChange={(event) => patchNodes(activeNode.id, { layer: Number(event.target.value) })}
                data-testid="quick-canvas-layer"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "grid", gap: 12 },
  summaryBlock: {
    display: "grid",
    gap: 8,
    justifyItems: "end",
    textAlign: "right"
  },
  summaryPrimary: { fontSize: 16, lineHeight: 1.5, fontWeight: 720, color: "#ffffff" },
  summarySecondary: { fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.78)" },
  tagRow: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" },
  tag: {
    minHeight: 28,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.84)"
  },
  board: {
    position: "relative",
    height: 372,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "radial-gradient(circle at 50% 28%, rgba(70,110,255,0.16), transparent 26%), linear-gradient(180deg, rgba(5,9,20,0.98), rgba(2,4,10,1))",
    overflow: "hidden"
  },
  zone: {
    position: "absolute",
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)"
  },
  zoneLabel: {
    position: "absolute",
    top: 8,
    left: 10,
    fontSize: 11,
    color: "rgba(255,255,255,0.46)"
  },
  focusMarker: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 999,
    border: "1px solid rgba(118,220,255,0.38)",
    boxShadow: "0 0 36px rgba(83,168,255,0.24)",
    transform: "translate(-50%, -50%)"
  },
  node: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "10px 12px",
    cursor: "grab",
    display: "grid",
    alignContent: "center",
    gap: 4,
    boxShadow: "0 18px 42px rgba(0,0,0,0.26)"
  },
  nodeLabel: { fontSize: 13, fontWeight: 720, color: "#ffffff" },
  nodeMeta: { fontSize: 11, color: "rgba(255,255,255,0.62)" },
  relationSvg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  },
  editor: {
    display: "grid",
    gap: 8
  },
  editorRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  editorLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  editorValue: { fontSize: 12, color: "#ffffff", fontWeight: 700 },
  editorControl: { display: "grid", gap: 4 }
};
