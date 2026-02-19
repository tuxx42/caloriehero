import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  schedule: jsonb("schedule").notNull(),
  macroTargets: jsonb("macro_targets").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  pausedAt: timestamp("paused_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type NewSubscriptionRow = typeof subscriptions.$inferInsert;
