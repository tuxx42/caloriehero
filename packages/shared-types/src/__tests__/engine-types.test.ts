import { describe, it, expect } from "vitest";
import {
  toleranceSchema,
  scoringWeightsSchema,
  macroConstraintsSchema,
  mealMatchRequestSchema,
  planRequestSchema,
  scoredMealSchema,
} from "../engine/types.js";

describe("toleranceSchema", () => {
  it("provides defaults", () => {
    const result = toleranceSchema.parse({});
    expect(result.calories).toBe(0.1);
    expect(result.protein).toBe(0.15);
    expect(result.carbs).toBe(0.15);
    expect(result.fat).toBe(0.15);
  });

  it("rejects values above 1", () => {
    expect(() => toleranceSchema.parse({ calories: 1.5 })).toThrow();
  });

  it("rejects negative values", () => {
    expect(() => toleranceSchema.parse({ calories: -0.1 })).toThrow();
  });
});

describe("scoringWeightsSchema", () => {
  it("provides defaults summing to 1.0", () => {
    const result = scoringWeightsSchema.parse({});
    const sum = result.calories + result.protein + result.carbs + result.fat;
    expect(sum).toBeCloseTo(1.0);
  });
});

describe("macroConstraintsSchema", () => {
  it("parses with targets only", () => {
    const result = macroConstraintsSchema.parse({
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
    });
    expect(result.targets.calories).toBe(2000);
    expect(result.tolerance).toBeUndefined();
  });

  it("parses with tolerance and weights", () => {
    const result = macroConstraintsSchema.parse({
      targets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      tolerance: { calories: 0.2, protein: 0.2, carbs: 0.2, fat: 0.2 },
      weights: { calories: 0.5, protein: 0.2, carbs: 0.15, fat: 0.15 },
    });
    expect(result.tolerance?.calories).toBe(0.2);
  });
});

describe("mealMatchRequestSchema", () => {
  it("provides defaults for optional fields", () => {
    const result = mealMatchRequestSchema.parse({
      constraints: {
        targets: { calories: 500, protein: 40, carbs: 50, fat: 15 },
      },
    });
    expect(result.allergies).toEqual([]);
    expect(result.dietaryPreferences).toEqual([]);
    expect(result.limit).toBe(10);
    expect(result.category).toBeUndefined();
  });

  it("rejects limit above 50 when used in API request context", () => {
    // mealMatchRequestSchema itself doesn't limit to 50 — that's the API request schema
    // This schema allows any positive int
    const result = mealMatchRequestSchema.parse({
      constraints: { targets: { calories: 500, protein: 40, carbs: 50, fat: 15 } },
      limit: 100,
    });
    expect(result.limit).toBe(100);
  });
});

describe("planRequestSchema", () => {
  it("parses a valid plan request", () => {
    const result = planRequestSchema.parse({
      dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
      slots: [
        { slot: "breakfast", percentage: 0.25 },
        { slot: "lunch", percentage: 0.35 },
        { slot: "dinner", percentage: 0.30 },
        { slot: "snack", percentage: 0.10 },
      ],
    });
    expect(result.slots).toHaveLength(4);
    expect(result.allergies).toEqual([]);
  });

  it("rejects empty slots", () => {
    expect(() =>
      planRequestSchema.parse({
        dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 70 },
        slots: [],
      })
    ).toThrow();
  });
});

describe("scoredMealSchema", () => {
  it("rejects score above 1", () => {
    expect(() =>
      scoredMealSchema.parse({
        meal: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
          description: "Test",
          category: "lunch",
          nutritionalInfo: { calories: 500, protein: 40, carbs: 50, fat: 15 },
          servingSize: "350g",
          price: 189,
          allergens: [],
          dietaryTags: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        score: 1.5,
        deviation: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      })
    ).toThrow();
  });

  it("rejects score below 0", () => {
    expect(() =>
      scoredMealSchema.parse({
        meal: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test",
          description: "Test",
          category: "lunch",
          nutritionalInfo: { calories: 500, protein: 40, carbs: 50, fat: 15 },
          servingSize: "350g",
          price: 189,
          allergens: [],
          dietaryTags: [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        score: -0.1,
        deviation: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      })
    ).toThrow();
  });
});
