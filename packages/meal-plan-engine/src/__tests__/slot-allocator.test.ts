import { describe, it, expect } from "vitest";
import { allocateSlots } from "../slot-allocator.js";
import { DEFAULT_SLOT_PERCENTAGES } from "../constants.js";
import type { MacroTargets } from "@caloriehero/shared-types";

const dailyTargets: MacroTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

describe("allocateSlots", () => {
  it("distributes macros proportionally across default slots", () => {
    const allocations = allocateSlots(dailyTargets, DEFAULT_SLOT_PERCENTAGES);
    expect(allocations).toHaveLength(4);

    const breakfast = allocations.find((a) => a.slot === "breakfast")!;
    expect(breakfast.percentage).toBe(0.25);
    expect(breakfast.targets.calories).toBeCloseTo(500, 1);
    expect(breakfast.targets.protein).toBeCloseTo(37.5, 1);
  });

  it("allocated macros sum to daily targets (rounding is corrected)", () => {
    const allocations = allocateSlots(dailyTargets, DEFAULT_SLOT_PERCENTAGES);

    const totalCalories = allocations.reduce((s, a) => s + a.targets.calories, 0);
    const totalProtein = allocations.reduce((s, a) => s + a.targets.protein, 0);
    const totalCarbs = allocations.reduce((s, a) => s + a.targets.carbs, 0);
    const totalFat = allocations.reduce((s, a) => s + a.targets.fat, 0);

    expect(totalCalories).toBeCloseTo(dailyTargets.calories, 1);
    expect(totalProtein).toBeCloseTo(dailyTargets.protein, 1);
    expect(totalCarbs).toBeCloseTo(dailyTargets.carbs, 1);
    expect(totalFat).toBeCloseTo(dailyTargets.fat, 1);
  });

  it("single slot at 100% gets all daily targets", () => {
    const allocations = allocateSlots(dailyTargets, [{ slot: "lunch", percentage: 1.0 }]);
    expect(allocations).toHaveLength(1);
    expect(allocations[0]!.targets.calories).toBeCloseTo(dailyTargets.calories, 1);
    expect(allocations[0]!.targets.protein).toBeCloseTo(dailyTargets.protein, 1);
    expect(allocations[0]!.targets.carbs).toBeCloseTo(dailyTargets.carbs, 1);
    expect(allocations[0]!.targets.fat).toBeCloseTo(dailyTargets.fat, 1);
  });

  it("throws when percentages do not sum to ~1.0", () => {
    expect(() =>
      allocateSlots(dailyTargets, [
        { slot: "breakfast", percentage: 0.25 },
        { slot: "lunch", percentage: 0.25 }, // sum = 0.5
      ])
    ).toThrow();
  });

  it("allocates lunch slot at 35% correctly", () => {
    const allocations = allocateSlots(dailyTargets, DEFAULT_SLOT_PERCENTAGES);
    const lunch = allocations.find((a) => a.slot === "lunch")!;
    expect(lunch.percentage).toBe(0.35);
    expect(lunch.targets.calories).toBeCloseTo(700, 1);
    expect(lunch.targets.protein).toBeCloseTo(52.5, 1);
    expect(lunch.targets.carbs).toBeCloseTo(70, 1);
    expect(lunch.targets.fat).toBeCloseTo(22.75, 1);
  });

  it("two equal slots each get 50% of daily targets", () => {
    const slots = [
      { slot: "lunch" as const, percentage: 0.5 },
      { slot: "dinner" as const, percentage: 0.5 },
    ];
    const allocations = allocateSlots(dailyTargets, slots);
    expect(allocations[0]!.targets.calories).toBeCloseTo(1000, 1);
    expect(allocations[1]!.targets.calories).toBeCloseTo(1000, 1);
    const total = allocations.reduce((s, a) => s + a.targets.calories, 0);
    expect(total).toBeCloseTo(dailyTargets.calories, 1);
  });
});
