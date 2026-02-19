import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../../app.js";
import { createMockToken } from "../../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../../db/index.js";

vi.mock("../../services/plan-service.js", () => ({
  matchMealsForUser: vi.fn(),
  generatePlanForUser: vi.fn(),
}));

import * as planService from "../../services/plan-service.js";

const authUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "user@test.com",
  name: "Test User",
  isAdmin: false,
};

const sampleMeal = {
  id: "meal-aaaa-0000-0000-000000000001",
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

describe("E2E: Matching Flow", () => {
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

  it("matches meals, then generates a plan from those meals", async () => {
    const scoredMeals = [
      { meal: sampleMeal, score: 0.92, deviation: { calories: 0.05, protein: 0.1, carbs: 0.2, fat: 0.1 } },
    ];

    const planResult = {
      items: [
        { slot: "lunch" as const, meal: sampleMeal, score: 0.92, slotTargets: { calories: 700, protein: 52, carbs: 70, fat: 24 } },
      ],
      totalScore: 0.92,
      actualMacros: { calories: 350, protein: 45, carbs: 10, fat: 12 },
      targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
    };

    vi.mocked(planService.matchMealsForUser).mockResolvedValue(scoredMeals);
    vi.mocked(planService.generatePlanForUser).mockResolvedValue(planResult);

    const token = createMockToken(authUser);

    // Step 1: Match meals
    const matchRes = await app.inject({
      method: "POST",
      url: "/api/v1/matching/meals",
      headers: { Authorization: `Bearer ${token}` },
      payload: { limit: 10 },
    });

    expect(matchRes.statusCode).toBe(200);
    const matchBody = matchRes.json<{ meals: typeof scoredMeals }>();
    expect(matchBody.meals).toHaveLength(1);
    expect(matchBody.meals[0]!.score).toBeGreaterThan(0.9);

    // Step 2: Generate plan
    const planRes = await app.inject({
      method: "POST",
      url: "/api/v1/matching/plan",
      headers: { Authorization: `Bearer ${token}` },
      payload: { date: "2024-01-15" },
    });

    expect(planRes.statusCode).toBe(200);
    const planBody = planRes.json<typeof planResult>();
    expect(planBody.totalScore).toBeGreaterThan(0.9);
    expect(planBody.items).toHaveLength(1);
    expect(planBody.items[0]!.slot).toBe("lunch");
  });

  it("returns 404 when no plan can be generated", async () => {
    vi.mocked(planService.generatePlanForUser).mockResolvedValue(null);
    const token = createMockToken(authUser);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/matching/plan",
      headers: { Authorization: `Bearer ${token}` },
      payload: { date: "2024-01-15" },
    });

    expect(res.statusCode).toBe(404);
  });

  it("rejects matching without authentication", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/matching/meals",
      payload: { limit: 10 },
    });

    expect(res.statusCode).toBe(401);
  });
});
