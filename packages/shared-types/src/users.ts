import { z } from "zod";
import { allergenSchema, dietaryTagSchema } from "./meals.js";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const fitnessGoalSchema = z.enum([
  "lose_weight",
  "maintain",
  "gain_muscle",
  "bulk",
  "cut",
]);

export type FitnessGoal = z.infer<typeof fitnessGoalSchema>;

// ---------------------------------------------------------------------------
// Macro targets
// ---------------------------------------------------------------------------

export const macroTargetsSchema = z.object({
  calories: z.number().positive().describe("Daily calorie target in kcal"),
  protein: z.number().nonnegative().describe("Daily protein target in grams"),
  carbs: z.number().nonnegative().describe("Daily carbohydrate target in grams"),
  fat: z.number().nonnegative().describe("Daily fat target in grams"),
});

export type MacroTargets = z.infer<typeof macroTargetsSchema>;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  id: z.string().uuid(),
  googleId: z.string().describe("Subject claim from the Google ID token"),
  email: z.string().email(),
  name: z.string(),
  isAdmin: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export const userProfileSchema = z.object({
  userId: z.string().uuid(),
  macroTargets: macroTargetsSchema,
  fitnessGoal: fitnessGoalSchema,
  allergies: z
    .array(allergenSchema)
    .describe("Allergens the user must avoid"),
  dietaryPreferences: z
    .array(dietaryTagSchema)
    .describe("Dietary tags the user prefers"),
  deliveryAddress: z
    .string()
    .optional()
    .describe("Default delivery address as a human-readable string"),
  deliveryLat: z
    .number()
    .optional()
    .describe("Latitude of the default delivery address"),
  deliveryLng: z
    .number()
    .optional()
    .describe("Longitude of the default delivery address"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
