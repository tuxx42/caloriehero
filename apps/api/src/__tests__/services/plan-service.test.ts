import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the services that plan-service depends on
vi.mock("../../services/meal-service.js", () => ({
  listMeals: vi.fn(),
}));

vi.mock("../../services/profile-service.js", () => ({
  getProfile: vi.fn(),
}));

// Mock the engine
vi.mock("@caloriehero/meal-plan-engine", () => ({
  matchMeals: vi.fn(),
  generateDailyPlan: vi.fn(),
}));

import * as mealService from "../../services/meal-service.js";
import * as profileService from "../../services/profile-service.js";
import * as engine from "@caloriehero/meal-plan-engine";
import * as planService from "../../services/plan-service.js";
import type { Database } from "../../db/index.js";

const stubDb = {} as Database;

const sampleProfile = {
  userId: "user-1111-0000-0000-000000000001",
  macroTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
  fitnessGoal: "maintain" as const,
  allergies: [] as string[],
  dietaryPreferences: [] as string[],
  deliveryAddress: undefined,
  deliveryLat: undefined,
  deliveryLng: undefined,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const sampleMeal = {
  id: "meal-aaaa-0000-0000-000000000001",
  name: "Grilled Chicken",
  description: "Lean protein",
  category: "lunch" as const,
  nutritionalInfo: { calories: 350, protein: 45, carbs: 10, fat: 12, fiber: undefined, sugar: undefined },
  servingSize: "300g",
  price: 150,
  allergens: [] as [],
  dietaryTags: ["high_protein" as const],
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

describe("plan-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("matchMealsForUser", () => {
    it("returns scored meals from engine when profile and meals exist", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);
      vi.mocked(engine.matchMeals).mockReturnValue([sampleScoredMeal]);

      const result = await planService.matchMealsForUser(stubDb, sampleProfile.userId, {
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.score).toBe(0.9);
    });

    it("calls matchMeals with correct constraints from profile", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);
      vi.mocked(engine.matchMeals).mockReturnValue([sampleScoredMeal]);

      await planService.matchMealsForUser(stubDb, sampleProfile.userId, { limit: 5 });

      expect(engine.matchMeals).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          constraints: expect.objectContaining({
            targets: sampleProfile.macroTargets,
          }),
          limit: 5,
        })
      );
    });

    it("passes category filter to engine when provided", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);
      vi.mocked(engine.matchMeals).mockReturnValue([]);

      await planService.matchMealsForUser(stubDb, sampleProfile.userId, {
        category: "lunch",
        limit: 10,
      });

      expect(engine.matchMeals).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ category: "lunch" })
      );
    });

    it("throws PROFILE_NOT_FOUND when user has no profile", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(null);

      await expect(
        planService.matchMealsForUser(stubDb, "user-no-profile", { limit: 10 })
      ).rejects.toThrow("User profile not found");
    });

    it("returns empty array when engine returns no matches", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([]);
      vi.mocked(engine.matchMeals).mockReturnValue([]);

      const result = await planService.matchMealsForUser(stubDb, sampleProfile.userId, { limit: 10 });
      expect(result).toEqual([]);
    });
  });

  describe("generatePlanForUser", () => {
    it("returns plan result when engine can generate a plan", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);
      vi.mocked(engine.generateDailyPlan).mockReturnValue(samplePlanResult);

      const result = await planService.generatePlanForUser(stubDb, sampleProfile.userId, {
        date: "2024-01-15",
      });

      expect(result).not.toBeNull();
      expect(result!.totalScore).toBe(0.9);
      expect(result!.items).toHaveLength(1);
    });

    it("returns null when engine cannot generate a plan", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([]);
      vi.mocked(engine.generateDailyPlan).mockReturnValue(null);

      const result = await planService.generatePlanForUser(stubDb, sampleProfile.userId, {
        date: "2024-01-15",
      });

      expect(result).toBeNull();
    });

    it("throws PROFILE_NOT_FOUND when user has no profile", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(null);

      await expect(
        planService.generatePlanForUser(stubDb, "user-no-profile", { date: "2024-01-15" })
      ).rejects.toThrow("User profile not found");
    });

    it("passes custom slots to engine when provided", async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue(sampleProfile);
      vi.mocked(mealService.listMeals).mockResolvedValue([sampleMeal]);
      vi.mocked(engine.generateDailyPlan).mockReturnValue(samplePlanResult);

      const customSlots = [
        { slot: "lunch" as const, percentage: 0.5 },
        { slot: "dinner" as const, percentage: 0.5 },
      ];

      await planService.generatePlanForUser(stubDb, sampleProfile.userId, {
        date: "2024-01-15",
        slots: customSlots,
      });

      expect(engine.generateDailyPlan).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          slots: customSlots,
        })
      );
    });
  });
});
