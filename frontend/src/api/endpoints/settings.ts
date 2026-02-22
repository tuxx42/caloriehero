import { api } from "../client";
import type { PricingConfig } from "../types";

export function getPricing(): Promise<PricingConfig> {
  return api.get<PricingConfig>("/settings/pricing");
}

export function updatePricing(
  data: Partial<Omit<PricingConfig, "id">>,
): Promise<PricingConfig> {
  return api.put<PricingConfig>("/settings/pricing", data);
}
