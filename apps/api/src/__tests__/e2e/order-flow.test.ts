import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { createMockToken } from "../../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../../db/index.js";

// Mock all services used in the order flow
vi.mock("../../services/meal-service.js", () => ({
  listMeals: vi.fn(),
  getMeal: vi.fn(),
}));

vi.mock("../../services/order-service.js", () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  listUserOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  setOrderPosterOrderId: vi.fn(),
  setOrderStripePaymentIntentId: vi.fn(),
}));

vi.mock("../../services/payment-service.js", () => ({
  createStripeProvider: vi.fn().mockReturnValue({}),
  createPaymentForOrder: vi.fn(),
  handlePaymentSuccess: vi.fn(),
}));

vi.mock("../../services/poster-service.js", () => ({
  pushOrderToPoster: vi.fn(),
}));

import * as mealService from "../../services/meal-service.js";
import * as orderService from "../../services/order-service.js";
import * as paymentService from "../../services/payment-service.js";

const authUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  name: "Test User",
  isAdmin: false,
};

const sampleMeal = {
  id: "aaaaaaaa-aaaa-0000-0000-000000000001",
  name: "Grilled Chicken",
  description: "Lean protein",
  category: "lunch" as const,
  nutritionalInfo: { calories: 350, protein: 45, carbs: 10, fat: 12, fiber: undefined, sugar: undefined },
  servingSize: "300g",
  price: 150,
  allergens: [] as ("dairy" | "eggs" | "fish" | "shellfish" | "tree_nuts" | "peanuts" | "wheat" | "soy" | "sesame")[],
  dietaryTags: ["high_protein"] as ("vegetarian" | "vegan" | "gluten_free" | "keto" | "low_carb" | "high_protein" | "dairy_free" | "halal")[],
  imageUrl: undefined,
  active: true,
  posterProductId: undefined,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const sampleOrder = {
  id: "order-1111-0000-0000-000000000001",
  userId: authUser.id,
  status: "pending_payment" as const,
  type: "delivery" as const,
  total: 150,
  deliverySlotId: undefined,
  deliveryAddress: undefined,
  posterOrderId: undefined,
  stripePaymentIntentId: undefined,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  items: [{ id: "item-1", orderId: "order-1111-0000-0000-000000000001", mealId: sampleMeal.id, mealName: sampleMeal.name, quantity: 1, unitPrice: 150 }],
};

describe("E2E: Order Flow", () => {
  let app: FastifyInstance;
  const stubDb = {} as Database;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ useMockAuth: true, db: stubDb, stripeSecretKey: "sk_test_fake" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates an order, then retrieves it", async () => {
    vi.mocked(orderService.createOrder).mockResolvedValue(sampleOrder);
    vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);

    const token = createMockToken(authUser);

    // Step 1: Create order
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        items: [{ mealId: sampleMeal.id, quantity: 1 }],
      },
    });

    expect(createRes.statusCode).toBe(201);

    // Step 2: Get order
    const getRes = await app.inject({
      method: "GET",
      url: `/api/v1/orders/${sampleOrder.id}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(getRes.statusCode).toBe(200);
    const body = getRes.json<typeof sampleOrder>();
    expect(body.id).toBe(sampleOrder.id);
    expect(body.status).toBe("pending_payment");
  });

  it("creates an order, pays it, and confirms payment updates status", async () => {
    vi.mocked(orderService.createOrder).mockResolvedValue(sampleOrder);
    vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
    vi.mocked(paymentService.createPaymentForOrder).mockResolvedValue({
      clientSecret: "pi_test_secret",
      paymentIntentId: "pi_test_123",
    });

    const token = createMockToken(authUser);

    // Step 1: Create order
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        items: [{ mealId: sampleMeal.id, quantity: 1 }],
      },
    });

    expect(createRes.statusCode).toBe(201);

    // Step 2: Pay order
    const payRes = await app.inject({
      method: "POST",
      url: `/api/v1/orders/${sampleOrder.id}/pay`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(payRes.statusCode).toBe(200);
    const payBody = payRes.json<{ clientSecret: string }>();
    expect(payBody.clientSecret).toBe("pi_test_secret");
  });

  it("rejects order creation without authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { items: [{ mealId: sampleMeal.id, quantity: 1 }] },
    });

    expect(res.statusCode).toBe(401);
  });

  it("rejects accessing another user's order", async () => {
    const otherOrder = { ...sampleOrder, userId: "other-user-id" };
    vi.mocked(orderService.getOrder).mockResolvedValue(otherOrder);

    const token = createMockToken(authUser);

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/orders/${otherOrder.id}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(403);
  });
});
