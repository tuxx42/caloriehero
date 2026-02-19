import { z } from "zod";
import { macroTargetsSchema } from "./users.js";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const subscriptionStatusSchema = z.enum([
  "active",
  "paused",
  "cancelled",
  "past_due",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const deliveryDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export type DeliveryDay = z.infer<typeof deliveryDaySchema>;

// ---------------------------------------------------------------------------
// Delivery schedule
// ---------------------------------------------------------------------------

export const deliveryScheduleSchema = z.object({
  days: z
    .array(deliveryDaySchema)
    .min(1)
    .describe("Days of the week on which deliveries should occur"),
  timeSlot: z
    .string()
    .describe("Preferred delivery time slot identifier, e.g. 'morning' or '08:00-10:00'"),
  mealsPerDay: z
    .number()
    .int()
    .positive()
    .default(3)
    .describe("Number of meals to deliver each scheduled day"),
});

export type DeliverySchedule = z.infer<typeof deliveryScheduleSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: subscriptionStatusSchema,
  stripeSubscriptionId: z
    .string()
    .describe("Stripe Subscription object ID (sub_...)"),
  schedule: deliveryScheduleSchema,
  macroTargets: macroTargetsSchema.describe(
    "Macro targets in effect for this subscription's meal plans"
  ),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  pausedAt: z
    .coerce.date()
    .optional()
    .describe("Timestamp when the subscription was paused, if applicable"),
  cancelledAt: z
    .coerce.date()
    .optional()
    .describe("Timestamp when the subscription was cancelled, if applicable"),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
