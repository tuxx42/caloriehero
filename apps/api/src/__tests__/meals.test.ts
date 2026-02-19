import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildApp } from "../app.js";
import { createMockToken } from "../plugins/auth.js";
import type { FastifyInstance } from "fastify";
import type { Database } from "../db/index.js";

// Mock the meal service so we don't need a real DB
vi.mock("../services/meal-service.js", () => ({
  listMeals: vi.fn(),
  getMeal: vi.fn(),
  createMeal: vi.fn(),
  updateMeal: vi.fn(),
  deleteMeal: vi.fn(),
}));

import * as mealService from "../services/meal-service.js";

const adminUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "admin@test.com",
  name: "Admin User",
  isAdmin: true,
};

const regularUser = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "user@test.com",
  name: "Regular User",
  isAdmin: false,
};

const sampleMeal = {
  id: "aaaaaaaa-0000-0000-0000-000000000001",
  name: "Grilled Chicken",
  description: "Lean grilled chicken breast",
  category: "lunch",
  nutritionalInfo: {
    calories: 350,
    protein: 45,
    carbs: 10,
    fat: 12,
    fiber: undefined,
    sugar: undefined,
  },
  servingSize: "300g",
  price: 150,
  allergens: [],
  dietaryTags: ["high_protein"],
  imageUrl: undefined,
  posterProductId: undefined,
  active: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const createMealBody = {
  name: "Grilled Chicken",
  description: "Lean grilled chicken breast",
  category: "lunch",
  nutritionalInfo: {
    calories: 350,
    protein: 45,
    carbs: 10,
    fat: 12,
  },
  servingSize: "300g",
  price: 150,
  allergens: [],
  dietaryTags: ["high_protein"],
};

describe("Meal routes", () => {
  let app: FastifyInstance;
  // A stub db — we never call it because services are mocked
  const stubDb = {} as Database;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp({ useMockAuth: true, db: stubDb });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/v1/meals", () => {
    it("returns empty array when no meals exist", async () => {
      vi.mocked(mealService.listMeals).mockResolvedValue([]);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/meals",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ meals: [] });
    });

    it("returns list of active meals", async () => {
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/meals",
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ meals: unknown[] }>();
      expect(body.meals).toHaveLength(1);
    });
  });

  describe("GET /api/v1/meals/:id", () => {
    it("returns a meal by ID", async () => {
      vi.mocked(mealService.getMeal).mockResolvedValue(sampleMeal);

      const response = await app.inject({
        method: "GET",
        url: `/api/v1/meals/${sampleMeal.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<typeof sampleMeal>().name).toBe("Grilled Chicken");
    });

    it("returns 404 when meal does not exist", async () => {
      vi.mocked(mealService.getMeal).mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/meals/non-existent-id",
      });

      expect(response.statusCode).toBe(404);
      expect(response.json<{ error: { code: string } }>().error.code).toBe(
        "NOT_FOUND"
      );
    });
  });

  describe("POST /api/v1/meals", () => {
    it("creates a meal with admin token", async () => {
      vi.mocked(mealService.createMeal).mockResolvedValue(sampleMeal);
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/meals",
        headers: { Authorization: `Bearer ${token}` },
        payload: createMealBody,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json<typeof sampleMeal>().name).toBe("Grilled Chicken");
      expect(mealService.createMeal).toHaveBeenCalledOnce();
    });

    it("returns 403 for non-admin user", async () => {
      const token = createMockToken(regularUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/meals",
        headers: { Authorization: `Bearer ${token}` },
        payload: createMealBody,
      });

      expect(response.statusCode).toBe(403);
      expect(response.json<{ error: { code: string } }>().error.code).toBe(
        "FORBIDDEN"
      );
    });

    it("returns 401 when no token is provided", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/meals",
        payload: createMealBody,
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 400 for invalid body", async () => {
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/meals",
        headers: { Authorization: `Bearer ${token}` },
        payload: { name: "" }, // missing required fields
      });

      expect(response.statusCode).toBe(400);
      const body = response.json<{ error: { code: string } }>();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PUT /api/v1/meals/:id", () => {
    it("updates a meal with admin token", async () => {
      const updated = { ...sampleMeal, name: "Updated Chicken" };
      vi.mocked(mealService.updateMeal).mockResolvedValue(updated);
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "PUT",
        url: `/api/v1/meals/${sampleMeal.id}`,
        headers: { Authorization: `Bearer ${token}` },
        payload: { name: "Updated Chicken" },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<typeof updated>().name).toBe("Updated Chicken");
    });

    it("returns 404 when meal does not exist", async () => {
      vi.mocked(mealService.updateMeal).mockResolvedValue(null);
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "PUT",
        url: "/api/v1/meals/non-existent-id",
        headers: { Authorization: `Bearer ${token}` },
        payload: { name: "X" },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/v1/meals/:id", () => {
    it("soft-deletes a meal with admin token", async () => {
      const deactivated = { ...sampleMeal, active: false };
      vi.mocked(mealService.deleteMeal).mockResolvedValue(deactivated);
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/v1/meals/${sampleMeal.id}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json<typeof deactivated>().active).toBe(false);
      expect(mealService.deleteMeal).toHaveBeenCalledWith(
        stubDb,
        sampleMeal.id
      );
    });

    it("returns 404 when meal does not exist", async () => {
      vi.mocked(mealService.deleteMeal).mockResolvedValue(null);
      const token = createMockToken(adminUser);

      const response = await app.inject({
        method: "DELETE",
        url: "/api/v1/meals/non-existent-id",
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
