import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Database } from "../../db/index.js";

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

import * as posterService from "../../services/poster-service.js";

const now = new Date("2024-01-01T00:00:00Z");

const orderRow = {
  id: "order-aaaa-0000-0000-000000000001",
  userId: "user-aaaa-0000-0000-000000000001",
  status: "confirmed",
  type: "delivery",
  total: 300,
  deliverySlotId: null,
  deliveryAddress: null,
  posterOrderId: null,
  stripePaymentIntentId: "pi_123",
  createdAt: now,
  updatedAt: now,
};

const orderItemRow = {
  id: "item-aaaa-0000-0000-000000000001",
  orderId: orderRow.id,
  mealId: "meal-aaaa-0000-0000-000000000001",
  mealName: "Grilled Chicken",
  quantity: 2,
  unitPrice: 150,
};

const mealRow = {
  id: "meal-aaaa-0000-0000-000000000001",
  name: "Grilled Chicken",
  posterProductId: "poster-001",
  active: true,
};

describe("poster-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMockPosterProvider", () => {
    it("creates incoming order and returns incomingOrderId", async () => {
      const provider = posterService.createMockPosterProvider();
      const result = await provider.createIncomingOrder({
        products: [{ productId: "poster-001", count: 2 }],
      });

      expect(result.incomingOrderId).toMatch(/^poster_mock_/);
    });

    it("returns 'new' status for a newly created order", async () => {
      const provider = posterService.createMockPosterProvider();
      const { incomingOrderId } = await provider.createIncomingOrder({
        products: [{ productId: "poster-001", count: 1 }],
      });

      const { status } = await provider.getIncomingOrder(incomingOrderId);
      expect(status).toBe("new");
    });

    it("allows setting order status via setOrderStatus", async () => {
      const provider = posterService.createMockPosterProvider();
      const { incomingOrderId } = await provider.createIncomingOrder({
        products: [{ productId: "poster-001", count: 1 }],
      });

      provider.setOrderStatus(incomingOrderId, "done");
      const { status } = await provider.getIncomingOrder(incomingOrderId);
      expect(status).toBe("done");
    });
  });

  describe("pushOrderToPoster", () => {
    it("creates incoming order and updates posterOrderId and status", async () => {
      // DB calls: select order, select order items, select meal (for productId), update order
      const db = buildMultiCallDbMock([
        [orderRow],
        [orderItemRow],
        [mealRow],
        [],
      ]);
      const provider = posterService.createMockPosterProvider();

      const posterOrderId = await posterService.pushOrderToPoster(db, provider, orderRow.id);

      expect(posterOrderId).toMatch(/^poster_mock_/);
    });

    it("throws NOT_FOUND when order does not exist", async () => {
      const db = buildDbMock([]);
      const provider = posterService.createMockPosterProvider();

      await expect(
        posterService.pushOrderToPoster(db, provider, "non-existent")
      ).rejects.toThrow("Order not found");
    });
  });

  describe("pollPosterOrderStatus", () => {
    it("returns changed=true when status has changed", async () => {
      const orderWithPoster = { ...orderRow, posterOrderId: "poster_mock_1", status: "preparing" };
      const db = buildMultiCallDbMock([
        [orderWithPoster],
        [], // update call
      ]);
      const provider = posterService.createMockPosterProvider();
      provider.setOrderStatus("poster_mock_1", "done");

      const result = await posterService.pollPosterOrderStatus(db, provider, orderRow.id);

      expect(result.changed).toBe(true);
      expect(result.newStatus).toBe("ready");
    });

    it("returns changed=false when status is unchanged", async () => {
      const orderWithPoster = { ...orderRow, posterOrderId: "poster_mock_1", status: "preparing" };
      const db = buildMultiCallDbMock([[orderWithPoster]]);
      const provider = posterService.createMockPosterProvider();
      // Default status is "new" which maps to "preparing" — same as current
      provider.setOrderStatus("poster_mock_1", "new");

      const result = await posterService.pollPosterOrderStatus(db, provider, orderRow.id);

      expect(result.changed).toBe(false);
      expect(result.newStatus).toBe("preparing");
    });

    it("throws when order has no posterOrderId", async () => {
      const db = buildMultiCallDbMock([[orderRow]]); // posterOrderId is null
      const provider = posterService.createMockPosterProvider();

      await expect(
        posterService.pollPosterOrderStatus(db, provider, orderRow.id)
      ).rejects.toThrow("Order has no posterOrderId");
    });
  });
});
