import { z } from "zod";
import { mealCategorySchema, allergenSchema, dietaryTagSchema, nutritionalInfoSchema } from "../meals.js";
import { fitnessGoalSchema, macroTargetsSchema } from "../users.js";
import { mealSlotSchema } from "../meal-plans.js";
import { deliveryDaySchema } from "../subscriptions.js";

// Auth
export const googleAuthRequestSchema = z.object({
  idToken: z.string().min(1),
});

// Meals (admin)
export const createMealRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string(),
  category: mealCategorySchema,
  nutritionalInfo: nutritionalInfoSchema,
  servingSize: z.string(),
  price: z.number().positive(),
  allergens: z.array(allergenSchema).default([]),
  dietaryTags: z.array(dietaryTagSchema).default([]),
  imageUrl: z.string().url().optional(),
  posterProductId: z.string().optional(),
});

export const updateMealRequestSchema = createMealRequestSchema.partial();

// User profile
export const updateProfileRequestSchema = z.object({
  macroTargets: macroTargetsSchema.optional(),
  fitnessGoal: fitnessGoalSchema.optional(),
  allergies: z.array(allergenSchema).optional(),
  dietaryPreferences: z.array(dietaryTagSchema).optional(),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
});

// Matching
export const matchMealsRequestSchema = z.object({
  category: mealCategorySchema.optional(),
  limit: z.number().int().positive().max(50).default(10),
});

export const generatePlanRequestSchema = z.object({
  date: z.string(),
  slots: z.array(z.object({
    slot: mealSlotSchema,
    percentage: z.number().min(0).max(1),
  })).min(1).optional(),
});

// Orders
export const createOrderRequestSchema = z.object({
  items: z.array(z.object({
    mealId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  deliverySlotId: z.string().uuid().optional(),
  deliveryAddress: z.string().optional(),
});

// Subscriptions
export const createSubscriptionRequestSchema = z.object({
  schedule: z.object({
    days: z.array(deliveryDaySchema).min(1),
    timeSlot: z.string(),
    mealsPerDay: z.number().int().positive().default(3),
  }),
  macroTargets: macroTargetsSchema,
});

export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;
export type CreateMealRequest = z.infer<typeof createMealRequestSchema>;
export type UpdateMealRequest = z.infer<typeof updateMealRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type MatchMealsRequest = z.infer<typeof matchMealsRequestSchema>;
export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionRequestSchema>;
