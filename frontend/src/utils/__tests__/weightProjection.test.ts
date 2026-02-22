import { describe, it, expect } from "vitest";
import { calculateWeightProjection } from "../weightProjection";
import type { BodyStats } from "../tdee";

const baseStats: BodyStats = {
  weight: 80,
  height: 180,
  age: 30,
  gender: "male",
  activityLevel: "moderate",
};

describe("calculateWeightProjection", () => {
  it("projects weight loss for caloric deficit", () => {
    // TDEE for these stats: BMR = 10*80 + 6.25*180 - 5*30 + 5 = 1780
    // TDEE = 1780 * 1.55 = 2759
    const result = calculateWeightProjection(baseStats, 2000, 7);
    expect(result.tdee).toBe(2759);
    expect(result.dailySurplus).toBe(2000 - 2759);
    expect(result.dailySurplus).toBeLessThan(0);
    expect(result.weightChangeKg).toBeLessThan(0);
    expect(result.numDays).toBe(7);
    // -759 * 7 / 7700 ≈ -0.69
    expect(result.weightChangeKg).toBeCloseTo(-0.69, 1);
  });

  it("projects weight gain for caloric surplus", () => {
    const result = calculateWeightProjection(baseStats, 3500, 14);
    expect(result.dailySurplus).toBe(3500 - 2759);
    expect(result.dailySurplus).toBeGreaterThan(0);
    expect(result.weightChangeKg).toBeGreaterThan(0);
    // 741 * 14 / 7700 ≈ 1.35
    expect(result.weightChangeKg).toBeCloseTo(1.35, 1);
  });

  it("projects zero change for maintenance calories", () => {
    const result = calculateWeightProjection(baseStats, 2759, 30);
    expect(result.dailySurplus).toBe(0);
    expect(result.weightChangeKg).toBe(0);
    expect(result.totalSurplus).toBe(0);
  });

  it("works for single-day plan", () => {
    const result = calculateWeightProjection(baseStats, 2200, 1);
    expect(result.numDays).toBe(1);
    expect(result.totalSurplus).toBe(result.dailySurplus);
    expect(result.weightChangeKg).toBeCloseTo(result.dailySurplus / 7700, 4);
  });
});
