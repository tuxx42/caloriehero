import { describe, it, expect } from "vitest";
import { matchMeals } from "../per-meal-matcher.js";
import { generateDailyPlan } from "../daily-planner.js";
import { calculateScore } from "../scoring.js";
import { allocateSlots } from "../slot-allocator.js";
import type { MacroTargets } from "@caloriehero/shared-types";
import { allMeals, maintenanceTargets } from "./fixtures.js";
import { DEFAULT_SLOT_PERCENTAGES } from "../constants.js";

describe("edge cases", () => {
  it("matchMeals with empty meals array returns empty array", () => {
    const result = matchMeals([], {
      constraints: { targets: maintenanceTargets },
      allergies: [],
      dietaryPreferences: [],
      limit: 10,
    });
    expect(result).toEqual([]);
  });

  it("matchMeals with a single meal returns that meal", () => {
    const singleMeal = [allMeals[0]!];
    const result = matchMeals(singleMeal, {
      constraints: { targets: maintenanceTargets },
      allergies: [],
      dietaryPreferences: [],
      limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.meal.id).toBe(singleMeal[0]!.id);
  });

  it("generateDailyPlan with empty meals array returns null", () => {
    const result = generateDailyPlan([], {
      dailyTargets: maintenanceTargets,
      slots: DEFAULT_SLOT_PERCENTAGES,
      allergies: [],
      dietaryPreferences: [],
    });
    expect(result).toBeNull();
  });

  it("scoring with near-zero targets (calories = 1) does not throw", () => {
    // MacroTargets requires calories to be positive, so minimum is ~1
    const target: MacroTargets = { calories: 1, protein: 0, carbs: 0, fat: 0 };
    const nutritionalInfo = { calories: 1, protein: 0, carbs: 0, fat: 0 };
    expect(() => calculateScore(nutritionalInfo, target)).not.toThrow();
    const score = calculateScore(nutritionalInfo, target);
    expect(score).toBe(1.0);
  });

  it("allocateSlots with extreme tolerances (tiny snack percentage) still sums correctly", () => {
    const tinySlots = [
      { slot: "breakfast" as const, percentage: 0.499 },
      { slot: "snack" as const, percentage: 0.501 },
    ];
    const allocations = allocateSlots(maintenanceTargets, tinySlots);
    const total = allocations.reduce((s, a) => s + a.targets.calories, 0);
    expect(total).toBeCloseTo(maintenanceTargets.calories, 1);
  });

  it("generateDailyPlan with single slot returns a plan with one item", () => {
    const result = generateDailyPlan(allMeals, {
      dailyTargets: maintenanceTargets,
      slots: [{ slot: "lunch", percentage: 1.0 }],
      allergies: [],
      dietaryPreferences: [],
    });
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]!.slot).toBe("lunch");
  });
});
