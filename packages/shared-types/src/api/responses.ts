import { z } from "zod";
import { mealSchema } from "../meals.js";
import { userSchema, userProfileSchema } from "../users.js";
import { orderSchema } from "../orders.js";
import { subscriptionSchema } from "../subscriptions.js";
import { mealPlanSchema } from "../meal-plans.js";
import { deliverySlotSchema } from "../delivery.js";
import { scoredMealSchema, planResultSchema } from "../engine/types.js";

// Auth
export const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

// Paginated list
export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });

// Re-export individual response types for convenience
export const mealResponseSchema = mealSchema;
export const mealListResponseSchema = paginatedSchema(mealSchema);
export const userResponseSchema = userSchema;
export const profileResponseSchema = userProfileSchema;
export const orderResponseSchema = orderSchema;
export const orderListResponseSchema = paginatedSchema(orderSchema);
export const subscriptionResponseSchema = subscriptionSchema;
export const subscriptionListResponseSchema = paginatedSchema(subscriptionSchema);
export const mealPlanResponseSchema = mealPlanSchema;
export const matchMealsResponseSchema = z.object({ meals: z.array(scoredMealSchema) });
export const generatePlanResponseSchema = planResultSchema;
export const deliverySlotListResponseSchema = z.array(deliverySlotSchema);

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type MatchMealsResponse = z.infer<typeof matchMealsResponseSchema>;
export type GeneratePlanResponse = z.infer<typeof generatePlanResponseSchema>;
