import {
  pgTable,
  uuid,
  varchar,
  text,
  real,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { meals } from "./meals.js";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending_payment"),
  type: varchar("type", { length: 20 }).notNull(),
  total: real("total").notNull(),
  deliverySlotId: uuid("delivery_slot_id"),
  deliveryAddress: text("delivery_address"),
  posterOrderId: varchar("poster_order_id", { length: 100 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  mealId: uuid("meal_id")
    .references(() => meals.id)
    .notNull(),
  mealName: varchar("meal_name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
});

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type NewOrderItemRow = typeof orderItems.$inferInsert;
