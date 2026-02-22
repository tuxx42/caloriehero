import { api } from "../client";
import type { DeliverySlot, DeliveryZone } from "../types";

export function listZones(): Promise<DeliveryZone[]> {
  return api.get<DeliveryZone[]>("/delivery/zones");
}

export function listSlots(zoneId: string, date?: string): Promise<DeliverySlot[]> {
  const params = date ? `?date=${date}` : "";
  return api.get<DeliverySlot[]>(`/delivery/zones/${zoneId}/slots${params}`);
}
