import { z } from "zod";
import { nutritionalInfoSchema } from "./meals.js";
import { macroTargetsSchema } from "./users.js";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// Same values as mealCategorySchema — kept as a separate schema so that
// meal-plan logic can evolve independently of the meal catalogue enum.
export const mealSlotSchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export type MealSlot = z.infer<typeof mealSlotSchema>;

// ---------------------------------------------------------------------------
// Meal plan item
// ---------------------------------------------------------------------------

export const mealPlanItemSchema = z.object({
  mealId: z.string().uuid(),
  mealName: z
    .string()
    .describe("Snapshot of the meal name at the time the plan was generated"),
  slot: mealSlotSchema,
  score: z
    .number()
    .min(0)
    .max(1)
    .describe("Macro-match score for this item in context of the plan (0–1)"),
  nutritionalInfo: nutritionalInfoSchema,
});

export type MealPlanItem = z.infer<typeof mealPlanItemSchema>;

// ---------------------------------------------------------------------------
// Meal plan
// ---------------------------------------------------------------------------

export const mealPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid ISO date string (YYYY-MM-DD)")
    .describe("The calendar date this plan applies to"),
  items: z.array(mealPlanItemSchema),
  totalScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Aggregate macro-match score for the full day (0–1)"),
  targetMacros: macroTargetsSchema.describe(
    "Macro targets the plan was optimised against"
  ),
  actualMacros: nutritionalInfoSchema.describe(
    "Sum of nutritional info across all items in the plan"
  ),
  createdAt: z.coerce.date(),
});

export type MealPlan = z.infer<typeof mealPlanSchema>;
