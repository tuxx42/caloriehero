import { describe, it, expect } from "vitest";
import { orderSchema, orderStatusSchema, orderItemSchema } from "../orders.js";

const validItem = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  mealId: "550e8400-e29b-41d4-a716-446655440002",
  mealName: "Grilled Chicken Breast",
  quantity: 2,
  unitPrice: 189,
};

const validOrder = {
  id: "550e8400-e29b-41d4-a716-446655440003",
  userId: "550e8400-e29b-41d4-a716-446655440004",
  status: "pending_payment" as const,
  type: "on_demand" as const,
  items: [validItem],
  total: 378,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

describe("orderSchema", () => {
  it("parses a valid order", () => {
    const result = orderSchema.parse(validOrder);
    expect(result.status).toBe("pending_payment");
    expect(result.items).toHaveLength(1);
  });

  it("rejects empty items array", () => {
    expect(() => orderSchema.parse({ ...validOrder, items: [] })).toThrow();
  });

  it("rejects negative total", () => {
    expect(() => orderSchema.parse({ ...validOrder, total: -1 })).toThrow();
  });

  it("accepts optional posterOrderId", () => {
    const result = orderSchema.parse({ ...validOrder, posterOrderId: "poster-123" });
    expect(result.posterOrderId).toBe("poster-123");
  });

  it("accepts optional stripePaymentIntentId", () => {
    const result = orderSchema.parse({ ...validOrder, stripePaymentIntentId: "pi_abc123" });
    expect(result.stripePaymentIntentId).toBe("pi_abc123");
  });
});

describe("orderItemSchema", () => {
  it("rejects zero quantity", () => {
    expect(() => orderItemSchema.parse({ ...validItem, quantity: 0 })).toThrow();
  });

  it("rejects non-integer quantity", () => {
    expect(() => orderItemSchema.parse({ ...validItem, quantity: 1.5 })).toThrow();
  });

  it("rejects negative unitPrice", () => {
    expect(() => orderItemSchema.parse({ ...validItem, unitPrice: -10 })).toThrow();
  });
});

describe("orderStatusSchema", () => {
  it("contains all expected statuses", () => {
    const statuses = ["pending_payment", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
    expect(orderStatusSchema.options).toEqual(statuses);
  });

  it("rejects unknown status", () => {
    expect(() => orderStatusSchema.parse("shipped")).toThrow();
  });
});
