import { describe, it, expect } from "vitest";
import { mealSchema, nutritionalInfoSchema, allergenSchema, dietaryTagSchema, mealCategorySchema } from "../meals.js";

const validMeal = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Grilled Chicken Breast",
  description: "Lean grilled chicken with steamed vegetables",
  category: "lunch" as const,
  nutritionalInfo: { calories: 450, protein: 42, carbs: 20, fat: 12 },
  servingSize: "350g",
  price: 189,
  allergens: [],
  dietaryTags: ["high_protein", "gluten_free"] as const,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

describe("mealSchema", () => {
  it("parses a valid meal", () => {
    const result = mealSchema.parse(validMeal);
    expect(result.name).toBe("Grilled Chicken Breast");
    expect(result.active).toBe(true); // default
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("rejects empty name", () => {
    expect(() => mealSchema.parse({ ...validMeal, name: "" })).toThrow();
  });

  it("rejects negative price", () => {
    expect(() => mealSchema.parse({ ...validMeal, price: -10 })).toThrow();
  });

  it("rejects zero price", () => {
    expect(() => mealSchema.parse({ ...validMeal, price: 0 })).toThrow();
  });

  it("accepts optional imageUrl when valid", () => {
    const result = mealSchema.parse({ ...validMeal, imageUrl: "https://example.com/chicken.jpg" });
    expect(result.imageUrl).toBe("https://example.com/chicken.jpg");
  });

  it("rejects invalid imageUrl", () => {
    expect(() => mealSchema.parse({ ...validMeal, imageUrl: "not-a-url" })).toThrow();
  });

  it("strips unknown fields", () => {
    const result = mealSchema.parse({ ...validMeal, unknown: "field" });
    expect("unknown" in result).toBe(false);
  });
});

describe("nutritionalInfoSchema", () => {
  it("parses valid nutritional info", () => {
    const result = nutritionalInfoSchema.parse({ calories: 500, protein: 40, carbs: 50, fat: 15 });
    expect(result.calories).toBe(500);
  });

  it("accepts zero values", () => {
    const result = nutritionalInfoSchema.parse({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    expect(result.calories).toBe(0);
  });

  it("rejects negative calories", () => {
    expect(() => nutritionalInfoSchema.parse({ calories: -1, protein: 0, carbs: 0, fat: 0 })).toThrow();
  });

  it("accepts optional fiber and sugar", () => {
    const result = nutritionalInfoSchema.parse({ calories: 300, protein: 25, carbs: 30, fat: 10, fiber: 5, sugar: 3 });
    expect(result.fiber).toBe(5);
    expect(result.sugar).toBe(3);
  });
});

describe("enum schemas", () => {
  it("allergenSchema accepts all valid values", () => {
    const allergens = ["dairy", "eggs", "fish", "shellfish", "tree_nuts", "peanuts", "wheat", "soy", "sesame"];
    for (const a of allergens) {
      expect(allergenSchema.parse(a)).toBe(a);
    }
  });

  it("allergenSchema rejects unknown values", () => {
    expect(() => allergenSchema.parse("corn")).toThrow();
  });

  it("dietaryTagSchema rejects unknown values", () => {
    expect(() => dietaryTagSchema.parse("paleo")).toThrow();
  });

  it("mealCategorySchema has 4 categories", () => {
    expect(mealCategorySchema.options).toHaveLength(4);
  });
});
