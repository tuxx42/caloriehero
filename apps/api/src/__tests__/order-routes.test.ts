import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../app.js";
import { createMockToken } from "../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

vi.mock("../services/order-service.js", () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  listUserOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  setOrderPosterOrderId: vi.fn(),
  setOrderStripePaymentIntentId: vi.fn(),
}));

// Mock payment-service to avoid Stripe calls
vi.mock("../services/payment-service.js", () => ({
  createPaymentForOrder: vi.fn(),
  handlePaymentSuccess: vi.fn(),
  createStripeProvider: vi.fn(() => ({})),
  createMockPaymentProvider: vi.fn(),
}));

import * as orderService from "../services/order-service.js";
import * as paymentService from "../services/payment-service.js";

const authUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  name: "Test User",
  isAdmin: false,
};

const otherUser = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "other@test.com",
  name: "Other User",
  isAdmin: false,
};

const now = new Date("2024-01-01");

const sampleOrder = {
  id: "order-aaaa-0000-0000-000000000001",
  userId: authUser.id,
  status: "pending_payment",
  type: "delivery",
  total: 300,
  deliverySlotId: undefined,
  deliveryAddress: undefined,
  posterOrderId: undefined,
  stripePaymentIntentId: undefined,
  createdAt: now,
  updatedAt: now,
  items: [
    {
      id: "item-aaaa-0000-0000-000000000001",
      orderId: "order-aaaa-0000-0000-000000000001",
      mealId: "meal-aaaa-0000-0000-000000000001",
      mealName: "Grilled Chicken",
      quantity: 2,
      unitPrice: 150,
    },
  ],
};

const createOrderBody = {
  items: [
    { mealId: "aaaaaaaa-0000-0000-0000-000000000001", quantity: 2 },
  ],
};

describe("Order routes", () => {
  let app: FastifyInstance;
  const stubDb = {} as Database;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ useMockAuth: true, db: stubDb, stripeSecretKey: "sk_test_mock" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /api/v1/orders", () => {
    it("creates an order for authenticated user", async () => {
      vi.mocked(orderService.createOrder).mockResolvedValue(sampleOrder);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: { Authorization: `Bearer ${token}` },
        payload: createOrderBody,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json<typeof sampleOrder>();
      expect(body.id).toBe(sampleOrder.id);
      expect(body.items).toHaveLength(1);
      expect(orderService.createOrder).toHaveBeenCalledWith(
        stubDb,
        authUser.id,
        expect.objectContaining({ items: createOrderBody.items })
      );
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        payload: createOrderBody,
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 400 for invalid request body", async () => {
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders",
        headers: { Authorization: `Bearer ${token}` },
        payload: { items: [] }, // empty items array is invalid (min 1)
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/orders", () => {
    it("returns list of user orders", async () => {
      vi.mocked(orderService.listUserOrders).mockResolvedValue([sampleOrder]);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/orders",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ orders: typeof sampleOrder[] }>();
      expect(body.orders).toHaveLength(1);
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/orders",
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/orders/:id", () => {
    it("returns order when user owns it", async () => {
      vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/orders/${sampleOrder.id}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<typeof sampleOrder>();
      expect(body.id).toBe(sampleOrder.id);
    });

    it("returns 403 when user does not own the order", async () => {
      vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
      const token = createMockToken(otherUser);

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/orders/${sampleOrder.id}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(403);
    });

    it("returns 404 when order does not exist", async () => {
      vi.mocked(orderService.getOrder).mockResolvedValue(null);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/orders/non-existent-id",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/v1/orders/:id/pay", () => {
    it("returns payment intent data for order owner", async () => {
      vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
      vi.mocked(paymentService.createPaymentForOrder).mockResolvedValue({
        clientSecret: "pi_123_secret_mock",
        paymentIntentId: "pi_123",
      });

      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: `/api/v1/orders/${sampleOrder.id}/pay`,
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ clientSecret: string; paymentIntentId: string }>();
      expect(body.clientSecret).toBe("pi_123_secret_mock");
      expect(body.paymentIntentId).toBe("pi_123");
    });

    it("returns 404 when order does not exist", async () => {
      vi.mocked(orderService.getOrder).mockResolvedValue(null);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/orders/non-existent-id/pay",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
