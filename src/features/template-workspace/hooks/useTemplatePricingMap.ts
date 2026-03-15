/**
 * Load pricing for a set of template ids. Uses getTemplatePricingForTemplate (cached).
 */

import { useState, useEffect } from "react";
import { getTemplatePricingForTemplate } from "../../../pricing";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";

export function useTemplatePricingMap(
  templateIds: string[]
): Record<string, TemplatePricingResult | null> {
  const [map, setMap] = useState<Record<string, TemplatePricingResult | null>>({});

  useEffect(() => {
    if (templateIds.length === 0) {
      setMap({});
      return;
    }
    let cancelled = false;
    const next: Record<string, TemplatePricingResult | null> = {};
    templateIds.forEach((id) => {
      next[id] = null;
    });
    setMap(next);

    Promise.all(
      templateIds.map(async (id) => {
        const pricing = await getTemplatePricingForTemplate(id);
        return { id, pricing };
      })
    ).then((results) => {
      if (cancelled) return;
      setMap((prev) => {
        const out = { ...prev };
        results.forEach(({ id, pricing }) => {
          out[id] = pricing;
        });
        return out;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [templateIds.join(",")]);

  return map;
}
