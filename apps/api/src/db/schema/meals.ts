import {
  pgTable,
  uuid,
  varchar,
  text,
  real,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const meals = pgTable("meals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  sugar: real("sugar"),
  servingSize: varchar("serving_size", { length: 50 }).notNull(),
  price: real("price").notNull(),
  allergens: jsonb("allergens").default([]).notNull(),
  dietaryTags: jsonb("dietary_tags").default([]).notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").default(true).notNull(),
  posterProductId: varchar("poster_product_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MealRow = typeof meals.$inferSelect;
export type NewMealRow = typeof meals.$inferInsert;
