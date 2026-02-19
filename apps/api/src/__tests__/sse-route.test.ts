import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../app.js";
import { createMockToken } from "../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

// ---------------------------------------------------------------------------
// Mock order-service so no real DB is needed
// ---------------------------------------------------------------------------

vi.mock("../services/order-service.js", () => ({
  createOrder: vi.fn(),
  getOrder: vi.fn(),
  listUserOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  setOrderPosterOrderId: vi.fn(),
  setOrderStripePaymentIntentId: vi.fn(),
}));

import * as orderService from "../services/order-service.js";

// ---------------------------------------------------------------------------
// Mock SSEManager to prevent actual streaming in inject() calls
// ---------------------------------------------------------------------------

vi.mock("../realtime/sse-manager.js", () => {
  const SSEManager = vi.fn(() => ({
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
    sendEvent: vi.fn(),
    getConnectionCount: vi.fn().mockReturnValue(0),
    closeAll: vi.fn(),
  }));
  return { SSEManager };
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

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

const sampleOrder = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  userId: authUser.id,
  status: "pending_payment",
  type: "delivery",
  total: 450,
  deliverySlotId: undefined,
  deliveryAddress: undefined,
  posterOrderId: undefined,
  stripePaymentIntentId: undefined,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  items: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SSE routes — GET /api/v1/sse/orders/:orderId", () => {
  let app: FastifyInstance;
  const stubDb = {} as Database;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = buildApp({ useMockAuth: true, db: stubDb });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns 401 when no auth token is provided", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/sse/orders/${sampleOrder.id}`,
    });

    expect(response.statusCode).toBe(401);
    const body = response.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 404 when the order does not exist", async () => {
    vi.mocked(orderService.getOrder).mockResolvedValue(null);
    const token = createMockToken(authUser);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/sse/orders/non-existent-order-id",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(404);
    const body = response.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when the authenticated user does not own the order", async () => {
    vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
    // Login as a different user who doesn't own sampleOrder
    const token = createMockToken(otherUser);

    const response = await app.inject({
      method: "GET",
      url: `/api/v1/sse/orders/${sampleOrder.id}`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    const body = response.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("sets SSE headers and verifies ownership check when the request is valid", async () => {
    vi.mocked(orderService.getOrder).mockResolvedValue(sampleOrder);
    const token = createMockToken(authUser);

    // light-my-request does not support long-lived SSE streaming natively.
    // We use payloadAsStream: true so inject() resolves once the first bytes
    // are written (i.e. after writeHead), without waiting for the stream to end.
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/sse/orders/${sampleOrder.id}`,
      headers: { Authorization: `Bearer ${token}` },
      payloadAsStream: true,
    });

    // Ownership check was performed with the correct arguments
    expect(orderService.getOrder).toHaveBeenCalledWith(stubDb, sampleOrder.id);

    // SSE-specific response headers must be present
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.headers["cache-control"]).toBe("no-cache");
    expect(response.headers["x-accel-buffering"]).toBe("no");

    // Destroy the stream so the test does not hang waiting for more data
    response.stream().destroy();
  });
});
