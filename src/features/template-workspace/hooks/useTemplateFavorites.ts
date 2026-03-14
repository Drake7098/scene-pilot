/**
 * Template favorites hook - toggle favorite, check favorite.
 */

import { useCallback, useState } from "react";
import { toggleFavorite as toggleFavoriteStorage, isFavorite as isFavoriteStorage } from "../../../data/templateWorkspaceData";

export function useTemplateFavorites() {
  const [version, setVersion] = useState(0);

  const toggleFavorite = useCallback((templateId: string) => {
    toggleFavoriteStorage(templateId);
    setVersion((v) => v + 1);
  }, []);

  const isFavorite = useCallback((templateId: string) => {
    return isFavoriteStorage(templateId);
  }, []);

  return { toggleFavorite, isFavorite, version };
}
