import {
  pgTable,
  uuid,
  varchar,
  real,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { meals } from "./meals.js";

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  totalScore: real("total_score").notNull(),
  actualMacros: jsonb("actual_macros").notNull(),
  targetMacros: jsonb("target_macros").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlanItems = pgTable("meal_plan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => mealPlans.id)
    .notNull(),
  slot: varchar("slot", { length: 20 }).notNull(),
  mealId: uuid("meal_id")
    .references(() => meals.id)
    .notNull(),
  score: real("score").notNull(),
  slotTargets: jsonb("slot_targets").notNull(),
});

export type MealPlanRow = typeof mealPlans.$inferSelect;
export type NewMealPlanRow = typeof mealPlans.$inferInsert;
export type MealPlanItemRow = typeof mealPlanItems.$inferSelect;
export type NewMealPlanItemRow = typeof mealPlanItems.$inferInsert;
