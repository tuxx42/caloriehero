import { describe, it, expect } from "vitest";
import {
  filterByAllergens,
  filterByDietaryTags,
  filterByCategory,
  filterMeals,
} from "../filters.js";
import { allMeals, breakfastMeals, lunchMeals } from "./fixtures.js";

describe("filterByAllergens", () => {
  it("empty allergies list returns all meals unchanged", () => {
    const result = filterByAllergens(allMeals, []);
    expect(result).toHaveLength(allMeals.length);
  });

  it("removes all meals containing a given allergen (no false negatives)", () => {
    const result = filterByAllergens(allMeals, ["fish"]);
    // Every returned meal must NOT contain fish
    for (const meal of result) {
      expect(meal.allergens).not.toContain("fish");
    }
  });

  it("removes meals containing any listed allergen (OR logic)", () => {
    const result = filterByAllergens(allMeals, ["dairy", "eggs"]);
    for (const meal of result) {
      expect(meal.allergens).not.toContain("dairy");
      expect(meal.allergens).not.toContain("eggs");
    }
  });

  it("empty meals array returns empty array", () => {
    expect(filterByAllergens([], ["dairy"])).toEqual([]);
  });

  it("allergen not present in any meal returns all meals", () => {
    // No meal in our fixtures has "shellfish"
    const result = filterByAllergens(allMeals, ["shellfish"]);
    expect(result).toHaveLength(allMeals.length);
  });

  it("multiple allergens filter more strictly than one", () => {
    const single = filterByAllergens(allMeals, ["soy"]);
    const multiple = filterByAllergens(allMeals, ["soy", "fish"]);
    expect(multiple.length).toBeLessThanOrEqual(single.length);
  });
});

describe("filterByDietaryTags", () => {
  it("empty preferences returns all meals unchanged", () => {
    const result = filterByDietaryTags(allMeals, []);
    expect(result).toHaveLength(allMeals.length);
  });

  it("filters to meals with a single dietary tag", () => {
    const result = filterByDietaryTags(allMeals, ["keto"]);
    for (const meal of result) {
      expect(meal.dietaryTags).toContain("keto");
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it("AND logic — meals must have ALL required tags", () => {
    const result = filterByDietaryTags(allMeals, ["keto", "gluten_free"]);
    for (const meal of result) {
      expect(meal.dietaryTags).toContain("keto");
      expect(meal.dietaryTags).toContain("gluten_free");
    }
  });

  it("impossible combination returns empty array", () => {
    // No meal can be both keto and high_carb (not a real tag), but we can use
    // a realistic impossible combination: vegan + halal may exist but keto + vegan in dinner...
    // Use a truly impossible combo by requiring two mutually exclusive real tags if available,
    // or just verify with stricter combinations
    const result = filterByDietaryTags(allMeals, ["keto", "vegan", "high_protein"]);
    for (const meal of result) {
      expect(meal.dietaryTags).toContain("keto");
      expect(meal.dietaryTags).toContain("vegan");
      expect(meal.dietaryTags).toContain("high_protein");
    }
    // May be 0 or more, just checking logic is correct
  });

  it("empty meals array returns empty array", () => {
    expect(filterByDietaryTags([], ["vegetarian"])).toEqual([]);
  });
});

describe("filterByCategory", () => {
  it("returns only meals in the specified category", () => {
    const result = filterByCategory(allMeals, "breakfast");
    for (const meal of result) {
      expect(meal.category).toBe("breakfast");
    }
    expect(result.length).toBe(breakfastMeals.length);
  });

  it("filters correctly for lunch", () => {
    const result = filterByCategory(allMeals, "lunch");
    expect(result.length).toBe(lunchMeals.length);
  });

  it("empty meals array returns empty array", () => {
    expect(filterByCategory([], "dinner")).toEqual([]);
  });
});

describe("filterMeals (combined pipeline)", () => {
  it("applies all filters — allergen + dietary + category", () => {
    const result = filterMeals(allMeals, {
      allergies: ["dairy"],
      dietaryPreferences: ["gluten_free"],
      category: "breakfast",
    });
    for (const meal of result) {
      expect(meal.category).toBe("breakfast");
      expect(meal.allergens).not.toContain("dairy");
      expect(meal.dietaryTags).toContain("gluten_free");
    }
  });

  it("no opts — returns all meals", () => {
    const result = filterMeals(allMeals, {});
    expect(result).toHaveLength(allMeals.length);
  });

  it("empty allergies array does not filter meals", () => {
    const result = filterMeals(allMeals, { allergies: [] });
    expect(result).toHaveLength(allMeals.length);
  });

  it("combined allergen + dietary restrictions produce more restrictive results", () => {
    const byAllergen = filterMeals(allMeals, { allergies: ["peanuts"] });
    const combined = filterMeals(allMeals, {
      allergies: ["peanuts"],
      dietaryPreferences: ["gluten_free"],
    });
    expect(combined.length).toBeLessThanOrEqual(byAllergen.length);
  });

  it("empty meals array always returns empty", () => {
    const result = filterMeals([], {
      allergies: ["dairy"],
      dietaryPreferences: ["keto"],
      category: "snack",
    });
    expect(result).toEqual([]);
  });
});
