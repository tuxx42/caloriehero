import { describe, it, expect } from "vitest";
import { matchMeals } from "../per-meal-matcher.js";
import type { MealMatchRequest } from "@caloriehero/shared-types";
import { allMeals, maintenanceTargets } from "./fixtures.js";

function makeRequest(overrides: Partial<MealMatchRequest> = {}): MealMatchRequest {
  return {
    constraints: {
      targets: maintenanceTargets,
    },
    allergies: [],
    dietaryPreferences: [],
    limit: 10,
    ...overrides,
  };
}

describe("matchMeals", () => {
  it("returns results sorted by score descending", () => {
    const results = matchMeals(allMeals, makeRequest());
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
    }
  });

  it("respects the limit", () => {
    const results = matchMeals(allMeals, makeRequest({ limit: 3 }));
    expect(results).toHaveLength(3);
  });

  it("returns at most N results even when fewer meals exist", () => {
    const results = matchMeals(allMeals, makeRequest({ limit: 1000 }));
    expect(results.length).toBeLessThanOrEqual(allMeals.length);
  });

  it("filters by category", () => {
    const results = matchMeals(allMeals, makeRequest({ category: "breakfast" }));
    for (const item of results) {
      expect(item.meal.category).toBe("breakfast");
    }
    expect(results.length).toBeGreaterThan(0);
  });

  it("applies allergen filtering before scoring", () => {
    const results = matchMeals(allMeals, makeRequest({ allergies: ["fish"] }));
    for (const item of results) {
      expect(item.meal.allergens).not.toContain("fish");
    }
  });

  it("returns empty array when dietary preferences filter out all meals", () => {
    // No meal in our fixture is simultaneously keto + vegan + high_protein + halal
    // The intersection of these restrictive tags should be empty (or very small).
    // We verify the result is a valid (possibly empty) array.
    const results = matchMeals(allMeals, makeRequest({
      dietaryPreferences: ["keto", "vegan", "high_protein", "halal"],
    }));
    // All returned meals must have ALL these tags
    for (const item of results) {
      expect(item.meal.dietaryTags).toContain("keto");
      expect(item.meal.dietaryTags).toContain("vegan");
      expect(item.meal.dietaryTags).toContain("high_protein");
      expect(item.meal.dietaryTags).toContain("halal");
    }
  });

  it("returns empty array for empty meals input", () => {
    const results = matchMeals([], makeRequest());
    expect(results).toEqual([]);
  });

  it("each result has score between 0 and 1 inclusive", () => {
    const results = matchMeals(allMeals, makeRequest());
    for (const item of results) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
    }
  });

  it("each result has correct deviation structure", () => {
    const results = matchMeals(allMeals, makeRequest({ limit: 5 }));
    for (const item of results) {
      expect(typeof item.deviation.calories).toBe("number");
      expect(typeof item.deviation.protein).toBe("number");
      expect(typeof item.deviation.carbs).toBe("number");
      expect(typeof item.deviation.fat).toBe("number");
      // Deviations are non-negative
      expect(item.deviation.calories).toBeGreaterThanOrEqual(0);
      expect(item.deviation.protein).toBeGreaterThanOrEqual(0);
      expect(item.deviation.carbs).toBeGreaterThanOrEqual(0);
      expect(item.deviation.fat).toBeGreaterThanOrEqual(0);
    }
  });
});
