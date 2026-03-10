import React, { useMemo, useState } from "react";
import type { VideoCanvasDraft } from "../types/canvasDraft";
import { updateVideoKeyObjects, updateVideoShots } from "../utils/structureDraftToCanvas";

type Props = {
  draft: VideoCanvasDraft;
  onChange: (next: VideoCanvasDraft) => void;
};

export function VideoCanvasView({ draft, onChange }: Props) {
  const [activeShotId, setActiveShotId] = useState<string | null>(draft.shots[0]?.id ?? null);
  const activeShot = useMemo(() => draft.shots.find((shot) => shot.id === activeShotId) ?? draft.shots[0] ?? null, [activeShotId, draft.shots]);

  function patchShots(updater: (shots: VideoCanvasDraft["shots"]) => VideoCanvasDraft["shots"]) {
    onChange(updateVideoShots(draft, updater));
  }

  function patchObjects(updater: (objects: VideoCanvasDraft["keyObjects"]) => VideoCanvasDraft["keyObjects"]) {
    onChange(updateVideoKeyObjects(draft, updater));
  }

  function moveShot(id: string, delta: -1 | 1) {
    patchShots((shots) => {
      const index = shots.findIndex((shot) => shot.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= shots.length) return shots;
      const next = shots.slice();
      const current = next[index];
      next[index] = next[target];
      next[target] = current;
      return next;
    });
  }

  function addShot() {
    patchShots((shots) => {
      if (shots.length >= 5) return shots;
      const nextIndex = shots.length + 1;
      const id = `shot_${Date.now()}_${nextIndex}`;
      return [
        ...shots,
        {
          id,
          index: nextIndex,
          title: `新增分镜 ${nextIndex}`,
          summary: draft.rhythm,
          transitionFromPrev: draft.sceneTransitions,
          emphasis: draft.rhythm,
          sceneLabel: draft.mainScene,
          objectIds: draft.keyObjects.filter((item) => item.role === "primary").map((item) => item.id)
        }
      ];
    });
  }

  function removeShot(id: string) {
    patchShots((shots) => {
      if (shots.length <= 1) return shots;
      return shots.filter((shot) => shot.id !== id);
    });
  }

  function toggleObjectShot(objectId: string, shotId: string) {
    patchObjects((objects) => objects.map((item) => {
      if (item.id !== objectId) return item;
      const has = item.appearsInShotIds.includes(shotId);
      return {
        ...item,
        appearsInShotIds: has ? item.appearsInShotIds.filter((value) => value !== shotId) : [...item.appearsInShotIds, shotId]
      };
    }));
    patchShots((shots) => shots.map((shot) => {
      if (shot.id !== shotId) return shot;
      const has = shot.objectIds.includes(objectId);
      return {
        ...shot,
        objectIds: has ? shot.objectIds.filter((value) => value !== objectId) : [...shot.objectIds, objectId]
      };
    }));
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.board} data-testid="quick-canvas-board">
        <div style={styles.trackLine} />
        {draft.storyboardNodes.map((node) => {
          const shot = draft.shots.find((item) => item.id === node.shotId);
          if (!shot) return null;
          return (
            <button
              key={node.id}
              type="button"
              style={{
                ...styles.shotCard,
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.w}%`,
                height: `${node.h}%`,
                borderColor: activeShot?.id === shot.id ? "rgba(118,220,255,0.82)" : "rgba(255,255,255,0.12)"
              }}
              onClick={() => setActiveShotId(shot.id)}
              data-testid={`quick-video-shot-${shot.id}`}
            >
              <div style={styles.shotIndex}>{String(shot.index).padStart(2, "0")}</div>
              <div style={styles.shotTitle}>{shot.title}</div>
              <div style={styles.shotMeta}>{shot.sceneLabel} / {shot.transitionFromPrev}</div>
            </button>
          );
        })}

        <svg style={styles.objectSvg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {draft.keyObjects.map((item, index) => {
            const activeNodes = draft.storyboardNodes.filter((node) => item.appearsInShotIds.includes(node.shotId));
            if (activeNodes.length <= 1) return null;
            const y = 18 + index * 6;
            return (
              <polyline
                key={item.id}
                points={activeNodes.map((node) => `${node.x + node.w / 2},${y}`).join(" ")}
                fill="none"
                stroke={index === 0 ? "rgba(118,220,255,0.82)" : "rgba(255,255,255,0.38)"}
                strokeWidth="0.9"
                strokeDasharray={index === 0 ? "0" : "2 1.6"}
              />
            );
          })}
        </svg>

        <div style={styles.objectLegend}>
          {draft.keyObjects.map((item) => (
            <div key={item.id} style={styles.objectLegendRow}>
              <span style={styles.objectLegendName}>{item.label}</span>
              <span style={styles.objectLegendValue}>{item.appearsInShotIds.length}/{draft.shots.length}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.summaryBlock}>
        <div style={styles.summaryPrimary} data-testid="quick-canvas-primary-brief">{draft.primaryBrief}</div>
        <div style={styles.summarySecondary} data-testid="quick-canvas-secondary-brief">{draft.secondaryBrief}</div>
        <div style={styles.tagRow}>
          <span style={styles.tag} data-testid="quick-canvas-video-structure">{draft.structureType}</span>
          <span style={styles.tag} data-testid="quick-canvas-video-shot-count">{draft.shotCount} 段</span>
          <span style={styles.tag} data-testid="quick-canvas-video-continuity">{draft.continuityFocus}</span>
          <span style={styles.tag}>{draft.mainScene}</span>
          <span style={styles.tag}>{draft.rhythm}</span>
        </div>
      </div>

      <div style={styles.editor} data-testid="quick-canvas-editor">
        {activeShot ? (
          <>
            <div style={styles.editorRow}>
              <span style={styles.editorLabel}>分镜</span>
              <span style={styles.editorValue} data-testid="quick-canvas-video-active-shot">{activeShot.title}</span>
            </div>
            <div style={styles.editorControl}>
              <span style={styles.editorLabel}>标题</span>
              <input
                value={activeShot.title}
                onChange={(event) => patchShots((shots) => shots.map((shot) => shot.id === activeShot.id ? { ...shot, title: event.target.value } : shot))}
                style={styles.input}
                data-testid="quick-canvas-video-shot-title"
              />
            </div>
            <div style={styles.buttonRow}>
              <button type="button" style={styles.actionBtn} onClick={() => moveShot(activeShot.id, -1)}>前移</button>
              <button type="button" style={styles.actionBtn} onClick={() => moveShot(activeShot.id, 1)}>后移</button>
              <button type="button" style={styles.actionBtn} onClick={addShot}>新增</button>
              <button type="button" style={styles.actionBtn} onClick={() => removeShot(activeShot.id)}>删除</button>
            </div>
            <div style={styles.objectToggleList}>
              {draft.keyObjects.map((item) => {
                const checked = item.appearsInShotIds.includes(activeShot.id);
                return (
                  <label key={item.id} style={styles.objectToggleRow}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleObjectShot(item.id, activeShot.id)}
                      data-testid={`quick-canvas-video-object-${item.id}`}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
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
    background: "radial-gradient(circle at 52% 28%, rgba(70,110,255,0.18), transparent 26%), linear-gradient(180deg, rgba(5,9,20,0.98), rgba(2,4,10,1))",
    overflow: "hidden"
  },
  trackLine: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "50%",
    height: 2,
    background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(118,220,255,0.4), rgba(255,255,255,0.08))"
  },
  shotCard: {
    position: "absolute",
    transform: "translate(0, -50%)",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(8,14,32,0.82)",
    color: "#ffffff",
    padding: "12px 14px",
    display: "grid",
    gap: 6,
    textAlign: "left",
    boxShadow: "0 20px 48px rgba(0,0,0,0.28)"
  },
  shotIndex: { fontSize: 11, color: "rgba(118,220,255,0.84)", fontWeight: 700, letterSpacing: "0.08em" },
  shotTitle: { fontSize: 14, fontWeight: 720 },
  shotMeta: { fontSize: 11, color: "rgba(255,255,255,0.62)" },
  objectSvg: {
    position: "absolute",
    inset: "0 0 auto 0",
    width: "100%",
    height: "40%"
  },
  objectLegend: {
    position: "absolute",
    left: 18,
    bottom: 18,
    display: "grid",
    gap: 6,
    minWidth: 164
  },
  objectLegendRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.78)"
  },
  objectLegendName: { fontWeight: 600 },
  objectLegendValue: { color: "rgba(118,220,255,0.78)" },
  editor: { display: "grid", gap: 8 },
  editorRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  editorLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  editorValue: { fontSize: 12, color: "#ffffff", fontWeight: 700 },
  editorControl: { display: "grid", gap: 4 },
  input: {
    minHeight: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    padding: "0 10px",
    outline: "none"
  },
  buttonRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    minHeight: 30,
    padding: "0 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    cursor: "pointer"
  },
  objectToggleList: { display: "grid", gap: 6 },
  objectToggleRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.84)"
  }
};
