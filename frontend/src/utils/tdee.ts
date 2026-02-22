export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type FitnessGoal = "maintenance" | "cutting" | "bulking" | "keto";

export interface BodyStats {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface MacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Protein/Carbs/Fat splits as percentages of total calories
const MACRO_SPLITS: Record<FitnessGoal, [number, number, number]> = {
  maintenance: [30, 40, 30],
  cutting: [35, 35, 30],
  bulking: [25, 50, 25],
  keto: [25, 5, 70],
};

/** Mifflin-St Jeor BMR (kcal/day) */
export function calculateBMR(stats: BodyStats): number {
  const base = 10 * stats.weight + 6.25 * stats.height - 5 * stats.age;
  return Math.round(stats.gender === "male" ? base + 5 : base - 161);
}

/** TDEE = BMR * activity multiplier */
export function calculateTDEE(stats: BodyStats): number {
  const bmr = calculateBMR(stats);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[stats.activityLevel]);
}

/** Full macro targets based on TDEE + fitness goal */
export function calculateMacros(
  stats: BodyStats,
  goal: FitnessGoal,
): MacroResult {
  let tdee = calculateTDEE(stats);

  // Adjust TDEE for goal
  if (goal === "cutting") tdee = Math.round(tdee * 0.8); // -20%
  if (goal === "bulking") tdee = Math.round(tdee * 1.15); // +15%

  const [protPct, carbPct, fatPct] = MACRO_SPLITS[goal];

  return {
    calories: tdee,
    protein: Math.round((tdee * (protPct / 100)) / 4), // 4 cal/g
    carbs: Math.round((tdee * (carbPct / 100)) / 4), // 4 cal/g
    fat: Math.round((tdee * (fatPct / 100)) / 9), // 9 cal/g
  };
}
