import { z } from "zod";

// ---------------------------------------------------------------------------
// Poster POS — product
// ---------------------------------------------------------------------------

export const posterProductSchema = z.object({
  productId: z.string().describe("Poster internal product ID"),
  name: z.string(),
  price: z
    .number()
    .describe("Product price as returned by the Poster API"),
  categoryId: z
    .string()
    .optional()
    .describe("Poster category ID this product belongs to"),
});

export type PosterProduct = z.infer<typeof posterProductSchema>;

// ---------------------------------------------------------------------------
// Poster POS — order status enum
// ---------------------------------------------------------------------------

export const posterOrderStatusSchema = z.enum([
  "new",
  "accepted",
  "ready",
  "closed",
]);

export type PosterOrderStatus = z.infer<typeof posterOrderStatusSchema>;

// ---------------------------------------------------------------------------
// Poster POS — order
// ---------------------------------------------------------------------------

const posterOrderProductSchema = z.object({
  productId: z.string().describe("Poster product ID"),
  count: z.number().describe("Quantity of this product in the order"),
  price: z.number().describe("Unit price as recorded in the Poster order"),
});

export const posterOrderSchema = z.object({
  incomingOrderId: z
    .string()
    .describe("Poster's own identifier for the incoming order"),
  status: z
    .string()
    .describe("Raw status string returned by the Poster API"),
  products: z
    .array(posterOrderProductSchema)
    .describe("Line items included in this Poster order"),
});

export type PosterOrder = z.infer<typeof posterOrderSchema>;
