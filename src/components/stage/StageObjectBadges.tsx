/**
 * Stage Object Badges - lightweight visual indicators for locked, anchor.
 */

import React from "react";
import { Lock, Link2 } from "lucide-react";

type Props = {
  isLocked: boolean;
  hasAnchor: boolean;
};

export function StageObjectBadges({ isLocked, hasAnchor }: Props) {
  const badges: React.ReactNode[] = [];

  if (isLocked) {
    badges.push(
      <span key="lock" title="Locked" style={styles.badge}>
        <Lock size={10} />
      </span>
    );
  }
  if (hasAnchor) {
    badges.push(
      <span key="anchor" title="Continuity anchor" style={styles.badgeAnchor}>
        <Link2 size={10} />
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div style={styles.wrap}>
      {badges}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "absolute",
    top: 2,
    right: 2,
    display: "flex",
    gap: 2,
    zIndex: 2
  },
  badge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    borderRadius: 3,
    background: "rgba(0,0,0,0.5)",
    color: "#f59e0b"
  },
  badgeAnchor: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    borderRadius: 3,
    background: "rgba(0,0,0,0.5)",
    color: "#60a5fa"
  }
};
