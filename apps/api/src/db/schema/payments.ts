import {
  pgTable,
  uuid,
  varchar,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { orders } from "./orders.js";

export const paymentIntents = pgTable("payment_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 })
    .unique()
    .notNull(),
  amount: real("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("thb"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PaymentIntentRow = typeof paymentIntents.$inferSelect;
export type NewPaymentIntentRow = typeof paymentIntents.$inferInsert;
