import { describe, it, expect } from "vitest";
import { calculateScore, calculateDeviation } from "../scoring.js";
import type { NutritionalInfo, MacroTargets, ScoringWeights } from "@caloriehero/shared-types";

// ---------------------------------------------------------------------------
// calculateDeviation
// ---------------------------------------------------------------------------

describe("calculateDeviation", () => {
  it("returns zero deviation for perfect match", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const dev = calculateDeviation(nutritionalInfo, target);
    expect(dev.calories).toBe(0);
    expect(dev.protein).toBe(0);
    expect(dev.carbs).toBe(0);
    expect(dev.fat).toBe(0);
  });

  it("returns absolute deviation (not signed)", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 400, protein: 30, carbs: 40, fat: 10 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const dev = calculateDeviation(nutritionalInfo, target);
    expect(dev.calories).toBe(100);
    expect(dev.protein).toBe(10);
    expect(dev.carbs).toBe(10);
    expect(dev.fat).toBe(5);
  });

  it("handles actual > target (deviation is still positive)", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 600, protein: 50, carbs: 60, fat: 20 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const dev = calculateDeviation(nutritionalInfo, target);
    expect(dev.calories).toBe(100);
    expect(dev.protein).toBe(10);
    expect(dev.carbs).toBe(10);
    expect(dev.fat).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// calculateScore
// ---------------------------------------------------------------------------

describe("calculateScore", () => {
  it("returns 1.0 for a perfect macro match", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    expect(calculateScore(nutritionalInfo, target)).toBe(1.0);
  });

  it("returns 0.0 when all macros are 100% off", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 1000, protein: 80, carbs: 100, fat: 30 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    // Each macro is 100% off → each macro score = 0
    expect(calculateScore(nutritionalInfo, target)).toBe(0.0);
  });

  it("returns value in [0, 1] for any input", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 300, protein: 20, carbs: 80, fat: 5 };
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 15 };
    const score = calculateScore(nutritionalInfo, target);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("shows proportional degradation — 50% off target reduces score", () => {
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 20 };

    // Perfect match
    const perfect: NutritionalInfo = { calories: 500, protein: 40, carbs: 50, fat: 20 };
    const perfScore = calculateScore(perfect, target);

    // 50% off on calories (the highest-weighted macro)
    const offByHalf: NutritionalInfo = { calories: 750, protein: 40, carbs: 50, fat: 20 };
    const halfScore = calculateScore(offByHalf, target);

    expect(perfScore).toBe(1.0);
    expect(halfScore).toBeLessThan(perfScore);
    // Calories weight = 0.4, each macro score = 1 except calories = 0.5
    // weighted = (0.5 * 0.4 + 1 * 0.3 + 1 * 0.15 + 1 * 0.15) / 1.0 = (0.2 + 0.3 + 0.15 + 0.15) = 0.8
    expect(halfScore).toBeCloseTo(0.8, 5);
  });

  it("scoring weights affect the final score", () => {
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 20 };
    const nutritionalInfo: NutritionalInfo = { calories: 250, protein: 40, carbs: 50, fat: 20 };
    // calories is 50% off, protein/carbs/fat are perfect

    const defaultScore = calculateScore(nutritionalInfo, target);
    // With default weights (calories=0.4), calories pulls score down significantly

    const caloriesHeavyWeights: ScoringWeights = { calories: 0.9, protein: 0.1, carbs: 0.0, fat: 0.0 };
    const heavyScore = calculateScore(nutritionalInfo, target, caloriesHeavyWeights);

    const caloriesLightWeights: ScoringWeights = { calories: 0.1, protein: 0.9, carbs: 0.0, fat: 0.0 };
    const lightScore = calculateScore(nutritionalInfo, target, caloriesLightWeights);

    // Heavy calories weighting should penalize more
    expect(heavyScore).toBeLessThan(defaultScore);
    // Light calories weighting (protein is perfect) → high score
    expect(lightScore).toBeGreaterThan(defaultScore);
  });

  it("handles zero target with zero actual — scores 1.0 for that macro", () => {
    const nutritionalInfo: NutritionalInfo = { calories: 500, protein: 0, carbs: 50, fat: 0 };
    const target: MacroTargets = { calories: 500, protein: 0, carbs: 50, fat: 0 };
    // All matched including the zeros
    expect(calculateScore(nutritionalInfo, target)).toBe(1.0);
  });

  it("handles zero target with non-zero actual — scores 0.0 for that macro", () => {
    const target: MacroTargets = { calories: 500, protein: 0, carbs: 50, fat: 0 };
    // protein=0 target but actual has 40g protein → macro score for protein = 0
    const nutritionalInfo: NutritionalInfo = { calories: 500, protein: 40, carbs: 50, fat: 0 };
    const score = calculateScore(nutritionalInfo, target);
    // protein weight = 0.3, that component is penalised to 0
    // (1.0 * 0.4 + 0.0 * 0.3 + 1.0 * 0.15 + 1.0 * 0.15) = 0.7
    expect(score).toBeCloseTo(0.7, 5);
  });

  it("all zero nutritional info against zero target → 1.0", () => {
    // All targets are zero and all actuals are zero — all macros match perfectly
    // Note: calories must be positive per MacroTargets schema, so we use calories > 0
    const target: MacroTargets = { calories: 1, protein: 0, carbs: 0, fat: 0 };
    const nutritionalInfo: NutritionalInfo = { calories: 1, protein: 0, carbs: 0, fat: 0 };
    expect(calculateScore(nutritionalInfo, target)).toBe(1.0);
  });

  it("score degrades smoothly as deviation increases", () => {
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 20 };

    const score10 = calculateScore({ calories: 550, protein: 40, carbs: 50, fat: 20 }, target);
    const score50 = calculateScore({ calories: 750, protein: 40, carbs: 50, fat: 20 }, target);
    const score100 = calculateScore({ calories: 1000, protein: 40, carbs: 50, fat: 20 }, target);

    expect(score10).toBeGreaterThan(score50);
    expect(score50).toBeGreaterThan(score100);
  });

  it("symmetric: scoring below target same as above by same amount", () => {
    const target: MacroTargets = { calories: 500, protein: 40, carbs: 50, fat: 20 };
    const above: NutritionalInfo = { calories: 600, protein: 40, carbs: 50, fat: 20 };
    const below: NutritionalInfo = { calories: 400, protein: 40, carbs: 50, fat: 20 };
    expect(calculateScore(above, target)).toBeCloseTo(calculateScore(below, target), 10);
  });
});
