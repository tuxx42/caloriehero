import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Database } from "../../db/index.js";

function buildDbMock(resolvedRows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "from", "where", "limit", "insert", "values",
    "update", "set", "delete", "returning", "orderBy",
  ];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  chain["then"] = (
    resolve: (val: unknown[]) => unknown,
    reject: (err: unknown) => unknown
  ) => Promise.resolve(resolvedRows).then(resolve, reject);
  return chain as unknown as Database;
}

function buildMultiCallDbMock(responses: unknown[][]) {
  let callCount = 0;
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "from", "where", "limit", "insert", "values",
    "update", "set", "delete", "returning", "orderBy",
  ];
  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }
  chain["then"] = (
    resolve: (val: unknown[]) => unknown,
    reject: (err: unknown) => unknown
  ) => {
    const rows = responses[callCount++] ?? [];
    return Promise.resolve(rows).then(resolve, reject);
  };
  return chain as unknown as Database;
}

import * as deliveryService from "../../services/delivery-service.js";

const now = new Date("2024-01-01T00:00:00Z");

const zoneRow = {
  id: "zone-1111-0000-0000-000000000001",
  name: "Bangkok Downtown",
  lat: 13.7563,
  lng: 100.5018,
  radiusKm: 5,
  deliveryFee: 50,
  active: true,
  createdAt: now,
  updatedAt: now,
};

const slotRow = {
  id: "slot-1111-0000-0000-000000000001",
  date: "2024-01-15",
  startTime: "08:00",
  endTime: "10:00",
  zoneId: zoneRow.id,
  capacity: 10,
  bookedCount: 3,
  createdAt: now,
};

describe("delivery-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateDistance", () => {
    it("returns 0 for the same point", () => {
      const dist = deliveryService.calculateDistance(13.7563, 100.5018, 13.7563, 100.5018);
      expect(dist).toBeCloseTo(0, 5);
    });

    it("calculates approximate distance between two Bangkok points", () => {
      // Approx 1km apart
      const dist = deliveryService.calculateDistance(13.7563, 100.5018, 13.7473, 100.5018);
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThan(2);
    });

    it("calculates distance between distant cities (Bangkok to Chiang Mai)", () => {
      const dist = deliveryService.calculateDistance(13.7563, 100.5018, 18.7883, 98.9853);
      // Actual haversine result is ~582km; verify it's in a reasonable range
      expect(dist).toBeGreaterThan(500);
      expect(dist).toBeLessThan(800);
    });
  });

  describe("listDeliveryZones", () => {
    it("returns active zones", async () => {
      const db = buildDbMock([zoneRow]);
      const result = await deliveryService.listDeliveryZones(db);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Bangkok Downtown");
    });

    it("returns empty array when no zones", async () => {
      const db = buildDbMock([]);
      const result = await deliveryService.listDeliveryZones(db);
      expect(result).toEqual([]);
    });
  });

  describe("listAvailableSlots", () => {
    it("returns slots for zone and date", async () => {
      const db = buildDbMock([slotRow]);
      const result = await deliveryService.listAvailableSlots(db, zoneRow.id, "2024-01-15");
      expect(result).toHaveLength(1);
      expect(result[0]!.startTime).toBe("08:00");
      expect(result[0]!.available).toBe(true);
    });

    it("marks slot as unavailable when fully booked", async () => {
      const fullSlot = { ...slotRow, bookedCount: 10, capacity: 10 };
      const db = buildDbMock([fullSlot]);
      const result = await deliveryService.listAvailableSlots(db, zoneRow.id, "2024-01-15");
      expect(result[0]!.available).toBe(false);
    });
  });

  describe("bookSlot", () => {
    it("increments bookedCount when slot is available", async () => {
      const updatedSlot = { ...slotRow, bookedCount: 4 };
      const db = buildMultiCallDbMock([[slotRow], [updatedSlot]]);
      const result = await deliveryService.bookSlot(db, slotRow.id);
      expect(result.bookedCount).toBe(4);
    });

    it("throws SLOT_FULL when slot is at capacity", async () => {
      const fullSlot = { ...slotRow, bookedCount: 10, capacity: 10 };
      const db = buildDbMock([fullSlot]);
      await expect(deliveryService.bookSlot(db, fullSlot.id)).rejects.toThrow("Delivery slot is fully booked");
    });

    it("throws NOT_FOUND when slot does not exist", async () => {
      const db = buildDbMock([]);
      await expect(deliveryService.bookSlot(db, "non-existent")).rejects.toThrow("Delivery slot not found");
    });
  });
});
