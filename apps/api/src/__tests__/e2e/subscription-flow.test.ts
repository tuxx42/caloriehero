import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { createMockToken } from "../../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../../db/index.js";

vi.mock("../../services/subscription-service.js", () => ({
  createSubscription: vi.fn(),
  getSubscription: vi.fn(),
  listUserSubscriptions: vi.fn(),
  pauseSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}));

import * as subscriptionService from "../../services/subscription-service.js";

const authUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  name: "Test User",
  isAdmin: false,
};

const sampleSubscription = {
  id: "sub-1111-0000-0000-000000000001",
  userId: authUser.id,
  status: "active" as const,
  stripeSubscriptionId: "sub_stripe_123",
  schedule: { days: ["monday" as const, "wednesday" as const, "friday" as const], timeSlot: "morning", mealsPerDay: 3 },
  macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  pausedAt: undefined,
  cancelledAt: undefined,
};

describe("E2E: Subscription Flow", () => {
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

  it("creates a subscription, then lists it, then pauses it", async () => {
    vi.mocked(subscriptionService.createSubscription).mockResolvedValue(sampleSubscription);
    vi.mocked(subscriptionService.listUserSubscriptions).mockResolvedValue([sampleSubscription]);
    vi.mocked(subscriptionService.getSubscription).mockResolvedValue(sampleSubscription);
    vi.mocked(subscriptionService.pauseSubscription).mockResolvedValue({
      ...sampleSubscription,
      status: "paused",
      pausedAt: new Date(),
    });

    const token = createMockToken(authUser);

    // Step 1: Create subscription
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/subscriptions",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        schedule: { days: ["monday", "wednesday", "friday"], timeSlot: "morning", mealsPerDay: 3 },
        macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      },
    });

    expect(createRes.statusCode).toBe(201);

    // Step 2: List subscriptions
    const listRes = await app.inject({
      method: "GET",
      url: "/api/v1/subscriptions",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.json<{ subscriptions: typeof sampleSubscription[] }>();
    expect(listBody.subscriptions).toHaveLength(1);

    // Step 3: Pause subscription
    const pauseRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/subscriptions/${sampleSubscription.id}/pause`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(pauseRes.statusCode).toBe(200);
    const pauseBody = pauseRes.json<typeof sampleSubscription>();
    expect(pauseBody.status).toBe("paused");
  });

  it("creates then cancels a subscription", async () => {
    vi.mocked(subscriptionService.createSubscription).mockResolvedValue(sampleSubscription);
    vi.mocked(subscriptionService.getSubscription).mockResolvedValue(sampleSubscription);
    vi.mocked(subscriptionService.cancelSubscription).mockResolvedValue({
      ...sampleSubscription,
      status: "cancelled",
      cancelledAt: new Date(),
    });

    const token = createMockToken(authUser);

    // Create
    const createRes = await app.inject({
      method: "POST",
      url: "/api/v1/subscriptions",
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        schedule: { days: ["monday"], timeSlot: "evening", mealsPerDay: 2 },
        macroTargets: { calories: 1800, protein: 130, carbs: 180, fat: 60 },
      },
    });

    expect(createRes.statusCode).toBe(201);

    // Cancel
    const cancelRes = await app.inject({
      method: "PATCH",
      url: `/api/v1/subscriptions/${sampleSubscription.id}/cancel`,
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(cancelRes.statusCode).toBe(200);
    const cancelBody = cancelRes.json<typeof sampleSubscription>();
    expect(cancelBody.status).toBe("cancelled");
  });

  it("rejects subscription creation without auth", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/subscriptions",
      payload: {
        schedule: { days: ["monday"], timeSlot: "morning", mealsPerDay: 3 },
        macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      },
    });

    expect(res.statusCode).toBe(401);
  });
});
