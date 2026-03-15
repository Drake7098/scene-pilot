import { useState, useEffect } from "react";
import { getTemplatePricingForTemplate } from "../../../pricing";
import type { TemplatePricingResult } from "../../../pricing/templatePricingTypes";

export function useTemplatePricing(templateId: string | null): {
  pricing: TemplatePricingResult | null;
  loading: boolean;
} {
  const [pricing, setPricing] = useState<TemplatePricingResult | null>(null);
  const [loading, setLoading] = useState(!!templateId);

  useEffect(() => {
    if (!templateId) {
      setPricing(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTemplatePricingForTemplate(templateId).then((result) => {
      if (!cancelled) {
        setPricing(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  return { pricing, loading };
}
