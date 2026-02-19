import { eq, and, sql } from "drizzle-orm";
import type { Database } from "../db/index.js";
import {
  deliveryZones,
  deliverySlots,
  type DeliveryZoneRow,
  type DeliverySlotRow,
} from "../db/schema/index.js";

function rowToZone(row: DeliveryZoneRow) {
  return {
    id: row.id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    radiusKm: row.radiusKm,
    deliveryFee: row.deliveryFee,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToSlot(row: DeliverySlotRow) {
  return {
    id: row.id,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    zoneId: row.zoneId,
    capacity: row.capacity,
    bookedCount: row.bookedCount,
    available: row.bookedCount < row.capacity,
    createdAt: row.createdAt,
  };
}

export async function listDeliveryZones(db: Database) {
  const rows = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.active, true))
    .orderBy(deliveryZones.name);

  return rows.map(rowToZone);
}

export async function listAvailableSlots(
  db: Database,
  zoneId: string,
  date: string
) {
  const rows = await db
    .select()
    .from(deliverySlots)
    .where(
      and(eq(deliverySlots.zoneId, zoneId), eq(deliverySlots.date, date))
    )
    .orderBy(deliverySlots.startTime);

  return rows.map(rowToSlot);
}

export async function bookSlot(db: Database, slotId: string) {
  // Get current slot to check capacity
  const [slotRow] = await db
    .select()
    .from(deliverySlots)
    .where(eq(deliverySlots.id, slotId))
    .limit(1);

  if (!slotRow) {
    throw Object.assign(new Error("Delivery slot not found"), {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }

  if (slotRow.bookedCount >= slotRow.capacity) {
    throw Object.assign(new Error("Delivery slot is fully booked"), {
      statusCode: 409,
      code: "SLOT_FULL",
    });
  }

  // Increment bookedCount
  const [updatedRow] = await db
    .update(deliverySlots)
    .set({ bookedCount: slotRow.bookedCount + 1 })
    .where(
      and(
        eq(deliverySlots.id, slotId),
        // optimistic concurrency — only update if count hasn't changed
        eq(deliverySlots.bookedCount, slotRow.bookedCount)
      )
    )
    .returning();

  if (!updatedRow) {
    throw Object.assign(
      new Error("Failed to book slot — concurrent modification detected"),
      { statusCode: 409, code: "SLOT_CONFLICT" }
    );
  }

  return rowToSlot(updatedRow);
}

/**
 * Haversine formula — returns distance in kilometres between two lat/lng points.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export async function findZoneForLocation(
  db: Database,
  lat: number,
  lng: number
) {
  const zones = await listDeliveryZones(db);

  for (const zone of zones) {
    const distance = calculateDistance(lat, lng, zone.lat, zone.lng);
    if (distance <= zone.radiusKm) {
      return zone;
    }
  }

  return null;
}
