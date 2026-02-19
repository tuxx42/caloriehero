import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../app.js";
import { createMockToken } from "../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

vi.mock("../services/plan-service.js", () => ({
  matchMealsForUser: vi.fn(),
  generatePlanForUser: vi.fn(),
}));

import * as planService from "../services/plan-service.js";

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

const sampleScoredMeal = {
  meal: sampleMeal,
  score: 0.9,
  deviation: { calories: 0.05, protein: 0.1, carbs: 0.2, fat: 0.1 },
};

const samplePlanResult = {
  items: [
    {
      slot: "lunch" as const,
      meal: sampleMeal,
      score: 0.9,
      slotTargets: { calories: 700, protein: 52, carbs: 70, fat: 24 },
    },
  ],
  totalScore: 0.9,
  actualMacros: { calories: 350, protein: 45, carbs: 10, fat: 12 },
  targetMacros: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
};

describe("Matching routes", () => {
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

  describe("POST /api/v1/matching/meals", () => {
    it("returns matched meals for authenticated user", async () => {
      vi.mocked(planService.matchMealsForUser).mockResolvedValue([sampleScoredMeal]);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/meals",
        headers: { Authorization: `Bearer ${token}` },
        payload: { limit: 10 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ meals: typeof sampleScoredMeal[] }>();
      expect(body.meals).toHaveLength(1);
      expect(body.meals[0]!.score).toBe(0.9);
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/meals",
        payload: { limit: 10 },
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 400 for invalid request body", async () => {
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/meals",
        headers: { Authorization: `Bearer ${token}` },
        payload: { limit: 999 }, // exceeds max of 50
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/matching/plan", () => {
    it("returns generated plan for authenticated user", async () => {
      vi.mocked(planService.generatePlanForUser).mockResolvedValue(samplePlanResult);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/plan",
        headers: { Authorization: `Bearer ${token}` },
        payload: { date: "2024-01-15" },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<typeof samplePlanResult>();
      expect(body.totalScore).toBe(0.9);
      expect(body.items).toHaveLength(1);
    });

    it("returns 404 when no plan can be generated", async () => {
      vi.mocked(planService.generatePlanForUser).mockResolvedValue(null);
      const token = createMockToken(authUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/plan",
        headers: { Authorization: `Bearer ${token}` },
        payload: { date: "2024-01-15" },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("NO_PLAN_POSSIBLE");
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/matching/plan",
        payload: { date: "2024-01-15" },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
