/**
 * Template recent hook - add to recent.
 */

import { useCallback } from "react";
import { addToRecent } from "../../../data/templateWorkspaceData";

export function useTemplateRecent() {
  const add = useCallback((templateId: string) => {
    addToRecent(templateId);
  }, []);

  return { addToRecent: add };
}
