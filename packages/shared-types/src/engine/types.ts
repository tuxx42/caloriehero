import { z } from "zod";
import { mealSchema, nutritionalInfoSchema, mealCategorySchema, allergenSchema, dietaryTagSchema } from "../meals.js";
import { macroTargetsSchema } from "../users.js";
import { mealSlotSchema } from "../meal-plans.js";

export const toleranceSchema = z.object({
  calories: z.number().min(0).max(1).default(0.1).describe("Fraction tolerance for calories (0.1 = 10%)"),
  protein: z.number().min(0).max(1).default(0.15),
  carbs: z.number().min(0).max(1).default(0.15),
  fat: z.number().min(0).max(1).default(0.15),
});

export const scoringWeightsSchema = z.object({
  calories: z.number().min(0).default(0.4),
  protein: z.number().min(0).default(0.3),
  carbs: z.number().min(0).default(0.15),
  fat: z.number().min(0).default(0.15),
});

export const macroConstraintsSchema = z.object({
  targets: macroTargetsSchema,
  tolerance: toleranceSchema.optional(),
  weights: scoringWeightsSchema.optional(),
});

export const mealMatchRequestSchema = z.object({
  constraints: macroConstraintsSchema,
  allergies: z.array(allergenSchema).default([]),
  dietaryPreferences: z.array(dietaryTagSchema).default([]),
  category: mealCategorySchema.optional(),
  limit: z.number().int().positive().default(10),
});

export const scoredMealSchema = z.object({
  meal: mealSchema,
  score: z.number().min(0).max(1).describe("0-1 where 1 = perfect macro match"),
  deviation: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

export const slotAllocationSchema = z.object({
  slot: mealSlotSchema,
  percentage: z.number().min(0).max(1).describe("Fraction of daily targets for this slot"),
  targets: macroTargetsSchema,
});

export const planRequestSchema = z.object({
  dailyTargets: macroTargetsSchema,
  slots: z.array(z.object({
    slot: mealSlotSchema,
    percentage: z.number().min(0).max(1),
  })).min(1),
  allergies: z.array(allergenSchema).default([]),
  dietaryPreferences: z.array(dietaryTagSchema).default([]),
  tolerance: toleranceSchema.optional(),
  weights: scoringWeightsSchema.optional(),
});

export const planResultSchema = z.object({
  items: z.array(z.object({
    slot: mealSlotSchema,
    meal: mealSchema,
    score: z.number().min(0).max(1),
    slotTargets: macroTargetsSchema,
  })),
  totalScore: z.number().min(0).max(1),
  actualMacros: nutritionalInfoSchema,
  targetMacros: macroTargetsSchema,
});

export type Tolerance = z.infer<typeof toleranceSchema>;
export type ScoringWeights = z.infer<typeof scoringWeightsSchema>;
export type MacroConstraints = z.infer<typeof macroConstraintsSchema>;
export type MealMatchRequest = z.infer<typeof mealMatchRequestSchema>;
export type ScoredMeal = z.infer<typeof scoredMealSchema>;
export type SlotAllocation = z.infer<typeof slotAllocationSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;
export type PlanResult = z.infer<typeof planResultSchema>;
