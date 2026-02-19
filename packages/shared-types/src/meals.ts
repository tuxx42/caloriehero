import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const allergenSchema = z.enum([
  "dairy",
  "eggs",
  "fish",
  "shellfish",
  "tree_nuts",
  "peanuts",
  "wheat",
  "soy",
  "sesame",
]);

export type Allergen = z.infer<typeof allergenSchema>;

export const dietaryTagSchema = z.enum([
  "vegetarian",
  "vegan",
  "gluten_free",
  "keto",
  "low_carb",
  "high_protein",
  "dairy_free",
  "halal",
]);

export type DietaryTag = z.infer<typeof dietaryTagSchema>;

export const mealCategorySchema = z.enum([
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export type MealCategory = z.infer<typeof mealCategorySchema>;

// ---------------------------------------------------------------------------
// Nutritional info
// ---------------------------------------------------------------------------

export const nutritionalInfoSchema = z.object({
  calories: z
    .number()
    .nonnegative()
    .describe("Total calories in kcal"),
  protein: z
    .number()
    .nonnegative()
    .describe("Protein in grams"),
  carbs: z
    .number()
    .nonnegative()
    .describe("Carbohydrates in grams"),
  fat: z
    .number()
    .nonnegative()
    .describe("Fat in grams"),
  fiber: z
    .number()
    .nonnegative()
    .optional()
    .describe("Dietary fiber in grams"),
  sugar: z
    .number()
    .nonnegative()
    .optional()
    .describe("Sugar in grams"),
});

export type NutritionalInfo = z.infer<typeof nutritionalInfoSchema>;

// ---------------------------------------------------------------------------
// Meal
// ---------------------------------------------------------------------------

export const mealSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).describe("Display name of the meal"),
  description: z.string().describe("Short description shown to customers"),
  category: mealCategorySchema,
  nutritionalInfo: nutritionalInfoSchema,
  servingSize: z.string().describe("Human-readable serving size, e.g. '350g'"),
  price: z.number().positive().describe("Price in the local currency (THB)"),
  allergens: z.array(allergenSchema).describe("List of allergens present in this meal"),
  dietaryTags: z.array(dietaryTagSchema).describe("Dietary classifications for this meal"),
  imageUrl: z.string().url().optional().describe("URL to the meal image"),
  active: z
    .boolean()
    .default(true)
    .describe("Whether the meal is currently available for ordering"),
  posterProductId: z
    .string()
    .optional()
    .describe("Corresponding product ID in the Poster POS system"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Meal = z.infer<typeof mealSchema>;
