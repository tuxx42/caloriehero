import { describe, it, expect } from "vitest";
import { findOptimalPlan } from "../optimizer.js";
import { allocateSlots } from "../slot-allocator.js";
import { calculateScore } from "../scoring.js";
import type { Meal, MacroTargets, MealSlot } from "@caloriehero/shared-types";
import { maintenanceTargets, breakfastMeals, lunchMeals, dinnerMeals, snackMeals } from "./fixtures.js";
import { DEFAULT_SLOT_PERCENTAGES } from "../constants.js";

function makeMeal(id: string, slot: MealSlot, nutritionalInfo: { calories: number; protein: number; carbs: number; fat: number }): Meal {
  return {
    id,
    name: `Test Meal ${id}`,
    description: "Test meal",
    category: slot,
    nutritionalInfo,
    servingSize: "300g",
    price: 100,
    allergens: [],
    dietaryTags: [],
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };
}

describe("findOptimalPlan", () => {
  it("returns null when no slots provided", () => {
    const result = findOptimalPlan([], new Map());
    expect(result).toBeNull();
  });

  it("returns null when a required slot has no meals", () => {
    const slotAllocations = allocateSlots(maintenanceTargets, DEFAULT_SLOT_PERCENTAGES);
    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", breakfastMeals],
      ["lunch", lunchMeals],
      ["dinner", dinnerMeals],
      // snack slot has NO meals
      ["snack", []],
    ]);
    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).toBeNull();
  });

  it("trivial case: one meal per slot returns that meal", () => {
    const slotAllocations = allocateSlots(maintenanceTargets, [
      { slot: "breakfast", percentage: 1.0 },
    ]);
    const meal = breakfastMeals[0]!;
    const mealsBySlot = new Map<MealSlot, Meal[]>([["breakfast", [meal]]]);
    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]!.meal.id).toBe(meal.id);
  });

  it("finds the known-optimal meal for a single slot", () => {
    // Create a target and meals where one is a perfect match
    const slotTargets: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const perfectMeal = makeMeal("perfect-id-0000-0000-0000-000000000001", "lunch", {
      calories: 500, protein: 40, carbs: 50, fat: 15,
    });
    const badMeal = makeMeal("bad-meal-id-0000-0000-0000-000000000002", "lunch", {
      calories: 200, protein: 10, carbs: 80, fat: 5,
    });

    const slotAllocations = [{ slot: "lunch" as MealSlot, percentage: 1.0, targets: slotTargets }];
    const mealsBySlot = new Map<MealSlot, Meal[]>([["lunch", [perfectMeal, badMeal]]]);

    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    expect(result!.items[0]!.meal.id).toBe("perfect-id-0000-0000-0000-000000000001");
    expect(result!.totalScore).toBe(1.0);
  });

  it("finds the optimal combination for two slots", () => {
    // Slot targets designed so we know the optimal
    const bfTarget: MacroTargets = { calories: 300, protein: 20, carbs: 30, fat: 10 };
    const lunchTarget: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };

    const goodBf = makeMeal("good-bf-id-0000-0000-000000000001", "breakfast", {
      calories: 300, protein: 20, carbs: 30, fat: 10,
    });
    const badBf = makeMeal("bad-bf-id-00-0000-0000-000000000002", "breakfast", {
      calories: 600, protein: 5, carbs: 80, fat: 25,
    });
    const goodLunch = makeMeal("good-ln-id-0000-0000-000000000003", "lunch", {
      calories: 500, protein: 40, carbs: 50, fat: 15,
    });
    const badLunch = makeMeal("bad-ln-id-00-0000-0000-000000000004", "lunch", {
      calories: 100, protein: 5, carbs: 10, fat: 2,
    });

    const slotAllocations = [
      { slot: "breakfast" as MealSlot, percentage: 0.4, targets: bfTarget },
      { slot: "lunch" as MealSlot, percentage: 0.6, targets: lunchTarget },
    ];
    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", [goodBf, badBf]],
      ["lunch", [goodLunch, badLunch]],
    ]);

    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    const bfItem = result!.items.find((i) => i.slot === "breakfast")!;
    const lunchItem = result!.items.find((i) => i.slot === "lunch")!;
    expect(bfItem.meal.id).toBe("good-bf-id-0000-0000-000000000001");
    expect(lunchItem.meal.id).toBe("good-ln-id-0000-0000-000000000003");
  });

  it("matches brute-force result on small catalog (pruning correctness)", () => {
    // 3 meals per slot, 3 slots — exhaustive compare with brute force
    const slots: { slot: MealSlot; percentage: number }[] = [
      { slot: "breakfast", percentage: 0.33 },
      { slot: "lunch", percentage: 0.34 },
      { slot: "dinner", percentage: 0.33 },
    ];
    const slotAllocations = allocateSlots(maintenanceTargets, slots);

    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", breakfastMeals.slice(0, 3)],
      ["lunch", lunchMeals.slice(0, 3)],
      ["dinner", dinnerMeals.slice(0, 3)],
    ]);

    const optimizerResult = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(optimizerResult).not.toBeNull();

    // Brute-force: try all 3*3*3 = 27 combinations
    let bruteForceScore = -1;

    for (const bfMeal of mealsBySlot.get("breakfast")!) {
      for (const lMeal of mealsBySlot.get("lunch")!) {
        for (const dMeal of mealsBySlot.get("dinner")!) {
          const bfScore = calculateScore(bfMeal.nutritionalInfo, slotAllocations[0]!.targets);
          const lScore = calculateScore(lMeal.nutritionalInfo, slotAllocations[1]!.targets);
          const dScore = calculateScore(dMeal.nutritionalInfo, slotAllocations[2]!.targets);
          const total = (bfScore + lScore + dScore) / 3;
          if (total > bruteForceScore) bruteForceScore = total;
        }
      }
    }

    expect(optimizerResult!.totalScore).toBeCloseTo(bruteForceScore, 8);
  });

  it("returns a plan for the full 4-slot fixture catalog", () => {
    const slotAllocations = allocateSlots(maintenanceTargets, DEFAULT_SLOT_PERCENTAGES);
    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", breakfastMeals],
      ["lunch", lunchMeals],
      ["dinner", dinnerMeals],
      ["snack", snackMeals],
    ]);

    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(4);
    expect(result!.totalScore).toBeGreaterThanOrEqual(0);
    expect(result!.totalScore).toBeLessThanOrEqual(1);
  });

  it("totalScore is the average of individual slot scores", () => {
    const slotAllocations = allocateSlots(maintenanceTargets, [
      { slot: "breakfast", percentage: 0.5 },
      { slot: "lunch", percentage: 0.5 },
    ]);
    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", [breakfastMeals[0]!]],
      ["lunch", [lunchMeals[0]!]],
    ]);

    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    const avgScore = result!.items.reduce((s, i) => s + i.score, 0) / result!.items.length;
    expect(result!.totalScore).toBeCloseTo(avgScore, 10);
  });

  it("handles single meal per slot across all 4 default slots", () => {
    const slotAllocations = allocateSlots(maintenanceTargets, DEFAULT_SLOT_PERCENTAGES);
    const mealsBySlot = new Map<MealSlot, Meal[]>([
      ["breakfast", [breakfastMeals[0]!]],
      ["lunch", [lunchMeals[0]!]],
      ["dinner", [dinnerMeals[0]!]],
      ["snack", [snackMeals[0]!]],
    ]);

    const result = findOptimalPlan(slotAllocations, mealsBySlot);
    expect(result).not.toBeNull();
    expect(result!.items).toHaveLength(4);
    // Every slot should have the only available meal
    expect(result!.items.find((i) => i.slot === "breakfast")!.meal.id).toBe(breakfastMeals[0]!.id);
    expect(result!.items.find((i) => i.slot === "lunch")!.meal.id).toBe(lunchMeals[0]!.id);
    expect(result!.items.find((i) => i.slot === "dinner")!.meal.id).toBe(dinnerMeals[0]!.id);
    expect(result!.items.find((i) => i.slot === "snack")!.meal.id).toBe(snackMeals[0]!.id);
  });
});
