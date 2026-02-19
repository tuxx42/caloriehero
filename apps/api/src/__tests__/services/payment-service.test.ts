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

import * as paymentService from "../../services/payment-service.js";

const now = new Date("2024-01-01T00:00:00Z");

const orderRow = {
  id: "order-1111-0000-0000-000000000001",
  userId: "user-1111-0000-0000-000000000001",
  status: "pending_payment",
  type: "delivery",
  total: 300,
  deliverySlotId: null,
  deliveryAddress: null,
  posterOrderId: null,
  stripePaymentIntentId: null,
  createdAt: now,
  updatedAt: now,
};

const paymentIntentRow = {
  id: "pi-row-0000-0000-000000000001",
  stripePaymentIntentId: "pi_mock_123",
  amount: 300,
  currency: "thb",
  status: "pending",
  orderId: orderRow.id,
  createdAt: now,
};

describe("payment-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMockPaymentProvider", () => {
    it("creates a payment intent and returns id and clientSecret", async () => {
      const provider = paymentService.createMockPaymentProvider();
      const result = await provider.createPaymentIntent(300, "thb", { orderId: "order-1" });

      expect(result.id).toMatch(/^pi_mock_/);
      expect(result.clientSecret).toMatch(/_secret_mock$/);
    });

    it("constructs a webhook event from JSON body", () => {
      const provider = paymentService.createMockPaymentProvider();
      const body = JSON.stringify({ type: "payment_intent.succeeded", data: { object: { id: "pi_123" } } });
      const event = provider.constructWebhookEvent(body, "sig", "secret") as { type: string };
      expect(event.type).toBe("payment_intent.succeeded");
    });
  });

  describe("createPaymentForOrder", () => {
    it("creates payment intent and returns clientSecret and paymentIntentId", async () => {
      // DB calls: select order, insert payment_intents, update order
      const db = buildMultiCallDbMock([[orderRow], [], []]);
      const provider = paymentService.createMockPaymentProvider();

      const result = await paymentService.createPaymentForOrder(db, provider, orderRow.id);

      expect(result.clientSecret).toMatch(/_secret_mock$/);
      expect(result.paymentIntentId).toMatch(/^pi_mock_/);
    });

    it("throws NOT_FOUND when order does not exist", async () => {
      const db = buildDbMock([]);
      const provider = paymentService.createMockPaymentProvider();

      await expect(
        paymentService.createPaymentForOrder(db, provider, "non-existent")
      ).rejects.toThrow("Order not found");
    });
  });

  describe("handlePaymentSuccess", () => {
    it("updates payment and order status and returns orderId", async () => {
      // DB calls: select payment intent, update payment intent, update order
      const db = buildMultiCallDbMock([[paymentIntentRow], [], []]);

      const result = await paymentService.handlePaymentSuccess(db, "pi_mock_123");

      expect(result).toBe(orderRow.id);
    });

    it("throws NOT_FOUND when payment intent does not exist", async () => {
      const db = buildDbMock([]);

      await expect(
        paymentService.handlePaymentSuccess(db, "pi_non_existent")
      ).rejects.toThrow("Payment intent not found");
    });
  });
});
