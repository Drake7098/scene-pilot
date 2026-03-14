import { useState, useCallback, useEffect } from "react";

const STORAGE_PREFIX = "spx_pro_collapse_";

/**
 * Persist which sections are collapsed. Returns [collapsedSet, toggle].
 * - collapsedSet.has(id) === true means section is collapsed
 * - toggle(id) flips that section's collapsed state
 */
export function useProCollapseSections(
  storageKey: string,
  _sectionIds: string[],
  defaultOpenIds: string[]
): [Set<string>, (sectionId: string) => void] {
  const allIds = _sectionIds;
  const defaultCollapsed = new Set(allIds.filter((id) => !defaultOpenIds.includes(id)));

  const [collapsed, setCollapsed] = useState<Set<string>>(defaultCollapsed);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCollapsed(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: Set<string>) => {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify([...next]));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const toggle = useCallback(
    (sectionId: string) => {
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return [collapsed, toggle];
}
