import { describe, it, expect } from "vitest";
import { generateDailyPlan } from "../daily-planner.js";
import { matchMeals } from "../per-meal-matcher.js";
import { generateLargeCatalog, maintenanceTargets } from "./fixtures.js";
import { DEFAULT_SLOT_PERCENTAGES } from "../constants.js";

describe("performance", () => {
  it("generateDailyPlan: 200 meals / 4 slots completes in < 100ms", () => {
    // 200 meals total (50 per category) is the primary benchmark
    const largeCatalog = generateLargeCatalog(200);

    const start = performance.now();
    const result = generateDailyPlan(largeCatalog, {
      dailyTargets: maintenanceTargets,
      slots: DEFAULT_SLOT_PERCENTAGES,
      allergies: [],
      dietaryPreferences: [],
    });
    const elapsed = performance.now() - start;

    expect(result).not.toBeNull();
    expect(elapsed).toBeLessThan(100);
  });

  it("generateDailyPlan: 50 meals / 4 slots completes in < 50ms", () => {
    const catalog = generateLargeCatalog(50);

    const start = performance.now();
    const result = generateDailyPlan(catalog, {
      dailyTargets: maintenanceTargets,
      slots: DEFAULT_SLOT_PERCENTAGES,
      allergies: [],
      dietaryPreferences: [],
    });
    const elapsed = performance.now() - start;

    expect(result).not.toBeNull();
    expect(elapsed).toBeLessThan(50);
  });

  it("matchMeals: 200 meals completes in < 20ms", () => {
    const largeCatalog = generateLargeCatalog(200);

    const start = performance.now();
    const result = matchMeals(largeCatalog, {
      constraints: { targets: maintenanceTargets },
      allergies: [],
      dietaryPreferences: [],
      limit: 10,
    });
    const elapsed = performance.now() - start;

    expect(result.length).toBe(10);
    expect(elapsed).toBeLessThan(20);
  });
});
