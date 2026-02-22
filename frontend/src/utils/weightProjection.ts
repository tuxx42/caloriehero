import { calculateTDEE, type BodyStats } from "./tdee";

export interface WeightProjection {
  tdee: number;
  dailyCalories: number;
  dailySurplus: number;
  totalSurplus: number;
  weightChangeKg: number;
  numDays: number;
}

/** 1 kg of body mass ~ 7700 kcal surplus/deficit */
const KCAL_PER_KG = 7700;

export function calculateWeightProjection(
  bodyStats: BodyStats,
  dailyCalories: number,
  numDays: number,
): WeightProjection {
  const tdee = calculateTDEE(bodyStats);
  const dailySurplus = dailyCalories - tdee;
  const totalSurplus = dailySurplus * numDays;
  const weightChangeKg = totalSurplus / KCAL_PER_KG;

  return {
    tdee,
    dailyCalories,
    dailySurplus,
    totalSurplus,
    weightChangeKg,
    numDays,
  };
}
