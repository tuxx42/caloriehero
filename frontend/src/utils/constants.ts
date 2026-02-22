import type { ActivityLevel, FitnessGoal } from "./tdee";

export const FITNESS_GOALS: Array<{ value: FitnessGoal; label: string; description: string }> = [
  { value: "maintenance", label: "Maintenance", description: "Keep your current weight" },
  { value: "cutting", label: "Cutting", description: "Lose fat, preserve muscle" },
  { value: "bulking", label: "Bulking", description: "Gain muscle mass" },
  { value: "keto", label: "Keto", description: "High fat, very low carb" },
];

export const ACTIVITY_LEVELS: Array<{ value: ActivityLevel; label: string; description: string }> = [
  { value: "sedentary", label: "Sedentary", description: "Little or no exercise" },
  { value: "light", label: "Lightly Active", description: "1-3 days/week" },
  { value: "moderate", label: "Moderately Active", description: "3-5 days/week" },
  { value: "active", label: "Very Active", description: "6-7 days/week" },
  { value: "very_active", label: "Extra Active", description: "Intense daily training" },
];

export const ALLERGEN_OPTIONS = [
  "dairy", "eggs", "fish", "shellfish", "tree_nuts",
  "peanuts", "wheat", "soy", "sesame", "gluten",
] as const;

export const DIETARY_OPTIONS = [
  "vegetarian", "vegan", "keto", "high_protein",
  "low_carb", "gluten_free", "dairy_free",
] as const;

export const DEFAULT_MACROS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
} as const;
