/**
 * Hook for virtualized template grid rendering.
 * Reserved for 1000+ scaling: currently passes through all items.
 * Future: integrate react-window / react-virtualized to compute visible slice.
 */

import { useMemo, useRef } from "react";
import type { TemplateIndex } from "../model/templateIndex";
import type { UserPrivateTemplate } from "../../../lib/userTemplatesStore";
import { GRID_VIRTUALIZATION_THRESHOLD } from "../constants/gridStrategy";

export type UseVirtualizedTemplateGridOptions = {
  items: (TemplateIndex | UserPrivateTemplate)[];
  itemHeight?: number;
  containerHeight?: number;
};

export type UseVirtualizedTemplateGridResult = {
  /** Items to render. Normal mode: all items. Virtual mode: visible slice. */
  visibleItems: (TemplateIndex | UserPrivateTemplate)[];
  /** Start index for virtual mode (for offset/spacer). Normal mode: 0. */
  startIndex: number;
  /** Total count for scroll height. */
  totalCount: number;
  /** Whether virtualization is active. */
  isVirtual: boolean;
  /** Ref to attach to scroll container (future: measure for virtual). */
  containerRef: React.RefObject<HTMLDivElement | null>;
};

/**
 * Returns visible items for grid render.
 * Phase 1: passthrough (visibleItems = items).
 * Phase 2: integrate react-window to slice by viewport.
 */
export function useVirtualizedTemplateGrid(
  options: UseVirtualizedTemplateGridOptions
): UseVirtualizedTemplateGridResult {
  const { items } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { visibleItems, startIndex, totalCount, isVirtual } = useMemo(() => {
    const totalCount = items.length;
    const isVirtual = totalCount >= GRID_VIRTUALIZATION_THRESHOLD;
    // Phase 1: no virtualization; render all items
    return {
      visibleItems: items,
      startIndex: 0,
      totalCount,
      isVirtual
    };
  }, [items]);

  return {
    visibleItems,
    startIndex,
    totalCount,
    isVirtual,
    containerRef
  };
}
