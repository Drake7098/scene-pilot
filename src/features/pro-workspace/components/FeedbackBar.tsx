/**
 * FeedbackBar - two-row status + recent action history below canvas.
 * Row1: conflict only (red when present); empty when no conflict.
 * Row2: recent action message + left/right arrows (max 5 items, no scroll).
 */

import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { Lang } from "../../../i18n";
import type { PromptConflict } from "../../../utils/conflictRules";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_HISTORY = 5;

export type FeedbackBarApi = {
  pushMessage: (msg: string) => void;
};

type Props = {
  lang: Lang;
  platformLabel: string;
  exportScopeLabel: string;
  /** e.g. "可生成" / "已更新" when no conflict */
  statusLabel: string;
  conflicts: PromptConflict[];
};

function t(lang: Lang, zh: string, en: string) {
  return lang === "zh" ? zh : en;
}

export const FeedbackBar = forwardRef<FeedbackBarApi, Props>(function FeedbackBar(
  { lang, platformLabel, exportScopeLabel, statusLabel, conflicts },
  ref
) {
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const historyRef = useRef<string[]>([]);
  historyRef.current = history;

  useImperativeHandle(ref, () => ({
    pushMessage(msg: string) {
      const next = [...historyRef.current, msg].slice(-MAX_HISTORY);
      setHistory(next);
      setIndex(Math.max(0, next.length - 1));
    }
  }), []);

  const hasConflict = conflicts.length > 0;
  const topConflict = conflicts.find((c) => c.severity === "high") ?? conflicts[0] ?? null;
  const conflictCount = conflicts.length;
  const hasHistory = history.length > 0;
  const lastIdx = Math.max(0, history.length - 1);
  const canGoLeft = hasHistory && index > 0;
  const canGoRight = hasHistory && index < lastIdx;
  const currentMessage = history[index] ?? "";

  return (
    <div
      style={{
        flexShrink: 0,
        minHeight: 32,
        borderTop: "1px solid var(--pro-border)",
        background: "var(--pro-bg-panel)",
        display: "flex",
        flexDirection: "column",
        padding: "6px 12px",
        gap: 4
      }}
      role="region"
      aria-label={t(lang, "工作流反馈", "Workflow feedback")}
    >
      {/* Row1: 有冲突时显示，无冲突时空着 */}
      <div style={{ minHeight: 18, fontSize: 11 }}>
        {hasConflict && topConflict ? (
          <span style={{ color: "var(--pro-text-danger, #c96b6b)" }}>
            ⚠ {topConflict.title}
            {conflictCount > 1
              ? (lang === "zh" ? `（共 ${conflictCount} 项）` : ` (+${conflictCount - 1} more)`)
              : ""}
          </span>
        ) : null}
      </div>

      {/* Row2: only when there are history messages */}
      {hasHistory ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "var(--pro-text-muted, #9ca3af)",
            minHeight: 20
          }}
        >
          <button
            type="button"
            aria-label={t(lang, "上一条", "Previous")}
            disabled={!canGoLeft}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              padding: 0,
              border: "1px solid var(--pro-border)",
              borderRadius: 4,
              background: canGoLeft ? "var(--pro-bg-panel)" : "transparent",
              color: canGoLeft ? "var(--pro-text-muted)" : "var(--pro-text-muted)",
              opacity: canGoLeft ? 1 : 0.4,
              cursor: canGoLeft ? "pointer" : "default"
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentMessage}
          </span>
          <button
            type="button"
            aria-label={t(lang, "下一条", "Next")}
            disabled={!canGoRight}
            onClick={() => setIndex((i) => Math.min(lastIdx, i + 1))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              padding: 0,
              border: "1px solid var(--pro-border)",
              borderRadius: 4,
              background: canGoRight ? "var(--pro-bg-panel)" : "transparent",
              color: canGoRight ? "var(--pro-text-muted)" : "var(--pro-text-muted)",
              opacity: canGoRight ? 1 : 0.4,
              cursor: canGoRight ? "pointer" : "default"
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
});
