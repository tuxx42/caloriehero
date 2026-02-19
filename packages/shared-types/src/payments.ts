import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const paymentStatusSchema = z.enum([
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const invoiceStatusSchema = z.enum([
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
]);

export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

// ---------------------------------------------------------------------------
// Payment intent
// ---------------------------------------------------------------------------

export const paymentIntentSchema = z.object({
  id: z.string().uuid(),
  stripePaymentIntentId: z
    .string()
    .describe("Stripe PaymentIntent ID (pi_...)"),
  amount: z
    .number()
    .positive()
    .describe("Payment amount in the smallest currency unit (e.g. satang for THB)"),
  currency: z
    .string()
    .default("thb")
    .describe("ISO 4217 currency code, lower-cased"),
  status: paymentStatusSchema,
  orderId: z.string().uuid().describe("The order this payment intent is associated with"),
  createdAt: z.coerce.date(),
});

export type PaymentIntent = z.infer<typeof paymentIntentSchema>;
