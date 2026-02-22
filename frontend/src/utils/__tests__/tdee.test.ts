import { describe, it, expect } from "vitest";
import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  type BodyStats,
} from "../tdee";

const maleStats: BodyStats = {
  weight: 80,
  height: 180,
  age: 30,
  gender: "male",
  activityLevel: "moderate",
};

const femaleStats: BodyStats = {
  weight: 60,
  height: 165,
  age: 25,
  gender: "female",
  activityLevel: "light",
};

describe("calculateBMR", () => {
  it("calculates BMR for male (Mifflin-St Jeor)", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR(maleStats)).toBe(1780);
  });

  it("calculates BMR for female (Mifflin-St Jeor)", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    expect(calculateBMR(femaleStats)).toBe(1345);
  });
});

describe("calculateTDEE", () => {
  it("applies moderate activity multiplier (1.55)", () => {
    // BMR=1780, TDEE=1780*1.55=2759
    expect(calculateTDEE(maleStats)).toBe(2759);
  });

  it("applies light activity multiplier (1.375)", () => {
    // BMR=1345, TDEE=1345*1.375=1849.375 -> 1849
    expect(calculateTDEE(femaleStats)).toBe(1849);
  });

  it("applies sedentary multiplier (1.2)", () => {
    const stats = { ...maleStats, activityLevel: "sedentary" as const };
    // 1780 * 1.2 = 2136
    expect(calculateTDEE(stats)).toBe(2136);
  });

  it("applies very_active multiplier (1.9)", () => {
    const stats = { ...maleStats, activityLevel: "very_active" as const };
    // 1780 * 1.9 = 3382
    expect(calculateTDEE(stats)).toBe(3382);
  });
});

describe("calculateMacros", () => {
  it("returns maintenance macros (no TDEE adjustment)", () => {
    const result = calculateMacros(maleStats, "maintenance");
    // TDEE=2759, no adjustment
    expect(result.calories).toBe(2759);
    // protein: 2759*0.30/4 = 207
    expect(result.protein).toBe(207);
    // carbs: 2759*0.40/4 = 276
    expect(result.carbs).toBe(276);
    // fat: 2759*0.30/9 = 92
    expect(result.fat).toBe(92);
  });

  it("applies cutting deficit (-20%)", () => {
    const result = calculateMacros(maleStats, "cutting");
    // TDEE=2759 * 0.8 = 2207
    expect(result.calories).toBe(2207);
  });

  it("applies bulking surplus (+15%)", () => {
    const result = calculateMacros(maleStats, "bulking");
    // TDEE=2759 * 1.15 = 3173
    expect(result.calories).toBe(3173);
  });

  it("returns keto macros (high fat, very low carb)", () => {
    const result = calculateMacros(maleStats, "keto");
    // TDEE=2759, no adjustment for keto
    expect(result.calories).toBe(2759);
    // carbs: 2759*0.05/4 = 34
    expect(result.carbs).toBe(34);
    // fat: 2759*0.70/9 = 215
    expect(result.fat).toBe(215);
  });
});
