import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Database } from "../../db/index.js";

/**
 * Build a chainable Drizzle query-builder mock that resolves to `resolvedRows`.
 * Mirrors the pattern from meal-service.test.ts.
 */
function buildDbMock(resolvedRows: unknown[] = []) {
  const chain: Record<string, unknown> = {};

  const methods = [
    "select",
    "from",
    "where",
    "limit",
    "insert",
    "values",
    "update",
    "set",
    "delete",
    "returning",
    "orderBy",
    "leftJoin",
    "innerJoin",
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

import * as orderService from "../../services/order-service.js";

const now = new Date("2024-01-01T00:00:00Z");

const mealRow = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Grilled Chicken",
  description: "Lean protein",
  category: "lunch",
  calories: 350,
  protein: 45,
  carbs: 10,
  fat: 12,
  fiber: null,
  sugar: null,
  servingSize: "300g",
  price: 150,
  allergens: [],
  dietaryTags: ["high_protein"],
  imageUrl: null,
  active: true,
  posterProductId: "poster-001",
  createdAt: now,
  updatedAt: now,
};

const orderRow = {
  id: "bbbbbbbb-0000-0000-0000-000000000001",
  userId: "cccccccc-0000-0000-0000-000000000001",
  status: "pending_payment",
  type: "delivery",
  total: 150,
  deliverySlotId: null,
  deliveryAddress: null,
  posterOrderId: null,
  stripePaymentIntentId: null,
  createdAt: now,
  updatedAt: now,
};

const orderItemRow = {
  id: "dddddddd-0000-0000-0000-000000000001",
  orderId: orderRow.id,
  mealId: mealRow.id,
  mealName: "Grilled Chicken",
  quantity: 1,
  unitPrice: 150,
};

describe("order-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    it("creates an order when all meals are valid and active", async () => {
      // The mock needs to handle multiple sequential calls:
      // 1. select active meals -> returns [mealRow]
      // 2. insert order -> returns [orderRow]
      // 3. insert orderItems -> returns [orderItemRow]
      let callCount = 0;
      const responses = [[mealRow], [orderRow], [orderItemRow]];

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

      const db = chain as unknown as Database;

      const result = await orderService.createOrder(
        db,
        orderRow.userId,
        {
          items: [{ mealId: mealRow.id, quantity: 1 }],
          deliverySlotId: undefined,
          deliveryAddress: undefined,
        }
      );

      expect(result.id).toBe(orderRow.id);
      expect(result.userId).toBe(orderRow.userId);
      expect(result.total).toBe(150);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.mealName).toBe("Grilled Chicken");
    });

    it("throws INVALID_MEAL when a mealId is not active", async () => {
      // Returns no active meals
      const db = buildDbMock([]);

      await expect(
        orderService.createOrder(db, "user-1", {
          items: [{ mealId: "non-existent-id", quantity: 1 }],
        })
      ).rejects.toThrow("Meal not found or inactive");
    });
  });

  describe("getOrder", () => {
    it("returns order with items when found", async () => {
      let callCount = 0;
      const responses = [[orderRow], [orderItemRow]];
      const chain: Record<string, unknown> = {};
      const methods = ["select", "from", "where", "limit", "orderBy"];
      for (const method of methods) {
        chain[method] = vi.fn(() => chain);
      }
      chain["then"] = (resolve: (val: unknown[]) => unknown, reject: (err: unknown) => unknown) => {
        const rows = responses[callCount++] ?? [];
        return Promise.resolve(rows).then(resolve, reject);
      };

      const result = await orderService.getOrder(chain as unknown as Database, orderRow.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(orderRow.id);
      expect(result!.items).toHaveLength(1);
    });

    it("returns null when order not found", async () => {
      const db = buildDbMock([]);
      const result = await orderService.getOrder(db, "non-existent");
      expect(result).toBeNull();
    });
  });

  describe("listUserOrders", () => {
    it("returns empty array when user has no orders", async () => {
      const db = buildDbMock([]);
      const result = await orderService.listUserOrders(db, "user-1");
      expect(result).toEqual([]);
    });

    it("returns orders with empty items for user", async () => {
      let callCount = 0;
      // First call: list orders. Second call: get items for first order.
      const responses = [[orderRow], []];
      const chain: Record<string, unknown> = {};
      const methods = ["select", "from", "where", "orderBy", "limit"];
      for (const method of methods) {
        chain[method] = vi.fn(() => chain);
      }
      chain["then"] = (resolve: (val: unknown[]) => unknown, reject: (err: unknown) => unknown) => {
        const rows = responses[callCount++] ?? [];
        return Promise.resolve(rows).then(resolve, reject);
      };

      const result = await orderService.listUserOrders(chain as unknown as Database, orderRow.userId);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(orderRow.id);
    });
  });

  describe("updateOrderStatus", () => {
    it("updates status and returns updated order", async () => {
      const updatedRow = { ...orderRow, status: "confirmed" };
      let callCount = 0;
      const responses = [[updatedRow], []]; // update returns row, then items fetch
      const chain: Record<string, unknown> = {};
      const methods = ["update", "set", "where", "returning", "select", "from", "orderBy", "limit"];
      for (const method of methods) {
        chain[method] = vi.fn(() => chain);
      }
      chain["then"] = (resolve: (val: unknown[]) => unknown, reject: (err: unknown) => unknown) => {
        const rows = responses[callCount++] ?? [];
        return Promise.resolve(rows).then(resolve, reject);
      };

      const result = await orderService.updateOrderStatus(chain as unknown as Database, orderRow.id, "confirmed");
      expect(result).not.toBeNull();
      expect(result!.status).toBe("confirmed");
    });

    it("returns null when order not found", async () => {
      const db = buildDbMock([]);
      const result = await orderService.updateOrderStatus(db, "non-existent", "confirmed");
      expect(result).toBeNull();
    });
  });

  describe("setOrderPosterOrderId", () => {
    it("sets posterOrderId and returns updated order", async () => {
      const updatedRow = { ...orderRow, posterOrderId: "poster-123" };
      let callCount = 0;
      const responses = [[updatedRow], []];
      const chain: Record<string, unknown> = {};
      const methods = ["update", "set", "where", "returning", "select", "from", "orderBy", "limit"];
      for (const method of methods) {
        chain[method] = vi.fn(() => chain);
      }
      chain["then"] = (resolve: (val: unknown[]) => unknown, reject: (err: unknown) => unknown) => {
        const rows = responses[callCount++] ?? [];
        return Promise.resolve(rows).then(resolve, reject);
      };

      const result = await orderService.setOrderPosterOrderId(chain as unknown as Database, orderRow.id, "poster-123");
      expect(result).not.toBeNull();
      expect(result!.posterOrderId).toBe("poster-123");
    });
  });

  describe("setOrderStripePaymentIntentId", () => {
    it("sets stripePaymentIntentId and returns updated order", async () => {
      const updatedRow = { ...orderRow, stripePaymentIntentId: "pi_stripe_123" };
      let callCount = 0;
      const responses = [[updatedRow], []];
      const chain: Record<string, unknown> = {};
      const methods = ["update", "set", "where", "returning", "select", "from", "orderBy", "limit"];
      for (const method of methods) {
        chain[method] = vi.fn(() => chain);
      }
      chain["then"] = (resolve: (val: unknown[]) => unknown, reject: (err: unknown) => unknown) => {
        const rows = responses[callCount++] ?? [];
        return Promise.resolve(rows).then(resolve, reject);
      };

      const result = await orderService.setOrderStripePaymentIntentId(chain as unknown as Database, orderRow.id, "pi_stripe_123");
      expect(result).not.toBeNull();
      expect(result!.stripePaymentIntentId).toBe("pi_stripe_123");
    });
  });
});
