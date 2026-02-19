import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const orderStatusSchema = z.enum([
  "pending_payment",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderTypeSchema = z.enum(["on_demand", "subscription"]);

export type OrderType = z.infer<typeof orderTypeSchema>;

// ---------------------------------------------------------------------------
// Order item
// ---------------------------------------------------------------------------

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  mealId: z.string().uuid(),
  mealName: z
    .string()
    .describe("Snapshot of the meal name at the time of ordering"),
  quantity: z
    .number()
    .int()
    .positive()
    .describe("Number of units ordered"),
  unitPrice: z
    .number()
    .nonnegative()
    .describe("Price per unit in THB at the time of ordering"),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------

export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: orderStatusSchema,
  type: orderTypeSchema,
  items: z
    .array(orderItemSchema)
    .min(1)
    .describe("Line items — must have at least one"),
  total: z
    .number()
    .nonnegative()
    .describe("Total order amount in THB"),
  deliverySlotId: z
    .string()
    .uuid()
    .optional()
    .describe("Assigned delivery slot, set when the order is confirmed"),
  deliveryAddress: z
    .string()
    .optional()
    .describe("Delivery address snapshot captured at order time"),
  posterOrderId: z
    .string()
    .optional()
    .describe("Order ID assigned by the Poster POS system"),
  stripePaymentIntentId: z
    .string()
    .optional()
    .describe("Stripe PaymentIntent ID associated with this order"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Order = z.infer<typeof orderSchema>;
